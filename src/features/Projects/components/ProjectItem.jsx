import React from 'react';
import { 
  Code, 
  Github, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  LayoutGrid,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
  Database,
  Timer
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProjectItem = ({ project, onDelete, onEdit, onOpenWorkspace }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Ongoing': return 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400';
      case 'Submitted': return 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400';
      case 'Completed': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
      case 'Archived': return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-amber-500';
      case 'Low': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  };

  const taskCount = project.board ? (
    (project.board.todo?.length || 0) + 
    (project.board.doing?.length || 0) + 
    (project.board.done?.length || 0)
  ) : 0;

  const completedTasks = project.board?.done?.length || 0;
  const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

  // Storage usage calculation (mock or real)
  const storageUsage = project.files?.reduce((acc, f) => acc + (f.size || 0), 0) || 0;
  const storageMB = (storageUsage / (1024 * 1024)).toFixed(2);

  // Deadline countdown
  const getDeadlineInfo = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: 'Overdue', color: 'text-red-500' };
    if (days === 0) return { text: 'Due Today', color: 'text-orange-500' };
    return { text: `${days} days left`, color: 'text-slate-400' };
  };

  const deadlineInfo = getDeadlineInfo(project.deadline);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-100 dark:hover:border-primary-500/20 transition-all duration-500"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500">
            <Code size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-primary-500 transition-colors">
                {project.name}
              </h3>
              {project.subject && (
                <span className="px-2 py-0.5 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-500 text-[9px] font-black uppercase tracking-widest">
                  {project.subject}
                </span>
              )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {project.stack || 'No Stack Defined'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
          <button 
            onClick={() => onEdit(project)}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
            title="Edit Project"
          >
            <Edit3 size={18} />
          </button>
          <button 
            onClick={() => onDelete(project.id)}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Delete Project"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[40px]">
          {project.description || 'No description provided for this architectural vision.'}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 ${getPriorityColor(project.priority)}`}>
            <AlertCircle size={12} />
            {project.priority}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-400">
            <Database size={12} />
            {storageMB} MB
          </span>
        </div>

        {/* Progress & Deadline Section */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Execution: {completedTasks}/{taskCount} Tasks
              </span>
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-white">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full rounded-full ${
                progress === 100 ? 'bg-green-500' : 'bg-primary-500'
              }`}
            />
          </div>

          {deadlineInfo && (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400">
                  <Timer size={14} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${deadlineInfo.color}`}>
                {deadlineInfo.text}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={() => onOpenWorkspace(project.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/20 hover:bg-primary-600 hover:shadow-primary-500/30 transition-all active:scale-95 group"
          >
            <LayoutGrid size={16} />
            View Details
            <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
          {project.repo && (
            <a 
              href={project.repo} 
              target="_blank" 
              rel="noreferrer"
              className="px-5 flex items-center justify-center rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
              title="View on GitHub"
            >
              <Github size={18} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectItem;
