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
    channels: {
      reminder: { web: true, email: true },
      deadline: { web: true, email: false },
      streak: { web: true, email: false },
      roleChanges: { web: true, email: true }
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
      roleChanges: 'roleChanges'
    };
    const channelKey = typeMap[notif?.type] || 'reminder';
    const channel = prefs.channels?.[channelKey];
    if (channel?.web === false) return;
    if (notif?.type === 'deadline' && prefs.deadlines === false) return;
    if (notif?.type === 'streak' && prefs.streaks === false) return;
    if (notif?.type === 'reminder' && prefs.reminders === false) return;

    setNotifications(prev => [{ id: nanoid(), ...notif, time: 'Just now', timestamp: new Date().toISOString(), read: false }, ...prev]);
  }, [setNotifications, notificationSettings]);

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

  // Keep a ref of the latest reminders to avoid effect loops and stale closures
  const remindersRef = useRef(reminders);
  useEffect(() => { remindersRef.current = reminders; }, [reminders]);

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

      // Filter reminders that should trigger NOW
      const triggeredReminders = snapshot.map(normalizeReminder).filter(r => {
        const triggerAt = getTriggerDateTime(r);
        if (!triggerAt) return false;

        const triggerKey = `${formatDateKey(triggerAt)} ${formatTimeKey(triggerAt)}`;
        const isEligible = r.enabled && !r.completed;
        const notYetTriggered = !r.lastTriggered?.includes(triggerKey);

        return triggerKey === currentKey && isEligible && notYetTriggered;
      });

      if (triggeredReminders.length > 0) {
        const prefs = notificationSettings || {};
        const isMuted = isWithinSilentHours(now, prefs.silentHours);
        const allowsInApp = prefs.enabled !== false && prefs.reminders !== false;
        const reminderChannels = prefs.channels?.reminder || { web: true, email: true };
        const allowsBrowser = allowsInApp && !isMuted && reminderChannels.web !== false && (prefs.method === 'browser' || prefs.method === 'both');
        const allowsEmail = allowsInApp && !isMuted && reminderChannels.email !== false && (prefs.method === 'email' || prefs.method === 'both') && prefs.emailNotifications?.reminders !== false;
        console.log(`[ReminderContext] TRIGERRED: ${triggeredReminders.length} reminders at ${currentDateStr} ${currentTimeStr}`);
        
        triggeredReminders.forEach(async (r) => {
          try {
            // 1. Dispatch In-App Notification
            if (allowsInApp) {
              addNotification({
                title: 'Event Reminder: ' + (r.category || 'Reminder'),
                message: r.message || 'Untitled event',
                type: 'reminder',
                reminderId: r.id
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

            // 3. Dispatch Email Alert
            if (allowsEmail && r.sendEmail && user?.email) {
              console.log(`[ReminderContext] Email trigger for: ${r.id}`);
              const emailResult = await EmailService.sendReminderEmail(user.email, r);
              if (emailResult.success) {
                toast.success(`Email alert dispatched for ${r.message}`, { duration: 5000 });
              } else {
                if (emailResult.error.includes('environment variables')) {
                  toast.error('Email service not configured. Please check your .env file.', { duration: 6000 });
                } else {
                  console.error(`[ReminderContext] Email failed for ${r.id}:`, emailResult.error);
                  toast.error('Email alert failed to send');
                }
              }
            }
          } catch (err) {
            console.error(`[ReminderContext] Failed to process alert ${r.id}:`, err);
          }
        });

        // 4. Update Reminder State in one pass (triggered + missed)
        let changed = false;
        const nextReminders = snapshot.map(r => {
          const tr = triggeredReminders.find(tr => tr.id === r.id);
          let updated = r;

          if (tr) {
            const triggerAt = getTriggerDateTime(r);
            const triggerKey = triggerAt ? `${formatDateKey(triggerAt)} ${formatTimeKey(triggerAt)}` : currentKey;
            const lastTriggered = [...(r.lastTriggered || []), triggerKey];
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

            updated = { ...r, lastTriggered, date: nextDate, enabled, missed, missedCount, lastReminderAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
      }

      const upcomingDeadlines = snapshot.map(normalizeReminder).filter((r) => {
        if (!r.enabled || r.completed) return false;
        const eventAt = toReminderDateTime(r.date, r.time);
        if (!eventAt) return false;
        const diffMs = eventAt.getTime() - now.getTime();
        const within24h = diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
        return within24h && r.deadlineNotifiedAt !== todayKey;
      });
      if (upcomingDeadlines.length > 0) {
        upcomingDeadlines.forEach((r) => {
          addNotification({
            title: 'Upcoming Deadline',
            message: `${r.title || r.message || 'Reminder'} is due within 24h`,
            type: 'deadline',
            reminderId: r.id,
            route: '/reminders'
          });
        });
        setReminders((prev) => prev.map((r) => (
          upcomingDeadlines.some((x) => x.id === r.id) ? { ...r, deadlineNotifiedAt: todayKey } : r
        )));
      }
    };

    const interval = setInterval(checkReminders, 15000); // 15s accuracy
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
    addNotification
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};
