import React, { useMemo, useState } from 'react';
import { 
  Calendar,
  ChevronDown,
  TrendingUp,
  Download,
  Sparkles,
  X,
  FileText
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { format, subDays } from 'date-fns';

// Sub-components
import StatsCards from './components/StatsCards';
import { 
  WatchChart, 
  CourseChart, 
  ProjectChart, 
  StreakChart, 
  CohortChart, 
  ConsistencyPanel,
  HourlyDistributionChart,
  SubjectVelocity,
  ProjectBurndownChart,
  AchievementsShowcase,
  ActivityRings,
  CohortLeaderboard,
  SoundscapeCorrelationChart
} from './components/LearningCharts';
import Heatmap from './components/Heatmap';
import AIFeedbackCard from './components/AIFeedbackCard';
import PredictiveAlertBanner from './components/PredictiveAlertBanner';
import ReportExporter from './components/ReportExporter';

const Analytics = () => {
  // 1. Pull data from all modules
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [streakData] = useStorage(STORAGE_KEYS.STREAK, { current: 0, lastUpdate: null });
  const streakCurrent = streakData.current || 0;

  // State Management
  const [selectedRange, setSelectedRange] = useState('7d');
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState(null);
  
  // Modals & Drawers States
  const [isExporterOpen, setIsExporterOpen] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

  // Range options
  const rangeOptions = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    'all': 'All Time'
  };

  // Timezone-immune Date Comparison Helper
  const isSameDaySafe = (d1, d2) => {
    const parseDateParts = (d) => {
      if (!d) return null;
      if (d instanceof Date) {
        return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
      }
      const str = String(d);
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return {
          y: parseInt(match[1], 10),
          m: parseInt(match[2], 10) - 1,
          d: parseInt(match[3], 10)
        };
      }
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return null;
      return { y: parsed.getFullYear(), m: parsed.getMonth(), d: parsed.getDate() };
    };

    const p1 = parseDateParts(d1);
    const p2 = parseDateParts(d2);
    if (!p1 || !p2) return false;
    return p1.y === p2.y && p1.m === p2.m && p1.d === p2.d;
  };

  // 2. Data Aggregation & Logic Engine
  const analytics = useMemo(() => {
    // Determine dynamic length based on selectedRange
    const rangeLength = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : selectedRange === '90d' ? 90 : 120;

    // A. Dynamic Watch Time Aggregation
    const watchChartData = Array.from({ length: rangeLength }, (_, i) => {
      const date = subDays(new Date(), (rangeLength - 1) - i);
      const dayName = format(date, 'EEE');
      const dateStr = format(date, 'yyyy-MM-dd');
      
      let dailyMinutes = 0;
      videos.forEach(v => {
        // If course filter is applied, skip videos that are not related to the filtered course status
        if (selectedCourseFilter) {
          const associatedCourse = courses.find(c => c.id === v.courseId || c.name === v.courseName);
          if (!associatedCourse || associatedCourse.status !== selectedCourseFilter) return;
        }

        const logs = v.playbackLogs || [];
        const logsMinutes = logs.reduce((sum, log) => sum + ((log.duration || 0) / 60), 0);
        const totalMinutes = (v.totalWatchTime || 0) / 60;
        const unloggedMinutes = Math.max(0, totalMinutes - logsMinutes);

        logs.forEach(log => {
          if (log.endTime && isSameDaySafe(log.endTime, date)) {
            dailyMinutes += (log.duration || 0) / 60;
          }
        });

        if (unloggedMinutes > 0 && v.lastWatched && isSameDaySafe(v.lastWatched, date)) {
          dailyMinutes += unloggedMinutes;
        }
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

      const matchedNotes = [];
      const matchedTasks = [];
      const matchedVideos = [];
      
      videos.forEach(v => {
        const logs = v.playbackLogs || [];
        const logsMinutes = logs.reduce((sum, log) => sum + ((log.duration || 0) / 60), 0);
        const totalMinutes = (v.totalWatchTime || 0) / 60;
        const unloggedMinutes = Math.max(0, totalMinutes - logsMinutes);
        let hasActivity = false;

        logs.forEach(log => {
          if (log.endTime && isSameDaySafe(log.endTime, date)) {
            dailyMinutes += (log.duration || 0) / 60;
            hasActivity = true;
          }
        });

        if (unloggedMinutes > 0 && v.lastWatched && isSameDaySafe(v.lastWatched, date)) {
          dailyMinutes += unloggedMinutes;
          hasActivity = true;
        }

        if (hasActivity && !matchedVideos.some(vid => vid.id === v.id)) {
          matchedVideos.push(v);
        }
      });

      notes.forEach(n => {
        if (n.createdAt && isSameDaySafe(n.createdAt, date)) {
          dailyNotes++;
          matchedNotes.push(n);
        }
      });

      projects.forEach(p => {
        Object.values(p.board || {}).flat().forEach(t => {
          if (t.createdAt && isSameDaySafe(t.createdAt, date)) {
            dailyTasks++;
            matchedTasks.push({ ...t, projectName: p.name });
          }
        });
      });

      return { 
        date: dateStr, 
        value: Math.round(dailyMinutes),
        breakdown: {
          watchMins: Math.round(dailyMinutes),
          notes: dailyNotes,
          tasks: dailyTasks,
          notesList: matchedNotes,
          tasksList: matchedTasks,
          videosList: matchedVideos
        }
      };
    });

    // D. Streak Trend (Last 30 days)
    const streakTrend = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      let dailyMinutes = 0;
      videos.forEach(v => {
        const logs = v.playbackLogs || [];
        const logsMinutes = logs.reduce((sum, log) => sum + ((log.duration || 0) / 60), 0);
        const totalMinutes = (v.totalWatchTime || 0) / 60;
        const unloggedMinutes = Math.max(0, totalMinutes - logsMinutes);

        logs.forEach(log => {
          if (log.endTime && isSameDaySafe(log.endTime, date)) {
            dailyMinutes += (log.duration || 0) / 60;
          }
        });

        if (unloggedMinutes > 0 && v.lastWatched && isSameDaySafe(v.lastWatched, date)) {
          dailyMinutes += unloggedMinutes;
        }
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
          const logs = v.playbackLogs || [];
          const logsMinutes = logs.reduce((sum, log) => sum + ((log.duration || 0) / 60), 0);
          const totalMinutes = (v.totalWatchTime || 0) / 60;
          const unloggedMinutes = Math.max(0, totalMinutes - logsMinutes);

          logs.forEach(log => {
            if (log.endTime && isSameDaySafe(log.endTime, date)) isActive = true;
          });

          if (unloggedMinutes > 0 && v.lastWatched && isSameDaySafe(v.lastWatched, date)) {
            isActive = true;
          }
        });
        if (isActive) activeDays++;
      }
      return { week: `Week ${i + 1}`, days: activeDays };
    });

    // F. Hourly distribution (Peak study hours)
    const hourlyMins = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    videos.forEach(v => {
      (v.playbackLogs || []).forEach(log => {
        if (log.endTime) {
          const hour = new Date(log.endTime).getHours();
          if (hour >= 6 && hour < 12) hourlyMins.morning += (log.duration || 0) / 60;
          else if (hour >= 12 && hour < 18) hourlyMins.afternoon += (log.duration || 0) / 60;
          else if (hour >= 18 && hour < 24) hourlyMins.evening += (log.duration || 0) / 60;
          else hourlyMins.night += (log.duration || 0) / 60;
        }
      });
    });
    Object.keys(hourlyMins).forEach(k => hourlyMins[k] = Math.round(hourlyMins[k]));

    // G. Key Performance Indicators (KPIs)
    const totalWatchSeconds = videos.reduce((acc, v) => acc + (v.totalWatchTime || 0), 0);
    const totalWatchTime = Math.round(totalWatchSeconds / 60);
    
    const avgProgress = courses.length > 0 
      ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length) 
      : 0;

    // Productivity Score Engine (Formula-based)
    const rawScore = (totalWatchTime / 10) + (notes.length * 5) + (projects.length * 10) + (streakCurrent * 2);
    const productivityScore = Math.min(100, Math.round(rawScore));

    return {
      watchChartData,
      courseChartData: courseStats,
      projectChartData: projectStats,
      heatmapData: last28Days,
      streakTrend,
      weeklyCohort,
      hourlyMins,
      kpis: {
        totalWatchTime,
        streak: streakCurrent,
        avgProgress,
        activeCourses: courses.filter(c => c.status === 'Active').length,
        productivityScore,
        totalNotes: notes.length,
        completedTasks: projects.filter(p => p.status === 'Completed').length
      }
    };
  }, [courses, videos, notes, projects, streakCurrent, selectedRange, selectedCourseFilter]);

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
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
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Dynamic Range Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsRangeOpen(!isRangeOpen)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
            >
              <Calendar size={18} className="text-primary-500" />
              <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                {rangeOptions[selectedRange]}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {isRangeOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-20 overflow-hidden">
                {Object.entries(rangeOptions).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedRange(key);
                      setIsRangeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors ${selectedRange === key ? 'bg-primary-500 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export PDF Button */}
          <button 
            onClick={() => setIsExporterOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all font-black text-xs uppercase tracking-widest"
          >
            <FileText size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Predictive Alert Banner */}
      <PredictiveAlertBanner stats={analytics.kpis} watchData={analytics.watchChartData} />

      {/* AI Coach Trigger Section */}
      <div className="w-full">
        <AIFeedbackCard 
          stats={{ 
            ...analytics.kpis,
            timeSpent: analytics.kpis.totalWatchTime + ' mins' 
          }} 
        />
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
          <CourseChart 
            data={analytics.courseChartData} 
            onSelectCourse={setSelectedCourseFilter} 
            selectedCourse={selectedCourseFilter}
          />
        </div>
      </div>

      {/* Real Data Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <ActivityRings 
          watchPercent={analytics.kpis.totalWatchTime > 0 ? Math.round((analytics.kpis.totalWatchTime / 60) * 100) : 0} 
          notesPercent={notes.length > 0 ? Math.round((notes.length / 5) * 100) : 0} 
          tasksPercent={analytics.kpis.completedTasks > 0 ? Math.round((analytics.kpis.completedTasks / 3) * 100) : 0} 
        />
        <HourlyDistributionChart data={analytics.hourlyMins} />
        <SubjectVelocity courses={courses} />
        <AchievementsShowcase stats={analytics.kpis} />
      </div>

      {/* Charts Grid Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 h-full">
          <ConsistencyPanel data={analytics.watchChartData} />
        </div>
        <div className="lg:col-span-4 h-full">
          <ProjectChart data={analytics.projectChartData} />
        </div>
      </div>

      {/* Heatmap Layer */}
      <div>
        <Heatmap data={analytics.heatmapData} onSelectDay={setSelectedDayDetails} />
      </div>

      {/* Retention & Trend Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        <StreakChart data={analytics.streakTrend} />
        <CohortChart data={analytics.weeklyCohort} />
      </div>

      {/* Drawers & Modals Overlay */}
      <ReportExporter 
        isOpen={isExporterOpen} 
        onClose={() => setIsExporterOpen(false)} 
        stats={analytics.kpis} 
        watchData={analytics.watchChartData} 
      />

      {/* Heatmap Day Details Modal */}
      {selectedDayDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-white space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setSelectedDayDetails(null)} 
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-xl"
            >
              <X size={18} />
            </button>
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-primary-400">Activity Details</h3>
              <p className="text-xs font-bold text-slate-400">{format(new Date(selectedDayDetails.date), 'PPPP')}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Watch Time</p>
                <p className="text-xl font-black">{selectedDayDetails.breakdown.watchMins} Minutes</p>
              </div>

              {selectedDayDetails.breakdown.notesList.length > 0 && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes Created</p>
                  <ul className="list-disc pl-5 text-sm font-semibold space-y-1 text-slate-200">
                    {selectedDayDetails.breakdown.notesList.map((n, idx) => (
                      <li key={idx}>{n.title || 'Untitled Note'}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedDayDetails.breakdown.tasksList.length > 0 && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Tasks Done</p>
                  <ul className="list-disc pl-5 text-sm font-semibold space-y-1 text-slate-200">
                    {selectedDayDetails.breakdown.tasksList.map((t, idx) => (
                      <li key={idx}>
                        {t.title} <span className="text-[10px] text-slate-400">({t.projectName})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
