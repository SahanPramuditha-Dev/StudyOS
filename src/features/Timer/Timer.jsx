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
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import { useStorage } from '../../hooks/useStorage';
import { playAlarmSound, stopAlarmSound } from '../../utils/alarmAudio';

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;
const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MODES = [
  {
    id: 'focus',
    label: 'Focus Sprint',
    subtitle: 'Deep work, no distractions.',
    time: POMODORO_TIME,
    color: 'text-primary-600',
    bg: 'bg-primary-50 dark:bg-primary-500/10',
    border: 'border-primary-200 dark:border-primary-500/30',
    glow: '#0ea5e9',
    icon: Brain,
  },
  {
    id: 'short',
    label: 'Short Break',
    subtitle: 'A quick reset between rounds.',
    time: SHORT_BREAK,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    glow: '#10b981',
    icon: Coffee,
  },
  {
    id: 'long',
    label: 'Long Break',
    subtitle: 'Recover after a full cycle.',
    time: LONG_BREAK,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
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
    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 300 300" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="timer-ring-gradient" x1="48" y1="48" x2="252" y2="252" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>

      <circle
        cx="150"
        cy="150"
        r={RADIUS + 8}
        stroke="rgba(56,189,248,0.12)"
        strokeWidth="18"
      />
      <circle
        cx="150"
        cy="150"
        r={RADIUS}
        stroke="currentColor"
        strokeWidth="10"
        className="text-slate-200/80 dark:text-slate-800"
      />
      <motion.circle
        cx="150"
        cy="150"
        r={RADIUS}
        stroke="url(#timer-ring-gradient)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 14px ${color}66)` }}
      />
      {safeProgress > 0.02 && (
        <motion.circle
          cx={150 + RADIUS * Math.cos(2 * Math.PI * safeProgress - Math.PI / 2)}
          cy={150 + RADIUS * Math.sin(2 * Math.PI * safeProgress - Math.PI / 2)}
          r="5"
          fill={color}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          animate={isNaN(safeProgress) ? {} : { opacity: [1, 0.45, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
    </svg>
  );
};

const Timer = () => {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customDuration, setCustomDuration] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [totalSessions, setTotalSessions] = useStorage('timer_sessions', 0);
  const [streak, setStreak] = useStorage('timer_streak', 0);
  const [history, setHistory] = useStorage('timer_history', []);
  const [soundEnabled] = useStorage('timer_sound_enabled', true);

  const intervalRef = useRef(null);

  const currentMode = MODES.find((item) => item.id === mode) || MODES[0];
  const activeDuration = customDuration ?? currentMode.time;
  const progress = activeDuration > 0 ? timeLeft / activeDuration : 0;
  const recentEntries = [...history].slice(-5).reverse();
  const focusEntries = history.filter((entry) => entry.mode === 'focus' || entry.mode === 'custom');
  const minutesLogged = focusEntries.reduce((sum, entry) => sum + entry.duration, 0);

  const stopTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
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

    if (sessionMode === 'focus' || sessionMode === 'custom') {
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
    <div className="relative mx-auto flex max-w-7xl flex-col gap-5 px-4 pb-6 pt-4 sm:px-6 lg:h-[calc(100vh-4.5rem)] lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_58%),radial-gradient(circle_at_right,rgba(56,189,248,0.08),transparent_30%)] dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_52%),radial-gradient(circle_at_right,rgba(59,130,246,0.08),transparent_28%)]" />
      <PageHeader
        title="Timer"
        description="A focused Pomodoro workspace that matches the rest of StudyOS."
        icon={<TimerIcon size={26} />}
        action={
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary-500/30 dark:hover:text-primary-300"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        }
      />

      <section className="card">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Sessions', value: totalSessions, icon: Clock },
            { label: 'Streak', value: streak, icon: Award },
            { label: 'Logged', value: history.length, icon: History },
            { label: 'Minutes', value: Math.round(minutesLogged / 60), icon: Zap },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/30">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Icon size={13} className="text-primary-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.24em]">{label}</span>
              </div>
              <div className="mt-1 text-2xl font-black tabular-nums text-slate-800 dark:text-white">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid min-h-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_320px] xl:flex-1">
        <section className="card flex min-h-0 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                <Sparkles size={12} />
                Study Flow
              </div>
              <h3 className="mt-2.5 text-lg font-black text-slate-800 dark:text-white">
                {customDuration ? `Custom ${customMinutes}-minute block` : currentMode.subtitle}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {customDuration ? 'Custom timer active' : 'Pick a mode, then start when you are ready.'}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <TimerIcon size={16} className="text-primary-500" />
              {customDuration ? 'Custom mode' : currentMode.label}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 rounded-[2rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.94))] px-4 py-6 shadow-[0_20px_60px_rgba(14,165,233,0.08)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(2,6,23,0.96))] dark:shadow-black/20">
            <div className="relative flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64 lg:h-[17rem] lg:w-[17rem]">
              <div className="absolute inset-8 rounded-full bg-gradient-to-b from-sky-400/10 via-cyan-400/5 to-transparent blur-2xl" />
              <Ring progress={progress} color={currentMode.glow} />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  {customDuration ? 'Custom timer' : currentMode.label}
                </div>
                <p className="text-5xl font-black tabular-nums leading-none tracking-[-0.06em] text-slate-900 drop-shadow-sm dark:text-white sm:text-6xl lg:text-[4.65rem]">
                  {formatTime(timeLeft)}
                </p>
                <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400 sm:text-base">
                  {isRunning ? 'Running now' : 'Paused'}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <motion.button
                type="button"
                onClick={isRunning ? () => { stopTimer(); setIsRunning(false); } : startTimer}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold shadow-sm transition sm:w-auto ${
                  isRunning
                    ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                {isRunning ? 'Pause' : 'Start'}
              </motion.button>

              <button
                type="button"
                onClick={() => resetTimer()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 sm:w-auto"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-3">
              {MODES.map((item) => {
                const ActiveIcon = item.icon;
                const isActive = !customDuration && mode === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => resetTimer(item.id)}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition hover:-translate-y-0.5 ${
                      isActive
                        ? `${item.bg} ${item.border}`
                        : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${item.bg} ${item.border}`}>
                      <ActiveIcon size={16} className={item.color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</p>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{formatMinutes(item.time)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex w-full flex-col gap-3 rounded-2xl border border-slate-100 bg-white/80 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/30 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Custom Duration</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Set the next session to your own pace.</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-bold text-slate-900 outline-none transition focus:border-primary-400 sm:w-24 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">minutes</span>
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
                  className="w-full rounded-2xl bg-primary-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-600 sm:w-auto"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-4">
          <section className="card">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-800 dark:text-white">
              <Bell size={18} className="text-primary-500" />
              Progress
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { label: 'Total Sessions', value: totalSessions, icon: Clock, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-500/10' },
                { label: 'Streak', value: streak, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                { label: 'Focus Logs', value: focusEntries.length, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                { label: 'Minutes Logged', value: Math.round(minutesLogged / 60), icon: History, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${bg}`}>
                    <Icon size={15} className={color} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
                    <p className="mt-0.5 text-lg font-black text-slate-800 dark:text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card flex min-h-0 flex-col">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-800 dark:text-white">
              <History size={18} className="text-primary-500" />
              Recent Sessions
            </h3>

            <div className="mt-3 min-h-0 space-y-2 overflow-auto pr-1 xl:max-h-[18.5rem]">
              {recentEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                  No sessions logged yet. Start a round and it will show up here.
                </div>
              ) : (
                recentEntries.map((entry, index) => {
                  const matchedMode = MODES.find((item) => item.id === entry.mode) || MODES[0];
                  const EntryIcon = entry.mode === 'custom' ? Sparkles : matchedMode.icon;

                  return (
                    <div
                      key={`${entry.completedAt}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${matchedMode.bg} ${matchedMode.border}`}>
                        <EntryIcon size={16} className={matchedMode.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-slate-800 dark:text-white">
                            {entry.mode === 'custom' ? 'Custom Block' : matchedMode.label}
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            {formatMinutes(entry.duration)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(entry.completedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Timer;
