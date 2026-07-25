import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, ExternalLink, Calendar as CalendarIcon, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import { toReminderDateTime } from '../../../utils/reminderDate';

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (a, b) => (
  a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate()
);

const getCategoryColor = (cat, courseColor) => {
  if (courseColor) {
    return `${courseColor} text-white`;
  }
  switch (cat) {
    case 'Study': return 'bg-blue-500 text-white';
    case 'Exam': return 'bg-rose-500 text-white';
    case 'Assignment': return 'bg-amber-500 text-white';
    case 'Project': return 'bg-purple-500 text-white';
    case 'Personal': return 'bg-emerald-500 text-white';
    case 'Budget': return 'bg-teal-500 text-white';
    default: return 'bg-slate-600 text-white';
  }
};

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
  courses = [],
  onSelectDate,
  onCreateEvent,
  onEventClick,
  onNavigateLinked,
  isMultiSelect = false,
  selectedEventIds = [],
  onToggleSelectEvent
}) => {
  const monthDays = useMemo(() => getMonthDays(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const dayHours = useMemo(() => getDayHours(), []);
  const today = useMemo(() => startOfDay(new Date()), []);
  const now = useMemo(() => new Date(), []);

  const courseColorMap = useMemo(() => {
    const map = new Map();
    (courses || []).forEach((c) => {
      if (c.id && c.color) map.set(c.id, c.color);
    });
    return map;
  }, [courses]);

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

  const sortedGroupedEvents = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => {
      const key = ev.date || 'Unscheduled';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    });
    return Array.from(map.entries()).sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));
  }, [events]);

  // MONTH VIEW
  if (view === 'month') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-4 md:p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-[11px] font-black uppercase tracking-wider text-slate-400 text-center py-1">
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
                className={`min-h-[120px] rounded-2xl p-2 text-left border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-500/10 shadow-xs ring-2 ring-primary-400/20'
                    : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30'
                } ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`text-xs font-black h-6 w-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-primary-500 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {isCurrentMonth && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateEvent(day);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      title="Add event"
                    >
                      <Plus size={12} />
                    </span>
                  )}
                </div>

                <div className="space-y-1 w-full flex-1">
                  {dayEvents.slice(0, 2).map((event) => {
                    const courseColor = courseColorMap.get(event.relatedCourseId);
                    const catBg = getCategoryColor(event.category, courseColor);
                    const isChecked = selectedEventIds.includes(event.id);

                    return (
                      <motion.div
                        key={event.id}
                        layout
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isMultiSelect) {
                            onToggleSelectEvent(event.id);
                          } else {
                            onEventClick(event);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate flex items-center gap-1 shadow-2xs ${
                          event.completed
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through'
                            : `${catBg}`
                        } ${isChecked ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`}
                      >
                        {isMultiSelect && (
                          <span className="shrink-0">
                            {isChecked ? <CheckSquare size={10} /> : <Square size={10} />}
                          </span>
                        )}
                        <span className="truncate">{event.allDay ? 'All day' : event.time} {event.message || event.title}</span>
                      </motion.div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] font-black text-slate-400 pl-1">+ {dayEvents.length - 2} more</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // WEEK VIEW
  if (view === 'week') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-4 md:p-6 shadow-xs">
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, today);
            return (
              <div key={day.toISOString()} className="space-y-3">
                <button
                  onClick={() => onSelectDate(day)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all ${
                    isToday
                      ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-500/10 ring-2 ring-primary-400/20'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">
                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                  </p>
                  <p className={`text-xl font-black ${isToday ? 'text-primary-500' : 'text-slate-800 dark:text-white'}`}>
                    {day.getDate()}
                  </p>
                </button>

                <div className="space-y-2">
                  {dayEvents.map((event) => {
                    const isChecked = selectedEventIds.includes(event.id);
                    return (
                      <button
                        key={event.id}
                        onClick={() => {
                          if (isMultiSelect) {
                            onToggleSelectEvent(event.id);
                          } else {
                            onEventClick(event);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all border ${
                          isChecked ? 'border-slate-900 dark:border-white ring-1' : 'border-transparent hover:border-slate-300'
                        } ${
                          event.completed
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                            {isMultiSelect && (isChecked ? <CheckSquare size={10} /> : <Square size={10} />)}
                            {event.allDay ? 'All day' : event.time}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(event.category, courseColorMap.get(event.relatedCourseId)).split(' ')[0]}`} />
                        </div>
                        <p className={`text-xs font-bold truncate ${event.completed ? 'line-through' : ''}`}>
                          {event.message || event.title}
                        </p>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => onCreateEvent(day)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-primary-500 hover:border-primary-300 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus size={12} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // AGENDA VIEW
  if (view === 'agenda') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-5 md:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <CalendarIcon size={18} className="text-primary-500" />
            <h3 className="text-sm font-black uppercase tracking-wider">Agenda Overview</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">{events.length} total entries</span>
        </div>

        <div className="space-y-6">
          {sortedGroupedEvents.map(([dateGroup, groupEvents]) => (
            <div key={dateGroup} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black">
                  {dateGroup}
                </span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>

              <div className="space-y-2">
                {groupEvents.map((event) => {
                  const linkMeta = onNavigateLinked ? onNavigateLinked(event, true) : null;
                  const courseColor = courseColorMap.get(event.relatedCourseId);
                  const isChecked = selectedEventIds.includes(event.id);

                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        if (isMultiSelect) {
                          onToggleSelectEvent(event.id);
                        } else {
                          onEventClick(event);
                        }
                      }}
                      className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer ${
                        isChecked ? 'border-slate-900 dark:border-white ring-1' : 'border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isMultiSelect && (
                          <span className="text-slate-500">
                            {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                          </span>
                        )}
                        <div className={`p-2.5 rounded-xl ${getCategoryColor(event.category, courseColor)}`}>
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-400">{event.allDay ? 'All Day' : event.time}</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                              {event.category}
                            </span>
                          </div>
                          <h4 className={`text-sm font-bold mt-0.5 ${event.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                            {event.message || event.title}
                          </h4>
                        </div>
                      </div>

                      {linkMeta?.label && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-500 text-xs font-black uppercase tracking-wider">
                            {linkMeta.label}
                            <ExternalLink size={12} />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-400">No events matched your current filters.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DAY VIEW
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-4 md:p-6 shadow-xs space-y-2 relative">
      {dayHours.map((hour) => {
        const hourEvents = events.filter((event) => {
          if (event.allDay) return false;
          const eventDate = toReminderDateTime(event.date, event.time);
          return eventDate && isSameDay(eventDate, selectedDate) && eventDate.getHours() === hour;
        });

        const isCurrentHour = isSameDay(selectedDate, now) && now.getHours() === hour;

        return (
          <div key={hour} className="grid grid-cols-[70px_1fr] gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80 last:border-none relative">
            {isCurrentHour && (
              <div className="absolute left-[70px] right-0 top-1/2 h-0.5 bg-rose-500 z-10 flex items-center">
                <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1" />
              </div>
            )}

            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 pt-1">
              {String(hour).padStart(2, '0')}:00
            </div>

            <div
              onClick={() => onCreateEvent(selectedDate, `${String(hour).padStart(2, '0')}:00`)}
              className="space-y-2 min-h-[44px] rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/30 p-1 cursor-pointer transition-colors"
            >
              {hourEvents.map((event) => {
                const isChecked = selectedEventIds.includes(event.id);
                const courseColor = courseColorMap.get(event.relatedCourseId);

                return (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMultiSelect) {
                        onToggleSelectEvent(event.id);
                      } else {
                        onEventClick(event);
                      }
                    }}
                    className={`w-full p-3 rounded-2xl text-left transition-all border ${
                      isChecked ? 'ring-2 ring-slate-900 dark:ring-white border-transparent' : 'border-transparent'
                    } ${
                      event.completed
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        : `${getCategoryColor(event.category, courseColor)} shadow-xs`
                    }`}
                  >
                    <p className="text-xs font-black flex items-center gap-1.5">
                      {isMultiSelect && (isChecked ? <CheckSquare size={12} /> : <Square size={12} />)}
                      {event.message || event.title}
                    </p>
                    <p className="text-[10px] font-bold opacity-80 mt-0.5">
                      {event.durationMinutes || 60} min • {event.category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarView;
