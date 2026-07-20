import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useOrion } from '../../context/OrionContext';

const OrionSpeechBubble = () => {
  const { speechMessage, showSpeech, dismissSpeech, isChatOpen, emotion } = useOrion();
  const timerRef = useRef(null);

  // Auto-dismiss guard on hover
  const handleMouseEnter = () => clearTimeout(timerRef.current);

  if (isChatOpen) return null;

  // Map emotion to visual style
  let bubbleTheme = 'border-slate-200/80 dark:border-slate-700/80 text-amber-500';
  let glowStyle = 'rgba(0,0,0,0)';
  
  if (emotion === 'celebrating' || emotion === 'proud') {
    bubbleTheme = 'border-amber-400 dark:border-amber-500 text-amber-500';
    glowStyle = 'rgba(251, 191, 36, 0.2)';
  } else if (emotion === 'focused' || emotion === 'thinking') {
    bubbleTheme = 'border-blue-400 dark:border-blue-500 text-blue-500';
    glowStyle = 'rgba(59, 130, 246, 0.2)';
  } else if (emotion === 'worried') {
    bubbleTheme = 'border-red-400 dark:border-red-500 text-red-500';
    glowStyle = 'rgba(239, 68, 68, 0.2)';
  }

  return (
    <AnimatePresence>
      {showSpeech && speechMessage && (
        <motion.div
          key="speech"
          className="absolute bottom-full mb-4 right-2 z-20 max-w-[280px] min-w-[200px]"
          initial={{ opacity: 0, scale: 0.6, y: 30, x: 20, rotate: 10, originX: 1, originY: 1 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20, x: 10, rotate: -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          onMouseEnter={handleMouseEnter}
        >
          {/* Bubble Container */}
          <div 
            className={`relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl rounded-br-sm shadow-2xl border-2 p-4 pr-10 ${bubbleTheme.split(' ')[0]} ${bubbleTheme.split(' ')[1]}`}
            style={{ boxShadow: `0 10px 30px -5px ${glowStyle}, 0 4px 10px -2px rgba(0,0,0,0.1)` }}
          >
            {/* Content */}
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 shrink-0 ${bubbleTheme.split(' ')[2]}`}>
                <Sparkles size={16} />
              </span>
              <p className="text-[14px] font-medium leading-relaxed text-slate-800 dark:text-slate-100 font-sans tracking-wide">
                {speechMessage}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={dismissSpeech}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Dismiss Orion message"
            >
              <X size={13} />
            </button>

            {/* Tail triangle pointing down-right */}
            <div
              className="absolute -bottom-2 right-4 w-4 h-2 overflow-hidden"
              aria-hidden="true"
            >
              <div className={`w-4 h-4 bg-white/95 dark:bg-slate-900/95 border-b-2 border-r-2 ${bubbleTheme.split(' ')[0]} ${bubbleTheme.split(' ')[1]} rotate-45 origin-top-left ml-2 shadow-sm`} />
            </div>
          </div>

          {/* Quick-action pill */}
          <motion.div
            className="mt-3 flex justify-end"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={dismissSpeech}
              className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrionSpeechBubble;
