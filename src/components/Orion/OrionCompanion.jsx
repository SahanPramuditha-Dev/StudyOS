import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { EyeOff, GripVertical, Settings2, BarChart2, Shirt, Coffee, Cookie, Volume2, VolumeX } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { useOrion, ORION_EMOTIONS, ORION_ACCESSORIES } from '../../context/OrionContext';
import { orionSounds, setOrionMuted } from '../../utils/orionSounds';

// Configure PDF.js worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
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

const OrionWardrobe = ({ isOpen, onClose }) => {
  const { orionData, currentLevel, toggleAccessory } = useOrion();
  const currentLvl = currentLevel.level;
  const currentFriendship = orionData.friendship || 0;
  const equippedAccessories = orionData.accessories || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm pointer-events-auto">
      <motion.div
        className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl space-y-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>🧙</span> Orion's Wardrobe
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Unlock & equip accessories for your companion</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-xs hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl transition"
          >
            Close
          </button>
        </div>

        <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
          {ORION_ACCESSORIES.map(acc => {
            const isEquipped = equippedAccessories.includes(acc.id);
            const isUnlocked = (!acc.levelRequired || currentLvl >= acc.levelRequired) &&
                               (!acc.friendshipRequired || currentFriendship >= acc.friendshipRequired);
            
            let unlockReason = '';
            if (!isUnlocked) {
              if (acc.levelRequired) unlockReason = `Unlocks at Level ${acc.levelRequired}`;
              if (acc.friendshipRequired) unlockReason = `Requires Friendship ${acc.friendshipRequired}`;
            }

            return (
              <div 
                key={acc.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isUnlocked 
                    ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60' 
                    : 'bg-slate-100/30 dark:bg-slate-900/10 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-10 h-10 rounded-xl bg-white dark:bg-slate-850 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
                    {acc.icon}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-snug">{acc.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{acc.type} accessory</p>
                  </div>
                </div>

                <div>
                  {isUnlocked ? (
                    <button
                      onClick={() => toggleAccessory(acc.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition ${
                        isEquipped 
                          ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm' 
                          : 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                      }`}
                    >
                      {isEquipped ? 'Unequip' : 'Equip'}
                    </button>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/5 px-2.5 py-1.5 rounded-xl">
                      🔒 {unlockReason}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Companion Component ─────────────────────────────────────────────────

const OrionCompanion = () => {
  const {
    orionData, setOrionData, emotion, setEmotion,
    isOpen, setIsOpen, isChatOpen, setIsChatOpen,
    animationTrigger, isThinking, xpGainDisplay,
    levelUpData, speak, showSpeech, setIsThinking,
    isSpeakingTTS, voiceEnabled, addXP,
    xpMultiplier, boosterTimeLeft, feedSnack, toggleMute,
  } = useOrion();

  const [showStats, setShowStats] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPetting, setIsPetting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lastSnackTime, setLastSnackTime] = useState(0);
  const [flyingSnack, setFlyingSnack] = useState(null);
  const [walkX, setWalkX] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [walkDirection, setWalkDirection] = useState(0);
  const walkRef = useRef(0);
  const dragRef = useRef(null);
  const longPressTimer = useRef(null);
  const location = useLocation();

  const isCleaning = emotion === ORION_EMOTIONS.IDLE_CLEANING;

  const containerAnimate = isCleaning
    ? {
        x: [0, -90, -90, -90, -90, 0],
        y: [0, 0, -60, 40, -10, 0],
        scale: 1,
        opacity: 1
      }
    : {
        x: walkX,
        y: isWalking ? [0, -8, 0, -8, 0, -8, 0] : 0,
        rotate: isWalking ? [0, -4, 4, -4, 4, -4, 0] : 0,
        scale: 1,
        opacity: 1
      };

  const containerTransition = isCleaning
    ? {
        duration: 4.8,
        times: [0, 0.15, 0.4, 0.65, 0.85, 1],
        ease: "easeInOut"
      }
    : isWalking
    ? {
        x: { duration: 3.0, ease: "easeInOut" },
        y: { duration: 3.0, ease: "linear" },
        rotate: { duration: 3.0, ease: "linear" }
      }
    : { type: 'spring', stiffness: 260, damping: 22 };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Visibility
  const { isVisible = true } = orionData;

  // Softer ambient glow colors based on Orion's current emotion
  let glowOuterStart = 'rgba(251, 191, 36, 0.08)';
  let glowOuterMid   = 'rgba(251, 191, 36, 0.03)';
  let glowInner      = 'rgba(251, 191, 36, 0.06)';

  if (emotion === ORION_EMOTIONS.THINKING || emotion === ORION_EMOTIONS.FOCUSED) {
    glowOuterStart = 'rgba(56, 189, 248, 0.08)';
    glowOuterMid   = 'rgba(56, 189, 248, 0.03)';
    glowInner      = 'rgba(56, 189, 248, 0.05)';
  } else if (emotion === ORION_EMOTIONS.WORRIED) {
    glowOuterStart = 'rgba(251, 113, 133, 0.08)';
    glowOuterMid   = 'rgba(251, 113, 133, 0.03)';
    glowInner      = 'rgba(251, 113, 133, 0.05)';
  } else if (emotion === ORION_EMOTIONS.CELEBRATING || emotion === ORION_EMOTIONS.PROUD) {
    glowOuterStart = 'rgba(253, 224, 71, 0.10)';
    glowOuterMid   = 'rgba(253, 224, 71, 0.03)';
    glowInner      = 'rgba(253, 224, 71, 0.06)';
  }

  // Petting purr sound loop
  useEffect(() => {
    if (!isPetting) return;
    orionSounds.purr();
    const timer = setInterval(() => {
      orionSounds.purr();
    }, 450);
    return () => clearInterval(timer);
  }, [isPetting]);

  // Waddling random walk scheduler for IDLE state
  useEffect(() => {
    if (emotion !== ORION_EMOTIONS.IDLE || isDragging || isPetting) {
      if (walkX !== 0) {
        setWalkX(0);
        setIsWalking(false);
        setWalkDirection(0);
        walkRef.current = 0;
      }
      return;
    }

    const interval = setInterval(() => {
      // 25% chance to take a walk every 12 seconds
      if (Math.random() > 0.75 && !isWalking) {
        const current = walkRef.current;
        // Either walk left (negative offset) or return home (0)
        const target = current === 0 ? -120 - Math.random() * 80 : 0;
        const direction = target < current ? -1 : 1;

        setIsWalking(true);
        setWalkDirection(direction);
        walkRef.current = target;
        setWalkX(target);

        // Waddling walks take about 3 seconds
        setTimeout(() => {
          setIsWalking(false);
          setWalkDirection(0);
        }, 3000);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [emotion, isDragging, isPetting, isWalking, walkX]);

  const toggleChat = useCallback(() => {
    const nextOpen = !isChatOpen;
    setIsChatOpen(nextOpen);
    if (nextOpen) {
      setIsOpen(true);
      setEmotion(ORION_EMOTIONS.HAPPY);
    }
  }, [isChatOpen, setIsChatOpen, setIsOpen, setEmotion]);

  const handleOrionClick = useCallback(() => {
    if (isDragging || isPetting) return;
    toggleChat();
    if (!isChatOpen) {
      // Random single click behavior
      const actions = [ORION_EMOTIONS.WAVING, ORION_EMOTIONS.HAPPY, ORION_EMOTIONS.PROUD];
      setEmotion(actions[Math.floor(Math.random() * actions.length)]);
      setTimeout(() => setEmotion(ORION_EMOTIONS.IDLE), 2000);
    }
  }, [isDragging, isPetting, toggleChat, isChatOpen, setEmotion]);

  const handleDoubleClick = useCallback(() => {
    if (isDragging || isPetting) return;
    setEmotion(ORION_EMOTIONS.CELEBRATING);
    speak('Wheee! 🦉');
    setTimeout(() => setEmotion(ORION_EMOTIONS.IDLE), 3000);
  }, [isDragging, isPetting, setEmotion, speak]);

  const triggerFlyingSnack = (type, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const container = dragRef.current;
    if (!container) {
      feedSnack(type);
      return;
    }
    const targetRect = container.getBoundingClientRect();
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 3;

    setFlyingSnack({
      type,
      startX,
      startY,
      endX,
      endY
    });

    setTimeout(() => {
      feedSnack(type);
      setFlyingSnack(null);
    }, 650);
  };

  const handleFeedCoffee = (e) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastSnackTime < 15000) {
      speak("Give me a moment to finish chewing! 🦉");
      setShowMenu(false);
      return;
    }
    if (xpMultiplier > 1) {
      speak("I'm already hyperactive from coffee! ☕ Let's utilize the 2x XP boost!");
      setShowMenu(false);
      return;
    }
    setLastSnackTime(now);
    triggerFlyingSnack('coffee', e);
    addXP('FEED_SNACK');
    setShowMenu(false);
  };

  const handleFeedCookie = (e) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastSnackTime < 15000) {
      speak("Give me a moment to finish chewing! 🦉");
      setShowMenu(false);
      return;
    }
    setLastSnackTime(now);
    triggerFlyingSnack('cookie', e);
    addXP('FEED_SNACK');
    setShowMenu(false);
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Only left click
    longPressTimer.current = setTimeout(() => {
      if (!isDragging) {
        setIsPetting(true);
        setEmotion(ORION_EMOTIONS.HAPPY); // Will close eyes and show hearts via particles later
        speak('Purrr... I love being pet! 💖', 3000);
        // Dispatch XP event for friendship secretly
        window.dispatchEvent(new CustomEvent('orion-xp', { detail: { event: 'AI_CONVERSATION' } }));
      }
    }, 600); // 600ms hold = pet
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
    if (isPetting) {
      setTimeout(() => {
        setIsPetting(false);
        setEmotion(ORION_EMOTIONS.IDLE);
      }, 1500);
    }
  };

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

    try {
      let extractedText = '';

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        speak('Reading PDF... 🦉');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        let fullText = '';
        // Extract text from up to first 20 pages to prevent memory issues
        const maxPages = Math.min(pdf.numPages, 20);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\\n';
        }
        extractedText = fullText;

      } else if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
        extractedText = await file.text();
      } else {
        speak('I can only read text documents and PDFs right now! 🦉');
        return;
      }

      // Open chat and trigger analysis
      setIsChatOpen(true);
      setIsOpen(true);
      speak('Ooh, a document! Let me analyze this... 🦉');
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('orion-analyze-document', { 
          detail: { filename: file.name, content: extractedText.slice(0, 15000) }
        }));
      }, 500);

    } catch (err) {
      console.error('Error reading file:', err);
      speak('Oops, I had trouble reading that file. 🦉');
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
            className="print:hidden fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none"
            initial={{ opacity: 0, y: 60, scale: 0.7 }}
            animate={isCleaning ? containerAnimate : { opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.8 }}
            transition={isCleaning ? containerTransition : { type: 'spring', stiffness: 260, damping: 22, delay: 0.5 }}
          >



            {/* Orion character — draggable */}
            <motion.div
              drag
              dragMomentum={true}
              dragElastic={0.2}
              dragTransition={{ bounceStiffness: 250, bounceDamping: 18 }}
              onDragStart={() => {
                clearTimeout(longPressTimer.current);
                setIsDragging(true);
                setEmotion(ORION_EMOTIONS.CONFUSED); // Wide eyes, surprised look while dragged
              }}
              onDragEnd={() => {
                setTimeout(() => setIsDragging(false), 100);
                setEmotion(ORION_EMOTIONS.IDLE);
              }}
              className="pointer-events-auto cursor-pointer relative focus:outline-none"
              whileDrag={{ scale: 1.06 }}
              role="button"
              tabIndex={0}
              aria-label="Orion AI companion — click to chat"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOrionClick(); }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={handleOrionClick}
              onDoubleClick={handleDoubleClick}
              onContextMenu={(e) => { e.preventDefault(); setShowMenu(v => !v); }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
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
                      <BarChart2 size={14} className="text-slate-400" /> View Stats
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowWardrobe(true); setShowMenu(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Shirt size={14} className="text-slate-400" /> Wardrobe
                    </button>
                    <button
                      onClick={handleFeedCoffee}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors w-full text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Coffee size={14} className="text-slate-400" /> Give Coffee
                      </span>
                      {xpMultiplier > 1 && (
                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                          2x ({formatTime(boosterTimeLeft)})
                        </span>
                      )}
                    </button>
                    <button
                      onClick={handleFeedCookie}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors w-full text-left"
                    >
                      <Cookie size={14} className="text-slate-400" /> Give Cookie
                    </button>
                     <button
                      onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors w-full text-left"
                    >
                      {orionData?.isMuted ? (
                        <>
                          <VolumeX size={14} className="text-slate-400" /> Unmute Sounds
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} className="text-slate-400" /> Mute Sounds
                        </>
                      )}
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

              {/* Inner wrapper for hover stats and character */}
              <div
                className="group"
                title="Click to chat with Orion"
                onPointerEnter={() => {
                  if (!isChatOpen) setShowStats(true);
                  setEmotion(prev => prev === ORION_EMOTIONS.SLEEPY ? prev : ORION_EMOTIONS.HAPPY);
                }}
                onPointerLeave={() => setShowStats(false)}
              >
                {/* Stats panel (hover) */}
                <AnimatePresence>
                  {showStats && !isChatOpen && (
                    <OrionStats key="stats" isVisible={showStats} />
                  )}
                </AnimatePresence>

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
                  isPetting={isPetting}
                  isDragging={isDragging}
                  isSpeaking={voiceEnabled ? isSpeakingTTS : showSpeech}
                  contextPath={location.pathname}
                  size={130}
                  accessories={orionData.accessories || []}
                  walkDirection={walkDirection}
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

                {/* Glow aura when speech is showing */}
                {showSpeech && !isChatOpen && (
                  <>
                    {/* Outer soft ambient glow — breathes slowly */}
                    <motion.div
                      className="absolute -inset-3 rounded-full pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at center, ${glowOuterStart} 0%, ${glowOuterMid} 50%, transparent 75%)`,
                        filter: 'blur(6px)',
                      }}
                      animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    {/* Inner warm core glow — pulses slightly faster */}
                    <motion.div
                      className="absolute inset-1 rounded-full pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at center, ${glowInner} 0%, transparent 70%)`,
                        filter: 'blur(4px)',
                      }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </>
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
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                        {emotion === ORION_EMOTIONS.WAVING ? '👋 Waving' :
                         emotion === ORION_EMOTIONS.CELEBRATING ? '🎉 Celebrating' :
                         emotion === ORION_EMOTIONS.THINKING ? '💭 Thinking' :
                         emotion === ORION_EMOTIONS.SLEEPY ? '😴 Sleepy' :
                         emotion === ORION_EMOTIONS.FOCUSED ? '🎯 Focused' :
                         emotion === ORION_EMOTIONS.HAPPY ? '😊 Happy' :
                         emotion === ORION_EMOTIONS.PROUD ? '✨ Proud' :
                         emotion === ORION_EMOTIONS.CONFUSED ? '🌀 Dizzy' :
                         emotion === ORION_EMOTIONS.WORRIED ? '😰 Worried' :
                         emotion === ORION_EMOTIONS.IDLE_STRETCHING ? '🙌 Stretching' :
                         emotion === ORION_EMOTIONS.IDLE_STARGAZING ? '🔭 Stargazing' :
                         emotion === ORION_EMOTIONS.IDLE_READING ? '📖 Reading' :
                         emotion === ORION_EMOTIONS.IDLE_COFFEE ? '☕ Coffee Break' :
                         emotion === ORION_EMOTIONS.IDLE_COOKIE ? '🍪 Eating Cookie' :
                         emotion === ORION_EMOTIONS.IDLE_CLEANING ? '🧹 Cleaning' :
                         emotion === ORION_EMOTIONS.IDLE_LOOKING ? '👀 Looking Around' :
                         emotion === ORION_EMOTIONS.IDLE_MUSIC ? '🎧 Listening' : emotion}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Wardrobe Modal */}
            <AnimatePresence>
              {showWardrobe && (
                <OrionWardrobe isOpen={showWardrobe} onClose={() => setShowWardrobe(false)} />
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return createPortal(
    <>
      {companion}
      {flyingSnack && (
        <motion.div
          key="flying-snack"
          initial={{ x: flyingSnack.startX - 12, y: flyingSnack.startY - 12, scale: 0.8, opacity: 1 }}
          animate={{ 
            x: [flyingSnack.startX - 12, (flyingSnack.startX + flyingSnack.endX) / 2 - 40, flyingSnack.endX - 16],
            y: [flyingSnack.startY - 12, Math.min(flyingSnack.startY, flyingSnack.endY) - 60, flyingSnack.endY - 16],
            scale: [0.8, 1.5, 1],
            opacity: [1, 1, 0]
          }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="fixed z-[10005] text-2xl pointer-events-none select-none drop-shadow-lg"
        >
          {flyingSnack.type === 'coffee' ? '☕' : '🍪'}
        </motion.div>
      )}
    </>,
    document.body
  );
};

export default OrionCompanion;
