import React from 'react';
import { 
  Trash2, 
  ExternalLink, 
  Star, 
  CheckCircle2, 
  FileText, 
  File, 
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PaperItem = ({ 
  paper, 
  onDelete, 
  onToggleImportant, 
  onToggleCompleted, 
  onUpdateProgress, 
  onUpdateSummary,
  isExpanded,
  onToggleExpand
}) => {
  const progress = Math.round((paper.readPages / paper.pages) * 100) || 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group bg-white dark:bg-slate-900 border ${
        paper.important 
          ? 'border-orange-100 dark:border-orange-500/20 shadow-orange-500/5' 
          : 'border-slate-100 dark:border-slate-800 shadow-sm'
      } rounded-[2rem] overflow-hidden transition-all hover:shadow-xl`}
    >
      <div className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Icon & Title Section */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
              paper.completed 
                ? 'bg-green-50 dark:bg-green-500/10 text-green-500' 
                : paper.important 
                  ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}>
              {paper.type === 'PDF' ? <FileText size={28} /> : paper.type === 'Slide' ? <BookOpen size={28} /> : <File size={28} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className={`text-lg font-black truncate transition-colors ${
                  paper.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'
                }`}>
                  {paper.name}
                </h3>
                {paper.important && <Star size={16} className="fill-orange-500 text-orange-500 shrink-0" />}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  {paper.type}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {paper.readPages} / {paper.pages} Pages
                </span>
                {paper.completed && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-md">
                    Finished
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress & Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-6 lg:w-auto">
            <div className="flex flex-col gap-2 w-full sm:w-48">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{progress}%</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">Reading</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={`h-full rounded-full ${
                    paper.completed ? 'bg-green-500' : 'bg-primary-500 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                  }`}
                />
              </div>
              <input 
                type="range"
                min="0"
                max={paper.pages}
                value={paper.readPages}
                onChange={(e) => onUpdateProgress(paper.id, parseInt(e.target.value))}
                className="w-full h-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer accent-primary-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => onToggleImportant(paper.id)}
                className={`p-2.5 rounded-xl transition-all active:scale-90 ${
                  paper.important ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500' : 'text-slate-300 hover:text-orange-500'
                }`}
                title="Mark Important"
              >
                <Star size={20} fill={paper.important ? 'currentColor' : 'none'} />
              </button>
              <button 
                onClick={() => onToggleCompleted(paper.id)}
                className={`p-2.5 rounded-xl transition-all active:scale-90 ${
                  paper.completed ? 'bg-green-50 dark:bg-green-500/10 text-green-500' : 'text-slate-300 hover:text-green-500'
                }`}
                title="Mark Completed"
              >
                <CheckCircle2 size={20} />
              </button>
              <a 
                href={paper.url} 
                target="_blank" 
                rel="noreferrer"
                className="p-2.5 rounded-xl text-slate-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all active:scale-90"
                title="Open Resource"
              >
                <ExternalLink size={20} />
              </a>
              <button 
                onClick={() => onDelete(paper.id)}
                className="p-2.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90"
                title="Archive Paper"
              >
                <Trash2 size={20} />
              </button>
              <button 
                onClick={onToggleExpand}
                className={`p-2.5 rounded-xl transition-all ${isExpanded ? 'bg-slate-100 dark:bg-slate-800 text-primary-500 rotate-180' : 'text-slate-300 hover:text-slate-500'}`}
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Summary Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-8 mt-6 border-t border-slate-50 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <MessageSquare size={14} className="text-primary-500" />
                  Knowledge Summary
                </div>
                <textarea 
                  className="w-full p-6 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed min-h-[150px] transition-all"
                  placeholder="Synthesize the key takeaways from this paper..."
                  value={paper.summary || ''}
                  onChange={(e) => onUpdateSummary(paper.id, e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PaperItem;
