import React, { useState, useMemo, useEffect } from 'react';
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
  Zap,
  Volume2,
  BellOff,
  Music,
  Play,
  Info,
  Laptop,
  Activity,
  History,
  Sparkles,
  HardDrive,
  Search,
  RefreshCw,
  Sliders,
  Check,
  Key,
  Cpu,
  Layers,
  Radio,
  Server,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { RequestRoleModal } from '../../components/modals/RequestRoleModal';
import { PREDEFINED_ROLES, getPredefinedRoleByCode } from '../../constants/predefinedRoles';
import { StorageService, STORAGE_KEYS } from '../../services/storage';
import { FirestoreService } from '../../services/firestore';
import { computeUsageMetrics } from '../../services/usageMetrics';
import { calculateStorageFromAssets, formatStorage } from '../../services/storageService';
import { useStorage } from '../../hooks/useStorage';
import { auth, functions } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';
import GoogleCalendarSettings from '../../components/GoogleCalendarSettings';
import MediaManager from '../../components/MediaManager';
import Select from '../../components/ui/Select';
import { playAlarmSound } from '../../utils/alarmAudio';
import { uploadAlarmSound, isValidAlarmSoundFile, getAlarmSoundLimitBytes } from '../../services/alarmSound';

const Settings = () => {
  const { user, profile, logout, updateUserProfile, uploadProfileImage, resetPassword, deleteAccount, linkOAuthProvider, unlinkOAuthProvider, setupPasswordCredential, checkUsernameAvailability, suggestUsernames, changeUsername } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const proPriceId = import.meta.env.VITE_STRIPE_PRO_PRICE_ID;
  
  const [isUploading, setIsUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Account & Security');
  const [activeSection, setActiveSection] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [alarmUploadState, setAlarmUploadState] = useState({ uploading: false, error: '' });
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState({
    loading: true,
    configured: false,
    fromConfigured: false
  });

  // Username Change State
  const [newUsername, setNewUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    if (user?.id && activeSection === 'security') {
      setSessionsLoading(true);
      FirestoreService.logUserSession(user.id)
        .then(() => FirestoreService.getActiveSessions(user.id))
        .then(sessions => {
          const currentSessId = sessionStorage.getItem('studyos_session_id');
          if (!sessions || sessions.length === 0) {
            const fallbackSession = {
              id: currentSessId || 'current_sess',
              device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
              ip: 'Active Local Device',
              lastActive: new Date().toISOString(),
              isCurrent: true,
              isActive: true
            };
            setActiveSessions([fallbackSession]);
          } else {
            const marked = sessions.map((s, idx) => ({
              ...s,
              isCurrent: currentSessId ? s.id === currentSessId : idx === 0
            }));
            setActiveSessions(marked);
          }
        })
        .catch(err => {
          console.error('[Settings] Session load error:', err);
          setActiveSessions([{
            id: 'current_sess',
            device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
            ip: 'Active Local Device',
            lastActive: new Date().toISOString(),
            isCurrent: true,
            isActive: true
          }]);
        })
        .finally(() => setSessionsLoading(false));
    }
  }, [user?.id, activeSection]);

  const handleRevokeSession = async (sessionId) => {
    try {
      await FirestoreService.revokeSession(user.id, sessionId);
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session revoked successfully');
    } catch (e) {
      toast.error('Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      setSessionsLoading(true);
      const currentSessionId = activeSessions.find(s => s.isCurrent)?.id;
      for (const s of activeSessions) {
        if (s.id !== currentSessionId) {
          await FirestoreService.revokeSession(user.id, s.id);
        }
      }
      setActiveSessions(prev => prev.filter(s => s.id === currentSessionId));
      toast.success('All other sessions revoked successfully!');
    } catch (e) {
      toast.error('Failed to revoke all sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (!newUsername.trim()) {
      setUsernameStatus('');
      setStatusMessage('');
      setSuggestions([]);
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase().replace(/^@/, '');
    
    if (cleanUsername.length < 3) {
      setUsernameStatus('invalid');
      setStatusMessage('Username must be at least 3 characters.');
      setSuggestions([]);
      return;
    }
    if (cleanUsername.length > 20) {
      setUsernameStatus('invalid');
      setStatusMessage('Username must be at most 20 characters.');
      setSuggestions([]);
      return;
    }
    if (!/^[a-z0-9_.]+$/.test(cleanUsername)) {
      setUsernameStatus('invalid');
      setStatusMessage('Username can only contain letters, numbers, underscores, and periods.');
      setSuggestions([]);
      return;
    }

    setUsernameStatus('typing');
    const timer = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailability(cleanUsername);
      if (isAvailable) {
        setUsernameStatus('available');
        setStatusMessage('Username is available ✓');
        setSuggestions([]);
      } else {
        setUsernameStatus('taken');
        setStatusMessage('Username is already taken ✗');
        const generatedSuggestions = await suggestUsernames(cleanUsername);
        setSuggestions(generatedSuggestions);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newUsername, checkUsernameAvailability, suggestUsernames]);

  const handleChangeUsername = async () => {
    if (usernameStatus !== 'available') return;
    const cleanUsername = newUsername.trim().toLowerCase().replace(/^@/, '');
    
    if (profile?.username_changed_at) {
      const lastChange = new Date(profile.username_changed_at).getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (new Date().getTime() - lastChange < thirtyDaysMs) {
        toast.error('You can only change your username once every 30 days.');
        return;
      }
    }

    const hasPasswordProvider = user?.providerData?.some(p => p.providerId === 'password');
    if (hasPasswordProvider) {
      const pwd = prompt('Please enter your password to confirm username change:');
      if (!pwd) return;
    } else {
      const confirm = window.confirm('Are you sure you want to change your username?');
      if (!confirm) return;
    }

    setIsChangingUsername(true);
    try {
      await changeUsername(cleanUsername);
      toast.success('Username updated successfully!');
      setNewUsername('');
      setUsernameStatus('');
      setStatusMessage('');
    } catch (e) {
      toast.error(e.message || 'Failed to update username');
    } finally {
      setIsChangingUsername(false);
    }
  };

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

  React.useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const getStatus = httpsCallable(functions, 'getEmailDeliveryStatus');
        const { data } = await getStatus();
        if (!cancelled) {
          setEmailDeliveryStatus({
            loading: false,
            configured: Boolean(data?.configured),
            fromConfigured: Boolean(data?.fromConfigured)
          });
        }
      } catch (error) {
        if (!cancelled) {
          setEmailDeliveryStatus({
            loading: false,
            configured: false,
            fromConfigured: false
          });
        }
        console.warn('[Settings] Email delivery status unavailable:', error);
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const [orionMemory, setOrionMemory] = useStorage('studyos_orion_memory', {
    favoriteSubjects: 'Computer Science, AI, Systems Architecture',
    learningGoals: 'Master full-stack systems and pass exam with distinction',
    explanationStyle: 'Socratic Tutor'
  });

  const [personalIntegrations, setPersonalIntegrations] = useStorage('studyos_personal_integrations', {
    spotifyEmbedUrl: '',
    appleMusicEmbedUrl: '',
    githubUsername: ''
  });

  const [rawNotifSettings, setNotificationSettings] = useStorage(STORAGE_KEYS.NOTIF_SETTINGS, {
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
        roleChanges: { web: true, email: true },
        chat: { web: true, email: false }
      },
      silentHours: { enabled: false, start: '22:00', end: '07:00' },
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
      alarm: {
        ...defaults.alarm,
        ...(candidate.alarm || {})
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

  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [notes] = useStorage(STORAGE_KEYS.NOTES, []);
  const [resources] = useStorage(STORAGE_KEYS.RESOURCES, []);
  const [papers] = useStorage(STORAGE_KEYS.PAPERS, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [streak] = useStorage(STORAGE_KEYS.STREAK, { current: 0 });
  const [achievements, setAchievements] = useStorage(STORAGE_KEYS.ACHIEVEMENTS, []);

  const [storageLoading, setStorageLoading] = useState(false);
  const [storageError, setStorageError] = useState(false);

  const storageInfo = useMemo(() => {
    return calculateStorageFromAssets({
      resources,
      notes,
      papers,
      alarm: notifSettings?.alarm,
      cloudStorage: profile?.usage
    });
  }, [resources, notes, papers, notifSettings, profile]);

  const handleRetryStorage = () => {
    setStorageLoading(true);
    setStorageError(false);
    setTimeout(() => {
      setStorageLoading(false);
    }, 400);
  };

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
      storageUsedMB: storageInfo.totalBytes / (1024 * 1024),
      fileCount: storageInfo.assetCount
    };
  }, [courses, notes, videos, streak, profile, storageInfo]);

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
  const [isRequestRoleOpen, setIsRequestRoleOpen] = useState(false);
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

  const handleAlarmSoundUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!isValidAlarmSoundFile(file)) {
      toast.error('Upload an MP3, WAV, or OGG audio file');
      return;
    }
    if (!user?.id) {
      toast.error('Please sign in to upload a sound');
      return;
    }
    const maxBytes = getAlarmSoundLimitBytes(profile?.plan, profile?.role);
    if (file.size > maxBytes) {
      toast.error(`Sound file is too large. Your account limit is ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`);
      return;
    }

    try {
      setAlarmUploadState({ uploading: true, error: '' });
      const upload = await uploadAlarmSound({ file, userId: user.id, scope: 'settings' });
      setNotificationSettings({
        ...notifSettings,
        alarm: {
          ...notifSettings.alarm,
          enabled: true,
          soundType: 'custom',
          muted: false,
          soundUrl: upload.downloadURL,
          soundPath: upload.storagePath,
          soundName: upload.fileName
        }
      });
      toast.success('Alarm sound uploaded');
    } catch (error) {
      const message = error?.message || 'Sound upload failed';
      setAlarmUploadState({ uploading: false, error: message });
      toast.error(message);
      return;
    }

    setAlarmUploadState({ uploading: false, error: '' });
  };

  const handleTestAlarmSound = async () => {
    try {
      await playAlarmSound({
        soundUrl: notifSettings.alarm?.soundUrl || '',
        volume: notifSettings.alarm?.volume ?? 0.8,
        repeatCount: notifSettings.alarm?.repeatCount ?? 1,
        muted: Boolean(notifSettings.alarm?.muted || notifSettings.alarm?.enabled === false)
      });
      toast.success('Alarm preview played');
    } catch (error) {
      toast.error(error?.message || 'Could not play alarm preview');
    }
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
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    }
  };

  // Categorized Section Registry
  const categories = useMemo(() => [
    {
      name: 'Account & Security',
      icon: Shield,
      items: [
        { id: 'profile', label: 'Profile', icon: User, desc: 'Identity, bio, academic details' },
        { id: 'account', label: 'Account', icon: Shield, desc: 'Credentials & linked accounts' },
        { id: 'security', label: 'Security & Sessions', icon: Lock, desc: 'Active sessions & password reset' },
        { id: 'billing', label: 'Plan & Billing', icon: CreditCard, desc: 'Subscription status & upgrade' }
      ]
    },
    {
      name: 'Preferences & AI',
      icon: Sparkles,
      items: [
        { id: 'personalization', label: 'Personalization', icon: Palette, desc: 'Themes, accent colors & font options' },
        { id: 'study', label: 'Study Setup', icon: Target, desc: 'Daily targets, Pomodoro & timers' },
        { id: 'ai-memory', label: 'AI Memory (Orion)', icon: Sparkles, desc: 'Orion context & persona tuning' },
        { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alerts, silent hours & alarm audio' }
      ]
    },
    {
      name: 'Integrations & System',
      icon: Globe,
      items: [
        { id: 'channels', label: 'Channels Matrix', icon: Mail, desc: 'Web & email notification routing' },
        { id: 'integrations', label: 'Integrations', icon: Globe, desc: 'Calendar, Spotify & external keys' },
        { id: 'storage', label: 'Storage & Assets', icon: HardDrive, desc: 'Disk footprint & asset cleanup' }
      ]
    },
    {
      name: 'Data & Insights',
      icon: Database,
      items: [
        { id: 'data', label: 'Data & Privacy', icon: Database, desc: 'Export, import & factory reset' },
        { id: 'analytics', label: 'Analytics Snapshot', icon: TrendingUp, desc: 'System metrics & study stats' },
        { id: 'achievements', label: 'Achievements', icon: Award, desc: 'Level progress & study milestones' }
      ]
    }
  ], []);

  const allSections = useMemo(() => categories.flatMap(c => c.items), [categories]);

  const currentCategoryObj = useMemo(() => {
    return categories.find(c => c.name === activeCategory) || categories[0];
  }, [activeCategory, categories]);

  const selectCategory = (categoryName) => {
    setActiveCategory(categoryName);
    const cat = categories.find(c => c.name === categoryName);
    if (cat && cat.items.length > 0) {
      setActiveSection(cat.items[0].id);
    }
  };

  const selectSection = (item) => {
    setActiveSection(item.id);
    const parentCat = categories.find(c => c.items.some(i => i.id === item.id));
    if (parentCat) {
      setActiveCategory(parentCat.name);
    }
  };

  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allSections.filter(s => 
      s.label.toLowerCase().includes(q) || 
      s.desc.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  }, [searchQuery, allSections]);

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Settings & Control Hub</h1>
            <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 flex items-center gap-1.5">
              <Zap size={14} className="fill-current" /> StudyOS v2.4
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Manage your profile, Orion AI memory, security sessions, and learning preferences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs">
            <Award size={16} className="text-amber-500" />
            Level 12 Scholar
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <Shield size={16} />
            Verified Account
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* 2. Top Statistics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between group hover:border-primary-500/30 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">98%</span>
              <span className="text-xs font-bold text-emerald-500">Strong</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">2FA & Active Sessions monitored</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
            <Shield size={24} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between group hover:border-primary-500/30 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage Footprint</p>
            {storageLoading ? (
              <p className="text-sm font-bold text-slate-500 animate-pulse py-1">Calculating storage...</p>
            ) : storageError ? (
              <div className="flex items-center gap-2 py-1">
                <span className="text-xs font-bold text-red-500">Unable to calculate storage</span>
                <button onClick={handleRetryStorage} className="text-xs text-primary-500 underline font-bold hover:text-primary-600">Retry</button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{storageInfo.formattedSize}</span>
                <span className="text-xs font-bold text-primary-500">{storageInfo.assetCount} Assets</span>
              </div>
            )}
            <p className="text-xs text-slate-400 font-medium">Documents, notes & alarm audio</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-primary-500/10 text-primary-500 group-hover:scale-110 transition-transform">
            <HardDrive size={24} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between group hover:border-primary-500/30 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orion AI Memory</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">Active</span>
              <span className="text-xs font-bold text-indigo-500">{orionMemory.explanationStyle}</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Personalized study context loaded</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
            <Sparkles size={24} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between group hover:border-primary-500/30 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cloud & Sync Status</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Synced</span>
              <span className="text-xs font-bold text-slate-400">Real-time</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Google Calendar & Cloud Sync active</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-teal-500/10 text-teal-500 group-hover:scale-110 transition-transform">
            <Server size={24} />
          </div>
        </div>
      </div>

      {/* 3. OPTION 1: HORIZONTAL SUB-NAVIGATION BAR */}
      <div className="space-y-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => selectCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-primary-500 dark:text-white shadow-md scale-[1.02]'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <cat.icon size={16} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {!filteredSearchResults ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {currentCategoryObj.items.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => selectSection(item)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/30 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <item.icon size={15} className={isActive ? 'text-primary-500' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-bold text-slate-400">Search Results ({filteredSearchResults.length}):</p>
            <div className="flex flex-wrap items-center gap-2">
              {filteredSearchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    selectSection(item);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary-500/10 text-primary-500 border border-primary-500/20 hover:bg-primary-500 hover:text-white transition-all"
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Full Width Settings Content Section */}
      <div className="w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* SECTION 1: PROFILE */}
            {activeSection === 'profile' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-500">
                      <User size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Profile Information</h3>
                      <p className="text-xs text-slate-400 font-medium">Manage your personal identity & academic details</p>
                    </div>
                  </div>
                  {!isEditingProfile && (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-primary-500 hover:text-white transition-all border border-slate-200 dark:border-slate-700"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {!isEditingProfile ? (
                  <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="relative group">
                        <img 
                          src={displayAvatar} 
                          alt="Profile" 
                          onError={() => setAvatarFallback(true)}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md"
                        />
                        <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-white shadow-xs">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                            {user?.name || 'StudyOS Scholar'}
                          </h4>
                          {profile?.username && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              @{profile.username}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2">
                          <Mail size={16} /> {user?.email}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          "{user?.bio || 'No bio added yet. Tell the community about your learning journey!'}"
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <School size={16} /> Academic Details
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                            <span className="text-slate-400 font-medium">University</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.university || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                            <span className="text-slate-400 font-medium">Degree</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.degree || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400 font-medium">Year/Sem</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.year || 'Not set'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <Phone size={16} /> Contact Information
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                            <span className="text-slate-400 font-medium">Phone</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.phone || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                            <span className="text-slate-400 font-medium">Email Status</span>
                            <span className="font-bold text-emerald-500 flex items-center gap-1">
                              Verified <Check size={14} />
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400 font-medium">Role</span>
                            <span className="font-bold text-primary-500 uppercase text-xs tracking-wider">{profile?.role || 'Student'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION: ACCESS & SYSTEM ROLE CAPABILITIES */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500 border border-primary-500/20">
                            <Shield size={18} />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Access & System Role Capabilities</h5>
                            <p className="text-xs text-slate-400">Permissions granted to your user profile</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsRequestRoleOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-primary-500/10 hover:bg-primary-500 hover:text-white text-primary-600 dark:text-primary-400 font-bold text-xs transition-all border border-primary-500/20"
                        >
                          Request Upgrade
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Role</span>
                          <p className="font-black text-slate-800 dark:text-white uppercase flex items-center gap-1.5">
                            {getPredefinedRoleByCode(profile?.role)?.name || profile?.role || 'Learner'}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Module Access</span>
                          <p className="font-black text-primary-500">
                            {getPredefinedRoleByCode(profile?.role)?.modules.length || 7} Modules Granted
                          </p>
                        </div>
                      </div>

                      <RequestRoleModal
                        isOpen={isRequestRoleOpen}
                        onClose={() => setIsRequestRoleOpen(false)}
                      />
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-4">
                      <div>
                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Change Handles (@username)</h5>
                        <p className="text-xs text-slate-400">Can be changed once every 30 days.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                          <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="new_username"
                            className="w-full pl-8 pr-4 py-2 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={handleChangeUsername}
                          disabled={usernameStatus !== 'available' || isChangingUsername}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs disabled:opacity-50 hover:bg-primary-700 transition-all shrink-0"
                        >
                          {isChangingUsername ? 'Updating...' : 'Update Username'}
                        </button>
                      </div>
                      {statusMessage && (
                        <p className={`text-xs font-semibold ${usernameStatus === 'available' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {statusMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="flex items-center gap-6">
                      <img 
                        src={profileForm.avatar || displayAvatar} 
                        alt="Avatar Preview" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary-500"
                      />
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Upload Avatar Image
                        </label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-500/10 file:text-primary-500 hover:file:bg-primary-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                        <input 
                          type="text" 
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">University</label>
                        <input 
                          type="text" 
                          value={profileForm.university}
                          onChange={(e) => setProfileForm(p => ({ ...p, university: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Degree</label>
                        <input 
                          type="text" 
                          value={profileForm.degree}
                          onChange={(e) => setProfileForm(p => ({ ...p, degree: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bio</label>
                      <textarea 
                        rows={3}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition-all flex items-center gap-1.5"
                      >
                        <Save size={16} /> Save Profile
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* SECTION 2: ACCOUNT */}
            {activeSection === 'account' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                    <Shield size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Account Settings & Credentials</h3>
                    <p className="text-xs text-slate-400 font-medium">Manage linked authentication providers & account actions</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Password / Reset */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Security Credentials</h4>
                      <p className="text-xs text-slate-400">Send password recovery link to {user?.email}</p>
                    </div>
                    <button
                      onClick={handleResetPassword}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-primary-600 transition-all"
                    >
                      Reset Password
                    </button>
                  </div>

                  {/* Danger Zone: Account Deletion */}
                  <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-red-600 dark:text-red-400">Danger Zone: Delete Account</h4>
                      <p className="text-xs text-slate-400">Permanently delete your profile, notes, and study history.</p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Delete Account
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 3: SECURITY & SESSIONS */}
            {activeSection === 'security' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                      <Lock size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Security & Active Sessions</h3>
                      <p className="text-xs text-slate-400 font-medium">Manage logged-in devices and access controls</p>
                    </div>
                  </div>
                  {activeSessions.length > 1 && (
                    <button
                      onClick={handleRevokeAllSessions}
                      className="px-3.5 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    >
                      Revoke All Other Devices
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Smartphone size={16} /> Active Sessions ({activeSessions.length})
                  </h4>

                  {sessionsLoading ? (
                    <p className="text-xs text-slate-400">Loading active sessions...</p>
                  ) : (
                    <div className="space-y-3">
                      {activeSessions.map((session) => (
                        <div key={session.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                              {session.device?.includes('Mobile') ? <Smartphone size={18} /> : <Laptop size={18} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {session.device || 'Desktop Browser'}
                                </p>
                                {session.isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-extrabold text-[10px]">
                                    Current Device
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                IP: {session.ip || 'Local Network'} • Last active: {session.lastActive ? new Date(session.lastActive).toLocaleTimeString() : 'Just now'}
                              </p>
                            </div>
                          </div>
                          {!session.isCurrent && (
                            <button
                              onClick={() => handleRevokeSession(session.id)}
                              className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* SECTION 4: PERSONALIZATION */}
            {activeSection === 'personalization' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500">
                    <Palette size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Personalization & Visual Theme</h3>
                    <p className="text-xs text-slate-400 font-medium">Customize workspace theme, accent colors, and font layout</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Accent Color Palette</label>
                    <div className="flex items-center gap-3">
                      {['#0ea5e9', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setPersonalization(p => ({ ...p, accentColor: color }))}
                          className={`w-10 h-10 rounded-2xl transition-all border-2 flex items-center justify-center ${
                            personalization.accentColor === color ? 'border-white ring-2 ring-primary-500 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {personalization.accentColor === color && <Check size={18} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Font Size Scale</label>
                      <select
                        value={personalization.fontSize}
                        onChange={(e) => setPersonalization(p => ({ ...p, fontSize: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <option value="small">Compact (Small)</option>
                        <option value="medium">Standard (Medium)</option>
                        <option value="large">Large (Comfortable)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Default Landing Module</label>
                      <select
                        value={personalization.defaultLanding}
                        onChange={(e) => setPersonalization(p => ({ ...p, defaultLanding: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <option value="dashboard">Dashboard Overview</option>
                        <option value="courses">Learning Streams (Courses)</option>
                        <option value="tasks">Tasks & Kanban Board</option>
                        <option value="notes">Study Notes</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 5: STUDY SETUP */}
            {activeSection === 'study' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Target size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Study Setup & Target Goals</h3>
                    <p className="text-xs text-slate-400 font-medium">Configure daily focus minutes, Pomodoro timers & preferred slots</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Daily Study Focus Target (Minutes)
                    </label>
                    <input
                      type="number"
                      value={studyPrefs.dailyGoal}
                      onChange={(e) => setStudyPrefs(s => ({ ...s, dailyGoal: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Recommended: 120 minutes per day</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Pomodoro Cycle Duration (Minutes)
                    </label>
                    <select
                      value={studyPrefs.pomodoro}
                      onChange={(e) => setStudyPrefs(s => ({ ...s, pomodoro: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <option value={25}>25 Minutes (Standard)</option>
                      <option value={45}>45 Minutes (Deep Focus)</option>
                      <option value={50}>50 Minutes (University Exam Style)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Short Break Interval (Minutes)
                    </label>
                    <select
                      value={studyPrefs.breakInterval}
                      onChange={(e) => setStudyPrefs(s => ({ ...s, breakInterval: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <option value={5}>5 Minutes</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Study Time Window
                    </label>
                    <select
                      value={studyPrefs.preferredSlot}
                      onChange={(e) => setStudyPrefs(s => ({ ...s, preferredSlot: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <option value="Morning">Morning (06:00 - 12:00)</option>
                      <option value="Afternoon">Afternoon (12:00 - 17:00)</option>
                      <option value="Evening">Evening (17:00 - 22:00)</option>
                      <option value="Night">Night Owl (22:00 - 04:00)</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 6: AI MEMORY (ORION) */}
            {activeSection === 'ai-memory' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Orion AI Memory & Context</h3>
                      <p className="text-xs text-slate-400 font-medium">Fine-tune Orion's tutor persona and saved context</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Orion Explanation Tone / Persona Style
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['Socratic Tutor', 'Exam Specialist', 'Friendly Coach'].map((style) => (
                        <button
                          key={style}
                          onClick={() => setOrionMemory(m => ({ ...m, explanationStyle: style }))}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            orionMemory.explanationStyle === style
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <p className="text-xs font-bold">{style}</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {style === 'Socratic Tutor' ? 'Guides through questions & deep insights' : style === 'Exam Specialist' ? 'Focuses on formulas, test tips & mark criteria' : 'Encouraging tone with quick step-by-step notes'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Favorite Subjects & Core Focus
                    </label>
                    <input 
                      type="text"
                      value={orionMemory.favoriteSubjects}
                      onChange={(e) => setOrionMemory(m => ({ ...m, favoriteSubjects: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                      placeholder="e.g. Distributed Systems, Machine Learning, Organic Chemistry"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Learning Goals & Exam Deadlines Context
                    </label>
                    <textarea
                      rows={3}
                      value={orionMemory.learningGoals}
                      onChange={(e) => setOrionMemory(m => ({ ...m, learningGoals: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                      placeholder="Tell Orion what grade target or milestone you are preparing for..."
                    />
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 7: NOTIFICATIONS & ALARM */}
            {activeSection === 'notifications' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
                      <Bell size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Notifications & Custom Alarms</h3>
                      <p className="text-xs text-slate-400 font-medium">Configure alert triggers and study alarm sounds</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Volume2 size={16} /> Custom Alarm Audio Player
                      </h4>
                      <p className="text-xs text-slate-400">Upload your own MP3/WAV alarm audio for Pomodoro sessions.</p>
                    </div>
                    <button
                      onClick={handleTestAlarmSound}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-all flex items-center gap-1.5"
                    >
                      <Play size={14} /> Test Sound Preview
                    </button>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAlarmSoundUpload}
                      disabled={alarmUploadState.uploading}
                      className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-500/10 file:text-purple-600 hover:file:bg-purple-500/20"
                    />
                    {notifSettings.alarm?.soundName && (
                      <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
                        Active: {notifSettings.alarm.soundName}
                      </span>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 8: CHANNELS MATRIX */}
            {activeSection === 'channels' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500">
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Channels Alert Routing Matrix</h3>
                    <p className="text-xs text-slate-400 font-medium">Control notification delivery modes per category</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 font-bold">Alert Category</th>
                        <th className="py-3 px-4 font-bold text-center">In-App Web Push</th>
                        <th className="py-3 px-4 font-bold text-center">Email Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { key: 'reminder', label: 'Study Reminders & Goals' },
                        { key: 'deadline', label: 'Course Assignment Deadlines' },
                        { key: 'streak', label: 'Streak Risk & Momentum Alerts' },
                        { key: 'roleChanges', label: 'System & Security Announcements' }
                      ].map(({ key, label }) => (
                        <tr key={key}>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{label}</td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={notifSettings.channels?.[key]?.web ?? true}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNotificationSettings(n => ({
                                  ...n,
                                  channels: {
                                    ...n.channels,
                                    [key]: { ...(n.channels?.[key] || {}), web: checked }
                                  }
                                }));
                              }}
                              className="w-4 h-4 rounded text-primary-600"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={notifSettings.channels?.[key]?.email ?? false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNotificationSettings(n => ({
                                  ...n,
                                  channels: {
                                    ...n.channels,
                                    [key]: { ...(n.channels?.[key] || {}), email: checked }
                                  }
                                }));
                              }}
                              className="w-4 h-4 rounded text-primary-600"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* SECTION 9: INTEGRATIONS */}
            {activeSection === 'integrations' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500">
                    <Globe size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">External Integrations & Sync</h3>
                    <p className="text-xs text-slate-400 font-medium">Connect Google Calendar, Spotify, and developer webhooks</p>
                  </div>
                </div>

                <GoogleCalendarSettings />
              </section>
            )}

            {/* SECTION 10: STORAGE & ASSETS */}
            {activeSection === 'storage' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
                      <HardDrive size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Storage & Media Assets</h3>
                      <p className="text-xs text-slate-400 font-medium">Inspect cloud & local disk storage allocation</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Disk Storage Used</span>
                    <span className="text-cyan-500">{storageInfo.formattedSize} / 500 MB (Free Tier)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (storageInfo.totalBytes / (500 * 1024 * 1024)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Documents</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{resources.length}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Study Notes</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{notes.length}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Videos Watched</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{videos.length}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Papers Saved</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{papers.length}</p>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 11: PLAN & BILLING */}
            {activeSection === 'billing' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Plan & Subscription Billing</h3>
                    <p className="text-xs text-slate-400 font-medium">Manage your subscription plan, tier benefits & billing invoice history</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                    <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">Current Tier</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">$0 / month</h4>
                    <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Standard Pomodoro Timers</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Up to 500MB Storage</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Basic Orion AI Queries</li>
                    </ul>
                  </div>

                  <div className="p-6 rounded-3xl bg-gradient-to-b from-primary-500/10 to-indigo-500/10 border-2 border-primary-500 space-y-4 relative">
                    <span className="px-3 py-1 rounded-full bg-primary-600 text-white text-xs font-extrabold uppercase tracking-wider">Recommended</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">$9.99 / month</h4>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-bold">
                      <li className="flex items-center gap-2"><Check size={14} className="text-primary-500" /> Unlimited Orion AI Context</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-primary-500" /> 50 GB Cloud Storage</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-primary-500" /> Priority 2-Way Google Sync</li>
                    </ul>
                    <button
                      onClick={() => handleUpgrade(proPriceId)}
                      disabled={isUpgrading}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all"
                    >
                      {isUpgrading ? 'Redirecting to Checkout...' : 'Upgrade to Pro Scholar'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 12: DATA & PRIVACY */}
            {activeSection === 'data' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Database size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Data & Privacy Governance</h3>
                    <p className="text-xs text-slate-400 font-medium">Export backup packages, import data, and manage privacy options</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Backup & Data Package Export</h4>
                      <p className="text-xs text-slate-400">Download a full JSON package of your courses, notes, and progress.</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition-all flex items-center gap-1.5"
                    >
                      <Download size={14} /> Export Backup JSON
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Import Backup Data</h4>
                      <p className="text-xs text-slate-400">Restore your StudyOS configuration and saved notes from a backup JSON.</p>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-800"
                    />
                  </div>

                  <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-red-600 dark:text-red-400">Factory Reset / Clear All Data</h4>
                      <p className="text-xs text-slate-400">Irreversibly delete all local storage data and reset to default.</p>
                    </div>
                    <button
                      onClick={handleClearData}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Reset All Data
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 13: ANALYTICS SNAPSHOT */}
            {activeSection === 'analytics' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Analytics Performance Snapshot</h3>
                    <p className="text-xs text-slate-400 font-medium">Real-time study metrics, course progress & note stats</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Study Hours</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics.studyTime}h</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Active Courses</p>
                    <p className="text-3xl font-black text-primary-500">{analytics.active}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Completed Courses</p>
                    <p className="text-3xl font-black text-emerald-500">{analytics.completed}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Study Notes Created</p>
                    <p className="text-3xl font-black text-purple-500">{analytics.notes}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Study Streak</p>
                    <p className="text-3xl font-black text-red-500">{analytics.streak} Days</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Productivity Index</p>
                    <p className="text-3xl font-black text-teal-500">{analytics.productivity}%</p>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 14: ACHIEVEMENTS */}
            {activeSection === 'achievements' && (
              <section className="card p-6 space-y-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                    <Award size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Scholar Achievements & Badges</h3>
                    <p className="text-xs text-slate-400 font-medium">Track your study milestones and unlockable scholar rewards</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {computedAchievements.map((item) => (
                    <div key={item.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-900 ${item.color}`}>
                            <item.icon size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                            <p className="text-xs text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                        {item.unlocked && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px] uppercase tracking-wider">
                            Unlocked
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                          <span>Progress ({item.value} / {item.target})</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Confirmation Modal Overlay */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Settings;
