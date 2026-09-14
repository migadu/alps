/**
 * The Tasks tab: the list's groups and gestures, the editor's input, and the
 * page's handling of ticks, saves and the address.
 *
 * The page is driven through its methods on an element that is never
 * connected, with the service stubbed; the list and the editor are mounted.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/tasks-list';
import '../../plugins/caldav/frontend/task-modal';
import '../../plugins/caldav/frontend/tasks-page';
import '../../plugins/caldav/frontend/calendar-page';
import { tasksService, type TaskData } from '../../plugins/caldav/frontend/tasks-service';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { HttpStatusError } from '../src/utils/fetch-utils';
import { cleanup, mount, record, shadow, shadowAll, text, update } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = {
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    getLanguage: () => 'en',
};

const task = (title: string, fields: Partial<TaskData> = {}): TaskData => ({
    uid: title, title, allDay: false, status: 'needs-action', path: `/cal/work/${title}.ics`, calendarPath: '/cal/work/', etag: `${title}-v1`, ...fields,
});
const allDay = (date: string) => ({ due: `${date}T00:00:00Z`, allDay: true });

// Monday 14 September 2026, 17:00 on this machine's clock.
const now = new Date(2026, 8, 14, 17, 0);

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
    window.location.hash = '';
});

describe('the task list', () => {
    const list = (tasks: TaskData[], props: Record<string, unknown> = {}) => mount<El>('tasks-list', { i18nStore, tasks, now, ...props });
    const titles = (el: El) => shadowAll(el, '.row .title').map(row => row.textContent);

    it('groups rows by when they are due, each group in order', async () => {
        const el = await list([
            task('later', allDay('2026-10-01')),
            task('whenever'),
            task('late', allDay('2026-09-01')),
            task('b-today', allDay('2026-09-14')),
            task('a-today', { ...allDay('2026-09-14'), priority: 9 }),
            task('soon', allDay('2026-09-16')),
        ]);
        expect(shadowAll(el, '.group').map(group => group.textContent!.trim())).toEqual([
            'tasks.groups.overdue', 'tasks.groups.today', 'tasks.groups.week', 'tasks.groups.undated', 'tasks.groups.later',
        ]);
        expect(titles(el)).toEqual(['late', 'a-today', 'b-today', 'soon', 'whenever', 'later']);
    });

    it('keeps a settling row in the group it was ticked in, drawn done', async () => {
        const ticked = task('now', { ...allDay('2026-09-14'), status: 'completed' });
        const el = await list([ticked, task('whenever')], { settling: new Set([ticked.path]) });
        expect(shadowAll(el, '.group').map(group => group.textContent!.trim())).toEqual(['tasks.groups.today', 'tasks.groups.undated']);
        expect(shadow(el, '.row').classList.contains('done')).toBe(true);
    });

    it('ticks with the checkbox and opens with the row, never both', async () => {
        const milk = task('milk');
        const el = await list([milk]);
        const ticks = record<CustomEvent>(el, 'toggle-complete');
        const opens = record<CustomEvent>(el, 'open-task');

        shadow(el, '.check').click();
        expect(ticks.map(e => e.detail)).toEqual([{ task: milk, done: true }]);
        expect(opens).toHaveLength(0);

        shadow(el, '.row').click();
        expect(opens.map(e => e.detail.task)).toEqual([milk]);
    });

    it('unticks a completed task, and waits while a tick is on its way', async () => {
        const done = task('done', { status: 'completed' });
        const el = await list([done], { pendingPaths: new Set([done.path]) });
        const ticks = record<CustomEvent>(el, 'toggle-complete');
        expect(shadow<HTMLButtonElement>(el, '.check').disabled).toBe(true);

        await update(el, { pendingPaths: new Set() });
        shadow(el, '.check').click();
        expect(ticks.map(e => e.detail.done)).toEqual([false]);
    });

    it('walks the rows with the arrow keys, opens with Enter and ticks with Space', async () => {
        const el = await list([task('b', allDay('2026-09-15')), task('a', allDay('2026-09-14'))]);
        const ticks = record<CustomEvent>(el, 'toggle-complete');
        const opens = record<CustomEvent>(el, 'open-task');
        const press = async (key: string) => {
            shadow(el, '.scroll').dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
            await el.updateComplete;
        };

        await press('ArrowDown');
        await press('ArrowDown');
        await press('Enter');
        await press('ArrowUp');
        await press(' ');

        expect(opens.map(e => e.detail.task.title)).toEqual(['b']);
        expect(ticks.map(e => e.detail.task.title)).toEqual(['a']);
    });

    it('orders finished work most recently due first, not as open work is ordered', async () => {
        const el = await list([
            task('older', { ...allDay('2026-09-01'), status: 'completed' }),
            task('undated', { status: 'cancelled' }),
            task('newer', { ...allDay('2026-09-10'), status: 'completed' }),
        ]);
        expect(titles(el)).toEqual(['newer', 'older', 'undated']);
    });

    it('does not tick with Space a row whose tick is still on its way', async () => {
        const milk = task('milk');
        const el = await list([milk], { pendingPaths: new Set([milk.path]) });
        const ticks = record<CustomEvent>(el, 'toggle-complete');
        const scroll = shadow(el, '.scroll');
        scroll.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await el.updateComplete;
        scroll.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        expect(ticks).toHaveLength(0);
    });

    it('leaves a key pressed on a checkbox to the checkbox', async () => {
        const el = await list([task('milk')]);
        const ticks = record<CustomEvent>(el, 'toggle-complete');
        const opens = record<CustomEvent>(el, 'open-task');
        const scroll = shadow(el, '.scroll');
        scroll.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await el.updateComplete;
        shadow(el, '.check').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        shadow(el, '.check').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        expect([ticks.length, opens.length]).toEqual([0, 0]);
    });

    it('shows a time only for later today, flags what is overdue, and names priority and repeats', async () => {
        const el = await list([
            task('call', { due: new Date(2026, 8, 14, 18, 30).toISOString() }),
            task('rent', { ...allDay('2026-09-14'), priority: 1, rrule: 'FREQ=MONTHLY' }),
            task('taxes', allDay('2026-09-10')),
        ]);
        const row = (title: string) => shadowAll(el, '.row').find(r => r.querySelector('.title')!.textContent === title)!;

        expect(row('rent').querySelector('.due')!.textContent).toBe('tasks.today');
        expect(row('call').querySelector('.due')!.textContent).toMatch(/30/);
        expect(row('taxes').querySelector('.due')!.classList.contains('overdue')).toBe(true);
        expect(row('rent').querySelector('.priority')!.getAttribute('aria-label')).toBe('tasks.priorities.high');
        expect(row('rent').querySelector('.repeats')!.getAttribute('aria-label')).toBe('tasks.repeats');
    });

    it('says when a search matches nothing, and when there is nothing to do', async () => {
        expect(text(await list([], { searching: true }))).toBe('tasks.noResults');
        cleanup();
        expect(text(await list([]))).toBe('tasks.noTasks');
    });
});

describe('the task editor', () => {
    const lists = [
        { name: 'Work', description: '', path: '/cal/work/' },
        { name: 'Home', description: '', path: '/cal/home/' },
    ];
    const editor = (props: Record<string, unknown> = {}) => mount<El>('task-modal', { i18nStore, lists, open: true, ...props });

    it('sends a new all-day task as its date at UTC midnight, into the list it was opened for', async () => {
        const el = await editor({ defaultList: '/cal/home/' });
        el.title = ' Pay rent ';
        el.dueDate = '2026-10-01';
        expect(el.input()).toEqual({
            title: 'Pay rent', description: '', due: '2026-10-01T00:00:00Z', allDay: true, status: 'needs-action',
            percentComplete: 0, priority: 0, rrule: '', calendarPath: '/cal/home/', etag: undefined,
        });
    });

    it('sends a timed due date as the instant it names here', async () => {
        const el = await editor();
        el.title = 'Call';
        el.dueDate = '2026-10-01';
        el.allDay = false;
        el.dueTime = '14:30';
        expect(el.input().due).toBe(new Date(2026, 9, 1, 14, 30).toISOString());
    });

    it('sends an untouched due date back as it was read, with a rule it did not write and the version', async () => {
        const el = await editor({ task: task('report', { due: '2026-09-15T17:00:30+02:00', rrule: 'FREQ=WEEKLY;BYDAY=MO,WE' }) });
        el.title = 'Write the report';
        expect(el.input()).toMatchObject({ due: '2026-09-15T17:00:30+02:00', rrule: 'FREQ=WEEKLY;BYDAY=MO,WE', etag: 'report-v1' });
    });

    it('offers no repeat without a due date, and drops the rule when the date is cleared', async () => {
        const el = await editor({ task: task('water', { ...allDay('2026-09-15'), rrule: 'FREQ=WEEKLY' }) });
        expect(shadowAll(el, '.repeat-select')).toHaveLength(1);

        el.dueDate = '';
        await el.updateComplete;

        expect(shadowAll(el, '.repeat-select')).toHaveLength(0);
        expect(el.input()).toMatchObject({ due: '', rrule: '' });
    });

    it('completes at 100 percent, and a reopened task does not stay there', async () => {
        const el = await editor({ task: task('x') });
        el.setStatus('completed');
        expect(el.input().percentComplete).toBe(100);
        el.percent = 100;
        el.setStatus('in-process');
        expect(el.input().percentComplete).toBe(0);
    });

    it('keeps a priority another client wrote between the presets', async () => {
        const el = await editor({ task: task('x', { priority: 3 }) });
        expect(el.input().priority).toBe(3);
        expect(shadow<El>(el, '.priority-select').options.map((option: { value: string }) => option.value)).toContain('3');
    });

    it('says a refused edit was changed elsewhere, stays open, and asks for a re-read', async () => {
        vi.spyOn(tasksService, 'updateTask').mockRejectedValue(new HttpStatusError(412, 'Precondition Failed'));
        const el = await editor({ task: task('x') });
        const toasts = record<CustomEvent>(window, 'show-toast');
        const conflicts = record(el, 'conflict');
        const saves = record(el, 'saved');

        await el.handleSave();

        expect(toasts.map(e => e.detail.message)).toEqual(['tasks.saveConflict']);
        expect([conflicts.length, saves.length, el.open]).toEqual([1, 0, true]);
    });

    it('answers with the task as stored, and whether it is new', async () => {
        const stored = task('Pay rent', { calendarPath: '/cal/home/' });
        vi.spyOn(tasksService, 'createTask').mockResolvedValue(stored);
        const el = await editor();
        el.title = 'Pay rent';
        const saves = record<CustomEvent>(el, 'saved');

        await el.handleSave();

        expect(saves.map(e => e.detail)).toEqual([{ task: stored, created: true }]);
        expect(el.open).toBe(false);
    });
});

describe('the tasks page', () => {
    function page(tasks: TaskData[], fields: Record<string, unknown> = {}): El {
        const el = document.createElement('tasks-page') as El;
        Object.assign(el, {
            i18nStore, tasks, loadedScope: 'active', lists: [{ name: 'Work', description: '', path: '/cal/work/' }], ...fields,
        });
        return el;
    }

    it('ticks a row at once, then paints the task as the server stored it', async () => {
        const milk = task('milk');
        const el = page([milk]);
        let answer!: (stored: TaskData) => void;
        vi.spyOn(tasksService, 'completeTask').mockImplementation(() => new Promise(resolve => { answer = resolve; }));

        const ticking = el.handleToggleComplete(milk, true);
        expect(el.tasks[0].status).toBe('completed');
        expect(el.pendingPaths.has(milk.path)).toBe(true);

        answer({ ...milk, status: 'completed', etag: 'milk-v2' });
        await ticking;
        expect(el.tasks[0].etag).toBe('milk-v2');
        expect(el.pendingPaths.size).toBe(0);
    });

    it('keeps a ticked row in view until the view is next loaded', async () => {
        const milk = task('milk');
        const el = page([milk], { selectedList: 'undated' });
        vi.spyOn(tasksService, 'completeTask').mockResolvedValue({ ...milk, status: 'completed' });

        await el.handleToggleComplete(milk, true);
        expect(el.visibleTasks.map((t: TaskData) => t.title)).toEqual(['milk']);

        vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [{ ...milk, status: 'completed' }], calendars: [], failedCalendars: 0 });
        await el.fetchTasks();
        expect(el.visibleTasks).toEqual([]);
    });

    it('puts back only the refused row, and says so', async () => {
        const milk = task('milk');
        const eggs = task('eggs');
        const el = page([milk, eggs]);
        const toasts = record<CustomEvent>(window, 'show-toast');
        vi.spyOn(tasksService, 'completeTask').mockImplementation(async () => {
            // Another row changes while the tick is in flight.
            el.tasks = el.tasks.map((t: TaskData) => (t.path === eggs.path ? { ...t, title: 'free-range eggs' } : t));
            throw new HttpStatusError(502, 'Bad Gateway');
        });

        await el.handleToggleComplete(milk, true);

        expect(el.tasks.map((t: TaskData) => [t.title, t.status])).toEqual([['milk', 'needs-action'], ['free-range eggs', 'needs-action']]);
        expect(toasts.map(e => e.detail.message)).toEqual(['tasks.completeFailed']);
    });

    it('says when a repeating task moved to its next occurrence instead of finishing', async () => {
        const water = task('water', { ...allDay('2026-09-14'), rrule: 'FREQ=WEEKLY' });
        const el = page([water]);
        const toasts = record<CustomEvent>(window, 'show-toast');
        vi.spyOn(tasksService, 'completeTask').mockResolvedValue({ ...water, ...allDay('2026-09-21') });

        await el.handleToggleComplete(water, true);

        expect(el.tasks[0]).toMatchObject({ due: '2026-09-21T00:00:00Z', status: 'needs-action' });
        expect(toasts.map(e => e.detail.message)).toEqual([expect.stringMatching(/^tasks\.movedToNext \{"date":/)]);
    });

    it('drops a read that a tick overtook, and reads again', async () => {
        const milk = task('milk');
        const el = page([milk]);
        let first!: (listing: unknown) => void;
        const fetch = vi.spyOn(tasksService, 'fetchTasks')
            .mockImplementationOnce(() => new Promise(resolve => { first = resolve; }) as never)
            .mockResolvedValue({ tasks: [{ ...milk, status: 'completed' }], calendars: [], failedCalendars: 0 });
        vi.spyOn(tasksService, 'completeTask').mockResolvedValue({ ...milk, status: 'completed' });

        const reading = el.fetchTasks();
        await el.handleToggleComplete(milk, true);
        first({ tasks: [milk], calendars: [], failedCalendars: 0 });
        await reading;

        await vi.waitFor(() => expect(el.loading).toBe(false));
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(el.tasks[0].status).toBe('completed');
    });

    it('says when some lists could not be read', async () => {
        const el = page([]);
        const toasts = record<CustomEvent>(window, 'show-toast');
        vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 1 });
        await el.fetchTasks();
        expect(toasts.map(e => e.detail.message)).toEqual(['tasks.someListsFailed']);
    });

    it('loads finished work only for Completed, and both halves for a search', () => {
        const el = page([]);
        const read = (hash: string) => {
            window.location.hash = hash;
            return el.parseHash();
        };
        expect(read('#/tasks/today')).toBe(false);
        expect(read('#/tasks/completed')).toBe(true);
        expect(el.wantedScope).toBe('closed');
        expect(read('#/tasks/today?q=milk')).toBe(true);
        expect([el.wantedScope, el.selectedList, el.searchQuery]).toEqual(['all', 'today', 'milk']);
    });

    it('sends an address naming no list to All, keeping its filter', () => {
        const el = page([]);
        window.location.hash = '#/tasks?list=%2Fcal%2Fwork%2F';
        el.parseHash();
        expect(window.location.hash).toBe('#/tasks/all?list=%2Fcal%2Fwork%2F');
    });

    it('narrows to one list, and searches titles and notes', () => {
        const report = task('report', { calendarPath: '/cal/home/', path: '/cal/home/report.ics', description: 'Figures from finance' });
        const el = page([task('milk'), report]);
        el.selectedCalendar = '/cal/home/';
        expect(el.visibleTasks.map((t: TaskData) => t.title)).toEqual(['report']);
        el.selectedCalendar = '';
        el.searchQuery = 'FINANCE';
        expect(el.visibleTasks.map((t: TaskData) => t.title)).toEqual(['report']);
    });

    it('moves the view to a new task it would hide, and leaves an edited one where it was', () => {
        const el = page([], { selectedList: 'today' });
        el.handleSaved(new CustomEvent('saved', { detail: { task: task('whenever'), created: true } }));
        expect(window.location.hash).toBe('#/tasks/all');
        expect(el.tasks.map((t: TaskData) => t.title)).toEqual(['whenever']);

        const milk = task('milk');
        const other = page([milk], { selectedList: 'undated' });
        other.handleSaved(new CustomEvent('saved', { detail: { task: { ...milk, ...allDay('2026-09-20') }, created: false } }));
        expect(other.visibleTasks.map((t: TaskData) => t.due)).toEqual(['2026-09-20T00:00:00Z']);
    });

    it('counts only the lists whose tasks are loaded', () => {
        const el = page([task('milk'), task('done', { status: 'completed' })]);
        expect(el.countFor('undated')).toBe(1);
        expect(el.countFor('completed')).toBeNull();
    });
});

describe('the calendar page', () => {
    it('leaves out calendars that take only tasks', async () => {
        vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({
            calendars: [
                { name: 'Work', description: '', path: '/cal/work/', components: ['VEVENT', 'VTODO'] },
                { name: 'Reminders', description: '', path: '/cal/reminders/', components: ['VTODO'] },
                { name: 'Unstated', description: '', path: '/cal/unstated/' },
            ],
        });
        vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
        vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
        const el = await mount<El>('calendar-page');
        await vi.waitFor(() => expect(el.calendars.map((c: { name: string }) => c.name)).toEqual(['Work', 'Unstated']));
    });
});
