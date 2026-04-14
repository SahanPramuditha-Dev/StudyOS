import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, CheckCircle2, Clock, X, Target, ListTodo, ChevronRight, Edit2 } from 'lucide-react';
import { useStorage } from './hooks/useStorage';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import PageHeader from './components/PageHeader';

const Tasks = () => {
  const [tasks, setTasks] = useStorage('studyos_global_tasks', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('notes');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState([]);

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTitle(task.title);
      setSubject(task.subject || '');
      setType(task.type || 'notes');
      setDescription(task.description || '');
      setSubtasks(task.subtasks || []);
    } else {
      setEditingTask(null);
      setTitle('');
      setSubject('');
      setType('notes');
      setDescription('');
      setSubtasks([]);
    }
    setIsModalOpen(true);
  };

  const handleSaveTask = () => {
    if (!title) {
      toast.error('Title is required');
      return;
    }

    const progress = subtasks.length > 0 
      ? Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100)
      : (editingTask?.progress || 0);
      
    let status = editingTask?.status || 'pending';
    if (progress > 0 && progress < 100) status = 'in_progress';
    if (progress === 100 && subtasks.length > 0) status = 'completed';

    // Auto-determine last position based on first uncompleted subtask
    let lastPosition = editingTask?.lastPosition || '';
    if (subtasks.length > 0) {
      const currentSub = subtasks.find(s => !s.completed);
      if (currentSub) lastPosition = currentSub.title;
    }

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        title, subject, type, description, subtasks, progress,
        lastPosition,
        status: status === 'pending' && t.status === 'in_progress' ? 'in_progress' : status,
        updatedAt: new Date().toISOString()
      } : t));
      toast.success('Task updated');
    } else {
      setTasks(prev => [{
        id: nanoid(),
        title, subject, type, description, subtasks, progress,
        lastPosition,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastOpenedAt: null
      }, ...prev]);
      toast.success('Task created');
    }
    setIsModalOpen(false);
  };

  const handleUpdateStatus = (id, status) => {
    setTasks(prev => prev.map(t => t.id === id ? { 
      ...t, 
      status, 
      updatedAt: new Date().toISOString(), 
      lastOpenedAt: status === 'in_progress' ? new Date().toISOString() : t.lastOpenedAt 
    } : t));
    if (status === 'in_progress') toast.success('Task started!');
    if (status === 'completed') toast.success('Task marked as complete!');
  };

  const handleDelete = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Task deleted');
  };

  // Lists
  const activeTasks = tasks.filter(t => t.status === 'in_progress');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Smart Suggestions (Started but not finished, or almost complete)
  const suggestions = useMemo(() => {
    return activeTasks.filter(t => {
      const daysSinceUpdate = (new Date() - new Date(t.updatedAt)) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 2 || t.progress >= 80;
    }).slice(0, 2);
  }, [activeTasks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <PageHeader 
          title="Task Manager" 
          description="Track your academic work, resume exactly where you stopped."
          icon={<ListTodo size={28} />}
          action={
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 active:scale-95">
              <Plus size={20} />
              New Task
            </button>
          }
        />

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Target className="text-accent-500" size={20} />
              Smart Suggestions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map(task => (
                <div key={task.id} className="p-5 rounded-2xl bg-gradient-to-br from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20 border border-accent-100 dark:border-accent-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div>
                     <p className="text-xs font-black uppercase tracking-wider text-accent-600 dark:text-accent-400 mb-1">
                       {task.progress >= 80 ? 'Almost complete (finish now?)' : 'You haven\'t continued this in a while'}
                     </p>
                     <h4 className="font-black text-slate-800 dark:text-white text-lg">{task.title}</h4>
                     <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1"><ChevronRight size={16} className="text-accent-500"/> Last position: {task.lastPosition || 'Not started'}</p>
                   </div>
                   <button onClick={() => handleUpdateStatus(task.id, 'in_progress')} className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 text-accent-600 dark:text-accent-400 font-bold hover:scale-105 active:scale-95 transition-transform shadow-sm">
                     <Play size={18} fill="currentColor" /> Resume
                   </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Active & Pending */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Tasks */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Clock className="text-blue-500" size={20} />
                In Progress ({activeTasks.length})
              </h3>
              {activeTasks.length === 0 ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No active tasks right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeTasks.map(task => <TaskCard key={task.id} task={task} onEdit={() => handleOpenModal(task)} onStatus={handleUpdateStatus} />)}
                </div>
              )}
            </div>

            {/* Pending Tasks */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ListTodo className="text-slate-500" size={20} />
                Pending ({pendingTasks.length})
              </h3>
              {pendingTasks.length === 0 && activeTasks.length === 0 && completedTasks.length === 0 ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <ListTodo className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Your task list is empty</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add a task to start tracking your academic work.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pendingTasks.map(task => <TaskCard key={task.id} task={task} onEdit={() => handleOpenModal(task)} onStatus={handleUpdateStatus} />)}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Completed */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} />
              Completed ({completedTasks.length})
            </h3>
            {completedTasks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed tasks will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4 opacity-75">
                {completedTasks.map(task => <TaskCard key={task.id} task={task} onEdit={() => handleOpenModal(task)} onStatus={handleUpdateStatus} compact />)}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">{editingTask ? 'Edit Task' : 'New Task'}</h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Task Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" placeholder="e.g. Write Agile Development Notes" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Subject / Module</label>
                      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" placeholder="e.g. SE, AI" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all">
                        <option value="notes">Notes</option>
                        <option value="assignment">Assignment</option>
                        <option value="revision">Revision</option>
                        <option value="project">Project</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Subtasks & Progress Tracking</label>
                    <div className="space-y-2 mb-3">
                      {subtasks.map((st, i) => (
                        <div key={i} className="flex items-center gap-2 group">
                          <input type="checkbox" checked={st.completed} onChange={() => {
                            const next = [...subtasks];
                            next[i].completed = !next[i].completed;
                            setSubtasks(next);
                          }} className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600" />
                          <input type="text" value={st.title} onChange={(e) => {
                            const next = [...subtasks];
                            next[i].title = e.target.value;
                            setSubtasks(next);
                          }} placeholder="e.g. Scrum Framework" className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all ${st.completed ? 'opacity-50 line-through border-slate-100 dark:border-slate-800' : 'border-slate-200 dark:border-slate-700'}`} />
                          <button onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><X size={16}/></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setSubtasks([...subtasks, { title: '', completed: false }])} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 w-full justify-center">
                      <Plus size={16} /> Add Subtask
                    </button>
                  </div>

                  {editingTask && (
                    <div className="pt-2">
                       <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Manual Progress Override (%)</label>
                       <div className="flex items-center gap-4">
                         <input type="range" min="0" max="100" value={editingTask.progress || 0} onChange={(e) => {
                            const val = Number(e.target.value);
                            setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, progress: val } : t));
                            setEditingTask(prev => ({ ...prev, progress: val }));
                         }} className="flex-1 accent-primary-500" />
                         <span className="text-sm font-bold text-primary-600 w-10 text-right">{editingTask.progress || 0}%</span>
                       </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    {editingTask && (
                      <button onClick={() => { handleDelete(editingTask.id); setIsModalOpen(false); }} className="px-5 py-3 rounded-xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors">
                        Delete
                      </button>
                    )}
                    <div className="flex-1"></div>
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSaveTask} className="px-6 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 active:scale-95">
                      Save Task
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
};

const TaskCard = ({ task, onEdit, onStatus, compact = false }) => {
  return (
    <div className={`group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 transition-all shadow-sm hover:shadow-md flex flex-col ${compact ? 'h-auto' : 'h-full'}`}>
      <div className="flex justify-between items-start mb-3">
         <div className="flex flex-wrap items-center gap-2">
           <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{task.type}</span>
           {task.subject && <span className="text-xs font-bold text-slate-400">{task.subject}</span>}
         </div>
         <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors opacity-0 group-hover:opacity-100 -mr-2 -mt-2"><Edit2 size={16}/></button>
      </div>
      <h4 className="font-black text-slate-800 dark:text-white text-lg mb-1 leading-tight flex-1">{task.title}</h4>
      
      {!compact && task.lastPosition && (
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <ChevronRight size={14} className="text-primary-500 shrink-0"/> 
          <span className="truncate">Last: {task.lastPosition}</span>
        </p>
      )}
      
      <div className={`mt-auto pt-4 ${compact ? 'hidden' : ''}`}>
        <div className="flex justify-between text-xs font-bold mb-2">
          <span className="text-slate-500 dark:text-slate-400">Progress</span>
          <span className="text-primary-600 dark:text-primary-400">{task.progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
           <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${task.progress}%` }} />
        </div>
      </div>

      <div className={`flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 ${compact ? 'mt-3 pt-3' : ''}`}>
         {task.status === 'pending' && (
           <button onClick={() => onStatus(task.id, 'in_progress')} className="w-full py-2.5 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold text-sm hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors flex items-center justify-center gap-2 active:scale-95">
             <Play size={16} fill="currentColor" /> Start Task
           </button>
         )}
         {task.status === 'in_progress' && (
           <button onClick={() => onStatus(task.id, 'completed')} className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 active:scale-95">
             <CheckCircle2 size={16} /> Mark Complete
           </button>
         )}
         {task.status === 'completed' && (
           <button onClick={() => onStatus(task.id, 'in_progress')} className="w-full py-2 text-center text-sm font-bold text-slate-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-2">
             <CheckCircle2 size={16} /> Completed (Click to reopen)
           </button>
         )}
      </div>
    </div>
  );
}

export default Tasks;