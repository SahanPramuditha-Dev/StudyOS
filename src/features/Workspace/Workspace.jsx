import React, { useState, useMemo } from 'react';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  MoreVertical, 
  Trash2, 
  Github as GithubIcon, 
  Link as LinkIcon,
  Bug,
  Lightbulb,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
  LayoutGrid,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { useReminders } from '../../context/ReminderContext';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

// Sub-components
import ProjectSelector from './components/ProjectSelector';
import { BugTracker, IdeasPanel } from './components/WorkspacePanels';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
  { id: 'doing', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { id: 'done', title: 'Completed', color: 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' }
];

const SortableTask = ({ task, onDelete }) => {
  const { addReminder } = useReminders();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleQuickReminder = (e) => {
    e.stopPropagation();
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    addReminder({
      message: `Work on: ${task.content}`,
      date: reminderTime.getFullYear() + '-' + String(reminderTime.getMonth() + 1).padStart(2, '0') + '-' + String(reminderTime.getDate()).padStart(2, '0'),
      time: String(reminderTime.getHours()).padStart(2, '0') + ':' + String(reminderTime.getMinutes()).padStart(2, '0'),
      priority: 'High',
      category: 'Workspace',
      enabled: true,
      completed: false,
      recurring: 'None',
      sendEmail: true
    });
    toast.success('Quick reminder set for 1 hour from now! 🔥');
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onDoubleClick={() => onDelete(task.id)}
      className="bg-white dark:bg-slate-800 p-4 mb-3 rounded-2xl border border-slate-50 dark:border-slate-700/50 cursor-grab active:cursor-grabbing hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group shadow-sm hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
          task.type === 'bug' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 
          task.type === 'feature' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' : 
          'bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
        }`}>
          {task.type}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={handleQuickReminder}
            className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg text-primary-500 transition-all"
            title="Remind me in 1 hour"
          >
            <Bell size={14} />
          </button>
          <button className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all">
            <MoreVertical size={14} className="text-slate-400 dark:text-slate-500" />
          </button>
        </div>
      </div>
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 leading-relaxed">{task.content}</h4>
      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest">
          <Clock size={12} />
          {new Date(task.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

const Workspace = ({ activeProjectIdOverride, setActiveTab }) => {
  const [projects, setProjects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [resources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [activeProjectId, setActiveProjectId] = useStorage('active_workspace_project', activeProjectIdOverride || null);
  
  // Sync if override changes
  React.useEffect(() => {
    if (activeProjectIdOverride) {
      setActiveProjectId(activeProjectIdOverride);
    }
  }, [activeProjectIdOverride]);

  const [activeId, setActiveId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ content: '', type: 'task', columnId: 'todo' });

  // 1. Contextual Project Data
  const activeProject = useMemo(() => {
    const project = projects.find(p => p.id === activeProjectId);
    if (!project) return null;
    
    return {
      ...project,
      board: {
        todo: project.board?.todo || [],
        doing: project.board?.doing || [],
        done: project.board?.done || []
      },
      bugs: project.bugs || [],
      ideas: project.ideas || []
    };
  }, [projects, activeProjectId]);

  const projectResources = useMemo(() => 
    resources.filter(r => r.associatedType === 'Project' && r.associatedId === activeProjectId)
  , [resources, activeProjectId]);

  // 2. Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 3. Project-Scoped CRUD Operations
  const updateProjectData = (updates) => {
    if (!activeProjectId) return;
    setProjects(projects.map(p => 
      p.id === activeProjectId ? { ...p, ...updates } : p
    ));
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || !activeProject) return;

    const activeId = active.id;
    const overId = over.id;

    // Check if dropped on a column header
    const droppedOnColumn = COLUMNS.find(c => c.id === overId);
    
    if (droppedOnColumn) {
      const allTasks = [...activeProject.board.todo, ...activeProject.board.doing, ...activeProject.board.done];
      const task = allTasks.find(t => t.id === activeId);
      if (!task) return;

      const updatedBoard = {
        todo: activeProject.board.todo.filter(t => t.id !== activeId),
        doing: activeProject.board.doing.filter(t => t.id !== activeId),
        done: activeProject.board.done.filter(t => t.id !== activeId)
      };

      updatedBoard[droppedOnColumn.id].push(task);
      updateProjectData({ board: updatedBoard });
    } else if (activeId !== overId) {
      const updatedBoard = { ...activeProject.board };
      for (const col of Object.keys(updatedBoard)) {
        const oldIndex = updatedBoard[col].findIndex(t => t.id === activeId);
        const newIndex = updatedBoard[col].findIndex(t => t.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          updatedBoard[col] = arrayMove(updatedBoard[col], oldIndex, newIndex);
          updateProjectData({ board: updatedBoard });
          break;
        }
      }
    }

    setActiveId(null);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.content.trim() || !activeProject) return;
    
    const task = { 
      ...newTask, 
      id: nanoid(), 
      createdAt: new Date().toISOString() 
    };

    const updatedBoard = { ...activeProject.board };
    if (!updatedBoard[newTask.columnId]) updatedBoard[newTask.columnId] = [];
    updatedBoard[newTask.columnId].push(task);

    updateProjectData({ board: updatedBoard });
    setNewTask({ content: '', type: 'task', columnId: 'todo' });
    setIsModalOpen(false);
    toast.success('Task deployed to board');
  };

  const deleteTask = (id) => {
    if (!activeProject) return;
    const updatedBoard = { ...activeProject.board };
    for (const col of Object.keys(updatedBoard)) {
      updatedBoard[col] = updatedBoard[col].filter(t => t.id !== id);
    }
    updateProjectData({ board: updatedBoard });
  };

  const addBug = (text) => {
    if (!activeProject) return;
    const bugs = [{ id: nanoid(), text, createdAt: new Date().toISOString() }, ...(activeProject.bugs || [])];
    updateProjectData({ bugs });
    toast.error('Issue logged');
  };

  const deleteBug = (id) => {
    if (!activeProject) return;
    updateProjectData({ bugs: activeProject.bugs.filter(b => b.id !== id) });
  };

  const addIdea = (text) => {
    if (!activeProject) return;
    const ideas = [{ id: nanoid(), text, createdAt: new Date().toISOString() }, ...(activeProject.ideas || [])];
    updateProjectData({ ideas });
    toast.success('Feature concept captured');
  };

  const deleteIdea = (id) => {
    if (!activeProject) return;
    updateProjectData({ ideas: activeProject.ideas.filter(i => i.id !== id) });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-12">
      {/* Header & Project Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
            <div className="p-3 rounded-[1.5rem] bg-primary-500 text-white shadow-xl shadow-primary-500/20">
              <LayoutGrid size={32} />
            </div>
            Project Workspace
          </h1>
          <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs mt-2">Execute your architectural visions</p>
        </div>

        <ProjectSelector 
          projects={projects}
          activeProjectId={activeProjectId}
          onSelect={setActiveProjectId}
          onNewProject={() => setActiveTab('projects')}
        />
      </div>

      <AnimatePresence mode="wait">
        {activeProject ? (
          <motion.div 
            key={activeProjectId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Top Stats & Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-500">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Tasks</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">
                    {Object.values(activeProject.board || {}).flat().length}
                  </p>
                </div>
              </div>

              { (activeProject.github || activeProject.repo) && (
                <a 
                  href={activeProject.github || activeProject.repo} 
                  target="_blank" 
                  rel="noreferrer"
                  className="card p-6 bg-slate-900 text-white flex items-center gap-6 hover:bg-black transition-all group"
                >
                  <div className="p-4 rounded-2xl bg-white/10 text-white group-hover:scale-110 transition-transform">
                    <GithubIcon size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Repository</p>
                    <p className="text-sm font-black truncate">Open Github</p>
                  </div>
                </a>
              )}

              <div className="md:col-span-2 flex items-center justify-end">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-3 px-10 py-4 rounded-[2rem] bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-xl shadow-primary-500/30 active:scale-95 group"
                >
                  <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                  New Task
                </button>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {COLUMNS.map((column) => (
                  <div key={column.id} className="flex flex-col gap-6">
                    <div className="flex items-center justify-between px-4">
                      <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${column.color}`}>
                          {column.title}
                        </div>
                        <span className="text-xs font-black text-slate-300 dark:text-slate-600">
                          {activeProject.board?.[column.id]?.length || 0}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-[2.5rem] min-h-[600px] border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                      <SortableContext 
                        items={activeProject.board?.[column.id] || []}
                        strategy={verticalListSortingStrategy}
                      >
                        {(activeProject.board?.[column.id] || []).map((task) => (
                          <SortableTask key={task.id} task={task} onDelete={deleteTask} />
                        ))}
                      </SortableContext>
                      
                      {(activeProject.board?.[column.id]?.length || 0) === 0 && (
                        <div className="py-24 text-center opacity-20">
                          <p className="text-[10px] font-black uppercase tracking-widest dark:text-slate-500">Pipeline Clear</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <DragOverlay>
                  {activeId ? (
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-2xl border-2 border-primary-500/20 rotate-3 scale-105">
                      <h4 className="text-sm font-black text-slate-800 dark:text-white">
                        {Object.values(activeProject.board).flat().find(t => t.id === activeId)?.content}
                      </h4>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>

            {/* Side Panels: Bugs, Ideas, Resources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <BugTracker 
                bugs={activeProject.bugs || []} 
                onAdd={addBug} 
                onDelete={deleteBug} 
              />
              <IdeasPanel 
                ideas={activeProject.ideas || []} 
                onAdd={addIdea} 
                onDelete={deleteIdea} 
              />
              
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 lg:p-8 shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                    <LinkIcon size={18} className="text-blue-500" />
                    Project Assets
                  </h3>
                </div>
                
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  {projectResources.map(res => (
                    <a 
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-primary-50 dark:hover:bg-primary-500/10 border border-transparent hover:border-primary-100 dark:hover:border-primary-500/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary-500 shadow-sm">
                          <BookOpen size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{res.name}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{res.type}</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-slate-300 group-hover:text-primary-500" />
                    </a>
                  ))}
                  {projectResources.length === 0 && (
                    <div className="py-20 text-center opacity-30">
                      <p className="text-[10px] font-black uppercase tracking-widest dark:text-slate-500">No Linked Resources</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-40 text-center space-y-8"
          >
            <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner border border-slate-100 dark:border-slate-800">
              <LayoutGrid size={48} className="text-slate-200 dark:text-slate-700" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white">Select a Workspace</h2>
              <p className="text-slate-400 max-w-sm mx-auto font-medium">Choose a project from the selector above to activate its Kanban board and execution context.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Deploy Task</h2>
                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">Assign new work to the project board</p>
              </div>
              <form onSubmit={addTask} className="p-8 space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Task Brief</label>
                    <textarea 
                      required
                      rows="3"
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none resize-none text-slate-900 dark:text-white transition-all font-medium"
                      placeholder="What needs to be architected?"
                      value={newTask.content}
                      onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Work Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'task', icon: CheckCircle2, color: 'text-blue-500' },
                          { id: 'bug', icon: Bug, color: 'text-red-500' },
                          { id: 'feature', icon: Lightbulb, color: 'text-purple-500' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setNewTask({ ...newTask, type: t.id })}
                            className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all active:scale-95 ${
                              newTask.type === t.id 
                                ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/50 shadow-inner' 
                                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                            }`}
                          >
                            <t.icon size={20} className={newTask.type === t.id ? t.color : 'text-slate-300 dark:text-slate-600'} />
                            <span className="text-[9px] font-black uppercase tracking-widest dark:text-slate-500">{t.id}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Initial Status</label>
                      <select 
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px] cursor-pointer"
                        value={newTask.columnId}
                        onChange={(e) => setNewTask({ ...newTask, columnId: e.target.value })}
                      >
                        {COLUMNS.map(c => <option key={c.id} value={c.id} className="dark:bg-slate-900">{c.title}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 rounded-2xl bg-primary-500 text-white font-black hover:bg-primary-600 shadow-xl shadow-primary-500/30 transition-all active:scale-95"
                  >
                    Deploy Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workspace;
