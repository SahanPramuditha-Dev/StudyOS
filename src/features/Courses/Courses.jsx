import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  ExternalLink,
  BookOpen,
  FolderOpen,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

// Sub-components
import CourseItem from './components/CourseItem';
import CourseFilter from './components/CourseFilter';
import CourseForm from './components/CourseForm';
import ConfirmModal from '../../components/ConfirmModal';

const Courses = () => {
  // 1. State Management
  const [courses, setCourses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [resources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseForResources, setSelectedCourseForResources] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('title'); // 'title' | 'progress' | 'platform'
  const [editingCourse, setEditingCourse] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '', title: '' });

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
    moduleTracking: { total: 1, completed: 0 }
  });

  // 2. Search, Filter & Sort Logic (Derived State)
  const filteredAndSortedCourses = useMemo(() => {
    let result = courses.filter(course => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = 
        course.title.toLowerCase().includes(query) ||
        course.platform.toLowerCase().includes(query) ||
        (course.tags || []).some(t => t.toLowerCase().includes(query));
      
      const matchesStatus = filterStatus === 'All' || course.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    // Sort Logic
    return result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'platform') return a.platform.localeCompare(b.platform);
      return 0;
    });
  }, [courses, searchTerm, filterStatus, sortBy]);

  // 3. CRUD Operations
  const handleSubmit = (e) => {
    e.preventDefault();
    const tagsArray = typeof formData.tags === 'string' 
      ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      : formData.tags;

    // Calculate progress based on tracking type
    let calculatedProgress = formData.progress;
    if (formData.trackingType === 'time') {
      const current = timeToSeconds(formData.timeTracking.current);
      const total = timeToSeconds(formData.timeTracking.total);
      calculatedProgress = total > 0 ? Math.round((current / total) * 100) : 0;
    } else if (formData.trackingType === 'modules') {
      calculatedProgress = formData.moduleTracking.total > 0 
        ? Math.round((formData.moduleTracking.completed / formData.moduleTracking.total) * 100) 
        : 0;
    }
    
    const courseData = { 
      ...formData, 
      tags: tagsArray, 
      progress: Math.min(100, Math.max(0, calculatedProgress)),
      updatedAt: new Date().toISOString()
    };

    if (editingCourse) {
      setCourses(courses.map(c => c.id === editingCourse.id ? { ...courseData, id: c.id } : c));
      toast.success('Course path optimized!');
    } else {
      setCourses([{ ...courseData, id: nanoid(), createdAt: new Date().toISOString() }, ...courses]);
      toast.success('New learning stream launched!');
    }
    
    closeModal();
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Archive Course',
      message: 'Terminate this learning path? All progress data will be lost.',
      onConfirm: () => {
        setCourses(courses.filter(c => c.id !== id));
        toast.success('Course archived');
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
      moduleTracking: course.moduleTracking || { total: 1, completed: 0 }
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
      moduleTracking: { total: 1, completed: 0 }
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
      <div className="mb-12 space-y-2">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
          <div className="p-3 rounded-[1.5rem] bg-primary-500 text-white shadow-xl shadow-primary-500/20">
            <BookOpen size={32} />
          </div>
          Learning Streams
        </h1>
        <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs">Architect your mastery path</p>
      </div>

      {/* Filter and Actions */}
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
      />

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
            />
          ))}
        </AnimatePresence>

        {filteredAndSortedCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full py-24 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800"
          >
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <BookOpen size={48} className="text-slate-200 dark:text-slate-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">No Streams Found</h3>
              <p className="text-slate-400 max-w-sm mx-auto">Launch a new course or adjust your filters to discover your learning paths.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/20 transition-all active:scale-95"
            >
              Start Your First Path
            </button>
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

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        message={confirmConfig.message}
        title={confirmConfig.title}
      />
    </div>
  );
};

export default Courses;
