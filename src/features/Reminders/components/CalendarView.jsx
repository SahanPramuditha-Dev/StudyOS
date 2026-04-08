import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { toReminderDateTime } from '../../../utils/reminderDate';

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (a, b) => (
  a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate()
);

const getMonthDays = (selectedDate) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return d;
  });
};

const getWeekDays = (selectedDate) => {
  const start = startOfDay(selectedDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    return d;
  });
};

const getDayHours = () => Array.from({ length: 24 }, (_, h) => h);

const CalendarView = ({
  view,
  selectedDate,
  events,
  onSelectDate,
  onCreateEvent,
  onEventClick
}) => {
  const monthDays = useMemo(() => getMonthDays(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const dayHours = useMemo(() => getDayHours(), []);
  const today = useMemo(() => startOfDay(new Date()), []);

  const getEventsForDay = (day) => {
    return events
      .filter((event) => {
        const eventDate = toReminderDateTime(event.date, event.time);
        return eventDate && isSameDay(eventDate, day);
      })
      .sort((a, b) => {
        const aTime = toReminderDateTime(a.date, a.time)?.getTime() || 0;
        const bTime = toReminderDateTime(b.date, b.time)?.getTime() || 0;
        return aTime - bTime;
      });
  };

  if (view === 'month') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-4 md:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={`min-h-[110px] rounded-2xl p-2 text-left border transition-all ${
                  isSelected
                    ? 'border-primary-300 bg-primary-50/50 dark:bg-primary-500/10'
                    : 'border-slate-100 dark:border-slate-800 hover:border-primary-200'
                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-black ${isToday ? 'text-primary-500' : 'text-slate-600 dark:text-slate-300'}`}>
                    {day.getDate()}
                  </span>
                  {isCurrentMonth && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateEvent(day);
                      }}
                      className="inline-flex p-1 rounded-lg text-slate-300 hover:text-primary-500 hover:bg-white dark:hover:bg-slate-800"
                    >
                      <Plus size={12} />
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <motion.div
                      key={event.id}
                      layout
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate ${
                        event.completed
                          ? 'bg-green-100 dark:bg-green-500/10 text-green-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {event.allDay ? 'All day' : event.time} {event.message || event.title}
                    </motion.div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] font-black text-slate-400">+{dayEvents.length - 2} more</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'week') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-4 md:p-6 shadow-sm">
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, today);
            return (
              <div key={day.toISOString()} className="space-y-3">
                <button
                  onClick={() => onSelectDate(day)}
                  className={`w-full p-3 rounded-2xl border text-left ${
                    isToday
                      ? 'border-primary-300 bg-primary-50/50 dark:bg-primary-500/10'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                  <p className="text-xl font-black text-slate-800 dark:text-white">{day.getDate()}</p>
                </button>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-left"
                    >
                      <p className="text-[10px] font-black text-slate-400">{event.allDay ? 'All day' : event.time}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{event.message || event.title}</p>
                    </button>
                  ))}
                  <button
                    onClick={() => onCreateEvent(day)}
                    className="w-full py-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-500 hover:border-primary-200"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-4 md:p-6 shadow-sm space-y-2">
      {dayHours.map((hour) => {
        const hourEvents = events.filter((event) => {
          if (event.allDay) return false;
          const eventDate = toReminderDateTime(event.date, event.time);
          return eventDate && isSameDay(eventDate, selectedDate) && eventDate.getHours() === hour;
        });

        return (
          <div key={hour} className="grid grid-cols-[70px_1fr] gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-none">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 pt-2">
              {String(hour).padStart(2, '0')}:00
            </div>
            <div className="space-y-2 min-h-[38px]">
              {hourEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-left"
                >
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200">{event.message || event.title}</p>
                  <p className="text-[10px] font-bold text-slate-400">{event.durationMinutes || 60} min</p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarView;

