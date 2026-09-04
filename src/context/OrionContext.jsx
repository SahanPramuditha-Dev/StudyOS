import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStorage } from '../hooks/useStorage';
import { orionSounds, setOrionMuted } from '../utils/orionSounds';
import { getOrionContextMessage } from '../services/orionBrain';
import { OrionTTS, OrionSTT } from '../utils/orionVoice';
import { useAuth } from './AuthContext';


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
  IDLE_STRETCHING: 'idle_stretching',
  DETERMINED: 'determined',
  IDLE_COOKIE: 'idle_cookie',
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

export const ORION_ACCESSORIES = [
  { id: 'bow_tie', name: 'Gentleman Bow Tie', icon: '🎀', type: 'neck', levelRequired: 3 },
  { id: 'cozy_scarf', name: 'Cozy Winter Scarf', icon: '🧣', type: 'neck', levelRequired: 5 },
  { id: 'cyber_glasses', name: 'Cyber Visor', icon: '🕶️', type: 'eyes', friendshipRequired: 25 },
  { id: 'wizard_hat', name: 'Wizard Hat', icon: '🧙', type: 'head', friendshipRequired: 50 },
  { id: 'gold_crown', name: 'Royal Crown', icon: '👑', type: 'head', friendshipRequired: 80 },
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
  FEED_SNACK: { xp: 5, label: 'Snack Fed!' },
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
  isMuted: false,
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
  const emotionRef = useRef(emotion);
  useEffect(() => {
    emotionRef.current = emotion;
  }, [emotion]);

  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');
  const [showSpeech, setShowSpeech] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [xpGainDisplay, setXpGainDisplay] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [xpMultiplier, setXpMultiplier] = useState(1);
  const [boosterTimeLeft, setBoosterTimeLeft] = useState(0);

  useEffect(() => {
    if (boosterTimeLeft <= 0) {
      if (xpMultiplier > 1) {
        setXpMultiplier(1);
        speak("Ah, that coffee was delicious! The focus boost is wearing off, but let's keep working hard! 🦉");
      }
      return;
    }
    const timer = setInterval(() => {
      setBoosterTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [boosterTimeLeft, xpMultiplier]);

  // Sync mute state on change or startup
  useEffect(() => {
    if (orionData && orionData.isMuted !== undefined) {
      setOrionMuted(orionData.isMuted);
    }
  }, [orionData?.isMuted]);

  const toggleMute = useCallback(() => {
    setOrionData(prev => {
      const nextMuted = !prev.isMuted;
      setOrionMuted(nextMuted);
      return { ...prev, isMuted: nextMuted };
    });
  }, [setOrionData]);

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
    const amount = event.xp * xpMultiplier;

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
        friendship: Math.min(100, (prev.friendship || 0) + Math.max(1, Math.floor(amount / 10))),
      };
    });

    // Show XP gain popup
    setXpGainDisplay({ amount, label: xpMultiplier > 1 ? `${event.label} (2x Boost!)` : event.label });
    setTimeout(() => setXpGainDisplay(null), 2000);
  }, [getCurrentLevel, setOrionData, xpMultiplier]);

  const toggleAccessory = useCallback((id) => {
    const item = ORION_ACCESSORIES.find(a => a.id === id);
    if (!item) return;

    setOrionData(prev => {
      const currentAcc = prev.accessories || [];
      
      // Calculate active level
      const currentLevelObj = ORION_LEVELS.reduce((acc, lvl) => {
        if (prev.xp >= lvl.xpRequired) return lvl;
        return acc;
      }, ORION_LEVELS[0]);
      
      const currentLvl = currentLevelObj.level;
      const currentFriendship = prev.friendship || 0;
      const isUnlocked = (!item.levelRequired || currentLvl >= item.levelRequired) && 
                         (!item.friendshipRequired || currentFriendship >= item.friendshipRequired);
      
      if (!isUnlocked) return prev;

      let nextAcc;
      if (currentAcc.includes(id)) {
        nextAcc = currentAcc.filter(x => x !== id);
      } else {
        const typeFiltered = currentAcc.filter(x => {
          const accItem = ORION_ACCESSORIES.find(a => a.id === x);
          return !accItem || accItem.type !== item.type;
        });
        nextAcc = [...typeFiltered, id];
      }
      return {
        ...prev,
        accessories: nextAcc
      };
    });
  }, [setOrionData]);

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

    if (voiceEnabled) {
      OrionTTS.speak(message, {
        onStart: () => setIsSpeakingTTS(true),
        onEnd: () => setIsSpeakingTTS(false),
        onError: () => setIsSpeakingTTS(false),
      });
    }
  }, [voiceEnabled]);

  const dismissSpeech = useCallback(() => {
    setShowSpeech(false);
    clearTimeout(speechTimer.current);
    OrionTTS.stop();
    setIsSpeakingTTS(false);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev;
      if (next) {
        orionSounds.pop(); // small confirmation sound
      } else {
        OrionTTS.stop();
        setIsSpeakingTTS(false);
      }
      return next;
    });
  }, [setVoiceEnabled]);

  const startListening = useCallback((onResult) => {
    if (!OrionSTT.isSupported()) return;
    orionSounds.micOn();
    setIsListening(true);
    OrionSTT.startListening(
      onResult,
      () => { // onError
        setIsListening(false);
        orionSounds.micOff();
      },
      () => { // onEnd
        setIsListening(false);
        orionSounds.micOff();
      }
    );
  }, []);

  const stopListening = useCallback(() => {
    if (OrionSTT.isListening()) {
      OrionSTT.stopListening();
      setIsListening(false);
      orionSounds.micOff();
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    OrionTTS.stop();
    setIsSpeakingTTS(false);
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
        // Morning: Coffee, Reading, Looking, Music, Stretching (natural wake-up)
        behaviors = [
          ORION_EMOTIONS.IDLE_COFFEE, ORION_EMOTIONS.IDLE_COFFEE,
          ORION_EMOTIONS.IDLE_READING, ORION_EMOTIONS.IDLE_LOOKING,
          ORION_EMOTIONS.IDLE_MUSIC, ORION_EMOTIONS.IDLE_STRETCHING, ORION_EMOTIONS.IDLE
        ];
      } else if (hour >= 12 && hour < 18) {
        // Afternoon: Focused, Music, Reading, Cleaning, Stretching (post-lunch)
        behaviors = [
          ORION_EMOTIONS.IDLE_READING, ORION_EMOTIONS.IDLE_MUSIC,
          ORION_EMOTIONS.IDLE_CLEANING, ORION_EMOTIONS.IDLE, ORION_EMOTIONS.IDLE_LOOKING,
          ORION_EMOTIONS.IDLE_STRETCHING
        ];
      } else if (hour >= 18 && hour < 22) {
        // Evening: Stargazing, Reading, Music
        behaviors = [
          ORION_EMOTIONS.IDLE_STARGAZING, ORION_EMOTIONS.IDLE_STARGAZING,
          ORION_EMOTIONS.IDLE_MUSIC, ORION_EMOTIONS.IDLE_READING, ORION_EMOTIONS.IDLE
        ];
      } else {
        // Night: Sleepy, Stargazing, Idle, Stretching (winding down)
        behaviors = [
          ORION_EMOTIONS.SLEEPY, ORION_EMOTIONS.IDLE_STARGAZING,
          ORION_EMOTIONS.IDLE, ORION_EMOTIONS.IDLE_READING, ORION_EMOTIONS.IDLE_STRETCHING
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
    const currentEmotion = emotionRef.current;
    if (currentEmotion === ORION_EMOTIONS.SLEEPY || currentEmotion?.startsWith('idle_')) {
      if (currentEmotion === ORION_EMOTIONS.SLEEPY) {
        // Wake from sleep with a satisfying stretch before returning to idle
        setEmotion(ORION_EMOTIONS.IDLE_STRETCHING);
        speak('Yaaawn! Just had a little nap — let me stretch my wings! 🦉');
        setTimeout(() => setEmotion(ORION_EMOTIONS.IDLE), 3500);
      } else {
        setEmotion(ORION_EMOTIONS.IDLE);
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
  }, [speak, triggerRandomIdleBehavior]);

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
    let typingTimer;
    let scrollTimer;
    let lastScrollTime = 0;
    let scrollCount = 0;

    const handleActivity = () => resetInactivityTimer();
    
    const handleKeydown = (e) => {
      handleActivity();
      // Ignore modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
      
      // Trigger focused state when typing
      setEmotion(prev => {
        if (prev === ORION_EMOTIONS.FOCUSED || prev === ORION_EMOTIONS.SLEEPY) return prev;
        return ORION_EMOTIONS.FOCUSED;
      });
      
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        setEmotion(prev => prev === ORION_EMOTIONS.FOCUSED ? ORION_EMOTIONS.IDLE : prev);
      }, 1500);
    };

    const handleScroll = () => {
      handleActivity();
      const now = Date.now();
      if (now - lastScrollTime < 100) {
        scrollCount++;
      } else {
        scrollCount = 1;
      }
      lastScrollTime = now;

      // Trigger confused/dizzy if scrolling very fast
      if (scrollCount > 12) {
        setEmotion(prev => {
           if (prev === ORION_EMOTIONS.CONFUSED || prev === ORION_EMOTIONS.SLEEPY) return prev;
           return ORION_EMOTIONS.CONFUSED;
        });
        scrollCount = 0;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          setEmotion(prev => prev === ORION_EMOTIONS.CONFUSED ? ORION_EMOTIONS.IDLE : prev);
        }, 2000);
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keydown', handleKeydown, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    resetInactivityTimer();
    resetActiveUseTimer(); // Start tracking active use on mount
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(inactivityTimer.current);
      clearInterval(idleBehaviorTimer.current);
      clearTimeout(activeUseTimer.current);
      clearTimeout(typingTimer);
      clearTimeout(scrollTimer);
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
          setTimeout(() => {
            setEmotion(prev => (prev === response.emotion ? ORION_EMOTIONS.IDLE : prev));
          }, 3500);
        } catch {
          setEmotion(ORION_EMOTIONS.HAPPY);
          speak(`${greeting}! Ready to tackle your goals today? Here's your daily XP bonus! ⭐`, 8000);
          setTimeout(() => {
            setEmotion(prev => (prev === ORION_EMOTIONS.HAPPY ? ORION_EMOTIONS.IDLE : prev));
          }, 3500);
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

  useEffect(() => {
    const handleTimerStart = () => {
      setEmotion(ORION_EMOTIONS.FOCUSED);
      speak("Focus time! Let's get to work! 🦉", 5000);
    };
    const handleTimerStop = () => {
      setEmotion(ORION_EMOTIONS.IDLE);
    };
    window.addEventListener('orion-timer-start', handleTimerStart);
    window.addEventListener('orion-timer-stop', handleTimerStop);
    return () => {
      window.removeEventListener('orion-timer-start', handleTimerStart);
      window.removeEventListener('orion-timer-stop', handleTimerStop);
    };
  }, [speak]);

  const feedSnack = useCallback((type) => {
    if (type === 'coffee') {
      setXpMultiplier(2);
      setBoosterTimeLeft(15 * 60); // 15 minutes
      setEmotion(ORION_EMOTIONS.IDLE_COFFEE);
      speak("Gulp... Ah! ☕ Double XP study mode activated! I am full of energy now!");
      orionSounds.levelUp();
    } else if (type === 'cookie') {
      setOrionData(prev => ({
        ...prev,
        friendship: Math.min(100, (prev.friendship || 0) + 5)
      }));
      setEmotion(ORION_EMOTIONS.IDLE_COOKIE);
      speak("Nom nom nom... 🍪 Mmm, delicious! Thanks for the treat! Orion feels closer to you.");
      orionSounds.levelUp();
      setTimeout(() => setEmotion(ORION_EMOTIONS.IDLE), 4000);
    }
  }, [setOrionData, speak]);

  // ─── Computed Values ─────────────────────────────────────────────────────────
  const { profile } = useAuth() || {};

  const currentLevel = getCurrentLevel(orionData.xp || 0);
  const nextLevel = getNextLevel(orionData.xp || 0);
  const xpProgress = getXpProgress(orionData.xp || 0);
  
  const baseContext = PAGE_CONTEXTS[location.pathname] || PAGE_CONTEXTS['/dashboard'];
  const userRole = profile?.role || 'user';
  
  const roleContextMap = {
    educator: 'mentor & curriculum assistant',
    team_lead: 'workspace coordinator',
    admin: 'system & platform analyst',
    superadmin: 'platform owner consultant',
    restricted: 'read-only study guide'
  };

  const pageContext = {
    ...baseContext,
    role: roleContextMap[userRole] ? `${roleContextMap[userRole]} (${baseContext.role})` : baseContext.role,
    userRole
  };

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
    voiceEnabled,
    isSpeakingTTS,
    isListening,
    xpMultiplier,
    boosterTimeLeft,

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
    toggleVoice,
    startListening,
    stopListening,
    cancelSpeech,
    toggleAccessory,
    feedSnack,
    toggleMute,
  };

  return <OrionContext.Provider value={value}>{children}</OrionContext.Provider>;
};

export default OrionContext;
