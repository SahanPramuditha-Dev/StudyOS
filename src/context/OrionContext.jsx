import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStorage } from '../hooks/useStorage';

// ─── Constants ────────────────────────────────────────────────────────────────

export const ORION_EMOTIONS = {
  HAPPY: 'happy',
  THINKING: 'thinking',
  FOCUSED: 'focused',
  CELEBRATING: 'celebrating',
  SLEEPY: 'sleepy',
  WORRIED: 'worried',
  PROUD: 'proud',
  CONFUSED: 'confused',
  IDLE: 'idle',
  WAVING: 'waving',
};

export const ORION_LEVELS = [
  { level: 1,  xpRequired: 0,    title: 'Baby Scholar Owl',        color: '#94a3b8' },
  { level: 2,  xpRequired: 100,  title: 'Curious Learner Owl',     color: '#64748b' },
  { level: 3,  xpRequired: 250,  title: 'Diligent Student Owl',    color: '#0ea5e9' },
  { level: 5,  xpRequired: 500,  title: 'Knowledge Seeker Owl',    color: '#3b82f6' },
  { level: 8,  xpRequired: 900,  title: 'Dedicated Scholar Owl',   color: '#8b5cf6' },
  { level: 10, xpRequired: 1400, title: 'Student Mentor Owl',      color: '#a855f7' },
  { level: 15, xpRequired: 2200, title: 'Academic Guardian Owl',   color: '#f59e0b' },
  { level: 20, xpRequired: 3500, title: 'Wisdom Keeper Owl',       color: '#f97316' },
  { level: 25, xpRequired: 5500, title: 'Professor Owl',           color: '#ef4444' },
  { level: 35, xpRequired: 8500, title: 'Grand Scholar Owl',       color: '#ec4899' },
  { level: 50, xpRequired: 14000, title: 'Legendary Knowledge Guardian', color: '#fbbf24' },
];

export const XP_EVENTS = {
  DAILY_LOGIN: { xp: 10, label: 'Daily Login' },
  TASK_COMPLETE: { xp: 15, label: 'Task Completed' },
  POMODORO_DONE: { xp: 25, label: 'Pomodoro Session' },
  NOTE_CREATED: { xp: 10, label: 'Note Created' },
  ASSIGNMENT_SUBMIT: { xp: 30, label: 'Assignment Submitted' },
  FLASHCARD_STUDIED: { xp: 5,  label: 'Flashcard Studied' },
  AI_CONVERSATION: { xp: 5,  label: 'AI Conversation' },
  STREAK_BONUS: { xp: 50, label: 'Streak Bonus' },
  GOAL_COMPLETE: { xp: 40, label: 'Goal Completed' },
};

const PAGE_CONTEXTS = {
  '/dashboard':   { role: 'motivation coach',  greeting: 'Ready to make today count? Let\'s review your goals!' },
  '/notes':       { role: 'learning assistant', greeting: 'I can help summarize, explain, or quiz you on your notes.' },
  '/planner':     { role: 'scheduling mentor',  greeting: 'Let\'s organize your week for maximum productivity.' },
  '/assignments': { role: 'deadline guardian',  greeting: 'I\'m keeping an eye on your deadlines. Stay ahead!' },
  '/timer':       { role: 'focus partner',      greeting: 'Ready to focus? I\'ll study alongside you.' },
  '/analytics':   { role: 'learning analyst',   greeting: 'Let\'s analyze your study patterns together.' },
  '/courses':     { role: 'learning guide',     greeting: 'Which course can I help you navigate today?' },
  '/goals':       { role: 'achievement coach',  greeting: 'Your goals define your future. Let\'s track progress!' },
  '/chat':        { role: 'AI tutor',           greeting: 'Ask me anything — I\'m your personal study tutor.' },
  '/settings':    { role: 'helpful assistant',  greeting: 'Need help configuring your StudyOS experience?' },
};

const DEFAULT_ORION_STATE = {
  xp: 0,
  level: 1,
  friendship: 0,
  accessories: [],
  position: { x: 0, y: 0 },
  isVisible: true,
  lastLoginDate: null,
  totalSessions: 0,
  totalMessages: 0,
};

// ─── Context ───────────────────────────────────────────────────────────────────

const OrionContext = createContext(null);

export const useOrion = () => {
  const ctx = useContext(OrionContext);
  if (!ctx) throw new Error('useOrion must be used within OrionProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const OrionProvider = ({ children }) => {
  const location = useLocation();
  const [orionData, setOrionData] = useStorage('studyos_orion', DEFAULT_ORION_STATE);

  const [emotion, setEmotion] = useState(ORION_EMOTIONS.IDLE);
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');
  const [showSpeech, setShowSpeech] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [xpGainDisplay, setXpGainDisplay] = useState(null);

  const inactivityTimer = useRef(null);
  const speechTimer = useRef(null);
  const hasGreetedPage = useRef({});

  // ─── Level Calculation ───────────────────────────────────────────────────────

  const getCurrentLevel = useCallback((xp) => {
    let currentLevel = ORION_LEVELS[0];
    for (const lvl of ORION_LEVELS) {
      if (xp >= lvl.xpRequired) currentLevel = lvl;
      else break;
    }
    return currentLevel;
  }, []);

  const getNextLevel = useCallback((xp) => {
    for (let i = 0; i < ORION_LEVELS.length; i++) {
      if (xp < ORION_LEVELS[i].xpRequired) return ORION_LEVELS[i];
    }
    return null; // max level
  }, []);

  const getXpProgress = useCallback((xp) => {
    const current = getCurrentLevel(xp);
    const next = getNextLevel(xp);
    if (!next) return 100;
    const xpIntoLevel = xp - current.xpRequired;
    const xpForLevel = next.xpRequired - current.xpRequired;
    return Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100));
  }, [getCurrentLevel, getNextLevel]);

  // ─── XP System ──────────────────────────────────────────────────────────────

  const addXP = useCallback((eventKey) => {
    const event = XP_EVENTS[eventKey];
    if (!event) return;
    const amount = event.xp;

    setOrionData(prev => {
      const newXP = (prev.xp || 0) + amount;
      const oldLevel = getCurrentLevel(prev.xp || 0);
      const newLevel = getCurrentLevel(newXP);

      if (newLevel.level > oldLevel.level) {
        setLevelUpData({ level: newLevel.level, title: newLevel.title, color: newLevel.color });
        setEmotion(ORION_EMOTIONS.CELEBRATING);
        triggerAnimation('levelUp');
        setTimeout(() => setLevelUpData(null), 5000);
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel.level,
        friendship: Math.min(100, (prev.friendship || 0) + Math.floor(amount / 10)),
      };
    });

    // Show XP gain popup
    setXpGainDisplay({ amount, label: event.label });
    setTimeout(() => setXpGainDisplay(null), 2000);
  }, [getCurrentLevel, setOrionData]);

  // ─── Animation System ────────────────────────────────────────────────────────

  const triggerAnimation = useCallback((animName) => {
    setAnimationTrigger(animName);
    setTimeout(() => setAnimationTrigger(null), 3000);
  }, []);

  // ─── Speech Bubble ───────────────────────────────────────────────────────────

  const speak = useCallback((message, duration = 6000) => {
    setSpeechMessage(message);
    setShowSpeech(true);
    clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setShowSpeech(false), duration);
  }, []);

  const dismissSpeech = useCallback(() => {
    setShowSpeech(false);
    clearTimeout(speechTimer.current);
  }, []);

  // ─── Inactivity Detection ─────────────────────────────────────────────────

  const resetInactivityTimer = useCallback(() => {
    if (emotion === ORION_EMOTIONS.SLEEPY) {
      setEmotion(ORION_EMOTIONS.HAPPY);
      speak('Oh! Welcome back! I was just resting my wings... 🦉');
    }
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setEmotion(ORION_EMOTIONS.SLEEPY);
    }, 3 * 60 * 1000); // 3 minutes
  }, [emotion, speak]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivityTimer]);

  // ─── Daily Login Bonus ───────────────────────────────────────────────────────

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (orionData.lastLoginDate !== today) {
      setOrionData(prev => ({ ...prev, lastLoginDate: today }));
      addXP('DAILY_LOGIN');
      setTimeout(() => {
        setEmotion(ORION_EMOTIONS.HAPPY);
        speak('Good to see you! Here\'s your daily XP bonus! ⭐');
      }, 2000);
    }
  }, []); // eslint-disable-line

  // ─── Page Context Messages ───────────────────────────────────────────────────

  useEffect(() => {
    const path = location.pathname;
    if (hasGreetedPage.current[path]) return;
    hasGreetedPage.current[path] = true;

    const ctx = PAGE_CONTEXTS[path] || PAGE_CONTEXTS['/dashboard'];
    setTimeout(() => {
      if (emotion !== ORION_EMOTIONS.SLEEPY) {
        setEmotion(ORION_EMOTIONS.HAPPY);
        speak(ctx.greeting, 7000);
      }
    }, 1500);
  }, [location.pathname]); // eslint-disable-line

  // ─── Public listen for XP events from other parts of the app ─────────────

  useEffect(() => {
    const handleXPEvent = (e) => {
      if (e.detail?.event) addXP(e.detail.event);
    };
    window.addEventListener('orion-xp', handleXPEvent);
    return () => window.removeEventListener('orion-xp', handleXPEvent);
  }, [addXP]);

  // ─── Computed Values ─────────────────────────────────────────────────────────

  const currentLevel = getCurrentLevel(orionData.xp || 0);
  const nextLevel = getNextLevel(orionData.xp || 0);
  const xpProgress = getXpProgress(orionData.xp || 0);
  const pageContext = PAGE_CONTEXTS[location.pathname] || PAGE_CONTEXTS['/dashboard'];

  // ─── Context Value ───────────────────────────────────────────────────────────

  const value = {
    // State
    orionData,
    emotion,
    isOpen,
    isChatOpen,
    speechMessage,
    showSpeech,
    animationTrigger,
    isThinking,
    levelUpData,
    xpGainDisplay,
    currentLevel,
    nextLevel,
    xpProgress,
    pageContext,

    // Actions
    setEmotion,
    setIsOpen,
    setIsChatOpen,
    setIsThinking,
    addXP,
    speak,
    dismissSpeech,
    triggerAnimation,
    setOrionData,
  };

  return <OrionContext.Provider value={value}>{children}</OrionContext.Provider>;
};

export default OrionContext;
