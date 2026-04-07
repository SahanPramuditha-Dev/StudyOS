import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Code, 
  LayoutGrid,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

// Sub-components
import ProjectItem from './components/ProjectItem';
import ProjectForm from './components/ProjectForm';
import ConfirmModal from '../../components/ConfirmModal';

const Projects = ({ onSelectProject }) => {
  // 1. State Management
  const [projects, setProjects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Active, Completed, Paused
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '' });

  const [formData, setFormData] = useState({
    name: '',
    stack: '',
    repo: '',
    status: 'Active',
    priority: 'Medium',
    deadline: '',
    description: '',
    board: { todo: [], doing: [], done: [] },
    bugs: [],
    ideas: []
  });

  // 2. Stats Calculation
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'Active').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const totalTasks = projects.reduce((acc, p) => {
      const pTasks = p.board ? (
        (p.board.todo?.length || 0) + 
        (p.board.doing?.length || 0) + 
        (p.board.done?.length || 0)
      ) : 0;
      return acc + pTasks;
    }, 0);

    return { total, active, completed, totalTasks };
  }, [projects]);

  // 3. Logic & Filtering
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.stack?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterType === 'All') return matchesSearch;
      return matchesSearch && p.status === filterType;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [projects, searchTerm, filterType]);

  // 4. CRUD Handlers
  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      ...project,
      name: project.name || '',
      stack: project.stack || '',
      repo: project.repo || '',
      status: project.status || 'Active',
      priority: project.priority || 'Medium',
      deadline: project.deadline || '',
      description: project.description || '',
      board: project.board || { todo: [], doing: [], done: [] },
      bugs: project.bugs || [],
      ideas: project.ideas || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProject) {
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id ? { ...formData, updatedAt: new Date().toISOString() } : p
      ));
      toast.success('Architectural vision updated');
    } else {
      const newProject = { 
        ...formData, 
        id: nanoid(), 
        createdAt: new Date().toISOString() 
      };
      setProjects(prev => [newProject, ...prev]);
      toast.success('Project deployed to workspace');
    }
    closeModal();
  };

  const deleteProject = (id) => {
    setConfirmConfig({
      isOpen: true,
      message: 'Archive this architectural vision permanently?',
      onConfirm: () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        toast.success('Project archived');
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setFormData({
      name: '',
      stack: '',
      repo: '',
      status: 'Active',
      priority: 'Medium',
      deadline: '',
      description: '',
      board: { todo: [], doing: [], done: [] },
      bugs: [],
      ideas: []
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
            <div className="p-3 rounded-[1.5rem] bg-primary-500 text-white shadow-xl shadow-primary-500/20">
              <Code size={32} />
            </div>
            Architectural Projects
          </h1>
          <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs mt-2">Design and execute your digital visions</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-3.5 rounded-[2rem] bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-xl shadow-primary-500/30 active:scale-95 group"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform" />
          New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Projects', value: stats.total, icon: FolderOpen, color: 'text-primary-500', bg: 'bg-primary-50' },
          { label: 'Active Builds', value: stats.active, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Completed Visions', value: stats.completed, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Deployed Tasks', value: stats.totalTasks, icon: LayoutGrid, color: 'text-purple-500', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6"
          >
            <div className={`p-4 rounded-2xl ${stat.bg} dark:bg-opacity-10 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search projects, stacks, or visions..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-transparent focus:border-primary-500/20 outline-none transition-all text-sm font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto custom-scrollbar">
          <Filter size={18} className="text-slate-400 mr-2 shrink-0" />
          {['All', 'Active', 'Completed', 'Paused', 'Archived'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                filterType === type 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                  : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-primary-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map(project => (
            <ProjectItem 
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={deleteProject}
              onOpenWorkspace={(id) => onSelectProject(id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-24 flex flex-col items-center justify-center space-y-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800"
        >
          <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <LayoutGrid size={64} className="text-slate-200" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-800 dark:text-white">No projects found</h3>
            <p className="text-slate-400 font-medium mt-2">Ready to architect your next vision?</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 rounded-2xl bg-primary-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-primary-600 transition-all active:scale-95 shadow-lg shadow-primary-500/20"
          >
            Deploy First Project
          </button>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <ProjectForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={closeModal}
            isEditing={!!editingProject}
          />
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        message={confirmConfig.message}
        title="Project Management"
      />
    </div>
  );
};

export default Projects;
