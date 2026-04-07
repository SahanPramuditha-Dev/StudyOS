import React from 'react';
import { 
  X, 
  BookOpen, 
  FileText, 
  File, 
  Layers, 
  Plus, 
  Star, 
  ExternalLink 
} from 'lucide-react';
import { motion } from 'framer-motion';

const PaperForm = ({ paperForm, setPaperForm, onSubmit, onClose }) => {
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
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <FileText size={28} className="text-primary-500" />
              Document Onboarding
            </h2>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1 ml-10">Track papers, slides, and lecture materials</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Material Title</label>
              <input 
                required 
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-medium" 
                placeholder="e.g. Distributed Consensus in Cloud Environments" 
                value={paperForm.name} 
                onChange={e => setPaperForm({...paperForm, name: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resource Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {['PDF', 'Paper', 'Slide'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaperForm({...paperForm, type})}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                        paperForm.type === type 
                          ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Highlight</label>
                <button
                  type="button"
                  onClick={() => setPaperForm({...paperForm, important: !paperForm.important})}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                    paperForm.important 
                      ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' 
                      : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-orange-200'
                  }`}
                >
                  <Star size={14} fill={paperForm.important ? 'currentColor' : 'none'} />
                  {paperForm.important ? 'Priority Marked' : 'Mark as Important'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Source URL</label>
              <div className="relative group">
                <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                  required 
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-mono text-sm" 
                  placeholder="https://arxiv.org/pdf/..." 
                  value={paperForm.url} 
                  onChange={e => setPaperForm({...paperForm, url: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Page Count</label>
                <input 
                  type="number" 
                  min="1"
                  required 
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-black text-center" 
                  value={paperForm.pages} 
                  onChange={e => setPaperForm({...paperForm, pages: parseInt(e.target.value) || 1})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Starting Page Progress</label>
                <input 
                  type="number" 
                  min="0"
                  max={paperForm.pages}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all font-black text-center" 
                  value={paperForm.readPages} 
                  onChange={e => setPaperForm({...paperForm, readPages: Math.min(paperForm.pages, parseInt(e.target.value) || 0)})} 
                />
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
              Launch Tracker
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PaperForm;
