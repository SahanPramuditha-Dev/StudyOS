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
  Timer,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProjectItem = ({ project, onDelete, onEdit, onOpenWorkspace, isSelected, onSelect }) => {
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
  const storageUsage = (project.files || []).reduce((acc, f) => acc + (f.size || 0), 0) || 0;
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
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="glass group relative flex flex-col p-6 rounded-[2rem] hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(project.id);
            }}
            className={`w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-black transition-all ${
              isSelected
                ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent hover:border-primary-400'
            }`}
            aria-label={`Select ${project.name}`}
          >
            ✓
          </button>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all shadow-sm">
            <Code size={20} />
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 ml-4">
          <button 
            onClick={() => onEdit(project)}
            className="p-2 rounded-xl text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Edit Project"
          >
            <Edit3 size={14} />
          </button>
          <button 
            onClick={() => onDelete(project.id)}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Delete Project"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg font-black text-slate-800 dark:text-white line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-500 group-hover:to-purple-500 transition-all" title={project.name}>
              {project.name}
            </h4>
            {project.subject && (
              <span className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[9px] font-black uppercase tracking-widest shadow-sm">
                {project.subject}
              </span>
            )}
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {project.stack || 'No Stack Defined'}
          </p>
        </div>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[40px] leading-relaxed">
          {project.description || 'No description provided for this architectural vision.'}
        </p>

        <div className="flex items-center gap-2 flex-wrap mt-auto">
          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 ${getPriorityColor(project.priority)}`}>
            <AlertCircle size={10} />
            {project.priority}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-400">
            <Database size={10} />
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
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400">
                  <Timer size={12} />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deadline</span>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${deadlineInfo.color}`}>
                {deadlineInfo.text}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 mt-auto">
          <button 
            onClick={() => onOpenWorkspace(project.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 hover:bg-primary-500 hover:text-white text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 hover:shadow-lg hover:shadow-primary-500/25 group/btn"
          >
            <LayoutGrid size={14} className="transition-transform group-hover/btn:scale-110" />
            View Details
            <ExternalLink size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
          {project.repo && (
            <a 
              href={project.repo} 
              target="_blank" 
              rel="noreferrer"
              className="w-[56px] flex items-center justify-center rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-800 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 text-slate-700 dark:text-slate-200 transition-all active:scale-95 hover:shadow-lg group/gh"
              title="View on GitHub"
            >
              <Github size={18} className="transition-transform group-hover/gh:scale-110" />
            </a>
          )}
        </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectItem;
