import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Circle, HardDrive, User, ChevronUp, Linkedin, Facebook, Mail } from 'lucide-react';
import { useOnline } from '../../hooks/useOnline';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { computeUsageMetrics } from '../../services/usageMetrics';
import { Link } from 'react-router-dom'; // Assuming react-router-dom for navigation

const StatusBadge = ({ children, className = '' }) => (
  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm text-xs font-medium ${className}`}>
    {children}
  </div>
);

const getRoleBadge = (role) => {
  const badges = {
    user: { color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', label: 'User' },
    admin: { color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', label: 'Admin' },
    superadmin: { color: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300', label: 'Super Admin' },
    restricted: { color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', label: 'Restricted' }
  };
  return badges[role] || badges.user;
};

const RoleBadge = ({ role }) => {
  const badge = getRoleBadge(role);
  return (
    <div className={`px-3 py-1.5 rounded-full font-semibold text-xs ${badge.color} border border-current`}>
      {badge.label}
    </div>
  );
};

const UnifiedFooter = ({ profile, isAdmin, hasPermission, setActiveTab }) => {
  const isOnline = useOnline();
  const currentYear = 2026; // Fixed per spec
  const [resources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [papers] = useStorage(STORAGE_KEYS.PAPERS, []);

  // Use real data from profile (synced via Cloud Functions)
  const usage = profile?.usage || {
    fileCount: 0,
    storageUsedMB: 0
  };
  
  const limits = profile?.limits || {
    maxFiles: 50,
    storageMB: 10
  };
  const { displayFileCount, displayStorageUsedMB } = computeUsageMetrics({
    resources,
    notes,
    papers,
    cloudUsage: usage
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.footer
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass rounded-t-xl border-t border-slate-100/70 dark:border-slate-800/70 backdrop-blur-lg bg-white/60 dark:bg-slate-900/60 shadow-sm px-4 lg:px-8 py-3 lg:py-4 mt-auto"
    >
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Branding & Status Combined Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Sahan.</h3>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Building digital experiences with precision.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Online Status */}
            <StatusBadge>
              <Circle size={8} className={`animate-pulse ${isOnline ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className={isOnline ? 'text-emerald-600' : 'text-red-600'}>{isOnline ? 'Online' : 'Offline'}</span>
            </StatusBadge>

            {/* Role Badge */}
            {profile?.role && <RoleBadge role={profile.role} />}

            {/* Real Storage Usage */}
            <StatusBadge>
              <HardDrive size={10} className="text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">
                {displayFileCount}/{limits.maxFiles} assets • {displayStorageUsedMB.toFixed(1)}MB
              </span>
            </StatusBadge>

            <div className="flex items-center gap-3 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
              <a href="https://www.linkedin.com/in/sahanpramuditha" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary-600 transition-colors">
                <Linkedin size={16} />
              </a>
              <a href="mailto:sahan.dev.tech@gmail.com" className="text-slate-400 hover:text-primary-600 transition-colors">
                <Mail size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section: Navigation, Copyright and Scroll to Top */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/legal/privacy" className="hover:text-primary-600 transition-colors">Privacy</Link>
            <Link to="/legal/terms" className="hover:text-primary-600 transition-colors">Terms</Link>
            <Link to="/support" className="hover:text-primary-600 transition-colors">Support</Link>
            {isAdmin && (
              <button onClick={() => setActiveTab('admin')} className="hover:text-primary-600 transition-colors font-bold text-primary-500">
                Admin Panel
              </button>
            )}
            <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
            <span>&copy; {currentYear} StudyOS</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-primary-600 transition-all rounded-lg border border-slate-200 dark:border-slate-700"
            aria-label="Scroll to top"
          >
            <ChevronUp size={12} />
            BACK TO TOP
          </button>
        </div>
      </div>
    </motion.footer>
  );
};

export default UnifiedFooter;
