/**
 * The pages beneath the Settings window leave its URL alone.
 *
 * While Settings is open the URL is the window's (`#/settings/<section>`) and
 * the page it was opened over is still mounted, and still busy: a sync lands,
 * a composer above the window autosaves a draft, a folder is deleted on
 * another device. Every page used to answer some of those by writing its own
 * URL, which here would replace the window's URL (closing it) and drop the
 * history entry's record of where it closes to. And every page read the URL on
 * `hashchange`, where `#/settings` named no folder and no card.
 *
 * So each page asks `isSettingsHash` first and leaves the URL alone while the
 * window is up. Each writer and reader is driven directly, on an element that
 * is never connected, because what is under test is the URL and the page's own
 * idea of where it is, not the page around them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { settingsEntry, stampSettingsEntry } from '../src/utils/settings-history';

import '../src/pages/mailbox-page';
import '../../plugins/carddav/frontend/contacts-page';
import '../../plugins/caldav/frontend/tasks-page';
import '../../plugins/caldav/frontend/calendar-page';

const OPEN = '#/settings/appearance';
const ENTRY = { depth: 1, background: '#/mailbox/Work' };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));
  history.replaceState(null, '', OPEN);
  stampSettingsEntry(ENTRY);
});

afterEach(() => {
  vi.unstubAllGlobals();
  history.replaceState(null, '', '#/');
});

/** The window keeps its URL and records the effective background route. */
function expectWindow(background = ENTRY.background): void {
  expect(window.location.hash).toBe(OPEN);
  expect(settingsEntry()).toEqual({ ...ENTRY, background });
}

/** A page's private members, used as the page itself would. */
type Bag = Record<string, any>;
const page = (tag: string) => document.createElement(tag) as unknown as Bag;

describe('the mailbox', () => {
  it('records a missing folder fallback without navigating away from Settings', () => {
    // A folder deleted on another device sends the page to the Inbox.
    page('mailbox-page').updateUrl('INBOX', 0, null, '');
    expectWindow('#/mailbox/INBOX');
  });

  it("does not move the URL onto a draft's new UID", () => {
    // A composer above the window autosaves the draft the reader has open.
    page('mailbox-page').followAutosavedSelection({ UID: '42', Mailbox: 'Drafts' });
    expectWindow('#/mailbox/INBOX?uid=42&in=Drafts');
  });

  it('keeps its folder, its message and its search when the URL becomes the window\'s', () => {
    const mailbox = page('mailbox-page');
    Object.assign(mailbox, { currentMailbox: 'Work', targetUid: '7', filterQuery: 'invoice' });
    mailbox.handleHashChange();
    expect(mailbox.currentMailbox).toBe('Work');
    expect(mailbox.targetUid).toBe('7');
    expect(mailbox.filterQuery).toBe('invoice');
  });

  it('does not move the message list for an arrow pressed outside the window', () => {
    // A click on the dimmed backdrop leaves focus on the body.
    const mailbox = page('mailbox-page');
    const step = vi.fn();
    Object.defineProperty(mailbox, 'renderRoot', { value: { querySelector: () => ({ step }) } });
    const press = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    document.body.addEventListener('keydown', mailbox.handleStrayArrow, { once: true });
    document.body.dispatchEvent(press);
    expect(step).not.toHaveBeenCalled();
    expect(press.defaultPrevented).toBe(false);
  });
});

describe('the contacts page', () => {
  it('does not rewrite or push its URL', () => {
    stampSettingsEntry({ ...ENTRY, background: '#/contacts/Family' });
    const contacts = page('contacts-page');
    contacts.writeHash('#/contacts/all', 'replace');
    contacts.writeHash('#/contacts/all', 'push');
    expectWindow('#/contacts/all');
  });

  it('keeps the card it has open, and the edit with it', () => {
    // Read as an address naming no card, `#/settings` closed it.
    const contacts = page('contacts-page');
    const card = { uid: 'urn:uuid:ada', path: '/ada.vcf' };
    Object.assign(contacts, { selectedContact: card, isEditing: true });
    contacts._handleHashChange();
    expect(contacts.selectedContact).toBe(card);
    expect(contacts.isEditing).toBe(true);
  });
});

describe('the tasks page', () => {
  it('records another list without navigating away from Settings', () => {
    stampSettingsEntry({ ...ENTRY, background: '#/tasks/all' });
    page('tasks-page').navigate('today');
    expectWindow('#/tasks/today');
  });
});

describe('the calendar', () => {
  it('records another view without navigating away from Settings', () => {
    stampSettingsEntry({ ...ENTRY, background: '#/calendar/month/2026-09' });
    page('calendar-page').navigate('month', new Date(2026, 9, 21));
    expectWindow('#/calendar/month/2026-10');
  });
});
