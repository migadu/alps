/**
 * Saves the server refuses because the event or contact was saved elsewhere
 * since it was opened here, and the versions that let it tell.
 *
 * The contacts page is driven through its handlers on an element that is never
 * connected, with the service stubbed; the event editor is mounted.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contacts-page';
import '../../plugins/caldav/frontend/calendar-event-modal';
import '../../plugins/caldav/frontend/calendar-page';
import '../../plugins/carddav/frontend/contact-view';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { CATEGORY_FAVORITES } from '../../plugins/carddav/frontend/constants';
import { HttpStatusError, isVersionConflict, encodePathParam } from '../src/utils/fetch-utils';
import { cleanup, mount, record } from './helpers/dom';

type Page = HTMLElement & Record<string, any>;

const refused = () => new HttpStatusError(412, 'Precondition Failed');
const grace = () => ({ path: '/book/grace.vcf', name: 'Grace', email: 'grace@example.test', categories: [] as string[], etag: 'v1' });
const saved = (etag: string, path = '/book/grace.vcf') => ({ ok: 'true', path, etag });

function contactsPage(open: any): Page {
  const el = document.createElement('contacts-page') as Page;
  el.contacts = [open];
  el.selectedContact = open;
  el.selectedContacts = new Set();
  el.isEditing = true;
  vi.spyOn(el, 'fetchContacts').mockResolvedValue(undefined as never);
  return el;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  cleanup();
});

describe('saving a contact', () => {
  it('sends the version the page holds, and moves it on with each save', async () => {
    const el = contactsPage(grace());
    const update = vi.spyOn(contactsService, 'updateContact')
      .mockResolvedValueOnce(saved('v2'))
      .mockResolvedValueOnce(saved('v3'));

    // The form's own copy still says v1, as it did when editing began.
    await el.handleSave({ path: '/book/grace.vcf', name: 'Grace H', etag: 'v1', categories: '' });
    await el.handleSave({ path: '/book/grace.vcf', name: 'Grace Hopper', etag: 'v1', categories: '' });

    expect(update.mock.calls.map(([, payload]) => payload.etag)).toEqual(['v1', 'v2']);
    expect(el.selectedContact.etag).toBe('v3');
    expect(el.contacts[0].etag).toBe('v3');
  });

  it('holds a save back while one is in flight, then sends only the newest', async () => {
    const el = contactsPage(grace());
    let release!: () => void;
    const update = vi.spyOn(contactsService, 'updateContact')
      .mockImplementationOnce(() => new Promise(resolve => { release = () => resolve(saved('v2')); }))
      .mockResolvedValue(saved('v3'));

    const first = el.handleSave({ path: '/book/grace.vcf', name: 'G', categories: '' });
    el.handleSave({ path: '/book/grace.vcf', name: 'Gr', categories: '' });
    el.handleSave({ path: '/book/grace.vcf', name: 'Gra', categories: '' });
    expect(update).toHaveBeenCalledTimes(1);

    release();
    await first;
    expect(update.mock.calls.map(([, payload]) => [payload.name, payload.etag])).toEqual([['G', 'v1'], ['Gra', 'v2']]);
  });

  it('creates a new contact once, and saves what follows as an edit of it', async () => {
    const el = contactsPage({ path: '', name: '', isTemporary: true });
    let release!: () => void;
    const create = vi.spyOn(contactsService, 'createContact')
      .mockImplementation(() => new Promise(resolve => { release = () => resolve(saved('v1', '/book/new.vcf')); }));
    const update = vi.spyOn(contactsService, 'updateContact').mockResolvedValue(saved('v2', '/book/new.vcf'));

    const first = el.handleSave({ name: 'A', categories: '' });
    el.handleSave({ name: 'Ada', categories: '' });
    release();
    await first;

    expect(create).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith('/book/new.vcf', expect.objectContaining({ name: 'Ada', etag: 'v1' }));
  });

  it('reports a refusal once, and sends nothing more until the edit is cancelled', async () => {
    const el = contactsPage(grace());
    const failures = vi.spyOn(el, 'reportFailure').mockImplementation(() => {});
    const update = vi.spyOn(contactsService, 'updateContact').mockRejectedValue(refused());
    const reread = vi.spyOn(contactsService, 'fetchContact').mockResolvedValue({ ...grace(), name: 'Grace (phone)', etag: 'v7' });

    await el.handleSave({ path: '/book/grace.vcf', name: 'Mine', categories: '' });
    await el.handleSave({ path: '/book/grace.vcf', name: 'Mine too', categories: '' });
    expect(update).toHaveBeenCalledTimes(1);
    expect(failures.mock.calls).toEqual([['contacts.saveConflict']]);

    // Cancelling shows what the other device wrote...
    el.handleCancelEdit();
    await vi.waitFor(() => expect(el.selectedContact.name).toBe('Grace (phone)'));
    expect(reread).toHaveBeenCalledWith('/book/grace.vcf');

    // ...and editing again saves against that version.
    update.mockResolvedValue(saved('v8'));
    el.isEditing = true;
    await el.handleSave({ path: '/book/grace.vcf', name: 'Mine', categories: '' });
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[1][1].etag).toBe('v7');
  });

  it('calls any other failure a failure, and goes on saving', async () => {
    const el = contactsPage(grace());
    const failures = vi.spyOn(el, 'reportFailure').mockImplementation(() => {});
    const update = vi.spyOn(contactsService, 'updateContact')
      .mockRejectedValueOnce(new HttpStatusError(502, 'Bad Gateway'))
      .mockResolvedValue(saved('v2'));

    await el.handleSave({ path: '/book/grace.vcf', name: 'Mine', categories: '' });
    await el.handleSave({ path: '/book/grace.vcf', name: 'Mine', categories: '' });
    expect(failures.mock.calls).toEqual([['contacts.saveFailed']]);
    expect(update).toHaveBeenCalledTimes(2);
  });
});

describe('a star', () => {
  it('sends the categories alone, and records the version it wrote', async () => {
    const open = grace();
    const el = contactsPage(open);
    el.isEditing = false;
    const categories = vi.spyOn(contactsService, 'updateCategories').mockResolvedValue(saved('v2'));
    const whole = vi.spyOn(contactsService, 'updateContact');

    await el.handleToggleStar(new Event(''), open);

    expect(categories).toHaveBeenCalledWith('/book/grace.vcf', [CATEGORY_FAVORITES]);
    expect(whole).not.toHaveBeenCalled();
    expect(el.contacts[0].etag).toBe('v2');
    expect(el.selectedContact.etag).toBe('v2');
    expect(el.selectedContact.categories).toEqual([CATEGORY_FAVORITES]);
  });

  it('across a selection records every version it wrote', async () => {
    const a = { ...grace(), path: '/book/a.vcf', etag: 'a1' };
    const b = { ...grace(), path: '/book/b.vcf', etag: 'b1' };
    const el = contactsPage(a);
    el.contacts = [a, b];
    el.selectedContacts = new Set([a.path, b.path]);
    vi.spyOn(contactsService, 'bulkUpdateCategories')
      .mockResolvedValue({ total: 2, done: 2, failed: 0, etags: { [a.path]: 'a2', [b.path]: 'b2' } });

    await el.handleToggleStarEvent();

    expect(el.contacts.map((c: any) => c.etag)).toEqual(['a2', 'b2']);
    expect(el.selectedContact.etag).toBe('a2');
  });
});

describe('the contacts service', () => {
  it('posts only the categories, and collects the versions', async () => {
    const fetch = vi.fn(async (url: string) => new Response(
      JSON.stringify({ ok: 'true', etag: url.includes('b.vcf') ? '' : 'a2' }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    const outcome = await contactsService.bulkUpdateCategories([
      { path: '/book/a.vcf', name: 'A', phone: '+1 555 0100', categories: ['Work'] },
      { path: '/book/b.vcf', name: 'B' },
    ]);

    expect(fetch.mock.calls.map(([url, init]: any) => [url, JSON.parse(init.body)])).toEqual([
      [`/contacts/${encodePathParam('/book/a.vcf')}/categories`, { categories: ['Work'] }],
      [`/contacts/${encodePathParam('/book/b.vcf')}/categories`, { categories: [] }],
    ]);
    expect(outcome).toEqual({ total: 2, done: 2, failed: 0, etags: { '/book/a.vcf': 'a2' } });
  });

  it('keeps the status of a refused save', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 412, statusText: 'Precondition Failed' })));
    const error = await contactsService.updateContact('/book/a.vcf', { etag: 'v1' }).catch(e => e);
    expect(isVersionConflict(error)).toBe(true);
    expect(isVersionConflict(new Error('Failed'))).toBe(false);
  });
});

describe('the event editor', () => {
  const event = {
    uid: 'standup', summary: 'Standup', path: '/cal/work/standup.ics', calendarPath: '/cal/work/',
    start: '2026-09-14T09:00:00.000Z', end: '2026-09-14T10:00:00.000Z', allDay: false, etag: 'v4',
  };
  const editor = () => mount<Page>('calendar-event-modal', {
    i18nStore: { t: (key: string) => key },
    calendars: [{ name: 'Work', description: '', path: '/cal/work/' }],
    event,
    open: true,
  });

  it('saves against the version it opened', async () => {
    const update = vi.spyOn(calendarService, 'updateEvent').mockResolvedValue({ ok: 'true', path: event.path, etag: 'v5' });
    const el = await editor();
    await el.handleSave();
    expect(update).toHaveBeenCalledWith(event.path, expect.objectContaining({ etag: 'v4', summary: 'Standup' }));
  });

  it('says a refused save was changed elsewhere, stays open, and has the page re-read', async () => {
    vi.spyOn(calendarService, 'updateEvent').mockRejectedValue(refused());
    const el = await editor();
    const toasts = record<CustomEvent>(window, 'show-toast');
    const conflicts = record(el, 'conflict');
    const saves = record(el, 'saved');

    await el.handleSave();

    expect(toasts.map(t => t.detail.message)).toEqual(['calendar.saveConflict']);
    expect(conflicts).toHaveLength(1);
    expect(saves).toHaveLength(0);
    expect(el.open).toBe(true);
  });

  it('calls any other failure a failure', async () => {
    vi.spyOn(calendarService, 'updateEvent').mockRejectedValue(new HttpStatusError(500, 'Internal Server Error'));
    const el = await editor();
    const toasts = record<CustomEvent>(window, 'show-toast');
    const conflicts = record(el, 'conflict');

    await el.handleSave();

    expect(toasts.map(t => t.detail.message)).toEqual(['calendar.saveEventFailed']);
    expect(conflicts).toHaveLength(0);
  });
});

describe('the contact form', () => {
  it('starts each edit from the card, not from the form it was left with', async () => {
    const el = await mount<Page>('alps-contact-view', { contact: grace(), isEditing: true });
    el.editForm = { ...el.editForm, name: 'Refused' };

    el.isEditing = false;
    await el.updateComplete;
    el.contact = { ...grace(), name: 'Grace (phone)', etag: 'v7' };
    el.isEditing = true;
    await el.updateComplete;

    expect(el.editForm.name).toBe('Grace (phone)');
  });

  it('keeps what is being typed when the open card only moves to a newer version', async () => {
    const el = await mount<Page>('alps-contact-view', { contact: grace(), isEditing: true });
    el.editForm = { ...el.editForm, name: 'Typing' };

    el.contact = { ...grace(), etag: 'v2' };
    await el.updateComplete;

    expect(el.editForm.name).toBe('Typing');
  });
});

describe('the calendar page', () => {
  it('re-reads the calendar when the editor reports a refused save', async () => {
    vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [{ name: 'Work', description: '', path: '/cal/work/' }] });
    const events = vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
    const page = await mount<Page>('calendar-page');
    await vi.waitFor(() => expect(events).toHaveBeenCalledTimes(1));

    page.shadowRoot!.querySelector('calendar-event-modal')!.dispatchEvent(new CustomEvent('conflict'));

    await vi.waitFor(() => expect(events).toHaveBeenCalledTimes(2));
  });
});
