import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import posthog from 'posthog-js';
import { Bell, Menu, Moon, Search, Shield, Sun, XCircle, Circle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import UnifiedFooter from './components/Footer/UnifiedFooter';
import Dashboard from './features/Dashboard/Dashboard';
import Courses from './features/Courses/Courses';
import Videos from './features/Videos/Videos';
import Notes from './features/Notes/Notes';
import Resources from './features/Resources/Resources';
import Projects from './features/Projects/Projects';
import Assignments from './features/Assignments/Assignments';
import Workspace from './features/Workspace/Workspace';
import Analytics from './features/Analytics/Analytics';
import Goals from './features/Goals/Goals';
import WeeklyPlanner from './features/Planner/WeeklyPlanner';
import ReviewHub from './features/Review/ReviewHub';
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
    markReminderAsDone,
    addNotification
  } = useReminders();

  // Initialize tab from current route to prevent route/tab mismatch on first paint
  const initialTab = (() => {
    const path = location.pathname.replace(/^\//, '') || 'dashboard';
    return path.split('/')[0];
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [streak, setStreak] = useStorage(STORAGE_KEYS.STREAK, { current: 0, lastUpdate: null });
  const [activeProjectId, setActiveProjectId] = useStorage('active_workspace_project', null);

  useEffect(() => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().catch((error) => {
        console.warn('[App] Notification permission request failed:', error);
      });
    }
  }, []);

  // Keep route and activeTab in sync (fixes cases where tab changes but route doesn't)
  useEffect(() => {
    const expectedPath = activeTab === 'dashboard' ? '/dashboard' : `/${activeTab}`;
    if (location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 1. Manual Pageview Capture for PostHog
  useEffect(() => {
    if (import.meta.env.VITE_POSTHOG_KEY) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        $pathname: location.pathname,
        module: activeTab
      });
    }
  }, [location.pathname, activeTab]);

  // 2. Sync activeTab if location changes (browser back/forward or external link)
  useEffect(() => {
    const path = location.pathname.replace(/^\//, '') || 'dashboard';
    const tab = path.split('/')[0];
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, activeTab]);

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

  const currentTabFromPath = (() => {
    const firstSegment = location.pathname.replace(/^\//, '').split('/')[0] || 'dashboard';
    if (firstSegment === 'support') return 'legal';
    return firstSegment;
  })();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const readCount = notifications.length - unreadCount;

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
    if (n.type === 'course') return '/courses';
    if (n.type === 'video') return '/videos';
    if (n.type === 'note') return '/notes';
    if (n.type === 'project' || n.type === 'task') return '/projects';
    return '/dashboard';
  };

  const handleNotificationNavigate = (n) => {
    handleNotificationClick(n.id);
    const path = resolveNotificationPath(n);
    navigate(path);
    const tab = path.replace(/^\//, '').split('/')[0] || 'dashboard';
    setActiveTab(tab);
  };

  const handleSnoozeClick = (event, notificationId, reminderId) => {
    event.stopPropagation();
    snoozeReminder(notificationId, reminderId);
  };

  const handleReminderDoneClick = (event, notification) => {
    event.stopPropagation();
    if (notification.reminderId) {
      markReminderAsDone(notification.reminderId);
    }
    handleNotificationClick(notification.id);
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
        <Route path="/analytics" element={hasPermission('analytics') ? <Analytics /> : <RestrictedModule name="Analytics" />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/planner" element={<WeeklyPlanner />} />
        <Route path="/review" element={<ReviewHub />} />
        <Route path="/reminders" element={(hasPermission('reminders') || hasPermission('calendarAccess')) ? <Reminders /> : <RestrictedModule name="Calendar" />} />
        <Route path="/admin" element={isAdmin ? <Admin /> : <Dashboard setActiveTab={setActiveTab} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/legal/privacy" element={<Privacy />} />
        <Route path="/legal/terms" element={<Terms />} />
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
        <div className="flex flex-1 flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
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
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500"></span>
                  )}
                </button>
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-[24rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-black text-slate-800 dark:text-white">Notifications</h3>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-black mt-0.5">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 text-[10px] font-black uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center text-slate-500 dark:text-slate-400 text-sm">
                            No notifications yet.
                          </div>
                        ) : (
                          <ul className="space-y-2 max-h-[24rem] overflow-y-auto pr-1 custom-scrollbar">
                            {notifications.map((notification) => (
                              <li
                                key={notification.id}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                                  notification.read
                                    ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                                    : 'bg-primary-50/70 dark:bg-primary-500/10 border-primary-100 dark:border-primary-900/40'
                                }`}
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  <Circle size={14} className={notification.read ? 'text-slate-300 dark:text-slate-600' : 'text-primary-500'} fill={notification.read ? 'none' : 'currentColor'} />
                                </div>
                                  <div
                                    className="flex-grow cursor-pointer"
                                    onClick={() => handleNotificationNavigate(notification)}
                                  >
                                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">{notification.message}</p>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : (notification.time || '')}
                                    </span>
                                  {notification.type === 'reminder' && (
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={(e) => handleSnoozeClick(e, notification.id, notification.reminderId)}
                                        className="text-[11px] px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 font-bold hover:opacity-90"
                                      >
                                        Snooze
                                      </button>
                                      <button
                                        onClick={(e) => handleReminderDoneClick(e, notification)}
                                        className="text-[11px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold hover:opacity-90"
                                      >
                                        Mark as Done
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {!notification.read && (
                                  <button
                                    onClick={() => handleNotificationClick(notification.id)}
                                    className="flex-shrink-0 text-primary-500 hover:text-primary-600 mt-0.5"
                                    aria-label="Mark as read"
                                    title="Mark as read"
                                  >
                                    <Circle size={16} fill="currentColor" />
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {notifications.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-center text-sm font-bold text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-500/10 rounded-xl py-2.5 hover:opacity-90 transition disabled:opacity-50"
                              disabled={unreadCount === 0}
                            >
                              Mark all read
                            </button>
                            <button
                              onClick={clearReadNotifications}
                              className="text-center text-sm font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 rounded-xl py-2.5 hover:opacity-90 transition disabled:opacity-50"
                              disabled={readCount === 0}
                            >
                              Clear read
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={logout} className="px-4 py-2 rounded-full bg-primary-500 text-white font-semibold">
                Logout
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col scroll-smooth">
            <div className="flex-1 w-full p-4 lg:p-12 lg:pb-16">
              <div className="max-w-[1600px] mx-auto space-y-12">
                {renderContent()}
              </div>
            </div>
            
            <div className="w-full mt-auto">
              <UnifiedFooter
                profile={profile}
                isAdmin={isAdmin}
                hasPermission={hasPermission}
                setActiveTab={setActiveTab}
              />
            </div>
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
