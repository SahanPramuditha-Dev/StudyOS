import React, { useState } from 'react';
import {
  Plus,
  CheckSquare,
  Trash2,
  GripVertical,
  Calendar,
  Flag,
  X,
  Timer as TimerIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import Select from '../../../../components/ui/Select';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTaskItem = ({ task, columnId, projectId, onDelete, getPriorityColor }) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, data: { task, columnId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group relative"
    >
      <div className="flex items-start gap-2 mb-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/timer', { state: { projectId, taskId: task.id } })}
          className="px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 transition-all opacity-0 group-hover:opacity-100 absolute top-2 right-10"
          title="Start Pomodoro"
        >
          <TimerIcon size={14} />
        </button>
        <button
          onClick={() => onDelete(task.id, columnId)}
          className="px-2 py-1 rounded bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 transition-all opacity-0 group-hover:opacity-100 absolute top-2 right-2"
          title="Delete Task"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs flex-wrap pl-6">
        {task.priority && (
          <span className={`px-2 py-0.5 rounded-full font-bold ${getPriorityColor(task.priority)}`}>
            <Flag size={10} className="inline mr-1" />
            {task.priority}
          </span>
        )}
        {task.dueDate && (
          <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold flex items-center gap-1">
            <Calendar size={10} />
            {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        )}
        {task.timeSpent > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-1 ml-auto">
            <TimerIcon size={10} />
            {Math.max(1, Math.round((task.timeSpent || 0) / 60))}m
          </span>
        )}
      </div>
    </div>
  );
};

const TaskManager = ({ project, onUpdate, onActivityAdd }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [board, setBoard] = useState(project.board || { todo: [], doing: [], done: [] });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium'
  });
  const [activeId, setActiveId] = useState(null);

  const columns = [
    { id: 'todo', label: 'To Do', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'doing', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-500/10' },
    { id: 'done', label: 'Completed', color: 'bg-green-100 dark:bg-green-500/10' }
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    const task = {
      id: nanoid(),
      ...newTask,
      createdAt: new Date().toISOString()
    };

    const updatedBoard = {
      ...board,
      todo: [task, ...board.todo]
    };

    setBoard(updatedBoard);
    onUpdate({ ...project, board: updatedBoard });
    onActivityAdd('task_created', `Added task: ${newTask.title}`);
    toast.success('Task created');

    setNewTask({ title: '', description: '', dueDate: '', priority: 'Medium' });
    setIsCreating(false);
  };

  const handleDeleteTask = (taskId, fromColumn) => {
    const updatedBoard = {
      ...board,
      [fromColumn]: board[fromColumn].filter(t => t.id !== taskId)
    };

    setBoard(updatedBoard);
    onUpdate({ ...project, board: updatedBoard });
    toast.success('Task deleted');
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'text-red-500 bg-red-100 dark:bg-red-500/10',
      'Medium': 'text-amber-500 bg-amber-100 dark:bg-amber-500/10',
      'Low': 'text-blue-500 bg-blue-100 dark:bg-blue-500/10'
    };
    return colors[priority] || colors['Medium'];
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.task;
    const isOverTask = over.data.current?.task;
    
    if (!isActiveTask) return;

    const activeContainer = active.data.current.columnId;
    // If over is a task, it has a columnId in data. If over is a container (column), its id is the columnId
    const overContainer = isOverTask ? over.data.current.columnId : over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setBoard((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      
      const activeIndex = activeItems.findIndex(t => t.id === activeId);
      const overIndex = isOverTask 
        ? overItems.findIndex(t => t.id === overId)
        : overItems.length;

      return {
        ...prev,
        [activeContainer]: [
          ...prev[activeContainer].filter(item => item.id !== activeId)
        ],
        [overContainer]: [
          ...prev[overContainer].slice(0, overIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(overIndex, prev[overContainer].length)
        ]
      };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = active.data.current?.columnId;
    const overContainer = over.data.current?.task ? over.data.current.columnId : over.id;

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      const activeIndex = board[activeContainer].findIndex(t => t.id === activeId);
      const overIndex = board[overContainer].findIndex(t => t.id === overId);

      if (activeIndex !== overIndex) {
        const newBoard = {
          ...board,
          [activeContainer]: arrayMove(board[activeContainer], activeIndex, overIndex)
        };
        setBoard(newBoard);
        onUpdate({ ...project, board: newBoard });
      }
    } else {
      // The actual move was handled in handleDragOver, just sync to parent
      onUpdate({ ...project, board });
      const movedTask = board[overContainer].find(t => t.id === activeId);
      if (movedTask) {
        onActivityAdd('task_moved', `Moved task to ${columns.find(c => c.id === overContainer)?.label}`);
      }
    }
  };

  const activeTask = activeId 
    ? [...board.todo, ...board.doing, ...board.done].find(t => t.id === activeId)
    : null;

  return (
    <div className="space-y-6">
      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare size={20} />
                  Create Task
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title"
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="What needs to be done?"
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Due Date</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Priority</label>
                    <Select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                      options={[
                        { label: 'Low', value: 'Low' },
                        { label: 'Medium', value: 'Medium' },
                        { label: 'High', value: 'High' }
                      ]}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTask}
                    className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Button */}
      <button
        onClick={() => setIsCreating(true)}
        className="w-full px-6 py-3 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Create Task
      </button>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(column => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 min-h-[400px] flex flex-col ${column.color}`}
            >
              <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                {column.label}
                <span className="px-2 py-1 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold">
                  {board[column.id]?.length || 0}
                </span>
              </h3>

              <div className="flex-1 space-y-3" id={column.id}>
                <SortableContext
                  items={(board[column.id] || []).map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {(board[column.id] || []).map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      columnId={column.id}
                      projectId={project.id}
                      onDelete={handleDeleteTask}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </SortableContext>

                {(board[column.id] || []).length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    No tasks yet
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-primary-400 shadow-xl opacity-80 cursor-grabbing">
              <div className="flex items-start gap-2 mb-2">
                <GripVertical size={16} className="text-slate-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    {activeTask.title}
                  </h4>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Progress Summary */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
        <h4 className="font-black text-slate-900 dark:text-white mb-4">Progress</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">Completion</span>
            <span className="font-black text-slate-900 dark:text-white">
              {board.done?.length || 0}/{(board.todo?.length || 0) + (board.doing?.length || 0) + (board.done?.length || 0)}
            </span>
          </div>
          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${
                  ((board.done?.length || 0) /
                    ((board.todo?.length || 0) + (board.doing?.length || 0) + (board.done?.length || 0)) || 0) * 100
                }%`
              }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
