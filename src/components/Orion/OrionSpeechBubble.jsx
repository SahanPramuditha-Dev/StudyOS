import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Brain, Trophy, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useOrion } from '../../context/OrionContext';

// ─── Emotion theming ──────────────────────────────────────────────────────────

const THEMES = {
  default: {
    accent:    'from-amber-400 to-orange-400',
    icon:      <Sparkles size={13} />,
    iconColor: 'text-amber-400',
    glow:      'rgba(251,191,36,0.18)',
    btn:       'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/25',
  },
  celebrating: {
    accent:    'from-yellow-300 to-amber-500',
    icon:      <Trophy size={13} />,
    iconColor: 'text-yellow-300',
    glow:      'rgba(253,224,71,0.22)',
    btn:       'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border-yellow-400/25',
  },
  proud: {
    accent:    'from-yellow-300 to-amber-500',
    icon:      <Trophy size={13} />,
    iconColor: 'text-yellow-300',
    glow:      'rgba(253,224,71,0.22)',
    btn:       'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border-yellow-400/25',
  },
  focused: {
    accent:    'from-sky-400 to-blue-500',
    icon:      <Brain size={13} />,
    iconColor: 'text-sky-400',
    glow:      'rgba(56,189,248,0.18)',
    btn:       'bg-sky-400/10 hover:bg-sky-400/20 text-sky-300 border-sky-400/25',
  },
  thinking: {
    accent:    'from-sky-400 to-blue-500',
    icon:      <Brain size={13} />,
    iconColor: 'text-sky-400',
    glow:      'rgba(56,189,248,0.18)',
    btn:       'bg-sky-400/10 hover:bg-sky-400/20 text-sky-300 border-sky-400/25',
  },
  worried: {
    accent:    'from-rose-400 to-red-500',
    icon:      <AlertTriangle size={13} />,
    iconColor: 'text-rose-400',
    glow:      'rgba(251,113,133,0.18)',
    btn:       'bg-rose-400/10 hover:bg-rose-400/20 text-rose-300 border-rose-400/25',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const OrionSpeechBubble = () => {
  const { speechMessage, showSpeech, dismissSpeech, isChatOpen, emotion } = useOrion();
  const timerRef = useRef(null);

  const handleMouseEnter = () => clearTimeout(timerRef.current);

  if (isChatOpen) return null;

  const theme = THEMES[emotion] ?? THEMES.default;

  return (
    <AnimatePresence>
      {showSpeech && speechMessage && (
        <motion.div
          key="orion-speech"
          className="absolute bottom-full mb-3 right-0 z-30 w-[230px]"
          initial={{ opacity: 0, y: 14, scale: 0.88, originX: 1, originY: 1 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: 8,  scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          onMouseEnter={handleMouseEnter}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Card ── */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10, 16, 38, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: `0 8px 32px -4px ${theme.glow}, 0 2px 12px rgba(0,0,0,0.4)`,
            }}
          >
            {/* Accent bar */}
            <div className={`h-[3px] w-full bg-gradient-to-r ${theme.accent}`} />

            {/* Body */}
            <div className="px-3.5 pt-3 pb-3">
              {/* Header row */}
              <div className="flex items-start gap-2.5">
                <span className={`mt-[1px] shrink-0 ${theme.iconColor}`}>
                  {theme.icon}
                </span>
                <div className="text-[12.5px] font-medium leading-[1.55] text-slate-100 tracking-[0.01em] flex-1 prose prose-invert prose-p:my-0 prose-strong:text-white max-w-none">
                  <ReactMarkdown>{speechMessage}</ReactMarkdown>
                </div>
                <button
                  onClick={dismissSpeech}
                  className="shrink-0 mt-[1px] text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Footer row */}
              <div className="mt-2.5 flex justify-end">
                <motion.button
                  onClick={dismissSpeech}
                  className={`text-[10.5px] font-semibold px-2.5 py-[3px] rounded-full border transition-all ${theme.btn}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  whileTap={{ scale: 0.94 }}
                >
                  Got it ✓
                </motion.button>
              </div>
            </div>
          </div>

          {/* ── Tail ── */}
          <div
            className="absolute -bottom-[6px] right-6 w-3 h-3"
            aria-hidden="true"
            style={{
              background: 'rgba(10, 16, 38, 0.92)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderTop: 'none',
              borderLeft: 'none',
              transform: 'rotate(45deg)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrionSpeechBubble;
