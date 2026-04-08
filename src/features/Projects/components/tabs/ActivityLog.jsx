import React from 'react';
import {
  History,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  GitCommit,
  Share2,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

const ActivityLog = ({ project }) => {
  const activities = project.activity || [];

  const getActivityIcon = (type) => {
    const icons = {
      'file_upload': { icon: Upload, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10' },
      'doc_created': { icon: FileText, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/10' },
      'doc_updated': { icon: Edit3, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/10' },
      'doc_deleted': { icon: Trash2, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/10' },
      'task_created': { icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/10' },
      'submission_uploaded': { icon: Plus, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-500/10' },
      'bug_created': { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/10' },
      'bug_status_changed': { icon: CheckCircle2, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-500/10' },
      'note_created': { icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/10' },
      'note_updated': { icon: Edit3, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/10' },
      'access_changed': { icon: Share2, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-500/10' },
      'snippet_created': { icon: GitCommit, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-500/10' }
    };

    return icons[type] || { icon: History, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-500/10' };
  };

  const getActivityLabel = (type) => {
    const labels = {
      'file_upload': '📤 File Uploaded',
      'doc_created': '📝 Documentation Created',
      'doc_updated': '✏️ Documentation Updated',
      'doc_deleted': '🗑️ Documentation Deleted',
      'task_created': '✅ Task Created',
      'submission_uploaded': '📤 Submission Uploaded',
      'bug_created': '🐛 Bug Reported',
      'bug_status_changed': '🔄 Bug Status Changed',
      'note_created': '💡 Note Created',
      'note_updated': '💭 Note Updated',
      'access_changed': '🔐 Access Level Changed',
      'snippet_created': '💻 Code Snippet Saved'
    };
    return labels[type] || 'Activity';
  };

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
      >
        <History size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500 font-bold mb-2">No activity yet</p>
        <p className="text-sm text-slate-400">All your project activities will appear here</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {activities.map((activity, idx) => {
          const { icon: Icon, color, bg } = getActivityIcon(activity.type);
          const timestamp = new Date(activity.timestamp);
          const timeAgo = getTimeAgo(timestamp);

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all flex items-start gap-4"
            >
              <div className={`p-3 rounded-lg ${bg} flex-shrink-0`}>
                <Icon className={color} size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  {getActivityLabel(activity.type)}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {activity.detail || 'Activity performed on this project'}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <time>{timestamp.toLocaleDateString()}</time>
                  <span>•</span>
                  <time>{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  <span>•</span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">{timeAgo}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Timeline Visualization */}
      <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h3 className="font-black text-slate-900 dark:text-white mb-4">Activity Summary</h3>
        <div className="space-y-3">
          {Object.entries(
            activities.reduce((acc, a) => {
              acc[a.type] = (acc[a.type] || 0) + 1;
              return acc;
            }, {})
          ).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {getActivityLabel(type)}
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 font-bold text-sm">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const getTimeAgo = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
};

export default ActivityLog;
