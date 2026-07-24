import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, Heart, Sparkles } from 'lucide-react';
import { useOrion } from '../../context/OrionContext';

const OrionStats = ({ isVisible }) => {
  const { orionData, currentLevel, nextLevel, xpProgress } = useOrion();
  const [hoveringXP, setHoveringXP] = useState(false);
  const [hoveringFriendship, setHoveringFriendship] = useState(false);

  const friendship = orionData.friendship || 0;
  const xp = orionData.xp || 0;

  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute bottom-full mb-2 right-0 w-[220px] pointer-events-auto"
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 space-y-3.5 relative">
        
        {/* Detail Tooltips - Slide out to the left */}
        <AnimatePresence>
          {hoveringXP && (
            <motion.div
              className="absolute right-full mr-3 top-0 w-[180px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-2 pointer-events-none"
              initial={{ opacity: 0, x: 12, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={10} /> Earn XP Points
              </h4>
              <div className="text-[9px] text-slate-300 space-y-1">
                <div className="flex justify-between"><span>Daily Login</span><span className="font-bold text-amber-400">+10 XP</span></div>
                <div className="flex justify-between"><span>Pomodoro block</span><span className="font-bold text-amber-400">+25 XP</span></div>
                <div className="flex justify-between"><span>Task Completed</span><span className="font-bold text-amber-400">+15 XP</span></div>
                <div className="flex justify-between"><span>Note Created</span><span className="font-bold text-amber-400">+10 XP</span></div>
                <div className="flex justify-between"><span>Flashcard Studied</span><span className="font-bold text-amber-400">+5 XP</span></div>
                <div className="flex justify-between"><span>Feed a Snack</span><span className="font-bold text-amber-400">+5 XP</span></div>
              </div>
            </motion.div>
          )}

          {hoveringFriendship && (
            <motion.div
              className="absolute right-full mr-3 top-0 w-[180px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-2 pointer-events-none"
              initial={{ opacity: 0, x: 12, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
                ❤️ Friendship Rewards
              </h4>
              <div className="text-[9px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${friendship >= 25 ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  <span className={friendship >= 25 ? 'line-through text-slate-500' : ''}>Lv.25: Cyber Visor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${friendship >= 50 ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  <span className={friendship >= 50 ? 'line-through text-slate-500' : ''}>Lv.50: Wizard Hat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${friendship >= 80 ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  <span className={friendship >= 80 ? 'line-through text-slate-500' : ''}>Lv.80: Royal Crown</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level badge */}
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0"
            style={{ 
              background: `linear-gradient(135deg, ${currentLevel.color}20, ${currentLevel.color}40)`, 
              border: `1.5px solid ${currentLevel.color}50` 
            }}
            whileHover={{ rotate: 15, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Star size={18} style={{ color: currentLevel.color }} className="fill-current" />
          </motion.div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Level {currentLevel.level}</p>
            <p className="text-xs font-black text-slate-800 dark:text-white leading-tight truncate">{currentLevel.title}</p>
          </div>
        </div>

        {/* XP Bar */}
        <div 
          onMouseEnter={() => setHoveringXP(true)}
          onMouseLeave={() => setHoveringXP(false)}
          className="group cursor-help"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <motion.div
                animate={hoveringXP ? { scale: [1, 1.25, 1], rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Zap size={11} className="fill-amber-400 text-amber-400" />
              </motion.div>
              <span>{xp.toLocaleString()} XP</span>
            </div>
            {nextLevel && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                → Lv.{nextLevel.level}
              </span>
            )}
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-700/20">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel?.color || currentLevel.color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-right text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">{xpProgress}%</p>
        </div>

        {/* Friendship */}
        <div 
          onMouseEnter={() => setHoveringFriendship(true)}
          onMouseLeave={() => setHoveringFriendship(false)}
          className="group cursor-help"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <motion.div
                animate={hoveringFriendship ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Heart size={11} className="fill-rose-400 text-rose-400" />
              </motion.div>
              <span>Friendship</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{friendship}/100</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-700/20">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${friendship}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
            />
          </div>
        </div>

        {/* Next level info */}
        {nextLevel && (
          <div className="pt-2.5 border-t border-slate-200/30 dark:border-slate-800/50">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-medium leading-relaxed">
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
