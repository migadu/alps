/**
 * The event editor's calendar picker.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-event-modal';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { cleanup, mount, shadow } from './helpers/dom';

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

        select.value = '/cal/home/';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        el.summary = 'Dentist';
        await el.handleSave();

        expect(create).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Dentist', calendarPath: '/cal/home/' }));
    });
});
