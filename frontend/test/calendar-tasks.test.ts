/**
 * Tasks on the calendar: which tasks become chips and where, when they are
 * drawn, and what a chip does.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import '../../plugins/caldav/frontend/calendar-event-preview';
import '../../plugins/caldav/frontend/calendar-month-view';
import '../../plugins/caldav/frontend/calendar-time-grid';
import { calendarService, taskChips } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService, type TaskData } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, mount, record, shadow, shadowAll, text } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };

const task = (title: string, fields: Partial<TaskData> = {}): TaskData => ({
    uid: title, title, allDay: false, status: 'needs-action', path: `/cal/work/${title}.ics`, calendarPath: '/cal/work/', ...fields,
});

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.clear();
});

afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
    window.location.hash = '';
    localStorage.clear();
});

describe('task chips', () => {
    it('puts each open task that has a due date on that date, in the all-day row', () => {
        const chips = taskChips([
            task('rent', { due: '2026-10-31T00:00:00Z', allDay: true }),
            task('call', { due: new Date(2026, 8, 30, 23, 30).toISOString() }),
            task('whenever'),
            task('done', { due: '2026-10-01T00:00:00Z', allDay: true, status: 'completed' }),
            task('dropped', { due: '2026-10-01T00:00:00Z', allDay: true, status: 'cancelled' }),
        ]);
        expect(chips.map(chip => [chip.summary, chip.start, chip.end, chip.allDay, chip.task?.title])).toEqual([
            ['rent', '2026-10-31T00:00:00Z', '2026-11-01T00:00:00Z', true, 'rent'],
            ['call', '2026-09-30T00:00:00Z', '2026-10-01T00:00:00Z', true, 'call'],
        ]);
    });
});

describe('the calendar page', () => {
    const calendars = [
        { name: 'Work', description: '', path: '/cal/work/', components: ['VEVENT', 'VTODO'] },
        { name: 'Reminders', description: '', path: '/cal/reminders/', components: ['VTODO'] },
    ];
    const rent = task('rent', { due: '2026-09-15T00:00:00Z', allDay: true });
    const passport = task('passport', {
        due: '2026-09-16T00:00:00Z', allDay: true, calendarPath: '/cal/reminders/', path: '/cal/reminders/passport.ics',
    });

    async function calendarPage(tasks: TaskData[] = [rent, passport]) {
        vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars });
        const events = vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
        const fetchTasks = vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks, calendars: [], failedCalendars: 0 });
        window.location.hash = '#/calendar/month/2026-09';
        const el = await mount<El>('calendar-page', { i18nStore });
        await vi.waitFor(() => expect(el.loading).toBe(false));
        return { el, events, fetchTasks };
    }

    const shown = (el: El) => el.events.filter((event: any) => el.isShown(event)).map((event: any) => event.summary);

    it('draws the open tasks, and asks only for open ones', async () => {
        const { el, fetchTasks } = await calendarPage();
        expect(fetchTasks).toHaveBeenCalledWith('active');
        expect(shown(el)).toEqual(['rent', 'passport']);
    });

    it('hides a task with its calendar, while a task-only list follows the Tasks switch alone', async () => {
        const { el } = await calendarPage();
        el.toggleCalendar('/cal/work/');
        expect(shown(el)).toEqual(['passport']);
    });

    it('neither draws nor loads tasks once switched off, and remembers that', async () => {
        const { el, fetchTasks } = await calendarPage();
        fetchTasks.mockClear();

        shadow(el, '.tasks-toggle').click();
        // At once, not only when the calendar has been read again.
        expect(shown(el)).toEqual([]);
        await vi.waitFor(() => expect(el.loading).toBe(false));

        expect(shown(el)).toEqual([]);
        expect(fetchTasks).not.toHaveBeenCalled();
        expect(localStorage.getItem('alps.calendar.showTasks')).toBe('false');

        cleanup();
        const again = await calendarPage();
        expect(again.fetchTasks).not.toHaveBeenCalled();
    });

    it('keeps the events on screen when the tasks fail to load, and says it was the tasks', async () => {
        vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars });
        vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({
            events: [{ uid: 'standup', summary: 'Standup', start: '2026-09-14T09:00:00Z', end: '2026-09-14T10:00:00Z', path: '/cal/work/standup.ics', calendarPath: '/cal/work/' }],
        });
        vi.spyOn(tasksService, 'fetchTasks').mockRejectedValue(new Error('offline'));
        const toasts = record<CustomEvent>(window, 'show-toast');
        window.location.hash = '#/calendar/month/2026-09';

        const el = await mount<El>('calendar-page', { i18nStore });
        await vi.waitFor(() => expect(el.loading).toBe(false));

        expect(shown(el)).toEqual(['Standup']);
        expect(toasts.map(toast => toast.detail.message)).toEqual(['tasks.loadFailed']);
    });

    it('opens a chip in the task editor, and deletes it as a task', async () => {
        const { el } = await calendarPage();
        const chip = el.events.find((event: any) => event.task?.title === 'rent');

        el.openEditModal(chip);
        expect([el.taskModalOpen, el.editingTask, el.modalOpen]).toEqual([true, rent, false]);

        await el.updateComplete;
        shadow(el, 'task-modal').dispatchEvent(new CustomEvent('delete', { detail: { task: rent } }));
        expect([el.taskModalOpen, el.eventToDelete.task]).toEqual([false, rent]);

        const deleteTask = vi.spyOn(tasksService, 'deleteTask').mockResolvedValue();
        const deleteEvent = vi.spyOn(calendarService, 'deleteEvent');
        await el._executeDeleteEvent();
        expect(deleteTask).toHaveBeenCalledWith(rent.path, { notify: true, lang: 'en' });
        expect(deleteEvent).not.toHaveBeenCalled();
    });

    it('ticks off a task from its chip, then reads the calendar again', async () => {
        const { el, events } = await calendarPage();
        const complete = vi.spyOn(tasksService, 'completeTask').mockResolvedValue({ ...rent, status: 'completed' });
        const before = events.mock.calls.length;

        shadow(el, '.calendar-body').dispatchEvent(new CustomEvent('complete-task', { detail: { task: rent }, bubbles: true, composed: true }));

        await vi.waitFor(() => expect(events.mock.calls.length).toBe(before + 1));
        expect(complete).toHaveBeenCalledWith(rent.path, true, 'en');
    });
});

describe('a task chip', () => {
    const [chip] = taskChips([task('rent', { due: '2026-09-15T00:00:00Z', allDay: true, description: 'The standing order failed' })]);

    it('previews the task with a tick, an edit and a delete, and fires the tick', async () => {
        const el = await mount<El>('calendar-event-preview', { i18nStore, event: { ...chip, color: '#16a34a' } });
        expect(shadowAll(el, 'alps-icon-btn').map(button => button.getAttribute('title'))).toEqual(['tasks.markDone', 'tasks.editTask', 'tasks.deleteTask']);
        expect(text(el)).toContain('The standing order failed');

        const ticks = record<CustomEvent>(el, 'complete-task');
        shadow(el, '.complete-btn').click();
        await vi.waitFor(() => expect(ticks.map(e => e.detail.task.title)).toEqual(['rent']));
    });

    it('is drawn apart from an all-day event, in the month and in the day and week grids', async () => {
        const offsite = {
            uid: 'offsite', summary: 'Offsite', start: '2026-09-15T00:00:00Z', end: '2026-09-16T00:00:00Z', allDay: true,
            path: '/cal/work/offsite.ics', calendarPath: '/cal/work/', color: '#2563eb',
        };
        const events = [offsite, { ...chip, color: '#16a34a' }];
        const month = await mount<El>('calendar-month-view', { i18nStore, date: new Date(2026, 8, 1), events });
        const grid = await mount<El>('calendar-time-grid', { i18nStore, days: [new Date(2026, 8, 15)], events });

        for (const el of [month, grid]) {
            const chips = shadowAll(el, '.event-chip');
            const tasks = chips.filter(c => c.classList.contains('task'));
            expect(chips).toHaveLength(2);
            expect(tasks).toHaveLength(1);
            expect(tasks[0].querySelector('svg')).not.toBeNull();
            expect(tasks[0].getAttribute('style')).toBe('border-color: #16a34a');
        }
    });
});
