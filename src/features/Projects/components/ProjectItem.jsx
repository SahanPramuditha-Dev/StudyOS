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
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProjectItem = ({ project, onDelete, onEdit, onOpenWorkspace }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400';
      case 'Completed': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
      case 'Paused': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
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
            <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-primary-500 transition-colors">
              {project.name}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
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
          {project.deadline && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-400">
              <Calendar size={12} />
              {new Date(project.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Progress: {completedTasks}/{taskCount} Tasks
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
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            onClick={() => onOpenWorkspace(project.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-600 hover:shadow-primary-500/30 transition-all active:scale-95"
          >
            <LayoutGrid size={16} />
            Open Workspace
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
