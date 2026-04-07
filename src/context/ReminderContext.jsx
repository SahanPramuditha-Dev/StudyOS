import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useStorage } from '../hooks/useStorage';
import { STORAGE_KEYS } from '../services/storage';
import { useAuth } from './AuthContext';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { EmailService } from '../services/email';

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
  
  // 1. State Management (Synced with useStorage)
  const [reminders, setReminders] = useStorage(STORAGE_KEYS.REMINDERS, []);
  const [notifications, setNotifications] = useStorage(STORAGE_KEYS.NOTIFICATIONS, [
    { id: 1, title: 'Welcome to StudyOs!', message: 'Start by adding your first course.', time: 'Just now', type: 'info', read: false },
  ]);

  // 2. CRUD Operations
  const addReminder = useCallback((formData) => {
    const newReminder = { 
      ...formData, 
      id: nanoid(), 
      createdAt: new Date().toISOString(),
      lastTriggered: [] 
    };
    setReminders(prev => [newReminder, ...prev]);
    toast.success('Study alert launched');
  }, [setReminders]);

  const updateReminder = useCallback((id, updates) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    ));
    toast.success('Study alert updated');
  }, [setReminders]);

  const deleteReminder = useCallback((id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success('Reminder archived');
  }, [setReminders]);

  const toggleReminderEnabled = useCallback((id) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, [setReminders]);

  const markReminderAsDone = useCallback((id) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: true, enabled: false } : r));
    toast.success('Knowledge task finalized!');
  }, [setReminders]);

  // 3. Notification Handlers
  const addNotification = useCallback((notif) => {
    setNotifications(prev => [{ id: nanoid(), ...notif, time: 'Just now', read: false }, ...prev]);
  }, [setNotifications]);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [setNotifications]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [setNotifications]);

  const snoozeReminder = useCallback((notifId, reminderId) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const snoozeDate = now.toISOString().split('T')[0];
    const snoozeTime = now.toTimeString().split(' ')[0].substring(0, 5);

    setReminders(prev => prev.map(r => 
      r.id === reminderId 
        ? { ...r, date: snoozeDate, time: snoozeTime, completed: false, enabled: true } 
        : r
    ));

    setNotifications(prev => prev.filter(n => n.id !== notifId));
    toast.success('Alert snoozed for 10 minutes');
  }, [setReminders, setNotifications]);

  // 4. Background Reminder Engine
  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const now = new Date();
      // Use local date/time string to match user's set date and time
      const currentDateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      const currentTimeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      // Filter reminders that should trigger NOW
      const triggeredReminders = reminders.filter(r => {
        const matchesDate = r.date === currentDateStr;
        const matchesTime = r.time === currentTimeStr;
        const isEligible = r.enabled && !r.completed;
        const notYetTriggered = !r.lastTriggered?.includes(currentDateStr + ' ' + currentTimeStr);
        
        if (matchesDate && matchesTime) {
          console.log(`[ReminderContext] Match found: ${r.message} | Eligible: ${isEligible} | NotTriggered: ${notYetTriggered}`);
        }
        
        return matchesDate && matchesTime && isEligible && notYetTriggered;
      });

      if (triggeredReminders.length > 0) {
        console.log(`[ReminderContext] TRIGERRED: ${triggeredReminders.length} reminders at ${currentDateStr} ${currentTimeStr}`);
        
        triggeredReminders.forEach(async (r) => {
          try {
            // 1. Dispatch In-App Notification
            addNotification({
              title: 'Study Alert: ' + (r.category || 'Reminder'),
              message: r.message,
              type: r.priority === 'High' ? 'warning' : 'info',
              reminderId: r.id
            });

            // 2. Dispatch System Notification (Browser)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('StudyOs Alert', { 
                body: r.message,
                icon: '/favicon.svg'
              });
            } else if ('Notification' in window && Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('StudyOs Alert', { body: r.message });
                }
              });
            }

            // 3. Dispatch Email Alert
            if (r.sendEmail && user?.email) {
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

        // 4. Update Reminder State (Mark as triggered / Handle recurring)
        setReminders(prev => prev.map(r => {
          const tr = triggeredReminders.find(tr => tr.id === r.id);
          if (tr) {
            const lastTriggered = [...(r.lastTriggered || []), currentDateStr + ' ' + currentTimeStr];
            let nextDate = r.date;
            let completed = r.completed;
            let enabled = r.enabled;

            if (r.recurring === 'Daily') {
              const d = new Date(now);
              d.setDate(d.getDate() + 1);
              nextDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            } else if (r.recurring === 'Weekly') {
              const d = new Date(now);
              d.setDate(d.getDate() + 7);
              nextDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            } else {
              completed = true;
              enabled = false;
            }

            return { ...r, lastTriggered, date: nextDate, completed, enabled, updatedAt: new Date().toISOString() };
          }
          return r;
        }));
      }
    };

    const interval = setInterval(checkReminders, 15000); // 15s accuracy
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [user, reminders, addNotification, setReminders]);

  const value = {
    reminders,
    notifications,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderEnabled,
    markReminderAsDone,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    snoozeReminder,
    addNotification
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};
