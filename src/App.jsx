import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { Search, Plus, Bell, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Feature Components (Placeholders for now)
import Dashboard from './features/Dashboard/Dashboard';
import Courses from './features/Courses/Courses';
import Videos from './features/Videos/Videos';
import Notes from './features/Notes/Notes';
import Resources from './features/Resources/Resources';
import Papers from './features/Papers/Papers';
import Projects from './features/Projects/Projects';
import Workspace from './features/Workspace/Workspace';
import Analytics from './features/Analytics/Analytics';
import Reminders from './features/Reminders/Reminders';
import GlobalSearch from './features/Search/Search';
import Auth from './features/Auth/Auth';
import Settings from './features/Settings/Settings';
import { useAuth } from './context/AuthContext';
import { EmailService } from './services/email';
import { useTheme } from './context/ThemeContext';
import { useReminders } from './context/ReminderContext';
import { useStorage } from './hooks/useStorage';
import { STORAGE_KEYS } from './services/storage';
import { Sun, Moon } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

const App = () => {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    snoozeReminder 
  } = useReminders();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [streak, setStreak] = useStorage(STORAGE_KEYS.STREAK, { current: 0, lastUpdate: null });
  const [activeProjectId, setActiveProjectId] = useStorage('active_workspace_project', null);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('[App] Notification permission granted');
          } else {
            console.warn('[App] Notification permission denied');
          }
        });
      } else if (Notification.permission === 'denied') {
        console.warn('[App] Notifications are blocked. Please enable them in browser settings.');
      }
    }
  }, []);

  // Update Streak Logic
  useEffect(() => {
    if (!user) return;
    console.log(`[App] Checking streak logic... Current: ${streak.current} | Initialized: ${streak.lastUpdate !== undefined}`);
    
    // EMERGENCY RESET: If you see "5" today (April 7, 2026) but just started, 
    // it's likely stale data from a previous session.
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    if (streak.current === 5 && !streak.lastUpdate) {
      setStreak({ current: 1, lastUpdate: todayStr });
      return;
    }

    // Normal Streak Logic
    if (streak.lastUpdate === todayStr) return;

    const lastUpdateDate = streak.lastUpdate ? new Date(streak.lastUpdate) : null;
    
    if (!lastUpdateDate) {
      // First time initialization
      setStreak({ current: 1, lastUpdate: todayStr });
    } else {
      // Reset time to start of day for accurate day difference
      const lastUpdateStart = new Date(lastUpdateDate).setHours(0, 0, 0, 0);
      const todayStart = new Date(today).setHours(0, 0, 0, 0);
      
      const diffTime = todayStart - lastUpdateStart;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        setStreak(prev => ({ current: prev.current + 1, lastUpdate: todayStr }));
        toast.success(`Study streak continued! Day ${streak.current + 1} 🔥`);
      } else if (diffDays > 1) {
        // Streak broken
        setStreak({ current: 1, lastUpdate: todayStr });
        toast.error('Streak broken, starting fresh today! 💪');
      }
    }
  }, [user, streak.lastUpdate, streak.current]); // Add streak.current to ensure it updates when setStreak is called

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    setTimeout(() => setNotificationsOpen(false), 300);
  };

  const handleNotificationClick = (id) => {
    markNotificationAsRead(id);
    setNotificationsOpen(false);
  };

  const handleSnoozeClick = (e, notifId, reminderId) => {
    e.stopPropagation();
    snoozeReminder(notifId, reminderId);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
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
    return <Auth />;
  }

  const handleSelectProject = (projectId) => {
    setActiveProjectId(projectId);
    setActiveTab('workspace');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'courses': return <Courses />;
      case 'videos': return <Videos />;
      case 'notes': return <Notes />;
      case 'resources': return <Resources />;
      case 'papers': return <Papers />;
      case 'projects': return <Projects onSelectProject={handleSelectProject} />;
      case 'workspace': return <Workspace activeProjectIdOverride={activeProjectId} setActiveTab={setActiveTab} />;
      case 'analytics': return <Analytics />;
      case 'reminders': return <Reminders />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`flex min-h-screen bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-700 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-slate-100 bg-white/50 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20 dark:bg-slate-900/50 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors dark:hover:bg-slate-800"
            >
              <Menu size={24} className="text-slate-600 dark:text-slate-400" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl lg:text-2xl font-bold capitalize truncate max-w-[150px] lg:max-w-none dark:text-white">
                {activeTab.replace('-', ' ')}
              </h1>
              <p className="text-slate-400 text-xs lg:text-sm hidden lg:block">Welcome back, {user.name}!</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400"
            >
              <Search size={18} />
              <span className="text-sm font-medium pr-2 lg:pr-4 hidden sm:inline">Search...</span>
              <kbd className="hidden lg:inline px-1.5 py-0.5 rounded border border-slate-300 text-[10px] font-sans dark:border-slate-600">Ctrl+K</kbd>
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2 lg:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`p-2 lg:p-2.5 rounded-xl transition-all relative ${
                notificationsOpen 
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' 
                  : 'hover:bg-slate-100 text-slate-500 dark:hover:bg-slate-800'
              }`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {notificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setNotificationsOpen(false)}
                  ></div>
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-72 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-40 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="font-bold dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n.id)}
                            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${
                              !n.read ? 'bg-primary-50/30 dark:bg-primary-500/5' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                !n.read ? (
                                  n.type === 'success' ? 'bg-green-500' : 
                                  n.type === 'resource' ? 'bg-blue-500' : 'bg-primary-500'
                                ) : 'bg-slate-200 dark:bg-slate-700'
                              }`}></div>
                              <div className={n.read ? 'opacity-60' : ''}>
                                <p className="text-sm font-bold dark:text-slate-200">{n.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-[10px] text-slate-400 font-medium uppercase">{n.time}</p>
                                  {n.reminderId && !n.read && (
                                    <button 
                                      onClick={(e) => handleSnoozeClick(e, n.id, n.reminderId)}
                                      className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-600 flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md transition-colors"
                                    >
                                      Snooze
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-sm text-slate-400">No notifications yet</p>
                        </div>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="w-full p-3 text-xs font-bold text-slate-400 hover:text-primary-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <button 
              onClick={logout}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 transition-all text-slate-500 active:scale-95 group dark:bg-slate-800 dark:hover:bg-red-900/20"
            >
              <span className="text-sm font-semibold hidden sm:inline">Logout</span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-primary-200 transition-all overflow-hidden shrink-0"
            >
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {searchOpen && (
          <GlobalSearch 
            isOpen={searchOpen} 
            onClose={setSearchOpen} 
            onSelectTab={setActiveTab} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
