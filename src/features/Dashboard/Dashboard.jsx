import React, { useMemo } from 'react';
import { 
  BookOpen, 
  Flame, 
  FileText, 
  Clock, 
  Plus, 
  ArrowUpRight,
  TrendingUp,
  Layout as KanbanIcon,
  BarChart,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Dashboard = ({ setActiveTab }) => {
  const { theme, toggleTheme } = useTheme();
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [streak] = useStorage(STORAGE_KEYS.STREAK, { current: 0, lastUpdate: null });

  console.log('[Dashboard] Data loaded:', { courses, notes, videos, streak, projects });

  const stats = useMemo(() => {
    const activeCourses = courses.filter(c => c.status === 'Active').length;
    const completedCourses = courses.filter(c => c.status === 'Completed').length;
    
    // Calculate total watch time from videos
    const totalSeconds = videos.reduce((acc, v) => acc + (v.lastPosition || 0), 0);
    const hours = (totalSeconds / 3600).toFixed(1);

    return [
      { label: 'Active Courses', value: activeCourses, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Study Streak', value: `${streak.current} Days`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'Notes Taken', value: notes.length, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Watch Time', value: `${hours}h`, icon: Clock, color: 'text-teal-600', bg: 'bg-teal-50' },
      { label: 'Completed', value: completedCourses, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    ];
  }, [courses, notes, videos, streak]);

  const productivityScore = useMemo(() => {
    if (courses.length === 0) return 0;
    const totalProgress = courses.reduce((acc, c) => acc + (c.progress || 0), 0);
    return Math.round(totalProgress / courses.length);
  }, [courses]);

  const recentActivities = useMemo(() => {
    const activities = [];
    
    // Get latest courses
    courses.slice(-2).forEach(c => activities.push({
      title: `Added Course: ${c.title}`,
      time: 'Recently',
      icon: BookOpen,
      color: 'bg-blue-500'
    }));

    // Get latest notes
    notes.slice(-2).forEach(n => activities.push({
      title: `Created Note: ${n.title}`,
      time: 'Recently',
      icon: FileText,
      color: 'bg-purple-500'
    }));

    // Get latest videos
    videos.slice(-2).forEach(v => activities.push({
      title: `Watched: ${v.title}`,
      time: v.progress === 100 ? 'Completed' : `${v.progress}% watched`,
      icon: Clock,
      color: 'bg-teal-500'
    }));

    // Get latest projects
    projects.slice(-2).forEach(p => activities.push({
      title: `New Project: ${p.name}`,
      time: p.status,
      icon: KanbanIcon,
      color: 'bg-slate-700'
    }));

    return activities.sort((a, b) => 0.5 - Math.random()).slice(0, 4);
  }, [courses, notes, videos, projects]);

  const todayFocus = useMemo(() => {
    return courses.find(c => c.status === 'Active') || courses[0];
  }, [courses]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-accent-600 p-8 text-white shadow-2xl shadow-primary-500/20">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold">Ready for a breakthrough?</h2>
            <p className="text-primary-100 max-w-md text-lg">
              Track your progress, manage your courses, and master your learning journey all in one place.
            </p>
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <button 
                onClick={() => setActiveTab('workspace')}
                className="px-6 py-2.5 rounded-xl bg-white text-primary-600 font-bold hover:bg-primary-50 transition-colors flex items-center gap-2 group"
              >
                <Plus size={18} />
                Create Study Plan
                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
              <button 
                onClick={toggleTheme}
                className="px-6 py-2.5 rounded-xl bg-primary-500/30 backdrop-blur-md border border-white/20 text-white font-bold hover:bg-primary-500/40 transition-colors flex items-center gap-2"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-black mb-1">{productivityScore}%</div>
              <div className="text-xs uppercase tracking-widest text-primary-200">Overall Progress</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-4xl font-black mb-1">{courses.length}</div>
              <div className="text-xs uppercase tracking-widest text-primary-200">Total Courses</div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-accent-400/20 rounded-full blur-2xl"></div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card group hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} dark:bg-slate-800 flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className={stat.color} size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                  <TrendingUp className="text-primary-500" size={24} />
                  Learning Activity
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500">Your study performance over the last 7 days</p>
              </div>
              <select className="bg-slate-50 dark:bg-slate-800 border-none text-sm font-semibold rounded-lg px-3 py-1.5 focus:ring-2 ring-primary-500/20 dark:text-white">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <div className="h-72 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <BarChart className="text-slate-300 dark:text-slate-600" size={32} />
              </div>
              <p className="text-slate-400 dark:text-slate-500 font-medium">Visualization Coming Soon</p>
              <p className="text-slate-300 dark:text-slate-600 text-sm">Add more data to see your trends</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                <Clock className="text-orange-500" size={20} />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivities.map((activity, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-1 h-10 rounded-full ${activity.color}`}></div>
                    <div>
                      <p className="text-sm font-bold dark:text-slate-200">{activity.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No recent activity found.</p>
                )}
              </div>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                <KanbanIcon className="text-accent-500" size={20} />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setActiveTab('courses')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left group"
                >
                  <Plus size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-primary-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">New Course</p>
                </button>
                <button 
                  onClick={() => setActiveTab('notes')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-accent-50 dark:hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400 transition-colors text-left group"
                >
                  <FileText size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-accent-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">New Note</p>
                </button>
                <button 
                  onClick={() => setActiveTab('reminders')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-left group"
                >
                  <Clock size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-orange-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Timer</p>
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left group"
                >
                  <TrendingUp size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-teal-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Analytics</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / Focus */}
        <div className="space-y-8">
          <div className="card overflow-hidden">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Efficiency Score</h3>
            <div className="flex flex-col items-center text-center py-4">
              <div className="relative w-40 h-40 mb-4 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset={440 - (440 * productivityScore) / 100} className="text-primary-500 transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black dark:text-white">{productivityScore}</span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Based on your overall course completion progress.</p>
            </div>
          </div>

          <div className="card bg-slate-900 text-white border-none">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="text-primary-400" size={20} />
              Today's Focus
            </h3>
            <div className="space-y-4">
              {todayFocus ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-sm font-bold text-white mb-1">{todayFocus.title}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Progress</span>
                    <span>{todayFocus.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${todayFocus.progress}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-sm text-slate-400">No active courses. Add one to start tracking!</p>
                </div>
              )}
              <button 
                onClick={() => setActiveTab('videos')}
                className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 transition-colors font-bold text-sm"
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
