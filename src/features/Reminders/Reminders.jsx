import React, { useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  TrendingUp
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { useReminders } from '../../context/ReminderContext';
import { useGoogleCalendarContext } from '../../context/GoogleCalendarContext';
import { formatDateKey, toReminderDateTime } from '../../utils/reminderDate';
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from '../../services/googleCalendar';
import ConfirmModal from '../../components/ConfirmModal';
import CalendarView from './components/CalendarView';
import EventModal from './components/EventModal';
import EventList from './components/EventList';
import ReminderPanel from './components/ReminderPanel';

const MAX_EVENTS_PER_MONTH = 100;

const defaultFormData = () => ({
  message: '',
  description: '',
  date: formatDateKey(new Date()),
  time: '09:00',
  durationMinutes: 60,
  allDay: false,
  category: 'Study',
  priority: 'Medium',
  enabled: true,
  completed: false,
  recurring: 'None',
  recurringIntervalDays: 1,
  snoozeEnabled: true,
  snoozeMinutes: 10,
  reminderOffsetMinutes: 15,
  sendEmail: false,
  relatedCourseId: '',
  relatedProjectId: '',
  relatedAssignmentId: '',
  relatedVideoId: ''
});

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const Reminders = () => {
  const navigate = useNavigate();
  const {
    reminders,
    notifications,
    addReminder,
    updateReminder,
    deleteReminder,
    markReminderAsDone,
    markNotificationAsRead,
    snoozeReminder
  } = useReminders();

  const { googleAccessToken, syncEnabled } = useGoogleCalendarContext();

  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);

  const [view, setView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(defaultFormData());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    type: 'danger',
    onConfirm: () => {}
  });

  const eventRows = useMemo(() => reminders.map((r) => ({
    ...r,
    message: r.message || r.title || '',
    category: r.category || 'Study',
    reminderOffsetMinutes: Number(r.reminderOffsetMinutes ?? 15)
  })), [reminders]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return eventRows
      .filter((event) => {
        const dateTime = toReminderDateTime(event.date, event.time);
        if (!dateTime) return false;

        const isMissed = !event.completed && dateTime < now;
        const searchable = `${event.message} ${event.description || ''} ${event.category || ''}`.toLowerCase();
        const matchesSearch = searchable.includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || event.category === categoryFilter;
        const matchesStatus = (
          statusFilter === 'All'
          || (statusFilter === 'Upcoming' && !event.completed && !isMissed)
          || (statusFilter === 'Completed' && event.completed)
          || (statusFilter === 'Missed' && isMissed)
        );

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const aTime = toReminderDateTime(a.date, a.time)?.getTime() || 0;
        const bTime = toReminderDateTime(b.date, b.time)?.getTime() || 0;
        return aTime - bTime;
      });
  }, [eventRows, searchTerm, categoryFilter, statusFilter]);

  const analytics = useMemo(() => {
    const now = new Date();
    const completed = eventRows.filter((e) => e.completed).length;
    const missed = eventRows.filter((e) => {
      const at = toReminderDateTime(e.date, e.time);
      return at && at < now && !e.completed;
    }).length;
    const scheduledHours = eventRows.reduce((acc, e) => acc + (Number(e.durationMinutes) || 0), 0) / 60;
    const completedHours = eventRows.reduce((acc, e) => acc + (e.completed ? (Number(e.durationMinutes) || 0) : 0), 0) / 60;

    const hourBuckets = Array.from({ length: 24 }, () => 0);
    eventRows.forEach((e) => {
      const at = toReminderDateTime(e.date, e.time);
      if (at) hourBuckets[at.getHours()] += 1;
    });
    const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));

    return {
      total: eventRows.length,
      completed,
      missed,
      scheduledHours: scheduledHours.toFixed(1),
      completedHours: completedHours.toFixed(1),
      peakHour: `${String(peakHour).padStart(2, '0')}:00`
    };
  }, [eventRows]);

  const categories = useMemo(() => {
    const set = new Set(eventRows.map((e) => e.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [eventRows]);

  const nextEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents.filter((event) => {
      const at = toReminderDateTime(event.date, event.time);
      return at && at >= now && !event.completed;
    });
  }, [filteredEvents]);

  const navigatePeriod = (direction) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (view === 'month') next.setMonth(next.getMonth() + direction);
      if (view === 'week') next.setDate(next.getDate() + (7 * direction));
      if (view === 'day') next.setDate(next.getDate() + direction);
      return next;
    });
  };

  const jumpToToday = () => setSelectedDate(new Date());

  const openNewEvent = (date = selectedDate) => {
    setEditingEvent(null);
    setFormData({
      ...defaultFormData(),
      date: formatDateKey(date)
    });
    setIsModalOpen(true);
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      ...defaultFormData(),
      ...event,
      message: event.message || event.title || '',
      reminderOffsetMinutes: Number(event.reminderOffsetMinutes ?? 15)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData(defaultFormData());
  };

  const getMonthlyCount = (dateKey, excludeId = null) => {
    const [year, month] = dateKey.split('-');
    return eventRows.filter((event) => {
      if (excludeId && event.id === excludeId) return false;
      if (!event.date) return false;
      const [y, m] = event.date.split('-');
      return y === year && m === month;
    }).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const monthlyCount = getMonthlyCount(formData.date, editingEvent?.id || null);
    if (monthlyCount >= MAX_EVENTS_PER_MONTH) {
      toast.error(`Monthly event limit reached (${MAX_EVENTS_PER_MONTH})`);
      return;
    }

    if (editingEvent) {
      updateReminder(editingEvent.id, formData);
      // Sync update to Google Calendar if enabled
      if (syncEnabled && googleAccessToken && editingEvent.googleCalendarEventId) {
        updateGoogleCalendarEvent(googleAccessToken, editingEvent.googleCalendarEventId, formData)
          .catch((error) => {
            console.error('Failed to sync update to Google Calendar:', error);
            toast.error('Sync to Google Calendar failed');
          });
      }
    } else {
      addReminder(formData);
    }
    closeModal();
  };

  const handleDelete = (eventId) => {
    const event = reminders.find(r => r.id === eventId);
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Event',
      message: 'Remove this event and reminder from calendar?',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: () => {
        deleteReminder(eventId);
        // Sync deletion to Google Calendar if enabled
        if (syncEnabled && googleAccessToken && event?.googleCalendarEventId) {
          deleteGoogleCalendarEvent(googleAccessToken, event.googleCalendarEventId)
            .catch((error) => {
              console.error('Failed to sync deletion to Google Calendar:', error);
              toast.error('Event deleted locally but Google Calendar sync failed');
            });
        }
      }
    });
  };

  const handleDeleteFromModal = () => {
    if (!editingEvent?.id) return;
    handleDelete(editingEvent.id);
    closeModal();
  };

  const handleMarkDone = (eventId) => {
    markReminderAsDone(eventId);
  };

  const navigateLinked = (event, dryRun = false) => {
    const linked = [
      { id: event.relatedCourseId, label: 'Course', path: '/courses' },
      { id: event.relatedAssignmentId, label: 'Assignment', path: '/courses' },
      { id: event.relatedVideoId, label: 'Video', path: '/videos' },
      { id: event.relatedProjectId, label: 'Project', path: '/projects' }
    ].find((item) => item.id);

    if (!linked) return null;
    if (dryRun) return linked;

    navigate(linked.path);
    return linked;
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
            <div className="p-3 rounded-[1.5rem] bg-primary-500 text-white shadow-xl shadow-primary-500/20">
              <CalendarDays size={32} />
            </div>
            Calendar Planner
          </h1>
          <p className="text-slate-400 font-bold ml-20 uppercase tracking-widest text-xs mt-2">
            Unified events, reminders and deadlines
          </p>
        </div>
        <button
          onClick={() => openNewEvent()}
          className="flex items-center gap-3 px-8 py-3.5 rounded-[2rem] bg-primary-500 hover:bg-primary-600 text-white font-black transition-all shadow-xl shadow-primary-500/30 active:scale-95"
        >
          <Plus size={22} />
          New Event
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Events', value: analytics.total, icon: CalendarDays, color: 'text-primary-500', bg: 'bg-primary-50' },
          { label: 'Completed', value: analytics.completed, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Missed', value: analytics.missed, icon: Bell, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Scheduled Hrs', value: analytics.scheduledHours, icon: CalendarDays, color: 'text-sky-500', bg: 'bg-sky-50' },
          { label: 'Peak Hour', value: analytics.peakHour, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} dark:bg-opacity-10 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center p-4 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button onClick={() => navigatePeriod(-1)} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => navigatePeriod(1)} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <ChevronRight size={18} />
          </button>
          <button onClick={jumpToToday} className="px-4 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest">
            Today
          </button>
        </div>

        <div className="text-sm font-black text-slate-600 dark:text-slate-300">
          {selectedDate.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
            day: view === 'day' ? 'numeric' : undefined
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {['month', 'week', 'day'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                view === v ? 'bg-primary-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events and reminders"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm font-bold"
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm font-bold"
          >
            {['All', 'Upcoming', 'Completed', 'Missed'].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        <CalendarView
          view={view}
          selectedDate={selectedDate}
          events={filteredEvents}
          onSelectDate={(date) => {
            setSelectedDate(startOfDay(date));
            if (view === 'month') setView('day');
          }}
          onCreateEvent={(date) => openNewEvent(date)}
          onEventClick={openEditEvent}
        />

        <div className="space-y-4">
          <EventList
            events={nextEvents}
            onEventClick={openEditEvent}
            onNavigateLinked={navigateLinked}
          />
          <ReminderPanel
            notifications={notifications}
            onSnooze={(notification) => snoozeReminder(notification.id, notification.reminderId)}
            onMarkRead={markNotificationAsRead}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Selected Day Events</h3>
        <div className="space-y-2">
          {filteredEvents
            .filter((event) => {
              const at = toReminderDateTime(event.date, event.time);
              return at && startOfDay(at).getTime() === startOfDay(selectedDate).getTime();
            })
            .map((event) => (
              <div key={event.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{event.message}</p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {event.allDay ? 'All day' : event.time} · {event.durationMinutes || 60} min · {event.category}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigateLinked(event)}
                    disabled={!event.relatedCourseId && !event.relatedVideoId && !event.relatedProjectId}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary-50 dark:bg-primary-500/10 text-primary-600 disabled:opacity-40"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleMarkDone(event.id)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-500/10 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <EventModal
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={closeModal}
            onDelete={handleDeleteFromModal}
            isEditing={!!editingEvent}
            courses={courses}
            projects={projects}
            assignments={assignments}
            videos={videos}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
      />
    </div>
  );
};

export default Reminders;
