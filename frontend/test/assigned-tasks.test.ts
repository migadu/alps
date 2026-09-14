/**
 * Assigned tasks: whom a task is assigned to, and who is told what.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/task-modal';
import '../../plugins/caldav/frontend/tasks-list';
import '../../plugins/caldav/frontend/tasks-page';
import '../../plugins/caldav/frontend/calendar-page';
import { tasksService, type TaskData } from '../../plugins/caldav/frontend/tasks-service';
import { calendarService, taskTellsSomeone } from '../../plugins/caldav/frontend/calendar-service';
import { cleanup, mount, record, shadow, shadowAll, text, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = {
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    getLanguage: () => 'de',
    getIntlLanguage: () => 'de',
};

const task = (fields: Partial<TaskData> = {}): TaskData => ({
    uid: 'report', title: 'Write the report', allDay: false, status: 'needs-action',
    path: '/cal/work/report.ics', calendarPath: '/cal/work/', etag: 'v1', ...fields,
});
const lists = [{ name: 'Work', description: '', path: '/cal/work/' }];
const mine = task({ role: 'organizer', organizer: { email: 'ada@example.com' }, attendees: [{ email: 'grace@example.org', name: 'Grace Hopper', status: 'completed' }] });
const theirs = task({ role: 'attendee', answer: 'accepted', organizer: { email: 'grace@example.org', name: 'Grace Hopper' }, attendees: [{ email: 'ada@example.com', status: 'accepted' }] });

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
});

describe('taskTellsSomeone', () => {
    it('reads a task\'s own answer as an invitation\'s', () => {
        expect(taskTellsSomeone(mine, 'email')).toBe(true);
        expect(taskTellsSomeone(theirs, 'email')).toBe(true);
        expect(taskTellsSomeone({ ...theirs, answer: 'declined' }, 'email')).toBe(false);
        expect(taskTellsSomeone(mine, 'server')).toBe(false);
        expect(taskTellsSomeone(task(), 'email')).toBe(false);
        expect(taskTellsSomeone(null, 'email')).toBe(false);
    });
});

describe('the task editor\'s assignees', () => {
    const editor = (props: Record<string, unknown>) => mount<El>('task-modal', { i18nStore, lists, defaultList: '/cal/work/', open: true, ...props });

    it('assigns a new task without asking, in the reader\'s language', async () => {
        const create = vi.spyOn(tasksService, 'createTask').mockResolvedValue(task());
        const el = await editor({});
        el.title = 'Write the report';
        el.attendees = ['"Grace Hopper" <grace@example.org>'];
        await el.handleSave();
        expect(create).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Write the report', attendees: [{ email: 'grace@example.org', name: 'Grace Hopper' }], notify: undefined, lang: 'de',
        }));
    });

    it('shows whom a task of the user\'s is assigned to, with their answers, and asks before telling them a change', async () => {
        const update = vi.spyOn(tasksService, 'updateTask').mockResolvedValue(mine);
        const el = await editor({ task: mine, scheduling: 'email' });
        expect(shadow<El>(el, 'alps-address-input.assignees').addresses).toEqual(['"Grace Hopper" <grace@example.org>']);
        expect(text(el, '.answers')).toBe('Grace Hopper: invitations.statuses.completed');

        await el.handleSave();
        await el.updateComplete;
        expect(update).not.toHaveBeenCalled();
        const ask = shadow<El>(el, 'ui-confirm');
        expect(ask.getAttribute('message')).toBe('tasks.notifyChanges');
        ask.dispatchEvent(new CustomEvent('secondary'));
        await waitFor(() => update.mock.calls.length === 1, 'the save');
        expect(update.mock.calls[0][1]).toEqual(expect.objectContaining({ notify: false, attendees: [{ email: 'grace@example.org', name: 'Grace Hopper' }] }));
    });

    it('does not ask when the server tells the assignees', async () => {
        const update = vi.spyOn(tasksService, 'updateTask').mockResolvedValue(mine);
        const el = await editor({ task: mine, scheduling: 'server' });
        await el.handleSave();
        expect(shadowAll(el, 'ui-confirm')).toHaveLength(0);
        expect(update).toHaveBeenCalledTimes(1);
    });

    it('leaves the assignment of a task assigned to the user alone, and says who assigned it', async () => {
        const update = vi.spyOn(tasksService, 'updateTask').mockResolvedValue(theirs);
        const el = await editor({ task: theirs, scheduling: 'email' });
        expect(shadowAll(el, 'alps-address-input')).toHaveLength(0);
        expect(text(el, '.assigned')).toBe('tasks.assignedBy: Grace Hopper');
        await el.handleSave();
        expect(shadowAll(el, 'ui-confirm')).toHaveLength(0);
        expect(update.mock.calls[0][1].attendees).toBeUndefined();
    });

    it('says when the change was saved but could not be sent', async () => {
        vi.spyOn(tasksService, 'createTask').mockResolvedValue(task({ sendFailed: true }));
        const toasts = record<CustomEvent>(window, 'show-toast');
        const el = await editor({});
        el.title = 'Write the report';
        await el.handleSave();
        expect(toasts.map(t => t.detail.message)).toEqual(['invitations.notTold']);
    });
});

describe('the task list', () => {
    it('says who assigned a task, and to whom', async () => {
        const el = await mount<El>('tasks-list', { i18nStore, tasks: [mine, { ...theirs, uid: 'b', path: '/cal/work/b.ics' }], now: new Date(2026, 8, 14) });
        expect(shadowAll(el, '.assigned').map(e => e.textContent?.trim())).toEqual(['tasks.assignedTo: Grace Hopper', 'tasks.assignedBy: Grace Hopper']);
    });
});

describe('the tasks service', () => {
    it('sends the language with a tick, and the choice with a delete', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{"ok":"true","scheduling":"server"}', { status: 200 }));
        await tasksService.completeTask('/cal/work/report.ics', true, 'de');
        expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({ done: true, lang: 'de' });
        await tasksService.deleteTask('/cal/work/report.ics', { notify: false, lang: 'de' });
        expect(String(fetchMock.mock.calls[1][0])).toMatch(/\?notify=0&lang=de$/);
        expect((await tasksService.fetchTasks()).scheduling).toBe('server');
    });
});

describe('the tasks page', () => {
    const page = () => {
        const Page = customElements.get('tasks-page')!;
        const el = new Page() as El;
        el.i18nStore = i18nStore;
        return el;
    };

    it('says when a tick was the user\'s answer and could not be sent', async () => {
        vi.spyOn(tasksService, 'completeTask').mockResolvedValue({ ...theirs, status: 'completed', sendFailed: true });
        const toasts = record<CustomEvent>(window, 'show-toast');
        const el = page();
        el.tasks = [theirs];
        await el.handleToggleComplete(theirs, true);
        expect(tasksService.completeTask).toHaveBeenCalledWith(theirs.path, true, 'de');
        expect(toasts.map(t => t.detail.message)).toContain('invitations.notTold');
    });

    it('deletes as told, and says when the message could not go', async () => {
        const remove = vi.spyOn(tasksService, 'deleteTask').mockResolvedValue({ sendFailed: true });
        const toasts = record<CustomEvent>(window, 'show-toast');
        const el = page();
        el.tasks = [mine];
        el.taskToDelete = mine;
        await el.confirmDelete(false);
        expect(remove).toHaveBeenCalledWith(mine.path, { notify: false, lang: 'de' });
        expect(el.tasks).toEqual([]);
        expect(toasts.map(t => t.detail.message)).toContain('invitations.notTold');
    });

    it('offers to delete an assigned task without telling anyone', async () => {
        vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [mine], calendars: lists, failedCalendars: 0, scheduling: 'email' });
        const el = await mount<El>('tasks-page', { i18nStore });
        await waitFor(() => el.tasks.length === 1, 'the tasks');
        el.taskToDelete = mine;
        await el.updateComplete;
        expect(shadow(el, 'ui-confirm.delete-assigned').getAttribute('message')).toBe('tasks.deleteTellAssignees');
        el.taskToDelete = theirs;
        await el.updateComplete;
        expect(shadow(el, 'ui-confirm.delete-assigned').getAttribute('message')).toBe('tasks.deleteTellAssigner');
        el.taskToDelete = task();
        await el.updateComplete;
        expect(shadowAll(el, 'ui-confirm.delete-assigned')).toHaveLength(0);
    });

    it('asks nothing when the server tells the assignees', async () => {
        vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [mine], calendars: lists, failedCalendars: 0, scheduling: 'server' });
        const el = await mount<El>('tasks-page', { i18nStore });
        await waitFor(() => el.tasks.length === 1, 'the tasks');
        expect(el.scheduling).toBe('server');
        el.taskToDelete = mine;
        await el.updateComplete;
        expect(shadowAll(el, 'ui-confirm.delete-assigned')).toHaveLength(0);
        expect(shadowAll(el, 'ui-confirm')).toHaveLength(1);
    });
});

describe('the calendar page', () => {
    it('says when ticking off a task chip was an answer that could not be sent', async () => {
        vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: lists, scheduling: 'email' });
        vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
        vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
        const complete = vi.spyOn(tasksService, 'completeTask').mockResolvedValue({ ...theirs, status: 'completed', sendFailed: true });
        const toasts = record<CustomEvent>(window, 'show-toast');
        const el = await mount<El>('calendar-page', { i18nStore });
        await waitFor(() => el.calendars.length === 1, 'the calendars');
        shadow(el, '.calendar-body').dispatchEvent(new CustomEvent('complete-task', { detail: { task: theirs }, bubbles: true, composed: true }));
        await waitFor(() => toasts.length > 0, 'the report');
        expect(complete).toHaveBeenCalledWith(theirs.path, true, 'de');
        expect(toasts.map(t => t.detail.message)).toContain('invitations.notTold');
    });

    it('offers the same choice for a task chip, and deletes as told', async () => {
        vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: lists, scheduling: 'email' });
        vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
        vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
        const remove = vi.spyOn(tasksService, 'deleteTask').mockResolvedValue({});
        const el = await mount<El>('calendar-page', { i18nStore });
        await waitFor(() => el.calendars.length === 1, 'the calendars');
        el.eventToDelete = { ...mine, task: mine };
        await el.updateComplete;
        const ask = shadow<El>(el, 'ui-confirm.delete-meeting');
        expect(ask.getAttribute('message')).toBe('tasks.deleteTellAssignees');
        ask.dispatchEvent(new CustomEvent('secondary'));
        await waitFor(() => remove.mock.calls.length === 1, 'the delete');
        expect(remove).toHaveBeenCalledWith(mine.path, { notify: false, lang: 'de' });
    });
});
