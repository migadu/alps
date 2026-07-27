import { encodePathParam } from '../../../frontend/src/utils/fetch-utils';

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

export function isAllDayEvent(startStr: string, endStr: string): boolean {
    const isStartAllDay = startStr.endsWith('T00:00:00Z') || startStr.endsWith('T00:00:00.000Z') || startStr.length === 10;
    const isEndAllDay = endStr.endsWith('T00:00:00Z') || endStr.endsWith('T00:00:00.000Z') || endStr.length === 10;
    return isStartAllDay && isEndAllDay;
}

class CalendarService {
    async fetchCalendars(): Promise<{ calendars: CalendarData[] }> {
        const response = await fetch('/calendar/calendars');
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
        const response = await fetch(`/calendar/events?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        return response.json();
    }

    async createCalendar(name: string): Promise<{ ok: string, path: string }> {
        const response = await fetch('/calendar/calendars', {
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
        const response = await fetch(`/calendar/calendars/${encodedPath}`, {
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
        const response = await fetch(`/calendar/calendars/${encodedPath}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete calendar');
        }
        return response.json();
    }

    async createEvent(event: Omit<EventData, 'uid' | 'path'>): Promise<{ ok: string, path: string }> {
        const response = await fetch('/calendar/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });
        if (!response.ok) {
            throw new Error('Failed to create event');
        }
        return response.json();
    }

    async updateEvent(path: string, event: Omit<EventData, 'uid' | 'path'>): Promise<{ ok: string, path: string }> {
        const encodedPath = encodePathParam(path);
        const response = await fetch(`/calendar/events/${encodedPath}/edit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });
        if (!response.ok) {
            throw new Error('Failed to update event');
        }
        return response.json();
    }

    async deleteEvent(path: string): Promise<{ ok: string }> {
        const encodedPath = encodePathParam(path);
        const response = await fetch(`/calendar/events/${encodedPath}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete event');
        }
        return response.json();
    }
}

export const calendarService = new CalendarService();
