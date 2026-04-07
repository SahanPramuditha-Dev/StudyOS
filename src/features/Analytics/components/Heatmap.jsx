import React from 'react';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Heatmap = ({ data }) => {
  return (
    <div className="card w-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">
          <TrendingUp className="text-green-500" size={20} />
          Learning Consistency (Last 28 Days)
        </h3>
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Activity Intensity</span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {data.map((d, i) => (
          <motion.div 
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.01 }}
            className={`w-10 h-10 rounded-xl transition-all hover:scale-110 cursor-pointer flex items-center justify-center border border-transparent hover:border-primary-500/20 shadow-sm ${
              d.value === 0 ? 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700' :
              d.value < 30 ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-300' :
              d.value < 60 ? 'bg-primary-200 dark:bg-primary-700/40 text-primary-500' :
              d.value < 120 ? 'bg-primary-400 dark:bg-primary-500/60 text-white' :
              'bg-primary-600 dark:bg-primary-400 text-white'
            }`}
            title={`${d.date}: ${d.value} minutes`}
          >
            <span className="text-[8px] font-black opacity-40 uppercase">{new Date(d.date).getDate()}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <span>Less</span>
          <div className="flex gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800"></div>
            <div className="w-3.5 h-3.5 rounded bg-primary-50 dark:bg-primary-900/20"></div>
            <div className="w-3.5 h-3.5 rounded bg-primary-200 dark:bg-primary-700/40"></div>
            <div className="w-3.5 h-3.5 rounded bg-primary-400 dark:bg-primary-500/60"></div>
            <div className="w-3.5 h-3.5 rounded bg-primary-600 dark:bg-primary-400"></div>
          </div>
          <span>More</span>
        </div>
        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase italic">Measured in daily watch minutes</p>
      </div>
    </div>
  );
};

export default Heatmap;
