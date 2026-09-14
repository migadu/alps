/**
 * Tasks: the VTODOs in the user's calendars, through the caldav plugin's
 * /calendar/tasks routes.
 *
 * The server reads and writes the iCalendar, and keeps every property this UI
 * has no field for, so the page deals in flat rows and flat inputs.
 */
import { encodePathParam, fetchWithTimeout, HttpStatusError } from '../../../frontend/src/utils/fetch-utils';
import type { InvitationPerson } from './invitation-service';

/** The four statuses RFC 5545 defines for a task. */
export type TaskStatus = 'needs-action' | 'in-process' | 'completed' | 'cancelled';

export interface TaskData {
    uid: string;
    title: string;
    description?: string;
    /** RFC 3339. An all-day date is its UTC midnight; read it with dueOf. */
    due?: string;
    start?: string;
    allDay: boolean;
    status: TaskStatus;
    completed?: string;
    percentComplete?: number;
    /** RFC 5545: 1 (highest) to 9, and 0 or absent for none. */
    priority?: number;
    rrule?: string;
    /** Who assigned the task, and to whom. */
    organizer?: InvitationPerson;
    attendees?: InvitationPerson[];
    /** The user's part: 'organizer' when they assigned it, 'attendee' when it was assigned to them. */
    role?: 'organizer' | 'attendee' | '';
    /** The user's own answer, on a task assigned to them. */
    answer?: string;
    /** On the answer to a write: the change was emailed, or saved but could not be. */
    sent?: boolean;
    sendFailed?: boolean;
    path: string;
    calendarPath: string;
    /** The version this was read at; an edit is refused (412) once it has moved. */
    etag?: string;
    color?: string;
}

/** What the editor sends: every field it has, each time. */
export interface TaskInput {
    title: string;
    description: string;
    /** RFC 3339, or '' for no due date. */
    due: string;
    allDay: boolean;
    status: TaskStatus;
    percentComplete: number;
    priority: number;
    rrule: string;
    calendarPath: string;
    etag?: string;
    /** Whom the task is assigned to; left out, it stays assigned as it is. */
    attendees?: InvitationPerson[];
    /** Whether to tell them about the change; unsaid is yes. */
    notify?: boolean;
    lang?: string;
}

/** A calendar that takes tasks. */
export interface TaskList {
    name: string;
    description: string;
    path: string;
    color?: string;
}

export interface TaskListing {
    tasks: TaskData[];
    calendars: TaskList[];
    /** How many lists could not be read, so the page can say its view is partial. */
    failedCalendars: number;
    /** Who tells assignees about changes: the calendar server, or alps by email. */
    scheduling?: 'server' | 'email';
}

/** Which half of the tasks a listing is for: work to do, or work done with. */
export type TaskScope = 'active' | 'closed';

export function isClosed(task: Pick<TaskData, 'status'>): boolean {
    return task.status === 'completed' || task.status === 'cancelled';
}

/**
 * When a task is due, on this device's clock.
 *
 * An all-day due date arrives as the UTC midnight of its date, which is the
 * evening before anywhere west of Greenwich. Read as an instant there, a task
 * due on the 15th showed as due on the 14th and turned overdue a day early. It
 * is taken as the local midnight of the same date instead.
 */
export function dueOf(task: Pick<TaskData, 'due' | 'allDay'>): Date | null {
    if (!task.due) return null;
    const due = new Date(task.due);
    if (Number.isNaN(due.getTime())) return null;
    return task.allDay ? new Date(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()) : due;
}

export type TaskGroup = 'overdue' | 'today' | 'week' | 'undated' | 'later' | 'completed';

/** The order groups are shown in. Undated work sits between this week's and
 * later work: it has no deadline, but is not the least pressing either. */
export const TASK_GROUP_ORDER: TaskGroup[] = ['overdue', 'today', 'week', 'undated', 'later', 'completed'];

export function groupOf(task: Pick<TaskData, 'due' | 'allDay' | 'status'>, now: Date = new Date()): TaskGroup {
    if (isClosed(task)) return 'completed';
    const due = dueOf(task);
    if (!due) return 'undated';
    // Built from the date fields, not by adding hours: a day across a DST
    // change is 23 or 25 of them.
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    // A task due at 09:00 today is still today's at 17:00: overdue means a day
    // has gone by.
    if (due < today) return 'overdue';
    if (due < tomorrow) return 'today';
    if (due < weekEnd) return 'week';
    return 'later';
}

function priorityRank(task: Pick<TaskData, 'priority'>): number {
    // 1 is the highest; 0 is none, and ranks after every set priority.
    return task.priority && task.priority > 0 ? task.priority : 10;
}

/** Work to do: soonest due first, undated last, then by priority and title. */
export function compareTasks(a: TaskData, b: TaskData): number {
    const aDue = dueOf(a)?.getTime() ?? Number.POSITIVE_INFINITY;
    const bDue = dueOf(b)?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;
    const byPriority = priorityRank(a) - priorityRank(b);
    if (byPriority !== 0) return byPriority;
    return a.title.localeCompare(b.title);
}

/**
 * Work done with: most recently due first, undated last.
 *
 * Not compareTasks reversed, which would float undated tasks to the top and
 * sort titles Z to A.
 */
export function compareClosed(a: TaskData, b: TaskData): number {
    const aDue = dueOf(a)?.getTime();
    const bDue = dueOf(b)?.getTime();
    if (aDue !== bDue) {
        if (aDue === undefined) return 1;
        if (bDue === undefined) return -1;
        return bDue - aDue;
    }
    return a.title.localeCompare(b.title);
}

/** RFC 5545's priority bands: 1 to 4 high, 5 medium, 6 to 9 low. */
export function priorityBand(priority?: number): 'high' | 'medium' | 'low' | null {
    if (!priority || priority < 1) return null;
    if (priority <= 4) return 'high';
    if (priority === 5) return 'medium';
    return 'low';
}

/** The BCP 47 tag for one of the app's language codes: `rs` is Cyrillic Serbian and `sr` Latin. */
export function intlLocale(language?: string): string | undefined {
    if (!language) return undefined;
    return language === 'rs' ? 'sr-Cyrl' : language === 'sr' ? 'sr-Latn' : language;
}

/**
 * A due date as a row shows it: the time for something due later today, the
 * date otherwise, with the year only when it is not this one. An all-day task
 * never shows a time: it has none, and 00:00 would invent one.
 */
export function formatDue(task: Pick<TaskData, 'due' | 'allDay'>, now: Date, todayLabel: string, locale?: string): string {
    const due = dueOf(task);
    if (!due) return '';
    const sameDay = due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
    const time: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    const date: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        ...(due.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
    };
    if (sameDay) return task.allDay ? todayLabel : due.toLocaleTimeString(locale, time);
    return task.allDay ? due.toLocaleDateString(locale, date) : due.toLocaleString(locale, { ...date, ...time });
}

/** The lists in the sidebar. */
export type SmartList = 'all' | 'today' | 'upcoming' | 'undated' | 'completed';

export function scopeOf(list: SmartList): TaskScope {
    return list === 'completed' ? 'closed' : 'active';
}

export function inSmartList(task: TaskData, list: SmartList, now: Date = new Date()): boolean {
    const group = groupOf(task, now);
    switch (list) {
        case 'today':
            return group === 'overdue' || group === 'today';
        case 'upcoming':
            return group === 'week' || group === 'later';
        case 'undated':
            return group === 'undated';
        case 'completed':
            return group === 'completed';
        default:
            return group !== 'completed';
    }
}

/** The editor's input for a task as it was read, version included. */
export function inputOf(task: TaskData): TaskInput {
    return {
        title: task.title,
        description: task.description ?? '',
        due: task.due ?? '',
        allDay: task.allDay,
        status: task.status,
        percentComplete: task.percentComplete ?? 0,
        priority: task.priority ?? 0,
        rrule: task.rrule ?? '',
        calendarPath: task.calendarPath,
        etag: task.etag,
    };
}

class TasksService {
    async fetchTasks(scope?: TaskScope): Promise<TaskListing> {
        const response = await fetchWithTimeout(scope ? `/calendar/tasks?scope=${scope}` : '/calendar/tasks');
        if (!response.ok) {
            throw new HttpStatusError(response.status, 'Failed to fetch tasks');
        }
        const body = await response.json();
        return {
            tasks: body.tasks ?? [],
            calendars: body.calendars ?? [],
            failedCalendars: body.failedCalendars ?? 0,
            scheduling: body.scheduling,
        };
    }

    createTask(input: TaskInput): Promise<TaskData> {
        return this.send('/calendar/tasks', input, 'Failed to create task');
    }

    updateTask(path: string, input: TaskInput): Promise<TaskData> {
        return this.send(`/calendar/tasks/${encodePathParam(path)}/edit`, input, 'Failed to update task');
    }

    /**
     * Ticks a task off, or back on. A repeating task ticked off moves to its
     * next occurrence and stays open; the answer is the task as now stored.
     */
    completeTask(path: string, done: boolean, lang?: string): Promise<TaskData> {
        return this.send(`/calendar/tasks/${encodePathParam(path)}/complete`, { done, lang }, 'Failed to update task');
    }

    async deleteTask(path: string, options: { notify?: boolean; lang?: string } = {}): Promise<{ sent?: boolean; sendFailed?: boolean }> {
        const params = new URLSearchParams();
        if (options.notify === false) params.set('notify', '0');
        if (options.lang) params.set('lang', options.lang);
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await fetchWithTimeout(`/calendar/tasks/${encodePathParam(path)}${query}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new HttpStatusError(response.status, 'Failed to delete task');
        }
        return response.json().catch(() => ({}));
    }

    private async send(url: string, body: unknown, failure: string): Promise<TaskData> {
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new HttpStatusError(response.status, failure);
        }
        return response.json();
    }
}

export const tasksService = new TasksService();
