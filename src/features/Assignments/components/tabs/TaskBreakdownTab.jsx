import React, { useState } from 'react';
import { Plus, Trash2, Edit2, GaugeCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';

const TaskBreakdownTab = ({ assignment, onUpdate }) => {
  const [tasks, setTasks] = useState(assignment.tasks || []);
  const [board, setBoard] = useState(() => {
    const grouped = { todo: [], doing: [], done: [] };
    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        grouped.todo.push(task);
      }
    });
    return grouped;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: ''
  });

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    const newTask = {
      id: nanoid(),
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      dueDate: formData.dueDate,
      status: 'todo',
      createdAt: new Date().toISOString()
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    setBoard(prev => ({
      ...prev,
      todo: [...prev.todo, newTask]
    }));
    onUpdate({
      ...assignment,
      tasks: updated
    });

    setFormData({ title: '', description: '', priority: 'Medium', dueDate: '' });
    setIsModalOpen(false);
    toast.success('Task added');
  };

  const moveTask = (taskId, toStatus) => {
    const task = Object.values(board).flat().find(t => t.id === taskId);
    if (!task) return;

    const updated = task;
    updated.status = toStatus;

    setBoard(prev => {
      const newBoard = { ...prev };
      Object.keys(newBoard).forEach(status => {
        newBoard[status] = newBoard[status].filter(t => t.id !== taskId);
      });
      newBoard[toStatus] = [...newBoard[toStatus], updated];
      return newBoard;
    });

    const allTasks = Object.values(board).flat().map(t => t.id === taskId ? updated : t);
    setTasks(allTasks);
    onUpdate({
      ...assignment,
      tasks: allTasks
    });
  };

  const deleteTask = (taskId) => {
    setBoard(prev => {
      const newBoard = { ...prev };
      Object.keys(newBoard).forEach(status => {
        newBoard[status] = newBoard[status].filter(t => t.id !== taskId);
      });
      return newBoard;
    });

    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    onUpdate({
      ...assignment,
      tasks: updated
    });
    toast.success('Task deleted');
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
      'Medium': 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10',
      'Low': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
    };
    return colors[priority] || colors.Medium;
  };

  const columns = [
    { id: 'todo', label: 'To Do' },
    { id: 'doing', label: 'In Progress' },
    { id: 'done', label: 'Done' }
  ];

  return (
    <motion.div className="space-y-8">
      {/* Add Task Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-blue-500/20 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(column => (
          <div
            key={column.id}
            className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6"
          >
            {/* Column Header */}
            <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-full ${
                  column.id === 'todo' ? 'bg-slate-400' :
                  column.id === 'doing' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></span>
                {column.label}
              </h3>
              <p className="text-sm text-slate-500 mt-2">{board[column.id].length} tasks</p>
            </div>

            {/* Tasks */}
            <div className="space-y-3 min-h-[300px]">
              <AnimatePresence>
                {board[column.id].map((task, idx) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-grab active:cursor-grabbing"
                    draggable
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-bold text-slate-800 dark:text-white flex-1">{task.title}</h4>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-[9px] font-bold text-slate-500">{new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Status Buttons */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {columns.map(col => (
                        <button
                          key={col.id}
                          onClick={() => moveTask(task.id, col.id)}
                          disabled={column.id === col.id}
                          className={`flex-1 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all ${
                            column.id === col.id
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-default'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {col.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {board[column.id].length === 0 && (
                <div className="flex items-center justify-center h-32 text-center">
                  <p className="text-sm text-slate-400">No tasks yet</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Add Task</h2>
              <form onSubmit={handleAddTask} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Task description"
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskBreakdownTab;
