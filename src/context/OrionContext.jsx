import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStorage } from '../hooks/useStorage';
import { orionSounds } from '../utils/orionSounds';
import { getOrionContextMessage } from '../services/orionBrain';

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
  IDLE_READING: 'idle_reading',
  IDLE_CLEANING: 'idle_cleaning',
  IDLE_COFFEE: 'idle_coffee',
  IDLE_LOOKING: 'idle_looking',
  IDLE_MUSIC: 'idle_music',
  IDLE_STARGAZING: 'idle_stargazing',
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
  const [assignments] = useStorage('studyos_assignments', []);

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
        orionSounds.levelUp();
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
    orionSounds.pop();
    clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setShowSpeech(false), duration);
  }, []);

  const dismissSpeech = useCallback(() => {
    setShowSpeech(false);
    clearTimeout(speechTimer.current);
  }, []);

  // ─── Inactivity & Idle Behavior Engine ────────────────────────────────────

  const idleBehaviorTimer = useRef(null);

  const triggerRandomIdleBehavior = useCallback(() => {
    // Only trigger idle if we are currently happy, idle, or looking around
    setEmotion(prev => {
      if (prev === ORION_EMOTIONS.THINKING || prev === ORION_EMOTIONS.SLEEPY || prev === ORION_EMOTIONS.WORRIED || prev === ORION_EMOTIONS.FOCUSED) {
        return prev;
      }
      
      const hour = new Date().getHours();
      let behaviors = [ORION_EMOTIONS.IDLE];

      if (hour >= 5 && hour < 12) {
        // Morning: Coffee, Reading, Looking, Music
        behaviors = [
          ORION_EMOTIONS.IDLE_COFFEE, ORION_EMOTIONS.IDLE_COFFEE,
          ORION_EMOTIONS.IDLE_READING, ORION_EMOTIONS.IDLE_LOOKING,
          ORION_EMOTIONS.IDLE_MUSIC, ORION_EMOTIONS.IDLE
        ];
      } else if (hour >= 12 && hour < 18) {
        // Afternoon: Focused, Music, Reading, Cleaning
        behaviors = [
          ORION_EMOTIONS.IDLE_READING, ORION_EMOTIONS.IDLE_MUSIC,
          ORION_EMOTIONS.IDLE_CLEANING, ORION_EMOTIONS.IDLE, ORION_EMOTIONS.IDLE_LOOKING
        ];
      } else if (hour >= 18 && hour < 22) {
        // Evening: Stargazing, Reading, Music
        behaviors = [
          ORION_EMOTIONS.IDLE_STARGAZING, ORION_EMOTIONS.IDLE_STARGAZING,
          ORION_EMOTIONS.IDLE_MUSIC, ORION_EMOTIONS.IDLE_READING, ORION_EMOTIONS.IDLE
        ];
      } else {
        // Night: Sleepy, Stargazing, Idle
        behaviors = [
          ORION_EMOTIONS.SLEEPY, ORION_EMOTIONS.IDLE_STARGAZING,
          ORION_EMOTIONS.IDLE, ORION_EMOTIONS.IDLE_READING
        ];
      }

      // 5% chance for a funny 'clumsy' event (briefly surprised/worried)
      if (Math.random() < 0.05) {
        setTimeout(() => setEmotion(ORION_EMOTIONS.IDLE), 2500);
        return ORION_EMOTIONS.CONFUSED;
      }

      return behaviors[Math.floor(Math.random() * behaviors.length)];
    });
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (emotion === ORION_EMOTIONS.SLEEPY || emotion?.startsWith('idle_')) {
      setEmotion(ORION_EMOTIONS.IDLE);
      if (emotion === ORION_EMOTIONS.SLEEPY) {
        speak('Oh! Welcome back! I was just resting my wings... 🦉');
      }
    }
    
    clearTimeout(inactivityTimer.current);
    clearInterval(idleBehaviorTimer.current);

    // After 15 seconds of no mouse movement, start randomly cycling idle states every 12 seconds
    idleBehaviorTimer.current = setTimeout(() => {
      idleBehaviorTimer.current = setInterval(triggerRandomIdleBehavior, 12000);
      triggerRandomIdleBehavior();
    }, 15000);

    inactivityTimer.current = setTimeout(() => {
      clearInterval(idleBehaviorTimer.current);
      setEmotion(ORION_EMOTIONS.SLEEPY);
    }, 3 * 60 * 1000); // 3 minutes idle = sleep
  }, [emotion, speak, triggerRandomIdleBehavior]);

  // Proactive Break Tracker (Active use without a break)
  const activeUseTimer = useRef(null);
  
  const resetActiveUseTimer = useCallback(() => {
    clearTimeout(activeUseTimer.current);
    // 60 minutes of active use triggers a break reminder
    activeUseTimer.current = setTimeout(() => {
      setEmotion(ORION_EMOTIONS.WORRIED);
      orionSounds.alert();
      speak("You've been studying hard for an hour! How about a quick 5-minute break? 🦉", 10000);
    }, 60 * 60 * 1000);
  }, [speak]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    const handleActivity = () => {
      resetInactivityTimer();
    };
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    resetInactivityTimer();
    resetActiveUseTimer(); // Start tracking active use on mount
    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearTimeout(inactivityTimer.current);
      clearInterval(idleBehaviorTimer.current);
      clearTimeout(activeUseTimer.current);
    };
  }, [resetInactivityTimer, resetActiveUseTimer]);

  // ─── Daily Login Bonus ───────────────────────────────────────────────────────

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (orionData.lastLoginDate !== today) {
      setOrionData(prev => ({ ...prev, lastLoginDate: today }));
      addXP('DAILY_LOGIN');
      
      // Daily Briefing
      const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good morning';
        if (hour >= 12 && hour < 17) return 'Good afternoon';
        if (hour >= 17 && hour < 21) return 'Good evening';
        return 'Good night';
      };

      setTimeout(async () => {
        setEmotion(ORION_EMOTIONS.THINKING);
        const greeting = getTimeGreeting();
        try {
          // Pass empty study data for now, would normally pass actual StudyOS goals/assignments
          const response = await getOrionContextMessage({ pathname: 'daily_briefing', studyData: {} });
          setEmotion(response.emotion);
          speak(`${greeting}! ${response.message} Here's your daily XP! ⭐`, 10000);
        } catch {
          setEmotion(ORION_EMOTIONS.HAPPY);
          speak(`${greeting}! Ready to tackle your goals today? Here's your daily XP bonus! ⭐`, 8000);
        }
      }, 2000);
    }
  }, []); // eslint-disable-line

  // ─── Smart Deadline Warning System ──────────────────────────────────────────
  const deadlineCheckRef = useRef(false);

  useEffect(() => {
    if (deadlineCheckRef.current) return;
    if (!assignments || assignments.length === 0) return;
    deadlineCheckRef.current = true;

    const now = new Date();
    const warnings = [];

    assignments.forEach(assignment => {
      if (assignment.status === 'Submitted' || assignment.status === 'completed') return;
      const due = new Date(assignment.deadline);
      if (isNaN(due)) return;
      const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        warnings.push({ title: assignment.title, daysLeft, urgency: 'overdue' });
      } else if (daysLeft === 0) {
        warnings.push({ title: assignment.title, daysLeft, urgency: 'today' });
      } else if (daysLeft <= 2) {
        warnings.push({ title: assignment.title, daysLeft, urgency: 'critical' });
      } else if (daysLeft <= 5) {
        warnings.push({ title: assignment.title, daysLeft, urgency: 'soon' });
      }
    });

    if (warnings.length === 0) return;

    // Sort: overdue first, then by urgency
    warnings.sort((a, b) => a.daysLeft - b.daysLeft);
    const top = warnings[0];

    setTimeout(() => {
      if (top.urgency === 'overdue') {
        setEmotion(ORION_EMOTIONS.WORRIED);
        speak(`⚠️ Heads up! "${top.title}" is overdue! Submit it as soon as possible to avoid penalties. You have ${warnings.length} issue${warnings.length > 1 ? 's' : ''} to address.`, 12000);
      } else if (top.urgency === 'today') {
        setEmotion(ORION_EMOTIONS.WORRIED);
        speak(`🚨 "${top.title}" is due TODAY! Don't forget to submit it before midnight!`, 12000);
      } else if (top.urgency === 'critical') {
        setEmotion(ORION_EMOTIONS.WORRIED);
        speak(`⏰ "${top.title}" is due in ${top.daysLeft} day${top.daysLeft > 1 ? 's' : ''}. Make sure you're on track! ${warnings.length > 1 ? `(+${warnings.length - 1} more)` : ''}`, 10000);
      } else {
        setEmotion(ORION_EMOTIONS.IDLE);
        speak(`📋 Reminder: "${top.title}" is due in ${top.daysLeft} days. Plan accordingly! ${warnings.length > 1 ? `(${warnings.length} deadlines coming up)` : ''}`, 8000);
      }
    }, 5000); // Delay so it doesn't collide with the daily greeting
  }, [assignments]); // eslint-disable-line

  // ─── Page Context Messages ───────────────────────────────────────────────────

  useEffect(() => {
    const path = location.pathname;
    if (hasGreetedPage.current[path]) return;
    hasGreetedPage.current[path] = true;

    const ctx = PAGE_CONTEXTS[path] || PAGE_CONTEXTS['/dashboard'];
    setTimeout(() => {
      if (emotion !== ORION_EMOTIONS.SLEEPY) {
        setEmotion(ORION_EMOTIONS.IDLE);
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
