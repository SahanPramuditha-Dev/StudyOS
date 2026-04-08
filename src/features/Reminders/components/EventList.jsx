import React from 'react';
import { CalendarClock, ExternalLink } from 'lucide-react';
import { toReminderDateTime } from '../../../utils/reminderDate';

const EventList = ({ events, onEventClick, onNavigateLinked }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-500">
          <CalendarClock size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Upcoming Events</h3>
          <p className="text-[10px] font-bold text-slate-400">{events.length} scheduled</p>
        </div>
      </div>

      <div className="space-y-2">
        {events.slice(0, 8).map((event) => {
          const at = toReminderDateTime(event.date, event.time);
          const linkMeta = onNavigateLinked(event, true);
          return (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{event.message}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                {at ? at.toLocaleString() : `${event.date} ${event.time}`}
              </p>
              {linkMeta?.label && (
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-black uppercase tracking-widest text-primary-500">
                  {linkMeta.label}
                  <ExternalLink size={11} />
                </span>
              )}
            </button>
          );
        })}
        {events.length === 0 && (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs font-bold text-slate-400">No upcoming events</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;

