import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Youtube, 
  FileText, 
  FolderOpen, 
  Library, 
  Github as GithubIcon, 
  Layout as Kanban, 
  BarChart, 
  Bell, 
  Search,
  Settings,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'courses', icon: BookOpen, label: 'Courses' },
    { id: 'videos', icon: Youtube, label: 'Video Tracker' },
    { id: 'notes', icon: FileText, label: 'Notes' },
    { id: 'resources', icon: FolderOpen, label: 'Resources' },
    { id: 'papers', icon: Library, label: 'Papers' },
    { id: 'projects', icon: GithubIcon, label: 'Projects' },
    { id: 'workspace', icon: Kanban, label: 'Workspace' },
    { id: 'analytics', icon: BarChart, label: 'Analytics' },
    { id: 'reminders', icon: Bell, label: 'Reminders' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full dark:bg-slate-900 transition-colors duration-300">
      <div className="p-6 flex items-center justify-between">
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
            className="hidden lg:flex p-1.5 hover:bg-slate-100 rounded-lg transition-colors absolute -right-3 top-7 bg-white border border-slate-200 shadow-sm z-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-300"
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
        {menuItems.map((item) => (
          <button
            key={item.id}
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
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-slate-50 dark:border-slate-800">
        <button
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
        </button>
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
