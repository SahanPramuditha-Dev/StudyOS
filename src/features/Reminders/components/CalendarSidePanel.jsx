import React from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  ExternalLink,
  Flame,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { toReminderDateTime } from '../../../utils/reminderDate';

const isSameDay = (a, b) => (
  a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate()
);

const CalendarSidePanel = ({
  selectedDate,
  onSelectDate,
  events = [],
  notifications = [],
  onEventClick,
  onNavigateLinked,
  onSnooze,
  onMute,
  onUnmute,
  onStopAlarm,
  onMarkRead,
  onToggleComplete,
  onDeleteEvent
}) => {
  const today = new Date();
  
  // Mini Month Calendar helper
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDayIndex = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const miniDays = Array.from({ length: 35 }, (_, i) => {
    const dayNum = i - startDayIndex + 1;
    if (dayNum > 0 && dayNum <= daysInMonth) {
      return new Date(year, month, dayNum);
    }
    return null;
  });

  // Selected Day Events
  const selectedDayEvents = events.filter((e) => {
    const dt = toReminderDateTime(e.date, e.time);
    return dt && isSameDay(dt, selectedDate);
  });

  // Countdowns (Urgent events within next 48 hours)
  const urgentCountdowns = events.filter((e) => {
    if (e.completed) return false;
    const dt = toReminderDateTime(e.date, e.time);
    if (!dt) return false;
    const diffHours = (dt - today) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 48;
  }).slice(0, 4);

  // Active Reminder Notifications
  const activeAlerts = notifications.filter((n) => n.type === 'reminder').slice(0, 5);

  const prevMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() - 1);
    onSelectDate(d);
  };

  const nextMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + 1);
    onSelectDate(d);
  };

  return (
    <aside className="space-y-5">
      {/* Mini Month Navigator */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="text-[10px] font-black text-slate-400 py-1">
              {d}
            </span>
          ))}
          {miniDays.map((d, idx) => {
            if (!d) return <div key={idx} className="h-7" />;
            const isToday = isSameDay(d, today);
            const isSelected = isSameDay(d, selectedDate);
            const hasEvents = events.some((e) => {
              const dt = toReminderDateTime(e.date, e.time);
              return dt && isSameDay(dt, d);
            });

            return (
              <button
                key={idx}
                onClick={() => onSelectDate(d)}
                className={`h-7 w-7 mx-auto rounded-xl text-xs font-bold transition-all relative flex items-center justify-center ${
                  isSelected
                    ? 'bg-primary-500 text-white shadow-xs'
                    : isToday
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-500 font-extrabold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {d.getDate()}
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-500">
              <CalendarIcon size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>
              <p className="text-[10px] font-bold text-slate-400">{selectedDayEvents.length} events scheduled</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {selectedDayEvents.map((event) => {
            const linkMeta = onNavigateLinked ? onNavigateLinked(event, true) : null;

            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className="group p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100/50 dark:border-slate-800 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                    <Clock size={10} />
                    {event.allDay ? 'All Day' : event.time} ({event.durationMinutes || 60}m)
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(event.id);
                      }}
                      className={`p-1 rounded-lg ${
                        event.completed ? 'text-green-500' : 'text-slate-400 hover:text-green-500'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(event);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className={`text-xs font-bold truncate ${
                  event.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {event.message || event.title}
                </p>

                {linkMeta?.label && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary-500">
                    {linkMeta.label}
                    <ExternalLink size={10} />
                  </span>
                )}
              </div>
            );
          })}

          {selectedDayEvents.length === 0 && (
            <div className="p-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400">No events on this day</p>
            </div>
          )}
        </div>
      </div>

      {/* Urgent Countdown Tickers */}
      {urgentCountdowns.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-500/10 dark:to-orange-500/10 rounded-[2rem] border border-rose-100 dark:border-rose-900/30 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Flame size={16} />
            <h3 className="text-xs font-black uppercase tracking-wider">Upcoming Deadlines (&lt;48h)</h3>
          </div>

          <div className="space-y-2">
            {urgentCountdowns.map((event) => {
              const dt = toReminderDateTime(event.date, event.time);
              const hoursLeft = dt ? Math.max(0, Math.round((dt - today) / (1000 * 60 * 60))) : 0;

              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 cursor-pointer hover:shadow-xs transition-all flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{event.message || event.title}</p>
                    <p className="text-[10px] font-bold text-slate-400">{event.category} • {event.date}</p>
                  </div>
                  <span className="px-2 py-1 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase whitespace-nowrap">
                    In {hoursLeft}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Reminder Queue / Alerts */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500">
            <Bell size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Reminder Alerts</h3>
            <p className="text-[10px] font-bold text-slate-400">{activeAlerts.length} active alerts</p>
          </div>
        </div>

        <div className="space-y-2">
          {activeAlerts.map((n) => (
            <div key={n.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{n.message}</p>
              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Clock3 size={10} />
                {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : n.time}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => onSnooze(n, 5)}
                  className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100"
                >
                  Snooze 5m
                </button>
                <button
                  onClick={() => onStopAlarm(n)}
                  className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100"
                >
                  Stop
                </button>
                <button
                  onClick={() => onMarkRead(n.id)}
                  className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}

          {activeAlerts.length === 0 && (
            <div className="p-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400">No active reminder alerts</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default CalendarSidePanel;
