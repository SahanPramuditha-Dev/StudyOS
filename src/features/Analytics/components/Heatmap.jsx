import React from 'react';
import { Calendar, Flame, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const Heatmap = ({ data, onSelectDay }) => {
  // Beautiful, vibrant intensity styles
  const getIntensityStyle = (value) => {
    if (value === 0) {
      return 'bg-slate-100/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 border-slate-200/40 dark:border-slate-800/40 hover:bg-slate-200/50 dark:hover:bg-slate-800/60';
    }
    if (value < 30) {
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20 shadow-sm shadow-sky-500/5';
    }
    if (value < 60) {
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30 hover:bg-indigo-500/30 shadow-md shadow-indigo-500/5';
    }
    if (value < 120) {
      return 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white border-transparent hover:shadow-lg hover:shadow-indigo-500/20';
    }
    return 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40';
  };

  const legend = [
    { label: '0 min', className: 'bg-slate-200 dark:bg-slate-800/50' },
    { label: '1–29 min', className: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
    { label: '30–59 min', className: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' },
    { label: '60–119 min', className: 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white' },
    { label: '120+ min', className: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' }
  ];

  return (
    <div className="card w-full transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/5 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black flex items-center gap-3 dark:text-white">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border border-emerald-100 dark:border-emerald-900/20">
              <TrendingUp size={20} />
            </div>
            Learning Consistency
          </h3>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mt-2 ml-12">28-Day Activity Heatmap</p>
        </div>
        <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Intensity Map
        </div>
      </div>

      {(() => {
        const groups = [];
        data.forEach((d) => {
          const key = format(new Date(d.date), 'yyyy-MM');
          const label = format(new Date(d.date), 'MMMM');
          const last = groups[groups.length - 1];
          if (!last || last.key !== key) {
            groups.push({ key, label, items: [] });
          }
          groups[groups.length - 1].items.push(d);
        });

        const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {groups.map((g, gi) => {
              const firstDate = g.items[0] ? new Date(g.items[0].date) : null;
              const isoDow = firstDate ? Number(format(firstDate, 'i')) : 1;
              const pad = Math.max(0, isoDow - 1);
              const padded = [...Array(pad).fill(null), ...g.items];

              return (
                <div 
                  key={g.key} 
                  className="p-5 rounded-3xl bg-slate-50/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                      {g.label}
                    </span>
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-3 mb-3">
                    {weekdayLabels.map((w) => (
                      <div key={w} className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">
                        {w}
                      </div>
                    ))}
                  </div>

                  {/* Tile Grid */}
                  <div className="grid grid-cols-7 gap-3 justify-items-center">
                    {padded.map((d, i) => (
                      d ? (
                        <motion.div 
                          key={`${d.date}-${i}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: (gi * 0.05) + (i * 0.005), type: 'spring', stiffness: 300, damping: 20 }}
                          onClick={() => onSelectDay && onSelectDay(d)}
                          className={`w-11 h-11 rounded-xl transition-all duration-300 hover:scale-110 cursor-pointer flex flex-col items-center justify-center border font-bold text-xs relative group/item ${getIntensityStyle(d.value)}`}
                        >
                          <span className="text-[12px] font-black leading-none">{new Date(d.date).getDate()}</span>
                          <span className="text-[6.5px] font-bold opacity-60 uppercase tracking-tighter mt-0.5">{format(new Date(d.date), 'EEE')}</span>
                          
                          {/* Rich Interactive Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl border border-slate-800">
                            <p className="text-primary-400 mb-0.5 uppercase tracking-widest font-black border-b border-white/10 pb-1.5">{format(new Date(d.date), 'MMMM do')}</p>
                            <div className="space-y-1 pt-1.5">
                              <p className="flex justify-between gap-4"><span>Watch Mins:</span> <span className="text-primary-400">{d.breakdown?.watchMins || 0}</span></p>
                              <p className="flex justify-between gap-4"><span>Notes Created:</span> <span className="text-emerald-400">{d.breakdown?.notes || 0}</span></p>
                              <p className="flex justify-between gap-4"><span>Tasks Done:</span> <span className="text-blue-400">{d.breakdown?.tasks || 0}</span></p>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                          </div>
                        </motion.div>
                      ) : (
                        <div key={`pad-${i}`} className="w-11 h-11 rounded-xl bg-transparent" />
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Legend Block */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex-wrap">
          <span>Less</span>
          <div className="flex items-center gap-2">
            {legend.map((l, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center border font-bold ${l.className}`} style={{ fontSize: '8px' }}>
                  {idx > 0 ? '+' : ''}
                </div>
                <span className="text-[9px] normal-case font-bold text-slate-400 dark:text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
          <span>More</span>
        </div>
        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase italic">Measured in daily watch minutes</p>
      </div>
    </div>
  );
};

export default Heatmap;
