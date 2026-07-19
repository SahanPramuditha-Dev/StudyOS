import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

import AssignmentItem from './components/AssignmentItem';
import AssignmentForm from './components/AssignmentForm';
import AssignmentDetail from './components/AssignmentDetail';
import AssignmentFilter from './components/AssignmentFilter';
import AssignmentKanban from './components/AssignmentKanban';
import AssignmentTimeline from './components/AssignmentTimeline';
import AssignmentTable from './components/AssignmentTable';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeader from '../../components/PageHeader';
import BulkActionBar from '../../components/BulkActionBar';
import Select from '../../components/ui/Select';


const Assignments = () => {
  // State Management
  const [assignments, setAssignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS || 'ASSIGNMENTS', []);
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');
  
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('Not Started');
  
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '' });

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    courseId: '',
    lecturer: '',
    deadline: '',
    description: '',
    status: 'Not Started',
    marks: '',
    brief: '',
    files: [],
    submissions: [],
    tasks: [],
    notes: [],
    resources: [],
    activity: []
  });

  // Get selected assignment
  const selectedAssignment = selectedAssignmentId 
    ? assignments.find(a => a.id === selectedAssignmentId) 
    : null;

  // Calculate stats
  const stats = useMemo(() => {
    const total = assignments.length;
    const notStarted = assignments.filter(a => a.status === 'Not Started').length;
    const inProgress = assignments.filter(a => a.status === 'In Progress').length;
    const submitted = assignments.filter(a => a.status === 'Submitted').length;
    const late = assignments.filter(a => a.status === 'Late').length;

    return { total, notStarted, inProgress, submitted, late };
  }, [assignments]);

  // Filter and search
  const filteredAssignments = useMemo(() => {
    let filtered = assignments.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           a.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           a.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || a.status === filterStatus;
      const matchesCourse = filterCourse === 'All' || a.courseId === filterCourse;
      return matchesSearch && matchesStatus && matchesCourse;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'deadline') {
         if (!a.deadline) return 1;
         if (!b.deadline) return -1;
         return new Date(a.deadline) - new Date(b.deadline);
      }
      // default 'updated'
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });
  }, [assignments, searchTerm, filterStatus, filterCourse, sortBy]);

  const statusCounts = useMemo(() => {
    const counts = { All: assignments.length };
    ['Not Started', 'In Progress', 'Submitted', 'Late'].forEach(status => {
      counts[status] = assignments.filter(a => a.status === status).length;
    });
    return counts;
  }, [assignments]);

  // CRUD Handlers
  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title || '',
      subject: assignment.subject || '',
      courseId: assignment.courseId || '',
      lecturer: assignment.lecturer || '',
      deadline: assignment.deadline || '',
      description: assignment.description || '',
      status: assignment.status || 'Not Started',
      marks: assignment.marks || '',
      brief: assignment.brief || '',
      files: assignment.files || [],
      submissions: assignment.submissions || [],
      tasks: assignment.tasks || [],
      notes: assignment.notes || [],
      resources: assignment.resources || [],
      activity: assignment.activity || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Assignment title is required');
      return;
    }

    if (editingAssignment) {
      setAssignments(prev => prev.map(a =>
        a.id === editingAssignment.id
          ? { ...formData, id: a.id, updatedAt: new Date().toISOString() }
          : a
      ));
      toast.success('Assignment updated');
    } else {
      const newAssignment = {
        ...formData,
        id: nanoid(),
        createdAt: new Date().toISOString()
      };
      setAssignments(prev => [newAssignment, ...prev]);
      toast.success('Assignment created');
    }
    closeModal();
  };

  const deleteAssignment = (id) => {
    setConfirmConfig({
      isOpen: true,
      message: 'Delete this assignment permanently?',
      onConfirm: () => {
        setAssignments(prev => prev.filter(a => a.id !== id));
        toast.success('Assignment deleted');
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
    setFormData({
      title: '',
      subject: '',
      courseId: '',
      lecturer: '',
      deadline: '',
      description: '',
      status: 'Not Started',
      marks: '',
      brief: '',
      files: [],
      submissions: [],
      tasks: [],
      notes: [],
      resources: [],
      activity: []
    });
  };

  const handleResetData = () => {
    setSearchTerm('');
    setFilterStatus('All');
    setFilterCourse('All');
    setSortBy('updated');
  };

  const toggleSelectionId = (id) => {
    setSelectedAssignmentIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    if (selectedAssignmentIds.length === filteredAssignments.length && filteredAssignments.length > 0) {
      setSelectedAssignmentIds([]);
    } else {
      setSelectedAssignmentIds(filteredAssignments.map(a => a.id));
    }
  };

  const clearSelection = () => setSelectedAssignmentIds([]);

  const applyBulkStatus = () => {
    setAssignments(prev => prev.map(a => 
      selectedAssignmentIds.includes(a.id) ? { ...a, status: bulkStatus, updatedAt: new Date().toISOString() } : a
    ));
    toast.success(`Updated status for ${selectedAssignmentIds.length} assignments`);
    clearSelection();
  };

  const deleteSelected = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Assignments',
      message: `Delete ${selectedAssignmentIds.length} selected assignments?`,
      onConfirm: () => {
        setAssignments(prev => prev.filter(a => !selectedAssignmentIds.includes(a.id)));
        toast.success(`Deleted ${selectedAssignmentIds.length} assignments`);
        clearSelection();
      }
    });
  };

  // Show Assignment Detail if one is selected
  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignment={selectedAssignment}
        onBack={() => setSelectedAssignmentId(null)}
        onUpdate={(updated) => {
          setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
          toast.success('Assignment updated');
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12">
      {/* Header Section */}
      <PageHeader
        title="Assignments"
        description="Track and manage your coursework"
        icon={<BookOpen size={32} />}
        className="mb-8"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: FileText, tint: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Not Started', value: stats.notStarted, icon: AlertCircle, tint: 'text-slate-500', bg: 'bg-slate-500/10' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, tint: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Submitted', value: stats.submitted, icon: CheckCircle2, tint: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Late', value: stats.late, icon: AlertCircle, tint: 'text-rose-500', bg: 'bg-rose-500/10' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.tint}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AssignmentFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onReset={handleResetData}
        onAdd={() => setIsModalOpen(true)}
        assignmentCount={filteredAssignments.length}
        statusCounts={statusCounts}
        filterCourse={filterCourse}
        setFilterCourse={setFilterCourse}
        courses={courses}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {selectedAssignmentIds.length > 0 && (
        <BulkActionBar selectedCount={selectedAssignmentIds.length} onSelectVisible={toggleSelectAllVisible} onClear={clearSelection} className="mb-6">
          <Select variant="ghost" value={bulkStatus} onChange={(val) => setBulkStatus(val)} options={[
            { label: 'Not Started', value: 'Not Started' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Submitted', value: 'Submitted' },
            { label: 'Late', value: 'Late' }
          ]} />
          <button onClick={applyBulkStatus} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">Set status</button>
          
          <button onClick={deleteSelected} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 ml-auto">Delete</button>
        </BulkActionBar>
      )}

      {/* Assignments Content */}
      {viewMode === 'kanban' ? (
        <AssignmentKanban
          assignments={filteredAssignments}
          onEdit={handleEdit}
          onDelete={deleteAssignment}
          onOpen={(id) => setSelectedAssignmentId(id)}
          courses={courses}
          selectedAssignmentIds={selectedAssignmentIds}
          toggleSelectionId={toggleSelectionId}
          setAssignments={setAssignments}
        />
      ) : viewMode === 'timeline' ? (
        <AssignmentTimeline
          assignments={filteredAssignments}
          onEdit={handleEdit}
          onDelete={deleteAssignment}
          onOpen={(id) => setSelectedAssignmentId(id)}
          courses={courses}
          selectedAssignmentIds={selectedAssignmentIds}
          toggleSelectionId={toggleSelectionId}
        />
      ) : viewMode === 'table' ? (
        <AssignmentTable
          assignments={filteredAssignments}
          onEdit={handleEdit}
          onDelete={deleteAssignment}
          onOpen={(id) => setSelectedAssignmentId(id)}
          courses={courses}
          selectedAssignmentIds={selectedAssignmentIds}
          toggleSelectionId={toggleSelectionId}
        />
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
          <AnimatePresence mode="popLayout">
            {filteredAssignments.map(assignment => (
              <AssignmentItem
                key={assignment.id}
                assignment={assignment}
                onEdit={handleEdit}
                onDelete={deleteAssignment}
                onOpen={(id) => setSelectedAssignmentId(id)}
                courses={courses}
                isSelected={selectedAssignmentIds.includes(assignment.id)}
                onSelect={() => toggleSelectionId(assignment.id)}
                viewMode={viewMode}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-24 flex flex-col items-center justify-center space-y-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800"
        >
          <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <BookOpen size={64} className="text-slate-200" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-800 dark:text-white">No assignments found</h3>
            <p className="text-slate-400 font-medium mt-2">Create your first assignment to get started</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 rounded-2xl bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            Create Assignment
          </button>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <AssignmentForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={closeModal}
            isEditing={!!editingAssignment}
            courses={courses}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        message={confirmConfig.message}
        title="Assignment Management"
      />
    </div>
  );
};

export default Assignments;
