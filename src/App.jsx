import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { usePlatformSettings } from './hooks/usePlatformSettings';
import posthog from 'posthog-js';
import { Bell, Menu, Moon, Search, Shield, Sun, XCircle, Circle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import RealtimePresence from './components/RealtimePresence';
import { OrionCompanion } from './components/Orion';
import { NavbarRoleSelector, RoleSimulationBanner } from './components/common/RolePreviewBar';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useReminders } from './context/ReminderContext';
import { useStorage } from './hooks/useStorage';
import { STORAGE_KEYS } from './services/storage';
import { FirestoreService } from './services/firestore';
import { playAlarmSound, stopAlarmSound, getIsPlaying, setIsPlaying } from './utils/alarmAudio';
import toast from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

const Dashboard = lazy(() => import('./features/Dashboard/Dashboard'));
const Courses = lazy(() => import('./features/Courses/Courses'));
const Videos = lazy(() => import('./features/Videos/Videos'));
const Notes = lazy(() => import('./features/Notes/Notes'));
const Resources = lazy(() => import('./features/Resources/Resources'));
const Projects = lazy(() => import('./features/Projects/Projects'));
const Assignments = lazy(() => import('./features/Assignments/Assignments'));
const Workspace = lazy(() => import('./features/Workspace/Workspace'));
const Tasks = lazy(() => import('./Tasks'));
const Analytics = lazy(() => import('./features/Analytics/Analytics'));
const Goals = lazy(() => import('./features/Goals/Goals'));
const Budget = lazy(() => import('./features/Budget/index'));
const WeeklyPlanner = lazy(() => import('./features/Planner/WeeklyPlanner'));
const ReviewHub = lazy(() => import('./features/Review/ReviewHub'));
const Chat = lazy(() => import('./features/Chat/Chat'));
const Reminders = lazy(() => import('./features/Reminders/Reminders'));
const Timer = lazy(() => import('./features/Timer/Timer'));
const Grades = lazy(() => import('./features/Grades/Grades'));
const GlobalSearch = lazy(() => import('./features/Search/Search'));
const Auth = lazy(() => import('./features/Auth/Auth'));
const CredentialSetup = lazy(() => import('./features/Auth/CredentialSetup'));
const Admin = lazy(() => import('./features/Admin/Admin'));
const Settings = lazy(() => import('./features/Settings/Settings'));
const Legal = lazy(() => import('./features/Legal/Legal'));
const Privacy = lazy(() => import('./features/Legal/Privacy'));
const Terms = lazy(() => import('./features/Legal/Terms'));
const Support = lazy(() => import('./features/Legal/Support'));
const NotFound = lazy(() => import('./components/NotFound/NotFound'));

const GlobalLoader = () => (
  <div className="h-[50vh] w-full flex items-center justify-center p-12">
    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const SOUND_FRESH_WINDOW_MS = 90 * 1000;
const SOUND_COOLDOWN_MS = 10 * 1000;

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
      enabled: false,
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
  const lastAlarmPlayedAtRef = useRef(0);
  const { data: platformSettings = { maintenanceMode: false, globalAnnouncement: '' } } = usePlatformSettings();

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
    const isFreshNotification = (notification) => {
      if (!notification?.timestamp) return true;
      const timestamp = new Date(notification.timestamp).getTime();
      if (!Number.isFinite(timestamp)) return true;
      return (Date.now() - timestamp) <= SOUND_FRESH_WINDOW_MS;
    };

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

      const sortedPending = [...uniquePending].sort((a, b) => {
        const aTime = new Date(a?.timestamp || 0).getTime();
        const bTime = new Date(b?.timestamp || 0).getTime();
        return bTime - aTime;
      });

      let soundPlayedForBatch = false;

      for (const notification of sortedPending) {
        browserDeliveredRef.current.add(notification.id);
        const isChatNotification = String(notification.type || '').startsWith('chat');

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title || 'StudyOs Alert', {
            body: notification.message || 'You have a reminder',
            icon: '/favicon.svg'
          });
        }

        if (!isChatNotification) {
          const isFreshForSound = isFreshNotification(notification);
          const withinCooldown = (Date.now() - lastAlarmPlayedAtRef.current) < SOUND_COOLDOWN_MS;

          // Sound guard: play only once per delivery batch, only for fresh notifications, with cooldown protection.
          if (soundPlayedForBatch || !isFreshForSound || withinCooldown) {
            if (!isFreshForSound) {
              console.log(`[App] Skipping sound for stale notification ${notification.id}`);
            }
          } else if (getIsPlaying()) {
            soundPlayedForBatch = true;
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
              lastAlarmPlayedAtRef.current = Date.now();
              soundPlayedForBatch = true;
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
        <ErrorBoundary>
          <Suspense fallback={<GlobalLoader />}>
            <Routes>
              <Route path="/legal" element={<Legal />} />
              <Route path="/legal/privacy" element={<Privacy />} />
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="/legal/support" element={<Support />} />
              <Route path="/support" element={<Support />} />
              <Route path="*" element={<Navigate to="/legal" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
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
      toast.success(`Study streak continued. Day ${nextStreak}.`, { id: 'streak-toast' });
      addNotification({
        title: 'Streak Continued',
        message: `You are on a ${nextStreak}-day streak.`,
        type: 'streak',
        route: '/goals'
      });
    } else if (diffDays > 1) {
      setStreak({ current: 1, lastUpdate: todayStr });
      toast.error('Streak reset. Starting fresh today.', { id: 'streak-reset-toast' });
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

  if (platformSettings.maintenanceMode && !isAdmin) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <Shield size={64} className="text-primary-500 mb-6" />
        <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-4">Under Maintenance</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          StudyOS is currently undergoing scheduled maintenance. Please check back later!
        </p>
        <button onClick={logout} className="mt-8 px-6 py-3 bg-slate-200 dark:bg-slate-800 font-bold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors">
          Sign Out
        </button>
      </div>
    );
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
      <ErrorBoundary>
        <Suspense fallback={<GlobalLoader />}>
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
            <Route path="/grades" element={hasPermission('grades') ? <Grades /> : <RestrictedModule name="Grades" />} />
            <Route path="/workspace" element={hasPermission('workspace') ? <Workspace activeProjectIdOverride={activeProjectId} setActiveTab={setActiveTab} /> : <RestrictedModule name="Workspace" />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/timer" element={<Timer />} />
            <Route path="/analytics" element={hasPermission('analytics') ? <Analytics /> : <RestrictedModule name="Analytics" />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/expenses" element={<Budget />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    );
  };

  if (user && profile && !profile.username) {
    return <CredentialSetup />;
  }

  return (
    <>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-700 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <Sidebar
          activeTab={currentTabFromPath}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />
        <div className="flex flex-1 flex-col h-screen overflow-hidden min-h-0 print:h-auto print:overflow-visible">
          {/* Header */}
          <header className="print:hidden relative z-30 flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
                className="flex items-center gap-3 px-4 py-2 w-48 sm:w-64 rounded-full bg-slate-100 dark:bg-slate-900/50 border border-transparent dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group shadow-sm"
              >
                <Search size={16} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                <span className="flex-1 text-left text-sm font-medium">Search...</span>
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
                  CTRL K
                </span>
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
                  className="relative z-30 pointer-events-auto p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  aria-label="Notifications"
                  title={`Notifications (${unreadCount})`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full ring-2 ring-white dark:ring-slate-900 bg-red-500 text-[10px] font-bold flex items-center justify-center text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {/* <AnimatePresence> */}
                  {notificationsOpen && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 z-[999999] pointer-events-none">
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
                                      className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNotificationNavigate(notification);
                                    }}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    View details
                                  </button>
                                  {notification.type === 'reminder' && (
                                    <>
                                      <button
                                        onClick={(e) => handleSnoozeClick(e, notification.id, notification.reminderId, 5)}
                                        className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20 transition-colors"
                                      >
                                        Snooze 5m
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStopAlarmClick(e);
                                        }}
                                        className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20 transition-colors"
                                      >
                                        Stop Alarm
                                      </button>
                                      <button
                                        onClick={(e) => handleMuteReminderClick(e, notification)}
                                        className="rounded-xl bg-fuchsia-50 px-4 py-2 text-xs font-bold text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:hover:bg-fuchsia-500/20 transition-colors"
                                      >
                                        Mute
                                      </button>
                                      <button
                                        onClick={(e) => handleUnmuteReminderClick(e, notification)}
                                        className="rounded-xl bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20 transition-colors"
                                      >
                                        Unmute
                                      </button>
                                      <button
                                        onClick={(e) => handleReminderDoneClick(e, notification)}
                                        className="rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 transition-colors"
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
                        <div className="border-t border-slate-100 dark:border-slate-800 p-4 flex flex-row items-center justify-between">
                          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Showing {notifications.length} notification{notifications.length === 1 ? '' : 's'}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearReadNotifications();
                            }}
                            disabled={readCount === 0}
                            className="rounded-xl border border-rose-200 dark:border-rose-900/50 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            Clear read
                          </button>
                        </div>
                      )}
                      </motion.div>
                    </div>,
                    document.body
                  )}
                {/* </AnimatePresence> */}
              </div>
              <NavbarRoleSelector />
              <button onClick={logout} className="px-4 py-2 rounded-full bg-primary-500 text-white font-semibold text-xs sm:text-sm">
                Logout
              </button>
            </div>
          </header>

          <RoleSimulationBanner />

          {platformSettings.globalAnnouncement && (
            <div className="w-full bg-primary-500 text-white text-center py-2 px-4 text-sm font-bold z-10 shadow-sm shrink-0">
              {platformSettings.globalAnnouncement}
            </div>
          )}

          {/* Main Content Area */}
          <main className={`print:h-auto print:overflow-visible flex-1 min-h-0 relative flex flex-col scroll-smooth ${isChatRoute ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
            {user && <RealtimePresence user={user} profile={profile} />}
            <div className={`w-full ${isChatRoute ? 'flex-1 min-h-0 p-0 flex flex-col' : 'flex-1 p-4 lg:p-12 lg:pb-16'}`}>
              <div className={`${isChatRoute ? 'flex-1 min-h-0 max-w-none mx-0 space-y-0' : 'max-w-[1600px] mx-auto space-y-12'}`}>
                {renderContent()}
              </div>
            </div>
            
          </main>
        </div>
      </div>
      <AnimatePresence>
        {searchOpen && (
          <GlobalSearch
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelectTab={setActiveTab}
          />
        )}
      </AnimatePresence>
      <Suspense fallback={null}>
        {user && <OrionCompanion />}
      </Suspense>
    </>
  );
};

export default App;
