import React from 'react';
import { 
  X, 
  Link as LinkIcon, 
  FileText, 
  Play, 
  File, 
  Tag as TagIcon,
  Layers,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';

const ResourceForm = ({ editingItem, resourceForm, setResourceForm, onSubmit, onClose, courses, videos }) => {
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
        className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl space-y-8 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              {editingItem ? 'Refine Knowledge Asset' : 'Link New Insight'}
            </h2>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">
              {editingItem ? 'Update your resource metadata' : 'Bridge external data to your workspace'}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Name</label>
              <input 
                required 
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium" 
                placeholder="e.g. Distributed Systems Lab" 
                value={resourceForm.name} 
                onChange={e => setResourceForm({...resourceForm, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Content Type</label>
              <div className="relative">
                <select 
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-bold appearance-none cursor-pointer" 
                  value={resourceForm.type} 
                  onChange={e => setResourceForm({...resourceForm, type: e.target.value})}
                >
                  <option className="dark:bg-slate-900">Link</option>
                  <option className="dark:bg-slate-900">PDF</option>
                  <option className="dark:bg-slate-900">Slides</option>
                  <option className="dark:bg-slate-900">Docs</option>
                  <option className="dark:bg-slate-900">Video</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Universal Resource Locator (URL)</label>
            <div className="relative group">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input 
                required 
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-mono text-sm" 
                placeholder="https://drive.google.com/..." 
                value={resourceForm.url} 
                onChange={e => setResourceForm({...resourceForm, url: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Abstract / Description</label>
            <textarea 
              rows={3} 
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium resize-none" 
              placeholder="Brief summary of the knowledge asset..." 
              value={resourceForm.description} 
              onChange={e => setResourceForm({...resourceForm, description: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Knowledge Tags</label>
              <div className="relative group">
                <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium" 
                  placeholder="arch, theory, lab" 
                  value={resourceForm.tags} 
                  onChange={e => setResourceForm({...resourceForm, tags: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contextual Bridge</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <select 
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-bold appearance-none cursor-pointer text-xs"
                    value={resourceForm.associatedType}
                    onChange={e => setResourceForm({...resourceForm, associatedType: e.target.value, associatedId: ''})}
                  >
                    <option className="dark:bg-slate-900" value="None">None</option>
                    <option className="dark:bg-slate-900" value="Course">Course</option>
                    <option className="dark:bg-slate-900" value="Video">Video</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
                {resourceForm.associatedType !== 'None' && (
                  <div className="relative flex-[2]">
                    <select 
                      required
                      className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-bold appearance-none cursor-pointer text-xs"
                      value={resourceForm.associatedId}
                      onChange={e => setResourceForm({...resourceForm, associatedId: e.target.value})}
                    >
                      <option value="">Link to...</option>
                      {resourceForm.associatedType === 'Course' ? courses.map(c => (
                        <option key={c.id} value={c.id} className="dark:bg-slate-900">{c.title}</option>
                      )) : videos.map(v => (
                        <option key={v.id} value={v.id} className="dark:bg-slate-900">{v.title}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                )}
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
              {editingItem ? 'Commit Update' : 'Launch Asset'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ResourceForm;
