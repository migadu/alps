/**
 * Meetings: guests in the event editor, and whether a change tells them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-event-modal';
import '../../plugins/caldav/frontend/calendar-page';
import { addressOfPerson, calendarService, personFromAddress, tellsSomeone } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, flush, mount, record, shadow, shadowAll, text, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = {
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    getLanguage: () => 'de',
    getIntlLanguage: () => 'de',
};

beforeEach(() => {
    // The meetings below are on 16 September 2026; today is the 14th.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-14T12:00:00Z'));
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanup();
});

const meeting = {
    uid: 'review', summary: 'Review', start: '2026-09-16T08:00:00Z', end: '2026-09-16T09:00:00Z',
    path: '/cal/work/review.ics', calendarPath: '/cal/work/', etag: 'v1',
    role: 'organizer' as const,
    organizer: { email: 'ada@example.com' },
    attendees: [{ email: 'grace@example.org', name: 'Grace Hopper', status: 'accepted' }],
};

describe('guest addresses', () => {
    it('reads the address field\'s spellings, and writes them back', () => {
        expect(personFromAddress('"Grace Hopper" <grace@example.org>')).toEqual({ email: 'grace@example.org', name: 'Grace Hopper' });
        expect(personFromAddress('Grace Hopper <grace@example.org>')).toEqual({ email: 'grace@example.org', name: 'Grace Hopper' });
        expect(personFromAddress(' <grace@example.org> ')).toEqual({ email: 'grace@example.org' });
        expect(personFromAddress('grace@example.org')).toEqual({ email: 'grace@example.org' });
        expect(personFromAddress('not an address')).toBeNull();
        expect(addressOfPerson({ email: 'grace@example.org', name: 'Grace "Amazing" Hopper' })).toBe('"Grace Amazing Hopper" <grace@example.org>');
        expect(addressOfPerson({ email: 'grace@example.org' })).toBe('grace@example.org');
    });

    it('asks before telling anyone only when alps would be the one to tell them', () => {
        expect(tellsSomeone(meeting, 'email')).toBe(true);
        expect(tellsSomeone({ ...meeting, ended: true }, 'email')).toBe(false);
        expect(tellsSomeone(meeting, 'server')).toBe(false);
        expect(tellsSomeone({ ...meeting, attendees: [] }, 'email')).toBe(false);
        expect(tellsSomeone({ role: 'attendee', status: 'accepted' }, 'email')).toBe(true);
        expect(tellsSomeone({ role: 'attendee', status: 'declined' }, 'email')).toBe(false);
        expect(tellsSomeone({ role: '' }, 'email')).toBe(false);
        expect(tellsSomeone(undefined, 'email')).toBe(false);
    });
});

async function editor(props: Record<string, unknown>) {
    const el = await mount<El>('calendar-event-modal', {
        i18nStore,
        calendars: [{ name: 'Work', description: '', path: '/cal/work/' }],
        open: true,
        ...props,
    });
    return el;
}

describe('removing an event', () => {
    it('asks the server to tell nobody only when told to, in the language given', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{"ok":"true"}', { status: 200 }));
        await calendarService.deleteEvent('/cal/work/review.ics', { notify: false, lang: 'de' });
        await calendarService.deleteEvent('/cal/work/review.ics', { notify: true });
        await calendarService.deleteEvent('/cal/work/review.ics');
        const urls = fetchMock.mock.calls.map(call => String(call[0]));
        expect(urls[0]).toMatch(/\/calendar\/events\/[^?]+\?notify=0&lang=de$/);
        expect(urls[1]).not.toContain('?');
        expect(urls[2]).not.toContain('?');
    });
});

describe('the event editor\'s guests', () => {
    it('invites the guests of a new event without asking', async () => {
        const create = vi.spyOn(calendarService, 'createEvent').mockResolvedValue({ ok: 'true', path: '/cal/work/x.ics', sent: true });
        const el = await editor({ initialDate: new Date(2026, 8, 16, 10, 0) });
        el.summary = 'Review';
        el.attendees = ['"Grace Hopper" <grace@example.org>', 'charles@example.com'];
        await el.handleSave();
        expect(shadowAll(el, 'ui-confirm')).toHaveLength(0);
        expect(create).toHaveBeenCalledWith(expect.objectContaining({
            attendees: [{ email: 'grace@example.org', name: 'Grace Hopper' }, { email: 'charles@example.com' }],
            notify: undefined,
            lang: 'de',
        }));
    });

    it('opens a meeting with its guests in the address field', async () => {
        const el = await editor({ event: meeting });
        expect(el.attendees).toEqual(['"Grace Hopper" <grace@example.org>']);
        expect(shadow<El>(el, 'alps-address-input.guests').addresses).toEqual(['"Grace Hopper" <grace@example.org>']);
    });

    it('asks whether to send the guests a change, and does as told', async () => {
        const update = vi.spyOn(calendarService, 'updateEvent').mockResolvedValue({ ok: 'true', path: meeting.path });
        const el = await editor({ event: meeting, scheduling: 'email' });
        await el.handleSave();
        await el.updateComplete;
        expect(update).not.toHaveBeenCalled();
        const ask = shadow<El>(el, 'ui-confirm');
        expect(ask.getAttribute('secondaryText') ?? ask.secondaryText).toBe('invitations.dontSend');

        ask.dispatchEvent(new CustomEvent('secondary'));
        await waitFor(() => update.mock.calls.length === 1, 'the save');
        expect(update.mock.calls[0][1]).toEqual(expect.objectContaining({ notify: false, etag: 'v1' }));

        const again = await editor({ event: meeting, scheduling: 'email' });
        await again.handleSave();
        await again.updateComplete;
        shadow(again, 'ui-confirm').dispatchEvent(new CustomEvent('confirm'));
        await waitFor(() => update.mock.calls.length === 2, 'the second save');
        expect(update.mock.calls[1][1]).toEqual(expect.objectContaining({ notify: true }));
    });

    it('closes the question without saving when it is cancelled', async () => {
        const update = vi.spyOn(calendarService, 'updateEvent').mockResolvedValue({ ok: 'true', path: meeting.path });
        const el = await editor({ event: meeting, scheduling: 'email' });
        await el.handleSave();
        await el.updateComplete;
        shadow(el, 'ui-confirm').dispatchEvent(new CustomEvent('cancel'));
        await el.updateComplete;
        expect(shadowAll(el, 'ui-confirm')).toHaveLength(0);
        expect(update).not.toHaveBeenCalled();
    });

    it('tells nobody about a change to a meeting that is over, unless it is moved to come', async () => {
        const update = vi.spyOn(calendarService, 'updateEvent').mockResolvedValue({ ok: 'true', path: meeting.path });
        const over = { ...meeting, start: '2026-09-10T08:00:00Z', end: '2026-09-10T09:00:00Z', ended: true };
        const el = await editor({ event: over, scheduling: 'email' });
        await el.handleSave();
        expect(shadowAll(el, 'ui-confirm')).toHaveLength(0);
        expect(update).toHaveBeenCalledTimes(1);

        const moved = await editor({ event: over, scheduling: 'email' });
        moved.startDate = '2026-09-21';
        moved.endDate = '2026-09-21';
        await moved.handleSave();
        await moved.updateComplete;
        expect(shadowAll(moved, 'ui-confirm')).toHaveLength(1);
        expect(update).toHaveBeenCalledTimes(1);
    });

    it('does not ask when the calendar server tells the guests', async () => {
        const update = vi.spyOn(calendarService, 'updateEvent').mockResolvedValue({ ok: 'true', path: meeting.path });
        const el = await editor({ event: meeting, scheduling: 'server' });
        await el.handleSave();
        expect(shadowAll(el, 'ui-confirm')).toHaveLength(0);
        expect(update.mock.calls[0][1]).toEqual(expect.objectContaining({ notify: undefined }));
    });

    it('leaves someone else\'s meeting\'s guests alone, and says whose it is', async () => {
        const update = vi.spyOn(calendarService, 'updateEvent').mockResolvedValue({ ok: 'true', path: meeting.path });
        const invited = { ...meeting, role: 'attendee' as const, status: 'accepted', organizer: { email: 'grace@example.org', name: 'Grace Hopper' } };
        const el = await editor({ event: invited, scheduling: 'email' });
        expect(shadowAll(el, 'alps-address-input')).toHaveLength(0);
        expect(text(el, '.organized-by')).toBe('invitations.organizedBy {"name":"Grace Hopper"}');
        await el.handleSave();
        expect(shadowAll(el, 'ui-confirm')).toHaveLength(0);
        expect(update.mock.calls[0][1].attendees).toBeUndefined();
    });

    it('says when the change was saved but the guests could not be told', async () => {
        vi.spyOn(calendarService, 'createEvent').mockResolvedValue({ ok: 'true', path: '/cal/work/x.ics', sendFailed: true });
        const toasts = record<CustomEvent>(window, 'show-toast');
        const el = await editor({ initialDate: new Date(2026, 8, 16, 10, 0) });
        el.summary = 'Review';
        await el.handleSave();
        expect(toasts.map(t => t.detail.message)).toEqual(['invitations.notTold']);
    });
});

describe('deleting a meeting', () => {
    async function page(scheduling: 'email' | 'server') {
        vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [{ name: 'Work', description: '', path: '/cal/work/' }], scheduling });
        vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
        vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 } as any);
        const el = await mount<El>('calendar-page', { i18nStore });
        await waitFor(() => el.scheduling === scheduling, 'the calendars to load');
        return el;
    }

    it('offers to delete without telling the guests, and says which it did', async () => {
        const remove = vi.spyOn(calendarService, 'deleteEvent').mockResolvedValue({ ok: 'true', sent: true });
        const el = await page('email');
        el.eventToDelete = meeting;
        await el.updateComplete;
        const ask = shadow<El>(el, 'ui-confirm.delete-meeting');
        expect(ask.getAttribute('message')).toBe('invitations.deleteTellGuests');
        ask.dispatchEvent(new CustomEvent('secondary'));
        await waitFor(() => remove.mock.calls.length === 1, 'the delete');
        expect(remove).toHaveBeenCalledWith(meeting.path, { notify: false, lang: 'de' });

        el.eventToDelete = { ...meeting, role: 'attendee', status: 'tentative' };
        await el.updateComplete;
        const declining = shadow<El>(el, 'ui-confirm.delete-meeting');
        expect(declining.getAttribute('message')).toBe('invitations.deleteTellOrganizer');
        declining.dispatchEvent(new CustomEvent('confirm'));
        await waitFor(() => remove.mock.calls.length === 2, 'the second delete');
        expect(remove.mock.calls[1][1]).toEqual({ notify: true, lang: 'de' });
    });

    it('asks nothing about deleting a meeting that is over', async () => {
        vi.spyOn(calendarService, 'deleteEvent').mockResolvedValue({ ok: 'true' });
        const el = await page('email');
        el.eventToDelete = { ...meeting, ended: true };
        await el.updateComplete;
        expect(shadowAll(el, 'ui-confirm.delete-meeting')).toHaveLength(0);
        expect(shadowAll(el, 'ui-confirm')).toHaveLength(1);
    });

    it('asks nothing more when the server tells the guests, and reports a message that could not go', async () => {
        vi.spyOn(calendarService, 'deleteEvent').mockResolvedValue({ ok: 'true', sendFailed: true });
        const toasts = record<CustomEvent>(window, 'show-toast');
        const el = await page('server');
        el.eventToDelete = meeting;
        await el.updateComplete;
        expect(shadowAll(el, 'ui-confirm.delete-meeting')).toHaveLength(0);
        shadow(el, 'ui-confirm').dispatchEvent(new CustomEvent('confirm'));
        await waitFor(() => toasts.length > 0, 'the report');
        await flush();
        expect(toasts.map(t => t.detail.message)).toContain('invitations.notTold');
    });
});
