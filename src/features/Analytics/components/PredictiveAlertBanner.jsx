import React from 'react';
import { AlertTriangle, TrendingDown, Flame, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PredictiveAlertBanner = ({ stats, watchData }) => {
  // Generate a mock alert or recommendation based on actual stats
  const activeDays = watchData.filter(d => d.minutes > 0).length;
  const currentStreak = stats.streak;
  
  let alertType = 'info';
  let title = 'Steady Progress!';
  let message = 'You are maintaining a steady pace. Keep up the good work!';
  let icon = <CheckCircle className="text-emerald-500" size={20} />;
  let colorClass = 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300';

  if (activeDays <= 2 && currentStreak > 0) {
    alertType = 'warning';
    title = 'Streak at Risk!';
    message = `You have only studied ${activeDays} days this week. Watch a video or take a note today to preserve your ${currentStreak}-day streak!`;
    icon = <Flame className="text-orange-500 animate-pulse" size={20} />;
    colorClass = 'bg-orange-50/80 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/50 text-orange-800 dark:text-orange-300';
  } else if (stats.productivityScore < 30) {
    alertType = 'danger';
    title = 'Productivity Dip Detected';
    message = 'Your productivity index is currently low. Try establishing a 15-minute daily focus target to rebuild momentum.';
    icon = <AlertTriangle className="text-red-500" size={20} />;
    colorClass = 'bg-red-50/80 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-300';
  } else if (activeDays >= 5) {
    alertType = 'success';
    title = 'Consistent Performer!';
    message = `Amazing job! You have been active ${activeDays} out of the last 7 days. Your retention is outstanding.`;
    icon = <TrendingDown className="text-primary-500 rotate-180" size={20} />;
    colorClass = 'bg-primary-50/80 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/50 text-primary-800 dark:text-primary-300';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-4 p-4 rounded-2xl border ${colorClass} shadow-sm backdrop-blur-sm`}
    >
      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex-shrink-0">
        {icon}
      </div>
      <div className="space-y-0.5">
        <h4 className="font-black text-sm uppercase tracking-wider">{title}</h4>
        <p className="text-xs font-semibold opacity-90">{message}</p>
      </div>
    </motion.div>
  );
};

export default PredictiveAlertBanner;
