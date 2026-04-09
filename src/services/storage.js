const STORAGE_KEYS = {
  COURSES: 'studyos_courses',
  VIDEOS: 'studyos_videos',
  NOTES: 'studyos_notes',
  RESOURCES: 'studyos_resources',
  FOLDERS: 'studyos_folders',
  PAPERS: 'studyos_papers',
  PROJECTS: 'studyos_projects',
  ASSIGNMENTS: 'studyos_assignments',
  TASKS: 'studyos_tasks',
  ANALYTICS: 'studyos_analytics',
  GOALS: 'studyos_goals',
  WEEKLY_PLANNER: 'studyos_weekly_planner',
  REVIEW_PREFS: 'studyos_review_prefs',
  ACHIEVEMENTS: 'studyos_achievements',
  REMINDERS: 'studyos_reminders',
  SETTINGS: 'studyos_settings',
  STREAK: 'studyos_streak',
  NOTIFICATIONS: 'studyos_notifications',
  PERSONALIZATION: 'studyos_personalization',
  STUDY_PREFS: 'studyos_study_prefs',
  NOTIF_SETTINGS: 'studyos_notif_settings',
  PRIVACY: 'studyos_privacy',
};

const defaultSchemas = {
  [STORAGE_KEYS.PERSONALIZATION]: {
    accentColor: '#0ea5e9',
    fontSize: 'medium',
    dashboardLayout: 'grid',
    defaultLanding: 'dashboard'
  },
  [STORAGE_KEYS.STUDY_PREFS]: {
    dailyGoal: 120,
    preferredSlot: 'Morning',
    pomodoro: 25,
    breakInterval: 5,
    defaultDifficulty: 'Intermediate'
  },
  [STORAGE_KEYS.NOTIF_SETTINGS]: {
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
    channels: {
      reminder: { web: true, email: true },
      deadline: { web: true, email: false },
      streak: { web: true, email: false },
      roleChanges: { web: true, email: true }
    },
    silentHours: { enabled: false, start: '22:00', end: '07:00' },
    emailNotifications: { roleChanges: true, reminders: true }
  },
  [STORAGE_KEYS.PRIVACY]: {
    isPublic: false,
    activityVisible: true,
    analyticsConsent: true,
    dataRetentionDays: 365,
    autoDeleteCompletedReminders: false,
    autoDeleteImportedBackups: false
  }
};

const boundedNumber = (value, fallback, min, max) => {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
};

const normalizeBySchema = (key, value) => {
  if (!(key in defaultSchemas) || value === null || typeof value !== 'object') return value;

  const schema = defaultSchemas[key];
  const merged = { ...schema, ...value };

  if (key === STORAGE_KEYS.PERSONALIZATION) {
    const validFontSizes = ['small', 'medium', 'large'];
    const validLayouts = ['grid', 'list'];
    merged.fontSize = validFontSizes.includes(merged.fontSize) ? merged.fontSize : schema.fontSize;
    merged.dashboardLayout = validLayouts.includes(merged.dashboardLayout) ? merged.dashboardLayout : schema.dashboardLayout;
    merged.accentColor = typeof merged.accentColor === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(merged.accentColor)
      ? merged.accentColor
      : schema.accentColor;
  }

  if (key === STORAGE_KEYS.STUDY_PREFS) {
    const validSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const validDifficulty = ['Beginner', 'Intermediate', 'Advanced'];
    merged.dailyGoal = boundedNumber(merged.dailyGoal, schema.dailyGoal, 30, 480);
    merged.pomodoro = boundedNumber(merged.pomodoro, schema.pomodoro, 10, 120);
    merged.breakInterval = boundedNumber(merged.breakInterval, schema.breakInterval, 1, 60);
    merged.preferredSlot = validSlots.includes(merged.preferredSlot) ? merged.preferredSlot : schema.preferredSlot;
    merged.defaultDifficulty = validDifficulty.includes(merged.defaultDifficulty) ? merged.defaultDifficulty : schema.defaultDifficulty;
  }

  if (key === STORAGE_KEYS.NOTIF_SETTINGS) {
    merged.enabled = Boolean(merged.enabled);
    merged.reminders = Boolean(merged.reminders);
    merged.deadlines = Boolean(merged.deadlines);
    merged.streaks = Boolean(merged.streaks);
    merged.method = ['browser', 'email', 'both'].includes(merged.method) ? merged.method : schema.method;
    merged.deliveryMode = ['server', 'local'].includes(merged.deliveryMode) ? merged.deliveryMode : schema.deliveryMode;
    merged.defaultSnoozeMinutes = boundedNumber(merged.defaultSnoozeMinutes, schema.defaultSnoozeMinutes, 1, 240);
    merged.emailNotifications = {
      ...schema.emailNotifications,
      ...(merged.emailNotifications || {})
    };
    merged.channels = {
      ...schema.channels,
      ...(merged.channels || {})
    };
    Object.keys(schema.channels).forEach((channelKey) => {
      merged.channels[channelKey] = {
        ...schema.channels[channelKey],
        ...(merged.channels[channelKey] || {})
      };
    });
    merged.silentHours = {
      ...schema.silentHours,
      ...(merged.silentHours || {})
    };
    merged.alarm = {
      ...schema.alarm,
      ...(merged.alarm || {})
    };
    merged.alarm.enabled = Boolean(merged.alarm.enabled);
    merged.alarm.muted = Boolean(merged.alarm.muted);
    merged.alarm.volume = Math.max(0, Math.min(1, Number(merged.alarm.volume ?? schema.alarm.volume) || schema.alarm.volume));
    merged.alarm.repeatCount = boundedNumber(merged.alarm.repeatCount, schema.alarm.repeatCount, 1, 5);
    merged.alarm.soundType = ['default', 'custom'].includes(merged.alarm.soundType) ? merged.alarm.soundType : schema.alarm.soundType;
    merged.alarm.soundUrl = typeof merged.alarm.soundUrl === 'string' ? merged.alarm.soundUrl : schema.alarm.soundUrl;
    merged.alarm.soundPath = typeof merged.alarm.soundPath === 'string' ? merged.alarm.soundPath : schema.alarm.soundPath;
    merged.alarm.soundName = typeof merged.alarm.soundName === 'string' ? merged.alarm.soundName : schema.alarm.soundName;
  }

  if (key === STORAGE_KEYS.PRIVACY) {
    merged.isPublic = Boolean(merged.isPublic);
    merged.activityVisible = Boolean(merged.activityVisible);
    merged.analyticsConsent = Boolean(merged.analyticsConsent);
    merged.dataRetentionDays = boundedNumber(merged.dataRetentionDays, schema.dataRetentionDays, 30, 3650);
    merged.autoDeleteCompletedReminders = Boolean(merged.autoDeleteCompletedReminders);
    merged.autoDeleteImportedBackups = Boolean(merged.autoDeleteImportedBackups);
  }

  return merged;
};

class StorageService {
  static get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      return normalizeBySchema(key, parsed);
    } catch (error) {
      console.error(`Error reading from localStorage [${key}]:`, error);
      return null;
    }
  }

  static set(key, value) {
    try {
      const normalized = normalizeBySchema(key, value);
      localStorage.setItem(key, JSON.stringify(normalized));
    } catch (error) {
      console.error(`Error writing to localStorage [${key}]:`, error);
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage [${key}]:`, error);
    }
  }

  static getAll() {
    const data = {};
    Object.keys(STORAGE_KEYS).forEach((key) => {
      data[key] = this.get(STORAGE_KEYS[key]);
    });
    return data;
  }

  static clear() {
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.remove(key);
    });
  }
}

export { STORAGE_KEYS, StorageService };
