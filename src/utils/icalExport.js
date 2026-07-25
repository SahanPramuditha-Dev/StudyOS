/**
 * Utility to format StudyOS calendar events into standard iCalendar (.ics) format
 * and trigger a download in the user's browser.
 */

const formatICalDate = (dateStr, timeStr = '09:00', durationMinutes = 60, allDay = false) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '09:00').split(':').map(Number);

  const start = new Date(year, month - 1, day, hours || 9, minutes || 0, 0);
  const end = new Date(start.getTime() + (durationMinutes || 60) * 60 * 1000);

  const pad = (n) => String(n).padStart(2, '0');

  const toUTCStr = (d) => {
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  };

  if (allDay) {
    const dayStr = String(year) + pad(month) + pad(day);
    const nextDay = new Date(year, month - 1, day + 1);
    const nextDayStr = String(nextDay.getFullYear()) + pad(nextDay.getMonth() + 1) + pad(nextDay.getDate());
    return { dtStart: `;VALUE=DATE:${dayStr}`, dtEnd: `;VALUE=DATE:${nextDayStr}` };
  }

  return {
    dtStart: `:${toUTCStr(start)}`,
    dtEnd: `:${toUTCStr(end)}`
  };
};

export const exportEventsToICal = (events = [], filename = 'studyos-calendar.ics') => {
  if (!events || events.length === 0) return false;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyOS//Academic Calendar Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach((event) => {
    if (!event.date) return;

    const summary = (event.message || event.title || 'Study Event').replace(/\n/g, ' ');
    const description = (event.description || '').replace(/\n/g, ' ');
    const category = event.category || 'Study';
    const { dtStart, dtEnd } = formatICalDate(event.date, event.time, event.durationMinutes, event.allDay);
    const uid = `${event.id || Math.random().toString(36).substring(2)}@studyos.app`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`SUMMARY:[${category}] ${summary}`);
    if (description) lines.push(`DESCRIPTION:${description}`);
    lines.push(`CATEGORIES:${category}`);
    lines.push(`DTSTART${dtStart}`);
    lines.push(`DTEND${dtEnd}`);
    lines.push(`STATUS:${event.completed ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
};
