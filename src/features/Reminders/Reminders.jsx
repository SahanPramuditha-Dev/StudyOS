import React, { useMemo, useState, useEffect } from 'react';
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  TrendingUp,
  Search,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Calendar as CalendarIcon,
  Clock,
  ListFilter,
  Download,
  CheckSquare,
  Square,
  Trash2,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_KEYS } from '../../services/storage';
import { useReminders } from '../../context/ReminderContext';
import { useGoogleCalendarContext } from '../../context/GoogleCalendarContext';
import { formatDateKey, toReminderDateTime } from '../../utils/reminderDate';
import { exportEventsToICal } from '../../utils/icalExport';
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from '../../services/googleCalendar';
import { uploadAlarmSound, isValidAlarmSoundFile, getAlarmSoundLimitBytes } from '../../services/alarmSound';
import { stopAlarmSound } from '../../utils/alarmAudio';
import ConfirmModal from '../../components/ConfirmModal';
import CalendarView from './components/CalendarView';
import EventModal from './components/EventModal';
import CategoryLegend from './components/CategoryLegend';
import QuickEventPopover from './components/QuickEventPopover';
import CalendarSidePanel from './components/CalendarSidePanel';
import Select from '../../components/ui/Select';

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
  soundMode: 'inherit',
  soundUrl: '',
  soundPath: '',
  soundName: '',
  soundVolume: 0.8,
  soundRepeatCount: 1,
  relatedCourseId: '',
  relatedProjectId: '',
  relatedAssignmentId: '',
  relatedVideoId: ''
});

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const Reminders = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    reminders,
    notifications,
    addReminder,
    updateReminder,
    deleteReminder,
    markReminderAsDone,
    markNotificationAsRead,
    snoozeReminder,
    muteReminder,
    unmuteReminder
  } = useReminders();

  const { googleAccessToken, syncEnabled } = useGoogleCalendarContext();

  const [courses] = useStorage(STORAGE_KEYS.COURSES, []);
  const [projects] = useStorage(STORAGE_KEYS.PROJECTS, []);
  const [assignments] = useStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  const [videos] = useStorage(STORAGE_KEYS.VIDEOS, []);

  const [view, setView] = useState('month'); // 'month' | 'week' | 'day' | 'agenda'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(defaultFormData());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [soundUploadState, setSoundUploadState] = useState({ uploading: false, error: '' });
  
  // Quick popover & multi-select state
  const [quickPopover, setQuickPopover] = useState({ isOpen: false, date: null, time: '09:00' });
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState([]);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    type: 'danger',
    onConfirm: () => {}
  });

  // Keyboard Shortcuts ('T', 'M', 'W', 'D', 'A')
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 't' || e.key === 'T') {
        setSelectedDate(new Date());
        toast('Jumped to Today', { icon: '📅' });
      } else if (e.key === 'm' || e.key === 'M') {
        setView('month');
      } else if (e.key === 'w' || e.key === 'W') {
        setView('week');
      } else if (e.key === 'd' || e.key === 'D') {
        setView('day');
      } else if (e.key === 'a' || e.key === 'A') {
        setView('agenda');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const categoryCounts = useMemo(() => {
    const counts = {};
    eventRows.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }, [eventRows]);

  const analytics = useMemo(() => {
    const now = new Date();
    const completed = eventRows.filter((e) => e.completed).length;
    const missed = eventRows.filter((e) => {
      const at = toReminderDateTime(e.date, e.time);
      return at && at < now && !e.completed;
    }).length;
    const scheduledHours = eventRows.reduce((acc, e) => acc + (Number(e.durationMinutes) || 0), 0) / 60;

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
      peakHour: `${String(peakHour).padStart(2, '0')}:00`
    };
  }, [eventRows]);

  const navigatePeriod = (direction) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (view === 'month') next.setMonth(next.getMonth() + direction);
      if (view === 'week') next.setDate(next.getDate() + (7 * direction));
      if (view === 'day' || view === 'agenda') next.setDate(next.getDate() + direction);
      return next;
    });
  };

  const jumpToToday = () => setSelectedDate(new Date());

  const openNewEvent = (date = selectedDate, time = '09:00') => {
    setEditingEvent(null);
    setFormData({
      ...defaultFormData(),
      date: formatDateKey(date),
      time
    });
    setIsModalOpen(true);
  };

  const openQuickPopover = (date = selectedDate, time = '09:00') => {
    setQuickPopover({ isOpen: true, date, time });
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
    if (e && e.preventDefault) e.preventDefault();

    const monthlyCount = getMonthlyCount(formData.date, editingEvent?.id || null);
    if (monthlyCount >= MAX_EVENTS_PER_MONTH) {
      toast.error(`Monthly event limit reached (${MAX_EVENTS_PER_MONTH})`);
      return;
    }

    if (editingEvent) {
      updateReminder(editingEvent.id, formData);
      if (syncEnabled && googleAccessToken && editingEvent.googleCalendarEventId) {
        updateGoogleCalendarEvent(googleAccessToken, editingEvent.googleCalendarEventId, formData)
          .catch((error) => {
            console.error('Failed to sync update to Google Calendar:', error);
            toast.error('Sync to Google Calendar failed');
          });
      }
      toast.success('Event updated');
    } else {
      addReminder(formData);
      toast.success('Event created');
    }
    closeModal();
  };

  const handleQuickSave = (quickData) => {
    addReminder(quickData);
    toast.success('Event added to calendar');
  };

  const handleExportICal = () => {
    if (filteredEvents.length === 0) {
      toast.error('No events to export');
      return;
    }
    const success = exportEventsToICal(filteredEvents, 'studyos-calendar.ics');
    if (success) {
      toast.success(`Exported ${filteredEvents.length} events to .ics file`);
    }
  };

  const toggleSelectEvent = (id) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEventIds.length === filteredEvents.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(filteredEvents.map((e) => e.id));
    }
  };

  const handleBulkComplete = () => {
    if (selectedEventIds.length === 0) return;
    selectedEventIds.forEach((id) => markReminderAsDone(id));
    toast.success(`Marked ${selectedEventIds.length} events complete`);
    setSelectedEventIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedEventIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Bulk Delete Events',
      message: `Are you sure you want to delete ${selectedEventIds.length} selected events?`,
      confirmText: 'Delete All',
      type: 'danger',
      onConfirm: () => {
        selectedEventIds.forEach((id) => deleteReminder(id));
        toast.success(`Deleted ${selectedEventIds.length} events`);
        setSelectedEventIds([]);
      }
    });
  };

  const handleSoundUpload = async (file) => {
    if (!file) return;
    if (!isValidAlarmSoundFile(file)) {
      toast.error('Upload an MP3, WAV, or OGG audio file');
      return;
    }
    if (!user?.id) {
      toast.error('Please sign in to upload a custom alarm sound');
      return;
    }
    const maxBytes = getAlarmSoundLimitBytes(profile?.plan, profile?.role);
    if (file.size > maxBytes) {
      toast.error(`Sound file is too large. Limit is ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`);
      return;
    }

    try {
      setSoundUploadState({ uploading: true, error: '' });
      const upload = await uploadAlarmSound({
        file,
        userId: user.id,
        scope: editingEvent?.id || 'reminder'
      });
      setFormData((prev) => ({
        ...prev,
        soundMode: 'custom',
        soundUrl: upload.downloadURL,
        soundPath: upload.storagePath,
        soundName: upload.fileName
      }));
      toast.success('Custom sound uploaded');
    } catch (error) {
      const message = error?.message || 'Sound upload failed';
      setSoundUploadState({ uploading: false, error: message });
      toast.error(message);
      return;
    }

    setSoundUploadState({ uploading: false, error: '' });
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
        if (syncEnabled && googleAccessToken && event?.googleCalendarEventId) {
          deleteGoogleCalendarEvent(googleAccessToken, event.googleCalendarEventId)
            .catch((error) => {
              console.error('Failed to sync deletion to Google Calendar:', error);
            });
        }
        toast.success('Event deleted');
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
    toast.success('Marked complete');
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
    <div className="w-full max-w-[1680px] mx-auto pb-12 space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/20">
                <CalendarDays size={28} />
              </div>
              Calendar Planner
            </h1>
            {syncEnabled && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Google Sync Active
              </span>
            )}
          </div>
          <p className="text-slate-400 font-semibold text-xs mt-2 ml-1">
            Unified schedule, academic deadlines, alarms and study time-blocks
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportICal}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
            title="Export calendar feed as .ics file"
          >
            <Download size={15} />
            Export .ics
          </button>

          <button
            onClick={() => {
              setIsMultiSelect(!isMultiSelect);
              setSelectedEventIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
              isMultiSelect
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
            }`}
          >
            <CheckSquare size={15} />
            {isMultiSelect ? 'Exit Select' : 'Select Events'}
          </button>

          <button
            onClick={() => {
              stopAlarmSound();
              toast.success('All alarm sounds stopped');
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-500/20 active:scale-95"
          >
            <Bell size={16} />
            Stop Sounds
          </button>

          <button
            onClick={() => openNewEvent()}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary-500/20 active:scale-95"
          >
            <Plus size={18} />
            New Event
          </button>
        </div>
      </div>

      {/* Multi-Select Bulk Actions Bar */}
      {isMultiSelect && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:opacity-80"
            >
              {selectedEventIds.length === filteredEvents.length ? <CheckSquare size={16} /> : <Square size={16} />}
              <span>{selectedEventIds.length === filteredEvents.length ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span className="text-xs font-bold opacity-70">
              ({selectedEventIds.length} selected)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={selectedEventIds.length === 0}
              onClick={handleBulkComplete}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-wider disabled:opacity-40 hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>Mark Done</span>
            </button>
            <button
              disabled={selectedEventIds.length === 0}
              onClick={handleBulkDelete}
              className="px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-wider disabled:opacity-40 hover:bg-rose-600 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
            <button
              onClick={() => {
                setIsMultiSelect(false);
                setSelectedEventIds([]);
              }}
              className="p-2 rounded-xl opacity-70 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Events', value: analytics.total, icon: CalendarDays, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10' },
          { label: 'Completed', value: analytics.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Missed', value: analytics.missed, icon: Bell, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
          { label: 'Scheduled Hrs', value: `${analytics.scheduledHours}h`, icon: Clock, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10' },
          { label: 'Peak Study Hour', value: analytics.peakHour, icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{stat.label}</p>
              <p className="text-lg font-black text-slate-800 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Toolbar (Category Legend, Search, View Controls) */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-4 md:p-6 shadow-xs space-y-4">
        {/* Top toolbar: Date navigation + View Mode buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
              <button
                onClick={() => navigatePeriod(-1)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={jumpToToday}
                className="px-3.5 py-1.5 rounded-xl bg-primary-500 text-white text-xs font-black uppercase tracking-wider shadow-xs"
              >
                Today
              </button>
              <button
                onClick={() => navigatePeriod(1)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-white tracking-tight">
              {selectedDate.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
                day: view === 'day' ? 'numeric' : undefined
              })}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            {[
              { id: 'month', label: 'Month' },
              { id: 'week', label: 'Week' },
              { id: 'day', label: 'Day' },
              { id: 'agenda', label: 'Agenda' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  view === v.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category legend chips */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <CategoryLegend
            selectedCategory={categoryFilter}
            onSelectCategory={setCategoryFilter}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Search bar & status filter */}
        <div className="flex flex-col md:flex-row items-center gap-3 pt-1">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events, exams, assignments..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <ListFilter size={15} className="text-slate-400" />
            <Select
              variant="ghost"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={['All', 'Upcoming', 'Completed', 'Missed'].map(s => ({ label: `${s} Status`, value: s }))}
            />
          </div>
        </div>
      </div>

      {/* 4. Main Grid & Side Panel Split View */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Calendar View Component */}
        <CalendarView
          view={view}
          selectedDate={selectedDate}
          events={filteredEvents}
          courses={courses}
          onSelectDate={(date) => {
            setSelectedDate(startOfDay(date));
            if (view === 'month') setView('day');
          }}
          onCreateEvent={(date, time) => openQuickPopover(date, time)}
          onEventClick={openEditEvent}
          onNavigateLinked={navigateLinked}
          isMultiSelect={isMultiSelect}
          selectedEventIds={selectedEventIds}
          onToggleSelectEvent={toggleSelectEvent}
        />

        {/* Unified Side Panel */}
        <CalendarSidePanel
          selectedDate={selectedDate}
          onSelectDate={(date) => setSelectedDate(startOfDay(date))}
          events={eventRows}
          notifications={notifications}
          onEventClick={openEditEvent}
          onNavigateLinked={navigateLinked}
          onSnooze={(notification, minutesOverride = 5) => {
            stopAlarmSound();
            snoozeReminder(notification.id, notification.reminderId, minutesOverride);
          }}
          onMute={(notification) => {
            stopAlarmSound();
            muteReminder(notification.id, notification.reminderId);
          }}
          onUnmute={(notification) => {
            stopAlarmSound();
            unmuteReminder(notification.id, notification.reminderId);
          }}
          onStopAlarm={() => stopAlarmSound()}
          onMarkRead={markNotificationAsRead}
          onToggleComplete={handleMarkDone}
          onDeleteEvent={(ev) => handleDelete(ev.id)}
        />
      </div>

      {/* 5. Modals & Popovers */}
      <AnimatePresence>
        {isModalOpen && (
          <EventModal
            formData={formData}
            setFormData={setFormData}
            onSoundUpload={handleSoundUpload}
            soundUploadState={soundUploadState}
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

      {quickPopover.isOpen && (
        <QuickEventPopover
          date={quickPopover.date}
          time={quickPopover.time}
          onClose={() => setQuickPopover({ isOpen: false, date: null, time: '09:00' })}
          onSave={handleQuickSave}
        />
      )}

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
