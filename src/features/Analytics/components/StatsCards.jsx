import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Award, 
  Flame, 
  CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatsCards = ({ stats }) => {
  const cardData = [
    { label: 'Watch Time', value: `${(stats.totalWatchTime / 60).toFixed(1)}h`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', detail: 'Total hours' },
    { label: 'Study Streak', value: `${stats.streak} Days`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10', detail: 'Daily momentum' },
    { label: 'Avg. Progress', value: `${stats.avgProgress}%`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-500/10', detail: 'Course mastery' },
    { label: 'Active Courses', value: stats.activeCourses, icon: BookOpen, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-500/10', detail: 'In progress' },
    { label: 'Productivity', value: `${stats.productivityScore}/100`, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10', detail: 'Performance index' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {cardData.map((stat, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1 transition-all duration-300 group flex items-center gap-5"
        >
          <div className={`w-16 h-16 rounded-[1.5rem] ${stat.bg} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0`}>
            <stat.icon className={stat.color} size={30} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{stat.value}</h3>
            <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase mt-1 tracking-wider">{stat.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
