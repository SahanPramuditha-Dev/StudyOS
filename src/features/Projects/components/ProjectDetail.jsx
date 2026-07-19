import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Github,
  Bug,
  CheckSquare,
  FileUp,
  Code2,
  Lightbulb,
  History,
  Settings,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Share2,
  Lock,
  Globe,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { useStorage } from '../../../hooks/useStorage';
import { STORAGE_KEYS } from '../../../services/storage';
import GitHubIntegration from './tabs/GitHubIntegration';
import DocumentationEditor from './tabs/DocumentationEditor';
import TaskManager from './tabs/TaskManager';
import SubmissionTracker from './tabs/SubmissionTracker';
import BugTracker from './tabs/BugTracker';
import CodeSnippets from './tabs/CodeSnippets';
import NotesIdeapad from './tabs/NotesIdeapad';
import ActivityLog from './tabs/ActivityLog';
import ResourcesTab from './tabs/ResourcesTab';

const OverviewTab = ({ project, getStatusColor }) => {
  const [globalResources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const completedTasks = project.board?.done?.length || 0;
  const totalTasks = (project.board?.todo?.length || 0) + (project.board?.doing?.length || 0) + completedTasks;
  const projectFileCount = globalResources.filter(r => r.associatedType === 'Project' && r.associatedId === project.id && r.type !== 'Link').length;

  const stats = [
    {
      label: 'Progress',
      value: `${completedTasks}/${totalTasks}`,
      icon: CheckCircle2,
      bg: 'bg-green-100',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Files',
      value: projectFileCount,
      icon: FileText,
      bg: 'bg-blue-100',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Submissions',
      value: project.submissions?.length || 0,
      icon: FileUp,
      bg: 'bg-purple-100',
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6 hover:shadow-xl hover:border-primary-100 dark:hover:border-primary-500/20 transition-all"
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

      {/* Project Details */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
              <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(project.status)}`}>
                {project.status || 'Ongoing'}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject / Module</p>
              <p className="font-bold text-slate-900 dark:text-white">{project.subject || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technology Stack</p>
              <p className="font-bold text-slate-900 dark:text-white">{project.stack || 'Not specified'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</p>
              <p className={`font-black text-lg ${
                project.priority === 'High' ? 'text-red-500' :
                project.priority === 'Medium' ? 'text-amber-500' :
                'text-blue-500'
              }`}>
                {project.priority || 'Medium'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadline</p>
              {project.deadline ? (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  <p className="font-bold text-slate-900 dark:text-white">
                    {new Date(project.deadline).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400">No deadline set</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Created</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description</p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {project.description || 'No description provided.'}
          </p>
        </div>
      </div>
    </div>
  );
};

const ProjectDetail = ({ project, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [accessLevel, setAccessLevel] = useStorage(`project_access_${project.id}`, 'private');
  const showGithubTab = Boolean(project.repo) || (
    typeof window !== 'undefined' && Boolean(localStorage.getItem('github_token'))
  );
  const displayActiveTab = !showGithubTab && activeTab === 'github' ? 'overview' : activeTab;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'resources', label: 'Resources', icon: BookOpen, badge: project.resources?.length || 0 },
    { id: 'github', label: 'GitHub', icon: Github },
    { id: 'docs', label: 'Docs', icon: FileText, badge: project.docs?.length || 0 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: project.board?.todo?.length || 0 },
    { id: 'submissions', label: 'Submissions', icon: FileUp, badge: project.submissions?.length || 0 },
    { id: 'bugs', label: 'Issues', icon: Bug, badge: project.bugs?.length || 0 },
    { id: 'code', label: 'Snippets', icon: Code2, badge: project.snippets?.length || 0 },
    { id: 'notes', label: 'Notes', icon: Lightbulb },
    { id: 'activity', label: 'Activity', icon: History }
  ].filter(tab => showGithubTab || tab.id !== 'github');

  const getStatusColor = (status) => {
    const colors = {
      'Ongoing': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
      'Submitted': 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
      'Completed': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
      'Archived': 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
    };
    return colors[status] || colors['Ongoing'];
  };

  const handleAddActivity = (type, detail) => {
    const activity = {
      id: nanoid(),
      type,
      detail,
      timestamp: new Date().toISOString()
    };
    onUpdate({ ...project, activity: [activity, ...(project.activity || [])] });
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto flex flex-col h-[calc(100vh-160px)] overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-8 shrink-0 pt-2">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 rounded-[1.5rem] bg-primary-500 text-white shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowLeft size={28} />
            </button>
            {project.name}
          </h1>
          <p className="text-slate-400 font-medium md:ml-20">
            {project.subject && `${project.subject} • `}
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="shrink-0 mt-6 lg:mt-0 flex gap-3">
          <button
            onClick={() => setIsShareOpen(!isShareOpen)}
            className="flex items-center gap-3 px-6 py-3.5 rounded-[2rem] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-black transition-all shadow-sm active:scale-95"
          >
            <Share2 size={20} /> Share
          </button>
        </div>
      </div>

      {/* Share Menu */}
      <AnimatePresence>
        {isShareOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-24 z-50 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-4"
          >
            <h3 className="font-black text-slate-900 dark:text-white">Access Control</h3>
            <div className="flex gap-3">
              {[
                { value: 'private', icon: Lock, label: 'Private' },
                { value: 'shared_view', icon: Globe, label: 'View Only' },
                { value: 'shared_edit', icon: Globe, label: 'Can Edit' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setAccessLevel(opt.value);
                    handleAddActivity('access_changed', `Access changed to ${opt.label}`);
                    toast.success(`Project is now ${opt.label}`);
                    setIsShareOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    accessLevel === opt.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <opt.icon size={16} />
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 pb-8">
        {/* Left Sidebar */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-4">Workspace Modules</p>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = displayActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  {tab.label}
                </div>
                {tab.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-primary-500/10 text-primary-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar pr-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={displayActiveTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="pb-12"
            >
              {displayActiveTab === 'overview' && <OverviewTab project={project} getStatusColor={getStatusColor} />}
              {displayActiveTab === 'resources' && <ResourcesTab project={project} onUpdate={onUpdate} onActivityAdd={handleAddActivity} />}
              {displayActiveTab === 'github' && <GitHubIntegration project={project} onUpdate={onUpdate} />}
              {displayActiveTab === 'docs' && <DocumentationEditor project={project} onUpdate={onUpdate} onActivityAdd={handleAddActivity} />}
              {displayActiveTab === 'tasks' && <TaskManager project={project} onUpdate={onUpdate} onActivityAdd={handleAddActivity} />}
              {displayActiveTab === 'submissions' && <SubmissionTracker project={project} onUpdate={onUpdate} onActivityAdd={handleAddActivity} />}
              {displayActiveTab === 'bugs' && <BugTracker project={project} onUpdate={onUpdate} onActivityAdd={handleAddActivity} />}
              {displayActiveTab === 'code' && <CodeSnippets project={project} onUpdate={onUpdate} onActivityAdd={handleAddActivity} />}
              {displayActiveTab === 'notes' && <NotesIdeapad project={project} onUpdate={onUpdate} onActivityAdd={handleAddActivity} />}
              {displayActiveTab === 'activity' && <ActivityLog project={project} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
