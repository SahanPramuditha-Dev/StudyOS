import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useOrion } from '../../context/OrionContext';

const OrionSpeechBubble = () => {
  const { speechMessage, showSpeech, dismissSpeech, isChatOpen } = useOrion();
  const timerRef = useRef(null);

  // Auto-dismiss guard on hover
  const handleMouseEnter = () => clearTimeout(timerRef.current);

  if (isChatOpen) return null;

  return (
    <AnimatePresence>
      {showSpeech && speechMessage && (
        <motion.div
          key="speech"
          className="absolute bottom-full mb-3 right-0 z-20 max-w-[240px] min-w-[180px]"
          initial={{ opacity: 0, scale: 0.8, y: 10, originX: 1, originY: 1 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          onMouseEnter={handleMouseEnter}
        >
          {/* Bubble */}
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl rounded-br-sm shadow-xl border border-slate-200/80 dark:border-slate-700/80 p-3.5 pr-8">
            {/* Sparkle icon */}
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                <Sparkles size={13} className="text-amber-400" />
              </span>
              <p className="text-[12.5px] font-medium leading-snug text-slate-700 dark:text-slate-200">
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
              <div className="w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-slate-200/80 dark:border-slate-700/80 rotate-45 origin-top-left ml-1 shadow-sm" />
            </div>
          </div>

          {/* Quick-action pill */}
          <motion.div
            className="mt-2 flex justify-end"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
