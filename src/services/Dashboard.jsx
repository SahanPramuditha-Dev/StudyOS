import React, { useMemo, useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Clock, 
  Plus, 
  ArrowUpRight,
  TrendingUp,
  Layout as KanbanIcon,
  BarChart,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Target
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const go = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`);
  };
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [streak] = useStorage(STORAGE_KEYS.STREAK, { current: 0, lastUpdate: null });
  const [globalTasks] = useStorage('studyos_global_tasks', []);
  const activeTasks = useMemo(() => globalTasks.filter(t => t.status === 'in_progress'), [globalTasks]);

  // State for the Learning Activity chart filter
  const [activityTimeframe, setActivityTimeframe] = useState('7');

  const stats = useMemo(() => {
    const activeCourses = courses.filter(c => c.status === 'Active').length;
    const submittedAssignments = assignments.filter(a => a.status === 'Submitted').length;
    const pendingAssignments = assignments.filter(a => a.status !== 'Submitted').length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;

    return [
      { label: 'Active Courses', value: activeCourses, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', route: 'courses' },
      { label: 'Notes Taken', value: notes.length, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', route: 'notes' },
      { label: 'Pending Assignments', value: pendingAssignments, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', route: 'assignments' },
      { label: 'Submitted', value: submittedAssignments, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', route: 'assignments' },
      { label: 'Active Projects', value: activeProjects, icon: KanbanIcon, color: 'text-slate-700', bg: 'bg-slate-100', route: 'projects' },
    ];
  }, [courses, notes, assignments, projects]);

  const productivityScore = useMemo(() => {
    if (courses.length === 0) return 0;
    const totalProgress = courses.reduce((acc, c) => acc + (c.progress || 0), 0);
    return Math.round(totalProgress / courses.length);
  }, [courses]);

  const recentActivities = useMemo(() => {
    const activities = [];
    
    courses.forEach(c => activities.push({
      title: `Added Course: ${c.title}`,
      time: 'Recently',
      icon: BookOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      createdAt: c.createdAt || ''
    }));

    notes.forEach(n => activities.push({
      title: `Created Note: ${n.title}`,
      time: 'Recently',
      icon: FileText,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      createdAt: n.createdAt || ''
    }));

    videos.forEach(v => activities.push({
      title: `Watched: ${v.title}`,
      time: v.progress === 100 ? 'Completed' : `${v.progress}% watched`,
      icon: Clock,
      color: 'text-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-500/10',
      createdAt: v.lastWatched || v.addedAt || ''
    }));

    projects.forEach(p => activities.push({
      title: `New Project: ${p.name}`,
      time: p.status,
      icon: KanbanIcon,
      color: 'text-slate-700',
      bg: 'bg-slate-100 dark:bg-slate-800',
      createdAt: p.createdAt || ''
    }));

    assignments.forEach(a => activities.push({
      title: `New Assignment: ${a.title}`,
      time: a.status,
      icon: FileText,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      createdAt: a.createdAt || ''
    }));

    return activities
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
      .slice(0, 5);
  }, [courses, notes, videos, projects, assignments]);

  const todayFocus = useMemo(() => {
    return courses.find(c => c.status === 'Active') || courses[0];
  }, [courses]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12 pt-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-600 to-accent-600 dark:from-slate-900 dark:to-primary-900 p-12 md:p-16 text-white shadow-2xl shadow-primary-500/20 transition-all duration-500">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="space-y-8 text-center lg:text-left flex-1">
            <div className="space-y-3">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Ready for a <br />
                <span className="text-primary-200">breakthrough?</span>
              </h2>
              <p className="text-primary-100/90 max-w-xl text-lg md:text-2xl font-medium leading-relaxed">
                Track your progress, manage your courses, and master your learning journey all in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5 justify-center lg:justify-start pt-4">
              <button 
                onClick={() => go('workspace')}
                className="px-10 py-4 rounded-2xl bg-white text-primary-600 font-bold hover:bg-primary-50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-500/10 flex items-center gap-2 group"
              >
                <Plus size={24} />
                Create Study Plan
                <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
              <button 
                onClick={() => go('review')}
                className="px-10 py-4 rounded-2xl bg-primary-500/20 backdrop-blur-2xl border border-white/20 text-white font-bold hover:bg-primary-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <TrendingUp size={24} />
                Open Review Hub
              </button>
            </div>
          </div>
          
          <div className="hidden xl:flex items-center gap-12 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-12 border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl font-black mb-2 drop-shadow-lg tabular-nums">{productivityScore}%</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-200/80">Overall Progress</div>
            </div>
            <div className="w-px h-20 bg-white/10"></div>
            <div className="text-center">
              <div className="text-6xl font-black mb-2 drop-shadow-lg tabular-nums">{courses.length}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-200/80">Total Courses</div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[40rem] h-[40rem] bg-white/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10s]"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-accent-400/20 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8s]"></div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => stat.route && go(stat.route)}
            className={`card group hover:-translate-y-1 ${stat.route ? 'cursor-pointer' : ''}`}
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
              <select 
                value={activityTimeframe}
                onChange={(e) => setActivityTimeframe(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-none text-sm font-semibold rounded-lg px-3 py-1.5 focus:ring-2 ring-primary-500/20 dark:text-white cursor-pointer outline-none transition-shadow"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
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
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.bg} ${activity.color}`}>
                      <activity.icon size={18} />
                    </div>
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
                  onClick={() => go('courses')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left group"
                >
                  <Plus size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-primary-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">New Course</p>
                </button>
                <button 
                  onClick={() => go('notes')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-accent-50 dark:hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400 transition-colors text-left group"
                >
                  <FileText size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-accent-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">New Note</p>
                </button>
                <button 
                  onClick={() => go('reminders')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-left group"
                >
                  <Clock size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-orange-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Timer</p>
                </button>
                <button 
                  onClick={() => go('assignments')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left group"
                >
                  <FileText size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-amber-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Assignments</p>
                </button>
                <button 
                  onClick={() => go('analytics')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left group"
                >
                  <TrendingUp size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-teal-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Analytics</p>
                </button>
                <button 
                  onClick={() => go('goals')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left group"
                >
                  <Target size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Goals</p>
                </button>
                <button
                  onClick={() => go('planner')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left group"
                >
                  <Calendar size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Planner</p>
                </button>
                <button
                  onClick={() => go('review')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left group"
                >
                  <AlertCircle size={18} className="mb-2 text-slate-400 dark:text-slate-500 group-hover:text-rose-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Review Hub</p>
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
                onClick={() => go('videos')}
                className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 transition-colors font-bold text-sm"
              >
                Start Session
              </button>
            </div>
          </div>

          {activeTasks.length > 0 && (
            <div className="card border-none bg-gradient-to-br from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-accent-700 dark:text-accent-400">
                <Target size={20} />
                Resume Work
              </h3>
              <div className="space-y-3">
                {activeTasks.slice(0, 2).map(task => (
                  <div key={task.id} className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800 backdrop-blur-sm group hover:border-accent-300 dark:hover:border-accent-700 transition-colors cursor-pointer shadow-sm" onClick={() => go('tasks')}>
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{task.title}</p>
                    <div className="flex justify-between items-end mt-2">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        Last: {task.lastPosition || 'Not started'}
                      </p>
                      <span className="text-[10px] font-black text-accent-600 dark:text-accent-400">{task.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => go('tasks')} className="w-full mt-4 py-2 text-xs font-bold text-accent-600 dark:text-accent-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                View all tasks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
