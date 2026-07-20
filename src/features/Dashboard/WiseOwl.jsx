import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BellRing,
  Brain,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Eye,
  Flame,
  MessageCircle,
  Sparkles,
  Stars,
  Target,
  Trophy,
  WandSparkles,
  Zap
} from 'lucide-react';

const MOODS = {
  happy: {
    label: 'Happy',
    accent: 'from-emerald-400 to-cyan-400',
    copy: 'Great progress! Your knowledge tree is growing 🌱'
  },
  thinking: {
    label: 'Thinking',
    accent: 'from-sky-400 to-indigo-400',
    copy: 'Need help understanding this concept?'
  },
  focused: {
    label: 'Focused',
    accent: 'from-cyan-400 to-blue-500',
    copy: "Your focus session starts now. Let's learn together."
  },
  celebrating: {
    label: 'Celebrating',
    accent: 'from-amber-300 to-fuchsia-400',
    copy: 'Wisdom unlocked. Excellent work.'
  },
  sleepy: {
    label: 'Sleepy',
    accent: 'from-slate-400 to-slate-600',
    copy: "Rest well. We'll continue learning when you return."
  },
  worried: {
    label: 'Worried',
    accent: 'from-rose-400 to-orange-400',
    copy: 'I spotted a deadline nearby. Let’s handle it calmly.'
  },
  proud: {
    label: 'Proud',
    accent: 'from-yellow-300 to-amber-500',
    copy: 'A refined scholar stance. Keep the momentum going.'
  },
  confused: {
    label: 'Confused',
    accent: 'from-violet-400 to-pink-400',
    copy: 'Let’s untangle this together, one idea at a time.'
  }
};

const ENVIRONMENTS = [
  {
    id: 'library',
    label: 'Library',
    description: 'Floating books, warm lighting, and a wooden study desk.'
  },
  {
    id: 'observatory',
    label: 'Observatory',
    description: 'Star maps, holograms, and a calm cosmic study space.'
  },
  {
    id: 'cyber',
    label: 'Cyber Classroom',
    description: 'Glowing panels and futuristic learning tools.'
  },
  {
    id: 'cabin',
    label: 'Forest Cabin',
    description: 'Quiet wood textures, plants, and natural focus energy.'
  }
];

const QUICK_ACTIONS = [
  { label: 'Explain a concept', prompt: 'Explain recursion in a simple way.' },
  { label: 'Create flashcards', prompt: 'Create flashcards from my notes.' },
  { label: 'Summarize notes', prompt: 'Summarize my notes into study bullets.' },
  { label: 'Plan study time', prompt: 'Plan my study schedule for today.' }
];

const accessories = [
  { id: 'glasses', label: 'AI Glasses' },
  { id: 'cap', label: 'Graduation Cap' },
  { id: 'robe', label: 'Professor Robe' },
  { id: 'book', label: 'Hologram Book' },
  { id: 'coffee', label: 'Coffee Cup' }
];

const WiseOwl = ({
  mood = 'happy',
  streakDays = 0,
  overdueCount = 0,
  upcomingCount = 0,
  onAskNova,
  onOpenTimer,
  onOpenPlanner,
  onOpenReview,
  onOpenAnalytics,
  onMoodChange
}) => {
  const [currentMood, setCurrentMood] = useState(mood);
  const [environment, setEnvironment] = useState('library');
  const [accessory, setAccessory] = useState('glasses');

  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  useEffect(() => {
    onMoodChange?.(currentMood);
  }, [currentMood, onMoodChange]);

  const moodData = MOODS[currentMood] || MOODS.happy;
  const environmentData = useMemo(
    () => ENVIRONMENTS.find((item) => item.id === environment) || ENVIRONMENTS[0],
    [environment]
  );

  const statusMood = useMemo(() => {
    if (overdueCount > 0) return 'worried';
    if (streakDays >= 100) return 'proud';
    if (streakDays >= 30) return 'celebrating';
    if (streakDays >= 7) return 'happy';
    if (upcomingCount > 0) return 'thinking';
    return 'focused';
  }, [overdueCount, streakDays, upcomingCount]);

  useEffect(() => {
    if (currentMood === 'happy' || currentMood === 'thinking' || currentMood === 'focused') {
      setCurrentMood(statusMood);
    }
  }, [statusMood]);

  const launchNova = (prompt, nextMood = 'thinking') => {
    setCurrentMood(nextMood);
    onAskNova?.(prompt);
  };

  const stats = [
    { label: 'Streak', value: `${streakDays} days`, icon: Flame },
    { label: 'Upcoming', value: upcomingCount, icon: BellRing },
    { label: 'Needs attention', value: overdueCount, icon: Target }
  ];

  return (
    <section className="relative overflow-hidden px-4 py-6 md:px-6 md:py-8">
      <div className="absolute inset-0 pointer-events-none opacity-70">
        <motion.div
          className="absolute left-[10%] top-[12%] h-2 w-2 rounded-full bg-cyan-300/80 shadow-[0_0_18px_rgba(125,211,252,0.9)]"
          animate={{ opacity: [0.25, 1, 0.25], scale: [1, 1.5, 1] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute left-[78%] top-[18%] h-2 w-2 rounded-full bg-fuchsia-300/80 shadow-[0_0_18px_rgba(232,121,249,0.9)]"
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.45, 1] }}
          transition={{ duration: 4.2, repeat: Infinity, delay: 0.7 }}
        />
        <motion.div
          className="absolute left-[18%] bottom-[18%] h-2 w-2 rounded-full bg-emerald-300/80 shadow-[0_0_18px_rgba(110,231,183,0.9)]"
          animate={{ opacity: [0.25, 1, 0.25], scale: [1, 1.35, 1] }}
          transition={{ duration: 4.1, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-100">
          <Sparkles size={11} /> Wise Owl
        </div>

        <motion.div
          whileHover={{ scale: 1.03, rotate: -1 }}
          whileTap={{ scale: 0.99 }}
          onDoubleClick={() => setCurrentMood('celebrating')}
          onClick={() => setCurrentMood((prev) => (prev === 'happy' ? 'thinking' : 'happy'))}
          className="group relative cursor-pointer"
        >
          <div className={`relative h-56 w-56 rounded-[2.5rem] border border-white/10 bg-gradient-to-br ${moodData.accent} p-[1px] shadow-[0_0_60px_rgba(14,165,233,0.18)]`}>
            <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.35),rgba(255,255,255,0.08)_26%,rgba(15,23,42,0.05)_72%)]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-cyan-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(180deg,#9cdcff_0%,#6aaeff_38%,#3157d1_100%)] shadow-[0_18px_30px_rgba(15,23,42,0.22)]" />
                <div className="absolute -top-4 left-6 h-10 w-10 rounded-full bg-[linear-gradient(180deg,#93c5fd,#2563eb)] shadow-lg" />
                <div className="absolute -top-4 right-6 h-10 w-10 rounded-full bg-[linear-gradient(180deg,#93c5fd,#2563eb)] shadow-lg" />
                <div className="absolute left-1/2 top-[18%] h-[48%] w-[76%] -translate-x-1/2 rounded-[2rem] bg-[#0f172a] shadow-inner shadow-black/30" />
                <div className="absolute left-[18%] top-[39%] h-4 w-6 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
                <div className="absolute right-[18%] top-[39%] h-4 w-6 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
                <div className="absolute left-1/2 top-[48%] h-1.5 w-9 -translate-x-1/2 rounded-full bg-cyan-200/70" />
                <div className="absolute left-[2%] top-[54%] h-16 w-14 rounded-[1.4rem_0.9rem_1.8rem_1.8rem] bg-[linear-gradient(180deg,#8ed0ff,#4f87ff)] shadow-[0_10px_18px_rgba(15,23,42,0.22)]" />
                <div className="absolute right-[2%] top-[54%] h-16 w-14 rounded-[0.9rem_1.4rem_1.8rem_1.8rem] bg-[linear-gradient(180deg,#8ed0ff,#4f87ff)] shadow-[0_10px_18px_rgba(15,23,42,0.22)]" />
                <div className="absolute left-1/2 top-[70%] h-8 w-8 -translate-x-1/2 rounded-b-[1rem] rounded-t-[0.45rem] bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.55)]" />
                <div className="absolute bottom-1 left-[33%] h-4 w-4 rounded-full bg-amber-200/80 shadow-[0_0_12px_rgba(252,211,77,0.35)]" />
                <div className="absolute bottom-1 right-[33%] h-4 w-4 rounded-full bg-amber-200/80 shadow-[0_0_12px_rgba(252,211,77,0.35)]" />

                <AnimatePresence>
                  {currentMood === 'celebrating' && (
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -right-4 -top-4 rounded-full bg-yellow-300 px-2 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-yellow-950 shadow-lg"
                    >
                      +XP
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="absolute -bottom-3 left-1/2 h-20 w-40 -translate-x-1/2 rounded-[50%] bg-cyan-500/20 blur-2xl" />
            </div>
          </div>
        </motion.div>

        <div className="max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Wise Owl</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm md:text-base leading-7 text-slate-300">
            Your calm AI professor, study mentor, and magical knowledge companion. I help you study, plan, remember, and keep going.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {stats.map((item) => (
            <div key={item.label} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200">
              <item.icon size={14} className="text-cyan-300" />
              <span>{item.label}:</span>
              <span className="text-white">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-[2.25rem] border border-white/10 bg-slate-950/30 px-4 py-4 md:px-5 md:py-5 shadow-inner shadow-black/10">
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.3em] text-cyan-100">
              {moodData.label}
            </span>
            <span className="text-sm text-slate-300">{moodData.copy}</span>
            <button
              type="button"
              onClick={() => setCurrentMood('thinking')}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-200 transition-colors hover:bg-white/10"
              aria-label="Set Wise Owl mood to thinking"
            >
              <Brain size={18} />
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => launchNova(action.prompt, 'thinking')}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:border-cyan-300/30 hover:bg-white/10"
              >
                <span className="text-sm font-bold text-white">{action.label}</span>
                <ArrowRight size={16} className="text-cyan-300 transition-transform group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {accessories.map((item) => {
            const selected = accessory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAccessory(item.id)}
                className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${selected ? 'border-cyan-300/30 bg-cyan-400/10 text-white' : 'border-white/10 bg-slate-950/20 text-slate-300 hover:bg-white/10'}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-[2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <CalendarDays size={16} className="text-cyan-300" />
          <span className="font-semibold text-white">Home environment:</span>
          <span>{environmentData.label}</span>
          <span className="text-slate-500">•</span>
          <span>{environmentData.description}</span>
          <button
            type="button"
            onClick={() => setEnvironment((prev) => {
              const index = ENVIRONMENTS.findIndex((item) => item.id === prev);
              return ENVIRONMENTS[(index + 1) % ENVIRONMENTS.length].id;
            })}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/20 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-white/10"
          >
            Change scene <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
};

const BehaviorChip = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-3">
    <div className="rounded-xl bg-white/5 p-2 text-cyan-300">
      <Icon size={14} />
    </div>
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/80">{label}</p>
      <p className="mt-1 text-sm text-slate-300">{value}</p>
    </div>
  </div>
);

const RewardRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
    <span className="text-sm font-black text-white">{label}</span>
    <span className="text-sm text-slate-300">{value}</span>
  </div>
);

export default WiseOwl;