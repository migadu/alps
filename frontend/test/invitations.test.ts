/**
 * Invitations: the reader's banner, and answering from the calendar.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/index';
import '../../plugins/caldav/frontend/calendar-invitation-banner';
import '../../plugins/caldav/frontend/calendar-event-preview';
import '../../plugins/caldav/frontend/calendar-page';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { registry } from '../src/plugin-registry';
import { hasCalendarPart, invitationService, type InvitationView } from '../../plugins/caldav/frontend/invitation-service';
import { HttpStatusError } from '../src/utils/fetch-utils';
import { cleanup, click, flush, mount, record, shadow, shadowAll, text, waitFor } from './helpers/dom';

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

const calendarPart = { Type: 'text', Subtype: 'calendar', Params: { method: 'REQUEST' } };
const textPart = { Type: 'text', Subtype: 'plain' };

function view(overrides: Partial<InvitationView> = {}): InvitationView {
    return {
        method: 'request',
        kind: 'event',
        uid: 'review@example.org',
        summary: 'Compiler review',
        start: '2026-09-16T08:00:00Z',
        end: '2026-09-16T09:00:00Z',
        allDay: false,
        organizer: { email: 'grace@example.org', name: 'Grace Hopper' },
        attendees: [{ email: 'ada@example.com', status: 'needs-action' }],
        me: 'ada@example.com',
        status: 'needs-action',
        state: 'answer',
        autoApply: false,
        sender: 'grace@example.org',
        senderVerified: true,
        ended: false,
        scheduling: 'email',
        clashes: [],
        calendars: [{ name: 'Work', path: '/cal/work/' }, { name: 'Home', path: '/cal/home/' }],
        ...overrides,
    };
}

async function banner(props: Record<string, unknown> = {}) {
    const el = await mount<El>('calendar-invitation-banner', { i18nStore, mailbox: 'INBOX', uid: '42', ...props });
    await waitFor(() => !!el.shadowRoot?.querySelector('.card'), 'the banner to render');
    return el;
}

describe('hasCalendarPart', () => {
    it('finds a calendar part however deep, or an .ics attachment', () => {
        expect(hasCalendarPart({ Children: [textPart, { Children: [textPart, calendarPart] }] })).toBe(true);
        expect(hasCalendarPart({ Children: [textPart, { Type: 'application', Subtype: 'octet-stream', Extended: { Disposition: { Params: { filename: 'Invite.ICS' } } } }] })).toBe(true);
        expect(hasCalendarPart({ Type: 'application', Subtype: 'ics' })).toBe(true);
        expect(hasCalendarPart({ Children: [textPart, { Type: 'text', Subtype: 'html' }] })).toBe(false);
        expect(hasCalendarPart(undefined)).toBe(false);
    });
});

describe('the invitation service', () => {
    it('reads no invitation as null, and a failure as an error', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response('', { status: 404 }))
            .mockResolvedValueOnce(new Response('', { status: 403 }));
        await expect(invitationService.fetchInvitation('INBOX', '42')).resolves.toBeNull();
        await expect(invitationService.fetchInvitation('INBOX', '42')).rejects.toMatchObject({ status: 403 });
        expect(String(fetchMock.mock.calls[0][0])).toBe('/calendar/invitation?mailbox=INBOX&uid=42');
    });
});

describe('the reader hook', () => {
    it('puts a banner above a message with a calendar part, and none above one without', async () => {
        const withInvite: any = { content: '', message: { UID: 42, BodyStructure: { Children: [textPart, calendarPart] } }, mailbox: 'INBOX', banners: [] };
        await registry.invokeHookAsync('reader:content', withInvite);
        expect(withInvite.banners).toHaveLength(1);
        expect(withInvite.banners[0].strings.join('')).toContain('calendar-invitation-banner');
        expect(withInvite.banners[0].values).toEqual(['INBOX', '42']);

        const plain: any = { content: '', message: { UID: 43, BodyStructure: textPart }, mailbox: 'INBOX', banners: [] };
        await registry.invokeHookAsync('reader:content', plain);
        expect(plain.banners).toHaveLength(0);
    });
});

describe('the invitation banner', () => {
    it('answers into the calendar picked, in the reader\'s language, and says the organizer was told', async () => {
        const fetch = vi.spyOn(invitationService, 'fetchInvitation')
            .mockResolvedValueOnce(view())
            .mockResolvedValue(view({ status: 'accepted', copy: { path: '/cal/home/x.ics', calendarPath: '/cal/home/' } }));
        const respond = vi.spyOn(invitationService, 'respond').mockResolvedValue({ sent: true, path: '/cal/home/x.ics' });
        const el = await banner();

        expect(text(el)).toContain('Compiler review');
        expect(text(el)).toContain('invitations.organizer: Grace Hopper');
        expect(text(el)).toContain('invitations.noConflicts');
        expect(shadowAll(el, '.sender')).toHaveLength(0);

        const picker = shadow<El>(el, 'alps-select');
        await picker.updateComplete;
        const select = picker.shadowRoot!.querySelector('select')!;
        select.value = '/cal/home/';
        select.dispatchEvent(new Event('change', { bubbles: true }));

        await click(shadow(el, '.answer-accepted'));
        await waitFor(() => fetch.mock.calls.length === 2, 'the banner to read the invitation again');
        await el.updateComplete;

        expect(respond).toHaveBeenCalledWith({ mailbox: 'INBOX', uid: '42', status: 'accepted', calendarPath: '/cal/home/', lang: 'de' });
        expect(text(el, '.notice')).toBe('invitations.sent');
        expect(shadow(el, '.answer-accepted').getAttribute('aria-pressed')).toBe('true');
        expect(text(el)).toContain('invitations.yourAnswer: invitations.statuses.accepted');
        // Answered, there is a copy: no picker.
        expect(shadowAll(el, 'alps-select')).toHaveLength(0);
    });

    it('lets the server keep an answered invitation where it is', async () => {
        vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(view({ status: 'accepted', copy: { path: '/cal/work/x.ics', calendarPath: '/cal/work/' } }));
        const respond = vi.spyOn(invitationService, 'respond').mockResolvedValue({ sent: true });
        const el = await banner();
        await click(shadow(el, '.answer-declined'));
        expect(respond).toHaveBeenCalledWith(expect.objectContaining({ status: 'declined', calendarPath: undefined }));
    });

    it('says when the answer was saved but could not be mailed', async () => {
        vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(view());
        vi.spyOn(invitationService, 'respond').mockResolvedValue({ sent: false, sendFailed: true });
        const el = await banner();
        await click(shadow(el, '.answer-declined'));
        await waitFor(() => text(el, '.notice') !== '', 'a notice');
        expect(text(el, '.notice')).toBe('invitations.sendFailed');
        expect(shadow(el, '.notice').classList.contains('error')).toBe(true);
    });

    it('names what the invitation clashes with', async () => {
        vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(view({ clashes: [{ summary: 'Dentist', allDay: false }, { summary: '', allDay: false }] }));
        const el = await banner();
        expect(text(el, '.clashes')).toBe('invitations.conflictsWith {"names":"Dentist, calendar.noTitle"}');
    });

    it('stops naming clashes once the invitation is declined', async () => {
        vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(view({ status: 'declined', clashes: [{ summary: 'Dentist', allDay: false }] }));
        const el = await banner();
        expect(shadowAll(el, '.clashes')).toHaveLength(0);
    });

    it('applies a cancellation from the organizer as it opens, once', async () => {
        const fetch = vi.spyOn(invitationService, 'fetchInvitation')
            .mockResolvedValueOnce(view({ method: 'cancel', state: 'cancel', autoApply: true, copy: { path: '/cal/work/x.ics', calendarPath: '/cal/work/' } }))
            .mockResolvedValue(view({ method: 'cancel', state: 'cancelled', autoApply: false }));
        const apply = vi.spyOn(invitationService, 'apply').mockResolvedValue({ sent: false, removed: true });
        const el = await banner();
        await waitFor(() => fetch.mock.calls.length === 2, 'the read after applying');
        await el.updateComplete;

        expect(apply).toHaveBeenCalledTimes(1);
        expect(text(el, '.notice')).toBe('invitations.removed');
        expect(text(el, '.state')).toBe('invitations.states.cancelled');
        expect(shadow(el, '.title').classList.contains('struck')).toBe(true);
        expect(shadowAll(el, 'alps-button')).toHaveLength(0);
    });

    it('does not retry an automatic apply that failed', async () => {
        const pending = view({ state: 'update', autoApply: true, copy: { path: '/cal/work/x.ics', calendarPath: '/cal/work/' } });
        const fetch = vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(pending);
        const apply = vi.spyOn(invitationService, 'apply').mockRejectedValue(new HttpStatusError(412, 'changed'));
        const el = await banner();
        await waitFor(() => fetch.mock.calls.length === 2, 'the read after the failure');
        await flush();
        expect(apply).toHaveBeenCalledTimes(1);
        expect(text(el, '.notice')).toBe('invitations.changedElsewhere');
    });

    it('leaves an update from someone other than the organizer for the user to apply', async () => {
        vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(view({
            state: 'update', autoApply: false, senderVerified: false, sender: 'mallory@example.net',
            copy: { path: '/cal/work/x.ics', calendarPath: '/cal/work/' },
        }));
        const apply = vi.spyOn(invitationService, 'apply').mockResolvedValue({ sent: false });
        const el = await banner();
        await flush();
        expect(apply).not.toHaveBeenCalled();
        expect(text(el, '.sender')).toBe('invitations.unverified {"sender":"mallory@example.net"}');
        expect(text(el, '.eyebrow')).toBe('invitations.kinds.updated');

        await click(shadow(el, '.apply'));
        expect(apply).toHaveBeenCalledWith({ mailbox: 'INBOX', uid: '42', calendarPath: '/cal/work/' });
    });

    it('shows an invitation to an event that is over as over, with nothing to do', async () => {
        const apply = vi.spyOn(invitationService, 'apply').mockResolvedValue({ sent: false });
        vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(view({
            ended: true, state: 'update', status: 'accepted', senderVerified: false, sender: 'mallory@example.net',
            clashes: [{ summary: 'Dentist', allDay: false }], copy: { path: '/cal/work/x.ics', calendarPath: '/cal/work/' },
        }));
        const el = await banner();
        expect(text(el, '.state')).toBe('invitations.states.ended');
        expect(text(el, '.answer')).toBe('invitations.yourAnswer: invitations.statuses.accepted');
        expect(shadowAll(el, 'alps-button')).toHaveLength(0);
        expect(shadowAll(el, '.clashes')).toHaveLength(0);
        expect(shadowAll(el, '.sender')).toHaveLength(0);
        expect(apply).not.toHaveBeenCalled();
    });

    it('offers no answers for a meeting the user organizes', async () => {
        vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(view({ state: 'organizer', me: undefined }));
        const el = await banner();
        expect(shadowAll(el, 'alps-button')).toHaveLength(0);
        expect(text(el, '.state')).toBe('invitations.states.organizer');
    });

    it('says who answered a meeting of the user\'s', async () => {
        vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(view({
            method: 'reply', state: 'replied', replier: { email: 'grace@example.org', name: 'Grace Hopper', status: 'tentative' },
        }));
        const el = await banner();
        expect(text(el, '.replier')).toBe('invitations.answered.tentative {"name":"Grace Hopper"}');
        expect(text(el, '.eyebrow')).toBe('invitations.kinds.reply');
    });

    it('drops the answer for a message it has moved on from', async () => {
        let resolveFirst!: (v: InvitationView) => void;
        vi.spyOn(invitationService, 'fetchInvitation').mockImplementation((_mailbox, uid) =>
            uid === '1' ? new Promise(resolve => { resolveFirst = resolve; }) : Promise.resolve(view({ summary: 'Second' })));
        const el = await mount<El>('calendar-invitation-banner', { i18nStore, mailbox: 'INBOX', uid: '1' });
        el.uid = '2';
        await waitFor(() => text(el, '.title') === 'Second', 'the second message');
        resolveFirst(view({ summary: 'First' }));
        await flush();
        await el.updateComplete;
        expect(text(el, '.title')).toBe('Second');
    });

    it('shows nothing for a message the server finds no invitation in', async () => {
        vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(null);
        const el = await mount<El>('calendar-invitation-banner', { i18nStore, mailbox: 'INBOX', uid: '42' });
        await flush();
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector('.card')).toBeNull();
    });
});

describe('the event preview', () => {
    const meeting = {
        uid: 'review', summary: 'Compiler review', start: '2026-09-16T08:00:00Z', end: '2026-09-16T09:00:00Z',
        path: '/cal/work/review.ics', calendarPath: '/cal/work/',
        organizer: { email: 'grace@example.org', name: 'Grace Hopper' },
        attendees: [{ email: 'grace@example.org', name: 'Grace Hopper', status: 'accepted' }, { email: 'ada@example.com', status: 'tentative' }],
    };

    it('lists who a meeting involves, and offers an attendee the answers', async () => {
        const el = await mount<El>('calendar-event-preview', { i18nStore, event: { ...meeting, role: 'attendee', status: 'tentative' } });
        expect(text(el, '.meeting')).toContain('Grace Hopper');
        const rows = shadowAll(el, '.people li').map(li => Array.from(li.querySelectorAll('span')).map(span => span.textContent));
        expect(rows).toEqual([['Grace Hopper', 'invitations.statuses.accepted'], ['ada@example.com', 'invitations.statuses.tentative']]);
        expect(shadow(el, '.answer-tentative').getAttribute('aria-pressed')).toBe('true');

        const responses = record<CustomEvent>(el, 'respond-event');
        shadow(el, '.answer-accepted').click();
        await waitFor(() => responses.length === 1, 'the answer event');
        expect(responses[0].detail).toEqual({ event: expect.objectContaining({ path: '/cal/work/review.ics' }), status: 'accepted' });
    });

    it('offers no answers once the event is over, nor from an occurrence already past', async () => {
        const over = await mount<El>('calendar-event-preview', { i18nStore, event: { ...meeting, role: 'attendee', status: 'accepted', ended: true } });
        expect(shadowAll(over, '.answers')).toHaveLength(0);
        expect(text(over, '.answer-status')).toBe('invitations.statuses.accepted');

        const lastWeek = await mount<El>('calendar-event-preview', { i18nStore, event: { ...meeting, role: 'attendee', status: 'accepted', start: '2026-09-07T08:00:00Z', end: '2026-09-07T09:00:00Z' } });
        expect(shadowAll(lastWeek, '.answers')).toHaveLength(0);
    });

    it('offers the organizer no answers, and an event of one\'s own no meeting', async () => {
        const organized = await mount<El>('calendar-event-preview', { i18nStore, event: { ...meeting, role: 'organizer' } });
        expect(shadowAll(organized, '.answers')).toHaveLength(0);
        const own = await mount<El>('calendar-event-preview', { i18nStore, event: { ...meeting, organizer: undefined, attendees: undefined } });
        expect(shadowAll(own, '.meeting')).toHaveLength(0);
    });
});

describe('answering from the calendar page', () => {
    const event = { uid: 'review', summary: 'Review', start: '2026-09-16T08:00:00Z', end: '2026-09-16T09:00:00Z', path: '/cal/work/review.ics', calendarPath: '/cal/work/', etag: 'v1', role: 'attendee' as const };

    function page() {
        const Page = customElements.get('calendar-page')!;
        const el = new Page() as El;
        el.i18nStore = i18nStore;
        el.fetchData = vi.fn().mockResolvedValue(undefined);
        return el;
    }

    it('answers in the reader\'s language, reloads, and says when the organizer could not be told', async () => {
        const respond = vi.spyOn(calendarService, 'respondToEvent').mockResolvedValue({ sent: false, sendFailed: true });
        const toasts = record<CustomEvent>(window, 'show-toast');
        const el = page();
        await el.respondToEvent(event, 'accepted');
        expect(respond).toHaveBeenCalledWith(event, 'accepted', 'de');
        expect(el.fetchData).toHaveBeenCalled();
        expect(toasts.map(t => t.detail.message)).toEqual(['invitations.sendFailed']);
    });

    it('says an answer refused as out of date was made elsewhere, and reloads', async () => {
        vi.spyOn(calendarService, 'respondToEvent').mockRejectedValue(new HttpStatusError(412, 'changed'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const toasts = record<CustomEvent>(window, 'show-toast');
        const el = page();
        await el.respondToEvent(event, 'declined');
        expect(toasts.map(t => t.detail.message)).toEqual(['invitations.changedElsewhere']);
        expect(el.fetchData).toHaveBeenCalled();
    });
});
