import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FirestoreService } from '../../services/firestore';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { EmailService } from '../../services/email';
import { useAuth } from '../../context/AuthContext';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { computeUsageMetrics } from '../../services/usageMetrics';

const Admin = () => {
  const { user: currentUser } = useAuth();
  const ROLE_META = {
    superadmin: { label: 'Platform Owner', short: 'Owner' },
    admin: { label: 'Admin Manager', short: 'Admin' },
    user: { label: 'Learner', short: 'Learner' },
    restricted: { label: 'Limited Access', short: 'Limited' }
  };
  const MODULE_KEYS = ['videos','reminders','notes','analytics','resources','workspace','manageUsers','projects','courses','changePermissions','adminPanel'];
  const ACTION_KEYS = ['create','edit','delete','export'];
  const defaultRoleTemplates = [
    { id: 'tpl-owner', name: 'Platform Owner', role: 'superadmin', modules: [...MODULE_KEYS], actions: [...ACTION_KEYS] },
    { id: 'tpl-admin', name: 'Admin Manager', role: 'admin', modules: [...MODULE_KEYS], actions: [...ACTION_KEYS] },
    { id: 'tpl-learner', name: 'Learner Full Access', role: 'user', modules: ['courses', 'videos', 'notes', 'resources', 'projects', 'workspace', 'reminders'], actions: ['create', 'edit', 'export'] },
    { id: 'tpl-limited', name: 'Limited Access', role: 'restricted', modules: ['notes', 'resources', 'reminders'], actions: [] }
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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterType] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserOriginal, setSelectedUserOriginal] = useState(null);
  const [roleDraft, setRoleDraft] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [activeAdminPage, setActiveAdminPage] = useState('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [auditFeed, setAuditFeed] = useState([]);
  const [bulkImportBusy, setBulkImportBusy] = useState(false);
  const importRef = useRef(null);
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

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status?.isActive).length;
  const blockedUsers = users.filter((u) => u.status?.isBlocked).length;
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length;
  const totalStorageLimit = users.reduce((acc, u) => acc + Number(u.limits?.storageMB || 0), 0);
  const totalStorageUsed = users.reduce((acc, u) => acc + Number(getCloudUsage(u.usage).displayStorageUsedMB || 0), 0);
  const usagePercent = totalStorageLimit > 0 ? Math.round((totalStorageUsed / totalStorageLimit) * 100) : 0;
  const recentActivity = auditFeed.slice(0, 5);
  const enabledFeatureCount = Object.values(adminFeatureFlags).filter(Boolean).length;
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
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(0)} MB`;
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
  }, []);

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
      const discard = window.confirm('You have unsaved changes. Discard and close?');
      if (!discard) return;
    }
    setSelectedUser(null);
    setSelectedUserOriginal(null);
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

  const renderAdminPageTabs = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 inline-flex gap-2">
      {[
        { id: 'overview', label: 'Overview', icon: Layout },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'roles', label: 'Roles', icon: ClipboardList },
        { id: 'features', label: 'Features', icon: Settings },
        { id: 'audit', label: 'Audit Logs', icon: Activity },
        { id: 'health', label: 'System Health', icon: Server },
        { id: 'support', label: 'Support', icon: UserPlus }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveAdminPage(tab.id)}
          className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 transition ${
            activeAdminPage === tab.id
              ? 'bg-slate-900 text-white'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
          }`}
        >
          <tab.icon size={14} />
          {tab.label}
        </button>
      ))}
    </div>
  );

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
    return matchesSearch && matchesRole;
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
      <div className="max-w-7xl mx-auto pb-12 space-y-10 animate-pulse">
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
      <div className="max-w-7xl mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
              <div className="p-3 rounded-[1.5rem] bg-slate-900 text-white shadow-xl">
                <Layout size={32} />
              </div>
              Admin Command Center
            </h1>
            <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs mt-2">
              Manage users, features, and platform health from one place
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setActiveAdminPage('users')} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold">Open Users</button>
            <button onClick={() => setActiveAdminPage('health')} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold">System Health</button>
            <button onClick={() => setActiveAdminPage('support')} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold">Support</button>
          </div>
        </div>

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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Recent Admin Activity</h2>
              <button onClick={() => setActiveAdminPage('audit')} className="text-sm font-bold text-primary-500">Open Logs</button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
              {recentActivity.length === 0 && <p className="text-sm text-slate-400">No recent admin activity yet.</p>}
              {recentActivity.map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <p className="text-[10px] uppercase tracking-widest font-black text-primary-500">{log.type || 'event'}</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{log.targetUserId || 'system event'}</p>
                  <p className="text-xs text-slate-400">{log.performedAt ? new Date(log.performedAt).toLocaleString() : ''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminPage === 'features') {
    return (
      <div className="max-w-7xl mx-auto pb-12 space-y-8">
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
      <div className="max-w-7xl mx-auto pb-12 space-y-8">
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
      <div className="max-w-7xl mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <div className="card space-y-5">
          <h2 className="text-xl font-black">Role Template Manager</h2>
          <p className="text-sm text-slate-500">Apply reusable role bundles to selected users in one click.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleTemplates.map((tpl) => (
              <div key={tpl.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="font-black text-slate-800 dark:text-white">{tpl.name}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Role: {ROLE_META[tpl.role]?.label || tpl.role}</p>
                <p className="text-xs text-slate-500 mt-2">{tpl.modules.length} modules, {tpl.actions.length} actions</p>
                <button onClick={() => applyRoleTemplate(tpl)} className="mt-3 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-bold">
                  Apply to Selected Users
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminPage === 'audit') {
    return (
      <div className="max-w-7xl mx-auto pb-12 space-y-8">
        {renderAdminPageTabs()}
        <div className="card space-y-4">
          <h2 className="text-xl font-black">Audit Logs</h2>
          <div className="space-y-2 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {auditFeed.length === 0 && <p className="text-sm text-slate-400">No logs found.</p>}
            {auditFeed.map((log) => (
              <div key={log.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase tracking-widest font-black text-primary-500">{log.type || 'event'}</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{log.targetUserId || 'system event'}</p>
                <p className="text-xs text-slate-400">{log.performedAt ? new Date(log.performedAt).toLocaleString() : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminPage === 'health') {
    return (
      <div className="max-w-7xl mx-auto pb-12 space-y-8">
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
    <div className="max-w-7xl mx-auto pb-12 space-y-10">
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
          { label: 'Total MBs', value: `${(users.reduce((acc, u) => acc + (u.limits?.storageMB || 0), 0)).toFixed(0)}MB`, icon: HardDrive, color: 'text-blue-500', bg: 'bg-blue-50' }
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
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500">
                        {user.name?.[0].toUpperCase()}
                      </div>
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
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeUserManager}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-6xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 px-6 md:px-8 py-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-500">
                  {selectedUser.name?.[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">{selectedUser.name}</h2>
                  <p className="text-slate-400 font-medium">{selectedUser.email}</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Clock size={12} />
                    Last Login
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                  </p>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${hasUnsavedChanges ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {hasUnsavedChanges ? 'Unsaved Changes' : 'All Changes Saved'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 py-6 space-y-8">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Recent Admin Activity</h3>
                  </div>
                  {auditLoading ? (
                    <p className="text-xs text-slate-400">Loading activity...</p>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400">No recent audit entries for this user.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">{log.type || 'admin_update_user'}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {log.performedAt ? new Date(log.performedAt).toLocaleString() : 'Unknown time'}
                          </p>
                          {summarizeAuditChanges(log.updates).length > 0 && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5">
                              {summarizeAuditChanges(log.updates).join(' • ')}
                            </p>
                          )}
                        </div>
                      ))}
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
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                                : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
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
                            ? 'bg-green-50 text-green-600 border-green-100' 
                            : 'bg-red-50 text-red-600 border-red-100'
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
                              isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
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
                                ? 'bg-primary-50 text-primary-600 border-primary-100' 
                                : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
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
                              enabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
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
                              ? 'bg-amber-50 text-amber-600 border-amber-100' 
                              : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
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
      </AnimatePresence>
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          if (selectedUser?.id === currentUser?.id) {
            toast.error('You cannot delete your own account from Admin panel');
            return;
          }
          const typed = window.prompt(`Type the user email to confirm deletion:\n${selectedUser?.email || ''}`);
          if (typed !== selectedUser?.email) {
            toast.error('Type the user email to confirm deletion');
            return;
          }
          try {
            await FirestoreService.deleteUserData(selectedUser.id);
            setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setSelectedUser(null);
            setSelectedUserOriginal(null);
            toast.success('User deleted');
          } catch {
            toast.error('Failed to delete user');
          }
        }}
        title="Delete User"
        message={`This will permanently remove ${selectedUser?.email || 'this user'} and all associated data. Type their email to confirm in the input below.`}
        confirmText="Delete"
        type="danger"
      >
      </ConfirmModal>
    </div>
  );
};

export default Admin;
