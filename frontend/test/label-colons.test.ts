/**
 * A label's colon is the translation's.
 *
 * Lines of the calendar plugin put the colon after a translated label in the
 * code: "Your answer: Accepted", "Organizer: Grace", "Due: …", "Assigned by:
 * …", "Assigned to: …", and a guest's answer after their name. French puts a
 * space before a colon, as its own labels do ("À :", "Date :"), so these
 * lines read "Votre réponse: Accepté" beside labels that have the space.
 *
 * The colon now comes from the dictionaries: a label only ever followed by
 * its value carries its own, and a line is a sentence with the value as a
 * placeholder. Here, in French, each of those lines has the space; and no
 * translated label in the sources is followed by a colon of the code's.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-invitation-banner';
import '../../plugins/caldav/frontend/task-modal';
import '../../plugins/caldav/frontend/tasks-list';
import { I18nStore } from '../src/store/i18n-store';
import { invitationService, type InvitationView } from '../../plugins/caldav/frontend/invitation-service';
import type { TaskData } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, mount, shadowAll, text, waitFor } from './helpers/dom';
import { readSources } from './helpers/sources';

type El = HTMLElement & Record<string, any>;

const i18nStore = new I18nStore();

beforeAll(async () => {
  await i18nStore.setLanguage('fr');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('in French, a label keeps the space before its colon', () => {
  const view = (overrides: Partial<InvitationView>): InvitationView => ({
    method: 'request', kind: 'event', uid: 'review@example.org', summary: 'Review',
    start: '2099-09-16T08:00:00Z', end: '2099-09-16T09:00:00Z', allDay: false,
    organizer: { email: 'grace@example.org', name: 'Grace' },
    attendees: [{ email: 'ada@example.com', status: 'accepted' }],
    me: 'ada@example.com', status: 'accepted', state: 'answer', autoApply: false,
    sender: 'grace@example.org', senderVerified: true, ended: false, scheduling: 'email',
    clashes: [], calendars: [{ name: 'Work', path: '/cal/work/' }],
    ...overrides,
  });

  async function banner(v: InvitationView) {
    vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(v);
    const el = await mount<HTMLElement>('calendar-invitation-banner', { i18nStore, mailbox: 'INBOX', uid: '42' });
    await waitFor(() => !!el.shadowRoot?.querySelector('.card'), 'the banner to render');
    return el;
  }

  it("in an invitation's answer and organizer", async () => {
    const open = await banner(view({}));
    expect(text(open, '.answer')).toBe('Votre réponse : Accepté');
    expect(text(open, '.organizer')).toBe('Organisateur : Grace');
    cleanup();

    const ended = await banner(view({ ended: true }));
    expect(text(ended, '.answer')).toBe('Votre réponse : Accepté');
  });

  it("in a task invitation's due date", async () => {
    const el = await banner(view({ kind: 'task', start: undefined, end: '2099-09-16', allDay: true }));
    expect(text(el, '.when')).toMatch(/^Échéance : \S/);
  });

  const task = (fields: Partial<TaskData>): TaskData => ({
    uid: 'report', title: 'Write the report', allDay: false, status: 'needs-action',
    path: '/cal/work/report.ics', calendarPath: '/cal/work/', etag: 'v1', ...fields,
  });
  const mine = task({
    role: 'organizer', organizer: { email: 'ada@example.com' },
    attendees: [{ email: 'grace@example.org', name: 'Grace Hopper', status: 'completed' }],
  });
  const theirs = task({
    uid: 'b', path: '/cal/work/b.ics', role: 'attendee', answer: 'accepted',
    organizer: { email: 'grace@example.org', name: 'Grace Hopper' }, attendees: [{ email: 'ada@example.com', status: 'accepted' }],
  });

  it('in the task list, by whom and to whom a task is assigned', async () => {
    const el = await mount<El>('tasks-list', { i18nStore, tasks: [mine, theirs], now: new Date(2026, 8, 14) });
    expect(shadowAll(el, '.assigned').map((e) => e.textContent?.trim())).toEqual([
      'Attribuée à : Grace Hopper',
      'Attribuée par : Grace Hopper',
    ]);
  });

  it("in the task editor, who assigned a task and the assignees' answers", async () => {
    const lists = [{ name: 'Work', description: '', path: '/cal/work/' }];
    const assigned = await mount<El>('task-modal', { i18nStore, lists, defaultList: '/cal/work/', open: true, task: theirs });
    expect(text(assigned, '.assigned')).toBe('Attribuée par : Grace Hopper');
    cleanup();

    const own = await mount<El>('task-modal', { i18nStore, lists, defaultList: '/cal/work/', open: true, task: mine });
    expect(text(own, '.answers')).toBe('Grace Hopper : Terminé');
  });
});

describe('the sources', () => {
  it('follow no translated label with a colon of their own', () => {
    const offenders = Object.entries(readSources())
      .filter(([path]) => !path.includes('/i18n/'))
      .flatMap(([path, source]) => source.split('\n').map((line, i) => [path, i + 1, line] as const))
      .filter(([, , line]) => /\bt\((['"`])[\w.]+\1\)\}:/.test(line))
      .map(([path, line]) => `${path}:${line}`);
    expect(offenders).toEqual([]);
  });
});
