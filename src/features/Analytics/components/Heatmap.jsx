import React from 'react';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const Heatmap = ({ data }) => {
  const getIntensityClass = (value) => {
    if (value === 0) return 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-700';
    if (value < 30) return 'bg-primary-50 dark:bg-primary-900/30 text-primary-400';
    if (value < 60) return 'bg-primary-200 dark:bg-primary-700/50 text-primary-600';
    if (value < 120) return 'bg-primary-500 text-white';
    return 'bg-slate-900 text-white shadow-lg shadow-slate-900/20';
  };

  const legend = [
    { label: '0', className: 'bg-slate-200 dark:bg-slate-700' },
    { label: '1–29', className: 'bg-primary-100 dark:bg-primary-900/30' },
    { label: '30–59', className: 'bg-primary-300 dark:bg-primary-700/50' },
    { label: '60–119', className: 'bg-primary-500' },
    { label: '120+', className: 'bg-slate-900' }
  ];

  return (
    <div className="card w-full transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/5">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-black flex items-center gap-3 dark:text-white">
            <div className="p-2 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500">
              <TrendingUp size={20} />
            </div>
            Learning Consistency
          </h3>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5 ml-11">28-Day Activity Heatmap</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Intensity Map</span>
        </div>
      </div>
      {(() => {
        // Group last-28-day items by month for clearer separation
        const groups = [];
        data.forEach((d) => {
          const key = format(new Date(d.date), 'yyyy-MM');
          const label = format(new Date(d.date), 'MMM');
          const last = groups[groups.length - 1];
          if (!last || last.key !== key) {
            groups.push({ key, label, items: [] });
          }
          groups[groups.length - 1].items.push(d);
        });

        const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return (
          <div className="flex flex-col md:flex-row flex-wrap gap-6">
            {groups.map((g, gi) => {
              // Compute padding to align the first day of this group to weekday (Mon-first)
              const firstDate = g.items[0] ? new Date(g.items[0].date) : null;
              const isoDow = firstDate ? Number(format(firstDate, 'i')) : 1; // 1..7 (Mon..Sun)
              const pad = Math.max(0, isoDow - 1); // 0..6
              const padded = [...Array(pad).fill(null), ...g.items];

              return (
                <div 
                  key={g.key} 
                  className="flex-1 min-w-[280px] p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="px-2 py-0.5 rounded-lg bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                      {g.label}
                    </div>
                  </div>
                  <div className="hidden md:grid grid-cols-7 gap-1.5 mb-2">
                    {weekdayLabels.map((w) => (
                      <div key={w} className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">
                        {w}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2.5">
                    {padded.map((d, i) => (
                      d ? (
                        <motion.div 
                          key={`${d.date}-${i}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: (gi * 0.05) + (i * 0.01), type: 'spring', stiffness: 260, damping: 20 }}
                          className={`w-12 h-12 rounded-xl transition-all hover:scale-110 cursor-pointer flex flex-col items-center justify-center border border-transparent hover:border-primary-500/20 shadow-sm group/item ${getIntensityClass(d.value)}`}
                          title={`${format(new Date(d.date), 'yyyy-MM-dd')}: ${d.value} minutes`}
                        >
                          <span className="text-[11px] font-black leading-none mb-0.5">{new Date(d.date).getDate()}</span>
                          <span className="text-[7px] font-bold opacity-60 uppercase tracking-tighter">{format(new Date(d.date), 'EEE')}</span>
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
                        <div key={`pad-${i}`} className="w-12 h-12 rounded-xl bg-transparent" />
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex-wrap">
          <span>Less</span>
          <div className="flex items-center gap-2">
            {legend.map((l, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded ${l.className}`} />
                <span className="text-[9px] normal-case font-bold text-slate-400 dark:text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
          <span>More</span>
        </div>
        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase italic">Measured in daily watch minutes</p>
      </div>
    </div>
  );
};

export default Heatmap;
