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

// Components
import AssignmentItem from './components/AssignmentItem';
import AssignmentForm from './components/AssignmentForm';
import AssignmentDetail from './components/AssignmentDetail';
import ConfirmModal from '../../components/ConfirmModal';

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
    return assignments.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           a.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           a.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || a.status === filterStatus;
      const matchesCourse = filterCourse === 'All' || a.courseId === filterCourse;
      return matchesSearch && matchesStatus && matchesCourse;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [assignments, searchTerm, filterStatus, filterCourse]);

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
    <div className="max-w-7xl mx-auto pb-12 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
            <div className="p-3 rounded-[1.5rem] bg-blue-500 text-white shadow-xl shadow-blue-500/20">
              <BookOpen size={32} />
            </div>
            Assignments
          </h1>
          <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs mt-2">Track and manage your coursework</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-3.5 rounded-[2rem] bg-blue-500 hover:bg-blue-600 text-white font-black transition-all shadow-xl shadow-blue-500/30 active:scale-95 group"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform" />
          New Assignment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Not Started', value: stats.notStarted, icon: AlertCircle, color: 'text-slate-500', bg: 'bg-slate-50' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { label: 'Submitted', value: stats.submitted, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Late', value: stats.late, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-3 text-center"
          >
            <div className={`p-3 rounded-2xl ${stat.bg} dark:bg-opacity-10 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search assignments, subjects..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-transparent focus:border-blue-500/20 outline-none transition-all text-sm font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto custom-scrollbar">
          <Filter size={18} className="text-slate-400 mr-2 shrink-0" />
          {['All', 'Not Started', 'In Progress', 'Submitted', 'Late'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                filterStatus === status
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-blue-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {courses.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto custom-scrollbar">
            <span className="text-slate-400 text-xs font-bold shrink-0">COURSE:</span>
            {['All', ...courses].map((course, i) => {
              const isAll = course === 'All';
              return (
                <button
                  key={isAll ? 'all' : course.id}
                  onClick={() => setFilterCourse(isAll ? 'All' : course.id)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                    filterCourse === (isAll ? 'All' : course.id)
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-amber-200'
                  }`}
                >
                  {isAll ? 'All Courses' : course.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredAssignments.map(assignment => (
            <AssignmentItem
              key={assignment.id}
              assignment={assignment}
              onEdit={handleEdit}
              onDelete={deleteAssignment}
              onOpen={(id) => setSelectedAssignmentId(id)}
              courses={courses}
            />
          ))}
        </AnimatePresence>
      </div>

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
