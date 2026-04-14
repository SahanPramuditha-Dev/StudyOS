import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import posthog from 'posthog-js';
import { Bell, Menu, Moon, Search, Shield, Sun, XCircle, Circle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import RealtimePresence from './components/RealtimePresence';
import UnifiedFooter from './components/Footer/UnifiedFooter';
import Dashboard from './features/Dashboard/Dashboard';
import Courses from './features/Courses/Courses';
import Videos from './features/Videos/Videos';
import Notes from './features/Notes/Notes';
import Resources from './features/Resources/Resources';
import Projects from './features/Projects/Projects';
import Assignments from './features/Assignments/Assignments';
import Workspace from './features/Workspace/Workspace';
import Tasks from './Tasks';
import Analytics from './features/Analytics/Analytics';
import Goals from './features/Goals/Goals';
import WeeklyPlanner from './features/Planner/WeeklyPlanner';
import ReviewHub from './features/Review/ReviewHub';
import Chat from './features/Chat/Chat';
import Reminders from './features/Reminders/Reminders';
import GlobalSearch from './features/Search/Search';
import Auth from './features/Auth/Auth';
import Admin from './features/Admin/Admin';
import Settings from './features/Settings/Settings';
import Legal from './features/Legal/Legal';
import Privacy from './features/Legal/Privacy';
import Terms from './features/Legal/Terms';
import Support from './features/Legal/Support';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useReminders } from './context/ReminderContext';
import { useStorage } from './hooks/useStorage';
import { STORAGE_KEYS } from './services/storage';
import { playAlarmSound, stopAlarmSound, getIsPlaying, setIsPlaying } from './utils/alarmAudio';
import toast from 'react-hot-toast';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, hasPermission, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearReadNotifications,
    snoozeReminder,
    muteReminder,
    unmuteReminder,
    markReminderAsDone,
    addNotification,
    markNotificationAsPresented
  } = useReminders();

  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [streak, setStreak] = useStorage(STORAGE_KEYS.STREAK, { current: 0, lastUpdate: null });
  const [activeProjectId, setActiveProjectId] = useStorage('active_workspace_project', null);
  const [notificationSettings] = useStorage(STORAGE_KEYS.NOTIF_SETTINGS, {
    enabled: true,
    reminders: true,
    deadlines: true,
    streaks: true,
    method: 'browser',
    deliveryMode: 'server',
    defaultSnoozeMinutes: 10,
    alarm: {
      enabled: true,
      muted: false,
      volume: 0.8,
      repeatCount: 1,
      soundUrl: '',
      soundPath: '',
      soundName: '',
      soundType: 'default'
    },
    channels: {
      reminder: { web: true, email: true },
      deadline: { web: true, email: false },
      streak: { web: true, email: false },
      roleChanges: { web: true, email: true },
      chat: { web: true, email: false }
    },
    silentHours: { enabled: false, start: '22:00', end: '07:00' },
    emailNotifications: { roleChanges: true, reminders: true }
  });
  const browserDeliveredRef = useRef(new Set());

  const currentTabFromPath = (() => {
    const firstSegment = location.pathname.replace(/^\//, '').split('/')[0] || 'dashboard';
    if (firstSegment === 'support') return 'legal';
    return firstSegment;
  })();
  const isChatRoute = currentTabFromPath === 'chat';
  const isPublicLegalRoute = [
    '/legal',
    '/legal/privacy',
    '/legal/terms',
    '/legal/support',
    '/support'
  ].some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

  const setActiveTab = (tab) => {
    const nextPath = tab === 'dashboard' ? '/dashboard' : `/${tab}`;
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  useEffect(() => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().catch((error) => {
        console.warn('[App] Notification permission request failed:', error);
      });
    }
  }, []);

  useEffect(() => {
    if (!notifications.length) return;

    const alarm = notificationSettings?.alarm || {};
    const shouldNotify = (notification) => {
      if (!notification) return false;
      if (!['reminder', 'deadline', 'chat', 'chat-mention', 'chat-share'].includes(notification.type)) return false;
      if (notification.browserDeliveredAt) return false;
      if (browserDeliveredRef.current.has(notification.id)) return false;
      return true;
    };

    const deliver = async () => {
      const pending = notifications.filter(shouldNotify);
      if (!pending.length) return;

      const uniquePending = pending.filter((notification, index, list) =>
        list.findIndex((candidate) =>
          candidate.type === notification.type &&
          candidate.reminderId === notification.reminderId &&
          candidate.title === notification.title &&
          candidate.message === notification.message
        ) === index
      );

      for (const notification of uniquePending) {
        browserDeliveredRef.current.add(notification.id);
        const isChatNotification = String(notification.type || '').startsWith('chat');

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title || 'StudyOs Alert', {
            body: notification.message || 'You have a reminder',
            icon: '/favicon.svg'
          });
        }

        if (!isChatNotification) {
          // Sound guard: Skip if already playing
          if (getIsPlaying()) {
            console.log(`[App] Skipping sound for notification ${notification.id} - already playing`);
          } else {
            setIsPlaying(true);
            try {
              await playAlarmSound({
                soundUrl: notification.soundUrl || alarm.soundUrl || '',
                volume: Number(notification.soundVolume ?? alarm.volume ?? 0.8),
                repeatCount: Number(notification.soundRepeatCount ?? alarm.repeatCount ?? 1),
                muted: Boolean(alarm.muted || notification.soundMode === 'mute' || alarm.enabled === false)
              });
            } catch (error) {
              console.warn('[App] Alarm sound playback failed:', error);
            } finally {
              setIsPlaying(false);
            }
          }
        }

        markNotificationAsPresented(notification.id, {
          browserDeliveredAt: new Date().toISOString(),
          browserDeliveredBy: 'client'
        });
      }
    };

    deliver();
  }, [notifications, notificationSettings, markNotificationAsPresented]);

  // When logged out, keep the URL honest (avoid /dashboard in bar while showing Sign In)
  useEffect(() => {
    if (loading || user || isPublicLegalRoute) return;
    if (location.pathname === '/login') return;
    navigate('/login', {
      replace: true,
      state: { from: location.pathname }
    });
  }, [loading, user, isPublicLegalRoute, location.pathname, navigate]);

  // After auth, leave /login so the shell + Routes match the real page
  useEffect(() => {
    if (loading || !user) return;
    if (location.pathname !== '/login') return;
    const from = location.state?.from;
    const dest =
      typeof from === 'string' && from.startsWith('/') && from !== '/login'
        ? from
        : '/dashboard';
    navigate(dest, { replace: true });
  }, [loading, user, location.pathname, location.state, navigate]);

  const renderPublicLegalRoutes = () => (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/legal" element={<Legal />} />
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/legal/support" element={<Support />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Navigate to="/legal" replace />} />
        </Routes>
      </div>
    </div>
  );

  // 1. Manual Pageview Capture for PostHog
  useEffect(() => {
    if (import.meta.env.VITE_POSTHOG_KEY) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        $pathname: location.pathname,
        module: currentTabFromPath
      });
    }
  }, [location.pathname, currentTabFromPath]);

  useEffect(() => {
    if (!user) return;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (streak.lastUpdate === todayStr) return;

    if (!streak.lastUpdate) {
      setStreak({ current: 1, lastUpdate: todayStr });
      return;
    }

    const lastUpdateDate = new Date(streak.lastUpdate);
    const lastUpdateStart = new Date(lastUpdateDate).setHours(0, 0, 0, 0);
    const todayStart = new Date(today).setHours(0, 0, 0, 0);
    const diffDays = Math.floor((todayStart - lastUpdateStart) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      const nextStreak = streak.current + 1;
      setStreak({ current: nextStreak, lastUpdate: todayStr });
      toast.success(`Study streak continued. Day ${nextStreak}.`);
      addNotification({
        title: 'Streak Continued',
        message: `You are on a ${nextStreak}-day streak.`,
        type: 'streak',
        route: '/goals'
      });
    } else if (diffDays > 1) {
      setStreak({ current: 1, lastUpdate: todayStr });
      toast.error('Streak reset. Starting fresh today.');
      addNotification({
        title: 'Streak Reset',
        message: 'Your streak restarted today. Keep going.',
        type: 'streak',
        route: '/goals'
      });
    }
  }, [setStreak, streak, user, addNotification]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    if (isPublicLegalRoute) {
      return renderPublicLegalRoutes();
    }
    return <Auth />;
  }

  const unreadCount = notifications?.filter((notification) => !notification.read).length || 0;
  const readCount = notifications?.length - unreadCount || 0;

  const handleSelectProject = (projectId) => {
    setActiveProjectId(projectId);
    setActiveTab('workspace');
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    setTimeout(() => setNotificationsOpen(false), 300);
  };

  const handleNotificationClick = (id) => {
    markNotificationAsRead(id);
    setNotificationsOpen(false);
  };

  const resolveNotificationPath = (n) => {
    if (n.route) return n.route;
    if (n.tab) return `/${n.tab}`;
    if (n.reminderId) return '/reminders';
    if (n.type === 'task') return '/tasks';
    if (n.type === 'course') return '/courses';
    if (n.type === 'video') return '/videos';
    if (n.type === 'note') return '/notes';
    if (n.type === 'project') return '/projects';
    return '/dashboard';
  };

  const handleNotificationNavigate = (n) => {
    handleNotificationClick(n.id);
    const path = resolveNotificationPath(n);
    navigate(path);
    const tab = path.replace(/^\//, '').split('/')[0] || 'dashboard';
    setActiveTab(tab);
  };

  const handleSnoozeClick = (event, notificationId, reminderId, minutesOverride = 5) => {
    event.stopPropagation();
    stopAlarmSound();
    snoozeReminder(notificationId, reminderId, minutesOverride);
  };

  const handleStopAlarmClick = (event) => {
    event.stopPropagation();
    stopAlarmSound();
    toast.success('Alarm stopped');
  };

  const handleReminderDoneClick = (event, notification) => {
    event.stopPropagation();
    stopAlarmSound();
    if (notification.reminderId) {
      markReminderAsDone(notification.reminderId);
    }
    handleNotificationClick(notification.id);
  };

  const handleMuteReminderClick = (event, notification) => {
    event.stopPropagation();
    muteReminder(notification.id, notification.reminderId);
  };

  const handleUnmuteReminderClick = (event, notification) => {
    event.stopPropagation();
    unmuteReminder(notification.id, notification.reminderId);
  };

  const RestrictedModule = ({ name }) => (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="p-6 rounded-[2.5rem] bg-amber-50 dark:bg-amber-500/10 text-amber-500">
        <Shield size={64} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">{name} Restricted</h2>
        <p className="text-slate-400 max-w-sm mx-auto">You do not have permission to access this module. Contact your administrator if you need access.</p>
      </div>
      <button onClick={() => setActiveTab('dashboard')} className="px-8 py-3 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20">
        Back to Dashboard
      </button>
    </div>
  );

  const renderContent = () => {
    if (profile?.status?.isActive === false) {
      return (
        <div className="h-[80vh] flex flex-col items-center justify-center space-y-6 text-center px-4">
          <div className="p-6 rounded-[2.5rem] bg-red-50 dark:bg-red-500/10 text-red-500">
            <XCircle size={64} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">Account Deactivated</h2>
            <p className="text-slate-400 max-w-md mx-auto">Your account has been deactivated by an administrator. Contact support if you believe this is a mistake.</p>
          </div>
          <button onClick={logout} className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold">
            Logout
          </button>
        </div>
      );
    }

    return (
      <Routes>
        <Route path="/" element={<Dashboard setActiveTab={setActiveTab} />} />
        <Route path="/dashboard" element={<Dashboard setActiveTab={setActiveTab} />} />
        <Route path="/courses" element={hasPermission('courses') ? <Courses /> : <RestrictedModule name="Courses" />} />
        <Route path="/videos" element={hasPermission('videos') ? <Videos /> : <RestrictedModule name="Videos" />} />
        <Route path="/notes" element={hasPermission('notes') ? <Notes /> : <RestrictedModule name="Notes" />} />
        <Route path="/resources" element={hasPermission('resources') ? <Resources /> : <RestrictedModule name="Resources" />} />
        <Route path="/papers" element={hasPermission('resources') ? <Navigate to="/resources?view=papers" replace /> : <RestrictedModule name="Papers" />} />
        <Route path="/projects" element={hasPermission('projects') ? <Projects onSelectProject={handleSelectProject} /> : <RestrictedModule name="Projects" />} />
        <Route path="/assignments" element={hasPermission('assignments') ? <Assignments /> : <RestrictedModule name="Assignments" />} />
        <Route path="/workspace" element={hasPermission('workspace') ? <Workspace activeProjectIdOverride={activeProjectId} setActiveTab={setActiveTab} /> : <RestrictedModule name="Workspace" />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/analytics" element={hasPermission('analytics') ? <Analytics /> : <RestrictedModule name="Analytics" />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/planner" element={<WeeklyPlanner />} />
        <Route path="/review" element={<ReviewHub />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/reminders" element={(hasPermission('reminders') || hasPermission('calendarAccess')) ? <Reminders /> : <RestrictedModule name="Calendar" />} />
        <Route path="/admin" element={isAdmin ? <Admin /> : <Dashboard setActiveTab={setActiveTab} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/legal/privacy" element={<Privacy />} />
        <Route path="/legal/terms" element={<Terms />} />
        <Route path="/legal/support" element={<Support />} />
        <Route path="/support" element={<Support />} />
        <Route path="*" element={<Dashboard setActiveTab={setActiveTab} />} /> {/* Catch-all for unknown routes */}
      </Routes>
    );
  };

  return (
    <>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-700 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <Sidebar
          activeTab={currentTabFromPath}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />
        <div className="flex flex-1 flex-col h-screen overflow-hidden min-h-0">
          {/* Header */}
          <header className="relative z-[10002] flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden text-slate-600 dark:text-slate-400"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                StudyOS
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm"
              >
                <Search size={16} />
                <span>Search (Ctrl+K)</span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Notification button clicked, unreadCount:', unreadCount);
                    setNotificationsOpen((prev) => {
                      const newValue = !prev;
                      console.log('Setting notificationsOpen from', prev, 'to', newValue);
                      return newValue;
                    });
                  }}
                  className="relative z-[10003] pointer-events-auto p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  aria-label="Notifications"
                  title={`Notifications (${unreadCount})`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500 text-xs font-bold flex items-center justify-center text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>
                {/* <AnimatePresence> */}
                  {(() => {
                    console.log('Portal condition check:', { notificationsOpen, documentExists: typeof document !== 'undefined' });
                    const shouldRender = notificationsOpen && typeof document !== 'undefined';
                    console.log('Should render portal:', shouldRender);
                    if (shouldRender) {
                      console.log('Creating portal...');
                    }
                    return shouldRender;
                  })() && createPortal(
                    <div className="fixed inset-0 z-[999999] pointer-events-none">
                      {console.log('Portal content rendering...') || null}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-20 right-4 w-[26rem] pointer-events-auto bg-white dark:bg-slate-900 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 overflow-hidden"
                      >
                        {console.log('Motion div rendering...') || null}
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500 font-semibold mb-1">Notifications</p>
                          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Activity feed</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${unreadCount > 0 ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'}`}>
                            {unreadCount > 0 ? (
                              <>
                                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                                {unreadCount} new
                              </>
                            ) : (
                              <>
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                All caught up
                              </>
                            )}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAllAsRead();
                            }}
                            disabled={unreadCount === 0}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Mark all read
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {notifications.length === 0 ? (
                          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-8 text-center text-sm text-slate-500 dark:border-slate-700/50 dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 dark:text-slate-400">
                            <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p>No notifications yet</p>
                            <p className="mt-1 text-xs font-medium">Your activity will appear here</p>
                          </div>
                        ) : (
                          <ul className="space-y-3 max-h-[26rem] overflow-y-auto pr-1 custom-scrollbar">
                            {notifications.map((notification) => {
                              const typeColorMap = {
                                reminder: 'border-blue-100 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-500/10',
                                deadline: 'border-slate-200 bg-red-50/70 dark:border-slate-800 dark:bg-red-500/10',
                                streak: 'border-amber-100 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-500/10',
                                default: 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50'
                              };
                              const colorClass = notification.read ? 'border-slate-200 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/30' : (typeColorMap[notification.type] || typeColorMap.default);
                              return (<li
                                key={notification.id}
                                className={`rounded-2xl border p-4 transition-all hover:shadow-md ${colorClass}`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`mt-1 inline-flex h-3.5 w-3.5 rounded-full ${notification.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-primary-600'}`} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{notification.message}</p>
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : (notification.time || '')}
                                      </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      {notification.type && (
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                          {notification.type}
                                        </span>
                                      )}
                                      {!notification.read && (
                                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                                          Unread
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {!notification.read && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNotificationClick(notification.id);
                                      }}
                                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNotificationNavigate(notification);
                                    }}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                                  >
                                    View details
                                  </button>
                                  {notification.type === 'reminder' && (
                                    <>
                                      <button
                                        onClick={(e) => handleSnoozeClick(e, notification.id, notification.reminderId, 5)}
                                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20"
                                      >
                                        Snooze 5m
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStopAlarmClick(e);
                                        }}
                                        className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
                                      >
                                        Stop Alarm
                                      </button>
                                      <button
                                        onClick={(e) => handleMuteReminderClick(e, notification)}
                                        className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-500/10 dark:text-fuchsia-200 dark:hover:bg-fuchsia-500/20"
                                      >
                                        Mute
                                      </button>
                                      <button
                                        onClick={(e) => handleUnmuteReminderClick(e, notification)}
                                        className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20"
                                      >
                                        Unmute
                                      </button>
                                      <button
                                        onClick={(e) => handleReminderDoneClick(e, notification)}
                                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                                      >
                                        Mark done
                                      </button>
                                    </>
                                  )}
                                </div>
                              </li>
                            );
                            })}
                          </ul>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Showing {notifications.length} notification{notifications.length === 1 ? '' : 's'}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAllAsRead();
                              }}
                              disabled={unreadCount === 0}
                              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Mark all read
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearReadNotifications();
                              }}
                              disabled={readCount === 0}
                              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            >
                              Clear read
                            </button>
                          </div>
                        </div>
                      )}
                      </motion.div>
                    </div>,
                    document.body
                  )}
                {/* </AnimatePresence> */}
              </div>
              <button onClick={logout} className="px-4 py-2 rounded-full bg-primary-500 text-white font-semibold">
                Logout
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className={`flex-1 min-h-0 relative flex flex-col scroll-smooth ${isChatRoute ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
            {user && <RealtimePresence user={user} profile={profile} />}
            <div className={`w-full ${isChatRoute ? 'flex-1 min-h-0 p-0 flex flex-col' : 'flex-1 p-4 lg:p-12 lg:pb-16'}`}>
              <div className={`${isChatRoute ? 'flex-1 min-h-0 max-w-none mx-0 space-y-0' : 'max-w-[1600px] mx-auto space-y-12'}`}>
                {renderContent()}
              </div>
            </div>
            
            {!isChatRoute && (
              <div className="w-full">
                <UnifiedFooter
                  profile={profile}
                  isAdmin={isAdmin}
                  hasPermission={hasPermission}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}
          </main>
        </div>
      </div>
      <AnimatePresence>
        {searchOpen && (
          <GlobalSearch
            setSearchOpen={setSearchOpen}
            setActiveTab={setActiveTab}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
