import React from 'react';
import { 
  X, 
  Bell, 
  Clock, 
  Calendar as CalendarIcon, 
  Tag, 
  MessageSquare,
  RefreshCcw,
  Zap,
  Mail,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

const ReminderForm = ({ formData, setFormData, onSubmit, onClose, isEditing, existingCategories = [], courses = [] }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl space-y-8 border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Bell size={28} className="text-primary-500" />
              {isEditing ? 'Update Study Alert' : 'Set Study Alert'}
            </h2>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1 ml-10">
              {isEditing ? 'Refine your study schedule' : 'Architect your study schedule'}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reminder Title</label>
              <div className="relative group">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                  required 
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium" 
                  placeholder="e.g. Finish DSA Lab Report" 
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Repeat Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {['None', 'Daily', 'Weekly'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormData({...formData, recurring: f})}
                    className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                      formData.recurring === f 
                        ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' 
                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <RefreshCcw size={14} className={formData.recurring === f ? 'animate-spin-slow' : ''} />
                      {f}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Snooze Option</label>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, snoozeEnabled: !formData.snoozeEnabled})}
                  className={`w-full py-3 rounded-2xl border transition-all active:scale-95 flex items-center justify-center gap-3 ${
                    formData.snoozeEnabled 
                      ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                      : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
                  }`}
                >
                  <Zap size={16} className={formData.snoozeEnabled ? 'fill-current' : ''} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {formData.snoozeEnabled ? 'Snooze Enabled' : 'Snooze Disabled'}
                  </span>
                </button>
                <p className="text-[9px] text-slate-400 font-medium text-center px-2">Allows pausing alert from the notification panel</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Alert</label>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, sendEmail: !formData.sendEmail})}
                  className={`w-full py-3 rounded-2xl border transition-all active:scale-95 flex items-center justify-center gap-3 ${
                    formData.sendEmail 
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
                  }`}
                >
                  <Mail size={16} className={formData.sendEmail ? 'fill-current' : ''} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {formData.sendEmail ? 'Email Enabled' : 'Email Disabled'}
                  </span>
                </button>
                <p className="text-[9px] text-slate-400 font-medium text-center px-2">Send reminder to your email address</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Snooze Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 30, 60].map(minutes => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setFormData({ ...formData, snoozeMinutes: minutes })}
                      className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                        formData.snoozeMinutes === minutes
                          ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Linked Course</label>
                <div className="relative group">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <select
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium"
                    value={formData.relatedCourseId || ''}
                    onChange={e => setFormData({ ...formData, relatedCourseId: e.target.value })}
                  >
                    <option value="">None</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheduled Date</label>
                <div className="relative group">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    type="date"
                    required 
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-bold text-xs" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheduled Time</label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    type="time"
                    required 
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-black text-lg" 
                    value={formData.time} 
                    onChange={e => setFormData({...formData, time: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({...formData, priority: p})}
                      className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                        formData.priority === p 
                          ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium" 
                    placeholder="e.g. Work, Exam" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-4 rounded-2xl bg-primary-500 text-white font-black shadow-xl shadow-primary-500/30 hover:bg-primary-600 transition-all active:scale-95"
            >
              {isEditing ? 'Sync Changes' : 'Launch Study Alert'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReminderForm;
