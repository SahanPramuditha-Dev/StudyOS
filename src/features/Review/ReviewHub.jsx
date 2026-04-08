import React, { useMemo } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Filter, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { useReminders } from '../../context/ReminderContext';

const normalizeDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const diffInDays = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const buildBadge = (daysLeft) => {
  if (daysLeft < 0) return { label: `${Math.abs(daysLeft)}d overdue`, cls: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' };
  if (daysLeft === 0) return { label: 'Due today', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300' };
  if (daysLeft <= 3) return { label: `${daysLeft}d left`, cls: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300' };
  return { label: `${daysLeft}d left`, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300' };
};

const ReviewHub = () => {
  const navigate = useNavigate();
  const { reminders, markReminderAsDone } = useReminders();
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [prefs, setPrefs] = useStorage(STORAGE_KEYS.REVIEW_PREFS, {
    showOverdueOnly: false,
    includeReminders: true,
    includeAssignments: true,
    includeProjects: true
  });

  const normalizedPrefs = {
    showOverdueOnly: Boolean(prefs?.showOverdueOnly),
    includeReminders: prefs?.includeReminders !== false,
    includeAssignments: prefs?.includeAssignments !== false,
    includeProjects: prefs?.includeProjects !== false
  };

  const items = useMemo(() => {
    const merged = [];

    if (normalizedPrefs.includeAssignments) {
      assignments.forEach((a) => {
        const dt = normalizeDate(a.deadline);
        if (!dt || a.status === 'Submitted') return;
        const daysLeft = diffInDays(dt);
        merged.push({
          id: `assignment:${a.id}`,
          entity: 'Assignment',
          title: a.title || 'Untitled assignment',
          subtitle: a.subject || a.courseName || 'Coursework',
          daysLeft,
          dueDate: dt,
          onOpen: () => navigate('/assignments')
        });
      });
    }

    if (normalizedPrefs.includeProjects) {
      projects.forEach((p) => {
        const dt = normalizeDate(p.deadline);
        if (!dt || p.status === 'Completed' || p.status === 'Submitted' || p.status === 'Archived') return;
        const daysLeft = diffInDays(dt);
        merged.push({
          id: `project:${p.id}`,
          entity: 'Project',
          title: p.name || 'Untitled project',
          subtitle: p.stack || p.subject || 'Project work',
          daysLeft,
          dueDate: dt,
          onOpen: () => navigate('/projects')
        });
      });
    }

    if (normalizedPrefs.includeReminders) {
      reminders.forEach((r) => {
        const dt = normalizeDate(r.date);
        if (!dt || r.completed) return;
        const daysLeft = diffInDays(dt);
        merged.push({
          id: `reminder:${r.id}`,
          entity: 'Reminder',
          title: r.title || r.message || 'Reminder',
          subtitle: r.time ? `At ${r.time}` : 'Scheduled',
          daysLeft,
          dueDate: dt,
          isReminder: true,
          reminderId: r.id,
          onOpen: () => navigate('/reminders')
        });
      });
    }

    const filtered = normalizedPrefs.showOverdueOnly
      ? merged.filter((item) => item.daysLeft < 0)
      : merged.filter((item) => item.daysLeft <= 7);

    return filtered.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [assignments, navigate, normalizedPrefs.includeAssignments, normalizedPrefs.includeProjects, normalizedPrefs.includeReminders, normalizedPrefs.showOverdueOnly, projects, reminders]);

  const stats = useMemo(() => {
    const overdue = items.filter((i) => i.daysLeft < 0).length;
    const today = items.filter((i) => i.daysLeft === 0).length;
    const upcoming = items.filter((i) => i.daysLeft > 0).length;
    return { overdue, today, upcoming, total: items.length };
  }, [items]);

  const togglePref = (key) => {
    setPrefs((prev) => ({ ...(prev || {}), [key]: !(prev?.[key]) }));
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary-500 text-white">
                <Inbox size={24} />
              </div>
              Review Hub
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              One place to triage overdue and upcoming work across modules.
            </p>
          </div>
          <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {stats.total} items in focus
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, cls: 'text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/10' },
          { label: 'Due Today', value: stats.today, icon: Clock3, cls: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10' },
          { label: 'Upcoming', value: stats.upcoming, icon: CalendarClock, cls: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10' },
          { label: 'Total', value: stats.total, icon: Inbox, cls: 'text-primary-600 bg-primary-50 dark:text-primary-300 dark:bg-primary-500/10' }
        ].map((card) => (
          <div key={card.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.cls}`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-black">{card.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-slate-400" />
          <p className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Filters
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => togglePref('showOverdueOnly')} className={`px-3 py-1.5 rounded-xl text-sm font-bold ${normalizedPrefs.showOverdueOnly ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            Overdue only
          </button>
          <button type="button" onClick={() => togglePref('includeAssignments')} className={`px-3 py-1.5 rounded-xl text-sm font-bold ${normalizedPrefs.includeAssignments ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            Assignments
          </button>
          <button type="button" onClick={() => togglePref('includeProjects')} className={`px-3 py-1.5 rounded-xl text-sm font-bold ${normalizedPrefs.includeProjects ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            Projects
          </button>
          <button type="button" onClick={() => togglePref('includeReminders')} className={`px-3 py-1.5 rounded-xl text-sm font-bold ${normalizedPrefs.includeReminders ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            Reminders
          </button>
        </div>
      </section>

      <section className="card">
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
              <p className="font-bold text-slate-600 dark:text-slate-300">Nothing urgent right now.</p>
              <p className="text-sm text-slate-400 mt-1">Try relaxing filters or add deadlines/reminders.</p>
            </div>
          )}
          {items.map((item) => {
            const badge = buildBadge(item.daysLeft);
            return (
              <div key={item.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-1">{item.entity}</p>
                  <p className="font-black text-slate-800 dark:text-white">{item.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {item.isReminder && (
                    <button
                      type="button"
                      onClick={() => markReminderAsDone(item.reminderId)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold inline-flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} />
                      Done
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={item.onOpen}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold"
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ReviewHub;
