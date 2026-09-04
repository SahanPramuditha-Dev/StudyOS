import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Shield, 
  HardDrive, 
  CheckCircle2, 
  XCircle, 
  Search,
  Filter,
  Edit3,
  Settings,
  AlertTriangle,
  Download,
  ArrowUpDown,
  Clock,
  Layout,
  FileText,
  Check,
  UserPlus,
  ClipboardList,
  Activity,
  Server,
  Upload,
  ShieldAlert,
  Sparkles,
  Command,
  Building2,
  Megaphone,
  Zap,
  FileSpreadsheet,
  Code,
  X,
  ChevronLeft,
  ChevronRight,
  UserCog,
  ShieldCheck,
  ArrowRight,
  History,
  User,
  Mail,
  RotateCw,
  Copy,
  Info,
  ExternalLink,
  FileJson,
  BookOpen,
  Key,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FirestoreService } from '../../services/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { EmailService } from '../../services/email';
import { useAuth } from '../../context/AuthContext';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { computeUsageMetrics } from '../../services/usageMetrics';
import { formatStorage as formatStorageUtil } from '../../services/storageService';
import { useQueryClient } from '@tanstack/react-query';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import RoleBuilder from './components/RoleBuilder';
import { AdminUserDrawer } from './components/AdminUserDrawer';
import { AdminAIModule } from './components/AdminAIModule';
import { AdminCommandPalette } from './components/AdminCommandPalette';
import { AdminOrgModule } from './components/AdminOrgModule';
import { AdminBroadcastModule } from './components/AdminBroadcastModule';
import { AdminAutomationModule } from './components/AdminAutomationModule';
import { AdminReportsModule } from './components/AdminReportsModule';
import { AdminStorageModule } from './components/AdminStorageModule';
import { AdminDevModule } from './components/AdminDevModule';

const UserAvatar = ({ user, className = "w-10 h-10 rounded-xl" }) => {
  const avatarUrl = (user?.avatar || user?.photoURL || user?.photoUrl || user?.profileImage || '').trim();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={user?.name || user?.email || 'User'}
        onError={() => setImgError(true)}
        className={`${className} object-cover border border-slate-200 dark:border-slate-700/60 shrink-0`}
      />
    );
  }

  return (
    <div className={`${className} bg-primary-500/10 text-primary-500 border border-primary-500/20 flex items-center justify-center font-black shrink-0`}>
      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
    </div>
  );
};

const Admin = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const ROLE_META = {
    superadmin: { label: 'Platform Owner', short: 'Owner' },
    admin: { label: 'Platform Admin', short: 'Admin' },
    educator: { label: 'Educator / Mentor', short: 'Educator' },
    team_lead: { label: 'Workspace Lead', short: 'Lead' },
    user: { label: 'Student / Learner', short: 'Learner' },
    restricted: { label: 'Auditor / Guest', short: 'Guest' }
  };
  const MODULE_KEYS = ['videos','reminders','notes','analytics','resources','workspace','manageUsers','projects','courses','changePermissions','adminPanel'];
  const ACTION_KEYS = ['create','edit','delete','export'];
  const defaultRoleTemplates = [
    { id: 'tpl-owner', name: 'Platform Owner', role: 'superadmin', modules: [...MODULE_KEYS], actions: [...ACTION_KEYS] },
    { id: 'tpl-admin', name: 'Platform Admin', role: 'admin', modules: [...MODULE_KEYS], actions: [...ACTION_KEYS] },
    { id: 'tpl-educator', name: 'Educator / Mentor', role: 'educator', modules: ['courses', 'videos', 'notes', 'resources', 'projects', 'workspace', 'reminders', 'analytics'], actions: ['create', 'edit', 'export'] },
    { id: 'tpl-team_lead', name: 'Workspace Lead', role: 'team_lead', modules: ['courses', 'videos', 'notes', 'resources', 'projects', 'workspace', 'reminders', 'analytics'], actions: ['create', 'edit', 'delete', 'export'] },
    { id: 'tpl-learner', name: 'Student / Learner', role: 'user', modules: ['courses', 'videos', 'notes', 'resources', 'projects', 'workspace', 'reminders'], actions: ['create', 'edit', 'export'] },
    { id: 'tpl-limited', name: 'Auditor / Guest', role: 'restricted', modules: ['courses', 'videos', 'notes', 'resources', 'reminders'], actions: ['export'] }
  ];
  const buildDefaults = (role) => {
    const modules = {};
    MODULE_KEYS.forEach(k => { modules[k] = false; });
    const actions = {};
    ACTION_KEYS.forEach(k => { actions[k] = false; });
    if (role === 'superadmin') {
      MODULE_KEYS.forEach(k => { modules[k] = true; });
      ACTION_KEYS.forEach(k => { actions[k] = true; });
    } else if (role === 'admin') {
      MODULE_KEYS.forEach(k => { modules[k] = true; });
      modules.analytics = true;
      modules.adminPanel = true;
      modules.manageUsers = true;
      modules.changePermissions = true;
      actions.create = true;
      actions.edit = true;
      actions.delete = true;
      actions.export = true;
    } else if (role === 'restricted') {
      modules.notes = true;
      modules.resources = true;
      actions.create = false;
      actions.edit = false;
      actions.delete = false;
      actions.export = false;
    } else {
      modules.courses = true;
      modules.videos = true;
      modules.notes = true;
      modules.resources = true;
      modules.projects = true;
      modules.workspace = true;
      modules.reminders = true;
      modules.analytics = false;
      modules.adminPanel = false;
      modules.manageUsers = false;
      modules.changePermissions = false;
      actions.create = true;
      actions.edit = true;
      actions.delete = false;
      actions.export = true;
    }
    return { modules, actions };
  };
  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ totalUsers: 0, activeUsers: 0, blockedUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserOriginal, setSelectedUserOriginal] = useState(null);
  const [roleDraft, setRoleDraft] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [inspectUser, setInspectUser] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [activeAdminPage, setActiveAdminPage] = useState('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [auditFeed, setAuditFeed] = useState([]);
  const [bulkImportBusy, setBulkImportBusy] = useState(false);
  
  // Ctrl+K Command Palette Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Phase 2 states
  const [customRoles, setCustomRoles] = useState([]);
  const [systemAuditLogs, setSystemAuditLogs] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserData, setCreateUserData] = useState({ email: '', name: '', password: '' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const { data: platformSettings = { maintenanceMode: false, allowNewSignups: true, globalAnnouncement: '' } } = usePlatformSettings();
  const [bannerDraft, setBannerDraft] = useState('');
  
  // Audit Logs filtering & modal state
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('all');
  const [auditTimeframeFilter, setAuditTimeframeFilter] = useState('all');
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [isRefetchingAudit, setIsRefetchingAudit] = useState(false);
  
  useEffect(() => {
    if (activeAdminPage === 'roles') {
      FirestoreService.getCustomRoles().then(setCustomRoles);
    } else if (activeAdminPage === 'audit') {
      FirestoreService.getAuditLogs(30).then(setSystemAuditLogs);
    } else if (activeAdminPage === 'requests') {
      FirestoreService.getPermissionRequests().then(setPermissionRequests);
    }
  }, [activeAdminPage]);

  useEffect(() => {
    if (platformSettings.globalAnnouncement !== undefined) {
      setBannerDraft(platformSettings.globalAnnouncement);
    }
  }, [platformSettings.globalAnnouncement]);

  const [savingPlatformSettings, setSavingPlatformSettings] = useState(false);
  const importRef = useRef(null);
  const tabsScrollRef = useRef(null);

  const scrollTabs = (direction) => {
    if (tabsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      tabsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  const [roleTemplates, setRoleTemplates] = useStorage('studyos_admin_role_templates', defaultRoleTemplates);
  const [adminFeatureFlags, setAdminFeatureFlags] = useStorage('studyos_admin_feature_flags', {
    githubIntegration: true,
    googleCalendar: true,
    bulkImport: true,
    roleManagement: true,
    advancedAnalytics: true,
    supportTools: true
  });
  const getCloudUsage = (rawUsage) => computeUsageMetrics({ cloudUsage: rawUsage });

  const configHealth = useMemo(() => ({
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    firebaseAuth: Boolean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    firestore: Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    githubOAuth: Boolean(import.meta.env.VITE_GITHUB_CLIENT_ID),
    googleOAuth: Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
    stripe: Boolean(import.meta.env.VITE_STRIPE_PRO_PRICE_ID),
    posthog: Boolean(import.meta.env.VITE_POSTHOG_KEY),
    sentry: Boolean(import.meta.env.VITE_SENTRY_DSN)
  }), []);

  const totalUsers = dashboardStats.totalUsers;
  const activeUsers = dashboardStats.activeUsers;
  const blockedUsers = dashboardStats.blockedUsers;
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length;
  const totalStorageLimit = Math.max(1024, users.reduce((acc, u) => acc + Number(u.limits?.storageMB || 1024), 0));
  const totalStorageUsed = users.reduce((acc, u) => acc + Number(getCloudUsage(u.usage).displayStorageUsedMB || 0), 0);
  const rawPercent = totalStorageLimit > 0 ? Math.round((totalStorageUsed / totalStorageLimit) * 100) : 0;
  const usagePercent = Math.min(100, Math.max(0, rawPercent));
  const recentActivity = auditFeed.slice(0, 5);
  const enabledFeatureCount = Object.values(adminFeatureFlags).filter(Boolean).length;
  const userDirectory = useMemo(() => {
    const map = new Map();
    users.forEach((entry) => {
      if (!entry?.id) return;
      map.set(entry.id, entry);
    });
    if (currentUser?.uid) {
      map.set(currentUser.uid, {
        id: currentUser.uid,
        name: currentUser.displayName || currentUser.email || 'Current user',
        email: currentUser.email || ''
      });
    }
    return map;
  }, [users, currentUser]);
  const featureDefinitions = [
    { key: 'githubIntegration', label: 'GitHub integration', desc: 'Enable repo linking and GitHub syncing.' },
    { key: 'googleCalendar', label: 'Google Calendar', desc: 'Allow reminders and calendar import sync.' },
    { key: 'bulkImport', label: 'Bulk import tools', desc: 'Show CSV/JSON user import flows.' },
    { key: 'roleManagement', label: 'Role management', desc: 'Allow admins to edit user roles and permissions.' },
    { key: 'advancedAnalytics', label: 'Advanced analytics', desc: 'Expose storage, usage, and admin analytics.' },
    { key: 'supportTools', label: 'Support tools', desc: 'Invite users and export/import data packages.' }
  ];
  const updateFeatureFlag = (key) => {
    setAdminFeatureFlags({ ...adminFeatureFlags, [key]: !adminFeatureFlags[key] });
  };
  
  // Storage Formatting Utility
  const formatStorage = (mb) => {
    return formatStorageUtil((Number(mb) || 0) * 1024 * 1024);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Plan', 'Storage Used (MB)', 'Storage Limit (MB)', 'Joined Date'];
    const rows = filteredUsers.map(u => [
      u.name,
      u.email,
      u.role,
      u.status?.isBlocked ? 'Blocked' : (u.status?.isActive ? 'Active' : 'Inactive'),
      u.plan || 'free',
      u.usage?.storageUsedMB || 0,
      u.limits?.storageMB || 0,
      u.createdAt || ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `studyos-users-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Pagination state
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 15;

  useEffect(() => {
    fetchInitialUsers();
    FirestoreService.getAdminDashboardStats().then(setDashboardStats);
  }, []);


  const handleUpdatePlatformSettings = async (updates) => {
    try {
      setSavingPlatformSettings(true);
      await FirestoreService.updatePlatformSettings(updates);
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
      toast.success('Platform settings updated');
    } catch (e) {
      toast.error('Failed to update platform settings');
    } finally {
      setSavingPlatformSettings(false);
    }
  };

  useEffect(() => {
    if (!Array.isArray(roleTemplates) || roleTemplates.length < 3) {
      setRoleTemplates(defaultRoleTemplates);
      return;
    }
    const hasLegacyNames = roleTemplates.some((tpl) => ['Student Standard', 'Teaching Assistant'].includes(tpl?.name));
    if (hasLegacyNames) {
      setRoleTemplates(defaultRoleTemplates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleTemplates, setRoleTemplates]);

  useEffect(() => {
    if (!['audit', 'overview', 'health'].includes(activeAdminPage)) return;
    (async () => {
      const logs = await FirestoreService.getRecentAuditLogs(60);
      setAuditFeed(logs);
    })();
  }, [activeAdminPage]);

  useEffect(() => {
    if (selectedUser) {
      setRoleDraft(selectedUser.role);
      (async () => {
        setAuditLoading(true);
        const logs = await FirestoreService.getAuditLogsForUser(selectedUser.id, 8);
        setAuditLogs(logs);
        setAuditLoading(false);
      })();
    } else {
      setRoleDraft(null);
      setAuditLogs([]);
      setAuditLoading(false);
    }
  }, [selectedUser]);

  const openUserManager = (user) => {
    setSelectedUser(user);
    setSelectedUserOriginal(JSON.parse(JSON.stringify(user)));
  };

  const closeUserManager = () => {
    if (hasUnsavedChanges) {
      setConfirmDiscardOpen(true);
      return;
    }
    setSelectedUser(null);
    setSelectedUserOriginal(null);
  };

  const forceCloseUserManager = () => {
    setSelectedUser(null);
    setSelectedUserOriginal(null);
    setConfirmDiscardOpen(false);
  };

  const hasUnsavedChanges = selectedUser && selectedUserOriginal
    ? (
      selectedUser.role !== selectedUserOriginal.role
      || JSON.stringify(selectedUser.permissions) !== JSON.stringify(selectedUserOriginal.permissions)
      || JSON.stringify(selectedUser.status) !== JSON.stringify(selectedUserOriginal.status)
      || (selectedUser.plan || 'free') !== (selectedUserOriginal.plan || 'free')
      || JSON.stringify(selectedUser.limits) !== JSON.stringify(selectedUserOriginal.limits)
      || JSON.stringify(selectedUser.features) !== JSON.stringify(selectedUserOriginal.features)
    )
    : false;

  const summarizeAuditChanges = (updates = {}) => {
    const summary = [];
    if (!updates || typeof updates !== 'object') return summary;
    if (updates.role) summary.push(`role -> ${updates.role}`);
    if (updates.plan) summary.push(`plan -> ${updates.plan}`);
    if (updates.status?.isActive !== undefined) summary.push(`active -> ${updates.status.isActive ? 'yes' : 'no'}`);
    if (updates.status?.isBlocked !== undefined) summary.push(`blocked -> ${updates.status.isBlocked ? 'yes' : 'no'}`);
    if (updates.limits?.storageMB !== undefined) summary.push(`storage -> ${updates.limits.storageMB}MB`);
    if (updates.limits?.maxCourses !== undefined) summary.push(`maxCourses -> ${updates.limits.maxCourses}`);
    if (updates.permissions?.modules) summary.push('module permissions updated');
    if (updates.permissions?.actions) summary.push('action permissions updated');
    if (updates.features) summary.push('feature flags updated');
    return summary;
  };

  const getAuditTimestamp = (log = {}) => {
    const rawValue = log?.performedAt || log?.timestamp || log?.createdAt || log?.sentAt || '';
    if (!rawValue) return '';
    const date = new Date(rawValue);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  };

  const getAuditTypeLabel = (type = '') => {
    const normalized = String(type || 'event')
      .replace(/[_-]+/g, ' ')
      .trim()
      .toLowerCase();
    if (!normalized) return 'Event';
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getAuditUserLabel = (userId = '', fallback = '') => {
    const profile = userDirectory.get(userId);
    if (profile?.name && profile?.email) return `${profile.name} (${profile.email})`;
    if (profile?.name) return profile.name;
    if (profile?.email) return profile.email;
    return fallback || userId || '';
  };

  const getAuditTargetLabel = (log = {}) => {
    if (log?.targetUserName && log?.targetUserEmail) {
      return `${log.targetUserName} (${log.targetUserEmail})`;
    }
    if (log?.targetUserName) return log.targetUserName;
    if (log?.targetUserId) {
      return getAuditUserLabel(log.targetUserId, 'User record');
    }
    if (log?.targetUserEmail) return log.targetUserEmail;
    if (log?.email) return log.email;
    return 'System event';
  };

  const getAuditActorLabel = (log = {}) => {
    if (log?.performedByName && log?.performedByEmail) {
      return `${log.performedByName} (${log.performedByEmail})`;
    }
    if (log?.performedByName) return log.performedByName;
    if (log?.performedBy) {
      return getAuditUserLabel(log.performedBy, 'Admin');
    }
    if (log?.performedByEmail) return log.performedByEmail;
    return 'System';
  };

  const getAuditSummary = (log = {}) => {
    const changes = summarizeAuditChanges(log?.updates);
    if (changes.length > 0) return changes.join(' • ');
    if (log?.message) return log.message;
    if (log?.subject) return log.subject;
    if (log?.type === 'email_sent') return 'Email was sent successfully';
    return 'No additional details';
  };

  const getAuditMeta = (type = '') => {
    const norm = String(type || '').toLowerCase();
    if (norm.includes('user_update') || norm.includes('admin_update_user') || norm.includes('update_user')) {
      return {
        icon: UserCog,
        badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
        borderAccent: 'border-l-sky-500',
      };
    }
    if (norm.includes('role') || norm.includes('permission')) {
      return {
        icon: ShieldCheck,
        badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
        borderAccent: 'border-l-purple-500',
      };
    }
    if (norm.includes('email') || norm.includes('broadcast') || norm.includes('mail')) {
      return {
        icon: Mail,
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        borderAccent: 'border-l-amber-500',
      };
    }
    if (norm.includes('block') || norm.includes('delete') || norm.includes('revoke') || norm.includes('security')) {
      return {
        icon: ShieldAlert,
        badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        borderAccent: 'border-l-rose-500',
      };
    }
    if (norm.includes('create') || norm.includes('add') || norm.includes('active')) {
      return {
        icon: UserPlus,
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        borderAccent: 'border-l-emerald-500',
      };
    }
    return {
      icon: Activity,
      badgeBg: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
      iconBg: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20',
      borderAccent: 'border-l-primary-500',
    };
  };

  const parseAuditChangeItems = (log = {}) => {
    const items = [];
    const updates = log?.updates;

    if (updates && typeof updates === 'object') {
      if (updates.limits) {
        if (updates.limits.storageMB !== undefined) {
          items.push({
            label: 'Storage Limit',
            value: `${updates.limits.storageMB} MB`,
            icon: HardDrive,
            badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
          });
        }
        if (updates.limits.maxCourses !== undefined) {
          items.push({
            label: 'Max Courses',
            value: `${updates.limits.maxCourses} Courses`,
            icon: BookOpen,
            badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          });
        }
        if (updates.limits.maxFiles !== undefined) {
          items.push({
            label: 'Max Files',
            value: `${updates.limits.maxFiles} Files`,
            icon: FileText,
            badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
          });
        }
        if (updates.limits.maxNotes !== undefined) {
          items.push({
            label: 'Max Notes',
            value: `${updates.limits.maxNotes} Notes`,
            icon: FileText,
            badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
          });
        }
      }

      if (updates.role) {
        items.push({
          label: 'Account Role',
          value: String(updates.role).toUpperCase(),
          icon: Shield,
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
        });
      }

      if (updates.plan) {
        items.push({
          label: 'Subscription Plan',
          value: String(updates.plan).toUpperCase(),
          icon: Zap,
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        });
      }

      if (updates.status?.isActive !== undefined) {
        items.push({
          label: 'Account Status',
          value: updates.status.isActive ? 'Active' : 'Inactive',
          icon: CheckCircle2,
          badgeColor: updates.status.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
        });
      }

      if (updates.status?.isBlocked !== undefined) {
        items.push({
          label: 'Security Access',
          value: updates.status.isBlocked ? 'Blocked' : 'Unblocked',
          icon: AlertTriangle,
          badgeColor: updates.status.isBlocked ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        });
      }

      if (updates.permissions?.modules) {
        items.push({
          label: 'Module Permissions',
          value: 'Updated',
          icon: Key,
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
        });
      }

      if (updates.permissions?.actions) {
        items.push({
          label: 'Action Permissions',
          value: 'Updated',
          icon: Key,
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
        });
      }

      if (updates.features) {
        items.push({
          label: 'Feature Flags',
          value: 'Updated',
          icon: Sparkles,
          badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
        });
      }
    }

    if (items.length > 0) return items;

    // Fallback parsing from text summary or message
    const summary = getAuditSummary(log);
    if (summary && summary !== 'No additional details') {
      const parts = summary.split(' • ');
      parts.forEach((part) => {
        if (part.includes('->')) {
          const [key, val] = part.split('->').map((s) => s.trim());
          let icon = Info;
          if (key.toLowerCase().includes('storage')) icon = HardDrive;
          else if (key.toLowerCase().includes('course')) icon = BookOpen;
          else if (key.toLowerCase().includes('role')) icon = Shield;
          else if (key.toLowerCase().includes('plan')) icon = Zap;
          else if (key.toLowerCase().includes('permission')) icon = Key;
          
          items.push({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: val,
            icon,
            badgeColor: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20'
          });
        } else {
          items.push({
            label: 'Event Detail',
            value: part,
            icon: Info,
            badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
          });
        }
      });
    }

    if (items.length === 0) {
      items.push({
        label: 'Event Summary',
        value: log.message || log.subject || 'System Action Logged',
        icon: Info,
        badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
      });
    }

    return items;
  };

  const renderAuditSummaryBadges = (log = {}) => {
    const changeItems = parseAuditChangeItems(log);
    if (!changeItems || changeItems.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2.5">
        {changeItems.map((item, idx) => {
          const ItemIcon = item.icon || Info;
          return (
            <div 
              key={idx} 
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs"
            >
              <div className="p-1 rounded-lg bg-white dark:bg-slate-900 text-slate-500 shadow-2xs">
                <ItemIcon size={12} />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{item.label}:</span>
                <span className={`font-bold px-1.5 py-0.2 rounded-md border text-[11px] ${item.badgeColor}`}>
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleRefetchAudit = async () => {
    setIsRefetchingAudit(true);
    try {
      const [logs, feed] = await Promise.all([
        FirestoreService.getAuditLogs(100),
        FirestoreService.getRecentAuditLogs(60)
      ]);
      setSystemAuditLogs(logs);
      setAuditFeed(feed);
      toast.success('Audit logs refreshed');
    } catch (e) {
      toast.error('Failed to refresh audit logs');
    } finally {
      setIsRefetchingAudit(false);
    }
  };

  const handleExportAuditCSV = (logsToExport = []) => {
    if (!logsToExport.length) {
      toast.error('No logs available to export');
      return;
    }
    const headers = ['Event ID', 'Type', 'Target', 'Summary', 'Performed By', 'Timestamp'];
    const rows = logsToExport.map((log) => [
      `"${log.id || ''}"`,
      `"${getAuditTypeLabel(log.type)}"`,
      `"${getAuditTargetLabel(log).replace(/"/g, '""')}"`,
      `"${getAuditSummary(log).replace(/"/g, '""')}"`,
      `"${getAuditActorLabel(log).replace(/"/g, '""')}"`,
      `"${getAuditTimestamp(log) || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `studyos-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported as CSV');
  };

  const renderAuditItem = (log, onClickItem = null) => {
    const meta = getAuditMeta(log.type);
    const IconComp = meta.icon;
    const summary = getAuditSummary(log);
    const timeStr = getAuditTimestamp(log);
    const actor = getAuditActorLabel(log);
    const target = getAuditTargetLabel(log);

    return (
      <div 
        key={log.id} 
        onClick={() => onClickItem && onClickItem(log)}
        className={`p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all duration-200 shadow-sm border-l-4 ${meta.borderAccent} group ${onClickItem ? 'cursor-pointer hover:border-primary-500/40 hover:shadow-md' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${meta.iconBg} mt-0.5`}>
            <IconComp size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.badgeBg}`}>
                {getAuditTypeLabel(log.type)}
              </span>
              {timeStr && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  <Clock size={11} className="text-slate-400 shrink-0" />
                  <span>{timeStr}</span>
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-1">
              {target}
            </p>
            {renderAuditSummaryBadges(log)}
            <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/40">
              {actor && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">
                  <User size={11} className="text-slate-400 shrink-0" />
                  <span className="truncate">by {actor}</span>
                </div>
              )}
              {onClickItem && (
                <span className="text-[11px] font-semibold text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-auto">
                  View payload <ChevronRight size={12} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) => (
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    ));
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredUsers.map((u) => u.id);
    const allSelected = visibleIds.every((id) => selectedUserIds.includes(id));
    setSelectedUserIds(allSelected ? selectedUserIds.filter((id) => !visibleIds.includes(id)) : [...new Set([...selectedUserIds, ...visibleIds])]);
  };

  const applyBulkStatus = async (statusUpdates) => {
    if (!selectedUserIds.length) return;
    try {
      await Promise.all(selectedUserIds.map((id) => {
        const target = users.find((u) => u.id === id);
        return FirestoreService.updateUserByAdmin(id, { status: { ...(target?.status || {}), ...statusUpdates } });
      }));
      setUsers((prev) => prev.map((u) => (
        selectedUserIds.includes(u.id) ? { ...u, status: { ...(u.status || {}), ...statusUpdates } } : u
      )));
      toast.success(`Updated ${selectedUserIds.length} user${selectedUserIds.length > 1 ? 's' : ''}`);
      setSelectedUserIds([]);
    } catch {
      toast.error('Bulk update failed');
    }
  };

  const applyBulkRole = async (role) => {
    if (!selectedUserIds.length) return;
    try {
      await Promise.all(selectedUserIds.map((id) => {
        const target = users.find((u) => u.id === id);
        if (id === currentUser?.id) return Promise.resolve();
        const defaults = buildDefaults(role);
        return FirestoreService.updateUserByAdmin(id, { role, permissions: defaults, status: { ...(target?.status || {}), isBlocked: false } });
      }));
      setUsers((prev) => prev.map((u) => {
        if (!selectedUserIds.includes(u.id) || u.id === currentUser?.id) return u;
        const defaults = buildDefaults(role);
        return { ...u, role, permissions: defaults, status: { ...(u.status || {}), isBlocked: false } };
      }));
      toast.success(`Updated role to ${role} for selected users`);
      setSelectedUserIds([]);
    } catch {
      toast.error('Bulk role update failed');
    }
  };

  const applyBulkDelete = async () => {
    if (!selectedUserIds.length) return;
    setConfirmBulkDeleteOpen(true);
  };

  const fetchInitialUsers = async () => {
    try {
      setLoading(true);
      const { users: fetchedUsers, lastVisible: last, hasMore: more } = await FirestoreService.getAllUsers(PAGE_SIZE);
      setUsers(fetchedUsers);
      setLastVisible(last);
      setHasMore(more);
    } catch (error) {
      console.error('[Admin] Error loading users:', error);
      toast.error(`Failed to load users: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    const email = String(inviteEmail || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid invite email');
      return;
    }
    const res = await EmailService.sendEmail(
      email,
      'You are invited to StudyOs',
      'You have been invited to join StudyOs. Sign up and start collaborating in your learning workspace.',
      'Invitation'
    );
    if (res.success) {
      toast.success('Invitation sent');
      setInviteEmail('');
    } else {
      toast.error('Failed to send invite');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const { email, name, password } = createUserData;
    if (!email || !name || !password) {
      toast.error('All fields are required');
      return;
    }
    
    try {
      setIsCreatingUser(true);
      const createUserFn = httpsCallable(functions, 'adminCreateUser');
      await createUserFn({ email, name, password });
      toast.success('User created successfully');
      setShowCreateUserModal(false);
      setCreateUserData({ email: '', name: '', password: '' });
      fetchInitialUsers();
    } catch (error) {
      console.error('[Admin] Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const exportUsersJSON = () => {
    const payload = users.map((u) => ({
      email: u.email,
      name: u.name,
      role: u.role,
      plan: u.plan || 'free',
      isActive: u.status?.isActive !== false,
      isBlocked: u.status?.isBlocked === true
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyos-users-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const importUsersFromFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setBulkImportBusy(true);
      const text = await file.text();
      const rows = JSON.parse(text);
      if (!Array.isArray(rows)) throw new Error('Import file must be an array');
      let updated = 0;
      let invited = 0;
      for (const row of rows) {
        const email = String(row.email || '').toLowerCase();
        if (!email) continue;
        const matched = users.find((u) => String(u.email || '').toLowerCase() === email);
        if (matched) {
          const nextRole = row.role || matched.role || 'user';
          const defaults = buildDefaults(nextRole);
          await FirestoreService.updateUserByAdmin(matched.id, {
            role: nextRole,
            plan: row.plan || matched.plan || 'free',
            status: {
              ...(matched.status || {}),
              isActive: row.isActive !== false,
              isBlocked: row.isBlocked === true
            },
            permissions: defaults
          });
          updated += 1;
        } else {
          await EmailService.sendEmail(
            email,
            'StudyOs invitation',
            'You were added by an administrator. Create your account to access StudyOs.',
            'Invitation'
          );
          invited += 1;
        }
      }
      toast.success(`Import complete: ${updated} updated, ${invited} invited`);
      await fetchInitialUsers();
    } catch (error) {
      toast.error(error?.message || 'Failed to import users');
    } finally {
      setBulkImportBusy(false);
      event.target.value = '';
    }
  };

  const applyRoleTemplate = async (template) => {
    if (!selectedUserIds.length) {
      toast.error('Select users first');
      return;
    }
    const moduleMap = {};
    MODULE_KEYS.forEach((key) => { moduleMap[key] = template.modules.includes(key); });
    const actionMap = {};
    ACTION_KEYS.forEach((key) => { actionMap[key] = template.actions.includes(key); });
    try {
      await Promise.all(selectedUserIds.map((id) => FirestoreService.updateUserByAdmin(id, {
        role: template.role,
        permissions: { modules: moduleMap, actions: actionMap }
      })));
      toast.success(`Applied "${template.name}" template`);
      setSelectedUserIds([]);
      await fetchInitialUsers();
    } catch {
      toast.error('Failed to apply template');
    }
  };

  const renderAdminPageTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: Layout },
      { id: 'ai', label: 'Orion AI', icon: Sparkles },
      { id: 'organizations', label: 'Organizations', icon: Building2 },
      { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
      { id: 'automations', label: 'Automations', icon: Zap },
      { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
      { id: 'storage', label: 'Storage', icon: HardDrive },
      { id: 'dev', label: 'Developer', icon: Code },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'roles', label: 'Roles', icon: ClipboardList },
      { id: 'requests', label: 'Access Requests', icon: ShieldAlert, badge: permissionRequests.length },
      { id: 'features', label: 'Features', icon: Settings },
      { id: 'audit', label: 'Audit Logs', icon: Activity },
      { id: 'health', label: 'System Health', icon: Server },
      { id: 'platform', label: 'Platform Settings', icon: Settings },
      { id: 'support', label: 'Support', icon: UserPlus }
    ];

    const currentTab = tabs.find(t => t.id === activeAdminPage);

    return (
      <div className="space-y-6">
        {/* Top Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white shadow-xl shadow-slate-900/10 border border-slate-700/30 flex items-center justify-center shrink-0">
              <Shield size={28} className="text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  Admin Command Center
                </h1>
                {currentTab && (
                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                    {currentTab.label}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-0.5">
                Manage platform operations, security roles, system health, and configurations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black tracking-wider uppercase inline-flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Command size={14} className="text-primary-400 dark:text-primary-600" />
              <span>Search (Ctrl+K)</span>
            </button>
          </div>
        </div>

        {/* Horizontal Tab Rail */}
        <div className="relative flex items-center group">
          <button
            onClick={() => scrollTabs('left')}
            className="absolute -left-3 z-10 p-2 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center"
            title="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={tabsScrollRef}
            className="w-full flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {tabs.map((tab) => {
              const isActive = activeAdminPage === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAdminPage(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap inline-flex items-center gap-2 transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md ring-1 ring-slate-900/10 dark:ring-white/20 scale-[1.02]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <TabIcon size={15} className={isActive ? 'text-primary-400 dark:text-primary-600' : 'text-slate-400 dark:text-slate-500'} />
                  <span>{tab.label}</span>
                  {Boolean(tab.badge) && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                      isActive 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollTabs('right')}
            className="absolute -right-3 z-10 p-2 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center"
            title="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const loadMoreUsers = async () => {
    if (!lastVisible || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const { users: fetchedUsers, lastVisible: last, hasMore: more } = await FirestoreService.getAllUsers(PAGE_SIZE, lastVisible);
      setUsers(prev => [...prev, ...fetchedUsers]);
      setLastVisible(last);
      setHasMore(more);
    } catch (error) {
      toast.error('Failed to load more users');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    if (userId === currentUser?.id) {
      if (updates?.role && updates.role !== 'superadmin') {
        toast.error('You cannot downgrade your own account here');
        return;
      }
      if (updates?.status?.isBlocked === true || updates?.status?.isActive === false) {
        toast.error('You cannot block/deactivate your own account');
        return;
      }
    }

    const prevUsers = users;
    const prevSelected = selectedUser;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => ({ ...prev, ...updates }));
      if (updates.role) setRoleDraft(updates.role);
    }
    try {
      await FirestoreService.updateUserByAdmin(userId, updates);
      toast.success('User updated successfully');

      // If role was updated, send notification email
      if (updates.role && prevSelected && prevSelected.id === userId) {
        const changes = {
          granted: [],
          restricted: []
        };

        // Determine granted features based on module permissions in updates or defaults
        const perms = updates.permissions?.modules || buildDefaults(updates.role).modules;
        const oldPerms = prevSelected.permissions?.modules || {};

        MODULE_KEYS.forEach(key => {
          if (perms[key] && !oldPerms[key]) {
            changes.granted.push(key.replace(/([A-Z])/g, ' $1').toLowerCase());
          } else if (!perms[key] && oldPerms[key]) {
            changes.restricted.push(key.replace(/([A-Z])/g, ' $1').toLowerCase());
          }
        });

        // Add action changes
        const actions = updates.permissions?.actions || buildDefaults(updates.role).actions;
        const oldActions = prevSelected.permissions?.actions || {};
        ACTION_KEYS.forEach(key => {
          if (actions[key] && !oldActions[key]) {
            changes.granted.push(`ability to ${key} items`);
          } else if (!actions[key] && oldActions[key]) {
            changes.restricted.push(`ability to ${key} items`);
          }
        });

        EmailService.sendRoleChangeNotification(
          prevSelected.email,
          prevSelected.name,
          updates.role,
          changes
        ).catch(err => console.error('[Admin] Failed to send notification email:', err));
      }
    } catch (error) {
      setUsers(prevUsers);
      setSelectedUser(prevSelected);
      toast.error('Failed to update user');
    }
  };

  const getStatusColor = (user) => {
    if (user.status?.isBlocked) return 'bg-red-100 text-red-600';
    if (user.status?.isActive) return 'bg-green-100 text-green-600';
    return 'bg-slate-100 text-slate-600';
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMap = {
      'All': null,
      'Platform Owner': 'superadmin',
      'Admin Manager': 'admin',
      'Learner': 'user',
      'Limited Access': 'restricted'
    };
    const matchesRole = !roleMap[filterRole] || u.role === roleMap[filterRole];
    
    let matchesStatus = true;
    if (filterStatus === 'Active') matchesStatus = u.status?.isActive && !u.status?.isBlocked;
    if (filterStatus === 'Inactive') matchesStatus = !u.status?.isActive;
    if (filterStatus === 'Blocked') matchesStatus = u.status?.isBlocked;
    
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    // Nested field handling
    if (sortField === 'storageUsed') {
      aVal = a.usage?.storageUsedMB || 0;
      bVal = b.usage?.storageUsedMB || 0;
    } else if (sortField === 'storageLimit') {
      aVal = a.limits?.storageMB || 0;
      bVal = b.limits?.storageMB || 0;
    } else if (sortField === 'status') {
      aVal = a.status?.isActive ? 1 : 0;
      bVal = b.status?.isActive ? 1 : 0;
    }

    if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  if (loading) {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]"></div>
            <div className="space-y-2">
              <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-4 w-48 bg-slate-100 dark:bg-slate-900 rounded-lg ml-4"></div>
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 h-24"></div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-14 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800"></div>
          <div className="w-48 h-14 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminPage === 'overview') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50' },
            { label: 'Active Users', value: activeUsers, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Admin Accounts', value: adminUsers, icon: Shield, color: 'text-slate-900', bg: 'bg-slate-100' },
            { label: 'Storage Used', value: `${usagePercent}%`, icon: HardDrive, color: 'text-blue-500', bg: 'bg-blue-50' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
              <div className={`p-4 rounded-2xl ${stat.bg} dark:bg-opacity-10 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Platform Health</h2>
              <button onClick={() => setActiveAdminPage('health')} className="text-sm font-bold text-primary-500">View Details</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Online', ok: configHealth.online },
                { label: 'Firebase', ok: configHealth.firebaseAuth && configHealth.firestore },
                { label: 'GitHub', ok: configHealth.githubOAuth },
                { label: 'Google', ok: configHealth.googleOAuth },
                { label: 'Stripe', ok: configHealth.stripe },
                { label: 'PostHog', ok: configHealth.posthog }
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className={`mt-2 text-sm font-black ${item.ok ? 'text-green-600' : 'text-amber-600'}`}>
                    {item.ok ? 'Healthy' : 'Needs setup'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
                  <Activity size={18} />
                </div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  Recent Admin Activity
                  {recentActivity.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold">
                      {recentActivity.length}
                    </span>
                  )}
                </h2>
              </div>
              <button 
                onClick={() => setActiveAdminPage('audit')} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200/50 dark:border-primary-800/40 transition-all duration-200 group"
              >
                <span>Open Logs</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {recentActivity.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <History size={20} />
                  </div>
                  <p className="text-sm font-medium text-slate-400">No recent admin activity yet.</p>
                </div>
              )}
              {recentActivity.map((log) => renderAuditItem(log))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminPage === 'ai') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <AdminAIModule onUpdateSettings={(updates) => toast.success('AI settings updated')} />
      </div>
    );
  }

  if (activeAdminPage === 'organizations') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <AdminOrgModule />
      </div>
    );
  }

  if (activeAdminPage === 'broadcasts') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <AdminBroadcastModule />
      </div>
    );
  }

  if (activeAdminPage === 'automations') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <AdminAutomationModule />
      </div>
    );
  }

  if (activeAdminPage === 'reports') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <AdminReportsModule users={users} />
      </div>
    );
  }

  if (activeAdminPage === 'storage') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <AdminStorageModule users={users} />
      </div>
    );
  }

  if (activeAdminPage === 'dev') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <AdminDevModule />
      </div>
    );
  }

  if (activeAdminPage === 'features') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-black">Feature Flags</h2>
              <p className="text-sm text-slate-500">Control which product surfaces are emphasized for admins and users.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdminFeatureFlags({
                  githubIntegration: true,
                  googleCalendar: true,
                  bulkImport: true,
                  roleManagement: true,
                  advancedAnalytics: true,
                  supportTools: true
                })}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
              >
                Reset Defaults
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureDefinitions.map((feature) => {
              const enabled = !!adminFeatureFlags[feature.key];
              return (
                <button
                  key={feature.key}
                  onClick={() => updateFeatureFlag(feature.key)}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    enabled
                      ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-800 dark:text-white">{feature.label}</p>
                      <p className="text-sm text-slate-500 mt-1">{feature.desc}</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-6' : 'left-0.5'}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminPage === 'support') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h2 className="text-xl font-black">Support Tools</h2>
            <p className="text-sm text-slate-500">Invite users, import data, and export backups without hunting through the user table.</p>
            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                placeholder="new-user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              <button onClick={sendInvitation} className="px-4 py-2.5 rounded-xl bg-primary-500 text-white font-bold inline-flex items-center gap-2">
                <UserPlus size={16} />
                Send Invite
              </button>
              <button onClick={() => setShowCreateUserModal(true)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-white font-bold inline-flex items-center gap-2">
                <UserPlus size={16} />
                Create User
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button onClick={exportToCSV} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold">
                <Download size={16} />
                CSV
              </button>
              <button onClick={exportUsersJSON} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold">
                <Download size={16} />
                JSON
              </button>
              <button onClick={() => importRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold">
                <Upload size={16} />
                {bulkImportBusy ? 'Importing...' : 'Import'}
              </button>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importUsersFromFile} />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-xl font-black">Support Snapshot</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total users', value: totalUsers },
                { label: 'Blocked', value: blockedUsers },
                { label: 'Admin roles', value: adminUsers },
                { label: 'Feature flags', value: enabledFeatureCount }
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-500">
                Use this panel to manage onboarding and data movement for non-technical users.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminPage === 'roles') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <RoleBuilder 
          roles={customRoles} 
          onRoleUpdate={() => FirestoreService.getCustomRoles().then(setCustomRoles)} 
        />
      </div>
    );
  }

  if (activeAdminPage === 'audit') {
    const rawLogs = systemAuditLogs.length > 0 ? systemAuditLogs : auditFeed;

    // Filtering logic
    const filteredAuditLogs = rawLogs.filter((log) => {
      // 1. Text Search Query
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        const target = getAuditTargetLabel(log).toLowerCase();
        const actor = getAuditActorLabel(log).toLowerCase();
        const summary = getAuditSummary(log).toLowerCase();
        const type = getAuditTypeLabel(log.type).toLowerCase();
        const id = String(log.id || '').toLowerCase();
        const matches = target.includes(q) || actor.includes(q) || summary.includes(q) || type.includes(q) || id.includes(q);
        if (!matches) return false;
      }

      // 2. Action Category Filter
      if (auditCategoryFilter !== 'all') {
        const norm = String(log.type || '').toLowerCase();
        if (auditCategoryFilter === 'user' && !norm.includes('user')) return false;
        if (auditCategoryFilter === 'security' && !norm.includes('role') && !norm.includes('permission') && !norm.includes('block') && !norm.includes('revoke')) return false;
        if (auditCategoryFilter === 'communication' && !norm.includes('email') && !norm.includes('broadcast') && !norm.includes('mail')) return false;
      }

      // 3. Timeframe Filter
      if (auditTimeframeFilter !== 'all') {
        const logTime = new Date(log.performedAt || log.timestamp || log.createdAt || 0).getTime();
        if (logTime > 0) {
          const now = Date.now();
          const diffMs = now - logTime;
          if (auditTimeframeFilter === 'today' && diffMs > 24 * 60 * 60 * 1000) return false;
          if (auditTimeframeFilter === '7days' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
          if (auditTimeframeFilter === '30days' && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      return true;
    });

    // KPI Metrics
    const totalCount = rawLogs.length;
    const userUpdatesCount = rawLogs.filter(l => (l.type || '').toLowerCase().includes('user')).length;
    const securityCount = rawLogs.filter(l => {
      const t = (l.type || '').toLowerCase();
      return t.includes('role') || t.includes('permission') || t.includes('block');
    }).length;
    const commsCount = rawLogs.filter(l => {
      const t = (l.type || '').toLowerCase();
      return t.includes('email') || t.includes('broadcast') || t.includes('mail');
    }).length;

    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}

        {/* Stats KPI Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Audit Events', value: totalCount, icon: History, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-950/40' },
            { label: 'User Updates', value: userUpdatesCount, icon: UserCog, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/40' },
            { label: 'Security & Roles', value: securityCount, icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40' },
            { label: 'Communications', value: commsCount, icon: Mail, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Audit Log Controls & Feed */}
        <div className="card space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                System Audit Logs
                <span className="px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold">
                  {filteredAuditLogs.length} of {totalCount}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Real-time inspection of administrative updates, security actions, and system broadcasts</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleRefetchAudit}
                disabled={isRefetchingAudit}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-700/60"
              >
                <RotateCw size={14} className={isRefetchingAudit ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => handleExportAuditCSV(filteredAuditLogs)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search target, actor, action or changes..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              {auditSearchQuery && (
                <button
                  onClick={() => setAuditSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Select */}
            <div className="md:col-span-3">
              <select
                value={auditCategoryFilter}
                onChange={(e) => setAuditCategoryFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="all">All Action Types</option>
                <option value="user">User Updates</option>
                <option value="security">Security & Roles</option>
                <option value="communication">Email & Broadcasts</option>
              </select>
            </div>

            {/* Timeframe Select */}
            <div className="md:col-span-3">
              <select
                value={auditTimeframeFilter}
                onChange={(e) => setAuditTimeframeFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="all">All Time</option>
                <option value="today">Past 24 Hours</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
              </select>
            </div>
          </div>

          {/* Active Filter Indicators / Clear Button */}
          {(auditSearchQuery || auditCategoryFilter !== 'all' || auditTimeframeFilter !== 'all') && (
            <div className="flex items-center justify-between bg-primary-50/50 dark:bg-primary-950/20 px-4 py-2 rounded-xl border border-primary-100 dark:border-primary-900/40 text-xs text-primary-700 dark:text-primary-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold">Active Filters:</span>
                {auditSearchQuery && (
                  <span className="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/60 font-mono">
                    "{auditSearchQuery}"
                  </span>
                )}
                {auditCategoryFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/60 capitalize">
                    Category: {auditCategoryFilter}
                  </span>
                )}
                {auditTimeframeFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/60">
                    Timeframe: {auditTimeframeFilter}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setAuditSearchQuery('');
                  setAuditCategoryFilter('all');
                  setAuditTimeframeFilter('all');
                }}
                className="font-bold text-primary-600 dark:text-primary-400 hover:underline shrink-0 ml-2"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Audit Logs List */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
            {filteredAuditLogs.length === 0 && (
              <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Filter size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No matching audit logs</h3>
                <p className="text-xs text-slate-400 mt-1">Try broadening your search query or clearing filter selections.</p>
              </div>
            )}
            {filteredAuditLogs.map((log) => renderAuditItem(log, (item) => setSelectedAuditLog(item)))}
          </div>
        </div>

        {/* Audit Log Detail Inspector Modal */}
        <AnimatePresence>
          {selectedAuditLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-500">
                      <FileJson size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white">Audit Event Details</h3>
                      <p className="text-xs text-slate-400">Full payload and system metadata trace</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAuditLog(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                  {/* Action Banner */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-500 border border-primary-500/20">
                        <Activity size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">Action Type</span>
                        <p className="text-base font-black text-slate-800 dark:text-slate-100">
                          {getAuditTypeLabel(selectedAuditLog.type)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" />
                        {getAuditTimestamp(selectedAuditLog) || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Target & Actor Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-black text-sm flex items-center justify-center shrink-0 border border-sky-500/20">
                        {getAuditTargetLabel(selectedAuditLog).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Target Account / Resource</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {getAuditTargetLabel(selectedAuditLog)}
                        </p>
                        {selectedAuditLog.targetUserId && (
                          <div className="flex items-center gap-1 mt-1.5 text-[11px] font-mono text-slate-400">
                            <span>ID:</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{selectedAuditLog.targetUserId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-sm flex items-center justify-center shrink-0 border border-purple-500/20">
                        {getAuditActorLabel(selectedAuditLog).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Executed By (Actor)</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {getAuditActorLabel(selectedAuditLog)}
                        </p>
                        {selectedAuditLog.performedBy && (
                          <div className="flex items-center gap-1 mt-1.5 text-[11px] font-mono text-slate-400">
                            <span>Actor ID:</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{selectedAuditLog.performedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Structured Field Changes Grid */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                      <Sparkles size={14} className="text-primary-500" />
                      Summary of Modified Attributes
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {parseAuditChangeItems(selectedAuditLog).map((item, idx) => {
                        const ItemIcon = item.icon || Info;
                        return (
                          <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 shadow-2xs">
                                <ItemIcon size={16} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5">{item.value}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${item.badgeColor}`}>
                              Updated
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Full JSON Payload */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Raw Document Payload</h4>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedAuditLog, null, 2));
                          toast.success('Payload copied to clipboard');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:underline px-2.5 py-1 rounded-lg bg-primary-500/10"
                      >
                        <Copy size={12} />
                        <span>Copy JSON</span>
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-slate-950 text-sky-400 font-mono text-[11px] overflow-x-auto border border-slate-800/80 max-h-48 custom-scrollbar leading-relaxed">
                      {JSON.stringify(selectedAuditLog, null, 2)}
                    </pre>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (activeAdminPage === 'requests') {
    const handleApprove = async (req) => {
      try {
        const reviewerId = currentUser?.uid || currentUser?.id;
        await FirestoreService.updatePermissionRequest(req.id, 'approved', reviewerId, req);
        setPermissionRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
        toast.success(`Request approved! User granted role ${req.targetRole || req.requestedResource}`);
      } catch (e) {
        toast.error('Failed to approve request');
      }
    };
    const handleDeny = async (req) => {
      try {
        const reviewerId = currentUser?.uid || currentUser?.id;
        await FirestoreService.updatePermissionRequest(req.id, 'denied', reviewerId, req);
        setPermissionRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'denied' } : r));
        toast.success('Request denied');
      } catch (e) {
        toast.error('Failed to deny request');
      }
    };

    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Permission & Role Access Requests</h2>
              <p className="text-xs text-slate-400 font-medium">Review and approve self-service role escalation requests from users.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-primary-500/10 text-primary-500 border border-primary-500/20">
              {permissionRequests.filter(r => r.status === 'pending').length} Pending
            </span>
          </div>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {permissionRequests.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No access requests submitted yet.
              </div>
            )}
            {permissionRequests.map((req) => (
              <div key={req.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-start hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-800 dark:text-white">{req.userName || req.userEmail || req.userId}</p>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Current: {req.currentRole || 'user'}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Requested Role: <span className="font-bold text-primary-500 uppercase tracking-wider">{req.targetRole || req.requestedResource}</span>
                  </p>
                  {req.reason && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                      "{req.reason}"
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Submitted: {req.createdAt ? new Date(req.createdAt).toLocaleString() : 'Recently'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {req.status === 'pending' ? (
                    <>
                      <button onClick={() => handleApprove(req)} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20">Approve</button>
                      <button onClick={() => handleDeny(req)} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-widest transition-all">Deny</button>
                    </>
                  ) : (
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (activeAdminPage === 'platform') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <div className="card space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-500 flex items-center justify-center">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black">Global Platform Settings</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Control application-wide states.</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-bold">Maintenance Mode</p>
                <p className="text-xs text-slate-500 mt-1">Block non-admins from accessing the application.</p>
              </div>
              <button
                onClick={() => handleUpdatePlatformSettings({ maintenanceMode: !platformSettings.maintenanceMode })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${platformSettings.maintenanceMode ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${platformSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-bold">Allow New Signups</p>
                <p className="text-xs text-slate-500 mt-1">Allow new users to create accounts.</p>
              </div>
              <button
                onClick={() => handleUpdatePlatformSettings({ allowNewSignups: !platformSettings.allowNewSignups })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${platformSettings.allowNewSignups ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${platformSettings.allowNewSignups ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-bold">Global Announcement Banner</p>
                <p className="text-xs text-slate-500 mt-1">Show a banner to all users across the top of the app.</p>
              </div>
              <textarea
                value={bannerDraft}
                onChange={(e) => setBannerDraft(e.target.value)}
                placeholder="We will be undergoing maintenance on Sunday..."
                className="w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                rows={2}
              />
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleUpdatePlatformSettings({ globalAnnouncement: bannerDraft })}
                  disabled={savingPlatformSettings}
                  className="px-4 py-2 bg-primary-500 text-white font-bold rounded-lg text-sm"
                >
                  {savingPlatformSettings ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminPage === 'health') {
    return (
      <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: totalUsers },
            { label: 'Active Users', value: activeUsers },
            { label: 'Blocked Users', value: blockedUsers },
            { label: 'Storage Utilization', value: `${usagePercent}%` }
          ].map((card) => (
            <div key={card.label} className="card">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-black">{card.label}</p>
              <p className="text-2xl font-black mt-1 text-slate-800 dark:text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h2 className="text-xl font-black">Environment Status</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Online', ok: configHealth.online },
                { label: 'Firebase Auth', ok: configHealth.firebaseAuth },
                { label: 'Firestore', ok: configHealth.firestore },
                { label: 'GitHub OAuth', ok: configHealth.githubOAuth },
                { label: 'Google OAuth', ok: configHealth.googleOAuth },
                { label: 'Stripe', ok: configHealth.stripe }
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className={`text-sm font-black mt-1 ${item.ok ? 'text-green-600' : 'text-amber-600'}`}>
                    {item.ok ? 'Ready' : 'Missing'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-xl font-black">Operational Notes</h2>
            <div className="space-y-3 text-sm text-slate-500">
              <p>Support tools and data import/export live in the Support tab.</p>
              <p>Feature flags are controlled separately so you can stage rollout-safe changes.</p>
              <p>Audit logs track role edits, blocking actions, and user updates.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-10">
      {renderAdminPageTabs()}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
            <div className="p-3 rounded-[1.5rem] bg-slate-900 text-white shadow-xl">
              <Shield size={32} />
            </div>
            Admin Command Center
          </h1>
          <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs mt-2">Manage users, permissions, and system limits</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold">
            <Download size={16} />
            CSV
          </button>
          <button onClick={exportUsersJSON} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold">
            <Download size={16} />
            JSON
          </button>
          <button onClick={() => importRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold">
            <Upload size={16} />
            {bulkImportBusy ? 'Importing...' : 'Import'}
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importUsersFromFile} />
        </div>
      </div>
      <div className="card">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Invitation Flow</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            placeholder="new-user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
          <button onClick={sendInvitation} className="px-4 py-2.5 rounded-xl bg-primary-500 text-white font-bold inline-flex items-center gap-2">
            <UserPlus size={16} />
            Send Invite
          </button>
        </div>
      </div>

      {/* Stats Layer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50' },
          { label: 'Super Admins', value: users.filter(u => u.role === 'superadmin').length, icon: Shield, color: 'text-slate-900', bg: 'bg-slate-100' },
          { label: 'Active Profiles', value: users.filter(u => u.status?.isActive).length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Total Storage Capacity', value: formatStorage(users.reduce((acc, u) => acc + (u.limits?.storageMB || 0), 0)), icon: HardDrive, color: 'text-blue-500', bg: 'bg-blue-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${stat.bg} dark:bg-opacity-10 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-500/20 outline-none transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400 mr-2" />
            {['All', 'Platform Owner', 'Admin Manager', 'Learner', 'Limited Access'].map(role => (
              <button
                key={role}
                onClick={() => setFilterType(role)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterRole === role 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:border-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Filter size={18} className="text-slate-400 mr-2" />
            {['All', 'Active', 'Inactive', 'Blocked'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === status 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:border-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        {selectedUserIds.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-slate-500">{selectedUserIds.length} selected</span>
            <button onClick={() => applyBulkStatus({ isActive: true })} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700">Activate</button>
            <button onClick={() => applyBulkStatus({ isActive: false })} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">Deactivate</button>
            <button onClick={() => applyBulkStatus({ isBlocked: true })} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700">Block</button>
            <button onClick={() => applyBulkStatus({ isBlocked: false })} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">Unblock</button>
            <button onClick={() => applyBulkRole('user')} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700">Set User</button>
            <button onClick={() => applyBulkRole('restricted')} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-700">Set Limited</button>
            <button onClick={applyBulkDelete} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-600 text-white shadow-sm hover:bg-red-700 ml-auto">Delete</button>
            <button onClick={() => setSelectedUserIds([])} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-700">Clear</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-4">
                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.includes(u.id))
                        ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30'
                        : 'bg-slate-800/80 border-slate-600 text-transparent hover:border-primary-400'
                    }`}
                    aria-label="Select all visible users"
                  >
                    <Check size={13} />
                  </button>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-primary-500 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    User
                    {sortField === 'name' && <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-primary-500 transition-colors"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    Role
                    {sortField === 'role' && <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-primary-500 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'status' && <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-primary-500 transition-colors"
                  onClick={() => handleSort('storageUsed')}
                >
                  <div className="flex items-center gap-1">
                    Usage
                    {sortField === 'storageUsed' && <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => toggleUserSelection(user.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        selectedUserIds.includes(user.id)
                          ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30'
                          : 'bg-slate-800/80 border-slate-600 text-transparent hover:border-primary-400'
                      }`}
                      aria-label={`Select ${user.name || 'user'}`}
                    >
                      <Check size={13} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} className="w-10 h-10 rounded-xl text-base" />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      user.role === 'superadmin' ? 'bg-slate-900 text-white' : 
                      user.role === 'admin' ? 'bg-indigo-500 text-white' : 
                      user.role === 'restricted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                      'bg-blue-50 text-blue-600 dark:bg-blue-500/10'
                    }`}>
                      {ROLE_META[user.role]?.short || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.status?.isActive ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                      <span className={`text-xs font-bold ${user.status?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {user.status?.isBlocked ? 'Blocked' : user.status?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {formatStorage(getCloudUsage(user.usage).displayStorageUsedMB || 0)} / {formatStorage(user.limits?.storageMB || 0)}
                      </p>
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${((getCloudUsage(user.usage).displayStorageUsedMB || 0) / (user.limits?.storageMB || 1)) > 0.9 ? 'bg-red-500' : 'bg-primary-500'}`} 
                          style={{ width: `${Math.min(100, ((getCloudUsage(user.usage).displayStorageUsedMB || 0) / (user.limits?.storageMB || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setInspectUser(user)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                        title="Inspect User Details"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={() => openUserManager(user)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
                        title="Edit User"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => handleUpdateUser(user.id, { status: { ...user.status, isBlocked: !user.status?.isBlocked } })}
                        className={`p-2 rounded-xl transition-all ${
                          user.status?.isBlocked 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                        title={user.status?.isBlocked ? 'Unblock User' : 'Block User'}
                      >
                        <Shield size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          openUserManager(user);
                          setConfirmDeleteOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Delete User"
                      >
                        <AlertTriangle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={loadMoreUsers}
            disabled={loadingMore}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all
              ${loadingMore 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1'
              }
            `}
          >
            {loadingMore ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                Loading More...
              </>
            ) : (
              'Load More Users'
            )}
          </button>
        </div>
      )}

      {/* User Management Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeUserManager}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-[1400px] shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[94vh] overflow-hidden flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center gap-5 border-b border-slate-100 dark:border-slate-800 px-6 md:px-8 py-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur shrink-0">
                <UserAvatar user={selectedUser} className="w-14 h-14 rounded-2xl text-xl" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black text-slate-800 dark:text-white truncate">{selectedUser.name || 'User Profile'}</h2>
                  <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{selectedUser.email}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Clock size={12} />
                    Last Login
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                  </p>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${hasUnsavedChanges ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {hasUnsavedChanges ? '● Unsaved Changes' : '✓ All Changes Saved'}
                  </p>
                </div>
                <button 
                  onClick={closeUserManager} 
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors ml-3 shrink-0"
                  title="Close Modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 py-6 space-y-8">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={14} className="text-primary-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Recent Admin Activity</h3>
                  </div>
                  {auditLoading ? (
                    <p className="text-xs text-slate-400">Loading activity...</p>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400">No recent audit entries for this user.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                      {auditLogs.map((log) => renderAuditItem(log))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Role & Status */}
                <div className="space-y-7">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['user', 'restricted', 'admin', 'superadmin'].map(role => {
                        const locked = role === 'superadmin' && selectedUser.role !== 'superadmin';
                        const isSelected = (roleDraft ?? selectedUser.role) === role;
                        return (
                          <button
                            key={role}
                            disabled={locked}
                            onClick={() => {
                              const defaults = buildDefaults(role);
                              setRoleDraft(role);
                              setSelectedUser(prev => ({ ...prev, role, permissions: defaults }));
                            }}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                              isSelected 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg dark:bg-white dark:text-slate-900 dark:border-white' 
                                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            } ${locked ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            <span>{ROLE_META[role]?.label || role}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Status</label>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setSelectedUser(prev => ({ ...prev, status: { ...prev.status, isActive: !prev.status?.isActive } }))}
                        className={`w-full py-3 rounded-xl border transition-all flex items-center justify-center gap-3 ${
                          selectedUser.status?.isActive 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                        }`}
                      >
                        {selectedUser.status?.isActive ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        <span className="font-black uppercase tracking-widest text-[10px]">
                          {selectedUser.status?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                      <button
                        onClick={() => setSelectedUser(prev => ({ ...prev, status: { ...prev.status, isBlocked: !prev.status?.isBlocked } }))}
                        className={`w-full py-3 rounded-xl border transition-all flex items-center justify-center gap-3 ${
                          selectedUser.status?.isBlocked 
                            ? 'bg-red-600 text-white border-red-600 shadow-lg' 
                            : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
                        }`}
                      >
                        <AlertTriangle size={18} />
                        <span className="font-black uppercase tracking-widest text-[10px]">
                          {selectedUser.status?.isBlocked ? 'Blocked' : 'Block User'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['free', 'pro'].map(plan => {
                        const isSelected = (selectedUser.plan || 'free') === plan;
                        return (
                          <button
                            key={plan}
                            onClick={() => {
                              const limits = plan === 'pro' 
                                ? { storageMB: 100, maxFiles: 1000, maxCourses: 100, maxNotes: 1000 }
                                : { storageMB: 10, maxFiles: 50, maxCourses: 10, maxNotes: 100 };
                              setSelectedUser(prev => ({ ...prev, plan, limits: { ...prev.limits, ...limits } }));
                            }}
                            className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                              isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-lg dark:bg-white dark:text-slate-900 dark:border-white' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                          >
                            {plan}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Middle Column: Usage Breakdown */}
                <div className="space-y-7">
                  <div className="space-y-5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Storage Allocation</label>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl space-y-4 border border-slate-100 dark:border-slate-800/50">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Used</p>
                          <p className="text-xl font-black text-slate-800 dark:text-white">{formatStorage(getCloudUsage(selectedUser.usage).displayStorageUsedMB || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quota</p>
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{formatStorage(selectedUser.limits?.storageMB || 0)}</p>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${((getCloudUsage(selectedUser.usage).displayStorageUsedMB || 0) / (selectedUser.limits?.storageMB || 1)) > 0.9 ? 'bg-red-500' : 'bg-primary-500'}`}
                          style={{ width: `${Math.min(100, ((getCloudUsage(selectedUser.usage).displayStorageUsedMB || 0) / (selectedUser.limits?.storageMB || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { label: 'Courses', value: selectedUser.usage?.courseCount || 0, icon: Layout, color: 'text-blue-500' },
                        { label: 'Notes', value: selectedUser.usage?.noteCount || 0, icon: FileText, color: 'text-amber-500' },
                        { label: 'Total Files', value: getCloudUsage(selectedUser.usage).displayFileCount || 0, icon: HardDrive, color: 'text-indigo-500' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 ${item.color}`}>
                              <item.icon size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</p>
                          </div>
                          <p className="text-sm font-black text-slate-800 dark:text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manual Adjustments</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Storage (MB)</p>
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none border border-transparent focus:border-primary-500/20"
                            value={selectedUser.limits?.storageMB || 0}
                            onChange={(e) => setSelectedUser(prev => ({ ...prev, limits: { ...prev.limits, storageMB: parseInt(e.target.value) || 0 } }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Max Courses</p>
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none border border-transparent focus:border-primary-500/20"
                            value={selectedUser.limits?.maxCourses || 0}
                            onChange={(e) => setSelectedUser(prev => ({ ...prev, limits: { ...prev.limits, maxCourses: parseInt(e.target.value) || 0 } }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Permissions */}
                <div className="space-y-7">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Module Permissions</label>
                      <button 
                        onClick={() => {
                          const allOn = {};
                          MODULE_KEYS.forEach(k => allOn[k] = true);
                          setSelectedUser(prev => ({ ...prev, permissions: { ...prev.permissions, modules: allOn } }));
                        }}
                        className="text-[9px] font-black text-primary-500 uppercase tracking-tighter hover:underline"
                      >
                        Enable All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {MODULE_KEYS.map(key => {
                        const hasModules = !!selectedUser.permissions?.modules;
                        const isEnabled = hasModules 
                          ? !!selectedUser.permissions.modules?.[key]
                          : !!selectedUser.permissions?.[key];
                        
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              if (hasModules) {
                                const newModules = { ...(selectedUser.permissions.modules || {}) };
                                newModules[key] = !isEnabled;
                                setSelectedUser(prev => ({ ...prev, permissions: { ...prev.permissions, modules: newModules } }));
                              } else {
                                const current = { ...(selectedUser.permissions || {}) };
                                current[key] = !isEnabled;
                                setSelectedUser(prev => ({ ...prev, permissions: current }));
                              }
                            }}
                            className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${
                              isEnabled 
                                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/30 font-bold' 
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-400 opacity-60'
                            }`}
                          >
                            <span className="truncate">{key}</span>
                            {isEnabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action Permissions</label>
                      <button 
                        onClick={() => {
                          const allOn = {};
                          ACTION_KEYS.forEach(k => allOn[k] = true);
                          setSelectedUser(prev => ({ ...prev, permissions: { ...prev.permissions, actions: allOn } }));
                        }}
                        className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter hover:underline"
                      >
                        Enable All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {ACTION_KEYS.map(action => {
                        const currentActions = selectedUser.permissions?.actions || {};
                        const enabled = currentActions[action] === true;
                        return (
                          <button
                            key={action}
                            onClick={() => {
                              const next = { ...currentActions, [action]: !enabled };
                              const base = { ...(selectedUser.permissions || {}) };
                              setSelectedUser(prev => ({ ...prev, permissions: { ...base, actions: next } }));
                            }}
                            className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${
                              enabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-400 opacity-60'
                            }`}
                          >
                            {action}
                            {enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Feature Flags</label>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.keys(selectedUser.features || {}).map(key => (
                        <button
                          key={key}
                          onClick={() => {
                            const newFeatures = { ...selectedUser.features, [key]: !selectedUser.features[key] };
                            setSelectedUser(prev => ({ ...prev, features: newFeatures }));
                          }}
                          className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${
                            selectedUser.features[key] 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold' 
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-400 opacity-60'
                          }`}
                        >
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                          <div className={`w-8 h-4 rounded-full relative transition-colors ${selectedUser.features[key] ? 'bg-amber-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${selectedUser.features[key] ? 'left-4.5' : 'left-0.5'}`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 px-6 md:px-8 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button 
                    onClick={closeUserManager}
                    className="py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 font-black text-slate-500 dark:text-slate-400 hover:text-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedUserOriginal) return;
                      setSelectedUser(JSON.parse(JSON.stringify(selectedUserOriginal)));
                      toast.success('Draft reset to last saved state');
                    }}
                    disabled={!hasUnsavedChanges}
                    className={`py-4 rounded-2xl font-black transition-all ${
                      hasUnsavedChanges
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Reset Draft
                  </button>
                  <button
                    onClick={async () => {
                      if (!hasUnsavedChanges) return;
                      const updates = {};
                      if (selectedUser.role !== selectedUserOriginal?.role) updates.role = selectedUser.role;
                      if (JSON.stringify(selectedUser.permissions) !== JSON.stringify(selectedUserOriginal?.permissions)) updates.permissions = selectedUser.permissions;
                      if (JSON.stringify(selectedUser.status) !== JSON.stringify(selectedUserOriginal?.status)) updates.status = selectedUser.status;
                      if ((selectedUser.plan || 'free') !== (selectedUserOriginal?.plan || 'free')) updates.plan = selectedUser.plan;
                      if (JSON.stringify(selectedUser.limits) !== JSON.stringify(selectedUserOriginal?.limits)) updates.limits = selectedUser.limits;
                      if (JSON.stringify(selectedUser.features) !== JSON.stringify(selectedUserOriginal?.features)) updates.features = selectedUser.features;
                      await handleUpdateUser(selectedUser.id, updates);
                      setSelectedUserOriginal(JSON.parse(JSON.stringify(selectedUser)));
                    }}
                    disabled={!hasUnsavedChanges}
                    className={`py-4 rounded-2xl font-black transition-all ${
                      hasUnsavedChanges
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="py-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      )}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          if (selectedUser?.id === currentUser?.id) {
            toast.error('You cannot delete your own account from Admin panel');
            return;
          }
          try {
            await FirestoreService.deleteUserData(selectedUser.id);
            setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setSelectedUser(null);
            setSelectedUserOriginal(null);
            toast.success('User deleted');
          } catch (err) {
            console.error('[Admin] Delete user error:', err);
            toast.error(err?.message ? `Failed to delete user: ${err.message}` : 'Failed to delete user');
          }
        }}
        title="Delete User"
        message={`This action will permanently remove ${selectedUser?.email || 'this user'} and all associated data.`}
        confirmMatchText={selectedUser?.email}
        confirmText="Delete User"
        type="danger"
      />
      <ConfirmModal
        isOpen={confirmDiscardOpen}
        onClose={() => setConfirmDiscardOpen(false)}
        onConfirm={forceCloseUserManager}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this user profile. Are you sure you want to discard your changes and close?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        type="danger"
      />
      <ConfirmModal
        isOpen={confirmBulkDeleteOpen}
        onClose={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await Promise.all(selectedUserIds.map((id) => {
              if (id === currentUser?.id) return Promise.resolve();
              return FirestoreService.deleteUserData(id);
            }));
            setUsers((prev) => prev.filter((u) => !selectedUserIds.includes(u.id) || u.id === currentUser?.id));
            toast.success(`Deleted ${selectedUserIds.length} user(s)`);
            setSelectedUserIds([]);
          } catch (err) {
            console.error('[Admin] Bulk delete error:', err);
            toast.error('Bulk delete failed');
          }
        }}
        title="Delete Selected Users"
        message={`Are you sure you want to permanently delete ${selectedUserIds.length} user(s)? This action cannot be undone.`}
        confirmText="Delete Users"
        type="danger"
      />
      <AnimatePresence>
        {showCreateUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-black">Create User</h3>
                <button onClick={() => setShowCreateUserModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Name / Username</label>
                  <input
                    type="text"
                    required
                    value={createUserData.name}
                    onChange={(e) => setCreateUserData({ ...createUserData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={createUserData.email}
                    onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Initial Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createUserData.password}
                    onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="••••••••"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowCreateUserModal(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isCreatingUser} className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50">
                    {isCreatingUser ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-over User Inspection Drawer */}
      <AdminUserDrawer 
        user={inspectUser} 
        onClose={() => setInspectUser(null)} 
        onUpdateUser={handleUpdateUser} 
        auditLogs={auditFeed} 
        currentUser={currentUser} 
      />

      {/* Global Admin Command Palette (Ctrl+K) */}
      <AdminCommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
        users={users} 
        onNavigate={setActiveAdminPage} 
        onAction={(action, data) => {
          if (action === 'inspectUser') setInspectUser(data);
        }}
      />
    </div>
  );
};

export default Admin;
