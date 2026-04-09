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
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { useStorage } from '../../../hooks/useStorage';
import FileManager from './tabs/FileManager';
import GitHubIntegration from './tabs/GitHubIntegration';
import DocumentationEditor from './tabs/DocumentationEditor';
import TaskManager from './tabs/TaskManager';
import SubmissionTracker from './tabs/SubmissionTracker';
import BugTracker from './tabs/BugTracker';
import CodeSnippets from './tabs/CodeSnippets';
import NotesIdeapad from './tabs/NotesIdeapad';
import ActivityLog from './tabs/ActivityLog';

const OverviewTab = ({ project, getStatusColor }) => (
  <div className="space-y-8">
    {/* Header Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 p-6 rounded-2xl border border-green-100 dark:border-green-500/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm text-slate-600 dark:text-slate-300">Progress</h3>
          <CheckCircle2 className="text-green-500" size={20} />
        </div>
        <p className="text-3xl font-black text-green-700 dark:text-green-400">
          {project.board?.done?.length || 0}/{(project.board?.todo?.length || 0) + (project.board?.doing?.length || 0) + (project.board?.done?.length || 0)}
        </p>
        <p className="text-xs text-slate-500 mt-2">Tasks completed</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-500/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm text-slate-600 dark:text-slate-300">Files</h3>
          <FileText className="text-blue-500" size={20} />
        </div>
        <p className="text-3xl font-black text-blue-700 dark:text-blue-400">
          {project.files?.length || 0}
        </p>
        <p className="text-xs text-slate-500 mt-2">Study materials uploaded</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-500/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm text-slate-600 dark:text-slate-300">Submissions</h3>
          <FileUp className="text-purple-500" size={20} />
        </div>
        <p className="text-3xl font-black text-purple-700 dark:text-purple-400">
          {project.submissions?.length || 0}
        </p>
        <p className="text-xs text-slate-500 mt-2">Versions submitted</p>
      </motion.div>
    </div>

    {/* Project Details */}
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
            <span className={`inline-block px-4 py-2 rounded-xl text-sm font-black ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subject / Module</p>
            <p className="font-bold text-slate-900 dark:text-white">{project.subject || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Technology Stack</p>
            <p className="font-bold text-slate-900 dark:text-white">{project.stack || 'Not specified'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority</p>
            <p className={`font-black text-lg ${
              project.priority === 'High' ? 'text-red-500' :
              project.priority === 'Medium' ? 'text-amber-500' :
              'text-blue-500'
            }`}>
              {project.priority || 'Medium'}
            </p>
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Deadline</p>
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
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Created</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Description</p>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>
      </div>
    </div>
  </div>
);

const ProjectDetail = ({ project, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [accessLevel, setAccessLevel] = useStorage(`project_access_${project.id}`, 'private');
  const showGithubTab = Boolean(project.repo) || (
    typeof window !== 'undefined' && Boolean(sessionStorage.getItem('github_token'))
  );
  const displayActiveTab = !showGithubTab && activeTab === 'github' ? 'overview' : activeTab;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'files', label: 'Files', icon: FileText, badge: project.files?.length || 0 },
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

  // Overview Tab Content is handled externally by the OverviewTab helper.

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {project.name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {project.subject && `${project.subject} • `}
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setIsShareOpen(!isShareOpen)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-primary-500/10 hover:text-primary-500 transition-all"
            title="Share Project"
          >
            <Share2 size={20} />
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
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg space-y-4"
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

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-slate-200 dark:border-slate-800 custom-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all relative shrink-0 ${
                displayActiveTab === tab.id
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={18} />
              {tab.label}
              {tab.badge > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-xs font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={displayActiveTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {displayActiveTab === 'overview' && <OverviewTab project={project} getStatusColor={getStatusColor} />}
          {displayActiveTab === 'files' && <FileManager project={project} onUpdate={onUpdate} onActivityAdd={handleAddActivity} />}
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
  );
};

export default ProjectDetail;
