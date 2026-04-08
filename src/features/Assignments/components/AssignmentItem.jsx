import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  Edit,
  ChevronRight,
  Calendar,
  Users,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

const AssignmentItem = ({ assignment, onEdit, onDelete, onOpen, courses = [] }) => {
  // Calculate days until deadline
  const daysUntilDeadline = useMemo(() => {
    if (!assignment.deadline) return null;
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diff;
  }, [assignment.deadline]);

  // Get deadline status
  const getDeadlineStatus = () => {
    if (!daysUntilDeadline) return { label: 'No deadline', color: 'text-slate-400' };
    if (daysUntilDeadline < 0) return { label: 'Overdue', color: 'text-red-500' };
    if (daysUntilDeadline === 0) return { label: 'Due Today!', color: 'text-red-500' };
    if (daysUntilDeadline === 1) return { label: 'Due Tomorrow', color: 'text-yellow-500' };
    if (daysUntilDeadline <= 7) return { label: `${daysUntilDeadline} days left`, color: 'text-yellow-500' };
    return { label: `${daysUntilDeadline} days left`, color: 'text-green-500' };
  };

  // Get status icon and color
  const getStatusConfig = () => {
    const configs = {
      'Not Started': { icon: AlertCircle, color: 'text-slate-500', bg: 'bg-slate-50' },
      'In Progress': { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
      'Submitted': { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
      'Late': { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' }
    };
    return configs[assignment.status] || configs['Not Started'];
  };

  const statusConfig = getStatusConfig();
  const deadlineStatus = getDeadlineStatus();
  const StatusIcon = statusConfig.icon;
  
  // Get related course info
  const courseName = assignment.courseId 
    ? courses.find(c => c.id === assignment.courseId)?.title 
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
    >
      {/* Header with gradient overlay */}
      <div className="h-24 bg-gradient-to-br from-blue-400 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => onEdit(assignment)}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all opacity-0 group-hover:opacity-100"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(assignment.id)}
            className="p-2 rounded-lg bg-white/20 hover:bg-red-500/30 text-white transition-all opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-5">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-800 dark:text-white line-clamp-2 group-hover:text-blue-500 transition-colors cursor-pointer"
                onClick={() => onOpen(assignment.id)}>
              {assignment.title}
            </h3>
          </div>
          <div className={`p-2 rounded-lg ${statusConfig.bg} dark:bg-opacity-20`}>
            <StatusIcon size={18} className={statusConfig.color} />
          </div>
        </div>

        {/* Subject and Lecturer */}
        <div className="space-y-2">
          {courseName && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              📚 {courseName}
            </p>
          )}
          {assignment.subject && (
            <p className="text-[12px] font-bold uppercase tracking-widest text-slate-500">
              {assignment.subject}
            </p>
          )}
          {assignment.lecturer && (
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">{assignment.lecturer}</span>
            </div>
          )}
        </div>

        {/* Marks */}
        {assignment.marks && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
            <Award size={14} className="text-amber-500" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{assignment.marks} marks</span>
          </div>
        )}

        {/* Deadline */}
        {assignment.deadline && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className={deadlineStatus.color} />
              <span className={`font-bold ${deadlineStatus.color}`}>
                {deadlineStatus.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 ml-6">
              {new Date(assignment.deadline).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}

        {/* Description Preview */}
        {assignment.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {assignment.description}
          </p>
        )}

        {/* Progress Bar - based on submissions */}
        {assignment.submissions && assignment.submissions.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Submissions</span>
              <span className="font-black text-slate-700 dark:text-slate-300">{assignment.submissions.length}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  assignment.status === 'Submitted' ? 'bg-green-500' :
                  assignment.status === 'In Progress' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min((assignment.submissions.length / 3) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Files Count */}
        {assignment.files && assignment.files.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
            {assignment.files.length} {assignment.files.length === 1 ? 'file' : 'files'}
          </div>
        )}

        {/* Open Button */}
        <button
          onClick={() => onOpen(assignment.id)}
          className="w-full mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-sm uppercase tracking-widest transition-all group/btn"
        >
          Open Assignment
          <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default AssignmentItem;
