import React, { useState } from 'react';
import { useGoogleCalendarContext } from '../context/GoogleCalendarContext';
import { useReminders } from '../context/ReminderContext';
import { getGoogleCalendarEvents, getGoogleTasks } from '../services/googleCalendar';
import { useGoogleLogin } from '@react-oauth/google';
import { addDays } from 'date-fns';
import { AlertTriangle, Calendar, Link2, LogOut, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleCalendarPanel = () => {
  const {
    isConnected,
    syncEnabled,
    tokenExpired,
    handleGoogleSuccess,
    disconnect,
    toggleSync,
    ensureValidToken
  } = useGoogleCalendarContext();
  const { addReminder, reminders } = useReminders();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = (tokenResponse) => {
    setIsLoading(true);
    try {
      const success = handleGoogleSuccess(tokenResponse);
      toast[success ? 'success' : 'error'](
        success ? 'Google Calendar connected successfully!' : 'Failed to connect Google Calendar'
      );
    } catch (error) {
      toast.error('Failed to connect Google Calendar');
      console.error('Google connect error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleConnect,
    onError: () => toast.error('Google sign-in failed'),
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly',
    flow: 'implicit',
    prompt: 'consent'
  });

  const handleToggleSync = () => {
    const nextValue = !syncEnabled;
    const success = toggleSync(nextValue);
    toast[success ? 'success' : 'error'](
      success ? (nextValue ? 'Calendar sync enabled' : 'Calendar sync disabled') : 'Please connect Google Calendar first'
    );
  };

  const importGoogleEvents = async () => {
    const accessToken = ensureValidToken();
    if (!accessToken) {
      toast.error('Connect Google Calendar first');
      return;
    }

    setIsLoading(true);
    try {
      const startDate = new Date();
      const endDate = addDays(startDate, 30);

      const events = await getGoogleCalendarEvents(accessToken, startDate, endDate);
      let tasks = [];
      try {
        tasks = await getGoogleTasks(accessToken);
      } catch (taskError) {
        console.warn('Google Tasks import skipped due to Tasks API issue:', taskError);
        toast('Google Tasks import skipped: enable the Tasks API in your Google Cloud project');
      }

      let importedCount = 0;

      events.forEach((event) => {
        if (!event?.id) return;
        const eventKey = `${event._calendarId || 'primary'}:${event.id}`;
        if (reminders.some((r) => r.googleCalendarEventId === eventKey)) return;

        const start = event.start?.dateTime || event.start?.date;
        if (!start) return;

        addReminder({
          message: event.summary || 'Google Event',
          description: event.description || '',
          date: start.slice(0, 10),
          time: event.start?.dateTime ? start.slice(11, 16) : '09:00',
          durationMinutes: 60,
          allDay: !event.start?.dateTime,
          category: 'Study',
          priority: 'Medium',
          enabled: true,
          completed: false,
          recurring: 'None',
          reminderOffsetMinutes: 15,
          sendEmail: false,
          relatedCourseId: '',
          relatedProjectId: '',
          relatedAssignmentId: '',
          relatedVideoId: '',
          googleCalendarEventId: eventKey
        });
        importedCount += 1;
      });

      tasks.forEach((task) => {
        if (!task?.id || !task.title) return;
        const taskKey = `task:${task.id}`;
        if (reminders.some((r) => r.googleCalendarEventId === taskKey)) return;

        const due = task.due || task.updated || task.created;
        if (!due) return;

        addReminder({
          message: task.title,
          description: task.notes || '',
          date: due.slice(0, 10),
          time: due.includes('T') ? due.slice(11, 16) : '09:00',
          durationMinutes: 60,
          allDay: !due.includes('T'),
          category: 'Study',
          priority: 'Medium',
          enabled: true,
          completed: task.status === 'completed',
          recurring: 'None',
          reminderOffsetMinutes: 15,
          sendEmail: false,
          relatedCourseId: '',
          relatedProjectId: '',
          relatedAssignmentId: '',
          relatedVideoId: '',
          googleCalendarEventId: taskKey
        });
        importedCount += 1;
      });

      if (importedCount === 0) {
        toast('No new Google Calendar events or tasks found to import');
      } else {
        toast.success(`Imported ${importedCount} item${importedCount > 1 ? 's' : ''} from Google`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Failed to import Google Calendar events and tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect from Google Calendar?')) {
      disconnect();
      toast.success('Google Calendar disconnected');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          <Calendar size={20} />
        </div>
        <div>
          <h3 className="font-black text-slate-800 dark:text-white">Google Calendar Sync</h3>
          <p className="text-xs text-slate-400 mt-0.5">Auto-sync reminders with your Google Calendar</p>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              Connect your Google Calendar to automatically sync StudyOS reminders and deadlines.
            </p>
            <button
              type="button"
              onClick={() => login()}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <span>Connect Google Calendar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Connected to Google Calendar
              </p>
            </div>
            <Link2 size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>

          {tokenExpired && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30">
              Session expired. Reconnect Google Calendar to continue syncing.
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Auto-sync Reminders</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  New reminders will appear in Google Calendar
                </p>
              </div>
              <button
                onClick={handleToggleSync}
                className={`p-2 rounded-lg transition-all ${
                  syncEnabled
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {syncEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              </button>
            </div>

            {syncEnabled && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                ✓ New StudyOS reminders will automatically sync to your Google Calendar
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={importGoogleEvents}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-all"
          >
            Import Google Calendar & Tasks
          </button>

          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold"
          >
            <LogOut size={16} />
            Disconnect Google Calendar
          </button>
        </div>
      )}
    </div>
  );
};

const GoogleCalendarSettings = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
            <Calendar size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-800 dark:text-white">Google Calendar</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                Optional
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This integration is not enabled in the current build. You can still use StudyOS normally, including GitHub sign-in and project management.
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            When Google Calendar is configured later, this panel will let you connect your calendar and import reminders.
          </p>
        </div>
      </div>
    );
  }

  return <GoogleCalendarPanel />;
};

export default GoogleCalendarSettings;
