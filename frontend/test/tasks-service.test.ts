/**
 * How tasks are grouped, ordered and put in the sidebar's lists, and what the
 * service sends.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    compareClosed,
    compareTasks,
    dueOf,
    groupOf,
    inSmartList,
    inputOf,
    scopeOf,
    tasksService,
    type TaskData,
} from '../../plugins/caldav/frontend/tasks-service';
import { encodePathParam, isVersionConflict } from '../src/utils/fetch-utils';

const task = (title: string, fields: Partial<TaskData> = {}): TaskData => ({
    uid: title, title, allDay: false, status: 'needs-action', path: `/cal/work/${title}.ics`, calendarPath: '/cal/work/', ...fields,
});
const allDay = (date: string) => ({ due: `${date}T00:00:00Z`, allDay: true });
const at = (y: number, m: number, d: number, h = 0, min = 0) => ({ due: new Date(y, m - 1, d, h, min).toISOString(), allDay: false });

// Monday 14 September 2026, 17:00 on this machine's clock.
const now = new Date(2026, 8, 14, 17, 0);

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('when a task is due', () => {
    it('reads an all-day date as that date here, not as an instant at UTC midnight', () => {
        const due = dueOf(allDay('2026-09-15'))!;
        expect([due.getFullYear(), due.getMonth() + 1, due.getDate(), due.getHours()]).toEqual([2026, 9, 15, 0]);
    });

    it('reads a timed due as the instant it is', () => {
        expect(dueOf(at(2026, 9, 15, 9, 30))!.getTime()).toBe(new Date(2026, 8, 15, 9, 30).getTime());
    });

    it('has none for an undated task or an unreadable date', () => {
        expect(dueOf({ allDay: false })).toBeNull();
        expect(dueOf({ due: 'soon', allDay: false })).toBeNull();
    });
});

describe('grouping', () => {
    const group = (fields: Partial<TaskData>) => groupOf(task('t', fields), now);

    it('is overdue only once a day has gone by', () => {
        expect(group(allDay('2026-09-13'))).toBe('overdue');
        expect(group(at(2026, 9, 13, 23, 59))).toBe('overdue');
        expect(group(at(2026, 9, 14, 9))).toBe('today');
        expect(group(allDay('2026-09-14'))).toBe('today');
    });

    it('counts seven days from today for this week', () => {
        expect(group(allDay('2026-09-15'))).toBe('week');
        expect(group(at(2026, 9, 20, 23, 59))).toBe('week');
        expect(group(allDay('2026-09-21'))).toBe('later');
    });

    it('puts undated work in its own group, and finished work in one whatever its date', () => {
        expect(group({})).toBe('undated');
        expect(group({ ...allDay('2026-09-01'), status: 'completed' })).toBe('completed');
        expect(group({ status: 'cancelled' })).toBe('completed');
        expect(group({ ...allDay('2026-09-01'), status: 'in-process' })).toBe('overdue');
    });
});

describe('ordering', () => {
    it('puts the soonest due first, undated last, then priority 1 before 9 before none, then title', () => {
        const tasks = [
            task('undated'),
            task('b-none', allDay('2026-09-15')),
            task('low', { ...allDay('2026-09-15'), priority: 9 }),
            task('a-none', allDay('2026-09-15')),
            task('high', { ...allDay('2026-09-15'), priority: 1 }),
            task('soonest', allDay('2026-09-14')),
        ];
        expect(tasks.sort(compareTasks).map(t => t.title)).toEqual(['soonest', 'high', 'low', 'a-none', 'b-none', 'undated']);
    });

    it('puts finished work most recently due first, with undated last and titles A to Z', () => {
        const tasks = [task('z-undated'), task('a-undated'), task('older', allDay('2026-09-01')), task('newer', allDay('2026-09-10'))];
        expect(tasks.sort(compareClosed).map(t => t.title)).toEqual(['newer', 'older', 'a-undated', 'z-undated']);
    });
});

describe('the sidebar lists', () => {
    const tasks = [
        task('late', allDay('2026-09-10')),
        task('now', allDay('2026-09-14')),
        task('soon', allDay('2026-09-16')),
        task('someday', allDay('2026-12-01')),
        task('whenever'),
        task('done', { ...allDay('2026-09-14'), status: 'completed' }),
        task('dropped', { status: 'cancelled' }),
    ];
    const shown = (list: Parameters<typeof inSmartList>[1]) => tasks.filter(t => inSmartList(t, list, now)).map(t => t.title);

    it('divides open work by when it is due, and keeps finished work out of every list but Completed', () => {
        expect(shown('all')).toEqual(['late', 'now', 'soon', 'someday', 'whenever']);
        expect(shown('today')).toEqual(['late', 'now']);
        expect(shown('upcoming')).toEqual(['soon', 'someday']);
        expect(shown('undated')).toEqual(['whenever']);
        expect(shown('completed')).toEqual(['done', 'dropped']);
    });

    it('loads only the half of the tasks a list shows', () => {
        expect(scopeOf('completed')).toBe('closed');
        expect(scopeOf('today')).toBe('active');
    });
});

describe('the tasks service', () => {
    const answer = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

    it('asks for one half, and reads a listing that has nothing in it', async () => {
        const fetch = answer({ tasks: null, calendars: null });
        vi.stubGlobal('fetch', fetch);
        await expect(tasksService.fetchTasks('closed')).resolves.toEqual({ tasks: [], calendars: [], failedCalendars: 0 });
        expect((fetch.mock.calls[0] as unknown[])[0]).toBe('/calendar/tasks?scope=closed');
    });

    it('sends an edit with the version it was opened at, and keeps a refusal recognisable', async () => {
        const fetch = answer({ error: 'changed elsewhere since it was opened' }, 412);
        vi.stubGlobal('fetch', fetch);
        const opened = task('report', { ...allDay('2026-09-15'), priority: 1, etag: 'v3' });

        const error = await tasksService.updateTask(opened.path, inputOf(opened)).catch(e => e);

        const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe(`/calendar/tasks/${encodePathParam(opened.path)}/edit`);
        expect(JSON.parse(init.body as string)).toEqual({
            title: 'report', description: '', due: '2026-09-15T00:00:00Z', allDay: true, status: 'needs-action',
            percentComplete: 0, priority: 1, rrule: '', calendarPath: '/cal/work/', etag: 'v3',
        });
        expect(isVersionConflict(error)).toBe(true);
    });

    it('ticks a task off with the tick alone', async () => {
        const fetch = answer(task('milk', { status: 'completed' }));
        vi.stubGlobal('fetch', fetch);
        const ticked = await tasksService.completeTask('/cal/work/milk.ics', true);
        const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe(`/calendar/tasks/${encodePathParam('/cal/work/milk.ics')}/complete`);
        expect(JSON.parse(init.body as string)).toEqual({ done: true });
        expect(ticked.status).toBe('completed');
    });
});
