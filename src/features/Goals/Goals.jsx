import React, { useMemo, useState } from 'react';
import { Target, Timer, Plus, CheckCircle2 } from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';

const toDateKey = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const Goals = () => {
  const [goalsState, setGoalsState] = useStorage(STORAGE_KEYS.GOALS, {
    dailyStudyGoal: 120,
    weeklyMinutesGoal: 600,
    weeklySessionsGoal: 7,
    sessionsByDate: {}
  });
  const [sessionMinutesInput, setSessionMinutesInput] = useState(45);

  const todayKey = toDateKey();

  const normalized = useMemo(() => {
    const base = goalsState && typeof goalsState === 'object' ? goalsState : {};
    return {
      dailyStudyGoal: Math.max(30, Number(base.dailyStudyGoal) || 120),
      weeklyMinutesGoal: Math.max(120, Number(base.weeklyMinutesGoal) || 600),
      weeklySessionsGoal: Math.max(1, Number(base.weeklySessionsGoal) || 7),
      sessionsByDate:
        base.sessionsByDate && typeof base.sessionsByDate === 'object' ? base.sessionsByDate : {}
    };
  }, [goalsState]);

  const weekEntries = useMemo(() => {
    const items = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      items.push({
        date: key,
        minutes: Number(normalized.sessionsByDate[key] || 0)
      });
    }
    return items;
  }, [normalized.sessionsByDate]);

  const todayMinutes = Number(normalized.sessionsByDate[todayKey] || 0);
  const weeklyMinutes = weekEntries.reduce((acc, item) => acc + item.minutes, 0);
  const weeklySessions = weekEntries.filter((item) => item.minutes > 0).length;

  const dailyProgress = Math.min(100, Math.round((todayMinutes / normalized.dailyStudyGoal) * 100));
  const weeklyMinutesProgress = Math.min(
    100,
    Math.round((weeklyMinutes / normalized.weeklyMinutesGoal) * 100)
  );
  const weeklySessionsProgress = Math.min(
    100,
    Math.round((weeklySessions / normalized.weeklySessionsGoal) * 100)
  );

  const updateGoal = (key, value) => {
    setGoalsState((prev) => ({
      ...(prev || {}),
      [key]: value
    }));
  };

  const logSession = () => {
    const minutes = Math.max(1, Number(sessionMinutesInput) || 0);
    setGoalsState((prev) => {
      const old = prev && typeof prev === 'object' ? prev : {};
      const byDate = old.sessionsByDate && typeof old.sessionsByDate === 'object' ? old.sessionsByDate : {};
      return {
        ...old,
        sessionsByDate: {
          ...byDate,
          [todayKey]: Number(byDate[todayKey] || 0) + minutes
        }
      };
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Target className="text-primary-500" size={24} />
              Goals
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Set measurable study targets and track completion clearly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-2">Daily study goal</p>
            <input
              type="number"
              min={30}
              max={600}
              value={normalized.dailyStudyGoal}
              onChange={(e) => updateGoal('dailyStudyGoal', Math.max(30, Number(e.target.value) || 120))}
              className="w-full"
            />
          </div>
          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-2">Weekly minutes goal</p>
            <input
              type="number"
              min={120}
              max={3000}
              value={normalized.weeklyMinutesGoal}
              onChange={(e) => updateGoal('weeklyMinutesGoal', Math.max(120, Number(e.target.value) || 600))}
              className="w-full"
            />
          </div>
          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-2">Weekly active days</p>
            <input
              type="number"
              min={1}
              max={7}
              value={normalized.weeklySessionsGoal}
              onChange={(e) => updateGoal('weeklySessionsGoal', Math.max(1, Math.min(7, Number(e.target.value) || 7)))}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6">
        <div className="card">
          <h3 className="text-lg font-black dark:text-white flex items-center gap-2 mb-4">
            <Timer size={18} className="text-primary-500" />
            Log Session
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Add focused study minutes to today.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={600}
              value={sessionMinutesInput}
              onChange={(e) => setSessionMinutesInput(Number(e.target.value) || 0)}
            />
            <button
              type="button"
              onClick={logSession}
              className="px-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold inline-flex items-center gap-1"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Today: <span className="font-black">{todayMinutes} min</span>
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Daily Goal',
            subtitle: `${todayMinutes} / ${normalized.dailyStudyGoal} minutes`,
            progress: dailyProgress
          },
          {
            title: 'Weekly Minutes',
            subtitle: `${weeklyMinutes} / ${normalized.weeklyMinutesGoal} minutes`,
            progress: weeklyMinutesProgress
          },
          {
            title: 'Weekly Active Days',
            subtitle: `${weeklySessions} / ${normalized.weeklySessionsGoal} days`,
            progress: weeklySessionsProgress
          }
        ].map((card) => (
          <div key={card.title} className="card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{card.title}</h4>
              {card.progress >= 100 && <CheckCircle2 size={18} className="text-emerald-500" />}
            </div>
            <p className="text-xl font-black text-slate-800 dark:text-white mb-3">{card.subtitle}</p>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${card.progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{card.progress}% complete</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Goals;
