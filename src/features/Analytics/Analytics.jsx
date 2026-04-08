import React, { useMemo } from 'react';
import { 
  Calendar,
  ChevronDown,
  TrendingUp
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { format, subDays, isSameDay } from 'date-fns';

// Sub-components
import StatsCards from './components/StatsCards';
import { WatchChart, CourseChart, ProjectChart, StreakChart, CohortChart, ConsistencyPanel } from './components/LearningCharts';
import Heatmap from './components/Heatmap';

const Analytics = () => {
  // 1. Pull data from all modules
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [streakData] = useStorage(STORAGE_KEYS.STREAK, { current: 0, lastUpdate: null });
  const streakCurrent = streakData.current || 0;

  // 2. Data Aggregation & Logic Engine
  const analytics = useMemo(() => {
    // A. Weekly Watch Time Aggregation
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayName = format(date, 'EEE');
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Calculate minutes watched on this day
      // Note: In a real app, we'd use playback logs. Here we aggregate from videos' lastWatched
      let dailyMinutes = 0;
      videos.forEach(v => {
        // Aggregate playback logs for this day
        const logs = v.playbackLogs || [];
        logs.forEach(log => {
          if (log.endTime && isSameDay(new Date(log.endTime), date)) {
            dailyMinutes += (log.duration || 0) / 60;
          }
        });
      });

      return { name: dayName, minutes: Math.round(dailyMinutes), date: dateStr };
    });

    // B. Course & Project Distribution
    const courseStats = [
      { name: 'Active', value: courses.filter(c => c.status === 'Active').length, color: '#0ea5e9' },
      { name: 'Completed', value: courses.filter(c => c.status === 'Completed').length, color: '#22c55e' },
      { name: 'Paused', value: courses.filter(c => c.status === 'Paused').length, color: '#f59e0b' },
    ];

    const projectStats = [
      { name: 'Active', value: projects.filter(p => p.status === 'Active').length, color: '#6366f1' },
      { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: '#10b981' },
      { name: 'Paused', value: projects.filter(p => p.status === 'Paused').length, color: '#f59e0b' },
      { name: 'Archived', value: projects.filter(p => p.status === 'Archived').length, color: '#94a3b8' },
    ];

    // C. 28-Day Heatmap Data
    const last28Days = Array.from({ length: 28 }, (_, i) => {
      const date = subDays(new Date(), 27 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      let dailyMinutes = 0;
      let dailyNotes = 0;
      let dailyTasks = 0;
      
      videos.forEach(v => {
        (v.playbackLogs || []).forEach(log => {
          if (log.endTime && isSameDay(new Date(log.endTime), date)) {
            dailyMinutes += (log.duration || 0) / 60;
          }
        });
      });

      notes.forEach(n => {
        if (n.createdAt && isSameDay(new Date(n.createdAt), date)) {
          dailyNotes++;
        }
      });

      projects.forEach(p => {
        Object.values(p.board || {}).flat().forEach(t => {
          if (t.createdAt && isSameDay(new Date(t.createdAt), date)) {
            dailyTasks++;
          }
        });
      });

      return { 
        date: dateStr, 
        value: Math.round(dailyMinutes),
        breakdown: {
          watchMins: Math.round(dailyMinutes),
          notes: dailyNotes,
          tasks: dailyTasks
        }
      };
    });

    // D. Streak Trend (Last 30 days)
    const streakTrend = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      let dailyMinutes = 0;
      videos.forEach(v => {
        (v.playbackLogs || []).forEach(log => {
          if (log.endTime && isSameDay(new Date(log.endTime), date)) {
            dailyMinutes += (log.duration || 0) / 60;
          }
        });
      });
      return { name: format(date, 'MMM dd'), value: Math.round(dailyMinutes) };
    });

    // E. Weekly Cohort (Last 4 weeks)
    const weeklyCohort = Array.from({ length: 4 }, (_, i) => {
      const weekStart = subDays(new Date(), (3 - i) * 7 + 6);
      let activeDays = 0;
      for (let j = 0; j < 7; j++) {
        const date = subDays(weekStart, -j);
        let isActive = false;
        videos.forEach(v => {
          (v.playbackLogs || []).forEach(log => {
            if (log.endTime && isSameDay(new Date(log.endTime), date)) isActive = true;
          });
        });
        if (isActive) activeDays++;
      }
      return { week: `Week ${i + 1}`, days: activeDays };
    });

    // F. Key Performance Indicators (KPIs)
    const totalWatchSeconds = videos.reduce((acc, v) => acc + (v.totalWatchTime || 0), 0);
    const totalWatchTime = Math.round(totalWatchSeconds / 60);
    
    const avgProgress = courses.length > 0 
      ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length) 
      : 0;

    // Productivity Score Engine (Formula-based)
    // Formula: (WatchTime/10) + (Notes*5) + (Projects*10) + (Streak*2)
    const rawScore = (totalWatchTime / 10) + (notes.length * 5) + (projects.length * 10) + (streakCurrent * 2);
    const productivityScore = Math.min(100, Math.round(rawScore));

    return {
      watchChartData: last7Days,
      courseChartData: courseStats,
      projectChartData: projectStats,
      heatmapData: last28Days,
      streakTrend,
      weeklyCohort,
      kpis: {
        totalWatchTime,
        streak: streakCurrent,
        avgProgress,
        activeCourses: courses.filter(c => c.status === 'Active').length,
        productivityScore
      }
    };
  }, [courses, videos, notes, projects, streakCurrent]);

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
            <div className="p-3 rounded-[1.5rem] bg-primary-500 text-white shadow-xl shadow-primary-500/20">
              <TrendingUp size={32} />
            </div>
            Learning Analytics
          </h1>
          <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs">Behavioral insights & productivity engine</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <Calendar size={18} className="text-primary-500" />
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Historical View</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* KPI Layer */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
        <StatsCards stats={analytics.kpis} />
      </div>

      {/* Charts Grid Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 h-full">
          <WatchChart data={analytics.watchChartData} />
        </div>
        <div className="lg:col-span-4 h-full">
          <CourseChart data={analytics.courseChartData} />
        </div>
      </div>

      {/* Charts Grid Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
        <div className="lg:col-span-8 h-full">
          <ConsistencyPanel data={analytics.watchChartData} />
        </div>
        <div className="lg:col-span-4 h-full">
          <ProjectChart data={analytics.projectChartData} />
        </div>
      </div>

      {/* Heatmap Layer */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        <Heatmap data={analytics.heatmapData} />
      </div>

      {/* Retention & Trend Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 pb-12">
        <StreakChart data={analytics.streakTrend} />
        <CohortChart data={analytics.weeklyCohort} />
      </div>
    </div>
  );
};

export default Analytics;
