import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  RotateCw,
  Sparkles,
  HelpCircle,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Flame,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SM2_GRADES, calculateSM2 } from '../../../utils/sm2';
import toast from 'react-hot-toast';

const StudySession = ({ deck, onComplete, onClose, onUpdateCard }) => {
  const [cards, setCards] = useState(() => {
    const list = deck.cards || [];
    // Prioritize due cards or unreviewed cards
    return [...list].sort((a, b) => {
      const aDue = !a.dueDate || new Date(a.dueDate) <= new Date();
      const bDue = !b.dueDate || new Date(b.dueDate) <= new Date();
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      return 0;
    });
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionResults, setSessionResults] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0
  });
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? Math.round(((currentIndex) / cards.length) * 100) : 0;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback((grade) => {
    if (!currentCard) return;

    // Update with SM-2 logic
    const updatedCard = calculateSM2(currentCard, grade);
    onUpdateCard(deck.id, updatedCard);

    // Track session stats
    setSessionResults((prev) => {
      if (grade === SM2_GRADES.AGAIN) return { ...prev, again: prev.again + 1 };
      if (grade === SM2_GRADES.HARD) return { ...prev, hard: prev.hard + 1 };
      if (grade === SM2_GRADES.GOOD) return { ...prev, good: prev.good + 1 };
      return { ...prev, easy: prev.easy + 1 };
    });

    setIsFlipped(false);
    setShowHint(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  }, [currentCard, currentIndex, cards.length, deck.id, onUpdateCard]);

  // Keyboard controls: Space/Enter = Flip, 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(SM2_GRADES.AGAIN);
        if (e.key === '2') handleRate(SM2_GRADES.HARD);
        if (e.key === '3') handleRate(SM2_GRADES.GOOD);
        if (e.key === '4') handleRate(SM2_GRADES.EASY);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isFinished, handleFlip, handleRate]);

  if (!cards || cards.length === 0) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <div className="max-w-md w-full rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
            <HelpCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Deck is Empty</h2>
          <p className="text-sm text-slate-400">Add cards or generate a deck with AI before beginning a review session.</p>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            Back to Decks
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const totalReviewed = cards.length;
    const successful = sessionResults.good + sessionResults.easy + sessionResults.hard;
    const accuracy = totalReviewed > 0 ? Math.round((successful / totalReviewed) * 100) : 100;

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="max-w-lg w-full rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <Trophy size={40} className="animate-bounce" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-primary-500">Session Complete!</span>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">Outstanding Work</h2>
            <p className="text-sm text-slate-400">You completed reviewing <span className="font-semibold text-slate-700 dark:text-slate-200">{deck.title}</span>.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cards Reviewed</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{totalReviewed}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Retention Score</p>
              <p className="text-2xl font-black text-emerald-500 mt-0.5">{accuracy}%</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium pt-2">
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 font-bold">{sessionResults.again} Again</span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-bold">{sessionResults.hard} Hard</span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 font-bold">{sessionResults.good} Good</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold">{sessionResults.easy} Easy</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFinished(false);
                setSessionResults({ again: 0, hard: 0, good: 0, easy: 0 });
              }}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Review Again
            </button>
            <button
              onClick={onComplete || onClose}
              className="flex-1 py-3.5 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Done
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-slate-950/90 backdrop-blur-md text-white select-none">
      {/* Top Session Bar */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center font-black text-sm">
            {currentIndex + 1}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">{deck.title}</h3>
            <p className="text-xs text-slate-400">Card {currentIndex + 1} of {cards.length}</p>
          </div>
        </div>

        {/* Center Progress Bar */}
        <div className="hidden sm:flex items-center gap-3 w-64">
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs font-bold text-slate-400">{progressPercent}%</span>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          title="Exit Session (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Flashcard Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
        {/* Flashcard with 3D Flip */}
        <div
          onClick={handleFlip}
          className="relative w-full max-w-2xl h-[380px] sm:h-[420px] cursor-pointer perspective-1000 group"
        >
          <motion.div
            className="w-full h-full relative preserve-3d transition-transform duration-500 rounded-[2.5rem]"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
          >
            {/* FRONT SIDE */}
            <div className="absolute inset-0 backface-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-8 sm:p-10 flex flex-col justify-between shadow-2xl group-hover:border-primary-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-primary-400">
                  <Sparkles size={14} />
                  Question / Concept
                </span>
                {currentCard.repetitions > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                    Interval: {currentCard.interval}d
                  </span>
                )}
              </div>

              <div className="my-auto text-center space-y-4 px-2">
                <p className="text-2xl sm:text-3xl font-black text-slate-100 leading-relaxed break-words">
                  {currentCard.front}
                </p>

                {currentCard.hint && showHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs inline-block text-left"
                  >
                    💡 Hint: {currentCard.hint}
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                {currentCard.hint && !showHint ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint(true);
                    }}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                  >
                    <HelpCircle size={14} />
                    Show Hint
                  </button>
                ) : <span />}

                <span className="text-slate-400 flex items-center gap-1.5 group-hover:text-primary-400 transition-colors">
                  <RotateCw size={14} />
                  Click or Space to flip
                </span>
              </div>
            </div>

            {/* BACK SIDE */}
            <div
              className="absolute inset-0 backface-hidden rotate-y-180 rounded-[2.5rem] border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 p-8 sm:p-10 flex flex-col justify-between shadow-2xl"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={14} />
                  Answer & Explanation
                </span>
                <span className="text-slate-500 text-[10px]">Back</span>
              </div>

              <div className="my-auto text-center px-2">
                <p className="text-xl sm:text-2xl font-bold text-slate-100 leading-relaxed break-words whitespace-pre-line">
                  {currentCard.back}
                </p>
              </div>

              <div className="text-center text-xs text-slate-500 font-medium">
                Rate your recall below to schedule the next repetition
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Control Bar */}
        <div className="w-full max-w-2xl mt-8">
          <AnimatePresence mode="wait">
            {!isFlipped ? (
              <motion.button
                key="flip-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleFlip}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-black text-sm tracking-wide shadow-xl shadow-primary-600/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <RotateCw size={18} />
                Reveal Answer (Space)
              </motion.button>
            ) : (
              <motion.div
                key="rating-bar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-4 gap-3"
              >
                <button
                  onClick={() => handleRate(SM2_GRADES.AGAIN)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-black flex flex-col items-center gap-1 transition-all active:scale-95 group"
                >
                  <span className="text-xs uppercase tracking-wider text-rose-400 group-hover:text-rose-200">1 • Again</span>
                  <span className="text-[11px] text-rose-400/80 font-medium">&lt; 1 day</span>
                </button>

                <button
                  onClick={() => handleRate(SM2_GRADES.HARD)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-black flex flex-col items-center gap-1 transition-all active:scale-95 group"
                >
                  <span className="text-xs uppercase tracking-wider text-amber-400 group-hover:text-amber-200">2 • Hard</span>
                  <span className="text-[11px] text-amber-400/80 font-medium">1-2 days</span>
                </button>

                <button
                  onClick={() => handleRate(SM2_GRADES.GOOD)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-black flex flex-col items-center gap-1 transition-all active:scale-95 group"
                >
                  <span className="text-xs uppercase tracking-wider text-blue-400 group-hover:text-blue-200">3 • Good</span>
                  <span className="text-[11px] text-blue-400/80 font-medium">3-6 days</span>
                </button>

                <button
                  onClick={() => handleRate(SM2_GRADES.EASY)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black flex flex-col items-center gap-1 transition-all active:scale-95 group"
                >
                  <span className="text-xs uppercase tracking-wider text-emerald-400 group-hover:text-emerald-200">4 • Easy</span>
                  <span className="text-[11px] text-emerald-400/80 font-medium">7+ days</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default StudySession;
