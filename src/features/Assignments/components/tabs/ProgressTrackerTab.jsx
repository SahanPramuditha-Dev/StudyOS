import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const ProgressTrackerTab = ({ assignment }) => {
  // Calculate progress metrics
  const progress = useMemo(() => {
    const tasks = assignment.tasks || [];
    const submissions = assignment.submissions || [];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'doing').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;

    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const submissionCount = submissions.length;
    const hasFinalSubmission = submissions.some(s => s.version === 'Final' || s.submissionType === 'Final');

    return {
      taskProgress,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      submissionCount,
      hasFinalSubmission
    };
  }, [assignment]);

  // Calculate deadline progress
  const deadlineProgress = useMemo(() => {
    if (!assignment.deadline) return null;
    
    const createdAt = new Date(assignment.createdAt);
    const deadline = new Date(assignment.deadline);
    const now = new Date();
    
    const totalTime = deadline - createdAt;
    const elapsedTime = now - createdAt;
    const percentage = Math.min((elapsedTime / totalTime) * 100, 100);
    
    return {
      percentage: Math.max(0, percentage),
      daysLeft: Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
    };
  }, [assignment]);

  return (
    <div className="space-y-8">
      {/* Main Progress Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <CheckCircle2 size={24} className="text-blue-500" />
              Task Completion
            </h3>
            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {progress.totalTasks > 0 ? Math.round(progress.taskProgress) : 0}%
            </span>
          </div>

          <div className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.taskProgress}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                ></motion.div>
              </div>
            </div>

            {/* Task Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Completed</span>
                </div>
                <span className="font-black text-green-600 dark:text-green-400">{progress.completedTasks}/{progress.totalTasks}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">In Progress</span>
                </div>
                <span className="font-black text-yellow-600 dark:text-yellow-400">{progress.inProgressTasks}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-400"></div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">To Do</span>
                </div>
                <span className="font-black text-slate-600 dark:text-slate-400">{progress.todoTasks}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Deadline Progress */}
        {deadlineProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <Clock size={24} className={deadlineProgress.daysLeft <= 7 ? 'text-red-500' : 'text-yellow-500'} />
                Deadline Progress
              </h3>
              <span className={`text-3xl font-black ${
                deadlineProgress.daysLeft < 0 ? 'text-red-600 dark:text-red-400' :
                deadlineProgress.daysLeft <= 7 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-green-600 dark:text-green-400'
              }`}>
                {deadlineProgress.daysLeft}d
              </span>
            </div>

            <div className="space-y-6">
              {/* Circular Progress */}
              <div className="relative w-full h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - deadlineProgress.percentage / 100)}`}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - deadlineProgress.percentage / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-500">Time Elapsed</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">
                      {Math.round(deadlineProgress.percentage)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {deadlineProgress.daysLeft < 0 ? 'Overdue' : deadlineProgress.daysLeft === 0 ? 'Due Today' : 'Days remaining'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {deadlineProgress.daysLeft < 0 
                    ? `${Math.abs(deadlineProgress.daysLeft)} days overdue`
                    : `${deadlineProgress.daysLeft} days until deadline`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Submission Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm"
      >
        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6">Submission Status</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-6 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
            <div className="p-3 rounded-lg bg-blue-200 dark:bg-blue-500/20">
              <AlertCircle size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                Total Submissions
              </p>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{progress.submissionCount}</p>
            </div>
          </div>

          <div className={`flex items-center gap-4 p-6 rounded-xl border ${
            progress.hasFinalSubmission
              ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20'
              : 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20'
          }`}>
            <div className={`p-3 rounded-lg ${
              progress.hasFinalSubmission
                ? 'bg-green-200 dark:bg-green-500/20'
                : 'bg-yellow-200 dark:bg-yellow-500/20'
            }`}>
              <CheckCircle2 size={24} className={
                progress.hasFinalSubmission
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              } />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                progress.hasFinalSubmission ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                Final Submission
              </p>
              <p className={`text-3xl font-black ${
                progress.hasFinalSubmission ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                {progress.hasFinalSubmission ? 'Submitted' : 'Pending'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
            <div className="p-3 rounded-lg bg-purple-200 dark:bg-purple-500/20">
              <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-1">
                Overall Progress
              </p>
              <p className="text-3xl font-black text-purple-700 dark:text-purple-300">
                {Math.round((progress.taskProgress + (progress.hasFinalSubmission ? 100 : 0)) / 2)}%
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProgressTrackerTab;
