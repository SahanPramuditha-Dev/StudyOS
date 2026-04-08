import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  User, 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  Trash2, 
  Moon, 
  Sun, 
  Bell, 
  ArrowUpRight,
  Shield,
  Smartphone,
  Save,
  X,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  TrendingUp,
  Award,
  Palette,
  Target,
  Eye,
  Lock,
  LogOut,
  Mail,
  Phone,
  School,
  GraduationCap,
  Calendar,
  Monitor,
  Layout,
  Type,
  ToggleLeft as ToggleIcon,
  Globe,
  Database,
  CreditCard,
  Crown,
  Zap
} from 'lucide-react';
import { StorageService, STORAGE_KEYS } from '../../services/storage';
import { computeUsageMetrics } from '../../services/usageMetrics';
import { useStorage } from '../../hooks/useStorage';
import { auth, functions } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';
import GoogleCalendarSettings from '../../components/GoogleCalendarSettings';

const Settings = () => {
  const { user, profile, logout, updateUserProfile, uploadProfileImage, resetPassword, deleteAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const proPriceId = import.meta.env.VITE_STRIPE_PRO_PRICE_ID;
  
  const [isUploading, setIsUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    type: 'danger'
  });

  const handleUpgrade = async (priceId) => {
    if (!priceId) {
      toast.error('Pro plan is not configured yet.');
      return;
    }
    try {
      setIsUpgrading(true);
      const createSession = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await createSession({ 
        priceId, 
        origin: window.location.origin 
      });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Upgrade failed: ' + error.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const downloadURL = await uploadProfileImage(file);
      setProfileForm(prev => ({ ...prev, avatar: downloadURL }));
      toast.success('Image uploaded! Don\'t forget to save changes.');
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetPassword = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset Password',
      message: `Send a password reset email to ${user?.email}?`,
      confirmText: 'Send Email',
      type: 'primary',
      onConfirm: async () => {
        try {
          await resetPassword(user?.email);
          toast.success('Reset email sent!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to send reset email');
        }
      }
    });
  };

  const handleDeleteAccount = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Account',
      message: 'Are you absolutely sure? This will delete your account and all associated data permanently. This action is irreversible.',
      confirmText: 'Delete Permanently',
      type: 'danger',
      onConfirm: async () => {
        const secondConfirm = window.prompt('Type "DELETE" to confirm:');
        if (secondConfirm === 'DELETE') {
          try {
            await deleteAccount();
            StorageService.clear();
            toast.success('Account and data deleted permanently');
            window.location.reload();
          } catch (error) {
            console.error(error);
            toast.error('Failed to delete account');
          }
        } else if (secondConfirm !== null) {
          toast.error('Verification failed. Action cancelled.');
        }
      }
    });
  };
  const [personalization, setPersonalization] = useStorage(STORAGE_KEYS.PERSONALIZATION, {
    accentColor: '#0ea5e9',
    fontSize: 'medium',
    dashboardLayout: 'grid',
    defaultLanding: 'dashboard'
  });

  const [studyPrefs, setStudyPrefs] = useStorage(STORAGE_KEYS.STUDY_PREFS, {
    dailyGoal: 120,
    preferredSlot: 'Morning',
    pomodoro: 25,
    breakInterval: 5,
    defaultDifficulty: 'Intermediate'
  });

  const [rawNotifSettings, setNotificationSettings] = useStorage(STORAGE_KEYS.NOTIF_SETTINGS, {
    enabled: true,
    reminders: true,
    deadlines: true,
    streaks: true,
    method: 'browser',
    silentHours: { enabled: false, start: '22:00', end: '07:00' },
    emailNotifications: { roleChanges: true, reminders: true }
  });
  const notifSettings = useMemo(() => {
    const defaults = {
      enabled: true,
      reminders: true,
      deadlines: true,
      streaks: true,
      method: 'browser',
      channels: {
        reminder: { web: true, email: true },
        deadline: { web: true, email: false },
        streak: { web: true, email: false },
        roleChanges: { web: true, email: true }
      },
      silentHours: { enabled: false, start: '22:00', end: '07:00' },
      emailNotifications: { roleChanges: true, reminders: true }
    };
    const candidate = (rawNotifSettings && typeof rawNotifSettings === 'object') ? rawNotifSettings : {};
    return {
      ...defaults,
      ...candidate,
      silentHours: {
        ...defaults.silentHours,
        ...(candidate.silentHours || {})
      },
      emailNotifications: {
        ...defaults.emailNotifications,
        ...(candidate.emailNotifications || {})
      },
      channels: {
        ...defaults.channels,
        ...(candidate.channels || {})
      }
    };
  }, [rawNotifSettings]);

  React.useEffect(() => {
    const shouldRepair = JSON.stringify(rawNotifSettings) !== JSON.stringify(notifSettings);
    if (shouldRepair) {
      setNotificationSettings(notifSettings);
    }
  }, [rawNotifSettings, notifSettings, setNotificationSettings]);

  const [privacySettings, setPrivacySettings] = useStorage(STORAGE_KEYS.PRIVACY, {
    isPublic: false,
    activityVisible: true,
    analyticsConsent: true,
    dataRetentionDays: 365,
    autoDeleteCompletedReminders: false,
    autoDeleteImportedBackups: false
  });

  // Real data for analytics snapshot
  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [resources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [papers] = useStorage(STORAGE_KEYS.PAPERS, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [streak] = useStorage(STORAGE_KEYS.STREAK, { current: 0 });
  const [achievements, setAchievements] = useStorage(STORAGE_KEYS.ACHIEVEMENTS, []);

  const analytics = useMemo(() => {
    const totalSeconds = videos.reduce((acc, v) => acc + (v.lastPosition || 0), 0);
    const usage = profile?.usage || {};
    const totalWatchMinutes = usage.videoCount ? Math.round(totalSeconds / 60) : Math.round((usage.totalWatchSeconds || totalSeconds) / 60);
    return {
      studyTime: (totalWatchMinutes / 60).toFixed(1),
      active: usage.courseCount ?? courses.filter(c => c.status === 'Active').length,
      completed: courses.filter(c => c.status === 'Completed').length,
      notes: notes.length,
      streak: streak.current,
      productivity: courses.length > 0 
        ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length) 
        : 0,
      storageUsedMB: Number(usage.storageUsedMB || 0),
      fileCount: Number(usage.fileCount || 0)
    };
  }, [courses, notes, videos, streak, profile]);

  const usageMetrics = useMemo(
    () => computeUsageMetrics({
      resources,
      notes,
      papers,
      cloudUsage: profile?.usage
    }),
    [resources, notes, papers, profile]
  );

  const computedAchievements = useMemo(() => {
    const totalTasks = projects.reduce((acc, project) => acc + Object.values(project.board || {}).flat().length, 0);
    const source = [
      {
        id: 'streak7',
        title: '7-Day Streak',
        desc: 'Study for 7 consecutive days',
        value: analytics.streak,
        target: 7,
        icon: Flame,
        color: 'text-red-500'
      },
      {
        id: 'resourceMaster',
        title: 'Resource Master',
        desc: 'Manage 50 learning artifacts',
        value: analytics.fileCount,
        target: 50,
        icon: Download,
        color: 'text-blue-500'
      },
      {
        id: 'noteTaker',
        title: 'Note Taker',
        desc: 'Create 100 deep-study notes',
        value: analytics.notes,
        target: 100,
        icon: FileText,
        color: 'text-purple-500'
      },
      {
        id: 'fastLearner',
        title: 'Fast Learner',
        desc: 'Complete 5 courses',
        value: analytics.completed,
        target: 5,
        icon: GraduationCap,
        color: 'text-green-500'
      },
      {
        id: 'taskFinisher',
        title: 'Task Finisher',
        desc: 'Create 100 project tasks',
        value: totalTasks,
        target: 100,
        icon: CheckCircle2,
        color: 'text-teal-500'
      }
    ];

    return source.map((achievement) => {
      const progress = Math.min(100, Math.round((achievement.value / achievement.target) * 100));
      return {
        ...achievement,
        progress,
        unlocked: progress >= 100
      };
    });
  }, [analytics, projects]);

  React.useEffect(() => {
    const persistedShape = (achievements || []).map(({ id, progress, unlocked }) => ({ id, progress, unlocked }));
    const computedShape = computedAchievements.map(({ id, progress, unlocked }) => ({ id, progress, unlocked }));
    const changed = JSON.stringify(persistedShape) !== JSON.stringify(computedShape);
    if (changed) {
      setAchievements(computedShape.map((item) => ({ ...item, updatedAt: new Date().toISOString() })));
    }
  }, [computedAchievements, achievements, setAchievements]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [avatarFallback, setAvatarFallback] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileForm, setProfileForm] = useState({
    name: '',
    avatar: '',
    bio: '',
    university: '',
    degree: '',
    year: '',
    phone: ''
  });

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        university: user.university || '',
        degree: user.degree || '',
        year: user.year || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const googleProviderPhoto = auth.currentUser?.providerData?.find((provider) => provider?.providerId === 'google.com')?.photoURL;
  const effectiveAvatar = (user?.avatar || profile?.avatar || googleProviderPhoto || auth.currentUser?.photoURL || '').trim();
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'StudyOS User')}&background=0f172a&color=ffffff`;
  const displayAvatar = avatarFallback ? fallbackAvatar : (effectiveAvatar || fallbackAvatar);

  React.useEffect(() => {
    setAvatarFallback(false);
  }, [effectiveAvatar]);

  const handleClearData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Clear All Data',
      message: 'Are you sure you want to delete all your data? This cannot be undone and you will lose all progress.',
      confirmText: 'Delete Everything',
      type: 'danger',
      onConfirm: () => {
        StorageService.clear();
        toast.success('All data cleared');
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  };

  const handleExportData = async () => {
    try {
      const exportDataFn = httpsCallable(functions, 'exportUserDataPackage');
      const { data } = await exportDataFn();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studyos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Cloud data package exported successfully!');
    } catch (error) {
      console.error(error);
      // Fallback to local-only export
      const localData = StorageService.getAll();
      const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studyos-local-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Cloud export unavailable. Exported local backup.');
    }
  };

  const applyImportedData = (parsedData) => {
    try {
      localStorage.setItem(`studyos_import_backup_${Date.now()}`, JSON.stringify(parsedData));
    } catch {
      void 0;
    }
    const payload = parsedData?.modules && typeof parsedData.modules === 'object'
      ? parsedData.modules
      : parsedData;

    const validStorageKeys = new Set(Object.values(STORAGE_KEYS));
    Object.keys(payload).forEach((key) => {
      if (validStorageKeys.has(key) && payload[key] !== undefined) {
        localStorage.setItem(key, JSON.stringify(payload[key]));
      }
    });
  };

  const handleSelectiveClear = (keys, label) => {
    setConfirmConfig({
      isOpen: true,
      title: `Reset ${label}`,
      message: `This will clear ${label} data from your account on this device. Continue?`,
      confirmText: 'Reset',
      type: 'danger',
      onConfirm: () => {
        keys.forEach((key) => localStorage.removeItem(key));
        toast.success(`${label} reset complete`);
        setTimeout(() => window.location.reload(), 900);
      }
    });
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const payload = parsed?.modules && typeof parsed.modules === 'object' ? parsed.modules : parsed;
        if (!payload || typeof payload !== 'object') {
          throw new Error('Invalid backup payload');
        }

        const validStorageKeys = new Set(Object.values(STORAGE_KEYS));
        const matchedKeys = Object.keys(payload).filter((key) => validStorageKeys.has(key));
        if (!matchedKeys.length) {
          throw new Error('No recognized StudyOS keys found in backup');
        }

        setImportSummary({
          matchedCount: matchedKeys.length,
          keys: matchedKeys
        });

        setConfirmConfig({
          isOpen: true,
          title: 'Import Backup Data',
          message: `Found ${matchedKeys.length} valid module(s): ${matchedKeys.join(', ')}. This will overwrite existing local module data. Continue?`,
          confirmText: 'Import Now',
          type: 'primary',
          onConfirm: () => {
            applyImportedData(parsed);
            toast.success('Data imported successfully! Refreshing...');
            setTimeout(() => window.location.reload(), 1200);
          }
        });
      } catch (error) {
        toast.error(error?.message || 'Invalid backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const validationErrors = {};

    if (profileForm.phone && !/^[+0-9()\-\s]{7,20}$/.test(profileForm.phone.trim())) {
      validationErrors.phone = 'Enter a valid phone number.';
    }
    if (profileForm.year && profileForm.year.trim().length > 30) {
      validationErrors.year = 'Year/Sem should be shorter than 30 characters.';
    }
    if (profileForm.avatar && !/^https?:\/\/.+/i.test(profileForm.avatar.trim())) {
      validationErrors.avatar = 'Profile URL should start with http:// or https://';
    }

    if (Object.keys(validationErrors).length) {
      setProfileErrors(validationErrors);
      toast.error('Fix profile fields before saving');
      return;
    }

    setProfileErrors({});
    try {
      await updateUserProfile(profileForm);
      setIsEditingProfile(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'personalization', label: 'Personalization', icon: Palette },
    { id: 'study', label: 'Study Setup', icon: Target },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'channels', label: 'Channels Matrix', icon: Mail },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
    { id: 'data', label: 'Data & Privacy', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">Settings</h2>
          <p className="text-slate-400 font-medium">Control your learning environment and profile</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold border border-primary-100 dark:border-primary-500/20">
          <Award size={18} />
          Level 12 Scholar
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1.5 sticky top-24">
          {sections.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                activeSection === item.id 
                  ? 'bg-white dark:bg-slate-900 shadow-xl shadow-primary-500/5 text-primary-600 dark:text-primary-400 font-bold border border-slate-100 dark:border-slate-800' 
                  : 'text-slate-500 hover:bg-white dark:hover:bg-slate-900/50'
              }`}
            >
              <item.icon size={20} strokeWidth={activeSection === item.id ? 2.5 : 2} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <section className="card space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-6">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-500">
                        <User size={24} />
                      </div>
                      Profile Information
                    </h3>
                    {!isEditingProfile && (
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-primary-50 hover:text-primary-600 transition-all"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                  
                  {!isEditingProfile ? (
                    <div className="space-y-8">
                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative">
                          <img 
                            src={displayAvatar}
                            alt={user?.name} 
                            onError={() => setAvatarFallback(true)}
                            className="w-32 h-32 rounded-[2.5rem] border-4 border-white dark:border-slate-800 shadow-2xl object-cover"
                          />
                          <div className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-green-500 text-white border-4 border-white dark:border-slate-900 shadow-lg">
                            <CheckCircle2 size={16} />
                          </div>
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <h4 className="text-3xl font-black text-slate-800 dark:text-white">{user?.name}</h4>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-slate-400 font-medium">
                            <p className="flex items-center gap-2">
                              <Mail size={16} /> {user?.email}
                            </p>
                            {user?.phone && (
                              <p className="flex items-center gap-2">
                                <Phone size={16} /> {user?.phone}
                              </p>
                            )}
                          </div>
                          <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                            {user?.bio || "No bio added yet. Tell the community about your learning journey!"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <School size={14} /> Academic Details
                          </h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">University</span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">{user?.university || 'Not set'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Degree</span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">{user?.degree || 'Not set'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Year/Sem</span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">{user?.year || 'Not set'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Phone size={14} /> Contact Information
                          </h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Phone</span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">{user?.phone || 'Not set'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Verification</span>
                              <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 text-[10px] font-black uppercase">Verified</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                        <input 
                          required
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:ring-4 ring-primary-500/10 outline-none dark:text-white" 
                          value={profileForm.name}
                          onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Profile Photo</label>
                        <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                          <div className="relative group">
                            <img 
                              src={profileForm.avatar || user?.avatar} 
                              className={`w-20 h-20 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-lg ${isUploading ? 'opacity-50' : ''}`} 
                              alt="Preview" 
                            />
                            {isUploading && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="text-xs text-slate-500">Upload a new profile picture. Max size 2MB.</p>
                            <div className="flex gap-2">
                              <label className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm border border-slate-100 dark:border-slate-600 cursor-pointer hover:bg-slate-50 transition-all">
                                <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                              </label>
                              <button 
                                type="button"
                                onClick={() => setProfileForm({ ...profileForm, avatar: `https://ui-avatars.com/api/?name=${user?.name}&background=random` })}
                                className="px-4 py-2 rounded-xl text-red-500 text-xs font-bold hover:bg-red-50 transition-all"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Profile Photo URL (Alternative)</label>
                        <input 
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:ring-4 ring-primary-500/10 outline-none dark:text-white" 
                          placeholder="Or paste a direct image URL"
                          value={profileForm.avatar}
                          onChange={e => setProfileForm({...profileForm, avatar: e.target.value})}
                        />
                        {profileErrors.avatar && <p className="text-xs text-red-500 ml-1">{profileErrors.avatar}</p>}
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Bio</label>
                        <textarea 
                          rows={3}
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:ring-4 ring-primary-500/10 outline-none dark:text-white resize-none" 
                          value={profileForm.bio}
                          onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">University</label>
                        <input 
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:ring-4 ring-primary-500/10 outline-none dark:text-white" 
                          value={profileForm.university}
                          onChange={e => setProfileForm({...profileForm, university: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Degree Program</label>
                        <input 
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:ring-4 ring-primary-500/10 outline-none dark:text-white" 
                          value={profileForm.degree}
                          onChange={e => setProfileForm({...profileForm, degree: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Current Year/Sem</label>
                        <input 
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:ring-4 ring-primary-500/10 outline-none dark:text-white" 
                          value={profileForm.year}
                          onChange={e => setProfileForm({...profileForm, year: e.target.value})}
                        />
                        {profileErrors.year && <p className="text-xs text-red-500 ml-1">{profileErrors.year}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                        <input 
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:ring-4 ring-primary-500/10 outline-none dark:text-white" 
                          value={profileForm.phone}
                          onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                        />
                        {profileErrors.phone && <p className="text-xs text-red-500 ml-1">{profileErrors.phone}</p>}
                      </div>
                      <div className="md:col-span-2 flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 rounded-[1.5rem] bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2">
                          <Save size={20} /> Save Profile Changes
                        </button>
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-8 py-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold hover:bg-slate-100 transition-all">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              )}

              {/* Account Settings */}
              {activeSection === 'account' && (
                <section className="card space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500">
                      <Shield size={24} />
                    </div>
                    Account Settings
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={handleResetPassword}
                      className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-slate-400 group-hover:text-primary-500 transition-colors">
                          <Lock size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 dark:text-white">Change Password</p>
                          <p className="text-xs text-slate-400">Send reset link to {user?.email}</p>
                        </div>
                      </div>
                      <ArrowUpRight size={20} className="text-slate-300" />
                    </button>
                    <button 
                      onClick={() => toast.success('2FA coming soon to StudyOs Pro!')}
                      className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-slate-400 group-hover:text-primary-500 transition-colors">
                          <Smartphone size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 dark:text-white">Two-Factor Auth</p>
                          <p className="text-xs text-slate-400">Add an extra layer of protection</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-black text-slate-500">OFF</span>
                    </button>
                    <button 
                      onClick={logout}
                      className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-slate-400 group-hover:text-red-500 transition-colors">
                          <LogOut size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 dark:text-white">Sign Out</p>
                          <p className="text-xs text-slate-400">Logout from this session</p>
                        </div>
                      </div>
                      <X size={20} className="text-slate-300" />
                    </button>
                    <button 
                      onClick={handleDeleteAccount}
                      className="flex items-center justify-between p-5 rounded-[1.5rem] bg-red-50/30 dark:bg-red-500/5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group border border-dashed border-red-100 dark:border-red-900/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-red-400">
                          <Trash2 size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-red-600">Delete Account</p>
                          <p className="text-xs text-red-400/70">Permanently remove all your data</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </section>
              )}

              {/* Personalization Section */}
              {activeSection === 'personalization' && (
                <section className="card space-y-8">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-accent-50 dark:bg-accent-500/10 text-accent-500">
                      <Palette size={24} />
                    </div>
                    Personalization
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-slate-400">
                          <Monitor size={20} />
                        </div>
                        <div>
                          <p className="font-bold">System Theme</p>
                          <p className="text-xs text-slate-400 uppercase font-black">{theme} mode</p>
                        </div>
                      </div>
                      <button onClick={toggleTheme} className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-sm text-sm font-bold hover:scale-105 transition-all">
                        Switch to {theme === 'light' ? 'Dark' : 'Light'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                          <Palette size={14} /> Accent Color
                        </label>
                        <input
                          type="color"
                          className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 outline-none cursor-pointer"
                          value={personalization.accentColor}
                          onChange={e => setPersonalization({ ...personalization, accentColor: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                          <Type size={14} /> Font Size
                        </label>
                        <select 
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 outline-none font-bold"
                          value={personalization.fontSize}
                          onChange={e => setPersonalization({...personalization, fontSize: e.target.value})}
                        >
                          <option value="small">Small (Readable)</option>
                          <option value="medium">Medium (Standard)</option>
                          <option value="large">Large (Comfortable)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                          <Layout size={14} /> Dashboard Style
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['grid', 'list'].map(style => (
                            <button 
                              key={style}
                              onClick={() => setPersonalization({...personalization, dashboardLayout: style})}
                              className={`py-3 rounded-xl border-2 font-bold capitalize transition-all ${
                                personalization.dashboardLayout === style 
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600' 
                                  : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                          <Globe size={14} /> Default Landing
                        </label>
                        <select
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 outline-none font-bold"
                          value={personalization.defaultLanding}
                          onChange={e => setPersonalization({ ...personalization, defaultLanding: e.target.value })}
                        >
                          <option value="dashboard">Dashboard</option>
                          <option value="courses">Courses</option>
                          <option value="videos">Videos</option>
                          <option value="notes">Notes</option>
                          <option value="projects">Projects</option>
                          <option value="analytics">Analytics</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Study Preferences */}
              {activeSection === 'study' && (
                <section className="card space-y-8">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
                      <Target size={24} />
                    </div>
                    Study Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Daily Study Goal</label>
                        <span className="text-primary-600 font-black">{studyPrefs.dailyGoal} min</span>
                      </div>
                      <input 
                        type="range" min="30" max="480" step="15"
                        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        value={studyPrefs.dailyGoal}
                        onChange={e => setStudyPrefs({...studyPrefs, dailyGoal: parseInt(e.target.value)})}
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase">
                        <span>30m</span>
                        <span>8 hours</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Pomodoro Timer</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          className="w-20 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 font-bold"
                          value={studyPrefs.pomodoro}
                          onChange={e => setStudyPrefs({...studyPrefs, pomodoro: Math.max(10, Math.min(120, parseInt(e.target.value) || 25))})}
                        />
                        <span className="text-sm text-slate-400 font-medium">min Focus /</span>
                        <input 
                          type="number" 
                          className="w-20 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 font-bold"
                          value={studyPrefs.breakInterval}
                          onChange={e => setStudyPrefs({...studyPrefs, breakInterval: Math.max(1, Math.min(60, parseInt(e.target.value) || 5))})}
                        />
                        <span className="text-sm text-slate-400 font-medium">min Break</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase ml-1">Preferred Study Slot</label>
                      <select
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 outline-none font-bold"
                        value={studyPrefs.preferredSlot}
                        onChange={e => setStudyPrefs({ ...studyPrefs, preferredSlot: e.target.value })}
                      >
                        <option>Morning</option>
                        <option>Afternoon</option>
                        <option>Evening</option>
                        <option>Night</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase ml-1">Default Difficulty</label>
                      <select
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 outline-none font-bold"
                        value={studyPrefs.defaultDifficulty}
                        onChange={e => setStudyPrefs({ ...studyPrefs, defaultDifficulty: e.target.value })}
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <section className="card space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-6">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                        <Bell size={24} />
                      </div>
                      Notification Preferences
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* General Switches */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">App Alerts</h4>
                      {[
                        { id: 'enabled', label: 'Push Notifications', desc: 'Enable all app alerts' },
                        { id: 'reminders', label: 'Study Reminders', desc: 'Alerts for your daily goals' },
                        { id: 'deadlines', label: 'Course Deadlines', desc: 'Reminders for upcoming tasks' },
                        { id: 'streaks', label: 'Streak Alerts', desc: 'Don\'t lose your study momentum' },
                      ].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">{item.label}</p>
                            <p className="text-xs text-slate-400">{item.desc}</p>
                          </div>
                          <button 
                            onClick={() => setNotificationSettings({...notifSettings, [item.id]: !notifSettings[item.id]})}
                            className={`w-12 h-6 rounded-full transition-colors relative ${notifSettings[item.id] ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifSettings[item.id] ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Silent Hours */}
                    <div className="p-6 rounded-[2rem] bg-slate-900 text-white space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-white/10 text-white">
                            <Moon size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-lg">Silent Hours</p>
                            <p className="text-xs text-slate-400">Suppress alerts during study or sleep</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setNotificationSettings({
                            ...notifSettings, 
                            silentHours: { ...notifSettings.silentHours, enabled: !notifSettings.silentHours.enabled }
                          })}
                          className={`w-12 h-6 rounded-full transition-colors relative ${notifSettings.silentHours.enabled ? 'bg-primary-500' : 'bg-slate-700'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifSettings.silentHours.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>

                      {notifSettings.silentHours.enabled && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase">From</label>
                            <input 
                              type="time" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white outline-none focus:border-primary-500"
                              value={notifSettings.silentHours.start}
                              onChange={e => setNotificationSettings({
                                ...notifSettings,
                                silentHours: { ...notifSettings.silentHours, start: e.target.value }
                              })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Until</label>
                            <input 
                              type="time" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white outline-none focus:border-primary-500"
                              value={notifSettings.silentHours.end}
                              onChange={e => setNotificationSettings({
                                ...notifSettings,
                                silentHours: { ...notifSettings.silentHours, end: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Email Delivery Options */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                        <Mail size={14} /> Transactional Email
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          onClick={() => setNotificationSettings({
                            ...notifSettings,
                            emailNotifications: { 
                              ...notifSettings.emailNotifications, 
                              roleChanges: !notifSettings.emailNotifications.roleChanges 
                            }
                          })}
                          className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                            notifSettings.emailNotifications.roleChanges 
                              ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500/20' 
                              : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-bold text-sm">Role Updates</p>
                            <p className="text-[10px] text-slate-400">Account status & roles</p>
                          </div>
                          <CheckCircle2 size={20} className={notifSettings.emailNotifications.roleChanges ? 'text-primary-500' : 'text-slate-300'} />
                        </button>

                        <button 
                          onClick={() => setNotificationSettings({
                            ...notifSettings,
                            emailNotifications: { 
                              ...notifSettings.emailNotifications, 
                              reminders: !notifSettings.emailNotifications.reminders 
                            }
                          })}
                          className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                            notifSettings.emailNotifications.reminders 
                              ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500/20' 
                              : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-bold text-sm">Study Alerts</p>
                            <p className="text-[10px] text-slate-400">Emailed reminders</p>
                          </div>
                          <CheckCircle2 size={20} className={notifSettings.emailNotifications.reminders ? 'text-primary-500' : 'text-slate-300'} />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Integrations Section */}
              {activeSection === 'channels' && (
                <section className="card space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
                      <Mail size={24} />
                    </div>
                    Notification Channels
                  </h3>
                  <p className="text-sm text-slate-500">Control delivery channel per notification type.</p>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3 text-xs uppercase tracking-widest text-slate-400 font-black">Type</th>
                          <th className="px-4 py-3 text-xs uppercase tracking-widest text-slate-400 font-black">Web</th>
                          <th className="px-4 py-3 text-xs uppercase tracking-widest text-slate-400 font-black">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[
                          ['reminder', 'Study Reminder'],
                          ['deadline', 'Deadlines'],
                          ['streak', 'Streak Alerts'],
                          ['roleChanges', 'Role Changes']
                        ].map(([key, label]) => (
                          <tr key={key}>
                            <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{label}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setNotificationSettings({
                                  ...notifSettings,
                                  channels: {
                                    ...notifSettings.channels,
                                    [key]: { ...(notifSettings.channels?.[key] || {}), web: !(notifSettings.channels?.[key]?.web) }
                                  }
                                })}
                                className={`px-3 py-1 rounded-lg text-xs font-bold ${notifSettings.channels?.[key]?.web ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                              >
                                {notifSettings.channels?.[key]?.web ? 'On' : 'Off'}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setNotificationSettings({
                                  ...notifSettings,
                                  channels: {
                                    ...notifSettings.channels,
                                    [key]: { ...(notifSettings.channels?.[key] || {}), email: !(notifSettings.channels?.[key]?.email) }
                                  }
                                })}
                                className={`px-3 py-1 rounded-lg text-xs font-bold ${notifSettings.channels?.[key]?.email ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                              >
                                {notifSettings.channels?.[key]?.email ? 'On' : 'Off'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Integrations Section */}
              {activeSection === 'integrations' && (
                <section className="card space-y-8">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <Globe size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white">Integrations</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Connect external services to StudyOS</p>
                    </div>
                  </div>

                  <GoogleCalendarSettings />
                </section>
              )}

              {/* Billing Section */}
              {activeSection === 'billing' && (
                <section className="card space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-6">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
                        <CreditCard size={24} />
                      </div>
                      Plan & Billing
                    </h3>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className={`w-2 h-2 rounded-full ${profile?.plan === 'Pro' ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Current: {profile?.plan || 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Usage Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-primary-500 shadow-sm">
                          <Database size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Storage Used</p>
                          <p className="text-xl font-black">{usageMetrics.displayStorageUsedMB.toFixed(1)} MB</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500" 
                          style={{ width: `${Math.min(100, (usageMetrics.displayStorageUsedMB / (profile?.limits?.storageMB || 10)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 text-right">
                        Limit: {profile?.limits?.storageMB || 10} MB
                      </p>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-blue-500 shadow-sm">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Items</p>
                          <p className="text-xl font-black">{usageMetrics.displayFileCount}</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${Math.min(100, (usageMetrics.displayFileCount / (profile?.limits?.maxFiles || 50)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 text-right">
                        Limit: {profile?.limits?.maxFiles || 50}
                      </p>
                    </div>
                  </div>

                  {/* Plan Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* Free Plan */}
                    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 space-y-6 relative overflow-hidden group">
                      <div className="space-y-2">
                        <h4 className="text-2xl font-black">Free Plan</h4>
                        <p className="text-slate-400 font-bold text-sm">For casual learners</p>
                      </div>
                      <div className="text-4xl font-black">$0<span className="text-lg text-slate-400 ml-1">/mo</span></div>
                      
                      <div className="space-y-4 pt-4">
                        {[
                          '10MB Storage',
                          '50 Total Files',
                          'Standard Support',
                          'Basic Analytics'
                        ].map(f => (
                          <div key={f} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                            <CheckCircle2 size={18} className="text-green-500" />
                            {f}
                          </div>
                        ))}
                      </div>

                      <button 
                        disabled 
                        className="w-full py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 font-black text-sm uppercase tracking-widest"
                      >
                        {profile?.plan === 'Pro' ? 'Downgrade' : 'Current Plan'}
                      </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white border-2 border-indigo-500/50 space-y-6 relative overflow-hidden group">
                      <div className="absolute top-4 right-4 p-2 bg-indigo-500 rounded-xl shadow-lg rotate-12 group-hover:rotate-0 transition-transform">
                        <Crown size={20} className="text-white" />
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-2xl font-black text-white">Pro Plan</h4>
                        <p className="text-indigo-300/60 font-bold text-sm">For serious students</p>
                      </div>
                      <div className="text-4xl font-black">$9.99<span className="text-lg text-indigo-300/40 ml-1">/mo</span></div>
                      
                      <div className="space-y-4 pt-4">
                        {[
                          '500MB Storage',
                          '1,000 Total Files',
                          'Priority Support',
                          'Advanced Heatmaps',
                          'Custom Branding'
                        ].map(f => (
                          <div key={f} className="flex items-center gap-3 text-sm font-bold text-indigo-100/80">
                            <Zap size={18} className="text-indigo-400" />
                            {f}
                          </div>
                        ))}
                      </div>

                      {profile?.plan === 'Pro' ? (
                        <button className="w-full py-4 rounded-2xl bg-indigo-500/20 text-indigo-400 font-black text-sm uppercase tracking-widest border border-indigo-500/30">
                          Active Subscription
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpgrade(proPriceId)}
                          disabled={isUpgrading || !proPriceId}
                          className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
                        >
                          {isUpgrading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (proPriceId ? 'Upgrade to Pro' : 'Pro Not Configured')}
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Data & Privacy */}
              {activeSection === 'data' && (
                <section className="card space-y-8">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500">
                      <Database size={24} />
                    </div>
                    Data & Privacy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Privacy Controls</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">Public Profile</span>
                        <button onClick={() => setPrivacySettings({ ...privacySettings, isPublic: !privacySettings.isPublic })}>
                          <ToggleIcon className={privacySettings.isPublic ? 'text-primary-500 rotate-180' : 'text-slate-300'} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">Activity Tracking</span>
                        <button onClick={() => setPrivacySettings({ ...privacySettings, analyticsConsent: !privacySettings.analyticsConsent })}>
                          <ToggleIcon className={privacySettings.analyticsConsent ? 'text-primary-500 rotate-180' : 'text-slate-300'} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">Activity Visible To Others</span>
                        <button onClick={() => setPrivacySettings({ ...privacySettings, activityVisible: !privacySettings.activityVisible })}>
                          <ToggleIcon className={privacySettings.activityVisible ? 'text-primary-500 rotate-180' : 'text-slate-300'} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Governance</h4>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Data Retention</p>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-bold">Retention window (days)</span>
                          <input
                            type="number"
                            min={30}
                            max={3650}
                            value={privacySettings.dataRetentionDays || 365}
                            onChange={(e) => setPrivacySettings({
                              ...privacySettings,
                              dataRetentionDays: Math.max(30, Math.min(3650, Number(e.target.value) || 365))
                            })}
                            className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Auto-delete completed reminders</span>
                          <button onClick={() => setPrivacySettings({ ...privacySettings, autoDeleteCompletedReminders: !privacySettings.autoDeleteCompletedReminders })}>
                            <ToggleIcon className={privacySettings.autoDeleteCompletedReminders ? 'text-primary-500 rotate-180' : 'text-slate-300'} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Auto-delete imported backups after apply</span>
                          <button onClick={() => setPrivacySettings({ ...privacySettings, autoDeleteImportedBackups: !privacySettings.autoDeleteImportedBackups })}>
                            <ToggleIcon className={privacySettings.autoDeleteImportedBackups ? 'text-primary-500 rotate-180' : 'text-slate-300'} />
                          </button>
                        </div>
                      </div>
                      {importSummary && (
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Last import preview: {importSummary.matchedCount} modules recognized.
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={handleExportData}
                          className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold flex items-center gap-2 hover:bg-slate-100 transition-all"
                        >
                          <Download size={16} /> Export JSON
                        </button>
                        <label className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold flex items-center gap-2 hover:bg-slate-100 transition-all cursor-pointer">
                          <Upload size={16} /> Import JSON
                          <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                        </label>
                      </div>
                      <button 
                        onClick={handleClearData}
                        className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 text-xs font-black uppercase tracking-widest border border-dashed border-red-200 hover:bg-red-50 transition-all"
                      >
                        Clear All Data
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => handleSelectiveClear([STORAGE_KEYS.COURSES, STORAGE_KEYS.VIDEOS, STORAGE_KEYS.NOTES], 'Learning')}
                          className="py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border border-slate-100 dark:border-slate-700"
                        >
                          Reset Learning
                        </button>
                        <button
                          onClick={() => handleSelectiveClear([STORAGE_KEYS.PROJECTS, STORAGE_KEYS.ASSIGNMENTS, STORAGE_KEYS.TASKS], 'Projects')}
                          className="py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border border-slate-100 dark:border-slate-700"
                        >
                          Reset Projects
                        </button>
                        <button
                          onClick={() => handleSelectiveClear([STORAGE_KEYS.REMINDERS, STORAGE_KEYS.NOTIFICATIONS], 'Planner')}
                          className="py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border border-slate-100 dark:border-slate-700"
                        >
                          Reset Planner
                        </button>
                        <button
                          onClick={() => handleSelectiveClear([STORAGE_KEYS.PERSONALIZATION, STORAGE_KEYS.STUDY_PREFS, STORAGE_KEYS.NOTIF_SETTINGS, STORAGE_KEYS.PRIVACY], 'Preferences')}
                          className="py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border border-slate-100 dark:border-slate-700"
                        >
                          Reset Preferences
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Analytics Snapshot */}
              {activeSection === 'analytics' && (
                <section className="card space-y-8">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-500">
                      <TrendingUp size={24} />
                    </div>
                    Learning Performance
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Hours', val: analytics.studyTime, icon: Clock, color: 'text-blue-500' },
                      { label: 'Active Courses', val: analytics.active, icon: BookOpen, color: 'text-orange-500' },
                      { label: 'Completed', val: analytics.completed, icon: CheckCircle2, color: 'text-green-500' },
                      { label: 'Notes Created', val: analytics.notes, icon: FileText, color: 'text-purple-500' },
                      { label: 'Study Streak', val: `${analytics.streak}d`, icon: Flame, color: 'text-red-500' },
                      { label: 'Efficiency', val: `${analytics.productivity}%`, icon: TrendingUp, color: 'text-teal-500' },
                    ].map((stat, i) => (
                      <div key={i} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center space-y-1">
                        <stat.icon className={`mx-auto mb-2 ${stat.color}`} size={24} />
                        <p className="text-2xl font-black dark:text-white">{stat.val}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Achievements */}
              {activeSection === 'achievements' && (
                <section className="card space-y-8">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500">
                      <Award size={24} />
                    </div>
                    Scholar Milestones
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {computedAchievements.map((badge) => (
                      <div key={badge.id} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center ${badge.color}`}>
                          <badge.icon size={28} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-sm dark:text-white">{badge.title}</p>
                            <span className="text-[10px] font-black text-primary-500">{badge.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${badge.progress}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">{badge.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
      />
    </div>
  );
};

export default Settings;
