import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListTodo,
  Plus,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Trash2,
  Flame,
  Trophy,
  Calendar as CalendarIcon,
  Kanban as KanbanIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { useStorage } from './hooks/useStorage';
import PageHeader from './components/PageHeader';
import BulkActionBar from './components/BulkActionBar';
import ConfirmModal from './components/ConfirmModal';
import EmptyState from './components/EmptyState';
import Select from './components/ui/Select';

// Feature components
import TaskItem from './features/Tasks/components/TaskItem';
import TaskFilter from './features/Tasks/components/TaskFilter';
import TaskForm from './features/Tasks/components/TaskForm';
import TaskDetailSidebar from './features/Tasks/components/TaskDetailSidebar';

const Tasks = () => {
  const [tasks, setTasks] = useStorage('studyos_global_tasks', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  // Tab views state
  const [pageTab, setPageTab] = useState('tasks'); // tasks, kanban, calendar

  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Gamification states
  const [xp, setXp] = useStorage('studyos_user_xp', 0);
  const [level, setLevel] = useStorage('studyos_user_level', 1);
  const [streak, setStreak] = useStorage('studyos_user_streak', 0);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');

  // Bulk operation states
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('pending');
  const [bulkPriority, setBulkPriority] = useState('Medium');

  // Confirmation Modal Config
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // XP Reward helper
  const awardXp = (amount) => {
    setXp(prevXp => {
      const nextXp = prevXp + amount;
      const xpNeeded = level * 200;
      if (nextXp >= xpNeeded) {
        setLevel(prevLvl => prevLvl + 1);
        toast.success(`🎉 Level Up! You reached Level ${level + 1}!`);
        return nextXp - xpNeeded;
      }
      toast.success(`+${amount} XP Gained!`);
      return nextXp;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Check if dropped onto a column status
    if (['pending', 'in_progress', 'completed'].includes(overId)) {
      handleStatusChange(activeId, overId);
      return;
    }

    // Otherwise, rearrange order
    if (activeId !== overId) {
      setTasks((items) => {
        const oldIndex = items.findIndex((i) => i.id === activeId);
        const newIndex = items.findIndex((i) => i.id === overId);

        const targetTask = items[newIndex];
        const sourceTask = items[oldIndex];
        let updatedItems = [...items];

        if (sourceTask && targetTask && sourceTask.status !== targetTask.status) {
          const timestamp = new Date().toISOString();
          const nextStatus = targetTask.status;
          const progress = nextStatus === 'completed' ? 100 : (nextStatus === 'pending' ? 0 : sourceTask.progress);

          if (nextStatus === 'completed' && sourceTask.status !== 'completed') {
            awardXp(50);
          }

          updatedItems = items.map(t => t.id === activeId ? {
            ...t,
            status: nextStatus,
            progress,
            updatedAt: timestamp
          } : t);
        }

        const newItems = arrayMove(updatedItems, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  // Helper properties
  const availableSubjects = useMemo(() => {
    return [...new Set(tasks.map(t => t.subject).filter(Boolean))].sort();
  }, [tasks]);

  const getPriorityWeight = (priority) => {
    if (priority === 'Critical') return 4;
    if (priority === 'High') return 3;
    if (priority === 'Medium') return 2;
    return 1;
  };

  // Filter & Sort core logic
  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter((task) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        (task.subject && task.subject.toLowerCase().includes(query)) ||
        task.type.toLowerCase().includes(query);

      const matchesStatus = filterStatus === 'All' ? true : task.status === filterStatus;
      const matchesPriority = filterPriority === 'All' ? true : task.priority === filterPriority;
      const matchesType = filterType === 'All' ? true : task.type === filterType;
      const matchesSubject = filterSubject === 'All' ? true : task.subject === filterSubject;

      return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesSubject;
    });

    return result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'priority') return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (sortBy === 'updated') return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      if (sortBy === 'custom') return (a.order ?? 0) - (b.order ?? 0);
      return 0;
    });
  }, [tasks, searchTerm, filterStatus, filterPriority, filterType, filterSubject, sortBy]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const active = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    const overdue = tasks.filter(t => {
      if (t.status === 'completed' || !t.deadline) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.deadline) < today;
    }).length;

    const avgProgress = total > 0 
      ? Math.round(tasks.reduce((acc, t) => acc + (t.progress || 0), 0) / total)
      : 0;

    return { total, pending, active, completed, overdue, avgProgress };
  }, [tasks]);

  // Handlers
  const handleOpenForm = (task = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (formData) => {
    const timestamp = new Date().toISOString();
    const subtaskTotal = formData.subtasks.length;
    const completedSub = formData.subtasks.filter(s => s.completed).length;

    let progress = subtaskTotal > 0 
      ? Math.round((completedSub / subtaskTotal) * 100)
      : (editingTask?.progress || 0);

    let status = editingTask?.status || 'pending';
    if (progress === 100 && subtaskTotal > 0) status = 'completed';
    else if (progress > 0 && progress < 100) status = 'in_progress';

    // Auto-fill last uncompleted subtask as lastPosition
    let lastPosition = editingTask?.lastPosition || '';
    if (subtaskTotal > 0) {
      const nextSub = formData.subtasks.find(s => !s.completed);
      if (nextSub) lastPosition = nextSub.title;
    }

    if (editingTask) {
      const activityMsg = 'Task details and checklist edited';
      const activityEntry = { id: nanoid(), type: 'edit', message: activityMsg, createdAt: timestamp };

      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        ...formData,
        progress,
        status,
        lastPosition,
        updatedAt: timestamp,
        activityLog: [activityEntry, ...(t.activityLog || [])]
      } : t));

      if (selectedTaskDetail && selectedTaskDetail.id === editingTask.id) {
        setSelectedTaskDetail(prev => ({
          ...prev,
          ...formData,
          progress,
          status,
          lastPosition,
          updatedAt: timestamp
        }));
      }
      toast.success('Task updated');
    } else {
      const createdTask = {
        id: nanoid(),
        ...formData,
        progress: subtaskTotal > 0 ? progress : 0,
        status: 'pending',
        lastPosition,
        createdAt: timestamp,
        updatedAt: timestamp,
        activityLog: [{ id: nanoid(), type: 'created', message: 'Task created', createdAt: timestamp }]
      };
      setTasks(prev => [createdTask, ...prev]);
      toast.success('Task created');
    }

    setIsModalOpen(false);
  };

  const handleStatusChange = (id, status) => {
    const timestamp = new Date().toISOString();
    const actionMsg = status === 'completed' 
      ? 'Task marked as completed' 
      : (status === 'in_progress' ? 'Task started / resumed' : 'Task reset to pending');

    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const progress = status === 'completed' ? 100 : (status === 'pending' ? 0 : t.progress);
      
      const nextSubtasks = (t.subtasks || []).map(s => ({
        ...s,
        completed: status === 'completed' ? true : (status === 'pending' ? false : s.completed)
      }));

      if (status === 'completed' && t.status !== 'completed') {
        awardXp(50);
      }

      return {
        ...t,
        status,
        progress,
        subtasks: nextSubtasks,
        updatedAt: timestamp,
        activityLog: [{ id: nanoid(), type: 'status', message: actionMsg, createdAt: timestamp }, ...(t.activityLog || [])]
      };
    }));

    toast.success(status === 'completed' ? 'Task completed!' : 'Status updated');
  };

  const handleUpdateTaskDetail = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTaskDetail(updatedTask);
  };

  const handleDeleteTask = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Task',
      message: 'Are you sure you want to permanently delete this task? This action is irreversible.',
      onConfirm: () => {
        setTasks(prev => prev.filter(t => t.id !== id));
        toast.success('Task deleted');
      }
    });
  };

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredAndSortedTasks.map(t => t.id);
    const allSelected = visibleIds.every(id => selectedTaskIds.includes(id));

    if (allSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedTaskIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleClearSelection = () => setSelectedTaskIds([]);

  // Bulk Action triggers
  const handleBulkStatusApply = () => {
    if (selectedTaskIds.length === 0) return;
    const timestamp = new Date().toISOString();
    let completedCount = 0;

    setTasks(prev => prev.map(t => {
      if (!selectedTaskIds.includes(t.id)) return t;
      
      const progress = bulkStatus === 'completed' ? 100 : (bulkStatus === 'pending' ? 0 : t.progress);
      const nextSubtasks = (t.subtasks || []).map(s => ({
        ...s,
        completed: bulkStatus === 'completed' ? true : (bulkStatus === 'pending' ? false : s.completed)
      }));

      if (bulkStatus === 'completed' && t.status !== 'completed') {
        completedCount++;
      }

      return {
        ...t,
        status: bulkStatus,
        progress,
        subtasks: nextSubtasks,
        updatedAt: timestamp,
        activityLog: [{ id: nanoid(), type: 'bulk', message: `Bulk status update: ${bulkStatus}`, createdAt: timestamp }, ...(t.activityLog || [])]
      };
    }));

    if (completedCount > 0) {
      awardXp(completedCount * 50);
    }
    toast.success(`Updated ${selectedTaskIds.length} tasks`);
    handleClearSelection();
  };

  const handleBulkPriorityApply = () => {
    if (selectedTaskIds.length === 0) return;
    const timestamp = new Date().toISOString();
    setTasks(prev => prev.map(t => {
      if (!selectedTaskIds.includes(t.id)) return t;
      return {
        ...t,
        priority: bulkPriority,
        updatedAt: timestamp,
        activityLog: [{ id: nanoid(), type: 'bulk', message: `Bulk priority update: ${bulkPriority}`, createdAt: timestamp }, ...(t.activityLog || [])]
      };
    }));
    toast.success(`Priority updated for ${selectedTaskIds.length} tasks`);
    handleClearSelection();
  };

  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Selected Tasks',
      message: `Delete all ${selectedTaskIds.length} selected tasks permanently?`,
      onConfirm: () => {
        setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id)));
        toast.success(`${selectedTaskIds.length} tasks deleted`);
        handleClearSelection();
      }
    });
  };



  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('All');
    setFilterPriority('All');
    setFilterType('All');
    setFilterSubject('All');
    setSortBy('updated');
  };

  // Calendar Calculation Helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    const days = [];
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthTotalDays - i,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false
      });
    }
    
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, month, year, isCurrentMonth: true });
    }
    
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getTasksForDate = (year, month, day) => {
    return tasks.filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const calendarDays = useMemo(() => getDaysInMonth(currentDate), [currentDate, tasks]);

  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + direction);
      return next;
    });
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8 animate-in fade-in duration-500">
      
      <PageHeader 
        title="Task Manager" 
        description="Track your academic work, resume exactly where you stopped."
        icon={<ListTodo size={32} />}
        action={
          <button 
            onClick={() => handleOpenForm()} 
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 active:scale-95"
          >
            <Plus size={20} />
            New Task
          </button>
        }
      />

      {/* Statistics Cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, icon: ListTodo, color: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10' },
          { label: 'In Progress', value: stats.active, icon: PlayCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: AlertTriangle, color: 'text-violet-500', bg: 'bg-violet-500/10' }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm flex items-center gap-4"
            >
              <div className={`p-3.5 rounded-2xl ${item.bg} ${item.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{item.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation tab views switcher */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-fit shadow-sm">
        {[
          { id: 'tasks', label: 'My Tasks', icon: ListTodo },
          { id: 'kanban', label: 'Kanban Board', icon: KanbanIcon },
          { id: 'calendar', label: 'Calendar View', icon: CalendarIcon },
          { id: 'timeline', label: 'Timeline View', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setPageTab(tab.id)}
              className={`relative px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                pageTab === tab.id
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-500/20'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bulk Action Bar */}
      {selectedTaskIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedTaskIds.length}
          onSelectVisible={handleSelectAllVisible}
          onClear={handleClearSelection}
          className="animate-in slide-in-from-top duration-300"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={bulkStatus}
              onChange={setBulkStatus}
              options={[
                { label: 'Set Pending', value: 'pending' },
                { label: 'Set In Progress', value: 'in_progress' },
                { label: 'Set Completed', value: 'completed' }
              ]}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border"
            />
            <button
              onClick={handleBulkStatusApply}
              className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold"
            >
              Apply Status
            </button>

            <Select
              value={bulkPriority}
              onChange={setBulkPriority}
              options={[
                { label: 'Low Priority', value: 'Low' },
                { label: 'Medium Priority', value: 'Medium' },
                { label: 'High Priority', value: 'High' },
                { label: 'Critical Priority', value: 'Critical' }
              ]}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border"
            />
            <button
              onClick={handleBulkPriorityApply}
              className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold"
            >
              Apply Priority
            </button>

            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </BulkActionBar>
      )}

      {/* Main content viewport matching tab choice */}
      <AnimatePresence mode="wait">
        {pageTab === 'tasks' && (
          <motion.div
            key="checklist"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Task Filters */}
            <TaskFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterPriority={filterPriority}
              setFilterPriority={setFilterPriority}
              filterType={filterType}
              setFilterType={setFilterType}
              sortBy={sortBy}
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              availableSubjects={availableSubjects}
              filterSubject={filterSubject}
              setFilterSubject={setFilterSubject}
              onReset={handleResetFilters}
              totalCount={filteredAndSortedTasks.length}
              selectedCount={selectedTaskIds.length}
              onSelectAllVisible={handleSelectAllVisible}
            />

            {/* Checklist View */}
            {filteredAndSortedTasks.length === 0 ? (
              <EmptyState
                icon={<ListTodo size={48} />}
                title="No Tasks Found"
                description="Create a new task or adjust your filters to start organizing your work."
                actions={
                  <button
                    onClick={() => handleOpenForm()}
                    className="px-5 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-colors"
                  >
                    Add Task
                  </button>
                }
              />
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={filteredAndSortedTasks.map((t) => t.id)}
                  strategy={viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy}
                >
                  <div className={viewMode === 'list' ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'}>
                    {filteredAndSortedTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        viewMode={viewMode}
                        selected={selectedTaskIds.includes(task.id)}
                        onToggleSelect={handleToggleSelect}
                        onEdit={handleOpenForm}
                        onDelete={handleDeleteTask}
                        onOpenDetail={setSelectedTaskDetail}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </motion.div>
        )}

        {pageTab === 'kanban' && (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
          >
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {[
                { id: 'pending', title: 'Pending', status: 'pending', bg: 'bg-slate-100/50 dark:bg-slate-900/30' },
                { id: 'in_progress', title: 'In Progress', status: 'in_progress', bg: 'bg-blue-50/20 dark:bg-blue-950/10' },
                { id: 'completed', title: 'Completed', status: 'completed', bg: 'bg-emerald-50/20 dark:bg-emerald-950/10' }
              ].map(column => {
                const columnTasks = tasks.filter(t => t.status === column.status);
                return (
                  <div key={column.id} className={`p-5 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800 ${column.bg} space-y-4`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-800 dark:text-white text-base flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                        {column.title}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {columnTasks.length}
                      </span>
                    </div>

                    <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4 min-h-[300px]">
                        {columnTasks.length === 0 ? (
                          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200/50 dark:border-slate-800 rounded-3xl">
                            Drag tasks here
                          </div>
                        ) : (
                          columnTasks.map(task => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              viewMode="grid"
                              selected={selectedTaskIds.includes(task.id)}
                              onToggleSelect={handleToggleSelect}
                              onEdit={handleOpenForm}
                              onDelete={handleDeleteTask}
                              onOpenDetail={setSelectedTaskDetail}
                              onStatusChange={handleStatusChange}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </DndContext>
          </motion.div>
        )}

        {pageTab === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm space-y-6"
          >
            {/* Calendar Controls */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 dark:text-white capitalize">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((cell, idx) => {
                const dayTasks = getTasksForDate(cell.year, cell.month, cell.day);
                const isToday = new Date().getDate() === cell.day && new Date().getMonth() === cell.month && new Date().getFullYear() === cell.year;

                return (
                  <div
                    key={`${cell.month}-${cell.day}-${idx}`}
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        const dateStr = `${cell.year}-${(cell.month + 1).toString().padStart(2, '0')}-${cell.day.toString().padStart(2, '0')}`;
                        handleOpenForm({ deadline: dateStr });
                      }
                    }}
                    className={`min-h-[100px] p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                      cell.isCurrentMonth
                        ? 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/80 hover:border-primary-300'
                        : 'bg-slate-100/20 dark:bg-slate-950/20 border-slate-100/40 dark:border-slate-900/40 text-slate-300 dark:text-slate-600 pointer-events-none'
                    } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                  >
                    <span className={`text-xs font-black ${isToday ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      {cell.day}
                    </span>

                    <div className="space-y-1.5 mt-2">
                      {dayTasks.map(t => (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskDetail(t);
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold truncate ${
                            t.status === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 line-through'
                              : (t.priority === 'Critical' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300')
                          }`}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {pageTab === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm space-y-6 overflow-x-auto"
          >
            <h3 className="text-xl font-black text-slate-800 dark:text-white">Gantt Timeline View (14 Days)</h3>
            
            {/* Gantt chart days header */}
            <div className="min-w-[800px] grid grid-cols-[200px_1fr] gap-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Task Title</div>
              <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                {Array.from({ length: 14 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  return (
                    <div key={i} className="py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p>{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{date.getDate()}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gantt chart rows */}
            <div className="min-w-[800px] space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400 font-semibold border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  No tasks available to show on timeline.
                </div>
              ) : (
                tasks.map(task => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  let startOffset = 0;
                  let durationDays = 1;
                  
                  if (task.deadline) {
                    const taskDate = new Date(task.deadline);
                    taskDate.setHours(0, 0, 0, 0);
                    const diffTime = taskDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays >= 0 && diffDays < 14) {
                      startOffset = diffDays;
                    } else if (diffDays >= 14) {
                      startOffset = 13;
                    } else {
                      startOffset = 0;
                    }
                  }

                  return (
                    <div key={task.id} className="grid grid-cols-[200px_1fr] gap-4 items-center group py-2 border-b border-slate-100 dark:border-slate-800/50">
                      <div 
                        onClick={() => setSelectedTaskDetail(task)}
                        className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary-500 cursor-pointer truncate"
                      >
                        {task.title}
                      </div>
                      
                      <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1 relative h-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg">
                        <div 
                          style={{ gridColumnStart: startOffset + 1, gridColumnEnd: `span ${durationDays}` }}
                          className={`h-full rounded-md flex items-center justify-center text-[10px] font-black uppercase text-white shadow-sm transition-all duration-300 ${
                            task.status === 'completed'
                              ? 'bg-emerald-500/80'
                              : (task.priority === 'Critical' ? 'bg-rose-500' : 'bg-primary-500')
                          }`}
                          title={`Deadline: ${task.deadline || 'No Date'}`}
                        >
                          {task.progress}%
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <TaskForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        availableSubjects={availableSubjects}
      />

      {/* Task Details Drawer Sidebar */}
      <AnimatePresence>
        {selectedTaskDetail && (
          <TaskDetailSidebar
            task={selectedTaskDetail}
            onClose={() => setSelectedTaskDetail(null)}
            onUpdateTask={handleUpdateTaskDetail}
            onEdit={(t) => {
              setSelectedTaskDetail(null);
              handleOpenForm(t);
            }}
            onDelete={handleDeleteTask}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
};

export default Tasks;