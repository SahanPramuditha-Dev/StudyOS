import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Plus, Move, CheckCircle2, Trash2, Sparkles } from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { autoScheduleWeek } from '../../services/aiService';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';

const DAYS = [
  { id: 'monday', label: 'Mon', full: 'Monday' },
  { id: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { id: 'thursday', label: 'Thu', full: 'Thursday' },
  { id: 'friday', label: 'Fri', full: 'Friday' },
  { id: 'saturday', label: 'Sat', full: 'Saturday' },
  { id: 'sunday', label: 'Sun', full: 'Sunday' }
];

const toDateKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
    2,
    '0'
  )}`;
};

const getMonday = (base = new Date()) => {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const createEmptyColumns = () =>
  DAYS.reduce((acc, day) => {
    acc[day.id] = [];
    return acc;
  }, {});

const WeeklyPlanner = () => {
  const currentWeekStart = toDateKey(getMonday());
  const [planner, setPlanner] = useStorage(STORAGE_KEYS.WEEKLY_PLANNER, {
    weekStart: currentWeekStart,
    columns: createEmptyColumns()
  });
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [isScheduling, setIsScheduling] = useState(false);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('monday');
  const [dragging, setDragging] = useState(null);

  const normalized = useMemo(() => {
    const p = planner && typeof planner === 'object' ? planner : {};
    const columns = { ...createEmptyColumns(), ...(p.columns || {}) };
    return {
      weekStart: typeof p.weekStart === 'string' ? p.weekStart : currentWeekStart,
      columns
    };
  }, [planner, currentWeekStart]);

  useEffect(() => {
    if (normalized.weekStart === currentWeekStart) return;
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
  }, [currentWeekStart, normalized.columns, normalized.weekStart, setPlanner]);

  const addTask = () => {
    const clean = title.trim();
    if (!clean) return;
    const task = {
      id: `wk-${Date.now()}`,
      title: clean,
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

  const handleAutoSchedule = async () => {
    setIsScheduling(true);
    const toastId = toast.loading('AI is analyzing and scheduling your tasks...');
    try {
      // Gather uncompleted tasks from projects and assignments
      const tasksToSchedule = [];
      
      projects?.forEach(project => {
        if (project.status === 'Ongoing' && project.board) {
          project.board.todo?.forEach(t => tasksToSchedule.push(`Project (${project.name}): ${t.title}`));
          project.board.doing?.forEach(t => tasksToSchedule.push(`Project (${project.name}): ${t.title}`));
        }
      });
      
      assignments?.forEach(assignment => {
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
        
        // Add new tasks to existing ones
        Object.keys(schedule).forEach(day => {
          const aiTasks = (schedule[day] || []).map(title => ({
            id: `wk-ai-${Date.now()}-${Math.random()}`,
            title,
            done: false,
            createdAt: new Date().toISOString()
          }));
          
          if (cols[day]) {
            cols[day] = [...aiTasks, ...cols[day]];
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

  const total = DAYS.reduce((acc, d) => acc + (normalized.columns[d.id] || []).length, 0);
  const done = DAYS.reduce(
    (acc, d) => acc + (normalized.columns[d.id] || []).filter((t) => t.done).length,
    0
  );

  return (
    <div className="space-y-8 pb-10">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black dark:text-white flex items-center gap-2">
              <CalendarClock className="text-primary-500" size={24} />
              Smart Weekly Planner
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Drag tasks between days. Incomplete tasks carry forward automatically every week.
            </p>
          </div>
            <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {done}/{total} completed
            </div>
            <button
              onClick={handleAutoSchedule}
              disabled={isScheduling}
              className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-300 font-bold rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={16} className={isScheduling ? 'animate-pulse' : ''} />
              Auto-Schedule
            </button>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${total === 0 ? 0 : Math.round((done / total) * 100)}%` }}
          />
        </div>
      </section>

      <section className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add task (e.g., Revise chapter 3)"
            className="md:col-span-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTask();
            }}
          />
          <Select
            variant="ghost"
            value={day}
            onChange={(val) => setDay(val)}
            title="Pick day for task"
            options={DAYS.map(d => ({ label: d.full, value: d.id }))}
          />
          <button
            type="button"
            onClick={addTask}
            className="rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold inline-flex items-center justify-center gap-2 py-2.5"
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
        {DAYS.map((d) => {
          const items = normalized.columns[d.id] || [];
          return (
            <div
              key={d.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dragging) return;
                moveTask(dragging.fromDay, d.id, dragging.taskId);
                setDragging(null);
              }}
              className="card min-h-[260px] p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {d.label}
                </h3>
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragging({ fromDay: d.id, taskId: task.id })}
                    className={`rounded-xl border p-2.5 bg-white dark:bg-slate-900/40 ${
                      task.done
                        ? 'border-emerald-200 dark:border-emerald-900/40'
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDone(d.id, task.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-500"
                        title="Toggle done"
                      >
                        <CheckCircle2 size={16} className={task.done ? 'text-emerald-500' : ''} />
                      </button>
                      <p
                        className={`text-sm font-semibold leading-tight ${
                          task.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 inline-flex items-center gap-1">
                        <Move size={11} />
                        Drag
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTask(d.id, task.id)}
                        className="text-slate-400 hover:text-rose-500"
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default WeeklyPlanner;
