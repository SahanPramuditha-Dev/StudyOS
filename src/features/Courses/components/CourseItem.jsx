import React from 'react';
import { 
  Edit2, 
  Trash2, 
  ExternalLink, 
  BookOpen, 
  Clock, 
  FolderOpen 
} from 'lucide-react';
import { motion } from 'framer-motion';

const CourseItem = ({ course, onEdit, onDelete, onViewResources }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'Completed': return 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400';
      case 'Paused': return 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="card group flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(course.status)}`}>
          {course.status}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(course)} 
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-primary-500 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(course.id)} 
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 group-hover:text-primary-500 transition-colors line-clamp-1">
          {course.title}
        </h3>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
          <ExternalLink size={14} className="text-primary-500" />
          {course.platform}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {course.tags?.map((tag, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {course.trackingType === 'time' ? 'Time Spent' : course.trackingType === 'modules' ? 'Modules' : 'Mastery'}
          </span>
          <span className="text-sm font-black text-primary-500">
            {course.trackingType === 'time' ? `${course.timeTracking?.current || '0:00'}` : 
             course.trackingType === 'modules' ? `${course.moduleTracking?.completed || 0}/${course.moduleTracking?.total || 0}` : 
             `${course.progress}%`}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${course.progress}%` }}
            className="h-full bg-primary-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"
          />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <BookOpen size={14} className="text-primary-500" />
              {course.category}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Clock size={14} className="text-primary-500" />
              {course.difficulty}
            </div>
          </div>
          <button 
            onClick={() => onViewResources(course)}
            className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all active:scale-95"
            title="View Associated Resources"
          >
            <FolderOpen size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseItem;
