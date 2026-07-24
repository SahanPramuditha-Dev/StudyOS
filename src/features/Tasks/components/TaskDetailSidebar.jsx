import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  StickyNote,
  Trash2,
  Clock,
  Layout,
  BarChart,
  Flag,
  Activity,
  Plus,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '../../../components/ui/Select';
import { nanoid } from 'nanoid';

// Circular progress ring
const ProgressRing = ({ progress, size = 60, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center animate-in fade-in" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-200 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary-500 transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-black text-slate-700 dark:text-slate-200">{progress}%</span>
    </div>
  );
};

const TaskDetailSidebar = ({
  task,
  onClose,
  onUpdateTask,
  onEdit,
  onDelete
}) => {
  if (!task) return null;

  const [activeTab, setActiveTab] = useState('overview');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [noteContent, setNoteContent] = useState(task.description || '');
  const [logTimeStr, setLogTimeStr] = useState('');
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);

  // Pomodoro timer effect
  React.useEffect(() => {
    let interval = null;
    if (pomoRunning) {
      interval = setInterval(() => {
        setPomoTime((prev) => {
          if (prev <= 1) {
            setPomoRunning(false);
            clearInterval(interval);
            toast.success("Pomodoro session completed! Take a break.");
            
            const logEntry = {
              id: nanoid(),
              type: 'time',
              message: 'Completed 25-minute Pomodoro focus session',
              createdAt: new Date().toISOString()
            };
            saveTaskField({
              activityLog: [logEntry, ...(task.activityLog || [])]
            });
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [pomoRunning]);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'subtasks', label: 'Subtasks' },
    { id: 'notes', label: 'Notes' },
    { id: 'pomodoro', label: 'Pomodoro' },
    { id: 'activity', label: 'Activity' }
  ];

  const getPriorityWeight = (p) => {
    if (p === 'Critical') return 'from-rose-500 to-red-600';
    if (p === 'High') return 'from-amber-500 to-orange-600';
    if (p === 'Medium') return 'from-sky-500 to-blue-600';
    return 'from-slate-500 to-slate-700';
  };

  const bannerGradient = getPriorityWeight(task.priority);

  // Auto-save changes helper
  const saveTaskField = (updates) => {
    const updated = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    onUpdateTask(updated);
  };

  const handleToggleSubtask = (subtaskId) => {
    const nextSubtasks = (task.subtasks || []).map(s => {
      if (s.id === subtaskId || s.title === subtaskId) { // Handles both nanoid and simple string matching
        const nextState = !s.completed;
        return { ...s, completed: nextState };
      }
      return s;
    });

    const progress = nextSubtasks.length > 0 
      ? Math.round((nextSubtasks.filter(s => s.completed).length / nextSubtasks.length) * 100)
      : task.progress;

    const status = progress === 100 && nextSubtasks.length > 0 ? 'completed' : (progress > 0 ? 'in_progress' : task.status);

    // Activity Log Entry
    const targetSub = nextSubtasks.find(s => s.id === subtaskId || s.title === subtaskId);
    const activityMsg = `Subtask "${targetSub.title}" marked as ${targetSub.completed ? 'completed' : 'incomplete'}`;
    const activityEntry = {
      id: nanoid(),
      type: 'subtask',
      message: activityMsg,
      createdAt: new Date().toISOString()
    };

    saveTaskField({
      subtasks: nextSubtasks,
      progress,
      status,
      activityLog: [activityEntry, ...(task.activityLog || [])]
    });
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub = {
      id: nanoid(),
      title: newSubtaskTitle.trim(),
      completed: false
    };

    const nextSubtasks = [...(task.subtasks || []), newSub];
    const progress = Math.round((nextSubtasks.filter(s => s.completed).length / nextSubtasks.length) * 100);
    const status = progress === 100 ? 'completed' : (progress > 0 ? 'in_progress' : task.status);

    const activityEntry = {
      id: nanoid(),
      type: 'subtask',
      message: `Subtask "${newSub.title}" added`,
      createdAt: new Date().toISOString()
    };

    saveTaskField({
      subtasks: nextSubtasks,
      progress,
      status,
      activityLog: [activityEntry, ...(task.activityLog || [])]
    });
    setNewSubtaskTitle('');
    toast.success('Subtask added');
  };

  const handleSaveNotes = () => {
    saveTaskField({
      description: noteContent,
      activityLog: [{
        id: nanoid(),
        type: 'notes',
        message: 'Task notes updated',
        createdAt: new Date().toISOString()
      }, ...(task.activityLog || [])]
    });
    toast.success('Notes saved');
  };

  const handleLogTime = (e) => {
    e.preventDefault();
    if (!logTimeStr.trim()) return;

    const activityEntry = {
      id: nanoid(),
      type: 'time',
      message: `Logged work session: ${logTimeStr.trim()}`,
      createdAt: new Date().toISOString()
    };

    saveTaskField({
      activityLog: [activityEntry, ...(task.activityLog || [])]
    });
    setLogTimeStr('');
    toast.success('Time logged');
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-[800px] h-[85vh] max-h-[800px] bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Banner Header */}
        <div className={`relative h-28 bg-gradient-to-r ${bannerGradient} shrink-0`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent" />
          
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button 
              onClick={() => onEdit(task)} 
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white shadow-lg backdrop-blur-md transition-all"
              title="Edit Task"
            >
              <FileText size={16} />
            </button>
            <button 
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
              className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 border border-rose-400/50 text-white shadow-lg backdrop-blur-md transition-all"
              title="Delete Task"
            >
              <Trash2 size={16} />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 text-white shadow-lg backdrop-blur-md transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Title Block */}
        <div className="px-8 pb-4 -mt-10 relative z-10 shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-lg border border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                  {task.type}
                </span>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mt-1 truncate">
                  {task.title}
                </h2>
                {task.subject && (
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">
                    Subject: {task.subject}
                  </p>
                )}
              </div>
              <div className="text-primary-500 shrink-0">
                <ProgressRing progress={task.progress || 0} size={50} />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 flex items-center gap-1">
                <Activity size={10} /> Status: {task.status.replace('_', ' ')}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-[9px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 flex items-center gap-1">
                <Flag size={10} /> Priority: {task.priority || 'Medium'}
              </span>
              {task.deadline && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <CalendarDays size={10} /> Due: {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-8 pb-3 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors z-10 ${
                  activeTab === tab.id ? 'text-primary-600 dark:text-primary-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabDetails"
                    className="absolute inset-0 bg-primary-50 dark:bg-primary-500/20 rounded-lg -z-10 border border-primary-100 dark:border-primary-500/30"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Contents */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary Card row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Subtasks</p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-100">
                        {task.subtasks?.filter(s => s.completed).length || 0} / {task.subtasks?.length || 0}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Time Logged</p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                        <Clock size={14} className="text-primary-500" />
                        {task.activityLog?.filter(l => l.type === 'time').length || 0} logs
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Priority</p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-100">
                        {task.priority || 'Medium'}
                      </p>
                    </div>
                  </div>

                  {/* Task Description */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Notes & Details</h4>
                    {task.description ? (
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {task.description}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-slate-400 italic">No notes added. Head to the Notes tab to add notes.</p>
                    )}
                  </div>

                  {/* Log Time Worked */}
                  <form onSubmit={handleLogTime} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Log Time / Study Session</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={logTimeStr}
                        onChange={(e) => setLogTimeStr(e.target.value)}
                        placeholder="e.g. Worked for 2 hours reading SE Scrum"
                        className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none text-slate-800 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                      >
                        Log
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'subtasks' && (
                <div className="space-y-6">
                  {/* Checklist Items */}
                  <div className="space-y-2">
                    {(task.subtasks || []).length === 0 ? (
                      <div className="p-8 text-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                        <AlertCircle className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
                        <p className="text-sm font-bold text-slate-500">No subtasks added yet.</p>
                      </div>
                    ) : (
                      (task.subtasks || []).map((sub, i) => (
                        <div
                          key={sub.id || i}
                          onClick={() => handleToggleSubtask(sub.id || sub.title)}
                          className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer hover:border-primary-300 transition-all select-none"
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            sub.completed
                              ? 'bg-primary-500 border-primary-500 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent'
                          }`}>
                            <Check size={12} />
                          </div>
                          <span className={`text-sm font-semibold flex-1 ${sub.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                            {sub.title}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Subtask */}
                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add another subtask..."
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-800 dark:text-white font-semibold text-sm"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write down any notes, thoughts, resource links, or progress reports for this task..."
                    rows={12}
                    className="w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-800 dark:text-white font-semibold text-sm leading-relaxed resize-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'pomodoro' && (
                <div className="space-y-6 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Pomodoro Focus Timer</h4>
                  
                  <div className="text-6xl font-black text-slate-800 dark:text-white font-mono my-4 tracking-wider">
                    {Math.floor(pomoTime / 60).toString().padStart(2, '0')}:{(pomoTime % 60).toString().padStart(2, '0')}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setPomoRunning(!pomoRunning)}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all text-white ${
                        pomoRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-500 hover:bg-primary-600'
                      }`}
                    >
                      {pomoRunning ? 'Pause' : 'Start Focus'}
                    </button>
                    <button
                      onClick={() => {
                        setPomoRunning(false);
                        setPomoTime(25 * 60);
                      }}
                      className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Reset
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 font-semibold text-center mt-4">
                    Focus for 25 minutes on "{task.title}". Completing a session automatically logs work time!
                  </p>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">History & Activity Logs</h4>
                  <div className="space-y-3">
                    {(task.activityLog || []).length === 0 ? (
                      <p className="text-sm font-bold text-slate-400 italic">No activity recorded yet.</p>
                    ) : (
                      (task.activityLog || []).map((log, i) => (
                        <div key={log.id || i} className="flex gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-primary-500 shrink-0">
                            <Activity size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{log.message}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default TaskDetailSidebar;
