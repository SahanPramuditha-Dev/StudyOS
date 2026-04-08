import React from 'react';
import { 
  Bell, 
  Trash2, 
  MessageSquare, 
  Calendar,
  CheckCircle2,
  Edit3,
  RefreshCcw,
  Zap,
  Mail,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toReminderDateTime } from '../../../utils/reminderDate';

const ReminderItem = ({ reminder, onToggle, onDelete, onMarkDone, onEdit, linkedCourseTitle }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-500 bg-red-50 dark:bg-red-500/10';
      case 'Medium': return 'text-orange-500 bg-orange-50 dark:bg-orange-500/10';
      case 'Low': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
      default: return 'text-slate-400 bg-slate-50 dark:bg-slate-800';
    }
  };

  const reminderAt = toReminderDateTime(reminder.date, reminder.time);
  const isOverdue = !reminder.completed && reminderAt ? reminderAt < new Date() : false;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`card group flex items-center justify-between p-6 transition-all ${
        !reminder.enabled ? 'opacity-60 grayscale' : ''
      } ${reminder.completed ? 'bg-green-50/30 dark:bg-green-500/5 border-green-100 dark:border-green-500/20' : ''}`}
    >
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
          reminder.completed ? 'bg-green-100 text-green-600' : 
          reminder.enabled ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-400'
        }`}>
          {reminder.completed ? <CheckCircle2 size={28} /> : <Bell size={28} className={reminder.enabled ? 'animate-pulse' : ''} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 className={`text-xl font-black truncate ${reminder.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
              {reminder.time}
            </h3>
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getPriorityColor(reminder.priority)}`}>
              {reminder.priority}
            </span>
            {isOverdue && !reminder.completed && (
              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-500 text-white animate-bounce">
                Overdue
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
              <MessageSquare size={14} className="shrink-0" />
              {reminder.message}
            </p>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={12} />
              {reminderAt ? reminderAt.toLocaleDateString() : reminder.date}
            </span>
            {reminder.category && (
              <span className="text-[9px] font-black text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                #{reminder.category}
              </span>
            )}
            {reminder.recurring && reminder.recurring !== 'None' && (
              <span className="text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
                <RefreshCcw size={10} />
                {reminder.recurring}
              </span>
            )}
            {reminder.snoozeEnabled && (
              <span className="text-[9px] font-black text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
                <Zap size={10} />
                Snooze
              </span>
            )}
            {reminder.sendEmail && (
              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
                <Mail size={10} />
                Email
              </span>
            )}
            {linkedCourseTitle && (
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
                <BookOpen size={10} />
                {linkedCourseTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {!reminder.completed && (
          <button 
            onClick={() => onEdit(reminder)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-300 hover:text-primary-500 hover:border-primary-200 transition-all active:scale-90 shadow-sm"
            title="Edit Reminder"
          >
            <Edit3 size={20} />
          </button>
        )}
        {!reminder.completed && (
          <button 
            onClick={() => onMarkDone(reminder.id)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-300 hover:text-green-500 hover:border-green-200 transition-all active:scale-90 shadow-sm"
            title="Mark as Done"
          >
            <CheckCircle2 size={20} />
          </button>
        )}
        <button 
          onClick={() => onToggle(reminder.id)}
          className={`relative w-12 h-6 rounded-full transition-colors ${reminder.enabled ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${reminder.enabled ? 'left-7' : 'left-1'}`} />
        </button>
        <button 
          onClick={() => onDelete(reminder.id)}
          className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-300 hover:text-red-500 transition-colors active:scale-90"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default ReminderItem;
