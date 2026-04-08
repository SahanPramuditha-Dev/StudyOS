/**
 * Google Calendar API service for StudyOS reminders
 * Handles create/update/delete/list events with proper timezone formatting
 */

import { formatDateKey } from '../utils/reminderDate.js';

const normalizeAccessToken = (tokenLike) => {
  if (!tokenLike) return null;
  if (typeof tokenLike === 'string') return tokenLike;
  return tokenLike.accessToken || tokenLike.access_token || tokenLike.token || null;
};

const getAuthHeaders = (tokenLike, extra = {}) => {
  const accessToken = normalizeAccessToken(tokenLike);
  if (!accessToken) {
    throw new Error('Google access token missing or expired. Please reconnect.');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
    ...extra
  };
};

/**
 * Parse stored Google event reference formats:
 * - direct event id: "abc123"
 * - imported calendar event: "calendarId:eventId"
 * - imported task marker: "task:taskId"
 */
const parseGoogleEventReference = (eventRef) => {
  const raw = String(eventRef || '').trim();
  if (!raw) return { calendarId: 'primary', eventId: '', isTask: false };

  if (raw.startsWith('task:')) {
    return { calendarId: null, eventId: raw.slice(5), isTask: true };
  }

  const colonIndex = raw.indexOf(':');
  if (colonIndex <= 0) {
    return { calendarId: 'primary', eventId: raw, isTask: false };
  }

  return {
    calendarId: raw.slice(0, colonIndex),
    eventId: raw.slice(colonIndex + 1),
    isTask: false
  };
};

/**
 * Format date for Google Calendar API (local time without Z or milliseconds)
 * @param {Date} date - Local date/time
 * @returns {string} "2026-04-08T15:30:00"
 */
const formatDateTimeForGoogleCalendar = (date) => {
  const iso = date.toISOString();
  return iso.slice(0, 19); // YYYY-MM-DDTHH:mm:ss
};

/**
 * Create a Google Calendar event from StudyOS reminder
 * @param {Object} accessToken - Google OAuth access token  
 * @param {Object} event - StudyOS event/reminder data
 * @returns {Promise<Object>} Created event
 */
export const createGoogleCalendarEvent = async (accessToken, event) => {
  try {
    const summary = event.title || event.message || 'Untitled event';
    const description = event.description || event.notes || event.details || '';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Normalize date format (should be YYYY-MM-DD)
    const dateStr = event.date || formatDateKey(new Date());
    const timeStr = event.time || '09:00';

    const startDateTime = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(startDateTime.getTime())) {
      throw new Error(`Invalid start date/time: ${dateStr}T${timeStr}`);
    }

    const durationMinutes = event.durationMinutes || 60;
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
    
    // All-day events use date only (end date +1 day per Google spec)
    const endDateStr = event.allDay 
      ? formatDateKey(new Date(endDateTime.getTime() + 86400000)) 
      : null;

    const googleEvent = {
      summary,
      description,
      start: event.allDay
        ? { date: dateStr }
        : { 
            dateTime: formatDateTimeForGoogleCalendar(startDateTime), 
            timeZone 
          },
      end: event.allDay
        ? { date: endDateStr }
        : { 
            dateTime: formatDateTimeForGoogleCalendar(endDateTime), 
            timeZone 
          },
      reminders: {
        useDefault: false,
        overrides: [
          {
method: 'popup',
            minutes: Math.max(0, event.reminderOffsetMinutes || 15)
          }
        ]
      }
    };

    // Add color based on category (Google event colors)
    const categoryColors = {
      Study: '1',
      Assignment: '2', 
      Exam: '3',
      Project: '4',
      Personal: '5'
    };
    
    if (event.category && categoryColors[event.category]) {
      googleEvent.colorId = categoryColors[event.category];
    }

    console.log('Creating Google Calendar event with payload:', JSON.stringify(googleEvent, null, 2));

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: getAuthHeaders(accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(googleEvent)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google Calendar API error response:', errorBody);
      if (response.status === 401) {
        throw new Error('Google Calendar session expired. Please reconnect.');
      }
      
      // Try to parse detailed error
      try {
        const errorData = JSON.parse(errorBody);
        console.error('Detailed Google Calendar error:', errorData);
        throw new Error(`Google Calendar API: ${errorData.error?.message || 'Unknown error'} (code: ${response.status})`);
      } catch (parseErr) {
        throw new Error(`Failed to create event: ${response.status} - ${errorBody.slice(0, 500)}`);
      }
    }

    const result = await response.json();
    console.log('Google Calendar event created successfully:', result.id);
    return result;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
};

/**
 * Update a Google Calendar event
 */
export const updateGoogleCalendarEvent = async (accessToken, eventId, event) => {
  try {
    const parsedRef = parseGoogleEventReference(eventId);
    if (parsedRef.isTask) {
      return null;
    }

    const summary = event.title || event.message || 'Untitled event';
    const description = event.description || event.notes || event.details || '';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Normalize date format
    const dateStr = event.date || formatDateKey(new Date());
    const timeStr = event.time || '09:00';

    const startDateTime = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(startDateTime.getTime())) {
      throw new Error(`Invalid start date/time: ${dateStr}T${timeStr}`);
    }

    const endDateTime = new Date(startDateTime.getTime() + (event.durationMinutes || 60) * 60000);
    const endDateStr = endDateTime.toISOString().split('T')[0];

    const googleEvent = {
      summary,
      description,
      start: event.allDay
        ? { date: dateStr }
        : { dateTime: formatDateTimeForGoogleCalendar(startDateTime), timeZone },
      end: event.allDay
        ? { date: endDateStr }
        : { dateTime: formatDateTimeForGoogleCalendar(endDateTime), timeZone }
    };

    console.log('Updating Google Calendar event with payload:', JSON.stringify(googleEvent, null, 2));

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(parsedRef.calendarId || 'primary')}/events/${encodeURIComponent(parsedRef.eventId)}`,
      {
      method: 'PATCH',
      headers: getAuthHeaders(accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(googleEvent)
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google Calendar API error response:', errorBody);
      if (response.status === 401) {
        throw new Error('Google Calendar session expired. Please reconnect.');
      }
      throw new Error(`Failed to update Google Calendar event: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const result = await response.json();
    console.log('Google Calendar event updated successfully:', result.id);
    return result;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
};

/**
 * Delete a Google Calendar event
 */
export const deleteGoogleCalendarEvent = async (accessToken, eventId) => {
  try {
    const parsedRef = parseGoogleEventReference(eventId);
    if (parsedRef.isTask) {
      return true;
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(parsedRef.calendarId || 'primary')}/events/${encodeURIComponent(parsedRef.eventId)}`,
      {
      method: 'DELETE',
      headers: getAuthHeaders(accessToken)
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google Calendar delete error:', errorBody);
      if (response.status === 401) {
        throw new Error('Google Calendar session expired. Please reconnect.');
      }
      if (response.status === 404) {
        // Event is already gone in Google Calendar; consider local delete successful.
        return true;
      }
      throw new Error(`Failed to delete Google Calendar event: ${response.statusText} - ${errorBody.slice(0, 200)}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
};

/**
 * Get user's calendar list
 */
export const getGoogleCalendarList = async (accessToken) => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: getAuthHeaders(accessToken)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google Calendar list API error body:', errorBody);
      if (response.status === 401) {
        throw new Error('Google Calendar session expired. Please reconnect.');
      }
      if (response.status === 403) {
        console.warn('Insufficient CalendarList scope - falling back to primary calendar');
        return [{ id: 'primary' }];
      }
      throw new Error(`Failed to fetch calendars: ${response.status} - ${errorBody.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching Google calendar list:', error);
    throw error;
  }
};

export const getGoogleCalendarEventsForCalendar = async (accessToken, calendarId, startDate, endDate) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true&orderBy=startTime`,
      {
        headers: getAuthHeaders(accessToken)
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Events API error for ${calendarId}:`, errorBody);
      if (response.status === 401) {
        throw new Error('Google Calendar session expired. Please reconnect.');
      }
      throw new Error(`Failed to fetch events for ${calendarId}: ${response.status} - ${errorBody.slice(0, 200)}`);
    }

    const data = await response.json();
    return (data.items || []).map((event) => ({ ...event, _calendarId: calendarId }));
  } catch (error) {
    console.error('Error fetching events for calendar:', calendarId, error);
    throw error;
  }
};

export const getGoogleCalendarEvents = async (accessToken, startDate, endDate) => {
  try {
    const calendars = await getGoogleCalendarList(accessToken);
    const calendarIds = calendars.length ? calendars.map((c) => c.id) : ['primary'];
    const results = await Promise.all(calendarIds.map((id) => getGoogleCalendarEventsForCalendar(accessToken, id, startDate, endDate)));
    return results.flat();
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
};

// Google Tasks functions (unchanged)
export const getGoogleTaskLists = async (accessToken) => {
  try {
    const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      headers: getAuthHeaders(accessToken)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 403) {
        console.warn('Google Tasks API unavailable or insufficient scope');
        return [];
      }
      console.error('Google Tasks list API error:', errorBody);
      throw new Error(`Failed to fetch task lists: ${response.status} - ${errorBody.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching Google task lists:', error);
    return [];
  }
};

export const getGoogleTasks = async (accessToken) => {
  try {
    const taskLists = await getGoogleTaskLists(accessToken);
    if (!taskLists.length) return [];

    const results = await Promise.all(taskLists.map(async (list) => {
      const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?showHidden=true&maxResults=250`, {
        headers: getAuthHeaders(accessToken, { 'Content-Type': 'application/json' })
      });

      if (!response.ok) {
        console.warn(`Skipping task list ${list.id}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.items || [];
    }));

    return results.flat();
  } catch (error) {
    console.error('Error fetching Google Tasks:', error);
    return [];
  }
};

