const STORAGE_KEYS = {
  COURSES: 'studyos_courses',
  VIDEOS: 'studyos_videos',
  NOTES: 'studyos_notes',
  RESOURCES: 'studyos_resources',
  FOLDERS: 'studyos_folders',
  PAPERS: 'studyos_papers',
  PROJECTS: 'studyos_projects',
  TASKS: 'studyos_tasks',
  ANALYTICS: 'studyos_analytics',
  REMINDERS: 'studyos_reminders',
  SETTINGS: 'studyos_settings',
  STREAK: 'studyos_streak',
  NOTIFICATIONS: 'studyos_notifications',
  PERSONALIZATION: 'studyos_personalization',
  STUDY_PREFS: 'studyos_study_prefs',
  NOTIF_SETTINGS: 'studyos_notif_settings',
  PRIVACY: 'studyos_privacy',
};

class StorageService {
  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage [${key}]:`, error);
      return null;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
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
