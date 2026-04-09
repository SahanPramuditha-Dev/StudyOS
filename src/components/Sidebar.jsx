import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Youtube, 
  FileText, 
  FolderOpen, 
  Github as GithubIcon, 
  Layout as Kanban, 
  BarChart, 
  Bell, 
  Search,
  Settings,
  Menu,
  X,
  Plus,
  ShieldAlert,
  Lock,
  Target,
  CalendarClock,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { profile, isAdmin } = useAuth();

  const toPath = (id) => {
    if (id === 'dashboard') return '/dashboard';
    if (id === 'admin') return '/admin';
    if (id === 'legal') return '/legal';
    if (id === 'settings') return '/settings';
    return `/${id}`;
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'courses', icon: BookOpen, label: 'Courses', permission: 'courses' },
    { id: 'videos', icon: Youtube, label: 'Video Tracker', permission: 'videos' },
    { id: 'notes', icon: FileText, label: 'Notes', permission: 'notes' },
    { id: 'resources', icon: FolderOpen, label: 'Resources', permission: 'resources' },
    { id: 'projects', icon: GithubIcon, label: 'Projects', permission: 'projects' },
    { id: 'assignments', icon: FileText, label: 'Assignments', permission: 'assignments' },
    { id: 'workspace', icon: Kanban, label: 'Workspace', permission: 'workspace' },
    { id: 'analytics', icon: BarChart, label: 'Analytics', permission: 'analytics' },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'planner', icon: CalendarClock, label: 'Planner' },
    { id: 'review', icon: Inbox, label: 'Review Hub' },
    { id: 'reminders', icon: Bell, label: 'Calendar', permission: 'reminders' },
  ];

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (isAdmin) return true;
    if (!profile?.permissions) return true;
    if (!item.permission) return true;
    return profile.permissions[item.permission] !== false;
  });

  const adminItem = isAdmin ? { id: 'admin', icon: ShieldAlert, label: 'Admin Panel' } : null;
  const legalItem = { id: 'legal', icon: Lock, label: 'Legal' };

  const sidebarContent = (
    <div className="flex flex-col h-full dark:bg-slate-900 transition-colors duration-300">
      <div className="p-6 flex items-center justify-between gap-3">
        {(isOpen || isMobileOpen) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <img
              src="/logo.svg"
              alt="StudyOs logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400">
              StudyOs
            </span>
          </motion.div>
        )}
        {(!isOpen && !isMobileOpen) && (
          <img
            src="/logo.svg"
            alt="StudyOs logo"
            className="w-8 h-8 rounded-lg object-cover mx-auto"
          />
        )}
        
        {/* Toggle button for desktop */}
        {!isMobileOpen && (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:inline-flex ml-auto p-1.5 hover:bg-slate-100 rounded-lg transition-colors bg-white border border-slate-200 shadow-sm z-10 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-300"
          >
            {isOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        )}

        {/* Close button for mobile */}
        {isMobileOpen && (
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors dark:hover:bg-slate-800"
          >
            <X size={20} className="text-slate-400 dark:text-slate-500" />
          </button>
        )}
      </div>

      <div className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.id}
            to={toPath(item.id)}
            onClick={() => {
              setActiveTab(item.id);
              if (isMobileOpen) setIsMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
            }`}
          >
            <item.icon size={22} className={activeTab === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'} />
            {(isOpen || isMobileOpen) && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            {activeTab === item.id && (isOpen || isMobileOpen) && (
              <motion.div 
                layoutId="active-pill"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400"
              />
            )}
          </NavLink>
        ))}

        {adminItem && (
          <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800">
            <NavLink
              key={adminItem.id}
              to={toPath(adminItem.id)}
              onClick={() => {
                setActiveTab(adminItem.id);
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === adminItem.id 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <adminItem.icon size={22} className={activeTab === adminItem.id ? 'text-white' : 'text-slate-400'} />
              {(isOpen || isMobileOpen) && <span className="font-bold">Admin Panel</span>}
            </NavLink>
          </div>
        )}

        <div className="pt-2 mt-2 border-t border-slate-50 dark:border-slate-800">
          <NavLink
            to={toPath(legalItem.id)}
            onClick={() => {
              setActiveTab(legalItem.id);
              if (isMobileOpen) setIsMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              activeTab === legalItem.id 
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100' 
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <legalItem.icon size={22} className={activeTab === legalItem.id ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'} />
            {(isOpen || isMobileOpen) && <span className="font-medium">{legalItem.label}</span>}
          </NavLink>
        </div>
      </div>

      <div className="p-3 border-t border-slate-50 dark:border-slate-800">
        <NavLink
          to={toPath('settings')}
          onClick={() => {
            setActiveTab('settings');
            if (isMobileOpen) setIsMobileOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            activeTab === 'settings' 
              ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100' 
              : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Settings size={22} className="text-slate-400 dark:text-slate-500" />
          {(isOpen || isMobileOpen) && <span className="font-medium">Settings</span>}
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 z-[70] shadow-2xl lg:hidden border-r dark:border-slate-800"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-slate-100 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} z-50 dark:bg-slate-900 dark:border-slate-800`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
