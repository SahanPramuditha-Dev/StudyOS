import React from 'react';
import { 
  X, 
  BarChart3, 
  Clock, 
  Layers, 
  Tag as TagIcon 
} from 'lucide-react';
import { motion } from 'framer-motion';

const CourseForm = ({ editingCourse, formData, setFormData, onSubmit, onClose }) => {
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
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              {editingCourse ? 'Master Mastery' : 'New Knowledge Stream'}
            </h2>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">
              {editingCourse ? 'Update your course path' : 'Define your learning journey'}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 text-slate-400 transition-all active:scale-95 shadow-sm">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-12rem)] custom-scrollbar">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Course Title</label>
              <input 
                required
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium"
                placeholder="e.g. Advanced System Architecture"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Platform</label>
                <input 
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium"
                  placeholder="e.g. Coursera, MIT"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Category</label>
                <input 
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium"
                  placeholder="e.g. Computer Science"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Difficulty</label>
                <select 
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-bold cursor-pointer"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option className="dark:bg-slate-900">Beginner</option>
                  <option className="dark:bg-slate-900">Intermediate</option>
                  <option className="dark:bg-slate-900">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Status</label>
                <select 
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-bold cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option className="dark:bg-slate-900">Active</option>
                  <option className="dark:bg-slate-900">Paused</option>
                  <option className="dark:bg-slate-900">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3 ml-1">Tracking Method</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'percentage', label: 'Manual %', icon: BarChart3 },
                  { id: 'time', label: 'Time Spent', icon: Clock },
                  { id: 'modules', label: 'Modules', icon: Layers },
                ].map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, trackingType: method.id })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      formData.trackingType === method.id
                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/30 text-primary-500 shadow-inner'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <method.icon size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {formData.trackingType === 'time' && (
              <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-primary-50/50 dark:bg-primary-500/5 border border-primary-100 dark:border-primary-500/20 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Current Time</label>
                  <input 
                    type="text"
                    className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-slate-900 dark:text-white font-mono text-center"
                    placeholder="HH:MM:SS"
                    value={formData.timeTracking.current}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      timeTracking: { ...formData.timeTracking, current: e.target.value } 
                    })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Total Time</label>
                  <input 
                    type="text"
                    className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-slate-900 dark:text-white font-mono text-center"
                    placeholder="HH:MM:SS"
                    value={formData.timeTracking.total}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      timeTracking: { ...formData.timeTracking, total: e.target.value } 
                    })}
                  />
                </div>
              </div>
            )}

            {formData.trackingType === 'modules' && (
              <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-primary-50/50 dark:bg-primary-500/5 border border-primary-100 dark:border-primary-500/20 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Completed</label>
                  <input 
                    type="number"
                    className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-slate-900 dark:text-white font-black text-center"
                    value={formData.moduleTracking.completed}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      moduleTracking: { ...formData.moduleTracking, completed: parseInt(e.target.value) || 0 } 
                    })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Total</label>
                  <input 
                    type="number"
                    className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none text-slate-900 dark:text-white font-black text-center"
                    value={formData.moduleTracking.total}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      moduleTracking: { ...formData.moduleTracking, total: parseInt(e.target.value) || 1 } 
                    })}
                  />
                </div>
              </div>
            )}

            {formData.trackingType === 'percentage' && (
              <div className="p-6 rounded-2xl bg-primary-50/50 dark:bg-primary-500/5 border border-primary-100 dark:border-primary-500/20 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mastery Progress</label>
                  <span className="text-xl font-black text-primary-500">{formData.progress}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary-500 shadow-inner"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Tags (comma separated)</label>
              <div className="relative group">
                <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all font-medium"
                  placeholder="e.g. React, Docker, Distributed Systems"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/30 transition-all active:scale-95"
            >
              {editingCourse ? 'Commit Changes' : 'Launch Course'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CourseForm;
