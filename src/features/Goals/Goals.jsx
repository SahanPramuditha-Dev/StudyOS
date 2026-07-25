import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Timer, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  Trash2, 
  Flame, 
  BookOpen, 
  GraduationCap, 
  CheckCircle, 
  Circle,
  Clock,
  Calendar,
  Search,
  BarChart3,
  X,
  Settings
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  Cell 
} from 'recharts';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { refineSMARTGoal } from '../../services/aiService';
import toast from 'react-hot-toast';

const toDateKey = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const CATEGORIES = ['All', 'SMART Goals', 'Academic Targets', 'Study Habits', 'Completed'];

const Goals = () => {
  const [goalsState, setGoalsState] = useStorage(STORAGE_KEYS.GOALS, {
    dailyStudyGoal: 120,
    weeklyMinutesGoal: 600,
    weeklySessionsGoal: 7,
    sessionsByDate: {},
    smartGoalText: '',
    activeGoals: [],
    academicGoals: []
  });

  const [streak] = useStorage(STORAGE_KEYS.STREAK, { current: 0, lastUpdate: null });

  // UI state
  const [vagueGoalInput, setVagueGoalInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // New goal form state
  const [newGoalForm, setNewGoalForm] = useState({
    title: '',
    category: 'General',
    priority: 'Medium',
    targetMinutes: 60,
  });

  const todayKey = toDateKey();

  // Normalize structure & handle legacy data
  const normalized = useMemo(() => {
    const base = goalsState && typeof goalsState === 'object' ? goalsState : {};
    
    let activeGoals = Array.isArray(base.activeGoals) ? [...base.activeGoals] : [];
    if (base.smartGoalText && base.smartGoalText.trim()) {
      const exists = activeGoals.some(g => g.title === base.smartGoalText);
      if (!exists) {
        activeGoals.unshift({
          id: 'legacy-goal-' + Date.now(),
          title: base.smartGoalText,
          category: 'SMART',
          priority: 'High',
          completed: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    return {
      dailyStudyGoal: Math.max(30, Number(base.dailyStudyGoal) || 120),
      weeklyMinutesGoal: Math.max(120, Number(base.weeklyMinutesGoal) || 600),
      weeklySessionsGoal: Math.max(1, Number(base.weeklySessionsGoal) || 7),
      sessionsByDate: base.sessionsByDate && typeof base.sessionsByDate === 'object' ? base.sessionsByDate : {},
      activeGoals,
      academicGoals: Array.isArray(base.academicGoals) ? base.academicGoals : []
    };
  }, [goalsState]);

  // 7-day study activity breakdown for Recharts
  const weekEntries = useMemo(() => {
    const items = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      items.push({
        name: days[d.getDay()],
        date: key,
        minutes: Number(normalized.sessionsByDate[key] || 0),
        isToday: key === todayKey
      });
    }
    return items;
  }, [normalized.sessionsByDate, todayKey]);

  const todayMinutes = Number(normalized.sessionsByDate[todayKey] || 0);
  const weeklyMinutes = weekEntries.reduce((acc, item) => acc + item.minutes, 0);
  const weeklySessions = weekEntries.filter((item) => item.minutes > 0).length;
  const avgDailyMinutes = Math.round(weeklyMinutes / 7);

  const dailyProgress = Math.min(100, Math.round((todayMinutes / normalized.dailyStudyGoal) * 100));
  const weeklyMinutesProgress = Math.min(
    100,
    Math.round((weeklyMinutes / normalized.weeklyMinutesGoal) * 100)
  );

  const updateTargets = (daily, weeklyMins, weeklyDays) => {
    setGoalsState(prev => ({
      ...(prev || {}),
      dailyStudyGoal: daily,
      weeklyMinutesGoal: weeklyMins,
      weeklySessionsGoal: weeklyDays
    }));
    toast.success('Targets updated successfully!');
  };

  const logSession = (minutes) => {
    const mins = Math.max(1, Number(minutes) || 0);
    setGoalsState((prev) => {
      const old = prev && typeof prev === 'object' ? prev : {};
      const byDate = old.sessionsByDate && typeof old.sessionsByDate === 'object' ? old.sessionsByDate : {};
      return {
        ...old,
        sessionsByDate: {
          ...byDate,
          [todayKey]: Number(byDate[todayKey] || 0) + mins
        }
      };
    });
    toast.success(`Logged ${mins} minutes focus time!`);
  };

  const handleSMARTGoal = async () => {
    if (!vagueGoalInput.trim()) return;
    setIsRefining(true);
    try {
      const result = await refineSMARTGoal(vagueGoalInput);
      
      const newGoal = {
        id: Date.now().toString(),
        title: result.smartGoal,
        category: 'SMART',
        priority: 'High',
        completed: false,
        createdAt: new Date().toISOString()
      };

      setGoalsState(prev => {
        const old = prev && typeof prev === 'object' ? prev : {};
        const oldActive = Array.isArray(old.activeGoals) ? old.activeGoals : [];
        return {
          ...old,
          smartGoalText: '',
          activeGoals: [newGoal, ...oldActive],
          dailyStudyGoal: result.dailyStudyGoal || old.dailyStudyGoal,
          weeklyMinutesGoal: result.weeklyMinutesGoal || old.weeklyMinutesGoal,
          weeklySessionsGoal: result.weeklySessionsGoal || old.weeklySessionsGoal
        };
      });
      setVagueGoalInput('');
      toast.success('AI refined SMART goal added!');
    } catch (error) {
      toast.error('Failed to generate SMART goal');
    } finally {
      setIsRefining(false);
    }
  };

  const handleCreateManualGoal = (e) => {
    e.preventDefault();
    if (!newGoalForm.title.trim()) return;

    const goalObj = {
      id: Date.now().toString(),
      title: newGoalForm.title.trim(),
      category: newGoalForm.category,
      priority: newGoalForm.priority,
      targetMinutes: Number(newGoalForm.targetMinutes) || 60,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setGoalsState(prev => {
      const old = prev && typeof prev === 'object' ? prev : {};
      const list = Array.isArray(old.activeGoals) ? old.activeGoals : [];
      return { ...old, activeGoals: [goalObj, ...list] };
    });

    setNewGoalForm({ title: '', category: 'General', priority: 'Medium', targetMinutes: 60 });
    setIsAddModalOpen(false);
    toast.success('Goal created successfully!');
  };

  const toggleGoalCompletion = (id) => {
    setGoalsState(prev => {
      const old = prev && typeof prev === 'object' ? prev : {};
      const list = Array.isArray(old.activeGoals) ? old.activeGoals : [];
      return {
        ...old,
        activeGoals: list.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
      };
    });
  };

  const deleteGoal = (id) => {
    setGoalsState(prev => {
      const old = prev && typeof prev === 'object' ? prev : {};
      const list = Array.isArray(old.activeGoals) ? old.activeGoals : [];
      return {
        ...old,
        activeGoals: list.filter(g => g.id !== id)
      };
    });
    toast.success('Goal deleted');
  };

  // Filtered goals array
  const filteredGoals = useMemo(() => {
    let combined = [];

    normalized.activeGoals.forEach(g => {
      combined.push({
        ...g,
        type: 'custom',
        displayCategory: g.category || 'General'
      });
    });

    normalized.academicGoals.forEach(ag => {
      const progress = ag.targetValue > 0 ? Math.min(100, Math.round((ag.currentValue / ag.targetValue) * 100)) : 0;
      combined.push({
        id: ag.id,
        title: ag.title,
        type: 'academic',
        displayCategory: 'Academic Targets',
        priority: 'High',
        completed: progress >= 100,
        currentValue: ag.currentValue,
        targetValue: ag.targetValue,
        progress,
        createdAt: ag.createdAt
      });
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(g => g.title.toLowerCase().includes(q));
    }

    if (selectedCategory === 'SMART Goals') {
      combined = combined.filter(g => g.displayCategory === 'SMART');
    } else if (selectedCategory === 'Academic Targets') {
      combined = combined.filter(g => g.type === 'academic' || g.displayCategory === 'Academic Targets');
    } else if (selectedCategory === 'Study Habits') {
      combined = combined.filter(g => g.displayCategory === 'Habit');
    } else if (selectedCategory === 'Completed') {
      combined = combined.filter(g => g.completed);
    }

    return combined;
  }, [normalized.activeGoals, normalized.academicGoals, searchQuery, selectedCategory]);

  const statCards = [
    {
      label: 'DAILY GOAL',
      value: `${dailyProgress}%`,
      detail: `${todayMinutes}/${normalized.dailyStudyGoal} mins`,
      icon: Target,
      color: 'text-sky-500',
      bg: 'bg-sky-50 dark:bg-sky-500/10'
    },
    {
      label: 'WEEKLY TARGET',
      value: `${weeklyMinutesProgress}%`,
      detail: `${weeklyMinutes}/${normalized.weeklyMinutesGoal} mins`,
      icon: Clock,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10'
    },
    {
      label: 'ACTIVE DAYS',
      value: `${weeklySessions}/${normalized.weeklySessionsGoal}`,
      detail: 'Days active this week',
      icon: Calendar,
      color: 'text-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-500/10'
    },
    {
      label: 'STUDY STREAK',
      value: `${streak?.current || 0} Days`,
      detail: 'Daily momentum',
      icon: Flame,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10'
    },
    {
      label: 'GOALS DONE',
      value: `${normalized.activeGoals.filter(g => g.completed).length}/${normalized.activeGoals.length}`,
      detail: 'Completed items',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10'
    }
  ];

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
            <div className="p-3 rounded-[1.5rem] bg-sky-500 text-white shadow-xl shadow-sky-500/20">
              <Target size={32} />
            </div>
            Study Goals & Focus
          </h1>
          <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs">
            Behavioral targets & AI goal refinement engine
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
          {streak?.current > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-2xl">
              <Flame className="text-amber-500 fill-amber-500 animate-pulse" size={18} />
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {streak.current} Day Streak
              </span>
            </div>
          )}

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 rounded-2xl transition-all shadow-sm flex items-center justify-center"
            title="Configure Target Goals"
          >
            <Settings size={20} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95"
          >
            <Plus size={18} />
            Add Goal
          </button>
        </div>
      </div>

      {/* 2. Top Statistics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-1 transition-all duration-300 group flex items-center gap-5"
          >
            <div className={`w-16 h-16 rounded-[1.5rem] ${stat.bg} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0`}>
              <stat.icon className={stat.color} size={30} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">
                {stat.label}
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{stat.value}</h3>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-wider">{stat.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. AI SMART Goal Builder Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/20">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={12} className="text-amber-300" />
              AI SMART Goal Engine
            </div>
            <h2 className="text-2xl md:text-3xl font-black">Refine Vague Ideas into SMART Goals</h2>
            <p className="text-indigo-100 text-xs md:text-sm font-medium">
              Type what you want to learn. Our AI will automatically construct a Specific, Measurable, and Achievable roadmap.
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 min-w-[360px]">
            <input 
              type="text" 
              placeholder="E.g., Learn React & build a portfolio site" 
              value={vagueGoalInput}
              onChange={(e) => setVagueGoalInput(e.target.value)}
              className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-indigo-200 text-sm py-3 px-4 rounded-2xl outline-none focus:ring-2 focus:ring-white/40"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSMARTGoal(); }}
            />
            <button 
              onClick={handleSMARTGoal}
              disabled={isRefining || !vagueGoalInput.trim()}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-indigo-900 font-black rounded-2xl text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shrink-0"
            >
              {isRefining ? 'Refining...' : 'Make it SMART'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Weekly Study Activity Chart & Quick Log Panel (Recharts Upgrade) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <BarChart3 size={24} className="text-sky-500" />
              Weekly Study Activity & Focus Log
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Target: {normalized.dailyStudyGoal}m / day
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-bold text-sky-500 uppercase tracking-wider">
                Weekly Total: {weeklyMinutes}m
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
                Daily Avg: {avgDailyMinutes}m
              </span>
            </div>
          </div>

          {/* Quick Log Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline">Quick Log:</span>
            {[15, 30, 60].map(mins => (
              <button
                key={mins}
                onClick={() => logSession(mins)}
                className="px-3.5 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 rounded-xl text-xs font-black transition-all active:scale-95"
              >
                +{mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Premium Recharts Visualization */}
        <div className="h-60 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={weekEntries} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goalBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="goalBarCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={({ x, y, payload }) => {
                  const item = weekEntries[payload.index];
                  return (
                    <text x={x} y={y + 15} textAnchor="middle" fill={item?.isToday ? '#0ea5e9' : '#94a3b8'} fontSize={12} fontWeight={800}>
                      {payload.value}
                    </text>
                  );
                }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                unit="m"
              />
              <Tooltip 
                cursor={{ fill: 'rgba(14, 165, 233, 0.06)', radius: 12 }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xl space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{data.date} ({data.name})</p>
                      <p className="text-sm font-black text-sky-500">{data.minutes} Minutes Studied</p>
                      {data.minutes >= normalized.dailyStudyGoal && (
                        <span className="inline-block text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Target Reached! 🎉
                        </span>
                      )}
                    </div>
                  );
                }}
              />
              <ReferenceLine 
                y={normalized.dailyStudyGoal} 
                stroke="#0ea5e9" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ 
                  value: `Daily Target: ${normalized.dailyStudyGoal}m`, 
                  fill: '#0ea5e9', 
                  fontSize: 11, 
                  fontWeight: 800,
                  position: 'top' 
                }} 
              />
              <Bar 
                dataKey="minutes" 
                radius={[12, 12, 4, 4]} 
                barSize={36}
                minPointSize={6}
                animationDuration={1000}
              >
                {weekEntries.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.minutes >= normalized.dailyStudyGoal ? 'url(#goalBarCompleted)' : 'url(#goalBarGradient)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Main Goals Directory (Filter Bar + List) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
        
        {/* Search & Tabs Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Goals List Feed */}
        {filteredGoals.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
            <Target size={44} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 text-base font-black">No matching goals found.</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Click "Add Goal" or use the AI builder to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredGoals.map((goal) => (
                <motion.div 
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    goal.completed 
                      ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800 opacity-60' 
                      : 'bg-white dark:bg-slate-950/40 border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                      {goal.type === 'custom' ? (
                        <button 
                          onClick={() => toggleGoalCompletion(goal.id)}
                          className="mt-0.5 text-slate-400 hover:text-sky-500 transition-colors"
                        >
                          {goal.completed ? (
                            <CheckCircle className="text-emerald-500 fill-emerald-500/10" size={22} />
                          ) : (
                            <Circle size={22} />
                          )}
                        </button>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center shrink-0">
                          <GraduationCap size={18} />
                        </div>
                      )}
                      
                      <div>
                        <h4 className={`font-black text-sm text-slate-800 dark:text-slate-200 leading-snug ${
                          goal.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}>
                          {goal.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {goal.displayCategory}
                          </span>
                          {goal.priority && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              goal.priority === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'
                            }`}>
                              {goal.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {goal.type === 'custom' && (
                      <button 
                        onClick={() => deleteGoal(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {goal.type === 'academic' && (
                    <div className="space-y-1.5 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex justify-between text-xs font-black text-slate-500">
                        <span>Progress: {goal.currentValue} / {goal.targetValue}</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${goal.progress}%` }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 6. Add Goal Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setIsAddModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Target size={22} className="text-sky-500" />
                  Add Custom Goal
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateManualGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Goal Title</label>
                  <input
                    required
                    type="text"
                    placeholder="E.g., Complete Physics Chapter 4"
                    value={newGoalForm.title}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:border-sky-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                    <select
                      value={newGoalForm.category}
                      onChange={(e) => setNewGoalForm({ ...newGoalForm, category: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:border-sky-500 text-sm"
                    >
                      <option value="General">General</option>
                      <option value="Habit">Study Habit</option>
                      <option value="Exam Prep">Exam Prep</option>
                      <option value="Project">Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                    <select
                      value={newGoalForm.priority}
                      onChange={(e) => setNewGoalForm({ ...newGoalForm, priority: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:border-sky-500 text-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95 mt-2"
                >
                  Create Goal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setIsSettingsModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Settings size={22} className="text-sky-500" />
                  Target Settings
                </h3>
                <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Daily Study Target (minutes)</label>
                  <input
                    type="number"
                    min={30}
                    max={600}
                    value={normalized.dailyStudyGoal}
                    onChange={(e) => updateTargets(Math.max(30, Number(e.target.value) || 120), normalized.weeklyMinutesGoal, normalized.weeklySessionsGoal)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:border-sky-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Weekly Minutes Target</label>
                  <input
                    type="number"
                    min={120}
                    max={3000}
                    value={normalized.weeklyMinutesGoal}
                    onChange={(e) => updateTargets(normalized.dailyStudyGoal, Math.max(120, Number(e.target.value) || 600), normalized.weeklySessionsGoal)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:border-sky-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Weekly Active Days Target</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={normalized.weeklySessionsGoal}
                    onChange={(e) => updateTargets(normalized.dailyStudyGoal, normalized.weeklyMinutesGoal, Math.max(1, Math.min(7, Number(e.target.value) || 7)))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:border-sky-500 text-sm"
                  />
                </div>

                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95 mt-2"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Goals;
