import React, { useState } from 'react';
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
  Plus,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { generateGeminiResponse } from '../../../../services/aiService';

const ActivityLog = ({ project }) => {
  const activities = project.activity || [];
  const [filter, setFilter] = useState('All');
  const [aiReport, setAiReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

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
      'snippet_created': { icon: GitCommit, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-500/10' },
      'focus_session': { icon: History, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/10' }
    };

    return icons[type] || { icon: History, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-500/10' };
  };

  const getActivityLabel = (type) => {
    const labels = {
      'file_upload': 'File Uploaded',
      'doc_created': 'Documentation Created',
      'doc_updated': 'Documentation Updated',
      'doc_deleted': 'Documentation Deleted',
      'task_created': 'Task Created',
      'submission_uploaded': 'Submission Uploaded',
      'bug_created': 'Bug Reported',
      'bug_status_changed': 'Bug Status Changed',
      'note_created': 'Note Created',
      'note_updated': 'Note Updated',
      'access_changed': 'Access Level Changed',
      'snippet_created': 'Code Snippet Saved',
      'focus_session': 'Focus Session Completed'
    };
    return labels[type] || 'Activity';
  };

  const getFilteredActivities = () => {
    if (filter === 'All') return activities;
    
    return activities.filter(a => {
       if (filter === 'Tasks') return a.type.includes('task') || a.type.includes('focus');
       if (filter === 'Bugs') return a.type.includes('bug');
       if (filter === 'Docs') return a.type.includes('doc') || a.type.includes('snippet') || a.type.includes('note');
       if (filter === 'Submissions') return a.type.includes('submission');
       return true;
    });
  };

  const handleGenerateReport = async () => {
    if (activities.length === 0) {
      toast.error("Not enough activity to generate a report.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const recentActivities = activities.slice(0, 20).map(a => `${getActivityLabel(a.type)}: ${a.detail}`).join('\n');
      const prompt = `You are an AI Project Manager. Analyze this recent activity log for a project and provide a concise 2-paragraph "Project Status & Health Report". 
      Focus on momentum, what's being worked on, and any bottlenecks or high bug activity. Be encouraging but analytical. Use markdown.
      
      Recent Activity:
      ${recentActivities}`;
      
      const response = await generateGeminiResponse(prompt);
      setAiReport(response);
      toast.success("Report generated!");
    } catch (error) {
      toast.error("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
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

  const filteredActivities = getFilteredActivities();
  const filters = ['All', 'Tasks', 'Bugs', 'Docs', 'Submissions'];

  return (
    <div className="space-y-6">
      
      {/* Top Header & Report Generator */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
            <Sparkles className="text-indigo-500" size={20} />
            AI Health Report
          </h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1 max-w-md">Generate an instant analysis of your project's recent momentum, bug rates, and overall health.</p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 whitespace-nowrap active:scale-[0.98]"
        >
          {isGenerating ? 'Analyzing Log...' : 'Generate Status Report'}
        </button>
      </div>

      <AnimatePresence>
        {aiReport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-black">
              {aiReport}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
         <Filter size={16} className="text-slate-400 mr-2 flex-shrink-0" />
         {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              {f}
            </button>
         ))}
      </div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {filteredActivities.length === 0 ? (
           <div className="py-10 text-center text-slate-500">No activities match this filter.</div>
        ) : (
          filteredActivities.map((activity, idx) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.type);
            const timestamp = new Date(activity.timestamp);
            const timeAgo = getTimeAgo(timestamp);
            const isExpanded = expandedId === activity.id;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                onClick={() => toggleExpand(activity.id)}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all flex flex-col gap-4 group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${bg} flex-shrink-0 mt-1`}>
                    <Icon className={color} size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                        {getActivityLabel(activity.type)}
                      </h4>
                      <div className="text-slate-400 group-hover:text-primary-500 transition-colors">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                    
                    <p className={`text-sm text-slate-600 dark:text-slate-400 font-medium ${isExpanded ? '' : 'line-clamp-1'}`}>
                      {activity.detail || 'Activity performed on this project'}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-2">
                      <time className="flex items-center gap-1"><History size={12}/> {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                      <span className="text-primary-500 dark:text-primary-400">{timeAgo}</span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-16 pr-4 overflow-hidden"
                    >
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-black uppercase text-slate-400 mb-2">Activity Details</p>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                            Type: {activity.type}
                            {'\n'}ID: {activity.id}
                            {'\n'}Date: {timestamp.toString()}
                            {'\n'}Full Detail: {activity.detail}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Timeline Visualization */}
      <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
        <h3 className="font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2">
           <History size={18} className="text-primary-500" /> Activity Summary Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(
            activities.reduce((acc, a) => {
              acc[a.type] = (acc[a.type] || 0) + 1;
              return acc;
            }, {})
          ).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
             const { icon: Icon, color, bg } = getActivityIcon(type);
             return (
              <div key={type} className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className={`p-2 rounded-lg ${bg}`}>
                   <Icon className={color} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="text-[10px] font-black uppercase text-slate-400 truncate">{getActivityLabel(type)}</div>
                   <div className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1">{count}</div>
                </div>
              </div>
            )
          })}
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
