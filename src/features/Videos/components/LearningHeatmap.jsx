import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const getLocalDateStr = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const LearningHeatmap = ({ videos = [], activeLiveLog = null }) => {
  const data = useMemo(() => {
    // Generate last 30 days in local timezone
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d,
        dateStr: getLocalDateStr(d),
        totalWatchTime: 0,
      });
    }

    // Aggregate watch time
    videos.forEach(v => {
      if (Array.isArray(v.playbackLogs) && v.playbackLogs.length > 0) {
        v.playbackLogs.forEach(log => {
          if (!log.startTime || !log.duration) return;
          const logDate = getLocalDateStr(log.startTime);
          const day = days.find(d => d.dateStr === logDate);
          if (day) {
            day.totalWatchTime += Number(log.duration) || 0;
          }
        });
      } else if (v.totalWatchTime > 0 && v.lastWatched) {
        // Fallback for legacy video watch time without detailed logs
        const logDate = getLocalDateStr(v.lastWatched);
        const day = days.find(d => d.dateStr === logDate);
        if (day) {
          day.totalWatchTime += Number(v.totalWatchTime) || 0;
        }
      }
    });

    // Include real-time active live watch session log
    if (activeLiveLog && activeLiveLog.startTime && activeLiveLog.duration > 0) {
      const logDate = getLocalDateStr(activeLiveLog.startTime);
      const day = days.find(d => d.dateStr === logDate);
      if (day) {
        day.totalWatchTime += Number(activeLiveLog.duration) || 0;
      }
    }

    // Calculate max for scaling
    const max = Math.max(...days.map(d => d.totalWatchTime), 1);
    
    return { days, max };
  }, [videos, activeLiveLog]);

  const getColor = (watchTime, max) => {
    if (watchTime === 0) return 'bg-slate-100 dark:bg-slate-800';
    const ratio = watchTime / max;
    if (ratio < 0.25) return 'bg-primary-200 dark:bg-primary-900/40 text-primary-900 dark:text-primary-100';
    if (ratio < 0.5) return 'bg-primary-400 dark:bg-primary-700/60 text-white';
    if (ratio < 0.75) return 'bg-primary-500 dark:bg-primary-500 text-white';
    return 'bg-primary-600 dark:bg-primary-400 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]';
  };

  const formatMin = (secs) => {
    if (!secs || secs <= 0) return '0m';
    if (secs < 60) return '<1m';
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      const remMins = mins % 60;
      return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
    }
    return `${mins}m`;
  };

  const totalTime = useMemo(() => data.days.reduce((a, b) => a + b.totalWatchTime, 0), [data]);

  return (
    <div className="mb-8 p-6 lg:p-8 rounded-[2rem] bg-slate-900 border border-white/5 shadow-2xl flex flex-col xl:flex-row items-center gap-8 xl:gap-12 relative">
      {/* Subtle Background Glow Container (holds overflow-hidden for glow only, allowing tooltips to overflow parent) */}
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header & Stats */}
      <div className="flex-shrink-0 w-full xl:w-64 text-center xl:text-left z-10">
        <h3 className="text-xl font-black text-white tracking-tight mb-2">Activity Overview</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Watch time over 30 days</p>
        
        <div className="mt-6 flex xl:flex-col items-center xl:items-start gap-4 justify-center xl:justify-start">
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 min-w-[140px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">30-Day Total</p>
            <p className="text-2xl font-black text-primary-400">
              {formatMin(totalTime)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Responsive Bar Chart */}
      <div className="flex-1 w-full h-36 flex items-end gap-1 sm:gap-1.5 z-10 pt-10">
        {data.days.map((day, i) => {
          // Height percentage (minimum 8% for visibility)
          const heightPct = day.totalWatchTime === 0 ? 8 : Math.max(8, (day.totalWatchTime / data.max) * 100);
          
          return (
            <div key={day.dateStr} className="group relative flex flex-col items-center justify-end h-full flex-1 min-w-0">
              <motion.div 
                initial={{ height: '0%', opacity: 0 }}
                animate={{ height: `${heightPct}%`, opacity: 1 }}
                transition={{ delay: i * 0.015, type: 'spring', stiffness: 200, damping: 20 }}
                className={`w-full rounded-md ${getColor(day.totalWatchTime, data.max)} transition-all duration-300 group-hover:brightness-125`}
              />
              
              {/* Premium Tooltip */}
              <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 whitespace-nowrap bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl shadow-2xl border border-white/10 flex flex-col items-center gap-1 left-1/2 -translate-x-1/2">
                <span className="text-slate-400 text-[9px]">{day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-primary-400 font-extrabold">{formatMin(day.totalWatchTime)} watched</span>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-white/10 rotate-45 -mt-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningHeatmap;
