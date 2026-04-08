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
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

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
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800"
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
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Description</label>
                  <textarea
                    value={newBug.description}
                    onChange={(e) => setNewBug({ ...newBug, description: e.target.value })}
                    placeholder="Describe the bug, steps to reproduce, expected vs actual..."
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Severity</label>
                    <select
                      value={newBug.severity}
                      onChange={(e) => setNewBug({ ...newBug, severity: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {severities.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Status</label>
                    <select
                      value={newBug.status}
                      onChange={(e) => setNewBug({ ...newBug, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBug}
                    className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all"
                  >
                    Report Bug
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Button */}
      <button
        onClick={() => setIsCreating(true)}
        className="w-full px-6 py-3 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Report New Bug
      </button>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <div>
          <label className="text-xs font-bold text-slate-500 mb-2 block">Status:</label>
          {['All', ...statuses].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-bold mr-2 transition-all ${
                filterStatus === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800'
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
              className={`px-3 py-1 rounded-lg text-xs font-bold mr-2 transition-all ${
                filterSeverity === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800'
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
          className="py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
        >
          <Bug size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-bold mb-2">No bugs reported</p>
          <p className="text-sm text-slate-400">Everything is working perfectly!</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredBugs.map((bug) => (
            <motion.div
              key={bug.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="text-red-500">⚠️</span>
                    {bug.title}
                  </h4>
                  {bug.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{bug.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={12} />
                    {new Date(bug.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleDeleteBug(bug.id)}
                    className="p-2 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(bug.status)}`}>
                  {bug.status}
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${getSeverityColor(bug.severity)}`}>
                  <Zap size={10} />
                  {bug.severity}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                {statuses.map(status => (
                  <button
                    key={status}
                    onClick={() => handleUpdateBugStatus(bug.id, status)}
                    className={`px-2 py-1 text-xs rounded font-bold transition-all ${
                      bug.status === status
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BugTracker;
