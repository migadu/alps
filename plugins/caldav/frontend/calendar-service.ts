import { encodePathParam, fetchWithTimeout, HttpStatusError } from '../../../frontend/src/utils/fetch-utils';

export interface CalendarData {
    name: string;
    description: string;
    path: string;
    color?: string;
}

export interface EventData {
    uid: string;
    summary: string;
    description?: string;
    start: string;
    end: string;
    path: string;
    calendarPath: string;
    color?: string;
    location?: string;
    rrule?: string;
    /** Stated by the server from the event's own DTSTART; see isAllDayEvent. */
    allDay?: boolean;
    /** The version the event was read at. Sent back with an edit, which the
     * server refuses (412) if the event was saved elsewhere since. */
    etag?: string;
}

/** What a save answers: where the event is, and the version now stored. */
export interface SavedEvent {
    ok: string;
    path: string;
    etag?: string;
}

const CALENDAR_COLORS = [
    '#2563eb', // blue
    '#16a34a', // green
    '#d97706', // amber
    '#dc2626', // red
    '#9333ea', // purple
    '#0891b2', // cyan
    '#db2777', // pink
    '#ea580c', // orange
];

export function getCalendarColor(identifier: string): string {
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
        hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % CALENDAR_COLORS.length;
    return CALENDAR_COLORS[index];
}

/**
 * Whether an event is all-day, as the SERVER says.
 *
 * This used to be guessed from the strings: both ends at UTC midnight meant
 * all-day. For the guess to hold, the editor saved all-day events as UTC-midnight
 * date-times, which every other CalDAV client shows as a timed event starting at
 * midnight UTC (the evening before, anywhere west of it). The backend now writes
 * DATE values and reports `allDay` from the property itself, still recognising
 * the UTC-midnight events saved before.
 */
export function isAllDayEvent(event: Pick<EventData, 'allDay'>): boolean {
    return event.allDay === true;
}

class CalendarService {
    async fetchCalendars(): Promise<{ calendars: CalendarData[] }> {
        const response = await fetchWithTimeout('/calendar/calendars');
        if (!response.ok) {
            throw new Error('Failed to fetch calendars');
        }
        return response.json();
    }

    async fetchEvents(start: Date, end: Date, query?: string): Promise<{ events: EventData[] }> {
        const params = new URLSearchParams();
        params.append('start', start.toISOString());
        params.append('end', end.toISOString());
        if (query) {
            params.append('query', query);
        }
        const response = await fetchWithTimeout(`/calendar/events?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        return response.json();
    }

    async createCalendar(name: string): Promise<{ ok: string, path: string }> {
        const response = await fetchWithTimeout('/calendar/calendars', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        if (!response.ok) {
            throw new Error('Failed to create calendar');
        }
        return response.json();
    }

    async renameCalendar(path: string, name: string): Promise<{ ok: string }> {
        const encodedPath = encodePathParam(path);
        const response = await fetchWithTimeout(`/calendar/calendars/${encodedPath}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        if (!response.ok) {
            throw new Error('Failed to rename calendar');
        }
        return response.json();
    }

    async deleteCalendar(path: string): Promise<{ ok: string }> {
        const encodedPath = encodePathParam(path);
        const response = await fetchWithTimeout(`/calendar/calendars/${encodedPath}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete calendar');
        }
        return response.json();
    }

    async createEvent(event: Omit<EventData, 'uid' | 'path'>): Promise<SavedEvent> {
        const response = await fetchWithTimeout('/calendar/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });
        if (!response.ok) {
            throw new HttpStatusError(response.status, 'Failed to create event');
        }
        return response.json();
    }

    async updateEvent(path: string, event: Omit<EventData, 'uid' | 'path'>): Promise<SavedEvent> {
        const encodedPath = encodePathParam(path);
        const response = await fetchWithTimeout(`/calendar/events/${encodedPath}/edit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });
        if (!response.ok) {
            throw new HttpStatusError(response.status, 'Failed to update event');
        }
        return response.json();
    }

    async deleteEvent(path: string): Promise<{ ok: string }> {
        const encodedPath = encodePathParam(path);
        const response = await fetchWithTimeout(`/calendar/events/${encodedPath}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete event');
        }
        return response.json();
    }
}

/**
 * The Monday that begins `date`'s week, at midnight.
 *
 * Shared because the page and the week view must agree on it: the week view
 * draws seven days from here, and the page fetches the events for that window.
 * The page computed it as `getDate() - getDay() + 1`, which reads a SUNDAY
 * (`getDay() === 0`) as the Monday AFTER it, while the week view corrected for
 * Sunday in a private copy — so on Sundays the page fetched next week's events
 * for the week the grid was drawing, and the day the user was looking at showed
 * none. The window also began at whatever time of day the page had loaded, so a
 * load at 14:00 left Monday morning outside the fetch.
 */
export function weekStart(date: Date): Date {
    const start = new Date(date);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    return start;
}

export const calendarService = new CalendarService();
