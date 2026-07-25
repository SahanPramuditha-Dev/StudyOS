import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Filter,
  Inbox,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  FileText,
  CheckSquare,
  Target,
  FolderGit2,
  ArrowUpDown,
  Sparkles,
  Layers,
  Clock,
  RotateCcw
} from 'lucide-react';
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
  if (daysLeft < 0) return { label: `${Math.abs(daysLeft)}d overdue`, cls: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40' };
  if (daysLeft === 0) return { label: 'Due today', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40' };
  if (daysLeft <= 3) return { label: `${daysLeft}d left`, cls: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/40' };
  return { label: `${daysLeft}d left`, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40' };
};

const ENTITY_CONFIG = {
  Assignment: { icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800/30', route: '/assignments' },
  Project: { icon: FolderGit2, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-800/30', route: '/projects' },
  Task: { icon: CheckSquare, color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-800/30', route: '/tasks' },
  Reminder: { icon: Clock, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/30', route: '/reminders' },
  Note: { icon: BookOpen, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800/30', route: '/notes' },
  Goal: { icon: Target, color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-800/30', route: '/goals' }
};

const ReviewHub = () => {
  const navigate = useNavigate();
  const { reminders, markReminderAsDone } = useReminders();
  const [assignments, setAssignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [projects, setProjects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [tasks, setTasks] = useStorage(STORAGE_KEYS.TASKS, []);
  const [notes, setNotes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [goalsState, setGoalsState] = useStorage(STORAGE_KEYS.GOALS, { goals: [] });
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);

  const [prefs, setPrefs] = useStorage(STORAGE_KEYS.REVIEW_PREFS, {
    dateRange: 'all',
    selectedCourse: 'all',
    searchQuery: '',
    groupBy: 'urgency',
    sortBy: 'daysLeft',
    entities: {
      Assignment: true,
      Project: true,
      Task: true,
      Reminder: true,
      Note: true,
      Goal: true
    }
  });

  const [searchQuery, setSearchQuery] = useState(prefs?.searchQuery || '');
  const [selectedCourse, setSelectedCourse] = useState(prefs?.selectedCourse || 'all');
  const [dateRange, setDateRange] = useState(prefs?.dateRange || 'all');
  const [groupBy, setGroupBy] = useState(prefs?.groupBy || 'urgency');
  const [sortBy, setSortBy] = useState(prefs?.sortBy || 'daysLeft');
  const [entityFilters, setEntityFilters] = useState(prefs?.entities || {
    Assignment: true,
    Project: true,
    Task: true,
    Reminder: true,
    Note: true,
    Goal: true
  });

  // Focus / Sweep mode state
  const [sweepModeOpen, setSweepModeOpen] = useState(false);
  const [sweepIndex, setSweepIndex] = useState(0);

  // Sync state to storage preferences
  useEffect(() => {
    setPrefs((prev) => ({
      ...prev,
      searchQuery,
      selectedCourse,
      dateRange,
      groupBy,
      sortBy,
      entities: entityFilters
    }));
  }, [searchQuery, selectedCourse, dateRange, groupBy, sortBy, entityFilters, setPrefs]);

  // Action Helpers for storage mutation
  const handleCompleteItem = useCallback((item) => {
    if (item.entity === 'Reminder') {
      markReminderAsDone(item.rawId);
    } else if (item.entity === 'Assignment') {
      setAssignments((prev) => (prev || []).map((a) => (a.id === item.rawId ? { ...a, status: 'Submitted' } : a)));
    } else if (item.entity === 'Project') {
      setProjects((prev) => (prev || []).map((p) => (p.id === item.rawId ? { ...p, status: 'Completed' } : p)));
    } else if (item.entity === 'Task') {
      setTasks((prev) => (prev || []).map((t) => (t.id === item.rawId ? { ...t, completed: true, status: 'Completed' } : t)));
    } else if (item.entity === 'Note') {
      setNotes((prev) => (prev || []).map((n) => (n.id === item.rawId ? { ...n, needsReview: false, lastReviewed: new Date().toISOString() } : n)));
    } else if (item.entity === 'Goal') {
      setGoalsState((prev) => {
        const goalsList = Array.isArray(prev) ? prev : prev?.goals || [];
        const updated = goalsList.map((g) => (g.id === item.rawId ? { ...g, completed: true, status: 'Completed' } : g));
        return Array.isArray(prev) ? updated : { ...prev, goals: updated };
      });
    }
  }, [markReminderAsDone, setAssignments, setProjects, setTasks, setNotes, setGoalsState]);

  const handleSnoozeItem = useCallback((item, days = 1) => {
    const addDays = (origDate) => {
      const d = origDate ? new Date(origDate) : new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    if (item.entity === 'Assignment') {
      setAssignments((prev) => (prev || []).map((a) => (a.id === item.rawId ? { ...a, deadline: addDays(a.deadline) } : a)));
    } else if (item.entity === 'Project') {
      setProjects((prev) => (prev || []).map((p) => (p.id === item.rawId ? { ...p, deadline: addDays(p.deadline) } : p)));
    } else if (item.entity === 'Task') {
      setTasks((prev) => (prev || []).map((t) => (t.id === item.rawId ? { ...t, dueDate: addDays(t.dueDate) } : t)));
    } else if (item.entity === 'Note') {
      setNotes((prev) => (prev || []).map((n) => (n.id === item.rawId ? { ...n, nextReviewDate: addDays(n.nextReviewDate || n.reviewDate) } : n)));
    } else if (item.entity === 'Goal') {
      setGoalsState((prev) => {
        const goalsList = Array.isArray(prev) ? prev : prev?.goals || [];
        const updated = goalsList.map((g) => (g.id === item.rawId ? { ...g, targetDate: addDays(g.targetDate || g.deadline) } : g));
        return Array.isArray(prev) ? updated : { ...prev, goals: updated };
      });
    }
  }, [setAssignments, setProjects, setTasks, setNotes, setGoalsState]);

  // Aggregate and normalize items across StudyOS modules
  const rawItems = useMemo(() => {
    const list = [];

    // 1. Assignments
    (assignments || []).forEach((a) => {
      if (a.status === 'Submitted' || a.status === 'Completed') return;
      const dt = normalizeDate(a.deadline);
      if (!dt) return;
      list.push({
        id: `assignment:${a.id}`,
        rawId: a.id,
        entity: 'Assignment',
        title: a.title || 'Untitled assignment',
        subtitle: a.subject || a.courseName || 'Coursework',
        course: a.subject || a.courseName || 'General',
        priority: a.priority || 'Medium',
        dueDate: dt,
        daysLeft: diffInDays(dt)
      });
    });

    // 2. Projects
    (projects || []).forEach((p) => {
      if (p.status === 'Completed' || p.status === 'Submitted' || p.status === 'Archived') return;
      const dt = normalizeDate(p.deadline);
      if (!dt) return;
      list.push({
        id: `project:${p.id}`,
        rawId: p.id,
        entity: 'Project',
        title: p.name || 'Untitled project',
        subtitle: p.stack || p.subject || 'Project work',
        course: p.subject || 'Projects',
        priority: p.priority || 'Medium',
        dueDate: dt,
        daysLeft: diffInDays(dt)
      });
    });

    // 3. Tasks
    (tasks || []).forEach((t) => {
      if (t.completed || t.status === 'Completed') return;
      const dt = normalizeDate(t.dueDate || t.date);
      if (!dt) return;
      list.push({
        id: `task:${t.id}`,
        rawId: t.id,
        entity: 'Task',
        title: t.title || t.text || 'Untitled task',
        subtitle: t.category || t.course || 'Task Manager',
        course: t.course || t.category || 'General',
        priority: t.priority || 'Medium',
        dueDate: dt,
        daysLeft: diffInDays(dt)
      });
    });

    // 4. Reminders
    (reminders || []).forEach((r) => {
      if (r.completed) return;
      const dt = normalizeDate(r.date);
      if (!dt) return;
      list.push({
        id: `reminder:${r.id}`,
        rawId: r.id,
        entity: 'Reminder',
        title: r.title || r.message || 'Reminder',
        subtitle: r.time ? `Scheduled for ${r.time}` : 'Scheduled reminder',
        course: 'Reminders',
        priority: 'Medium',
        dueDate: dt,
        daysLeft: diffInDays(dt)
      });
    });

    // 5. Notes (Spaced Repetition / Pending Review)
    (notes || []).forEach((n) => {
      if (!n.needsReview && !n.reviewDate && !n.nextReviewDate) return;
      const dt = normalizeDate(n.nextReviewDate || n.reviewDate || n.updatedAt);
      if (!dt) return;
      list.push({
        id: `note:${n.id}`,
        rawId: n.id,
        entity: 'Note',
        title: n.title || 'Untitled note',
        subtitle: n.folder || n.subject || 'Study Notes',
        course: n.subject || n.folder || 'Notes',
        priority: 'High',
        dueDate: dt,
        daysLeft: diffInDays(dt)
      });
    });

    // 6. Goals
    const goalsList = Array.isArray(goalsState) ? goalsState : goalsState?.goals || [];
    goalsList.forEach((g) => {
      if (g.completed || g.status === 'Completed') return;
      const dt = normalizeDate(g.targetDate || g.deadline);
      if (!dt) return;
      list.push({
        id: `goal:${g.id}`,
        rawId: g.id,
        entity: 'Goal',
        title: g.title || g.name || 'Academic Goal',
        subtitle: g.category || 'Target Milestone',
        course: g.category || 'Goals',
        priority: 'High',
        dueDate: dt,
        daysLeft: diffInDays(dt)
      });
    });

    return list;
  }, [assignments, projects, tasks, reminders, notes, goalsState]);

  // Filtered & Sorted items
  const items = useMemo(() => {
    return rawItems
      .filter((item) => {
        // Entity filter
        if (!entityFilters[item.entity]) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchSub = item.subtitle.toLowerCase().includes(q);
          const matchCourse = item.course.toLowerCase().includes(q);
          if (!matchTitle && !matchSub && !matchCourse) return false;
        }

        // Course filter
        if (selectedCourse !== 'all') {
          if (item.course.toLowerCase() !== selectedCourse.toLowerCase()) return false;
        }

        // Date range filter
        if (dateRange === 'overdue') return item.daysLeft < 0;
        if (dateRange === 'today') return item.daysLeft === 0;
        if (dateRange === '3days') return item.daysLeft >= 0 && item.daysLeft <= 3;
        if (dateRange === '7days') return item.daysLeft <= 7;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'daysLeft') return a.daysLeft - b.daysLeft;
        if (sortBy === 'priority') {
          const pOrder = { High: 1, Medium: 2, Low: 3 };
          return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
        }
        return a.title.localeCompare(b.title);
      });
  }, [rawItems, entityFilters, searchQuery, selectedCourse, dateRange, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const overdue = rawItems.filter((i) => i.daysLeft < 0).length;
    const today = rawItems.filter((i) => i.daysLeft === 0).length;
    const upcoming = rawItems.filter((i) => i.daysLeft > 0 && i.daysLeft <= 7).length;
    return { overdue, today, upcoming, total: rawItems.length };
  }, [rawItems]);

  // List of distinct courses/subjects for filter dropdown
  const courseList = useMemo(() => {
    const set = new Set();
    rawItems.forEach((i) => {
      if (i.course && i.course !== 'General') set.add(i.course);
    });
    (courses || []).forEach((c) => {
      if (c.title || c.name) set.add(c.title || c.name);
    });
    return Array.from(set);
  }, [rawItems, courses]);

  // Grouped items if enabled
  const groupedItems = useMemo(() => {
    if (groupBy === 'urgency') {
      const overdue = items.filter((i) => i.daysLeft < 0);
      const dueToday = items.filter((i) => i.daysLeft === 0);
      const upcoming = items.filter((i) => i.daysLeft > 0);
      const groups = [];
      if (overdue.length) groups.push({ title: '🚨 Overdue Items', items: overdue, color: 'text-rose-500' });
      if (dueToday.length) groups.push({ title: '⏰ Due Today', items: dueToday, color: 'text-amber-500' });
      if (upcoming.length) groups.push({ title: '📅 Upcoming Review', items: upcoming, color: 'text-emerald-500' });
      return groups;
    }

    if (groupBy === 'entity') {
      const map = {};
      items.forEach((item) => {
        if (!map[item.entity]) map[item.entity] = [];
        map[item.entity].push(item);
      });
      return Object.entries(map).map(([entity, list]) => ({
        title: `${entity}s (${list.length})`,
        items: list,
        color: 'text-primary-500'
      }));
    }

    if (groupBy === 'course') {
      const map = {};
      items.forEach((item) => {
        const c = item.course || 'Uncategorized';
        if (!map[c]) map[c] = [];
        map[c].push(item);
      });
      return Object.entries(map).map(([courseName, list]) => ({
        title: `${courseName} (${list.length})`,
        items: list,
        color: 'text-indigo-500'
      }));
    }

    return [{ title: 'All Items', items, color: 'text-slate-500' }];
  }, [items, groupBy]);

  // Keyboard navigation for Focus Sweep mode
  useEffect(() => {
    if (!sweepModeOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSweepModeOpen(false);
      else if (e.key === 'c' || e.key === 'C') {
        if (items[sweepIndex]) {
          handleCompleteItem(items[sweepIndex]);
          if (sweepIndex >= items.length - 1) {
            setSweepIndex(Math.max(0, items.length - 2));
          }
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (items[sweepIndex]) {
          handleSnoozeItem(items[sweepIndex], 1);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'n') {
        setSweepIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'p') {
        setSweepIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sweepModeOpen, sweepIndex, items, handleCompleteItem, handleSnoozeItem]);

  const toggleEntityFilter = (entity) => {
    setEntityFilters((prev) => ({ ...prev, [entity]: !prev[entity] }));
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
      {/* 1. Page Header */}
      <section className="card bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-0 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary-500/20 text-primary-400 border border-primary-500/30 backdrop-blur-md">
                <Inbox size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  Review Hub
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-primary-500/20 text-primary-300 border border-primary-500/30 uppercase tracking-widest">
                    Spaced Triage
                  </span>
                </h1>
                <p className="text-sm text-slate-300 mt-1 max-w-xl">
                  Central study command center. Triage overdue work, active recall notes, tasks, and project deadlines across StudyOS.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSweepIndex(0);
                setSweepModeOpen(true);
              }}
              disabled={items.length === 0}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-bold shadow-lg shadow-primary-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles size={18} />
              Start Focus Sweep ({items.length})
            </button>
          </div>
        </div>
      </section>

      {/* 2. Statistics Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overdue Backlog', value: stats.overdue, icon: AlertTriangle, cls: 'text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/10 border-rose-200/50 dark:border-rose-800/30' },
          { label: 'Due Today', value: stats.today, icon: Clock3, cls: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-800/30' },
          { label: 'Upcoming (7d)', value: stats.upcoming, icon: CalendarClock, cls: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-800/30' },
          { label: 'Total In Focus', value: stats.total, icon: Inbox, cls: 'text-primary-600 bg-primary-50 dark:text-primary-300 dark:bg-primary-500/10 border-primary-200/50 dark:border-primary-800/30' }
        ].map((card) => (
          <div key={card.label} className={`card flex items-center gap-4 border ${card.cls} transition-all hover:scale-[1.01]`}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/60 dark:bg-slate-900/60 shadow-sm">
              <card.icon size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-400 font-black">{card.label}</p>
              <p className="text-3xl font-black text-slate-800 dark:text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Search & Filters Bar */}
      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search items by title, subject, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Course Dropdown */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Subjects / Courses</option>
              {courseList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCourse('all');
                setDateRange('all');
                setEntityFilters({
                  Assignment: true,
                  Project: true,
                  Task: true,
                  Reminder: true,
                  Note: true,
                  Goal: true
                });
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold inline-flex items-center gap-1.5 transition-all"
            >
              <RotateCcw size={16} />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Date Range Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Pending' },
              { id: 'overdue', label: '🚨 Overdue Only' },
              { id: 'today', label: '⏰ Due Today' },
              { id: '3days', label: '3 Days' },
              { id: '7days', label: '7 Days' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateRange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  dateRange === tab.id
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grouping & Sorting */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Layers size={14} />
              Group:
            </div>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              <option value="urgency">By Urgency</option>
              <option value="entity">By Module</option>
              <option value="course">By Subject</option>
              <option value="none">Flat List</option>
            </select>

            <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 border-l border-slate-200 dark:border-slate-800">
              <ArrowUpDown size={14} />
              Sort:
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              <option value="daysLeft">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        {/* Module Entity Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1">
            <Filter size={14} /> Modules:
          </span>
          {Object.entries(ENTITY_CONFIG).map(([entityName, cfg]) => {
            const Icon = cfg.icon;
            const active = entityFilters[entityName];
            return (
              <button
                key={entityName}
                type="button"
                onClick={() => toggleEntityFilter(entityName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all border ${
                  active
                    ? `${cfg.color} font-black shadow-sm`
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <Icon size={14} />
                {entityName}s
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Content List / Grouped Sections */}
      <section className="space-y-6">
        {items.length === 0 ? (
          <div className="card text-center py-16 border-dashed border-2 border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Review Zero Reached!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                No urgent review items matched your active filters. You are completely caught up!
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDateRange('all');
                setSearchQuery('');
                setSelectedCourse('all');
                setEntityFilters({
                  Assignment: true,
                  Project: true,
                  Task: true,
                  Reminder: true,
                  Note: true,
                  Goal: true
                });
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          groupedItems.map((group) => (
            <div key={group.title} className="space-y-3">
              <h2 className={`text-base font-black uppercase tracking-wider flex items-center gap-2 ${group.color}`}>
                {group.title}
              </h2>
              <div className="space-y-3">
                {group.items.map((item) => {
                  const badge = buildBadge(item.daysLeft);
                  const cfg = ENTITY_CONFIG[item.entity] || ENTITY_CONFIG.Task;
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={item.id}
                      className="card p-4 hover:shadow-lg transition-all duration-200 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-4 min-w-[260px] flex-1">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${cfg.color} shrink-0`}>
                          <Icon size={20} />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-400">
                              {item.entity}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.course}
                            </span>
                          </div>
                          <h4 className="font-black text-slate-800 dark:text-white text-base group-hover:text-primary-500 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.subtitle}</p>
                        </div>
                      </div>

                      {/* Right side actions */}
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${badge.cls}`}>
                          {badge.label}
                        </span>

                        {/* Inline Snooze Dropdown */}
                        <div className="relative group/snooze">
                          <button
                            type="button"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1 transition-all"
                            title="Snooze deadline"
                          >
                            <Clock size={14} />
                            Snooze
                          </button>
                          <div className="absolute right-0 top-full mt-1 hidden group-hover/snooze:flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-20 min-w-[120px]">
                            <button
                              type="button"
                              onClick={() => handleSnoozeItem(item, 1)}
                              className="px-3 py-1.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                              +1 Day
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSnoozeItem(item, 3)}
                              className="px-3 py-1.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                              +3 Days
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSnoozeItem(item, 7)}
                              className="px-3 py-1.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                              +1 Week
                            </button>
                          </div>
                        </div>

                        {/* Inline Complete Action */}
                        <button
                          type="button"
                          onClick={() => handleCompleteItem(item)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                        >
                          <CheckCircle2 size={15} />
                          Complete
                        </button>

                        {/* Open Target Module */}
                        <button
                          type="button"
                          onClick={() => navigate(cfg.route)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {/* 5. Focus Sweep Mode Modal */}
      {sweepModeOpen && items.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="card max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
                  <Sparkles size={20} />
                </span>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white text-lg">Focus Sweep Triage</h3>
                  <p className="text-xs text-slate-400 font-bold">
                    Item {sweepIndex + 1} of {items.length}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSweepModeOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-indigo-500 h-full transition-all duration-300"
                style={{ width: `${((sweepIndex + 1) / items.length) * 100}%` }}
              />
            </div>

            {/* Current Item Card View */}
            {items[sweepIndex] && (() => {
              const item = items[sweepIndex];
              const cfg = ENTITY_CONFIG[item.entity] || ENTITY_CONFIG.Task;
              const Icon = cfg.icon;
              const badge = buildBadge(item.daysLeft);

              return (
                <div className="space-y-6 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black border ${cfg.color}`}>
                        <Icon size={14} className="inline mr-1" />
                        {item.entity}
                      </span>
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.course}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{item.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{item.subtitle}</p>
                  </div>

                  {/* Hotkey Guide */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap justify-between gap-2 font-mono">
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-bold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                        C
                      </kbd>{' '}
                      Complete
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-bold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                        S
                      </kbd>{' '}
                      Snooze 1d
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-bold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                        N
                      </kbd>{' '}
                      / Next
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-bold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                        Esc
                      </kbd>{' '}
                      Exit
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={sweepIndex === 0}
                        onClick={() => setSweepIndex((prev) => Math.max(0, prev - 1))}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-1 disabled:opacity-40"
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <button
                        type="button"
                        disabled={sweepIndex >= items.length - 1}
                        onClick={() => setSweepIndex((prev) => Math.min(items.length - 1, prev + 1))}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-1 disabled:opacity-40"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSnoozeItem(item, 1)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold"
                      >
                        Snooze +1d
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleCompleteItem(item);
                          if (sweepIndex >= items.length - 1) {
                            setSweepIndex(Math.max(0, items.length - 2));
                          }
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm inline-flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                      >
                        <CheckCircle2 size={18} /> Mark Completed
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewHub;
