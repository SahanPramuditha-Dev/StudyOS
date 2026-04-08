import React from 'react';
import { 
  X, 
  Code, 
  Layers, 
  Github, 
  Activity, 
  AlignLeft,
  Calendar,
  Zap,
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProjectForm = ({ formData, setFormData, onSubmit, onClose, isEditing }) => {
  const statusOptions = ['Ongoing', 'Submitted', 'Completed', 'Archived'];
  const priorityOptions = ['Low', 'Medium', 'High'];

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
        className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl space-y-8 border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Code size={28} className="text-primary-500" />
              {isEditing ? 'Update Project' : 'Launch New Project'}
            </h2>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1 ml-10">
              {isEditing ? 'Refine your architectural vision' : 'Architect your next big idea'}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Name</label>
                <div className="relative group">
                  <Code className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    required 
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium" 
                    placeholder="e.g. StudyOs Platform" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject / Module Tag</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium" 
                    placeholder="e.g. SE, DBMS, AI" 
                    value={formData.subject} 
                    onChange={e => setFormData({...formData, subject: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tech Stack</label>
                <div className="relative group">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium" 
                    placeholder="e.g. React, Firebase, Tailwind" 
                    value={formData.stack} 
                    onChange={e => setFormData({...formData, stack: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GitHub Repository</label>
                <div className="relative group">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium" 
                    placeholder="https://github.com/..." 
                    value={formData.repo} 
                    onChange={e => setFormData({...formData, repo: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({...formData, status: s})}
                      className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                        formData.status === s 
                          ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {priorityOptions.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({...formData, priority: p})}
                      className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                        formData.priority === p 
                          ? (p === 'High' ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' : 
                             p === 'Medium' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 
                             'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20')
                          : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    type="date"
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-bold text-xs" 
                    value={formData.deadline || ''} 
                    onChange={e => setFormData({...formData, deadline: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brief Description</label>
            <div className="relative group">
              <AlignLeft className="absolute left-4 top-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
              <textarea 
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium min-h-[100px] resize-none" 
                placeholder="What is the architectural vision for this project?" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
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
              {isEditing ? 'Sync Changes' : 'Deploy Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProjectForm;
