import React, { useState } from 'react';
import {
  Plus,
  Bug,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  Zap,
  MessageSquare,
  Calendar,
  User,
  Link as LinkIcon,
  Github,
  Layout as Kanban,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import Select from '../../../../components/ui/Select';
import { generateGeminiResponse } from '../../../../services/aiService';

const BugTracker = ({ project, onUpdate, onActivityAdd }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [bugs, setBugs] = useState(project.bugs || []);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [newBug, setNewBug] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    status: 'Open'
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [diagnosingBugId, setDiagnosingBugId] = useState(null);

  const statuses = ['Open', 'In Progress', 'Fixed', 'Closed'];
  const severities = ['Low', 'Medium', 'High', 'Critical'];

  const handleCreateBug = () => {
    if (!newBug.title.trim()) {
      toast.error('Bug title is required');
      return;
    }

    const bug = {
      id: nanoid(),
      ...newBug,
      createdAt: new Date().toISOString(),
      screenshot: null
    };

    setBugs([bug, ...bugs]);
    onUpdate({ ...project, bugs: [bug, ...bugs] });
    onActivityAdd('bug_created', `Found bug: ${newBug.title}`);
    toast.success('Bug reported');

    setNewBug({ title: '', description: '', severity: 'Medium', status: 'Open' });
    setIsCreating(false);
  };

  const handleUpdateBugStatus = (bugId, newStatus) => {
    const updated = bugs.map(b => b.id === bugId ? { ...b, status: newStatus } : b);
    setBugs(updated);
    onUpdate({ ...project, bugs: updated });
    onActivityAdd('bug_status_changed', `Bug status changed to ${newStatus}`);
  };

  const handleDeleteBug = (bugId) => {
    const updated = bugs.filter(b => b.id !== bugId);
    setBugs(updated);
    onUpdate({ ...project, bugs: updated });
    toast.success('Bug removed');
  };

  const handleSyncGitHubIssues = async () => {
    if (!project.github?.repoUrl) {
      toast.error('No GitHub repository linked to this project.');
      return;
    }
    
    setIsSyncing(true);
    try {
      const urlParts = project.github.repoUrl.split('github.com/');
      if (urlParts.length !== 2) throw new Error("Invalid GitHub URL");
      
      const [owner, repo] = urlParts[1].replace('.git', '').split('/');
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all`);
      if (!response.ok) throw new Error('Failed to fetch issues');
      
      const issues = await response.json();
      
      const newBugs = issues
        .filter(issue => !issue.pull_request) // filter out PRs which are technically issues
        .map(issue => ({
          id: `gh-${issue.id}`,
          title: issue.title,
          description: issue.body || 'No description provided.',
          severity: issue.labels?.some(l => l.name.toLowerCase().includes('bug')) ? 'High' : 'Medium',
          status: issue.state === 'closed' ? 'Closed' : 'Open',
          createdAt: issue.created_at,
          isGitHub: true,
          githubUrl: issue.html_url
        }));

      const existingIds = new Set(bugs.map(b => b.id));
      const filteredNewBugs = newBugs.filter(b => !existingIds.has(b.id));
      
      if (filteredNewBugs.length > 0) {
        const updated = [...filteredNewBugs, ...bugs];
        setBugs(updated);
        onUpdate({ ...project, bugs: updated });
        toast.success(`Synced ${filteredNewBugs.length} issues from GitHub`);
      } else {
        toast.success('No new issues found');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to sync GitHub issues');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDiagnoseBug = async (bug) => {
    setDiagnosingBugId(bug.id);
    try {
      const prompt = `You are an expert AI debugger. Analyze this bug report and provide a short diagnostic summary (potential causes, steps to fix, or code snippets). Keep it concise, actionable, and format with markdown.
      
Title: ${bug.title}
Description: ${bug.description}
Severity: ${bug.severity}`;

      const response = await generateGeminiResponse(prompt);
      
      const updated = bugs.map(b => b.id === bug.id ? { ...b, diagnostic: response } : b);
      setBugs(updated);
      onUpdate({ ...project, bugs: updated });
      toast.success('Diagnostic complete');
    } catch (error) {
      toast.error('Diagnostic failed: ' + error.message);
    } finally {
      setDiagnosingBugId(null);
    }
  };

  const handleSendToKanban = (bug) => {
    const newTask = {
      id: nanoid(),
      title: `Fix: ${bug.title}`,
      description: bug.description,
      priority: bug.severity === 'Critical' ? 'High' : bug.severity,
      createdAt: new Date().toISOString()
    };
    
    const updatedBoard = project.board || { todo: [], doing: [], done: [] };
    const updatedProject = {
      ...project,
      board: {
        ...updatedBoard,
        todo: [newTask, ...updatedBoard.todo]
      }
    };
    
    onUpdate(updatedProject);
    toast.success('Bug added to Kanban board (To Do)');
  };

  const filteredBugs = bugs.filter(b => {
    const statusMatch = filterStatus === 'All' || b.status === filterStatus;
    const severityMatch = filterSeverity === 'All' || b.severity === filterSeverity;
    return statusMatch && severityMatch;
  });

  const getSeverityColor = (severity) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
      'High': 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
      'Medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
      'Low': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
    };
    return colors[severity] || colors['Medium'];
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
      'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
      'Fixed': 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
      'Closed': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
    };
    return colors[status] || colors['Open'];
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
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Bug size={20} />
                  Report a Bug
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
                    value={newBug.title}
                    onChange={(e) => setNewBug({ ...newBug, title: e.target.value })}
                    placeholder="What's the bug?"
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Description</label>
                  <textarea
                    value={newBug.description}
                    onChange={(e) => setNewBug({ ...newBug, description: e.target.value })}
                    placeholder="Describe the bug, steps to reproduce, expected vs actual..."
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-y custom-scrollbar text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Severity</label>
                    <Select
                      value={newBug.severity}
                      onChange={(e) => setNewBug({ ...newBug, severity: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                      options={severities.map(s => ({ label: s, value: s }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Status</label>
                    <Select
                      value={newBug.status}
                      onChange={(e) => setNewBug({ ...newBug, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                      options={statuses.map(s => ({ label: s, value: s }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBug}
                    className="flex-1 py-3 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
                  >
                    Report Bug
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsCreating(true)}
          className="flex-1 px-6 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.98]"
        >
          <Plus size={20} />
          Report New Bug
        </button>

        {project.github?.repoUrl && (
          <button
            onClick={handleSyncGitHubIssues}
            disabled={isSyncing}
            className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 active:scale-[0.98]"
          >
            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            Sync GitHub
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <div>
          <label className="text-xs font-bold text-slate-500 mb-2 block">Status:</label>
          {['All', ...statuses].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold mr-2 transition-all ${
                filterStatus === s
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="ml-4">
          <label className="text-xs font-bold text-slate-500 mb-2 block">Severity:</label>
          {['All', ...severities].map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold mr-2 transition-all ${
                filterSeverity === s
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bugs List */}
      {filteredBugs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
             <Bug size={32} className="text-slate-400" />
          </div>
          <p className="text-slate-900 dark:text-white font-bold text-lg mb-2">No bugs reported</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">Everything is working perfectly! Time to write more code.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredBugs.map((bug) => (
            <motion.div
              key={bug.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-black text-lg text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="text-red-500"><Bug size={18} /></span>
                    {bug.title}
                    {bug.isGitHub && (
                      <a href={bug.githubUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="View on GitHub">
                         <Github size={16} />
                      </a>
                    )}
                  </h4>
                  {bug.description && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar pr-2">{bug.description}</div>
                  )}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4">
                    <Calendar size={12} />
                    {new Date(bug.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDiagnoseBug(bug)}
                    disabled={diagnosingBugId === bug.id}
                    className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all tooltip relative flex items-center justify-center disabled:opacity-50"
                  >
                    <Sparkles size={16} className={diagnosingBugId === bug.id ? "animate-pulse" : ""} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">AI Diagnose</span>
                  </button>
                  <button
                    onClick={() => handleSendToKanban(bug)}
                    className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all tooltip relative flex items-center justify-center"
                  >
                    <Kanban size={16} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Send to Kanban</span>
                  </button>
                  <button
                    onClick={() => handleDeleteBug(bug.id)}
                    className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all tooltip relative flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Delete</span>
                  </button>
                </div>
              </div>

              {bug.diagnostic && (
                <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 relative">
                  <div className="absolute -top-3 left-4 bg-indigo-100 dark:bg-indigo-800 px-2 py-0.5 rounded text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 flex items-center gap-1"><Sparkles size={10} /> AI Diagnostic</div>
                  <div className="text-sm text-indigo-900 dark:text-indigo-200 mt-2 whitespace-pre-wrap font-medium">
                     {bug.diagnostic}
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mr-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${getStatusColor(bug.status)}`}>
                    {bug.status}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 ${getSeverityColor(bug.severity)}`}>
                    <Zap size={10} />
                    {bug.severity}
                  </span>
                </div>

                <div className="flex gap-1 ml-auto">
                  {statuses.map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateBugStatus(bug.id, status)}
                      className={`px-3 py-1.5 text-[11px] rounded-lg font-bold transition-all ${
                        bug.status === status
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BugTracker;
