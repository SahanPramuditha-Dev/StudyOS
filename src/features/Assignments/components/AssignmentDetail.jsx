import React, { useState } from 'react';
import {
  ChevronLeft,
  Share2,
  MoreVertical,
  Calendar,
  Users,
  Award,
  Clock,
  GaugeCircle,
  AlertCircle,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Tab components
import OverviewTab from './tabs/OverviewTab';
import SubmissionTab from './tabs/SubmissionTab';
import TaskBreakdownTab from './tabs/TaskBreakdownTab';
import ProgressTrackerTab from './tabs/ProgressTrackerTab';
import NotesTab from './tabs/NotesTab';
import ResourcesTab from './tabs/ResourcesTab';
import ActivityTab from './tabs/ActivityTab';

const AssignmentDetail = ({ assignment, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Calculate deadline status
  const getDeadlineInfo = () => {
    if (!assignment.deadline) return null;
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return {
      days: diff,
      isOverdue: diff < 0,
      isToday: diff === 0,
      isSoon: diff > 0 && diff <= 7
    };
  };

  const deadlineInfo = getDeadlineInfo();

  // Get status color
  const getStatusColor = () => {
    const colors = {
      'Not Started': 'from-slate-400 to-slate-600',
      'In Progress': 'from-yellow-400 to-yellow-600',
      'Submitted': 'from-green-400 to-green-600',
      'Late': 'from-red-400 to-red-600'
    };
    return colors[assignment.status] || colors['Not Started'];
  };

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'submission', label: 'Submissions', icon: CheckCircle2 },
    { id: 'tasks', label: 'Task Breakdown', icon: GaugeCircle },
    { id: 'progress', label: 'Progress', icon: Clock },
    { id: 'notes', label: 'Draft Notes', icon: FileText },
    { id: 'resources', label: 'Resources', icon: Award },
    { id: 'activity', label: 'Activity', icon: Users }
  ];

  const handleShare = () => {
    const text = `Check out my assignment: ${assignment.title}`;
    if (navigator.share) {
      navigator.share({
        title: assignment.title,
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    }
    setIsShareOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header Section */}
      <div className={`bg-gradient-to-br ${getStatusColor()} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 rounded-full bg-white blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition-all mb-8 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          {/* Title Section */}
          <div className="flex items-start justify-between gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl font-black mb-3">{assignment.title}</h1>
              {assignment.description && (
                <p className="text-white/90 font-medium">{assignment.description}</p>
              )}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsShareOpen(!isShareOpen)}
                className="p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                title="Share"
              >
                <Share2 size={20} />
              </button>
              <button
                className="p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                title="More options"
              >
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {assignment.subject && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Subject</p>
                <p className="text-white font-black text-lg">{assignment.subject}</p>
              </div>
            )}
            {assignment.lecturer && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Lecturer</p>
                <p className="text-white font-black text-lg">{assignment.lecturer}</p>
              </div>
            )}
            {assignment.marks && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Marks</p>
                <p className="text-white font-black text-lg">{assignment.marks}</p>
              </div>
            )}
            {deadlineInfo && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Deadline</p>
                <p className="text-white font-black text-lg">
                  {deadlineInfo.isOverdue ? 'Overdue' : deadlineInfo.isToday ? 'Today' : `${Math.abs(deadlineInfo.days)}d`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Menu */}
      <AnimatePresence>
        {isShareOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsShareOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Tabs Navigation */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 pb-2 min-w-min">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <TabIcon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab assignment={assignment} onUpdate={onUpdate} />
            )}
            {activeTab === 'submission' && (
              <SubmissionTab assignment={assignment} onUpdate={onUpdate} />
            )}
            {activeTab === 'tasks' && (
              <TaskBreakdownTab assignment={assignment} onUpdate={onUpdate} />
            )}
            {activeTab === 'progress' && (
              <ProgressTrackerTab assignment={assignment} />
            )}
            {activeTab === 'notes' && (
              <NotesTab assignment={assignment} onUpdate={onUpdate} />
            )}
            {activeTab === 'resources' && (
              <ResourcesTab assignment={assignment} onUpdate={onUpdate} />
            )}
            {activeTab === 'activity' && (
              <ActivityTab assignment={assignment} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AssignmentDetail;
