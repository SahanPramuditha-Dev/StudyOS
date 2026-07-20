import React from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Heart } from 'lucide-react';
import { useOrion, ORION_LEVELS } from '../../context/OrionContext';

const OrionStats = ({ isVisible }) => {
  const { orionData, currentLevel, nextLevel, xpProgress } = useOrion();

  const friendship = orionData.friendship || 0;
  const xp = orionData.xp || 0;

  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute bottom-full mb-2 right-0 w-[210px] pointer-events-auto"
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/60 p-3.5 space-y-3">

        {/* Level badge */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0"
            style={{ background: `linear-gradient(135deg, ${currentLevel.color}22, ${currentLevel.color}44)`, border: `1.5px solid ${currentLevel.color}60` }}
          >
            <Star size={16} style={{ color: currentLevel.color }} className="fill-current" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Level {currentLevel.level}</p>
            <p className="text-xs font-black text-slate-800 dark:text-white leading-tight truncate">{currentLevel.title}</p>
          </div>
        </div>

        {/* XP Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <Zap size={10} className="fill-amber-400 text-amber-400" />
              <span>{xp.toLocaleString()} XP</span>
            </div>
            {nextLevel && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                → Lv.{nextLevel.level}
              </span>
            )}
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel?.color || currentLevel.color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className="text-right text-[9px] text-slate-400 mt-0.5">{xpProgress}%</p>
        </div>

        {/* Friendship */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <Heart size={10} className="fill-rose-400 text-rose-400" />
              <span>Friendship</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{friendship}/100</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${friendship}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>

        {/* Next level info */}
        {nextLevel && (
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
              {nextLevel.xpRequired - xp} XP to unlock{' '}
              <span className="font-bold" style={{ color: nextLevel.color }}>{nextLevel.title}</span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OrionStats;
