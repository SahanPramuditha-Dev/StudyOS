import React, { useState } from 'react';
import {
  Plus,
  CheckSquare,
  Trash2,
  GripVertical,
  Calendar,
  Flag,
  Clock,
  X,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

const TaskManager = ({ project, onUpdate, onActivityAdd }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [board, setBoard] = useState(project.board || { todo: [], doing: [], done: [] });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium'
  });

  const columns = [
    { id: 'todo', label: 'To Do', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'doing', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-500/10' },
    { id: 'done', label: 'Completed', color: 'bg-green-100 dark:bg-green-500/10' }
  ];

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

  const handleMoveTask = (taskId, fromColumn, toColumn) => {
    const task = board[fromColumn].find(t => t.id === taskId);
    if (!task) return;

    const updatedBoard = {
      todo: board.todo.filter(t => t.id !== taskId),
      doing: board.doing.filter(t => t.id !== taskId),
      done: board.done.filter(t => t.id !== taskId)
    };

    updatedBoard[toColumn] = [task, ...updatedBoard[toColumn]];
    setBoard(updatedBoard);
    onUpdate({ ...project, board: updatedBoard });
    onActivityAdd('task_moved', `Moved task to ${columns.find(c => c.id === toColumn)?.label}`);
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
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(column => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 min-h-[400px] ${column.color}`}
          >
            <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center justify-between">
              {column.label}
              <span className="px-2 py-1 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold">
                {board[column.id]?.length || 0}
              </span>
            </h3>

            <div className="space-y-3">
              <AnimatePresence>
                {(board[column.id] || []).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <GripVertical size={16} className="text-slate-400 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100" />
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
                    </div>

                    <div className="flex items-center gap-2 mb-3 text-xs flex-wrap">
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
                    </div>

                    {/* Move Buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {columns
                        .filter(c => c.id !== column.id)
                        .map(targetColumn => (
                          <button
                            key={targetColumn.id}
                            onClick={() => handleMoveTask(task.id, column.id, targetColumn.id)}
                            className="flex-1 py-1 px-2 rounded text-xs font-bold bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 hover:bg-primary-200 transition-all flex items-center justify-center gap-1"
                          >
                            <ArrowRight size={10} />
                            {targetColumn.label.split(' ')[0]}
                          </button>
                        ))}
                      <button
                        onClick={() => handleDeleteTask(task.id, column.id)}
                        className="px-2 py-1 rounded bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {(board[column.id] || []).length === 0 && (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No tasks yet
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

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
