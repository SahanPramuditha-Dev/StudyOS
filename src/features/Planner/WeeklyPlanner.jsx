import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Plus,
  Move,
  CheckCircle2,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Clock,
  Tag,
  Flag,
  Play,
  BookmarkCheck,
  Edit3,
  BarChart2,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { autoScheduleWeek } from '../../services/aiService';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';
import AIStudyPlannerWizard from './AIStudyPlannerWizard';
import TaskEditModal from './components/TaskEditModal';
import SavedPlansModal from './components/SavedPlansModal';

const DAYS = [
  { id: 'monday', label: 'Mon', full: 'Monday' },
  { id: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { id: 'thursday', label: 'Thu', full: 'Thursday' },
  { id: 'friday', label: 'Fri', full: 'Friday' },
  { id: 'saturday', label: 'Sat', full: 'Saturday' },
  { id: 'sunday', label: 'Sun', full: 'Sunday' }
];

const PRIORITIES = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent' }
];

const toDateKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
    2,
    '0'
  )}`;
};

const getMonday = (base = new Date(), weekOffset = 0) => {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateRange = (mondayDate) => {
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(sundayDate.getDate() + 6);
  const options = { month: 'short', day: 'numeric' };
  const startStr = mondayDate.toLocaleDateString('en-US', options);
  const endStr = sundayDate.toLocaleDateString('en-US', { ...options, year: 'numeric' });
  return `${startStr} - ${endStr}`;
};

const getDayDateLabel = (mondayDate, dayIndex) => {
  const d = new Date(mondayDate);
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const createEmptyColumns = () =>
  DAYS.reduce((acc, day) => {
    acc[day.id] = [];
    return acc;
  }, {});

const priorityBadgeStyles = {
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-200 dark:border-rose-900/50',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-900/50',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-900/50',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
};

const WeeklyPlanner = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const activeMonday = useMemo(() => getMonday(new Date(), weekOffset), [weekOffset]);
  const currentWeekStart = useMemo(() => toDateKey(activeMonday), [activeMonday]);

  const [planner, setPlanner] = useStorage(STORAGE_KEYS.WEEKLY_PLANNER, {
    weekStart: currentWeekStart,
    columns: createEmptyColumns()
  });
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [, setFocusTask] = useStorage('studyos_active_focus_task', null);

  const [isScheduling, setIsScheduling] = useState(false);
  const [dragging, setDragging] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('monday');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [duration, setDuration] = useState('30');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Modals
  const [wizardOpen, setWizardOpen] = useState(false);
  const [savedPlansOpen, setSavedPlansOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const normalized = useMemo(() => {
    const p = planner && typeof planner === 'object' ? planner : {};
    const columns = { ...createEmptyColumns(), ...(p.columns || {}) };
    return {
      weekStart: typeof p.weekStart === 'string' ? p.weekStart : currentWeekStart,
      columns
    };
  }, [planner, currentWeekStart]);

  // Carry forward uncompleted tasks when week rolls over
  useEffect(() => {
    if (weekOffset === 0 && normalized.weekStart !== currentWeekStart) {
      const carryTasks = [];
      Object.values(normalized.columns).forEach((list) => {
        (list || []).forEach((task) => {
          if (!task?.done) {
            carryTasks.push({
              ...task,
              carryForwarded: true
            });
          }
        });
      });

      setPlanner({
        weekStart: currentWeekStart,
        columns: {
          ...createEmptyColumns(),
          monday: carryTasks
        }
      });
    }
  }, [currentWeekStart, normalized.columns, normalized.weekStart, setPlanner, weekOffset]);

  // Extract distinct subjects for filtering
  const distinctSubjects = useMemo(() => {
    const set = new Set();
    Object.values(normalized.columns).forEach((list) => {
      (list || []).forEach((task) => {
        if (task?.subject) set.add(task.subject);
      });
    });
    return Array.from(set);
  }, [normalized.columns]);

  const addTask = () => {
    const clean = title.trim();
    if (!clean) return;
    const task = {
      id: `wk-${Date.now()}`,
      title: clean,
      subject: subject.trim(),
      priority,
      duration: parseInt(duration, 10) || 30,
      done: false,
      createdAt: new Date().toISOString()
    };

    setPlanner((prev) => {
      const safe = prev && typeof prev === 'object' ? prev : {};
      const cols = { ...createEmptyColumns(), ...(safe.columns || {}) };
      return {
        weekStart: currentWeekStart,
        columns: {
          ...cols,
          [day]: [task, ...(cols[day] || [])]
        }
      };
    });

    setTitle('');
    setSubject('');
  };

  const updateTask = (updatedTask, oldDayId, newDayId) => {
    setPlanner((prev) => {
      const safe = prev && typeof prev === 'object' ? prev : {};
      const cols = { ...createEmptyColumns(), ...(safe.columns || {}) };
      let sourceList = (cols[oldDayId] || []).filter((t) => t.id !== updatedTask.id);

      if (oldDayId === newDayId) {
        sourceList = (cols[oldDayId] || []).map((t) => (t.id === updatedTask.id ? updatedTask : t));
        return {
          weekStart: currentWeekStart,
          columns: {
            ...cols,
            [oldDayId]: sourceList
          }
        };
      }

      return {
        weekStart: currentWeekStart,
        columns: {
          ...cols,
          [oldDayId]: sourceList,
          [newDayId]: [updatedTask, ...(cols[newDayId] || [])]
        }
      };
    });
    toast.success('Task updated');
  };

  const moveTask = (fromDay, toDay, taskId) => {
    if (!fromDay || !toDay || fromDay === toDay) return;
    setPlanner((prev) => {
      const safe = prev && typeof prev === 'object' ? prev : {};
      const cols = { ...createEmptyColumns(), ...(safe.columns || {}) };
      const source = [...(cols[fromDay] || [])];
      const idx = source.findIndex((t) => t.id === taskId);
      if (idx < 0) return prev;
      const [task] = source.splice(idx, 1);
      return {
        weekStart: currentWeekStart,
        columns: {
          ...cols,
          [fromDay]: source,
          [toDay]: [{ ...task }, ...(cols[toDay] || [])]
        }
      };
    });
  };

  const toggleDone = (targetDay, taskId) => {
    setPlanner((prev) => {
      const safe = prev && typeof prev === 'object' ? prev : {};
      const cols = { ...createEmptyColumns(), ...(safe.columns || {}) };
      return {
        weekStart: currentWeekStart,
        columns: {
          ...cols,
          [targetDay]: (cols[targetDay] || []).map((task) =>
            task.id === taskId ? { ...task, done: !task.done } : task
          )
        }
      };
    });
  };

  const removeTask = (targetDay, taskId) => {
    setPlanner((prev) => {
      const safe = prev && typeof prev === 'object' ? prev : {};
      const cols = { ...createEmptyColumns(), ...(safe.columns || {}) };
      return {
        weekStart: currentWeekStart,
        columns: {
          ...cols,
          [targetDay]: (cols[targetDay] || []).filter((task) => task.id !== taskId)
        }
      };
    });
  };

  const handleStartFocus = (task) => {
    setFocusTask(task);
    toast.success(`Starting focus session for: ${task.title}`);
  };

  const handleAutoSchedule = async () => {
    setIsScheduling(true);
    const toastId = toast.loading('AI is analyzing and scheduling your tasks...');
    try {
      const tasksToSchedule = [];

      projects?.forEach((project) => {
        if (project.status === 'Ongoing' && project.board) {
          project.board.todo?.forEach((t) => tasksToSchedule.push(`Project (${project.name}): ${t.title}`));
          project.board.doing?.forEach((t) => tasksToSchedule.push(`Project (${project.name}): ${t.title}`));
        }
      });

      assignments?.forEach((assignment) => {
        if (assignment.status !== 'Completed') {
          tasksToSchedule.push(`Assignment: ${assignment.title}`);
        }
      });

      if (tasksToSchedule.length === 0) {
        toast.dismiss(toastId);
        toast.error('No pending project or assignment tasks found to schedule!');
        setIsScheduling(false);
        return;
      }

      const schedule = await autoScheduleWeek(tasksToSchedule);

      setPlanner((prev) => {
        const safe = prev && typeof prev === 'object' ? prev : {};
        const cols = { ...createEmptyColumns(), ...(safe.columns || {}) };

        Object.keys(schedule).forEach((dayKey) => {
          const aiTasks = (schedule[dayKey] || []).map((tTitle) => ({
            id: `wk-ai-${Date.now()}-${Math.random()}`,
            title: tTitle,
            priority: 'medium',
            duration: 45,
            done: false,
            createdAt: new Date().toISOString()
          }));

          if (cols[dayKey]) {
            cols[dayKey] = [...aiTasks, ...cols[dayKey]];
          }
        });

        return {
          weekStart: currentWeekStart,
          columns: cols
        };
      });

      toast.success('Schedule optimized!', { id: toastId });
    } catch (error) {
      toast.error('Failed to auto-schedule tasks', { id: toastId });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleApplyAIPlan = (planResult) => {
    if (!planResult || !planResult.weeklyRoadmap) return;
    const roadmap = planResult.weeklyRoadmap;

    setPlanner((prev) => {
      const safe = prev && typeof prev === 'object' ? prev : {};
      const cols = { ...createEmptyColumns(), ...(safe.columns || {}) };

      roadmap.forEach((item, index) => {
        const dayObj = DAYS[index % DAYS.length];
        const dayKey = dayObj.id;
        const newTask = {
          id: `wk-plan-${Date.now()}-${index}`,
          title: item,
          priority: index % 2 === 0 ? 'high' : 'medium',
          duration: 60,
          done: false,
          createdAt: new Date().toISOString()
        };
        cols[dayKey] = [newTask, ...(cols[dayKey] || [])];
      });

      return {
        weekStart: currentWeekStart,
        columns: cols
      };
    });
  };

  // Stats Calculations
  const allTasks = useMemo(() => {
    const list = [];
    Object.values(normalized.columns).forEach((cols) => {
      (cols || []).forEach((t) => list.push(t));
    });
    return list;
  }, [normalized.columns]);

  const totalCount = allTasks.length;
  const doneCount = allTasks.filter((t) => t.done).length;
  const carriedCount = allTasks.filter((t) => t.carryForwarded && !t.done).length;
  const completionRate = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const totalPlannedMinutes = useMemo(() => {
    return allTasks.reduce((acc, t) => acc + (t.duration || 30), 0);
  }, [allTasks]);

  const totalPlannedHours = (totalPlannedMinutes / 60).toFixed(1);

  // Filter tasks per day
  const getFilteredItems = (dayId) => {
    const items = normalized.columns[dayId] || [];
    return items.filter((task) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(q);
        const matchesSubject = task.subject?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject) return false;
      }

      if (selectedSubject !== 'all' && task.subject !== selectedSubject) {
        return false;
      }

      if (selectedPriority !== 'all' && (task.priority || 'medium') !== selectedPriority) {
        return false;
      }

      return true;
    });
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
      {/* 1. Header & Navigation Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-500">
              <CalendarClock size={28} />
            </div>
            Smart Weekly Planner
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Organize study sessions, auto-schedule assignments, and track weekly velocity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Week Date Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-3 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <CalendarIcon size={14} className="text-primary-500" />
              <span>{formatDateRange(activeMonday)}</span>
              {weekOffset === 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-black">
                  Current Week
                </span>
              )}
            </div>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Next Week"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              Today
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSavedPlansOpen(true)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
            >
              <BookmarkCheck size={16} /> Saved Plans
            </button>
            <button
              onClick={() => setWizardOpen(true)}
              className="px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 border border-purple-200 dark:border-purple-900/40"
            >
              <Sparkles size={16} /> AI Plan Wizard
            </button>
            <button
              onClick={handleAutoSchedule}
              disabled={isScheduling}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={16} className={isScheduling ? 'animate-spin' : ''} />
              Auto-Schedule
            </button>
          </div>
        </div>
      </div>

      {/* 2. Statistics Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tasks</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
              {doneCount} <span className="text-sm font-semibold text-slate-400">/ {totalCount}</span>
            </h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <BarChart2 size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion Rate</p>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{completionRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Carried Forward</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
              {carriedCount}{' '}
              <span className="text-xs font-normal text-slate-400">tasks pending</span>
            </h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Est. Study Hours</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
              {totalPlannedHours} <span className="text-xs font-normal text-slate-400">hrs</span>
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Search, Filter & Quick Add Section */}
      <div className="card space-y-4 p-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search planner tasks..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
              <Filter size={14} /> Filter:
            </div>
            {distinctSubjects.length > 0 && (
              <Select
                variant="ghost"
                value={selectedSubject}
                onChange={(val) => setSelectedSubject(val)}
                options={[
                  { label: 'All Subjects', value: 'all' },
                  ...distinctSubjects.map((s) => ({ label: s, value: s }))
                ]}
              />
            )}
            <Select
              variant="ghost"
              value={selectedPriority}
              onChange={(val) => setSelectedPriority(val)}
              options={PRIORITIES}
            />
          </div>
        </div>

        {/* Create Task Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add task title (e.g., Revise Organic Chemistry Chapter 3)"
            className="md:col-span-4 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTask();
            }}
          />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject tag (optional)"
            className="md:col-span-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Select
            variant="ghost"
            value={day}
            onChange={(val) => setDay(val)}
            options={DAYS.map((d) => ({ label: d.full, value: d.id }))}
            className="md:col-span-2"
          />
          <Select
            variant="ghost"
            value={priority}
            onChange={(val) => setPriority(val)}
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Urgent', value: 'urgent' }
            ]}
            className="md:col-span-2"
          />
          <button
            type="button"
            onClick={addTask}
            className="md:col-span-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm inline-flex items-center justify-center gap-2 py-2.5 shadow-md shadow-primary-500/20 transition-all active:scale-95"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* 4. Weekly 7-Day Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
        {DAYS.map((d, index) => {
          const items = getFilteredItems(d.id);
          const dateLabel = getDayDateLabel(activeMonday, index);

          return (
            <div
              key={d.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dragging) return;
                moveTask(dragging.fromDay, d.id, dragging.taskId);
                setDragging(null);
              }}
              className="card min-h-[360px] p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300">
                      {d.full}
                    </h3>
                    <span className="text-[11px] font-medium text-slate-400">{dateLabel}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {items.map((task) => {
                    const pClass = priorityBadgeStyles[task.priority || 'medium'];

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDragging({ fromDay: d.id, taskId: task.id })}
                        className={`group relative rounded-xl border p-3 bg-white dark:bg-slate-900/60 shadow-sm transition-all hover:border-primary-300 dark:hover:border-primary-800 ${
                          task.done
                            ? 'border-emerald-200 dark:border-emerald-900/40 opacity-75'
                            : 'border-slate-100 dark:border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => toggleDone(d.id, task.id)}
                            className="mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors shrink-0"
                            title="Toggle completed"
                          >
                            <CheckCircle2 size={17} className={task.done ? 'text-emerald-500 fill-emerald-500/10' : ''} />
                          </button>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-semibold leading-snug break-words ${
                                task.done
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {task.title}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {task.subject && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {task.subject}
                                </span>
                              )}
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${pClass}`}>
                                {task.priority || 'med'}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5 ml-auto">
                                <Clock size={10} />
                                {task.duration || 30}m
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Hover Action Bar */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleStartFocus(task)}
                            className="text-[10px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
                            title="Start Focus Session"
                          >
                            <Play size={11} /> Focus
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingTask({ task, dayId: d.id })}
                              className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              title="Edit task"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeTask(d.id, task.id)}
                              className="p-1 hover:text-rose-500 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {items.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/60 rounded-2xl">
                      <p className="text-xs font-semibold text-slate-400">No tasks</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center flex items-center justify-center gap-1">
                <Move size={10} /> Drag to reorder
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AIStudyPlannerWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />

      <SavedPlansModal
        isOpen={savedPlansOpen}
        onClose={() => setSavedPlansOpen(false)}
        onApplyPlan={handleApplyAIPlan}
      />

      <TaskEditModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask?.task}
        dayId={editingTask?.dayId}
        onSave={updateTask}
        onDelete={removeTask}
      />
    </div>
  );
};

export default WeeklyPlanner;
