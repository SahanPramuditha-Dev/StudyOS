import React from 'react';
import { Bell, Clock3 } from 'lucide-react';

const ReminderPanel = ({ notifications, onSnooze, onMarkRead }) => {
  const reminderNotifications = notifications.filter((n) => n.type === 'reminder').slice(0, 8);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500">
          <Bell size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Reminder Queue</h3>
          <p className="text-[10px] font-bold text-slate-400">{reminderNotifications.length} active alerts</p>
        </div>
      </div>

      <div className="space-y-2">
        {reminderNotifications.map((notification) => (
          <div key={notification.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-xs font-black text-slate-800 dark:text-slate-100">{notification.message}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
              <Clock3 size={10} />
              {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : notification.time}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onSnooze(notification)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-500/10"
              >
                Snooze
              </button>
              <button
                onClick={() => onMarkRead(notification.id)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
        {reminderNotifications.length === 0 && (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs font-bold text-slate-400">No pending reminder alerts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderPanel;

