/**
 * The event editor's calendar picker, and its start and end.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-event-modal';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { cleanup, mount, record, shadow, shadowAll } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
});

describe('the event editor', () => {
    it('creates an event in the calendar picked for it', async () => {
        const create = vi.spyOn(calendarService, 'createEvent').mockResolvedValue({ ok: 'true', path: '/cal/home/dentist.ics' });
        const el = await mount<El>('calendar-event-modal', {
            i18nStore: { t: (key: string) => key },
            calendars: [
                { name: 'Work', description: '', path: '/cal/work/' },
                { name: 'Home', description: '', path: '/cal/home/' },
            ],
            initialDate: new Date(2026, 8, 14, 10, 0),
            open: true,
        });
        const picker = shadow<El>(el, 'alps-select');
        await picker.updateComplete;
        const select = picker.shadowRoot!.querySelector('select')!;

        expect(select.disabled).toBe(false);
        select.value = '/cal/home/';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        el.summary = 'Dentist';
        await el.handleSave();

        expect(create).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Dentist', calendarPath: '/cal/home/' }));
    });

    it('shows an existing event\'s calendar, and does not offer another', async () => {
        // The server keeps an event in its calendar when it is updated. The
        // picker could be changed all the same, and the save then ignored
        // the calendar picked and said nothing.
        const el = await mount<El>('calendar-event-modal', {
            i18nStore: { t: (key: string) => key },
            calendars: [
                { name: 'Work', description: '', path: '/cal/work/' },
                { name: 'Home', description: '', path: '/cal/home/' },
            ],
            event: {
                uid: 'review', summary: 'Review', start: '2026-09-16T08:00:00Z', end: '2026-09-16T09:00:00Z',
                path: '/cal/home/review.ics', calendarPath: '/cal/home/', etag: 'v1',
            },
            open: true,
        });
        const picker = shadow<El>(el, 'alps-select');
        await picker.updateComplete;
        const select = picker.shadowRoot!.querySelector('select')!;

        expect(select.value).toBe('/cal/home/');
        expect(select.disabled).toBe(true);
    });

    /** Types into one of the form's date or time fields, as the user does. */
    async function type(el: El, row: 'start' | 'end', kind: 'date' | 'time', value: string) {
        const fields = shadowAll(el, '.form-row')[row === 'start' ? 0 : 1];
        const input = fields.querySelector<El>(`alps-input[type="${kind}"]`)!;
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await el.updateComplete;
    }

    it('takes the end along when the start moves past it', async () => {
        const el = await mount<El>('calendar-event-modal', {
            i18nStore: { t: (key: string) => key },
            initialDate: new Date(2026, 8, 14, 10, 0),
            open: true,
        });
        expect([el.startDate, el.startTime, el.endDate, el.endTime]).toEqual(['2026-09-14', '10:00', '2026-09-14', '11:00']);

        await type(el, 'start', 'time', '12:30');
        expect([el.endDate, el.endTime]).toEqual(['2026-09-14', '12:30']);

        await type(el, 'start', 'date', '2026-09-20');
        expect([el.endDate, el.endTime]).toEqual(['2026-09-20', '12:30']);

        // A start moved earlier leaves the end where it was.
        await type(el, 'start', 'date', '2026-09-18');
        expect(el.endDate).toBe('2026-09-20');
    });

    it('refuses to save an event that ends before it starts, and says so', async () => {
        const create = vi.spyOn(calendarService, 'createEvent').mockResolvedValue({ ok: 'true', path: '/cal/work/x.ics' });
        const toasts = record<CustomEvent>(window, 'show-toast');
        const el = await mount<El>('calendar-event-modal', {
            i18nStore: { t: (key: string) => key },
            initialDate: new Date(2026, 8, 14, 10, 0),
            open: true,
        });
        el.summary = 'Review';
        await type(el, 'end', 'time', '09:00');
        await el.handleSave();

        el.isAllDay = true;
        await type(el, 'end', 'date', '2026-09-13');
        await el.handleSave();

        expect(create).not.toHaveBeenCalled();
        expect(toasts.map(t => t.detail.message)).toEqual(['calendar.endBeforeStart', 'calendar.endBeforeStart']);
        expect(el.open).toBe(true);
    });

    it('opens an all-day event written with no length as its one day', async () => {
        const el = await mount<El>('calendar-event-modal', {
            i18nStore: { t: (key: string) => key },
            event: { uid: 'u', summary: 'Holiday', start: '2026-09-14T00:00:00Z', end: '2026-09-14T00:00:00Z', allDay: true, path: '/cal/work/u.ics', calendarPath: '/cal/work/' },
            open: true,
        });
        expect([el.startDate, el.endDate]).toEqual(['2026-09-14', '2026-09-14']);
    });
});
