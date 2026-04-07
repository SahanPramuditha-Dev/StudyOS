import React, { useState } from 'react';
import { 
  Bug, 
  Lightbulb, 
  Plus, 
  Trash2, 
  ChevronDown, 
  AlertCircle, 
  Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BugTracker = ({ bugs, onAdd, onDelete }) => {
  const [newBug, setNewBug] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newBug.trim()) {
      onAdd(newBug.trim());
      setNewBug('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 lg:p-8 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
          <Bug size={18} className="text-red-500" />
          Bug Tracker
        </h3>
        <span className="px-3 py-1 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest">
          {bugs.length} Issues
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative group mb-8">
        <input 
          type="text" 
          placeholder="Log an issue..."
          className="w-full pl-6 pr-14 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-red-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm font-medium"
          value={newBug}
          onChange={(e) => setNewBug(e.target.value)}
        />
        <button 
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
        >
          <Plus size={18} />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {bugs.map((bug) => (
            <motion.div 
              key={bug.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-50 dark:border-slate-700/50 hover:border-red-100 dark:hover:border-red-500/20 shadow-sm transition-all"
            >
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500">
                <AlertCircle size={14} />
              </div>
              <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {bug.text}
              </p>
              <button 
                onClick={() => onDelete(bug.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {bugs.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest dark:text-slate-500">Zero Issues Detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

const IdeasPanel = ({ ideas, onAdd, onDelete }) => {
  const [newIdea, setNewIdea] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newIdea.trim()) {
      onAdd(newIdea.trim());
      setNewIdea('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 lg:p-8 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
          <Lightbulb size={18} className="text-purple-500" />
          Feature Ideas
        </h3>
        <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase tracking-widest">
          {ideas.length} Items
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative group mb-8">
        <input 
          type="text" 
          placeholder="Log a feature concept..."
          className="w-full pl-6 pr-14 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-purple-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm font-medium"
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
        />
        <button 
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-purple-500 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-600 transition-all active:scale-95"
        >
          <Plus size={18} />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {ideas.map((idea) => (
            <motion.div 
              key={idea.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-50 dark:border-slate-700/50 hover:border-purple-100 dark:hover:border-purple-500/20 shadow-sm transition-all"
            >
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-500">
                <Zap size={14} />
              </div>
              <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {idea.text}
              </p>
              <button 
                onClick={() => onDelete(idea.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {ideas.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest dark:text-slate-500">No Concepts Logged</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { BugTracker, IdeasPanel };
