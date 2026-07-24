import React, { useState, useMemo } from 'react';
import { 
  Plus, 
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
  Bell,
  FileText,
  Code as CodeIcon,
  Activity,
  Send,
  X,
  ChevronRight,
  Monitor,
  Target,
  Database,
  Users,
  Sparkles,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { useReminders } from '../../context/ReminderContext';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';

// Sub-components
import ProjectSelector from './components/ProjectSelector';
import ProjectOverview from './components/detail/ProjectOverview';
import ProjectFiles from './components/detail/ProjectFiles';
import ProjectCode from './components/detail/ProjectCode';
import ProjectTasks from './components/detail/ProjectTasks';
import ProjectDocs from './components/detail/ProjectDocs';
import ProjectSubmissions from './components/detail/ProjectSubmissions';
import WorkspaceTeam from './components/detail/WorkspaceTeam';
import ProjectOrion from './components/detail/ProjectOrion';
import WorkspaceTemplates from './components/WorkspaceTemplates';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';

const Workspace = ({ activeProjectIdOverride, setActiveTab }) => {
  const [projects, setProjects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments, setAssignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [activeContextKey, setActiveContextKey] = useStorage(
    'active_workspace_context',
    activeProjectIdOverride ? `project:${activeProjectIdOverride}` : null
  );
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  
  const { addReminder } = useReminders();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setActiveTaskId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over || !activeContext) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const board = { ...activeContext.board };
    let activeCol = null;
    let overCol = null;

    Object.keys(board).forEach((colId) => {
      if (board[colId].some((t) => t.id === activeId)) activeCol = colId;
      if (board[colId].some((t) => t.id === overId) || colId === overId) overCol = colId;
    });

    if (!activeCol || !overCol) return;

    if (activeCol !== overCol) {
      const task = board[activeCol].find((t) => t.id === activeId);
      const updatedTask = { ...task, status: overCol };
      
      const newActiveColTasks = board[activeCol].filter((t) => t.id !== activeId);
      const overTasks = [...board[overCol]];
      const overIndex = overTasks.findIndex((t) => t.id === overId);
      
      if (overIndex !== -1) {
        overTasks.splice(overIndex, 0, updatedTask);
      } else {
        overTasks.push(updatedTask);
      }

      const updatedBoard = {
        ...board,
        [activeCol]: newActiveColTasks,
        [overCol]: overTasks
      };
      
      updateProjectData({ board: updatedBoard });
    } else {
      const tasks = [...board[activeCol]];
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const reordered = arrayMove(tasks, activeIndex, overIndex);
        const updatedBoard = {
          ...board,
          [activeCol]: reordered
        };
        updateProjectData({ board: updatedBoard });
      }
    }
  };

  // 1. Contextual Project Data
  const activeContext = useMemo(() => {
    if (!activeContextKey) return null;
    const [entityType, entityId] = String(activeContextKey).includes(':')
      ? String(activeContextKey).split(':')
      : ['project', activeContextKey];

    const source = entityType === 'assignment'
      ? assignments.find((a) => a.id === entityId)
      : projects.find((p) => p.id === entityId);
    if (!source) return null;

    const boardFromAssignmentTasks = (source.tasks || []).reduce((acc, task) => {
      const status = task.status === 'done' ? 'done' : task.status === 'doing' ? 'doing' : 'todo';
      acc[status].push(task);
      return acc;
    }, { todo: [], doing: [], done: [] });

    return {
      ...source,
      entityType,
      id: source.id,
      name: source.name || source.title || 'Untitled',
      board: {
        todo: entityType === 'assignment' ? boardFromAssignmentTasks.todo : (source.board?.todo || []),
        doing: entityType === 'assignment' ? boardFromAssignmentTasks.doing : (source.board?.doing || []),
        done: entityType === 'assignment' ? boardFromAssignmentTasks.done : (source.board?.done || [])
      },
      files: source.files || [],
      docs: source.docs || [],
      submissions: source.submissions || [],
      snippets: source.snippets || [],
      activity: source.activity || []
    };
  }, [projects, assignments, activeContextKey]);

  const stats = useMemo(() => {
    if (!activeContext) return { progress: 0, totalTasks: 0, filesCount: 0, docsCount: 0 };
    const allTasks = Object.values(activeContext.board).flat();
    const completed = activeContext.board.done.length;
    return {
      progress: allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0,
      totalTasks: allTasks.length,
      filesCount: activeContext.files.length,
      docsCount: activeContext.docs.length
    };
  }, [activeContext]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ content: '', priority: 'Medium', columnId: 'todo' });

  // 2. Project-Scoped CRUD Operations
  const updateProjectData = (updates) => {
    if (!activeContext) return;
    
    // Auto-log activity for major updates
    let activityUpdate = {};
    if (updates.files) activityUpdate = { id: nanoid(), type: 'file', detail: `Asset deployed: ${updates.files[0]?.name}`, timestamp: new Date().toISOString() };
    if (updates.submissions) activityUpdate = { id: nanoid(), type: 'submission', detail: `Deliverable archived: ${updates.submissions[0]?.title}`, timestamp: new Date().toISOString() };
    if (updates.docs) activityUpdate = { id: nanoid(), type: 'doc', detail: `Documentation versioned: ${updates.docs[0]?.title}`, timestamp: new Date().toISOString() };

    if (activeContext.entityType === 'assignment') {
      setAssignments(assignments.map((a) => {
        if (a.id !== activeContext.id) return a;
        const board = updates.board || activeContext.board;
        const tasks = Object.entries(board).flatMap(([status, items]) => (items || []).map((task) => ({ ...task, status })));
        return {
          ...a,
          ...updates,
          tasks,
          activity: activityUpdate.id ? [activityUpdate, ...(a.activity || [])].slice(0, 10) : (a.activity || [])
        };
      }));
      return;
    }

    setProjects(projects.map((p) =>
      p.id === activeContext.id ? {
        ...p,
        ...updates,
        activity: activityUpdate.id ? [activityUpdate, ...(p.activity || [])].slice(0, 10) : (p.activity || [])
      } : p
    ));
  };

  const handleQuickReminder = (task) => {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 60 * 60 * 1000);
    addReminder({
      message: `Work on: ${task.content} (${activeContext?.entityType === 'assignment' ? 'Assignment' : 'Project'}: ${activeContext?.name || 'Workspace'})`,
      date: reminderTime.toISOString().split('T')[0],
      time: reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      priority: 'High',
      category: 'Workspace',
      enabled: true
    });
    toast.success('System alert scheduled for 1 hour from now');
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.content.trim() || !activeContext) return;
    const now = new Date();
    const task = { ...newTask, id: nanoid(), createdAt: now.toISOString() };
    const updatedBoard = { ...activeContext.board };
    updatedBoard[newTask.columnId].push(task);
    updateProjectData({ board: updatedBoard });
    setNewTask({ content: '', priority: 'Medium', columnId: 'todo' });
    setIsModalOpen(false);
    toast.success('Task deployed to board');

    addReminder({
      message: `Project Task: ${task.content}`,
      description: `Task for ${activeContext.entityType} ${activeContext.name}`,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      durationMinutes: 60,
      category: 'Workspace',
      priority: task.priority || 'Medium',
      enabled: true,
      completed: false,
      recurring: 'None',
      reminderOffsetMinutes: 15,
      sendEmail: false,
      relatedProjectId: activeContext.entityType === 'project' ? activeContext.id : '',
      relatedAssignmentId: activeContext.entityType === 'assignment' ? activeContext.id : ''
    });
  };

  const handleCreateFromTemplate = (template) => {
    const now = new Date().toISOString();
    const newProject = {
      id: nanoid(),
      name: `New ${template.title}`,
      title: `New ${template.title}`,
      createdAt: now,
      status: 'Ongoing',
      board: {
        todo: template.tasks.map(t => ({ id: nanoid(), content: t, createdAt: now })),
        doing: [],
        done: []
      },
      docs: template.docs.map(d => ({ id: nanoid(), title: d, content: `# ${d}\n\nStart writing here...`, version: 1, updatedAt: now })),
      files: [],
      submissions: [],
      activity: [{ id: nanoid(), type: 'system', detail: `Project initialized from ${template.title} template`, timestamp: now }]
    };
    
    setProjects([newProject, ...projects]);
    setActiveContextKey(`project:${newProject.id}`);
    toast.success(`${template.title} scaffolded successfully!`);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    const updatedBoard = { ...activeContext.board };
    Object.keys(updatedBoard).forEach(col => {
      updatedBoard[col] = updatedBoard[col].filter(t => t.id !== taskToDelete);
    });
    updateProjectData({ board: updatedBoard });
    setTaskToDelete(null);
    setIsConfirmOpen(false);
    toast.success('Task removed');
  };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: Monitor },
    { id: 'files', label: 'Assets', icon: Database, badge: stats.filesCount },
    { id: 'tasks', label: 'Pipeline', icon: Target, badge: stats.totalTasks },
    { id: 'code', label: 'Code', icon: CodeIcon },
    { id: 'docs', label: 'Docs', icon: FileText, badge: stats.docsCount },
    { id: 'submissions', label: 'Finalize', icon: Send },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'orion', label: 'Orion AI', icon: Sparkles },
  ];

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-10">
      {/* Page Header */}
      <PageHeader
        title={activeContext ? activeContext.name : 'System Workspace'}
        description={activeContext ? `${activeContext.entityType === 'assignment' ? 'Assignment' : 'Project'} Context | subject: ${activeContext.subject || 'General'}` : 'Select a workspace module to begin'}
        icon={<Layers size={32} />}
        action={
          <ProjectSelector 
            contexts={[
              ...projects.map((p) => ({ key: `project:${p.id}`, id: p.id, label: p.title || p.name, type: 'project' })),
              ...assignments.map((a) => ({ key: `assignment:${a.id}`, id: a.id, label: a.title || a.name, type: 'assignment' }))
            ]}
            activeContextKey={activeContextKey}
            onSelect={setActiveContextKey}
            onNewProject={() => setActiveTab('projects')}
            onNewAssignment={() => setActiveTab('assignments')}
          />
        }
      />

      {/* Top Glass Stats Cards Grid */}
      {activeContext && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pipeline Progress', value: `${stats.progress}%`, icon: Target, tint: 'text-sky-500', bg: 'bg-sky-500/10' },
            { label: 'Total tasks', value: stats.totalTasks, icon: CheckCircle2, tint: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Project Assets', value: stats.filesCount, icon: Database, tint: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: 'Documents', value: stats.docsCount, icon: FileText, tint: 'text-amber-500', bg: 'bg-amber-500/10' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group shadow-sm border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.tint} shadow-inner transition-transform group-hover:scale-110`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pill Sub-Tabs Navigator */}
      {activeContext && (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl glass bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 w-full overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                activeSubTab === tab.id 
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${activeSubTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeContext ? (
          <motion.div 
            key={`${activeContextKey}-${activeSubTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSubTab === 'overview' && <ProjectOverview project={activeContext} stats={stats} onNavigate={setActiveSubTab} />}
            {activeSubTab === 'files' && <ProjectFiles project={activeContext} onUpdate={updateProjectData} />}
            {activeSubTab === 'code' && <ProjectCode project={activeContext} onUpdate={updateProjectData} />}
            {activeSubTab === 'tasks' && (
              <ProjectTasks 
                project={activeContext} 
                onDeleteTask={(id) => {
                  setTaskToDelete(id);
                  setIsConfirmOpen(true);
                }}
                onQuickReminder={handleQuickReminder}
                onNewTask={() => setIsModalOpen(true)}
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                activeId={activeTaskId}
              />
            )}
            {activeSubTab === 'docs' && <ProjectDocs project={activeContext} onUpdate={updateProjectData} />}
            {activeSubTab === 'submissions' && <ProjectSubmissions project={activeContext} onUpdate={updateProjectData} />}
            {activeSubTab === 'team' && <WorkspaceTeam project={activeContext} />}
            {activeSubTab === 'orion' && <ProjectOrion project={activeContext} />}
          </motion.div>
        ) : (
          <WorkspaceTemplates onSelectTemplate={handleCreateFromTemplate} />
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Deploy Task</h2>
                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">Assign new work to the project board</p>
              </div>
              <form onSubmit={addTask} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Task Brief</label>
                    <textarea 
                      required
                      rows="3"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none resize-none text-slate-900 dark:text-white transition-all text-sm font-semibold"
                      placeholder="What needs to be architected?"
                      value={newTask.content}
                      onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Priority</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['Low', 'Medium', 'High'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewTask({ ...newTask, priority: p })}
                            className={`py-2 px-1 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                              newTask.priority === p 
                                ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20' 
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Pipeline Stage</label>
                      <select 
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white font-black uppercase tracking-widest text-[9px] cursor-pointer"
                        value={newTask.columnId}
                        onChange={(e) => setNewTask({ ...newTask, columnId: e.target.value })}
                      >
                        <option value="todo">To Do</option>
                        <option value="doing">In Progress</option>
                        <option value="done">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                  >
                    Deploy Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        message="Are you sure you want to permanently delete this task from the project board?"
        type="danger"
      />
    </div>
  );
};

export default Workspace;
