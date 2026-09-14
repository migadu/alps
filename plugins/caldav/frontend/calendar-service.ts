import { encodePathParam, fetchWithTimeout, HttpStatusError } from '../../../frontend/src/utils/fetch-utils';
import { dueOf, isClosed, type TaskData } from './tasks-service';
import type { InvitationPerson, SavedInvitation } from './invitation-service';

export interface CalendarData {
    name: string;
    description: string;
    path: string;
    color?: string;
    /** The components the calendar takes, as its server states them; none stated means all. */
    components?: string[];
}

/**
 * Whether a calendar takes events.
 *
 * A server can keep tasks in calendars of their own (Apple's Reminders lists
 * are such calendars). Listed on the calendar page they showed no events, and
 * an event saved into one was refused.
 */
export function holdsEvents(calendar: Pick<CalendarData, 'components'>): boolean {
    return !calendar.components?.length || calendar.components.some(component => component.toUpperCase() === 'VEVENT');
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
    /** Set when this is not an event but a task drawn on the calendar; see taskChips. */
    task?: TaskData;
    /** Who a meeting involves. */
    organizer?: InvitationPerson;
    attendees?: InvitationPerson[];
    /** The user's part in a meeting: 'organizer', 'attendee', or none for an event of their own. */
    role?: 'organizer' | 'attendee' | '';
    /** The user's answer, when they are an attendee. */
    status?: string;
    /** The event is over (a repeating one, its last occurrence): nobody is told of a change to it, or asked to answer it. */
    ended?: boolean;
}

/** What a save answers: where the event is, and the version now stored. */
export interface SavedEvent {
    ok: string;
    path: string;
    etag?: string;
    /** The guests were emailed about the change. */
    sent?: boolean;
    /** Saved, but emailing the guests failed. */
    sendFailed?: boolean;
}

/** What the event editor sends. */
export type EventInput = Omit<EventData, 'uid' | 'path'> & {
    /** Whether to tell the guests about the change; unsaid is yes. */
    notify?: boolean;
    /** The language to write those messages in. */
    lang?: string;
};

export interface CalendarListing {
    calendars: CalendarData[];
    /** Who sends invitations and replies: the calendar server, or alps by email. */
    scheduling?: 'server' | 'email';
}

/** A guest as the address field spells one: `"Name" <address>` or a bare address. */
export function personFromAddress(address: string): InvitationPerson | null {
    const trimmed = address.trim();
    const angled = /^(.*)<([^<>\s]+@[^<>\s]+)>$/.exec(trimmed);
    if (angled) {
        const name = angled[1].trim().replace(/^"(.*)"$/, '$1').trim();
        return name ? { email: angled[2], name } : { email: angled[2] };
    }
    return /^[^\s@<>]+@[^\s@<>]+$/.test(trimmed) ? { email: trimmed } : null;
}

/** The address field's spelling of a guest. */
export function addressOfPerson(person: InvitationPerson): string {
    const name = person.name?.replace(/"/g, '').trim();
    return name ? `"${name}" <${person.email}>` : person.email;
}

/** Whether saving or removing a task emails anyone; see tellsSomeone. */
export function taskTellsSomeone(task: Pick<TaskData, 'role' | 'attendees' | 'answer'> | undefined | null, scheduling: string | undefined): boolean {
    return !!task && tellsSomeone({ role: task.role, attendees: task.attendees, status: task.answer }, scheduling);
}

/**
 * Whether saving or removing an event emails anyone, which alps does itself
 * only when the server does not schedule: a meeting the user organizes, or an
 * invitation they have not declined, and neither once it is over.
 */
export function tellsSomeone(event: Pick<EventData, 'role' | 'attendees' | 'status' | 'ended'> | undefined, scheduling: string | undefined): boolean {
    if (!event || scheduling === 'server' || event.ended) return false;
    if (event.role === 'organizer') return (event.attendees?.length ?? 0) > 0;
    return event.role === 'attendee' && event.status !== 'declined';
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
    async fetchCalendars(): Promise<CalendarListing> {
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

    async createEvent(event: EventInput): Promise<SavedEvent> {
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

    async updateEvent(path: string, event: EventInput): Promise<SavedEvent> {
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

    /** Answers, from the calendar, an invitation it holds; the server mails the organizer unless the calendar server does. */
    async respondToEvent(event: Pick<EventData, 'path' | 'etag' | 'task'>, status: string, lang?: string): Promise<SavedInvitation> {
        const kind = event.task ? 'tasks' : 'events';
        const response = await fetchWithTimeout(`/calendar/${kind}/${encodePathParam(event.path)}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, etag: event.etag, lang }),
        });
        if (!response.ok) {
            throw new HttpStatusError(response.status, 'Failed to answer the invitation');
        }
        return response.json();
    }

    async deleteEvent(path: string, options: { notify?: boolean; lang?: string } = {}): Promise<{ ok: string; sent?: boolean; sendFailed?: boolean }> {
        const encodedPath = encodePathParam(path);
        const params = new URLSearchParams();
        if (options.notify === false) params.set('notify', '0');
        if (options.lang) params.set('lang', options.lang);
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await fetchWithTimeout(`/calendar/events/${encodedPath}${query}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete event');
        }
        return response.json();
    }
}

const ymd = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * The open tasks that have a due date, as chips for the calendar.
 *
 * A chip sits in the all-day row of its due date whether or not the task has
 * a due time: a deadline is a moment, not a span to draw across the hours. A
 * repeating task shows once, on the date it is due now; ticked off, it moves
 * to its next.
 */
export function taskChips(tasks: TaskData[]): EventData[] {
    const chips: EventData[] = [];
    for (const task of tasks) {
        const due = dueOf(task);
        if (!due || isClosed(task)) continue;
        const next = new Date(due.getFullYear(), due.getMonth(), due.getDate() + 1);
        chips.push({
            uid: task.uid,
            summary: task.title,
            // The views read an all-day start's date part as a date here.
            start: `${ymd(due)}T00:00:00Z`,
            end: `${ymd(next)}T00:00:00Z`,
            allDay: true,
            path: task.path,
            calendarPath: task.calendarPath,
            task,
        });
    }
    return chips;
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
