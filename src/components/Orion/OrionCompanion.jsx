import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff, GripVertical, Settings2 } from 'lucide-react';
import { useOrion, ORION_EMOTIONS } from '../../context/OrionContext';
import OrionCharacter from './OrionCharacter';
import OrionSpeechBubble from './OrionSpeechBubble';
import OrionChatPanel from './OrionChatPanel';
import OrionStats from './OrionStats';

// ─── Level-up celebration overlay ────────────────────────────────────────────

const LevelUpOverlay = ({ levelUpData }) => (
  <AnimatePresence>
    {levelUpData && (
      <motion.div
        className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop glow */}
        <motion.div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at center, ${levelUpData.color}18 0%, transparent 70%)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        {/* Card */}
        <motion.div
          className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 px-10 py-8 text-center max-w-xs"
          initial={{ scale: 0.6, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: -20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        >
          <motion.div
            className="text-5xl mb-3"
            animate={{ rotate: [0, -10, 10, -5, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: 2 }}
          >
            🎓
          </motion.div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Level Up!</p>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Level {levelUpData.level}
          </h2>
          <p className="text-sm font-semibold" style={{ color: levelUpData.color }}>
            {levelUpData.title}
          </p>
          <div className="mt-4 flex justify-center gap-1">
            {['⭐','✨','🎉','✨','⭐'].map((s, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.5, delay: i * 0.1, repeat: 3 }}
              >
                {s}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Main Companion Component ─────────────────────────────────────────────────

const OrionCompanion = () => {
  const {
    orionData, setOrionData, emotion, setEmotion,
    isOpen, setIsOpen, isChatOpen, setIsChatOpen,
    animationTrigger, isThinking, xpGainDisplay,
    levelUpData, speak, showSpeech, setIsThinking,
  } = useOrion();

  const [showStats, setShowStats] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dragRef = useRef(null);

  // Visibility
  const { isVisible = true } = orionData;

  const toggleChat = useCallback(() => {
    const nextOpen = !isChatOpen;
    setIsChatOpen(nextOpen);
    if (nextOpen) {
      setIsOpen(true);
      setEmotion(ORION_EMOTIONS.HAPPY);
    }
  }, [isChatOpen, setIsChatOpen, setIsOpen, setEmotion]);

  const handleOrionClick = useCallback(() => {
    if (isDragging) return;
    toggleChat();
    if (!isChatOpen) {
      setEmotion(ORION_EMOTIONS.WAVING);
      setTimeout(() => setEmotion(ORION_EMOTIONS.HAPPY), 1500);
    }
  }, [isDragging, toggleChat, isChatOpen, setEmotion]);

  const handleHide = () => {
    setIsHidden(true);
    setShowMenu(false);
    setIsChatOpen(false);
  };

  const handleShow = () => {
    setIsHidden(false);
    setEmotion(ORION_EMOTIONS.HAPPY);
    speak('I\'m back! Ready to help you study! 🦉');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (emotion !== ORION_EMOTIONS.THINKING) setEmotion(ORION_EMOTIONS.THINKING);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setEmotion(ORION_EMOTIONS.HAPPY);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
      const text = await file.text();
      // Open chat and trigger analysis
      setIsChatOpen(true);
      setIsOpen(true);
      speak('Ooh, a document! Let me read this... 🦉');
      
      // We dispatch a custom event that OrionChatPanel will listen for
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('orion-analyze-document', { 
          detail: { filename: file.name, content: text.slice(0, 15000) } // truncate if huge
        }));
      }, 500);
    } else {
      speak('I can only read text documents right now! 🦉');
    }
  };

  if (!isVisible && !isHidden) return null;

  const companion = (
    <>
      {/* Level up overlay — portal to body */}
      <LevelUpOverlay levelUpData={levelUpData} />

      {/* Chat panel */}
      <OrionChatPanel />

      {/* Hidden Orion — small tab to restore */}
      <AnimatePresence>
        {isHidden && (
          <motion.button
            className="fixed bottom-6 right-6 z-[9999] w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl flex items-center justify-center text-white text-lg"
            onClick={handleShow}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Show Orion"
            aria-label="Show Orion companion"
          >
            🦉
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main companion */}
      <AnimatePresence>
        {!isHidden && (
          <motion.div
            ref={dragRef}
            className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none"
            initial={{ opacity: 0, y: 60, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.5 }}
          >



            {/* Orion character — draggable */}
            <motion.div
              drag
              dragMomentum={false}
              dragElastic={0.1}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
              className="pointer-events-auto cursor-pointer relative"
              whileDrag={{ scale: 1.06 }}
              title="Click to chat with Orion"
              role="button"
              tabIndex={0}
              aria-label="Orion AI companion — click to chat"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOrionClick(); }}
              onClick={handleOrionClick}
              onHoverStart={() => {
                if (!isChatOpen) setShowStats(true);
                setEmotion(prev => prev === ORION_EMOTIONS.SLEEPY ? prev : ORION_EMOTIONS.HAPPY);
              }}
              onHoverEnd={() => setShowStats(false)}
              onContextMenu={(e) => { e.preventDefault(); setShowMenu(v => !v); }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Stats panel (hover) */}
              <AnimatePresence>
                {showStats && !isChatOpen && (
                  <OrionStats key="stats" isVisible={showStats} />
                )}
              </AnimatePresence>

              {/* Context menu */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    className="absolute bottom-full mb-2 right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 pointer-events-auto flex flex-col gap-0.5 min-w-[160px]"
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowStats(v => !v); setShowMenu(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <span className="text-base">📊</span> View Stats
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleHide(); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <EyeOff size={14} className="text-slate-400" /> Hide Orion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Speech bubble */}
              <div className="pointer-events-auto">
                <OrionSpeechBubble />
              </div>
              {/* Chat open indicator ring */}
              {isChatOpen && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.25) 0%, transparent 70%)' }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Orion SVG character */}
              <OrionCharacter
                emotion={emotion}
                animationTrigger={animationTrigger}
                isThinking={isThinking}
                xpGainDisplay={xpGainDisplay}
                size={130}
              />

              {/* Options button (right-click hint) */}
              <motion.button
                className="absolute -top-1 -left-1 w-6 h-6 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                whileHover={{ scale: 1.1 }}
                title="Orion options"
                aria-label="Orion options"
                style={{ opacity: showMenu ? 1 : undefined }}
              >
                <Settings2 size={11} className="text-slate-500" />
              </motion.button>

              {/* Pulse ring when speech is showing */}
              {showSpeech && !isChatOpen && (
                <motion.div
                  className="absolute inset-4 rounded-full border-2 border-amber-400 pointer-events-none"
                  animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              {/* Emotion label badge */}
              <AnimatePresence>
                {emotion !== ORION_EMOTIONS.IDLE && (
                  <motion.div
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 capitalize shadow-sm">
                      {emotion === ORION_EMOTIONS.WAVING ? '👋 Waving' :
                       emotion === ORION_EMOTIONS.CELEBRATING ? '🎉 Celebrating' :
                       emotion === ORION_EMOTIONS.THINKING ? '💭 Thinking' :
                       emotion === ORION_EMOTIONS.SLEEPY ? '😴 Sleepy' :
                       emotion === ORION_EMOTIONS.FOCUSED ? '🎯 Focused' :
                       emotion === ORION_EMOTIONS.HAPPY ? '😊 Happy' : emotion}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>


          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return createPortal(companion, document.body);
};

export default OrionCompanion;
