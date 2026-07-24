import React from 'react';
import {
  Edit2,
  Trash2,
  Clock,
  MoreHorizontal,
  Check,
  CalendarDays,
  PlayCircle,
  CheckCircle2,
  PauseCircle,
  AlertTriangle,
  GripVertical,
  Flag,
  ListTodo
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskItem = ({
  task,
  onEdit,
  onDelete,
  onOpenDetail,
  onToggleArchive,
  onStatusChange,
  selected = false,
  onToggleSelect,
  viewMode = 'grid'
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300';
      case 'High':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
      case 'Medium':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300';
      case 'Low':
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'pending':
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  const formatDeadline = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(date);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let color = 'text-slate-500 dark:text-slate-400';
    let label = `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    if (diffDays < 0) {
      color = 'text-red-500 font-bold';
      label = `Overdue by ${Math.abs(diffDays)}d`;
    } else if (diffDays === 0) {
      color = 'text-amber-500 font-bold';
      label = 'Due Today';
    } else if (diffDays === 1) {
      color = 'text-amber-500 font-bold';
      label = 'Due Tomorrow';
    } else if (diffDays <= 3) {
      color = 'text-amber-500';
      label = `Due in ${diffDays}d`;
    }
    
    return { label, color, diffDays };
  };

  const deadlineConfig = formatDeadline(task.deadline);

  const closeMenu = (event) => {
    const detailsEl = event.currentTarget.closest('details');
    if (detailsEl) detailsEl.removeAttribute('open');
  };

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

  if (viewMode === 'list') {
    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="card group w-full flex items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-500/20 transition-all gap-4 relative"
      >
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
        >
          <GripVertical size={16} />
        </div>
        
        <button
          type="button"
          onClick={() => onToggleSelect?.(task.id)}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            selected
              ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent hover:border-primary-400'
          }`}
        >
          <Check size={12} />
        </button>

        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {task.type}
              </span>
              {task.type === 'exam' && deadlineConfig && (
                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/10 text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                  {deadlineConfig.diffDays >= 0 ? `${deadlineConfig.diffDays}d left` : 'Overdue'}
                </span>
              )}
              {task.marks > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/10 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  {task.marks} Marks
                </span>
              )}
              {task.subject && (
                <span className="text-xs font-bold text-slate-400 truncate max-w-[120px]">
                  {task.subject}
                </span>
              )}
            </div>
            <h3 
              onClick={() => onOpenDetail?.(task)}
              className="text-base font-black text-slate-800 dark:text-white hover:text-primary-500 cursor-pointer truncate"
            >
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-4 shrink-0 flex-wrap md:flex-nowrap">
            {totalSubtasks > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-xl border border-slate-100 dark:border-slate-800">
                <ListTodo size={14} className="text-primary-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
            )}

            {deadlineConfig && (
              <div className={`flex items-center gap-1.5 text-xs font-bold ${deadlineConfig.color}`}>
                <CalendarDays size={14} />
                <span>{deadlineConfig.label}</span>
              </div>
            )}

            {task.estimatedHours > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                <Clock size={14} className="text-primary-500" />
                <span>{task.estimatedHours}h</span>
              </div>
            )}

            <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${getPriorityColor(task.priority || 'Medium')}`}>
              <Flag size={11} className="inline mr-1" />
              {task.priority || 'Medium'}
            </div>

            <div className="w-24 shrink-0 flex items-center gap-2">
              <span className="text-xs font-black text-primary-500">{task.progress}%</span>
              <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${task.progress}%` }} />
              </div>
            </div>

            {task.status !== 'completed' ? (
              <button
                onClick={() => onStatusChange?.(task.id, task.status === 'pending' ? 'in_progress' : 'completed')}
                className={`p-2 rounded-xl transition-colors ${
                  task.status === 'pending'
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                }`}
              >
                {task.status === 'pending' ? <PlayCircle size={16} /> : <CheckCircle2 size={16} />}
              </button>
            ) : (
              <button
                onClick={() => onStatusChange?.(task.id, 'in_progress')}
                className="p-2 rounded-xl text-slate-400 hover:text-primary-500 transition-colors"
                title="Reopen task"
              >
                <CheckCircle2 size={16} className="text-emerald-500" />
              </button>
            )}
          </div>
        </div>

        <details className="relative shrink-0">
          <summary className="list-none cursor-pointer p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors [&::-webkit-details-marker]:hidden">
            <MoreHorizontal size={14} />
          </summary>
          <div className="absolute right-0 top-9 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-20 p-1.5 overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                onOpenDetail?.(task);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Details
            </button>
            <button
              type="button"
              onClick={(e) => {
                onEdit(task);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                onDelete(task.id);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </details>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card group flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-primary-200/70 dark:hover:border-primary-500/30 transition-all relative"
    >
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
          >
            <GripVertical size={16} />
          </div>
          <button
            type="button"
            onClick={() => onToggleSelect?.(task.id)}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              selected
                ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent hover:border-primary-400'
            }`}
          >
            <Check size={12} />
          </button>
          <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </div>
          <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${getPriorityColor(task.priority || 'Medium')}`}>
            <Flag size={11} className="inline mr-1" />
            {task.priority || 'Medium'}
          </div>
          {task.type === 'exam' && deadlineConfig && (
            <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
              {deadlineConfig.diffDays >= 0 ? `${deadlineConfig.diffDays} days left` : 'Overdue'}
            </div>
          )}
          {task.marks > 0 && (
            <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              {task.marks} Marks
            </div>
          )}
        </div>

        <details className="relative">
          <summary className="list-none cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors [&::-webkit-details-marker]:hidden">
            <MoreHorizontal size={16} />
          </summary>
          <div className="absolute right-0 top-11 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-20 p-1.5 overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                onOpenDetail?.(task);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Details
            </button>
            <button
              type="button"
              onClick={(e) => {
                onEdit(task);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                onDelete(task.id);
                closeMenu(e);
              }}
              className="w-full px-3 py-2 rounded-lg text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </details>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-slate-800/30">
            {task.type}
          </span>
          <h3 
            onClick={() => onOpenDetail?.(task)}
            className="text-xl font-black text-slate-800 dark:text-white mt-2 mb-1 line-clamp-2 hover:text-primary-500 cursor-pointer"
          >
            {task.title}
          </h3>
          {task.subject && (
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {task.subject}
            </p>
          )}
        </div>

        {deadlineConfig && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deadline</span>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${deadlineConfig.color}`}>
              <CalendarDays size={13} />
              <span>{deadlineConfig.label}</span>
            </div>
          </div>
        )}

        {task.estimatedHours > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Est. Time</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Clock size={13} className="text-primary-500" />
              {task.estimatedHours}h
            </span>
          </div>
        )}

        {totalSubtasks > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <ListTodo size={13} className="text-primary-500" />
              Checklist
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {completedSubtasks} of {totalSubtasks}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Progress</span>
          <span className="text-sm font-black text-primary-500">{task.progress}%</span>
        </div>

        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
            className="h-full bg-primary-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          {task.status !== 'completed' ? (
            <button
              onClick={() => onStatusChange?.(task.id, task.status === 'pending' ? 'in_progress' : 'completed')}
              className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                task.status === 'pending'
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {task.status === 'pending' ? (
                <>
                  <PlayCircle size={14} /> Start
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Finish
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => onStatusChange?.(task.id, 'in_progress')}
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={14} className="text-emerald-500" />
              Reopen Task
            </button>
          )}
          
          <button
            onClick={() => onOpenDetail?.(task)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskItem;
