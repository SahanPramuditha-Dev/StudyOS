import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const LearningHeatmap = ({ videos = [], activeLiveLog = null }) => {
  const data = useMemo(() => {
    // Generate last 30 days
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        totalWatchTime: 0,
      });
    }

    // Aggregate watch time
    videos.forEach(v => {
      if (v.playbackLogs) {
        v.playbackLogs.forEach(log => {
          if (!log.startTime || !log.duration) return;
          const logDate = new Date(log.startTime).toISOString().split('T')[0];
          const day = days.find(d => d.dateStr === logDate);
          if (day) {
            day.totalWatchTime += log.duration;
          }
        });
      }
    });

    // Include real-time active live watch session log
    if (activeLiveLog && activeLiveLog.startTime && activeLiveLog.duration > 0) {
      const logDate = new Date(activeLiveLog.startTime).toISOString().split('T')[0];
      const day = days.find(d => d.dateStr === logDate);
      if (day) {
        day.totalWatchTime += activeLiveLog.duration;
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
    const mins = Math.round(secs / 60);
    return `${mins}m`;
  };

  const totalTime = useMemo(() => data.days.reduce((a, b) => a + b.totalWatchTime, 0), [data]);

  return (
    <div className="mb-8 p-6 lg:p-8 rounded-[2rem] bg-slate-900 border border-white/5 shadow-2xl flex flex-col xl:flex-row items-center gap-8 xl:gap-12 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />

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
      <div className="flex-1 w-full h-32 flex items-end gap-1 sm:gap-1.5 z-10">
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
              <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl shadow-2xl border border-white/10 flex flex-col items-center gap-1">
                <span className="text-slate-400 text-[9px]">{day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-primary-400">{formatMin(day.totalWatchTime)} watched</span>
                {/* Tooltip arrow */}
                <div className="absolute top-full w-2 h-2 bg-slate-800 border-r border-b border-white/10 rotate-45 -mt-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningHeatmap;
