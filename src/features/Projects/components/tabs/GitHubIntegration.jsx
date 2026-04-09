import React, { useState } from 'react';
import {
  Github,
  ExternalLink,
  GitBranch,
  GitCommit,
  User,
  Calendar,
  Link as LinkIcon,
  Plus,
  Settings,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const buildPastDate = (offsetMs = 0) => new Date(Date.now() - offsetMs).toISOString();

const mockCommitsData = [
  {
    id: '1',
    message: 'Add project file manager and documentation system',
    author: 'You',
    date: buildPastDate(2 * 60 * 60 * 1000),
    hash: 'a1b2c3d'
  },
  {
    id: '2',
    message: 'Implement GitHub integration in projects',
    author: 'You',
    date: buildPastDate(1 * 24 * 60 * 60 * 1000),
    hash: 'e4f5g6h'
  },
  {
    id: '3',
    message: 'Set up submission tracking system',
    author: 'You',
    date: buildPastDate(3 * 24 * 60 * 60 * 1000),
    hash: 'i7j8k9l'
  }
];

const mockBranchesData = [
  { name: 'main', isDefault: true, lastCommit: 'a1b2c3d', lastUpdated: new Date().toISOString() },
  { name: 'develop', isDefault: false, lastCommit: 'e4f5g6h', lastUpdated: buildPastDate(1 * 24 * 60 * 60 * 1000) },
  { name: 'feature/projects', isDefault: false, lastCommit: 'i7j8k9l', lastUpdated: buildPastDate(7 * 24 * 60 * 60 * 1000) }
];

const GitHubIntegration = ({ project, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [repoUrl, setRepoUrl] = useState(project.repo || '');
  const [branches, setBranches] = useState(project.branches || []);
  const [commits, setCommits] = useState(project.commits || []);
  const [lastUpdated, setLastUpdated] = useState(project.lastGithubUpdate || null);

  const handleSaveRepo = () => {
    if (!repoUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub URL');
      return;
    }
    onUpdate({
      ...project,
      repo: repoUrl,
      lastGithubUpdate: new Date().toISOString()
    });
    setIsEditing(false);
    toast.success('Repository connected');
  };

  const parseRepoInfo = (url) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  };

  const repoInfo = project.repo ? parseRepoInfo(project.repo) : null;

  const mockCommits = mockCommitsData;
  const mockBranches = mockBranchesData;

  return (
    <div className="space-y-8">
      {/* Repository Info */}
      {project.repo ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-2xl bg-gray-900 text-white">
                <Github size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                  {repoInfo?.owner}/{repoInfo?.repo}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Connected GitHub repository for this project
                </p>
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all text-sm"
                >
                  <ExternalLink size={16} />
                  Open Repository
                </a>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-all"
            >
              <Settings size={20} />
            </button>
          </div>

          {lastUpdated && (
            <div className="text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-4">
              Last synchronized: {new Date(lastUpdated).toLocaleString()}
            </div>
          )}
        </motion.div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-4">
          <Github size={48} className="mx-auto text-slate-300" />
          <h3 className="font-black text-slate-900 dark:text-white">No Repository Connected</h3>
          <p className="text-slate-600 dark:text-slate-400">Connect your GitHub repository to see commits, branches, and pull requests</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all"
          >
            <Plus className="inline mr-2" size={16} />
            Connect Repository
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full space-y-6 border border-slate-100 dark:border-slate-800"
          >
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Connect GitHub Repository</h3>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Repository URL</label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRepo}
                className="flex-1 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all"
              >
                Connect
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {project.repo && (
        <>
          {/* Branches Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GitBranch size={24} />
                Branches
              </h3>
              <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-all">
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="grid gap-3">
              {mockBranches.map(branch => (
                <motion.div
                  key={branch.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GitBranch className="text-slate-400" size={18} />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {branch.name}
                          {branch.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-bold">
                              Default
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Last updated {new Date(branch.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`${project.repo}/tree/${branch.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-all"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Commits Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GitCommit size={24} />
                Recent Commits
              </h3>
              <a
                href={`${project.repo}/commits`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
              >
                View All
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="space-y-2">
              {mockCommits.map((commit, idx) => (
                <motion.div
                  key={commit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 pt-1">
                      <span className="inline-block w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-black flex items-center justify-center">
                        {commit.hash.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white break-words">
                        {commit.message}
                      </h4>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          {commit.author}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(commit.date).toLocaleDateString()}
                        </div>
                        <span>•</span>
                        <code className="text-slate-400">{commit.hash}</code>
                      </div>
                    </div>
                    <a
                      href={`${project.repo}/commit/${commit.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-all flex-shrink-0"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GitHubIntegration;
