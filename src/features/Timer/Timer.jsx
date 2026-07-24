import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Bell,
  Brain,
  Clock,
  Coffee,
  History,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer as TimerIcon,
  Waves,
  Zap,
  Volume2,
  VolumeX,
  Flame,
  CheckSquare,
  Trash2,
  SkipForward,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { playAlarmSound, stopAlarmSound } from '../../utils/alarmAudio';
import Select from '../../components/ui/Select';
import { useLocation } from 'react-router-dom';
import { useOrion } from '../../context/OrionContext';

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DAILY_FOCUS_GOAL_MINS = 100;

const MODES = [
  {
    id: 'focus',
    label: 'Focus Sprint',
    subtitle: 'Deep work, no distractions.',
    time: POMODORO_TIME,
    color: 'text-primary-500',
    bg: 'bg-primary-500/10 dark:bg-primary-500/10',
    border: 'border-primary-500/30',
    glow: '#0ea5e9',
    icon: Brain,
  },
  {
    id: 'short',
    label: 'Short Break',
    subtitle: 'A quick reset between rounds.',
    time: SHORT_BREAK,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: '#10b981',
    icon: Coffee,
  },
  {
    id: 'long',
    label: 'Long Break',
    subtitle: 'Recover after a full cycle.',
    time: LONG_BREAK,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: '#f59e0b',
    icon: Waves,
  },
];

const formatTime = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

const formatMinutes = (seconds) => `${Math.max(1, Math.round(seconds / 60))} min`;

const Ring = ({ progress, color }) => {
  const safeProgress = Math.min(Math.max(progress, 0), 1);
  const dashOffset = CIRCUMFERENCE * (1 - safeProgress);

  return (
    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="timer-ring-gradient" x1="38" y1="38" x2="202" y2="202" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>

      <circle
        cx="120"
        cy="120"
        r={RADIUS + 5}
        stroke="rgba(56,189,248,0.06)"
        strokeWidth="10"
      />
      <circle
        cx="120"
        cy="120"
        r={RADIUS}
        stroke="currentColor"
        strokeWidth="6"
        className="text-slate-200/60 dark:text-slate-800"
      />
      <motion.circle
        cx="120"
        cy="120"
        r={RADIUS}
        stroke="url(#timer-ring-gradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 8px ${color}44)` }}
      />
    </svg>
  );
};

const useSoundscapes = () => {
  const [soundType, setSoundType] = useState('none');
  const [volume, setVolume] = useStorage('timer_ambient_volume', 0.5);
  const audioCtxRef = useRef(null);
  const sourcesRef = useRef([]);
  const volumeNodeRef = useRef(null);

  const startSound = (type, currentVolume = volume) => {
    stopSound();
    if (type === 'none') return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const volumeNode = ctx.createGain();
      volumeNode.gain.value = currentVolume;
      volumeNode.connect(ctx.destination);
      volumeNodeRef.current = volumeNode;

      setSoundType(type);

      if (type === 'rain') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; 
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        noise.connect(filter);
        filter.connect(volumeNode);
        noise.start();
        sourcesRef.current.push(noise);

      } else if (type === 'binaural') {
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.frequency.value = 145;
        const gainL = ctx.createGain();
        gainL.gain.value = 0.5;
        oscL.connect(gainL);
        gainL.connect(merger, 0, 0);

        const oscR = ctx.createOscillator();
        oscR.frequency.value = 153;
        const gainR = ctx.createGain();
        gainR.gain.value = 0.5;
        oscR.connect(gainR);
        gainR.connect(merger, 0, 1);

        merger.connect(volumeNode);

        oscL.start();
        oscR.start();

        sourcesRef.current.push(oscL, oscR);

      } else if (type === 'pulse') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 80;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 160;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.25; 
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 60;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        osc.connect(filter);
        filter.connect(volumeNode);

        osc.start();
        lfo.start();

        sourcesRef.current.push(osc, lfo);
      }
    } catch (e) {
      console.error("Audio Synthesis error: ", e);
    }
  };

  const stopSound = () => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch {}
    });
    sourcesRef.current = [];
    if (volumeNodeRef.current) {
      try { volumeNodeRef.current.disconnect(); } catch {}
      volumeNodeRef.current = null;
    }
    setSoundType('none');
  };

  const updateVolume = (newVol) => {
    setVolume(newVol);
    if (volumeNodeRef.current) {
      volumeNodeRef.current.gain.value = newVol;
    }
  };

  useEffect(() => {
    return () => {
      sourcesRef.current.forEach(source => {
        try { source.stop(); } catch {}
      });
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, []);

  return {
    soundType,
    volume,
    startSound,
    stopSound,
    updateVolume,
  };
};

const Timer = () => {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customDuration, setCustomDuration] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [activeTab, setActiveTab] = useState('modes'); // 'modes', 'custom', 'soundscapes'

  const [totalSessions, setTotalSessions] = useStorage('timer_sessions', 0);
  const [streak, setStreak] = useStorage('timer_streak', 0);
  const [history, setHistory] = useStorage('timer_history', []);
  const [soundEnabled] = useStorage('timer_sound_enabled', true);
  
  const location = useLocation();
  const [projects, setProjects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [selectedProjectId, setSelectedProjectId] = useState(location.state?.projectId || 'none');
  const [selectedTaskId, setSelectedTaskId] = useState(location.state?.taskId || 'none');

  const { orionData, emotion, speak } = useOrion();
  const soundscapes = useSoundscapes();

  const intervalRef = useRef(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const availableTasks = selectedProject?.board ? [
    ...(selectedProject.board.todo || []),
    ...(selectedProject.board.doing || []),
    ...(selectedProject.board.done || [])
  ] : [];
  const selectedTask = availableTasks.find(t => t.id === selectedTaskId);

  const currentMode = MODES.find((item) => item.id === mode) || MODES[0];
  const activeDuration = customDuration ?? currentMode.time;
  const progress = activeDuration > 0 ? timeLeft / activeDuration : 0;
  const recentEntries = [...history].slice(-5).reverse();
  const focusEntries = history.filter((entry) => entry.mode === 'focus' || entry.mode === 'custom');
  const minutesLogged = focusEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const dailyFocusGoalMins = DAILY_FOCUS_GOAL_MINS;
  const currentMinutesLogged = Math.round(minutesLogged / 60);

  const stopTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    soundscapes.stopSound();
    window.dispatchEvent(new CustomEvent('orion-timer-stop'));
  };

  const resetTimer = (nextMode = mode, nextCustomDuration = customDuration) => {
    stopTimer();
    stopAlarmSound();
    setIsRunning(false);
    setMode(nextMode);
    setCustomDuration(nextCustomDuration);

    const resolvedMode = MODES.find((item) => item.id === nextMode) || MODES[0];
    setTimeLeft(nextCustomDuration ?? resolvedMode.time);
  };

  const finishSession = () => {
    stopTimer();
    setIsRunning(false);

    if (soundEnabled) {
      playAlarmSound({ volume: 0.7, repeatCount: 3 });
    }

    const completedAt = new Date().toISOString();
    const sessionMode = customDuration ? 'custom' : mode;

    setHistory((prev) =>
      [...prev, { mode: sessionMode, completedAt, duration: activeDuration }].slice(-50)
    );
    setTotalSessions((prev) => prev + 1);

    // Auto-log focus session minutes to goals storage
    if (sessionMode === 'focus' || sessionMode === 'custom') {
      try {
        const goalsDataRaw = localStorage.getItem(STORAGE_KEYS.GOALS);
        let goalsData = {};
        if (goalsDataRaw) {
          goalsData = JSON.parse(goalsDataRaw);
        }
        const getTodayKey = () => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate()
          ).padStart(2, '0')}`;
        };
        const todayKey = getTodayKey();
        const minutes = Math.max(1, Math.round(activeDuration / 60));
        
        const sessions = goalsData.sessionsByDate && typeof goalsData.sessionsByDate === 'object' ? goalsData.sessionsByDate : {};
        goalsData.sessionsByDate = {
          ...sessions,
          [todayKey]: (Number(sessions[todayKey]) || 0) + minutes
        };
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goalsData));
      } catch (err) {
        console.error('Error auto-logging focus session to goals:', err);
      }
    }

    if (selectedProjectId !== 'none') {
      setProjects(prev => prev.map(p => {
        if (p.id === selectedProjectId) {
          const newTime = (p.timeSpent || 0) + activeDuration;
          const newActivity = {
            id: `act-${Date.now()}`,
            type: 'focus_session',
            detail: `Completed a ${formatMinutes(activeDuration)} focus block`,
            timestamp: new Date().toISOString()
          };
          
          let updatedBoard = p.board;
          if (selectedTaskId !== 'none' && p.board) {
             const updateTaskInColumn = (tasks = []) => tasks.map(t => 
                 t.id === selectedTaskId ? { ...t, timeSpent: (t.timeSpent || 0) + activeDuration } : t
             );
             updatedBoard = {
                 ...p.board,
                 todo: updateTaskInColumn(p.board.todo),
                 doing: updateTaskInColumn(p.board.doing),
                 done: updateTaskInColumn(p.board.done),
             };
          }

          return { ...p, timeSpent: newTime, activity: [newActivity, ...(p.activity || [])], board: updatedBoard };
        }
        return p;
      }));
    }

    if (sessionMode === 'focus' || sessionMode === 'custom') {
      window.dispatchEvent(new CustomEvent('orion-xp', { detail: { event: 'POMODORO_DONE' } }));
      setCycleCount((prev) => {
        const nextCount = prev + 1;

        if (nextCount >= 4) {
          setStreak((current) => current + 1);
          toast.success('Four focus rounds completed. Time for a long break.');
          setMode('long');
          setCustomDuration(null);
          setTimeLeft(LONG_BREAK);
          return 0;
        }

        toast.success('Focus session complete. Take a short break.');
        setMode('short');
        setCustomDuration(null);
        setTimeLeft(SHORT_BREAK);
        return nextCount;
      });
      return;
    }

    toast.success('Break complete. Back to focus.');
    setMode('focus');
    setCustomDuration(null);
    setTimeLeft(POMODORO_TIME);
  };

  const startTimer = () => {
    stopTimer();
    stopAlarmSound();
    setIsRunning(true);
    window.dispatchEvent(new CustomEvent('orion-timer-start'));

    if (soundscapes.soundType !== 'none') {
      soundscapes.startSound(soundscapes.soundType);
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const adjustTime = (seconds) => {
    setTimeLeft((prev) => Math.max(0, prev + seconds));
    toast.success(`${seconds > 0 ? '+' : ''}${seconds / 60} minutes adjusted`);
  };

  const skipSession = () => {
    if (window.confirm("Skip this session? Focus details won't be saved.")) {
      finishSession();
    }
  };

  const completeActiveTask = () => {
    if (!selectedProject || !selectedTask) return;
    
    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectId && p.board) {
        const newTodo = (p.board.todo || []).filter(t => t.id !== selectedTaskId);
        const newDoing = (p.board.doing || []).filter(t => t.id !== selectedTaskId);
        const alreadyDone = (p.board.done || []).find(t => t.id === selectedTaskId);
        const newDone = alreadyDone ? p.board.done : [...(p.board.done || []), { ...selectedTask, status: 'done' }];
        
        toast.success(`Task "${selectedTask.title}" marked as complete!`);
        return {
          ...p,
          board: {
            ...p.board,
            todo: newTodo,
            doing: newDoing,
            done: newDone
          }
        };
      }
      return p;
    }));
  };

  const clearSessionHistory = () => {
    if (window.confirm("Are you sure you want to clear your focus logs history?")) {
      setHistory([]);
      setTotalSessions(0);
      setStreak(0);
      toast.success("History cleared.");
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => () => {
    stopTimer();
    stopAlarmSound();
  }, []);

  return (
    <>
      {/* Premium Glassmorphic Zen Mode Overlay */}
      <AnimatePresence>
        {zenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9990] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center pointer-events-auto"
          >
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-1000"
              style={{
                background: `radial-gradient(circle at center, ${currentMode.glow}33 0%, transparent 60%)`
              }}
            />
            
            <div className="absolute top-8 text-slate-400 text-sm font-bold tracking-widest uppercase flex items-center gap-2">
              <Brain size={16} className="animate-pulse" /> Zen Focus Active
            </div>
            
            <div className="relative flex h-80 w-80 items-center justify-center lg:h-[28rem] lg:w-[28rem] mb-12 flex-shrink-0">
              <div 
                className="absolute inset-8 rounded-full blur-3xl opacity-30 transition-colors duration-1000 animate-pulse"
                style={{ backgroundColor: currentMode.glow }}
              />
              <Ring progress={progress} color={currentMode.glow} />
              <div className="relative z-10 flex flex-col items-center text-center">
                <p className="text-8xl font-black tabular-nums leading-none tracking-[-0.06em] text-white drop-shadow-md lg:text-[7rem]">
                  {formatTime(timeLeft)}
                </p>
                <p className="mt-4 text-base font-semibold tracking-wider uppercase" style={{ color: currentMode.glow }}>
                  {currentMode.label}
                </p>
                {selectedTask && (
                  <p className="mt-2 text-sm text-slate-400 max-w-xs truncate px-4">
                    Focusing on: {selectedTask.title}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => adjustTime(-60)} 
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition"
                title="Subtract 1 minute"
              >
                <MinusCircle size={20} />
              </button>
              <button 
                onClick={() => adjustTime(60)} 
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition"
                title="Add 1 minute"
              >
                <PlusCircle size={20} />
              </button>
              <button 
                onClick={skipSession} 
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition"
                title="Skip round"
              >
                <SkipForward size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={isRunning ? () => { stopTimer(); setIsRunning(false); } : startTimer}
                className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-950 px-8 py-4 font-bold transition hover:scale-105 shadow-lg"
              >
                {isRunning ? <Pause size={20} /> : <Play size={20} />}
                {isRunning ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => { setZenMode(false); }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-8 py-4 font-bold text-white transition hover:bg-white/20 backdrop-blur"
              >
                Exit Zen Mode
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
        <PageHeader
          title="Timer"
          description="A focused Pomodoro workspace designed for maximum efficiency."
          icon={<TimerIcon size={26} />}
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZenMode(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 hover:bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <Brain size={18} />
                Zen Mode
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary-500/30 dark:hover:text-primary-300"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </div>
          }
        />


        {/* Layout Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:min-h-0 lg:flex-1">
          {/* Main Focus Control Center */}
          <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
            <section className="card flex flex-col gap-4 p-4 sm:p-5">
              {/* Header and Project Selectors */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                    <Sparkles size={11} />
                    Study Flow
                  </div>
                  <h3 className="mt-1 text-base font-black text-slate-800 dark:text-white">
                    {customDuration ? `Custom ${customMinutes}-min block` : currentMode.subtitle}
                  </h3>
                </div>
                
                {/* Selectors */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="flex-1 min-w-[150px] sm:w-56 sm:flex-initial">
                    <Select
                      value={selectedProjectId}
                      onChange={(val) => {
                         setSelectedProjectId(val);
                         setSelectedTaskId('none');
                      }}
                      disabled={isRunning}
                      placeholder="Project"
                      options={[
                        { label: '-- General Focus --', value: 'none' },
                        ...projects.map(p => ({ label: p.name, value: p.id }))
                      ]}
                    />
                  </div>
                  {selectedProjectId !== 'none' && (
                    <div className="flex-1 min-w-[150px] sm:w-56 sm:flex-initial">
                      <Select
                        value={selectedTaskId}
                        onChange={(val) => setSelectedTaskId(val)}
                        disabled={isRunning}
                        placeholder="Task"
                        options={[
                          { label: '-- No Task --', value: 'none' },
                          ...availableTasks.map(t => ({ label: t.title, value: t.id }))
                        ]}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Centered Timer Ring Container (Slightly smaller to fit fully) */}
              <div className="relative flex h-48 w-48 sm:h-52 sm:w-52 lg:h-[13.5rem] lg:w-[13.5rem] items-center justify-center mx-auto my-1 flex-shrink-0">
                <div className="absolute inset-8 rounded-full bg-gradient-to-b from-sky-400/10 via-cyan-400/5 to-transparent blur-xl" />
                <Ring progress={progress} color={currentMode.glow} />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-400">
                    <span className="h-1 w-1 rounded-full bg-sky-500 animate-pulse" />
                    {customDuration ? 'Custom' : currentMode.label}
                  </div>
                  <p className="text-4xl font-black tabular-nums leading-none tracking-[-0.04em] text-slate-900 dark:text-white sm:text-5xl">
                    {formatTime(timeLeft)}
                  </p>
                  <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isRunning ? 'Running' : 'Paused'}
                  </p>
                </div>
              </div>

              {/* Adjustments & Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustTime(-60)}
                  disabled={timeLeft < 60}
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                  title="Remove 1 minute"
                >
                  <MinusCircle size={16} />
                </button>

                <motion.button
                  type="button"
                  onClick={isRunning ? () => { stopTimer(); setIsRunning(false); } : startTimer}
                  className={`h-10 px-6 inline-flex items-center justify-center gap-2 rounded-xl font-bold shadow transition ${
                    isRunning
                      ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isRunning ? <Pause size={16} /> : <Play size={16} />}
                  {isRunning ? 'Pause' : 'Start Focus'}
                </motion.button>

                <button
                  type="button"
                  onClick={() => adjustTime(60)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-300 transition"
                  title="Add 1 minute"
                >
                  <PlusCircle size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => resetTimer()}
                  className="h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-bold text-slate-700 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>

                {isRunning && (
                  <button
                    type="button"
                    onClick={skipSession}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 transition"
                    title="Skip current session"
                  >
                    <SkipForward size={16} />
                  </button>
                )}
              </div>

              {/* Compact Settings Tabs (Modes / Custom Duration / Audio Mixer) */}
              <div className="flex border-b border-slate-100 dark:border-slate-800/80 mt-3">
                <button
                  onClick={() => setActiveTab('modes')}
                  className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-wider transition ${
                    activeTab === 'modes'
                      ? 'text-primary-500 border-b-2 border-primary-500'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  Modes
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-wider transition ${
                    activeTab === 'custom'
                      ? 'text-primary-500 border-b-2 border-primary-500'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  Custom Time
                </button>
                <button
                  onClick={() => setActiveTab('soundscapes')}
                  className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-wider transition ${
                    activeTab === 'soundscapes'
                      ? 'text-primary-500 border-b-2 border-primary-500'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  Audio Mixer
                </button>
              </div>

              {/* Tab Content Panel */}
              <div className="min-h-[80px] flex flex-col justify-center">
                {activeTab === 'modes' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid w-full gap-2 grid-cols-3"
                  >
                    {MODES.map((item) => {
                      const ActiveIcon = item.icon;
                      const isActive = !customDuration && mode === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => resetTimer(item.id)}
                          className={`flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3 rounded-xl border p-2 sm:px-3 sm:py-2 text-center sm:text-left transition hover:-translate-y-0.5 ${
                            isActive
                              ? `${item.bg} ${item.border}`
                              : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg flex-shrink-0 ${item.bg} ${item.border}`}>
                            <ActiveIcon size={13} className={item.color} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-white truncate">{item.label}</p>
                            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400">{formatMinutes(item.time)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}

                {activeTab === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 p-3 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Custom Duration</p>
                      <p className="text-[10px] text-slate-500">Configure focus sprint blocks.</p>
                    </div>
                    <div className="flex gap-2 items-center mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(Number(e.target.value) || 0)}
                        className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold text-slate-900 outline-none transition focus:border-primary-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                      <span className="text-[10px] font-semibold text-slate-500">mins</span>
                      <button
                        type="button"
                        onClick={() => {
                          stopTimer();
                          stopAlarmSound();
                          setIsRunning(false);
                          setMode('focus');
                          setCustomDuration(Math.max(1, customMinutes) * 60);
                          setTimeLeft(Math.max(1, customMinutes) * 60);
                        }}
                        className="rounded-lg bg-primary-500 hover:bg-primary-600 px-3 py-1.5 text-xs font-bold text-white transition"
                      >
                        Apply
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'soundscapes' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 p-3 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { id: 'none', label: 'Mute' },
                        { id: 'rain', label: 'Rain' },
                        { id: 'binaural', label: 'Alpha Beats' },
                        { id: 'pulse', label: 'Deep Pulse' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            if (s.id === 'none') {
                              soundscapes.stopSound();
                            } else {
                              soundscapes.startSound(s.id);
                            }
                          }}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                            soundscapes.soundType === s.id
                              ? 'bg-primary-500/10 text-primary-500 border-primary-500/30'
                              : 'bg-white border-slate-100 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 min-w-[120px]">
                      <VolumeX size={13} className="text-slate-400 flex-shrink-0" />
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundscapes.volume}
                        onChange={(e) => soundscapes.updateVolume(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                      <Volume2 size={13} className="text-slate-400 flex-shrink-0" />
                    </div>
                  </motion.div>
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar - Combined context panels */}
          <div className="flex flex-col gap-4 lg:h-full lg:min-h-0 lg:pr-1">
            {/* Active Task & Daily Progress Card */}
            <section className="card p-4 flex flex-col justify-between lg:flex-1">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-indigo-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Current Task</span>
                  </div>
                  {selectedTask && (
                    <button 
                      onClick={completeActiveTask}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px] hover:bg-emerald-500 hover:text-white transition"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
                
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                    {selectedTask ? selectedTask.title : 'No Task Selected'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {selectedTask?.description || 'Pick a task above to log details.'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    <Flame size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-bold">Daily Goal</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    {currentMinutesLogged} / {dailyFocusGoalMins}m
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (currentMinutesLogged / dailyFocusGoalMins) * 100)}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            </section>

            {/* Orion Assistant Panel */}
            <section className="card bg-gradient-to-br from-indigo-500/5 to-primary-500/5 border border-primary-500/10 p-4 flex flex-col justify-between lg:flex-1">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🦉</span>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white text-xs">Orion Focus Partner</h3>
                    <p className="text-[9px] font-bold text-primary-500 tracking-wide uppercase">
                      Level {orionData.level}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs italic text-slate-600 dark:text-slate-400 line-clamp-2">
                  "{emotion === 'focused' ? 'Keep pushin, I am studying with you!' : 'Ready to block out distractions and sprint?'}"
                </p>
              </div>
              <button 
                onClick={() => speak("Stay focused! You got this! 🦉")}
                className="mt-2.5 w-full py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold hover:bg-slate-50 transition"
              >
                Talk to Orion
              </button>
            </section>

            {/* Quick Stats & Recent Sessions combined */}
            <section className="card p-4 flex flex-col justify-between lg:flex-1 lg:overflow-hidden gap-3">
              <div className="flex flex-col gap-3 min-h-0 flex-1">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    <Award size={14} className="text-primary-500" />
                    Stats & History
                  </h3>
                  {recentEntries.length > 0 && (
                    <button 
                      onClick={clearSessionHistory}
                      className="text-slate-400 hover:text-red-500 p-0.5"
                      title="Clear history"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {/* Mini Stats row */}
                <div className="grid grid-cols-2 gap-1.5 text-center">
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-lg p-1.5 border border-slate-100/50 dark:border-slate-800/40">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Sessions</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{totalSessions}</p>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-lg p-1.5 border border-slate-100/50 dark:border-slate-800/40">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Streak</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{streak}</p>
                  </div>
                </div>

                {/* History list */}
                <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
                  {recentEntries.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-2">
                      No sessions logged yet.
                    </p>
                  ) : (
                    recentEntries.map((entry, index) => {
                      const matchedMode = MODES.find((item) => item.id === entry.mode) || MODES[0];
                      const EntryIcon = entry.mode === 'custom' ? Sparkles : matchedMode.icon;

                      return (
                        <div
                          key={`${entry.completedAt}-${index}`}
                          className="flex items-center gap-2 rounded-lg border border-slate-100/60 bg-slate-50/40 p-2 dark:border-slate-800/60 dark:bg-slate-900/20"
                        >
                          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${matchedMode.bg}`}>
                            <EntryIcon size={12} className={matchedMode.color} />
                          </div>
                          <div className="min-w-0 flex-1 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                              {entry.mode === 'custom' ? 'Custom' : matchedMode.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 pl-2">
                              {formatMinutes(entry.duration)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Timer;
