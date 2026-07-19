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
  FolderOpen,
  Archive,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

import ProjectItem from './components/ProjectItem';
import ProjectForm from './components/ProjectForm';
import ProjectDetail from './components/ProjectDetail';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import BulkActionBar from '../../components/BulkActionBar';
import { toggleSelectionId, toggleSelectAll, hardDeleteByIds } from '../../utils/entityOps';
import Select from '../../components/ui/Select';

const Projects = ({ onSelectProject }) => {
  // 1. State Management
  const [projects, setProjects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Active, Completed, Paused, Archived
  const [sortType, setSortType] = useState('Newest');
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, onConfirm: () => {}, message: '' });
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    stack: '',
    repo: '',
    status: 'Ongoing', // Ongoing, Submitted, Completed
    priority: 'Medium',
    deadline: '',
    description: '',
    board: { todo: [], doing: [], done: [] },
    files: [], // { name, type, size, url, tag, createdAt }
    docs: [], // { id, title, content, version, updatedAt }
    submissions: [], // { id, title, fileUrl, date, version }
    bugs: [], // { id, title, desc, status, severity, screenshot }
    snippets: [], // { id, title, code, language }
    notes: [], // { id, title, content, createdAt, updatedAt }
    activity: [] // { id, type, detail, timestamp }
  });

  // Get selected project
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  // 2. Stats Calculation
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'Ongoing').length;
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
    let result = projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.stack?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterType === 'All') return matchesSearch;
      if (filterType === 'Active') return matchesSearch && p.status === 'Ongoing';
      return matchesSearch && p.status === filterType;
    });

    return result.sort((a, b) => {
      if (sortType === 'Newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortType === 'Oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortType === 'Name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [projects, searchTerm, filterType, sortType]);

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
      subject: '',
      stack: '',
      repo: '',
      status: 'Ongoing',
      priority: 'Medium',
      deadline: '',
      description: '',
      board: { todo: [], doing: [], done: [] },
      files: [],
      docs: [],
      submissions: [],
      bugs: [],
      snippets: [],
      notes: [],
      activity: []
    });
  };

  // Show Project Detail if one is selected
  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProjectId(null)}
        onUpdate={(updated) => {
          setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
          toast.success('Project updated');
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-12 relative">
      <PageHeader 
        title="Architectural Projects"
        description="Design and execute your digital visions"
        icon={<Code size={32} />}
        action={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-3.5 rounded-[2rem] bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-xl shadow-primary-500/30 active:scale-95 group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            New Project
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Projects', value: stats.total, icon: FolderOpen, tint: 'text-primary-500', bg: 'bg-primary-500/10' },
          { label: 'Active Builds', value: stats.active, icon: TrendingUp, tint: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Completed Visions', value: stats.completed, icon: CheckCircle2, tint: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Deployed Tasks', value: stats.totalTasks, icon: LayoutGrid, tint: 'text-purple-500', bg: 'bg-purple-500/10' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.tint} shadow-inner transition-transform group-hover:scale-110`}>
                <stat.icon size={22} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="relative z-[90] flex flex-col gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search projects, stacks, or visions..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] focus:shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus:border-primary-500 outline-none transition-all font-bold placeholder:font-medium placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={sortType}
              onChange={setSortType}
              options={[
                { label: 'Newest First', value: 'Newest' },
                { label: 'Oldest First', value: 'Oldest' },
                { label: 'Sort by Name', value: 'Name' }
              ]}
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl glass w-fit">
          <div className="flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-700/50">
            <Filter size={14} className="text-primary-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</span>
          </div>
          {['All', 'Active', 'Completed', 'Paused', 'Archived'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shrink-0 ${
                filterType === type 
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
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
              onOpenWorkspace={(id) => setSelectedProjectId(id)}
              isSelected={selectedProjectIds.includes(project.id)}
              onSelect={(id) => setSelectedProjectIds(prev => toggleSelectionId(prev, id))}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <EmptyState
          icon={LayoutGrid}
          title="No projects found"
          message="Ready to architect your next vision?"
          action={{
            label: "Deploy First Project",
            onClick: () => setIsModalOpen(true)
          }}
        />
      )}

      {/* Bulk Action Bar */}
      {selectedProjectIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <BulkActionBar 
            selectedCount={selectedProjectIds.length}
            onClear={() => setSelectedProjectIds([])}
            onSelectVisible={() => setSelectedProjectIds(prev => toggleSelectAll(prev, filteredProjects.map(p => p.id)))}
          >
            <div className="flex-1" />
            <button
              onClick={() => {
                setConfirmConfig({
                  isOpen: true,
                  message: `Archive ${selectedProjectIds.length} projects?`,
                  onConfirm: () => {
                    setProjects(prev => prev.map(p => 
                      selectedProjectIds.includes(p.id) ? { ...p, status: 'Archived' } : p
                    ));
                    setSelectedProjectIds([]);
                    toast.success('Projects archived');
                  }
                });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-slate-600 dark:text-slate-300 transition-all"
            >
              <Archive size={14} /> Archive
            </button>
            <button
              onClick={() => {
                setConfirmConfig({
                  isOpen: true,
                  message: `Permanently delete ${selectedProjectIds.length} projects?`,
                  onConfirm: () => {
                    setProjects(prev => hardDeleteByIds(prev, selectedProjectIds));
                    setSelectedProjectIds([]);
                    toast.success('Projects deleted');
                  }
                });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/70 dark:bg-slate-900/40 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-1.5 transition-all"
            >
              <Trash2 size={14} /> Delete
            </button>
          </BulkActionBar>
        </div>
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
