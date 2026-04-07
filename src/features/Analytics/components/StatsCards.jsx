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
    { label: 'Watch Time', value: `${(stats.totalWatchTime / 60).toFixed(1)}h`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Study Streak', value: `${stats.streak} Days`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: 'Avg. Progress', value: `${stats.avgProgress}%`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-500/10' },
    { label: 'Active Courses', value: stats.activeCourses, icon: BookOpen, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-500/10' },
    { label: 'Productivity', value: stats.productivityScore, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {cardData.map((stat, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="card group hover:-translate-y-1 transition-all bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
              <stat.icon className={stat.color} size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
