import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useStorage } from '../hooks/useStorage';
import { STORAGE_KEYS } from '../services/storage';
import { useAuth } from './AuthContext';
import { useGoogleCalendarContext } from './GoogleCalendarContext';
import { createGoogleCalendarEvent } from '../services/googleCalendar';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { EmailService } from '../services/email';
import { formatDateKey, formatTimeKey, toReminderDateTime } from '../utils/reminderDate';
import { stopAlarmSound, getIsPlaying } from '../utils/alarmAudio';

const ReminderContext = createContext();

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
};

export const ReminderProvider = ({ children }) => {
  const { user } = useAuth();

  const normalizeReminder = useCallback((reminder) => ({
    ...reminder,
    title: reminder.title || reminder.message || '',
    message: reminder.message || reminder.title || '',
    date: reminder.date || formatDateKey(new Date()),
    time: reminder.time || '09:00',
    allDay: reminder.allDay ?? false,
    durationMinutes: Number(reminder.durationMinutes || 60),
    reminderOffsetMinutes: Number(reminder.reminderOffsetMinutes ?? 15),
    recurring: reminder.recurring || 'None',
    recurringIntervalDays: Number(reminder.recurringIntervalDays || 1),
    enabled: reminder.enabled ?? true,
    completed: reminder.completed ?? false,
    snoozeEnabled: reminder.snoozeEnabled ?? true,
    snoozeMinutes: Number(reminder.snoozeMinutes || 10),
    soundMode: ['inherit', 'custom', 'mute'].includes(reminder.soundMode) ? reminder.soundMode : 'inherit',
    soundUrl: reminder.soundUrl || '',
    soundPath: reminder.soundPath || '',
    soundName: reminder.soundName || '',
    soundVolume: Number(reminder.soundVolume ?? 0.8),
    lastTriggered: reminder.lastTriggered || [],
    missed: reminder.missed ?? false,
    missedCount: Number(reminder.missedCount || 0)
  }), []);

  const getTriggerDateTime = useCallback((reminder) => {
    const eventAt = toReminderDateTime(reminder.date, reminder.time);
    if (!eventAt) return null;

    const triggerAt = new Date(eventAt);
    triggerAt.setMinutes(triggerAt.getMinutes() - Number(reminder.reminderOffsetMinutes || 0));
    return triggerAt;
  }, []);

  const getNextRecurringDate = useCallback((date, recurring, customDays = 1) => {
    const next = new Date(date);
    if (recurring === 'Daily') next.setDate(next.getDate() + 1);
    if (recurring === 'Weekly') next.setDate(next.getDate() + 7);
    if (recurring === 'Monthly') next.setMonth(next.getMonth() + 1);
    if (recurring === 'Custom') next.setDate(next.getDate() + Number(customDays || 1));
    return next;
  }, []);
  
  // 1. State Management (Synced with useStorage)
  const [reminders, setReminders] = useStorage(STORAGE_KEYS.REMINDERS, []);
  const [notifications, setNotifications] = useStorage(STORAGE_KEYS.NOTIFICATIONS, [
    { id: 1, title: 'Welcome to StudyOs!', message: 'Start by adding your first course.', time: 'Just now', type: 'info', read: false, timestamp: new Date().toISOString(), route: '/courses' },
  ]);
  const [notificationSettings] = useStorage(STORAGE_KEYS.NOTIF_SETTINGS, {
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
      roleChanges: { web: true, email: true },
      chat: { web: true, email: false }
    },
    silentHours: { enabled: false, start: '22:00', end: '07:00' },
    emailNotifications: { roleChanges: true, reminders: true }
  });
  const [privacySettings] = useStorage(STORAGE_KEYS.PRIVACY, {
    dataRetentionDays: 365,
    autoDeleteCompletedReminders: false,
    autoDeleteImportedBackups: false
  });

  // 2. CRUD Operations
  const { googleAccessToken, syncEnabled } = useGoogleCalendarContext();

  const addReminder = useCallback((formData) => {
    const newReminder = normalizeReminder({
      ...formData,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      lastTriggered: []
    });
    setReminders(prev => [newReminder, ...prev]);
    toast.success('Study alert launched');

    if (syncEnabled && googleAccessToken) {
      createGoogleCalendarEvent(googleAccessToken, newReminder)
        .then((googleEvent) => {
          if (googleEvent?.id) {
            setReminders((prev) => prev.map((reminder) => (
              reminder.id === newReminder.id ? { ...reminder, googleCalendarEventId: googleEvent.id } : reminder
            )));
          }
        })
        .catch((error) => {
          console.error('Failed to sync new reminder to Google Calendar:', error);
        });
    }

    return newReminder.id;
  }, [normalizeReminder, setReminders, googleAccessToken, syncEnabled]);

  const updateReminder = useCallback((id, updates) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? normalizeReminder({ ...r, ...updates, updatedAt: new Date().toISOString() }) : r
    ));
    toast.success('Study alert updated');
  }, [normalizeReminder, setReminders]);

  const deleteReminder = useCallback((id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success('Reminder archived');
  }, [setReminders]);

  const toggleReminderEnabled = useCallback((id) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, [setReminders]);

  const markReminderAsDone = useCallback((id) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: true, enabled: false, completedAt: new Date().toISOString(), missed: false } : r));
    toast.success('Knowledge task finalized!');
  }, [setReminders]);

  const markRemindersAsDone = useCallback((ids) => {
    if (!ids?.length) return;

    const idSet = new Set(ids);
    setReminders(prev => prev.map(r => (
      idSet.has(r.id) ? { ...r, completed: true, enabled: false, updatedAt: new Date().toISOString() } : r
    )));
    toast.success(`${ids.length} alert${ids.length > 1 ? 's' : ''} completed`);
  }, [setReminders]);

  const disableOverdueReminders = useCallback(() => {
    const now = new Date();
    let disabledCount = 0;

    setReminders(prev => prev.map(r => {
      const reminderAt = toReminderDateTime(r.date, r.time);
      const shouldDisable = r.enabled && !r.completed && reminderAt ? reminderAt < now : false;
      if (shouldDisable) disabledCount += 1;
      return shouldDisable ? { ...r, enabled: false, updatedAt: new Date().toISOString() } : r;
    }));

    if (disabledCount > 0) {
      toast.success(`Disabled ${disabledCount} overdue alert${disabledCount > 1 ? 's' : ''}`);
    } else {
      toast('No overdue active alerts found');
    }
  }, [setReminders]);

  const archiveCompletedReminders = useCallback(() => {
    let archivedCount = 0;
    setReminders(prev => {
      const next = prev.filter(r => {
        const keep = !r.completed;
        if (!keep) archivedCount += 1;
        return keep;
      });
      return next;
    });

    if (archivedCount > 0) {
      toast.success(`Archived ${archivedCount} completed alert${archivedCount > 1 ? 's' : ''}`);
    } else {
      toast('No completed alerts to archive');
    }
  }, [setReminders]);

  // 3. Notification Handlers
  const addNotification = useCallback((notif) => {
    const prefs = notificationSettings || {};
    if (prefs.enabled === false) return;

    const typeMap = {
      reminder: 'reminder',
      deadline: 'deadline',
      streak: 'streak',
      roleChanges: 'roleChanges',
      chat: 'chat',
      'chat-mention': 'chat',
      'chat-share': 'chat'
    };
    const channelKey = typeMap[notif?.type] || 'reminder';
    const channel = prefs.channels?.[channelKey];
    if (channel?.web === false) return;
    if (notif?.type === 'deadline' && prefs.deadlines === false) return;
    if (notif?.type === 'streak' && prefs.streaks === false) return;
    if (notif?.type === 'reminder' && prefs.reminders === false) return;

    setNotifications(prev => {
      const duplicate = prev.find((existing) => {
        if (existing.type !== notif.type) return false;
        if (notif.reminderId && existing.reminderId !== notif.reminderId) return false;
        if (existing.title !== notif.title) return false;
        if (existing.message !== notif.message) return false;
        if (existing.route !== notif.route) return false;

        // If unread, always consider it a duplicate
        if (existing.read === false) {
          return true;
        }

        // If read, check timestamp freshness
        if (existing.timestamp) {
          const existingDate = new Date(existing.timestamp);
          const ageMs = Math.abs(Date.now() - existingDate.getTime());
          // Duplicate if less than 90 seconds old
          if (ageMs < 90000) return true;
          // Duplicate if same date
          const todayKey = formatDateKey(new Date());
          return formatDateKey(existingDate) === todayKey;
        }

        return true;
      });

      if (duplicate) {
        console.log(`[ReminderContext] Duplicate blocked for: ${notif.title}`);
        return prev;
      }
      return [{ id: nanoid(), ...notif, time: 'Just now', timestamp: new Date().toISOString(), read: false }, ...prev];
    });
  }, [setNotifications, notificationSettings]);

  const markNotificationAsPresented = useCallback((id, updates = {}) => {
    setNotifications((prev) => prev.map((n) => (
      n.id === id ? { ...n, ...updates } : n
    )));
  }, [setNotifications]);

  const isWithinSilentHours = useCallback((now, silentHours) => {
    if (!silentHours?.enabled) return false;
    const [startHour, startMin] = String(silentHours.start || '22:00').split(':').map(Number);
    const [endHour, endMin] = String(silentHours.end || '07:00').split(':').map(Number);
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const startMinutes = (startHour * 60) + startMin;
    const endMinutes = (endHour * 60) + endMin;
    if (startMinutes === endMinutes) return true;
    if (startMinutes < endMinutes) {
      return minutesNow >= startMinutes && minutesNow < endMinutes;
    }
    return minutesNow >= startMinutes || minutesNow < endMinutes;
  }, []);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [setNotifications]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [setNotifications]);

  const clearReadNotifications = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    toast.success('Cleared read notifications');
  }, [setNotifications]);

  const snoozeReminder = useCallback((notifId, reminderId, minutesOverride) => {
    const target = reminders.find(r => r.id === reminderId);
    if (!target) return;

    const snoozeMinutes = Number(minutesOverride || target.snoozeMinutes || 10);
    const now = new Date();
    now.setMinutes(now.getMinutes() + snoozeMinutes);
    const snoozeDate = formatDateKey(now);
    const snoozeTime = formatTimeKey(now);

    setReminders(prev => prev.map(r => 
      r.id === reminderId 
        ? { ...r, date: snoozeDate, time: snoozeTime, completed: false, enabled: true, updatedAt: new Date().toISOString() } 
        : r
    ));

    setNotifications(prev => prev.filter(n => n.id !== notifId));
    toast.success(`Alert snoozed for ${snoozeMinutes} minutes`);
  }, [reminders, setReminders, setNotifications]);

  const muteReminder = useCallback((notifId, reminderId) => {
    const target = reminders.find(r => r.id === reminderId);
    if (!target) return;

    stopAlarmSound();

    setReminders(prev => prev.map(r =>
      r.id === reminderId
        ? { ...r, soundMode: 'mute', updatedAt: new Date().toISOString() }
        : r
    ));

    if (notifId) {
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    }

    toast.success('Muted this reminder');
  }, [reminders, setReminders, setNotifications]);

  const unmuteReminder = useCallback((notifId, reminderId) => {
    const target = reminders.find(r => r.id === reminderId);
    if (!target) return;

    stopAlarmSound();

    setReminders(prev => prev.map(r =>
      r.id === reminderId
        ? { ...r, soundMode: 'inherit', updatedAt: new Date().toISOString() }
        : r
    ));

    if (notifId) {
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    }

    toast.success('Unmuted this reminder');
  }, [reminders, setReminders, setNotifications]);

  // Keep a ref of the latest reminders and notifications to avoid effect loops and stale closures
  const remindersRef = useRef(reminders);
  const notificationsRef = useRef(notifications);
  const triggeredReminderKeysRef = useRef(new Set());
  const deadlineNotifiedRef = useRef(new Set());
  const lastRefreshDayRef = useRef(formatDateKey(new Date()));
  useEffect(() => { remindersRef.current = reminders; }, [reminders]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);
  
  // Clear session refs at midnight to prevent all-day carryover
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const today = formatDateKey(new Date());
      if (today !== lastRefreshDayRef.current) {
        lastRefreshDayRef.current = today;
        triggeredReminderKeysRef.current.clear();
        deadlineNotifiedRef.current.clear();
        console.log('[ReminderContext] Session refs cleared at day boundary');
      }
    }, 60000);
    return () => clearInterval(checkMidnight);
  }, []);

  // 4. Background Reminder Engine (loop-safe)
  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const now = new Date();
      // Use local date/time string to match user's set date and time
      const currentDateStr = formatDateKey(now);
      const currentTimeStr = formatTimeKey(now);
      const currentKey = `${currentDateStr} ${currentTimeStr}`;

      const snapshot = remindersRef.current || [];
      const todayKey = formatDateKey(now);

      if ((notificationSettings || {}).deliveryMode === 'server') {
        return;
      }

      // Filter reminders that should trigger NOW
      const triggeredReminders = snapshot.map(normalizeReminder).filter(r => {
        const triggerAt = getTriggerDateTime(r);
        if (!triggerAt) return false;

        const diff = now.getTime() - triggerAt.getTime();
        const withinWindow = diff >= 0 && diff < 60000;
        const triggerKey = `${formatDateKey(triggerAt)} ${formatTimeKey(triggerAt)}`;
        const recentlyTriggered = r.lastReminderAt && (now.getTime() - new Date(r.lastReminderAt).getTime()) < 60000;
        const notYetTriggered = !r.lastTriggered?.includes(triggerKey);
        const sessionKey = `${r.id}|${triggerKey}`;
        const alreadyTriggeredThisSession = triggeredReminderKeysRef.current.has(sessionKey);

        return withinWindow && r.enabled && !r.completed && notYetTriggered && !recentlyTriggered && !alreadyTriggeredThisSession;
      });

      if (triggeredReminders.length > 0) {
        const prefs = notificationSettings || {};
        const isMuted = isWithinSilentHours(now, prefs.silentHours);
        const allowsInApp = prefs.enabled !== false && prefs.reminders !== false;
        const reminderChannels = prefs.channels?.reminder || { web: true, email: true };
        const allowsBrowser = allowsInApp && !isMuted && reminderChannels.web !== false && (prefs.method === 'browser' || prefs.method === 'both');
        const allowsEmail = allowsInApp && !isMuted && reminderChannels.email !== false && prefs.emailNotifications?.reminders !== false;
        console.log(`[ReminderContext] TRIGERRED: ${triggeredReminders.length} reminders at ${currentDateStr} ${currentTimeStr}`);
        
        // 4. Update Reminder State in one pass (triggered + missed) before side effects.
        let changed = false;
        const nextReminders = snapshot.map(r => {
          const tr = triggeredReminders.find(tr => tr.id === r.id);
          let updated = r;

          if (tr) {
            const triggerAt = getTriggerDateTime(r);
            const triggerKey = triggerAt ? `${formatDateKey(triggerAt)} ${formatTimeKey(triggerAt)}` : currentKey;
            const eventAt = toReminderDateTime(r.date, r.time) || now;
            let nextDate = r.date;
            let enabled = r.enabled;
            let missed = false;
            let missedCount = r.missedCount || 0;

            if (['Daily', 'Weekly', 'Monthly', 'Custom'].includes(r.recurring)) {
              const nextEventDate = getNextRecurringDate(eventAt, r.recurring, r.recurringIntervalDays);
              nextDate = formatDateKey(nextEventDate);
              enabled = true;
              missed = false;
            } else {
              enabled = false;
            }

            if (!r.completed && eventAt < now && !r.missed) {
              missed = true;
              missedCount += 1;
            }

            updated = {
              ...r,
              lastTriggered: triggerAt ? [...(r.lastTriggered || []), triggerKey] : [...(r.lastTriggered || [])],
              date: nextDate,
              enabled,
              missed,
              missedCount,
              lastReminderAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }

          // Missed marking for non-triggered, one-time reminders
          if (updated === r) {
            const eventAt = toReminderDateTime(r.date, r.time);
            if (eventAt && !r.completed && !r.missed && (r.recurring || 'None') === 'None' && eventAt < now) {
              updated = { ...r, missed: true, missedCount: (r.missedCount || 0) + 1, updatedAt: new Date().toISOString() };
            }
          }

          if (updated !== r) changed = true;
          return updated;
        });

        if (changed) {
          setReminders(nextReminders);
        }

        triggeredReminders.forEach((r) => {
          const triggerAt = getTriggerDateTime(r);
          const triggerKey = triggerAt ? `${formatDateKey(triggerAt)} ${formatTimeKey(triggerAt)}` : null;
          if (triggerKey) {
            triggeredReminderKeysRef.current.add(`${r.id}|${triggerKey}`);
          }
        });

        triggeredReminders.forEach(async (r) => {
          try {
            // 1. Dispatch In-App Notification after state update.
            if (allowsInApp) {
              addNotification({
                title: 'Event Reminder: ' + (r.category || 'Reminder'),
                message: r.message || 'Untitled event',
                type: 'reminder',
                reminderId: r.id,
                soundMode: r.soundMode || 'inherit',
                soundUrl: r.soundUrl || '',
                soundVolume: Number(r.soundVolume ?? 0.8)
              });
            }

            // 2. Dispatch System Notification (Browser)
            if (allowsBrowser && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('StudyOs Alert', {
                body: r.message || 'Upcoming event',
                icon: '/favicon.svg'
              });
            } else if (allowsBrowser && 'Notification' in window && Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('StudyOs Alert', { body: r.message || 'Upcoming event' });
                }
              });
            }

            // 3. Dispatch Email Alert - DISABLED to prevent duplicates (use server only)
            // if (allowsEmail && r.sendEmail && user?.email) {
            //   console.log(`[ReminderContext] Email trigger for: ${r.id}`);
            //   const emailResult = await EmailService.sendReminderEmail(user.email, r);
            //   if (emailResult.success) {
            //     toast.success(`Email alert dispatched for ${r.message}`, { duration: 5000 });
            //   } else {
            //     if (emailResult.error.includes('environment variables')) {
            //       toast.error('Email service not configured. Please check your .env file.', { duration: 6000 });
            //     } else {
            //       console.error(`[ReminderContext] Email failed for ${r.id}:`, emailResult.error);
            //       toast.error('Email alert failed to send');
            //     }
            //   }
            // }

            // Sound guard: Skip if already playing or recent
            if (r.soundMode !== 'mute' && getIsPlaying()) {
              console.log(`[ReminderContext] Skipping sound for ${r.id} - already playing`);
            }
          } catch (err) {
            console.error(`[ReminderContext] Failed to process alert ${r.id}:`, err);
          }
        });
      }

      const upcomingDeadlines = snapshot.map(normalizeReminder).filter((r) => {
        if (!r.enabled || r.completed) return false;
        if (deadlineNotifiedRef.current.has(r.id)) return false;
        if (r.deadlineNotifiedAt === todayKey) return false;
        const eventAt = toReminderDateTime(r.date, r.time);
        if (!eventAt) return false;
        const diffMs = eventAt.getTime() - now.getTime();
        const within24h = diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
        return within24h;
      });
      if (upcomingDeadlines.length > 0) {
        const existingNotifications = notificationsRef.current || [];
        const upcomingDeadlineIds = new Set(upcomingDeadlines.map((r) => r.id));

        // Persist the deadline-notified marker before firing notifications.
        setReminders((prev) => prev.map((r) => (
          upcomingDeadlineIds.has(r.id) ? { ...r, deadlineNotifiedAt: todayKey, updatedAt: new Date().toISOString() } : r
        )));

        upcomingDeadlines.forEach((r) => {
          const existingDeadlineNotification = existingNotifications.some((n) =>
            n.type === 'deadline' &&
            n.reminderId === r.id &&
            n.read === false
          );
          if (existingDeadlineNotification) {
            console.log(`[ReminderContext] Deadline notification already exists for ${r.id}`);
            return;
          }

          deadlineNotifiedRef.current.add(r.id);
          addNotification({
            title: 'Upcoming Deadline',
            message: `${r.title || r.message || 'Reminder'} is due within 24h`,
            type: 'deadline',
            reminderId: r.id,
            route: '/reminders'
          });
        });
      }
    };

    const interval = setInterval(checkReminders, 60000); // 1min accuracy - fix duplicates
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [user, addNotification, setReminders, normalizeReminder, getTriggerDateTime, getNextRecurringDate, notificationSettings, isWithinSilentHours]);

  useEffect(() => {
    const runRetentionCleanup = () => {
    const retentionDays = Math.max(30, Number(privacySettings?.dataRetentionDays || 365));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    setNotifications((prev) =>
      prev.filter((n) => {
        const ts = n?.timestamp ? new Date(n.timestamp) : null;
        return !ts || ts >= cutoff;
      })
    );

    if (privacySettings?.autoDeleteCompletedReminders) {
      setReminders((prev) =>
        prev.filter((r) => {
          if (!r?.completed) return true;
          const completedAt = r?.completedAt ? new Date(r.completedAt) : null;
          return !completedAt || completedAt >= cutoff;
        })
      );
    }

    if (privacySettings?.autoDeleteImportedBackups) {
      try {
        Object.keys(localStorage)
          .filter((key) => key.startsWith('studyos_import_backup_'))
          .forEach((key) => localStorage.removeItem(key));
      } catch {
        void 0;
      }
    }
    };

    runRetentionCleanup();
    const interval = setInterval(runRetentionCleanup, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [privacySettings, setNotifications, setReminders]);

  const value = {
    reminders,
    notifications,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderEnabled,
    markReminderAsDone,
    markRemindersAsDone,
    disableOverdueReminders,
    archiveCompletedReminders,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearReadNotifications,
    snoozeReminder,
    muteReminder,
    unmuteReminder,
    addNotification,
    markNotificationAsPresented
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};
