import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle,
  Calendar,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { useReminders } from '../../context/ReminderContext';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

// Sub-components
import ReminderItem from './components/ReminderItem';
import ReminderForm from './components/ReminderForm';
import ConfirmModal from '../../components/ConfirmModal';

const Reminders = () => {
  // 1. State Management (from Context)
  const { 
    reminders, 
    addReminder, 
    updateReminder, 
    deleteReminder: removeReminder, 
    toggleReminderEnabled, 
    markReminderAsDone 
  } = useReminders();
  
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Upcoming, Completed, Overdue
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '' });

  const [formData, setFormData] = useState({
    message: '',
    time: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    category: '',
    enabled: true,
    completed: false,
    recurring: 'None', // None, Daily, Weekly
    snoozeEnabled: true,
    sendEmail: false
  });

  // 2. Logic & Filtering
  const filteredReminders = useMemo(() => {
    const now = new Date();
    let result = reminders.filter(r => {
      const matchesSearch = r.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           r.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const rDate = new Date(r.date + ' ' + r.time);
      const isOverdue = !r.completed && rDate < now;

      if (filterType === 'Upcoming') return matchesSearch && !r.completed && !isOverdue;
      if (filterType === 'Completed') return matchesSearch && r.completed;
      if (filterType === 'Overdue') return matchesSearch && isOverdue;
      return matchesSearch;
    });

    // Sort by date and time
    return result.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
  }, [reminders, searchTerm, filterType]);

  // 3. CRUD Handlers
  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      message: reminder.message,
      time: reminder.time,
      date: reminder.date,
      priority: reminder.priority,
      category: reminder.category || '',
      enabled: reminder.enabled,
      completed: reminder.completed,
      recurring: reminder.recurring || 'None',
      snoozeEnabled: reminder.snoozeEnabled ?? true,
      sendEmail: reminder.sendEmail ?? false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingReminder) {
      updateReminder(editingReminder.id, formData);
    } else {
      addReminder(formData);
    }
    closeModal();
  };

  const deleteReminder = (id) => {
    setConfirmConfig({
      isOpen: true,
      message: 'Archive this study alert?',
      onConfirm: () => {
        removeReminder(id);
      }
    });
  };

  const toggleEnabled = (id) => {
    toggleReminderEnabled(id);
  };

  const markAsDone = (id) => {
    markReminderAsDone(id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReminder(null);
    setFormData({
      message: '', time: '', date: new Date().toISOString().split('T')[0],
      priority: 'Medium', category: '', enabled: true, completed: false,
      recurring: 'None', snoozeEnabled: true, sendEmail: false
    });
  };

  const categories = useMemo(() => {
    const cats = new Set(reminders.map(r => r.category).filter(Boolean));
    return Array.from(cats);
  }, [reminders]);

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
            <div className="p-3 rounded-[1.5rem] bg-primary-500 text-white shadow-xl shadow-primary-500/20">
              <Bell size={32} />
            </div>
            Study Alerts
          </h1>
          <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs mt-2">Architect your learning schedule</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-3.5 rounded-[2rem] bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-xl shadow-primary-500/30 active:scale-95 group"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform" />
          Set Alert
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search alerts or categories..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-transparent focus:border-primary-500/20 outline-none transition-all text-sm font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          {['All', 'Upcoming', 'Overdue', 'Completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterType === f 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders Grid/List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredReminders.map(reminder => (
            <ReminderItem 
              key={reminder.id}
              reminder={reminder}
              onToggle={toggleEnabled}
              onDelete={deleteReminder}
              onMarkDone={markAsDone}
              onEdit={handleEdit}
            />
          ))}
        </AnimatePresence>

        {filteredReminders.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-32 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800"
          >
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <Bell size={48} className="text-slate-200 dark:text-slate-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">Schedule Clear</h3>
              <p className="text-slate-400 max-w-sm mx-auto">You have no {filterType.toLowerCase()} alerts. Launch a new reminder to stay synchronized with your goals.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/20 transition-all active:scale-95"
            >
              Set First Alert
            </button>
          </motion.div>
        )}
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <ReminderForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={closeModal}
            isEditing={!!editingReminder}
            existingCategories={categories}
          />
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        message={confirmConfig.message}
        title="Archive Alert"
        confirmText="Archive"
        type="danger"
      />
    </div>
  );
};

export default Reminders;
