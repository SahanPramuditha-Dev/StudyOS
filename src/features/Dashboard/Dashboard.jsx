import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  FileText,
  Clock,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Layout as KanbanIcon,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Target,
  Activity,
  Sparkles,
  Bookmark,
  PlayCircle,
  Bot
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { generateDailyBriefing } from '../../services/aiService';
import Select from '../../components/ui/Select';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

const toDateSafe = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDayKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatRelativeTime = (value) => {
  const date = toDateSafe(value);
  if (!date) return 'Unknown time';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

const normalizeAssignmentStatus = (status) => String(status || '').trim().toLowerCase();
const isAssignmentSubmitted = (status) => {
  const normalized = normalizeAssignmentStatus(status);
  return normalized === 'submitted' || normalized === 'completed';
};

const getAssignmentDeadline = (assignment) =>
  toDateSafe(assignment?.deadline || assignment?.dueDate || null);

const clampProgress = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
};

const Dashboard = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const go = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`);
  };

  const [aiBriefing, setAiBriefing] = useState('');
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(true);

  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [streak] = useStorage(STORAGE_KEYS.STREAK, { current: 0, lastUpdate: null });
  const [globalTasks] = useStorage('studyos_global_tasks', []);
  const [reminders] = useStorage(STORAGE_KEYS.REMINDERS, []);
  const [resources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [planner] = useStorage(STORAGE_KEYS.WEEKLY_PLANNER, null);
  const [activeContextKey] = useStorage('active_workspace_context', null);
  const [timerHistory] = useStorage('timer_history', []);
  const [goalsState] = useStorage(STORAGE_KEYS.GOALS, {
    dailyStudyGoal: 120,
    weeklyMinutesGoal: 600,
    weeklySessionsGoal: 7,
    sessionsByDate: {}
  });

  const todayKey = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayStudyMinutes = Number((goalsState?.sessionsByDate || {})[todayKey] || 0);
  const dailyStudyGoal = Math.max(30, Number(goalsState?.dailyStudyGoal) || 120);
  const dailyStudyProgress = Math.min(100, Math.round((todayStudyMinutes / dailyStudyGoal) * 100));

  const todaysPlannerTasks = useMemo(() => {
    if (!planner || !planner.columns) return [];
    const d = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[d.getDay()];
    return planner.columns[todayName] || [];
  }, [planner]);

  const activeWorkspaceItem = useMemo(() => {
    if (!activeContextKey) return null;
    const [entityType, entityId] = String(activeContextKey).includes(':')
      ? String(activeContextKey).split(':')
      : ['project', activeContextKey];
      
    if (entityType === 'assignment') {
      const a = assignments.find((a) => a.id === entityId);
      return a ? { ...a, type: 'assignment' } : null;
    }
    const p = projects.find((p) => p.id === entityId);
    return p ? { ...p, type: 'project' } : null;
  }, [activeContextKey, projects, assignments]);

  const todayFocusTime = useMemo(() => {
    const today = new Date().toDateString();
    return timerHistory
      .filter(s => new Date(s.timestamp || Date.now()).toDateString() === today)
      .reduce((acc, s) => acc + (s.duration || 0), 0);
  }, [timerHistory]);

  const totalFocusTime = useMemo(() => {
    return timerHistory.reduce((acc, s) => acc + (s.duration || 0), 0);
  }, [timerHistory]);
  
  const formatTimerDuration = (seconds) => {
    if (!seconds) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const [activityTimeframe, setActivityTimeframe] = useState('7');
  const timeframeDays = useMemo(() => {
    const parsed = Number.parseInt(activityTimeframe, 10);
    return parsed === 30 ? 30 : 7;
  }, [activityTimeframe]);

  const activeTasks = useMemo(
    () => globalTasks.filter((task) => task.status === 'in_progress'),
    [globalTasks]
  );

  const completedTasks = useMemo(
    () => globalTasks.filter((task) => task.status === 'completed'),
    [globalTasks]
  );

  const sessionSecondsByDay = useMemo(() => {
    const map = {};
    videos.forEach((video) => {
      (video.playbackLogs || []).forEach((log) => {
        const start = toDateSafe(log?.startTime);
        if (!start) return;
        const key = formatDayKey(start);
        map[key] = (map[key] || 0) + Math.max(0, Number(log?.duration || 0));
      });
    });
    return map;
  }, [videos]);

  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];

    for (let i = timeframeDays - 1; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() - i);
      const key = formatDayKey(date);
      const seconds = sessionSecondsByDay[key] || 0;
      data.push({
        name:
          timeframeDays === 7
            ? date.toLocaleDateString('en-US', { weekday: 'short' })
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: Number((seconds / 3600).toFixed(2)),
        dateKey: key
      });
    }

    return data;
  }, [timeframeDays, sessionSecondsByDay]);

  const hasTrackedActivity = useMemo(
    () => chartData.some((entry) => entry.hours > 0),
    [chartData]
  );

  const submittedAssignments = useMemo(
    () => assignments.filter((assignment) => isAssignmentSubmitted(assignment.status)).length,
    [assignments]
  );

  const pendingAssignments = useMemo(
    () => assignments.filter((assignment) => !isAssignmentSubmitted(assignment.status)).length,
    [assignments]
  );

  const overdueAssignments = useMemo(() => {
    const now = Date.now();
    return assignments.filter((assignment) => {
      if (isAssignmentSubmitted(assignment.status)) return false;
      const deadline = getAssignmentDeadline(assignment);
      return deadline ? deadline.getTime() < now : false;
    }).length;
  }, [assignments]);

  const nextDeadlineAssignment = useMemo(() => {
    const now = Date.now();
    return assignments
      .filter((assignment) => !isAssignmentSubmitted(assignment.status))
      .map((assignment) => ({ assignment, deadline: getAssignmentDeadline(assignment) }))
      .filter((item) => item.deadline && item.deadline.getTime() >= now)
      .sort((left, right) => left.deadline - right.deadline)[0]?.assignment || null;
  }, [assignments]);

  const activeCourses = useMemo(
    () => courses.filter((course) => String(course.status || '').toLowerCase() === 'active').length,
    [courses]
  );

  const activeProjects = useMemo(
    () => projects.filter((project) => String(project.status || '').toLowerCase() === 'active').length,
    [projects]
  );

  // --- NEW: Project Distribution Data ---
  const projectDistributionData = useMemo(() => {
    if (projects.length === 0) return [];
    // If we have actual time tracking per project in Phase 3, we'll use that. 
    // For now, let's distribute based on the number of tasks or a baseline to make the chart look good.
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    return projects.slice(0, 5).map((p, i) => {
      // Mocking hours based on tasks or randomly for visual effect until phase 3
      const mockHours = p.board ? 
        ((p.board.todo?.length || 0) + (p.board.doing?.length || 0) * 2 + (p.board.done?.length || 0) * 3) : 
        Math.floor(Math.random() * 20) + 5;
      return {
        name: p.name || 'Untitled',
        value: mockHours,
        color: colors[i % colors.length]
      };
    });
  }, [projects]);

  const heatmapData = useMemo(() => {
    // Generate exactly 24 weeks of data (168 days) aligned to Sunday
    const data = [];
    const now = new Date();
    // To make rows match days of week (0=Sun, 1=Mon, etc.), the last cell (index 167) should be a Saturday.
    const daysToSaturday = 6 - now.getDay();
    
    for (let i = 167; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() + daysToSaturday - i);
      
      const key = formatDayKey(d);
      let level = 0;
      
      if (d <= now && sessionSecondsByDay[key]) {
        const secs = sessionSecondsByDay[key];
        if (secs > 7200) level = 4;
        else if (secs > 3600) level = 3;
        else if (secs > 1800) level = 2;
        else level = 1;
      }
      data.push({ date: d, level, key, isFuture: d > now });
    }
    return data;
  }, [sessionSecondsByDay]);


  const completedVideos = useMemo(
    () => videos.filter((video) => Boolean(video.completed)).length,
    [videos]
  );

  const stats = useMemo(
    () => [
      {
        label: 'Active Courses',
        value: activeCourses,
        icon: BookOpen,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        route: 'courses'
      },
      {
        label: 'Notes Taken',
        value: notes.length,
        icon: FileText,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        route: 'notes'
      },
      {
        label: 'Pending Assignments',
        value: pendingAssignments,
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        route: 'assignments'
      },
      {
        label: 'Submitted',
        value: submittedAssignments,
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50',
        route: 'assignments'
      },
      {
        label: 'Active Projects',
        value: activeProjects,
        icon: KanbanIcon,
        color: 'text-slate-700',
        bg: 'bg-slate-100',
        route: 'projects'
      },
      {
        label: 'Videos Watched',
        value: completedVideos,
        icon: PlayCircle,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        route: 'videos'
      },
      {
        label: 'Completed Tasks',
        value: completedTasks.length,
        icon: Target,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        route: 'tasks'
      }
    ],
    [activeCourses, notes.length, pendingAssignments, submittedAssignments, activeProjects, completedVideos, completedTasks.length]
  );

  const courseProgressScore = useMemo(() => {
    if (!courses.length) return null;
    const total = courses.reduce((acc, course) => acc + clampProgress(course.progress || 0), 0);
    return total / courses.length;
  }, [courses]);

  const assignmentCompletionScore = useMemo(() => {
    if (!assignments.length) return null;
    return (submittedAssignments / assignments.length) * 100;
  }, [assignments.length, submittedAssignments]);

  const taskCompletionScore = useMemo(() => {
    if (!globalTasks.length) return null;
    return (completedTasks.length / globalTasks.length) * 100;
  }, [completedTasks.length, globalTasks.length]);

  const videoCompletionScore = useMemo(() => {
    if (!videos.length) return null;
    return (completedVideos / videos.length) * 100;
  }, [videos.length, completedVideos]);

  const streakMomentumScore = useMemo(() => {
    const days = Number(streak?.current || 0);
    return days > 0 ? Math.min(days * 10, 100) : null;
  }, [streak?.current]);

  const efficiencyScore = useMemo(() => {
    const metrics = [
      { value: courseProgressScore, weight: 0.35 },
      { value: assignmentCompletionScore, weight: 0.25 },
      { value: taskCompletionScore, weight: 0.2 },
      { value: videoCompletionScore, weight: 0.15 },
      { value: streakMomentumScore, weight: 0.05 }
    ].filter((metric) => metric.value !== null);

    if (!metrics.length) return 0;

    const totalWeight = metrics.reduce((acc, metric) => acc + metric.weight, 0);
    const weightedSum = metrics.reduce((acc, metric) => acc + metric.value * metric.weight, 0);
    return clampProgress(weightedSum / totalWeight);
  }, [
    courseProgressScore,
    assignmentCompletionScore,
    taskCompletionScore,
    videoCompletionScore,
    streakMomentumScore
  ]);

  const recentActivities = useMemo(() => {
    const events = [];

    courses.forEach((course) => {
      const timestamp = course.updatedAt || course.createdAt;
      if (!timestamp) return;
      events.push({
        title: `Course: ${course.title || 'Untitled'}`,
        detail: `Progress ${clampProgress(course.progress || 0)}%`,
        timestamp,
        icon: BookOpen,
        color: 'bg-blue-500',
        route: 'courses'
      });
    });

    notes.forEach((note) => {
      const timestamp = note.updatedAt || note.createdAt;
      if (!timestamp) return;
      events.push({
        title: `Note: ${note.title || 'Untitled note'}`,
        detail: note.pinned ? 'Pinned' : 'Updated',
        timestamp,
        icon: FileText,
        color: 'bg-purple-500',
        route: 'notes'
      });
    });

    videos.forEach((video) => {
      const timestamp = video.lastWatched || video.updatedAt || video.addedAt;
      if (!timestamp) return;
      events.push({
        title: `Video: ${video.title || 'Untitled video'}`,
        detail: video.completed ? 'Completed' : `${clampProgress(video.progress || 0)}% watched`,
        timestamp,
        icon: Clock,
        color: 'bg-teal-500',
        route: 'videos'
      });
    });

    projects.forEach((project) => {
      const timestamp = project.updatedAt || project.createdAt;
      if (!timestamp) return;
      events.push({
        title: `Project: ${project.name || 'Untitled project'}`,
        detail: project.status || 'Updated',
        timestamp,
        icon: KanbanIcon,
        color: 'bg-slate-700',
        route: 'projects'
      });
    });

    assignments.forEach((assignment) => {
      const timestamp = assignment.updatedAt || assignment.createdAt;
      if (!timestamp) return;
      events.push({
        title: `Assignment: ${assignment.title || 'Untitled assignment'}`,
        detail: assignment.status || 'Updated',
        timestamp,
        icon: AlertCircle,
        color: 'bg-amber-500',
        route: 'assignments'
      });
    });

    globalTasks.forEach((task) => {
      const timestamp = task.updatedAt || task.createdAt;
      if (!timestamp) return;
      events.push({
        title: `Task: ${task.title || 'Untitled task'}`,
        detail: task.status === 'completed' ? 'Completed' : 'In workflow',
        timestamp,
        icon: Target,
        color: 'bg-indigo-500',
        route: 'tasks'
      });
    });

    resources.forEach((resource) => {
      const timestamp = resource.updatedAt || resource.createdAt || resource.addedAt;
      if (!timestamp) return;
      events.push({
        title: `Resource: ${resource.title || 'Untitled resource'}`,
        detail: resource.type || 'Link',
        timestamp,
        icon: Bookmark,
        color: 'bg-cyan-500',
        route: 'resources'
      });
    });

    return events
      .sort((left, right) => (toDateSafe(right.timestamp)?.getTime() || 0) - (toDateSafe(left.timestamp)?.getTime() || 0))
      .slice(0, 6);
  }, [courses, notes, videos, projects, assignments, globalTasks, resources]);

  const todayFocus = useMemo(
    () => courses.find((course) => String(course.status || '').toLowerCase() === 'active') || courses[0] || null,
    [courses]
  );

  const hasAnyDashboardData =
    courses.length > 0 ||
    notes.length > 0 ||
    videos.length > 0 ||
    projects.length > 0 ||
    assignments.length > 0 ||
    globalTasks.length > 0 ||
    reminders.length > 0;

  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return reminders.filter((reminder) => {
      if (!reminder || reminder.completed || reminder.enabled === false) return false;
      const target = toDateSafe(`${reminder.date}T${reminder.time || '00:00'}`);
      return target ? target.getTime() >= now : false;
    }).length;
  }, [reminders]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchBriefing = async () => {
      try {
        const contextData = {
          overdueAssignments,
          pendingAssignments,
          activeProjects,
          dailyStudyGoal,
          todayStudyMinutes,
          upcomingRemindersCount: upcomingCount
        };
        const briefing = await generateDailyBriefing(contextData);
        if (isMounted) {
          setAiBriefing(briefing);
          setIsLoadingBriefing(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setIsLoadingBriefing(false);
      }
    };
    fetchBriefing();
    return () => { isMounted = false; };
  }, [overdueAssignments, pendingAssignments, activeProjects, dailyStudyGoal, todayStudyMinutes, upcomingCount]);

  return (
    <div className="space-y-10 w-full max-w-[1680px] mx-auto pb-12 pt-4">
      {/* AI Daily Briefing Banner */}
      {!isLoadingBriefing && aiBriefing && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-4 flex items-start gap-4"
        >
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex-shrink-0">
            <Bot className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm mb-1 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500" />
              AI Daily Briefing
            </h3>
            <p className="text-indigo-800 dark:text-indigo-300 text-sm leading-relaxed">
              {aiBriefing}
            </p>
          </div>
        </motion.div>
      )}

      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-600 to-accent-600 dark:from-slate-900 dark:to-primary-900 p-8 md:p-10 xl:p-16 text-white shadow-2xl shadow-primary-500/20 transition-all duration-500">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 xl:gap-16">
          <div className="space-y-6 xl:space-y-8 text-center lg:text-left flex-1">
            <div className="space-y-3">
              <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-tight">
                Ready for a <br />
                <span className="text-primary-200">breakthrough?</span>
              </h2>
              <p className="text-primary-100/90 max-w-xl text-lg xl:text-xl font-medium leading-relaxed">
                Track your progress, manage your courses, and master your learning journey all in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 xl:gap-5 justify-center lg:justify-start pt-2 xl:pt-4">
              <button
                onClick={() => go('workspace')}
                className="px-6 py-3 xl:px-8 xl:py-4 rounded-2xl bg-white text-primary-600 font-bold hover:bg-primary-50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-500/10 flex items-center gap-2 group"
              >
                <Plus size={24} />
                Create Study Plan
                <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
              <button
                onClick={() => go('review')}
                className="px-6 py-3 xl:px-8 xl:py-4 rounded-2xl bg-primary-500/20 backdrop-blur-2xl border border-white/20 text-white font-bold hover:bg-primary-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <TrendingUp size={24} />
                Open Review Hub
              </button>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-8 xl:gap-12 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-8 xl:p-12 border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="text-5xl xl:text-6xl font-black mb-2 drop-shadow-lg tabular-nums">{efficiencyScore}%</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-200/80">
                Efficiency Score
              </div>
            </div>
            <div className="w-px h-20 bg-white/10"></div>
            <div className="text-center">
              <div className="text-5xl xl:text-6xl font-black mb-2 drop-shadow-lg tabular-nums">{courses.length}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-200/80">
                Total Courses
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[40rem] h-[40rem] bg-white/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10s]"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-accent-400/20 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8s]"></div>
      </section>

      {!hasAnyDashboardData && (
        <section className="card border-none bg-gradient-to-br from-primary-50 to-accent-50 dark:from-slate-900 dark:to-primary-900/40">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="text-primary-500" size={24} />
                Let&apos;s set up your dashboard
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                Start with one course, one note, and one assignment to unlock personalized insights.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => go('courses')} className="px-5 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors">
                Add First Course
              </button>
              <button onClick={() => go('notes')} className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold">
                Create First Note
              </button>
              <button onClick={() => go('assignments')} className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold">
                Add Assignment
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
              <Activity className="text-primary-500" size={22} />
              Today At A Glance
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">Focus on what matters next.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => go('assignments')} className="px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold text-sm">
              Review Deadlines
            </button>
            <button onClick={() => go('timer')} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm">
              Start Focus Session
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-900/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Deadline</p>
            {nextDeadlineAssignment ? (
              <>
                <p className="mt-2 font-black text-slate-800 dark:text-white truncate">
                  {nextDeadlineAssignment.title || 'Untitled Assignment'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {getAssignmentDeadline(nextDeadlineAssignment)?.toLocaleString() || 'Date unavailable'}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No upcoming deadlines.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-900/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overdue Items</p>
            <p className="mt-2 text-3xl font-black text-rose-500 tabular-nums">{overdueAssignments}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Assignments needing attention now.</p>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-900/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">In Progress</p>
            <p className="mt-2 text-3xl font-black text-primary-500 tabular-nums">{activeTasks.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tasks in motion • {upcomingCount} upcoming reminders
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-900/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Focus Time</p>
            <p className="mt-2 text-3xl font-black text-emerald-500 tabular-nums">{formatTimerDuration(todayFocusTime)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Today • {formatTimerDuration(totalFocusTime)} Total</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => stat.route && go(stat.route)}
            className={`card group hover:-translate-y-1 w-full ${stat.route ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} dark:bg-slate-800 flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className={stat.color} size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card border-none bg-transparent shadow-none p-0">
        <div className="flex items-center gap-2 mb-4 px-2">
          <KanbanIcon className="text-accent-500" size={20} />
          <h3 className="text-lg font-bold dark:text-white">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          <button onClick={() => go('courses')} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-center group border border-slate-100 dark:border-slate-700/50">
            <Plus size={18} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 group-hover:text-primary-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">New Course</p>
          </button>
          <button onClick={() => go('notes')} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-accent-50 dark:hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400 transition-colors text-center group border border-slate-100 dark:border-slate-700/50">
            <FileText size={18} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 group-hover:text-accent-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">New Note</p>
          </button>
          <button onClick={() => go('timer')} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-center group border border-slate-100 dark:border-slate-700/50">
            <Clock size={18} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 group-hover:text-orange-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Timer</p>
          </button>
          <button onClick={() => go('assignments')} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-center group border border-slate-100 dark:border-slate-700/50">
            <FileText size={18} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 group-hover:text-amber-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Assignments</p>
          </button>
          <button onClick={() => go('analytics')} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-center group border border-slate-100 dark:border-slate-700/50">
            <TrendingUp size={18} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 group-hover:text-teal-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Analytics</p>
          </button>
          <button onClick={() => go('goals')} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-center group border border-slate-100 dark:border-slate-700/50">
            <Target size={18} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Goals</p>
          </button>
          <button onClick={() => go('planner')} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-center group border border-slate-100 dark:border-slate-700/50">
            <Calendar size={18} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Planner</p>
          </button>
          <button onClick={() => go('review')} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-center group border border-slate-100 dark:border-slate-700/50">
            <AlertCircle size={18} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 group-hover:text-rose-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Review Hub</p>
          </button>
          <button onClick={() => go('resources')} className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-center group border border-slate-100 dark:border-slate-700/50">
            <Bookmark size={18} className="mx-auto mb-2 text-slate-400 dark:text-slate-500 group-hover:text-cyan-500" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Resources</p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Metrics */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card overflow-hidden">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Efficiency Score</h3>
            <div className="flex flex-col items-center text-center py-4">
              <div className="relative w-40 h-40 mb-4 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="440"
                    strokeDashoffset={440 - (440 * efficiencyScore) / 100}
                    className="text-primary-500 transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black dark:text-white">{efficiencyScore}</span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Built from progress, completion rates, and streak momentum.
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
              <Target className="text-emerald-500" size={20} />
              Daily Study Goal
            </h3>
            <div className="flex flex-col items-center text-center py-4">
              <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="339.29"
                    strokeDashoffset={339.29 - (339.29 * dailyStudyProgress) / 100}
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black dark:text-white">{todayStudyMinutes}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">MINS</span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {dailyStudyProgress}% of {dailyStudyGoal} mins goal
              </p>
            </div>
          </div>
        </div>

        {/* Center Column - Activity */}
        <div className="lg:col-span-6 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                  <TrendingUp className="text-primary-500" size={24} />
                  Learning Activity
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Real tracked watch sessions for the last {timeframeDays} days
                </p>
              </div>
              <Select
                variant="ghost"
                value={activityTimeframe}
                onChange={(val) => setActivityTimeframe(val)}
                options={[
                  { label: 'Last 7 days', value: '7' },
                  { label: 'Last 30 days', value: '30' }
                ]}
              />
            </div>
            
            {/* NEW: Activity Heatmap */}
            <div className="mb-8">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Contribution Heatmap</h4>
              <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex flex-col gap-2 text-[11px] font-bold text-slate-400 pr-3">
                  {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                    <div key={i} className="h-5 flex items-center justify-end">{label}</div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {/* Group into columns (weeks) */}
                  {Array.from({ length: 24 }).map((_, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-2">
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const dayData = heatmapData[weekIndex * 7 + dayIndex];
                        if (!dayData) return null;
                        
                        const colorClass = 
                          dayData.level === 0 ? 'bg-slate-100 dark:bg-slate-800' :
                          dayData.level === 1 ? 'bg-primary-200 dark:bg-primary-900/50' :
                          dayData.level === 2 ? 'bg-primary-300 dark:bg-primary-700/60' :
                          dayData.level === 3 ? 'bg-primary-400 dark:bg-primary-500' :
                          'bg-primary-500 dark:bg-primary-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]';

                        return (
                          <div 
                            key={dayData.key} 
                            className={`w-5 h-5 rounded-md ${dayData.isFuture ? 'bg-transparent' : colorClass} ${dayData.isFuture ? '' : 'transition-colors hover:ring-2 ring-primary-500/50'}`}
                            title={dayData.isFuture ? undefined : `${dayData.date.toLocaleDateString()}: Level ${dayData.level}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Productivity Bar Chart</h4>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                    contentStyle={{
                      borderRadius: '1rem',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'transparent'
                    }}
                    itemStyle={{ color: 'inherit' }}
                    labelStyle={{ color: 'inherit' }}
                    wrapperClassName="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700"
                    formatter={(value) => [`${Number(value).toFixed(2)} hours`, 'Tracked']}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 6, 6]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.dateKey} className="fill-primary-500 dark:fill-primary-400 hover:fill-primary-600 transition-all" />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            {!hasTrackedActivity && (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-5 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No tracked watch sessions yet. Start a video session to populate this chart.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Action & Focus */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card bg-slate-900 text-white border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
              <Clock className="text-primary-400" size={20} />
              Today&apos;s Focus
            </h3>
            <div className="space-y-4 relative z-10">
              {todayFocus ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-sm font-bold text-white mb-1">{todayFocus.title}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Progress</span>
                    <span>{clampProgress(todayFocus.progress || 0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${clampProgress(todayFocus.progress || 0)}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center backdrop-blur-sm">
                  <p className="text-sm text-slate-400">No active courses. Add one to start tracking!</p>
                </div>
              )}
              <button onClick={() => go('videos')} className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 transition-colors font-bold text-sm shadow-lg shadow-primary-500/20">
                Start Session
              </button>
            </div>
          </div>

          <div className="card border-none bg-slate-50 dark:bg-slate-900 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Calendar className="text-indigo-500" size={20} />
                Today's Agenda
              </h3>
              <button onClick={() => go('planner')} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">
                View Planner
              </button>
            </div>
            <div className="space-y-3">
              {todaysPlannerTasks.length > 0 ? (
                todaysPlannerTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${task.done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {task.done && <CheckCircle2 size={12} className="text-white mx-auto mt-[-1px]" />}
                    </div>
                    <p className={`text-sm font-medium ${task.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                      {task.title}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No tasks scheduled for today.</p>
                </div>
              )}
            </div>
          </div>

          {activeWorkspaceItem && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                <Activity className="text-purple-500" size={20} />
                Active Workspace
              </h3>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 text-center">
                <p className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-1">
                  {activeWorkspaceItem.type === 'project' ? 'Project' : 'Assignment'}
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-4 line-clamp-1">
                  {activeWorkspaceItem.title || activeWorkspaceItem.name}
                </p>
                <button
                  onClick={() => go('workspace')}
                  className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-lg shadow-purple-600/20"
                >
                  Enter Workspace
                </button>
              </div>
            </div>
          )}

          {activeTasks.length > 0 && (
            <div className="card border-none bg-gradient-to-br from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20 shadow-inner">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-accent-700 dark:text-accent-400">
                <Target size={20} />
                Resume Work
              </h3>
              <div className="space-y-3">
                {activeTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800 backdrop-blur-sm group hover:border-accent-300 dark:hover:border-accent-700 transition-colors cursor-pointer shadow-sm"
                    onClick={() => go('tasks')}
                  >
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{task.title}</p>
                    <div className="flex justify-between items-end mt-2">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        Last: {task.lastPosition || 'Not started'}
                      </p>
                      <span className="text-[10px] font-black text-accent-600 dark:text-accent-400">
                        {clampProgress(task.progress || 0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => go('tasks')}
                className="w-full mt-4 py-2 text-xs font-bold text-accent-600 dark:text-accent-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                View all tasks
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row - Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* NEW: Project Time Distribution (Donut Chart) */}
        <div className="card h-full">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
            <KanbanIcon className="text-purple-500" size={20} />
            Project Time Distribution
          </h3>
          {projectDistributionData.length > 0 ? (
            <div className="h-72 w-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={projectDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={8}
                  >
                    {projectDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} hrs`, 'Time Spent']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text for Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                <span className="text-3xl font-black text-slate-800 dark:text-white">
                  {projectDistributionData.reduce((acc, item) => acc + item.value, 0)}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Hrs</span>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
              No active projects to display.
            </div>
          )}
        </div>

        <div className="card h-full">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
            <Clock className="text-orange-500" size={20} />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={`${activity.title}-${activity.timestamp}`} className="flex gap-3">
                <div className={`w-1 h-10 rounded-full ${activity.color}`}></div>
                <div>
                  <p className="text-sm font-bold dark:text-slate-200">{activity.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {activity.detail} • {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No recent activity found. Start by creating your first item.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
