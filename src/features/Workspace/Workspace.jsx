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
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { useReminders } from '../../context/ReminderContext';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

// Sub-components
import ProjectSelector from './components/ProjectSelector';
import ProjectOverview from './components/detail/ProjectOverview';
import ProjectFiles from './components/detail/ProjectFiles';
import ProjectCode from './components/detail/ProjectCode';
import ProjectTasks from './components/detail/ProjectTasks';
import ProjectDocs from './components/detail/ProjectDocs';
import ProjectSubmissions from './components/detail/ProjectSubmissions';

const Workspace = ({ activeProjectIdOverride, setActiveTab }) => {
  const [projects, setProjects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments, setAssignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [activeContextKey, setActiveContextKey] = useStorage(
    'active_workspace_context',
    activeProjectIdOverride ? `project:${activeProjectIdOverride}` : null
  );
  const [activeSubTab, setActiveSubTab] = useState('overview');
  
  const { addReminder } = useReminders();

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
    if (!activeContext) return { progress: 0 };
    const allTasks = Object.values(activeContext.board).flat();
    const completed = activeContext.board.done.length;
    return {
      progress: allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0,
      totalTasks: allTasks.length
    };
  }, [activeContext]);

  const [activeId, setActiveId] = useState(null);
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

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: Monitor },
    { id: 'files', label: 'Assets', icon: Database },
    { id: 'tasks', label: 'Pipeline', icon: Target },
    { id: 'code', label: 'Code', icon: CodeIcon },
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'submissions', label: 'Finalize', icon: Send },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-10">
      {/* Header & Project Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-slate-900 dark:bg-primary-500 text-white shadow-2xl shadow-primary-500/20 flex items-center justify-center">
            <LayoutGrid size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {activeContext ? activeContext.name : 'System Workspace'}
            </h1>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mt-1">
              {activeContext ? `${activeContext.entityType === 'assignment' ? 'Assignment' : 'Project'} Subject: ${activeContext.subject || 'General'}` : 'Select a workspace module to begin'}
            </p>
          </div>
        </div>

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
      </div>

      {activeContext && (
        <div className="flex items-center gap-2 p-1.5 rounded-[2rem] bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSubTab === tab.id 
                  ? 'bg-white dark:bg-slate-900 text-primary-500 shadow-xl shadow-primary-500/5' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeContext ? (
          <motion.div 
            key={`${activeContextKey}-${activeSubTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeSubTab === 'overview' && <ProjectOverview project={activeContext} stats={stats} onNavigate={setActiveSubTab} />}
            {activeSubTab === 'files' && <ProjectFiles project={activeContext} onUpdate={updateProjectData} />}
            {activeSubTab === 'code' && <ProjectCode project={activeContext} onUpdate={updateProjectData} />}
            {activeSubTab === 'tasks' && (
              <ProjectTasks 
                project={activeContext} 
                onDeleteTask={(id) => {
                  const updatedBoard = { ...activeContext.board };
                  Object.keys(updatedBoard).forEach(col => {
                    updatedBoard[col] = updatedBoard[col].filter(t => t.id !== id);
                  });
                  updateProjectData({ board: updatedBoard });
                }}
                onQuickReminder={handleQuickReminder}
                onNewTask={() => setIsModalOpen(true)}
                // We'll simplify DND for now or keep existing logic if needed
                sensors={null} // Simplified for initial overhaul
              />
            )}
            {activeSubTab === 'docs' && <ProjectDocs project={activeContext} onUpdate={updateProjectData} />}
            {activeSubTab === 'submissions' && <ProjectSubmissions project={activeContext} onUpdate={updateProjectData} />}
          </motion.div>
        ) : (
          <div className="py-40 text-center space-y-8">
            <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner border border-slate-100 dark:border-slate-800">
              <LayoutGrid size={48} className="text-slate-200 dark:text-slate-700" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Access Restricted</h2>
              <p className="text-slate-400 max-w-sm mx-auto font-medium">Initialize a project module from the selector above to activate your architectural workspace.</p>
            </div>
          </div>
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
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Deploy Task</h2>
                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">Assign new work to the project board</p>
              </div>
              <form onSubmit={addTask} className="p-8 space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Task Brief</label>
                    <textarea 
                      required
                      rows="3"
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none resize-none text-slate-900 dark:text-white transition-all font-bold"
                      placeholder="What needs to be architected?"
                      value={newTask.content}
                      onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Priority</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Medium', 'High'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewTask({ ...newTask, priority: p })}
                            className={`p-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                              newTask.priority === p 
                                ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' 
                                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Pipeline Stage</label>
                      <select 
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px] cursor-pointer"
                        value={newTask.columnId}
                        onChange={(e) => setNewTask({ ...newTask, columnId: e.target.value })}
                      >
                        <option value="todo" className="dark:bg-slate-900">To Do</option>
                        <option value="doing" className="dark:bg-slate-900">In Progress</option>
                        <option value="done" className="dark:bg-slate-900">Completed</option>
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
                    className="flex-1 py-4 rounded-2xl bg-primary-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/30 transition-all active:scale-95"
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
