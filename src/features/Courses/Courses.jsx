import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  ExternalLink,
  BookOpen,
  FolderOpen,
  FileText,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { toggleSelectionId, toggleSelectAll, softArchiveByIds, restoreByIds, hardDeleteByIds } from '../../utils/entityOps';
import { courseCompletedNotification } from '../../utils/notificationBuilders';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { useReminders } from '../../context/ReminderContext';

// Sub-components
import CourseItem from './components/CourseItem';
import CourseFilter from './components/CourseFilter';
import CourseForm from './components/CourseForm';
import ConfirmModal from '../../components/ConfirmModal';
import BulkActionBar from '../../components/BulkActionBar';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

const Courses = () => {
  // 1. State Management
  const [courses, setCourses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [resources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const { addNotification } = useReminders();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseForResources, setSelectedCourseForResources] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'title' | 'progress' | 'platform'
  const [editingCourse, setEditingCourse] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '', title: '' });

  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkStatus, setBulkStatus] = useState('Active');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('overview'); // overview | assignments | resources
  const [showArchived, setShowArchived] = useState(false);

  // Session Timer State & Logic
  const nowRef = useRef(0);

  const [studyTimer, setStudyTimer] = useState({ isRunning: false, seconds: 0, startTime: null, course: null });

  useEffect(() => {
    nowRef.current = Date.now();
  }, []);

  React.useEffect(() => {
    let interval;
    if (studyTimer.isRunning) {
      interval = setInterval(() => {
        setStudyTimer(prev => ({ ...prev, seconds: Math.floor((Date.now() - prev.startTime) / 1000) }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [studyTimer.isRunning]);

  const formatTimer = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const toggleStudySession = (courseToStart = null) => {
    if (studyTimer.isRunning) {
      const elapsed = studyTimer.seconds;
      const courseToUpdate = studyTimer.course;
      
      if (elapsed > 60 && courseToUpdate) {
        const currentSeconds = timeToSeconds(courseToUpdate.timeTracking?.current || '00:00:00');
        const newCurrent = formatTimer(currentSeconds + elapsed);
        
        const updatedCourse = { 
          ...courseToUpdate, 
          timeTracking: { ...courseToUpdate.timeTracking, current: newCurrent },
          updatedAt: new Date().toISOString()
        };

        if (updatedCourse.trackingType === 'time') {
          const totalSec = timeToSeconds(updatedCourse.timeTracking.total);
          updatedCourse.progress = totalSec > 0 ? Math.min(100, Math.round(((currentSeconds + elapsed) / totalSec) * 100)) : 0;
        }

        setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
        if (selectedCourseDetail?.id === updatedCourse.id) {
          setSelectedCourseDetail(updatedCourse);
        }
        toast.success(`Added ${Math.round(elapsed / 60)} minutes to ${updatedCourse.title}!`);
      } else if (elapsed <= 60) {
        toast.success("Session ended (under 1 min, not saved).");
      }
      setStudyTimer({ isRunning: false, seconds: 0, startTime: null, course: null });
    } else if (courseToStart) {
      setStudyTimer({ isRunning: true, seconds: 0, startTime: nowRef.current, course: courseToStart });
      toast.success(`Study session started for ${courseToStart.title}. Focus up!`);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    platform: '',
    category: '',
    difficulty: 'Beginner',
    tags: '',
    progress: 0,
    status: 'Active',
    trackingType: 'percentage',
    timeTracking: { current: '00:00:00', total: '00:00:00' },
    moduleTracking: { total: 1, completed: 0 },
    archived: false
  });

  // 2. Search, Filter & Sort Logic (Derived State)
  const filteredAndSortedCourses = useMemo(() => {
    let result = courses.filter(course => {
      const query = searchTerm.toLowerCase();
      const isArchived = course.archived === true;
      if (!showArchived && isArchived && filterStatus !== 'Archived') return false;
      const matchesSearch = 
        course.title.toLowerCase().includes(query) ||
        course.platform.toLowerCase().includes(query) ||
        (course.tags || []).some(t => t.toLowerCase().includes(query));
      
      const matchesStatus = filterStatus === 'All'
        ? true
        : (filterStatus === 'Archived' ? isArchived : course.status === filterStatus);
      return matchesSearch && matchesStatus;
    });

    // Sort Logic
    return result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'platform') return a.platform.localeCompare(b.platform);
      if (sortBy === 'updated') return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      return 0;
    });
  }, [courses, searchTerm, filterStatus, sortBy, showArchived]);

  // 3. CRUD Operations
  const handleSubmit = (e) => {
    e.preventDefault();
    const title = String(formData.title || '').trim();
    const platform = String(formData.platform || '').trim();
    const category = String(formData.category || '').trim();
    const difficulty = String(formData.difficulty || 'Beginner').trim();
    const status = String(formData.status || 'Active').trim();
    const trackingType = String(formData.trackingType || 'percentage').trim();

    const tagsArray = typeof formData.tags === 'string'
      ? formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag)
          .slice(0, 20)
      : Array.isArray(formData.tags) ? formData.tags : [];

    if (!title || title.length < 3) {
      toast.error('Course title should be at least 3 characters');
      return;
    }
    if (!platform) {
      toast.error('Platform is required');
      return;
    }
    if (!category) {
      toast.error('Category is required');
      return;
    }
    if (title.length > 120 || platform.length > 80 || category.length > 80) {
      toast.error('One of the fields is too long');
      return;
    }
    const isDuplicate = courses.some((c) => {
      if (editingCourse && c.id === editingCourse.id) return false;
      return String(c.title || '').trim().toLowerCase() === title.toLowerCase()
        && String(c.platform || '').trim().toLowerCase() === platform.toLowerCase();
    });
    if (isDuplicate) {
      toast.error('A course with the same title + platform already exists');
      return;
    }

    const validateTime = (time) => {
      if (!time) return true;
      return /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.test(String(time).trim());
    };

    // Calculate progress based on tracking type
    let calculatedProgress = formData.progress;
    if (formData.trackingType === 'time') {
      if (!validateTime(formData.timeTracking?.current) || !validateTime(formData.timeTracking?.total)) {
        toast.error('Time format must be HH:MM:SS (e.g. 12:30:00)');
        return;
      }
      const current = timeToSeconds(formData.timeTracking.current);
      const total = timeToSeconds(formData.timeTracking.total);
      calculatedProgress = total > 0 ? Math.round((current / total) * 100) : 0;
    } else if (formData.trackingType === 'modules') {
      const totalModules = Math.max(1, Number(formData.moduleTracking?.total || 1));
      const completedModules = Math.max(0, Math.min(totalModules, Number(formData.moduleTracking?.completed || 0)));
      calculatedProgress = formData.moduleTracking.total > 0 
        ? Math.round((completedModules / totalModules) * 100) 
        : 0;
    }
    
    const courseData = { 
      ...formData,
      title,
      platform,
      category,
      difficulty,
      status,
      trackingType,
      tags: tagsArray, 
      progress: Math.min(100, Math.max(0, calculatedProgress)),
      archived: Boolean(formData.archived),
      updatedAt: new Date().toISOString()
    };

    if (editingCourse) {
      const prevStatus = editingCourse.status;
      const nextCourse = { ...courseData, id: editingCourse.id };
      setCourses(courses.map(c => c.id === editingCourse.id ? nextCourse : c));
      toast.success('Course path optimized!');

      if (prevStatus !== 'Completed' && nextCourse.status === 'Completed') {
        addNotification(courseCompletedNotification(nextCourse.title));
      }
    } else {
      const created = { ...courseData, id: nanoid(), createdAt: new Date().toISOString() };
      setCourses([created, ...courses]);
      toast.success('New learning stream launched!');

      if (created.status === 'Completed') {
        addNotification(courseCompletedNotification(created.title));
      }
    }
    
    closeModal();
  };

  const toggleCourseSelection = (courseId) => {
    setSelectedCourseIds((prev) => toggleSelectionId(prev, courseId));
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredAndSortedCourses.map((c) => c.id);
    setSelectedCourseIds((prev) => toggleSelectAll(prev, visibleIds));
  };

  const clearSelection = () => setSelectedCourseIds([]);

  const applyBulkStatus = () => {
    if (!selectedCourseIds.length) return;
    const selected = new Set(selectedCourseIds);
    setCourses((prev) => prev.map((c) => (
      selected.has(c.id) ? { ...c, status: bulkStatus, archived: false, updatedAt: new Date().toISOString() } : c
    )));
    toast.success(`Updated ${selectedCourseIds.length} course(s)`);
    clearSelection();
  };

  const applyBulkTag = () => {
    const tag = bulkTagInput.trim().toLowerCase();
    if (!selectedCourseIds.length || !tag) return;
    const selected = new Set(selectedCourseIds);
    setCourses((prev) => prev.map((c) => {
      if (!selected.has(c.id)) return c;
      const tags = Array.isArray(c.tags) ? c.tags : [];
      return tags.includes(tag) ? c : { ...c, tags: [...tags, tag], updatedAt: new Date().toISOString() };
    }));
    toast.success(`Tagged ${selectedCourseIds.length} course(s)`);
    setBulkTagInput('');
  };

  const applyBulkArchive = () => {
    if (!selectedCourseIds.length) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Archive Courses',
      message: `Archive ${selectedCourseIds.length} selected course(s)?`,
      onConfirm: () => {
        setCourses((prev) => softArchiveByIds(prev, selectedCourseIds));
        toast.success('Courses archived');
        clearSelection();
      }
    });
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
    title: 'Delete Course',
    message: 'Permanently delete this course? This cannot be undone.',
      onConfirm: () => {
        setCourses(hardDeleteByIds(courses, [id]));
        toast.success('Course deleted permanently');
      }
    });
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      ...course,
      tags: Array.isArray(course.tags) ? course.tags.join(', ') : course.tags,
      trackingType: course.trackingType || 'percentage',
      timeTracking: course.timeTracking || { current: '00:00:00', total: '00:00:00' },
      moduleTracking: course.moduleTracking || { total: 1, completed: 0 },
      archived: course.archived === true
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
    setFormData({
      title: '',
      platform: '',
      category: '',
      difficulty: 'Beginner',
      tags: '',
      progress: 0,
      status: 'Active',
      trackingType: 'percentage',
      timeTracking: { current: '00:00:00', total: '00:00:00' },
      moduleTracking: { total: 1, completed: 0 },
      archived: false
    });
  };

  const applyBulkRestore = () => {
    if (!selectedCourseIds.length) return;
    setCourses((prev) => restoreByIds(prev, selectedCourseIds));
    toast.success(`Restored ${selectedCourseIds.length} course(s)`);
    clearSelection();
  };

  const applyBulkHardDelete = () => {
    if (!selectedCourseIds.length) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Permanently',
      message: `Permanently delete ${selectedCourseIds.length} selected course(s)? This cannot be undone.`,
      onConfirm: () => {
        setCourses((prev) => hardDeleteByIds(prev, selectedCourseIds));
        toast.success('Courses deleted permanently');
        clearSelection();
      }
    });
  };

  // Helper: Time to Seconds
  const timeToSeconds = (time) => {
    if (!time) return 0;
    const parts = time.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  // Reset Data to Defaults
  const handleResetData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset Knowledge Base',
      message: 'Reset knowledge base to defaults? Current progress will be overwritten.',
      onConfirm: () => {
        const defaults = [
          {
            id: nanoid(),
            title: 'Fullstack Web Development',
            platform: 'Udemy',
            category: 'Development',
            difficulty: 'Intermediate',
            tags: ['React', 'Node', 'Database'],
            progress: 45,
            status: 'Active',
            trackingType: 'percentage',
            timeTracking: { current: '10:00:00', total: '22:00:00' },
            moduleTracking: { total: 12, completed: 5 }
          },
          {
            id: nanoid(),
            title: 'UI/UX Design Masterclass',
            platform: 'Coursera',
            category: 'Design',
            difficulty: 'Beginner',
            tags: ['Figma', 'UX', 'Mobile'],
            progress: 100,
            status: 'Completed',
            trackingType: 'modules',
            timeTracking: { current: '08:00:00', total: '08:00:00' },
            moduleTracking: { total: 8, completed: 8 }
          }
        ];
        setCourses(defaults);
        toast.success('Knowledge base reset');
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header Title Section */}
      <PageHeader
        title="Learning Streams"
        description="Architect your mastery path"
        icon={<BookOpen size={32} />}
        className="mb-12"
      />

      {/* Filter and Actions */}
      <div className="flex flex-col gap-3 mb-6">
        <CourseFilter 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onReset={handleResetData}
          onAdd={() => setIsModalOpen(true)}
          courseCount={filteredAndSortedCourses.length}
          showArchived={showArchived}
          setShowArchived={setShowArchived}
        />
        <div className="flex justify-end">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
          >
            <option value="updated">Sort: Recently Updated</option>
            <option value="title">Sort: Alphabetical (A-Z)</option>
            <option value="progress">Sort: Highest Progress</option>
            <option value="platform">Sort: By Platform</option>
          </select>
        </div>
      </div>

      {selectedCourseIds.length > 0 && (
        <BulkActionBar selectedCount={selectedCourseIds.length} onSelectVisible={toggleSelectAllVisible} onClear={clearSelection} className="mb-6">
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="px-2 py-1 rounded-lg text-xs">
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
          </select>
          <button onClick={applyBulkStatus} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">Set status</button>
          <input value={bulkTagInput} onChange={(e) => setBulkTagInput(e.target.value)} placeholder="tag" className="px-2 py-1 rounded-lg text-xs w-28" />
          <button onClick={applyBulkTag} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700">Add tag</button>
          <button onClick={applyBulkRestore} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">Restore</button>
          <button onClick={applyBulkArchive} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">Archive</button>
          <button onClick={applyBulkHardDelete} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white">Hard delete</button>
        </BulkActionBar>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedCourses.map((course) => (
            <CourseItem 
              key={course.id}
              course={course}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewResources={setSelectedCourseForResources}
              onOpenDetail={(c) => { setSelectedCourseDetail(c); setDetailTab('overview'); }}
              assignments={assignments}
              selected={selectedCourseIds.includes(course.id)}
              onToggleSelect={toggleCourseSelection}
            />
          ))}
        </AnimatePresence>

        {filteredAndSortedCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full"
          >
            <EmptyState
              icon={<BookOpen size={48} className="text-slate-200 dark:text-slate-700" />}
              title="No Streams Found"
              description="Launch a new course or adjust your filters to discover your learning paths."
              actions={(
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-4 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/20 transition-all active:scale-95"
                >
                  Start Your First Path
                </button>
              )}
            />
          </motion.div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <CourseForm 
            editingCourse={editingCourse}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* Resources Preview Modal */}
      <AnimatePresence>
        {selectedCourseForResources && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCourseForResources(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl space-y-8 border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <FolderOpen size={24} className="text-primary-500" />
                    Knowledge Assets
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-9">Resources for {selectedCourseForResources.title}</p>
                </div>
                <button onClick={() => setSelectedCourseForResources(null)} className="p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              
              <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-4">
                {resources.filter(r => r.associatedType === 'Course' && r.associatedId === selectedCourseForResources.id).map((res) => (
                  <a 
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-primary-100 dark:hover:border-primary-500/20 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary-500 shadow-sm group-hover:scale-110 transition-transform">
                        {res.type === 'Link' ? <ExternalLink size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">{res.name}</p>
                        <p className="text-[9px] text-primary-500 uppercase font-black tracking-widest mt-0.5">{res.type}</p>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-300 group-hover:text-primary-500 transition-colors shadow-sm">
                      <ExternalLink size={18} />
                    </div>
                  </a>
                ))}
                {resources.filter(r => r.associatedType === 'Course' && r.associatedId === selectedCourseForResources.id).length === 0 && (
                  <div className="py-20 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <FolderOpen size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                    <p className="text-slate-400 font-bold text-sm">No assets linked yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourseDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCourseDetail(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">{selectedCourseDetail.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">{selectedCourseDetail.platform} • {selectedCourseDetail.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(selectedCourseDetail)}
                    className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setSelectedCourseDetail(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="px-6 pt-4 flex items-center gap-2">
                {[
                  ['overview', 'Overview'],
                  ['assignments', 'Assignments'],
                  ['resources', 'Resources'],
                  ['notes', 'Notes']
                ].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setDetailTab(id)}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                      detailTab === id ? 'bg-slate-900 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <div className="ml-auto flex gap-2">
                  {studyTimer.isRunning && studyTimer.course?.id === selectedCourseDetail.id && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black tracking-widest text-xs">
                      <Clock size={14} className="animate-pulse" />
                      {formatTimer(studyTimer.seconds)}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (studyTimer.isRunning && studyTimer.course?.id !== selectedCourseDetail.id) {
                        toast.error(`A session is already running for ${studyTimer.course.title}`);
                        return;
                      }
                      toggleStudySession(selectedCourseDetail);
                    }}
                    className={`px-3 py-2 rounded-xl text-white text-xs font-black uppercase tracking-widest transition ${
                      studyTimer.isRunning && studyTimer.course?.id === selectedCourseDetail.id ? 'bg-rose-500 hover:bg-rose-600' : 'bg-primary-500 hover:bg-primary-600'
                    }`}
                  >
                    {studyTimer.isRunning && studyTimer.course?.id === selectedCourseDetail.id ? 'End Session' : 'Start Session'}
                  </button>
                  <button
                    onClick={() => {
                      const next = { ...selectedCourseDetail, status: 'Completed' };
                      setCourses((prev) => prev.map((c) => (c.id === next.id ? { ...c, status: 'Completed', archived: false, updatedAt: new Date().toISOString(), progress: Math.max(100, Number(c.progress || 0)) } : c)));
                      setSelectedCourseDetail(next);
                      addNotification(courseCompletedNotification(next.title));
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => {
                      const nextStatus = selectedCourseDetail.status === 'Paused' ? 'Active' : 'Paused';
                      setCourses((prev) => prev.map((c) => (
                        c.id === selectedCourseDetail.id
                          ? { ...c, status: nextStatus, archived: false, updatedAt: new Date().toISOString() }
                          : c
                      )));
                      setSelectedCourseDetail((prev) => ({ ...prev, status: nextStatus }));
                      toast.success(nextStatus === 'Paused' ? 'Course paused' : 'Course resumed');
                    }}
                    className={`px-3 py-2 rounded-xl text-white text-xs font-black uppercase tracking-widest ${
                      selectedCourseDetail.status === 'Paused'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                  >
                    {selectedCourseDetail.status === 'Paused' ? 'Resume' : 'Pause'}
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-4">
                {detailTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                      <p className="text-lg font-black mt-1 text-slate-800 dark:text-white">{selectedCourseDetail.status}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</p>
                      <p className="text-lg font-black mt-1 text-slate-800 dark:text-white">{selectedCourseDetail.progress}%</p>
                    </div>
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tags</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(selectedCourseDetail.tags || []).length === 0 ? (
                          <span className="text-sm text-slate-400">No tags</span>
                        ) : (
                          (selectedCourseDetail.tags || []).map((t) => (
                            <span key={t} className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              #{t}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === 'assignments' && (
                  <div className="space-y-2">
                    {assignments.filter((a) => a.courseId === selectedCourseDetail.id).length === 0 ? (
                      <div className="py-16 text-center text-slate-400 font-bold">No assignments linked to this course.</div>
                    ) : (
                      assignments.filter((a) => a.courseId === selectedCourseDetail.id).map((a) => (
                        <div key={a.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="font-black text-slate-800 dark:text-white">{a.title || a.name || 'Assignment'}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{a.status || ''}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === 'resources' && (
                  <div className="space-y-2">
                    {resources.filter((r) => r.associatedType === 'Course' && r.associatedId === selectedCourseDetail.id).length === 0 ? (
                      <div className="py-16 text-center text-slate-400 font-bold">No resources linked to this course.</div>
                    ) : (
                      resources
                        .filter((r) => r.associatedType === 'Course' && r.associatedId === selectedCourseDetail.id)
                        .map((r) => (
                          <a
                            key={r.id}
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                          >
                            <div>
                              <p className="font-black text-slate-800 dark:text-white">{r.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{r.type}</p>
                            </div>
                            <ExternalLink size={18} className="text-slate-400" />
                          </a>
                        ))
                    )}
                  </div>
                )}

                {detailTab === 'notes' && (
                  <div className="space-y-2">
                    {notes.filter((n) => n.courseId === selectedCourseDetail.id || n.subject === selectedCourseDetail.title).length === 0 ? (
                      <div className="py-16 text-center text-slate-400 font-bold">No notes linked to this course yet.</div>
                    ) : (
                      notes
                        .filter((n) => n.courseId === selectedCourseDetail.id || n.subject === selectedCourseDetail.title)
                        .map((n) => (
                          <div
                            key={n.id}
                            className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                          >
                            <p className="font-black text-slate-800 dark:text-white">{n.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.content?.replace(/<[^>]*>?/gm, '') || 'Empty note'}</p>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        message={confirmConfig.message}
        title={confirmConfig.title}
      />

      {/* Floating Active Study Session */}
      <AnimatePresence>
        {studyTimer.isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6 border border-slate-700 dark:border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center animate-pulse">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Session</p>
                <p className="text-sm font-bold truncate max-w-[150px]">{studyTimer.course?.title}</p>
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums tracking-tight">
              {formatTimer(studyTimer.seconds)}
            </div>
            <button
              onClick={() => toggleStudySession()}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
            >
              End
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Courses;
