import React, { useState } from 'react';
import { useGoogleCalendarContext } from '../context/GoogleCalendarContext';
import { useReminders } from '../context/ReminderContext';
import { getGoogleCalendarEvents, getGoogleTasks } from '../services/googleCalendar';
import { useGoogleLogin } from '@react-oauth/google';
import { addDays } from 'date-fns';
import { Calendar, Link2, Unlink, ToggleLeft, ToggleRight, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleCalendarSettings = () => {
  const { isConnected, syncEnabled, tokenExpired, handleGoogleSuccess, disconnect, toggleSync, ensureValidToken } = useGoogleCalendarContext();
  const { addReminder, reminders } = useReminders();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = (tokenResponse) => {
    setIsLoading(true);
    try {
      console.log('Google login response:', tokenResponse);
      const success = handleGoogleSuccess(tokenResponse);
      if (success) {
        toast.success('Google Calendar connected successfully!');
      } else {
        toast.error('Failed to connect Google Calendar');
      }
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

  const importGoogleEvents = async () => {
    const accessToken = ensureValidToken();
    if (!accessToken) {
      toast.error('Connect Google Calendar first');
      return;
    }

    setIsLoading(true);
    try {
      const tokenString = typeof accessToken === 'string' ? accessToken : JSON.stringify(accessToken);
      console.log('Importing Google events with access token (preview):', tokenString.slice(0, 20));
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

      console.log('Fetched Google events count:', events.length);
      console.log('Fetched Google tasks count:', tasks.length);

      const importedEvents = events.reduce((count, event) => {
        if (!event?.id) return count;
        const eventKey = `${event._calendarId || 'primary'}:${event.id}`;
        const alreadyImported = reminders.some((r) => r.googleCalendarEventId === eventKey);
        if (alreadyImported) return count;

        const start = event.start?.dateTime || event.start?.date;
        if (!start) return count;

        const eventDate = start.slice(0, 10);
        const eventTime = event.start?.dateTime ? start.slice(11, 16) : '09:00';

        addReminder({
          message: event.summary || 'Google Event',
          description: event.description || '',
          date: eventDate,
          time: eventTime,
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

        return count + 1;
      }, 0);

      const importedTasks = tasks.reduce((count, task) => {
        if (!task?.id || !task.title) return count;
        const taskKey = `task:${task.id}`;
        const alreadyImported = reminders.some((r) => r.googleCalendarEventId === taskKey);
        if (alreadyImported) return count;

        const due = task.due || task.updated || task.created;
        if (!due) return count;

        const taskDate = due.slice(0, 10);
        const taskTime = due.includes('T') ? due.slice(11, 16) : '09:00';

        addReminder({
          message: task.title,
          description: task.notes || '',
          date: taskDate,
          time: taskTime,
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

        return count + 1;
      }, 0);

      const totalImported = importedEvents + importedTasks;
      if (totalImported === 0) {
        toast('No new Google Calendar events or tasks found to import');
      } else {
        toast.success(`Imported ${totalImported} item${totalImported > 1 ? 's' : ''} from Google`);
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

  const handleToggleSync = () => {
    const newState = !syncEnabled;
    const success = toggleSync(newState);
    if (success) {
      toast.success(newState ? 'Calendar sync enabled' : 'Calendar sync disabled');
    } else {
      toast.error('Please connect Google Calendar first');
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

export default GoogleCalendarSettings;
