/**
 * Coming back to the mail from Calendar, Contacts or Settings.
 *
 * app-root keeps one mailbox page for the session and re-attaches it, so a
 * return shows what was on screen at once and refreshes it quietly, rather
 * than building a new page that waits on a full listing behind a spinner.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import { cleanup, mount, waitFor } from './helpers/dom';
import { messageSync } from '../src/services/message-sync';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

function settingsStore() {
  const state: Record<string, unknown> = {
    layoutMode: 'vertical',
    densityMode: 'compact',
    sortOrder: 'desc',
    messagesPerPage: 50,
    checkMailInterval: 0,
    loginUsername: 'ada@example.com',
  };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => {
      Object.assign(state, updates);
    },
  });
}

const message = (mailbox: string, uid: number) => ({
  UID: String(uid),
  Mailbox: mailbox,
  Flags: ['\\Seen'],
  Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.test' }], To: [], Cc: [], Subject: `${mailbox} ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

let urls: string[];

const listingReads = () => urls.filter((url) => url.startsWith('/mailboxes/') && !url.includes('/verdicts'));

beforeEach(() => {
  urls = [];
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    urls.push(url);
    const match = url.match(/^\/mailboxes\/([^?/]+)\?/);
    if (match) {
      const mailbox = decodeURIComponent(match[1]);
      return new Response(JSON.stringify({
        Username: 'ada@example.com',
        Page: 0,
        Total: 1,
        MessagesPerPage: 50,
        Mailboxes: [{ Name: 'INBOX', Total: 1, Unseen: 0 }, { Name: 'Work', Total: 1, Unseen: 0 }],
        Messages: [message(mailbox, 1)],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  messageSync.stop();
  cleanup();
  window.history.replaceState(null, '', '#/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** A page showing `Work`, then taken off the screen as a switch to Calendar does. */
async function leftWork(): Promise<El> {
  window.history.replaceState(null, '', '#/mailbox/Work');
  const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
  await waitFor(() => el.messages?.[0]?.Mailbox === 'Work' && !el.isSyncing, 'the first listing');
  el.remove();
  window.history.replaceState(null, '', '#/calendar');
  urls = [];
  return el;
}

describe('returning to the mail', () => {
  it('shows the rows it left at once, and refreshes them without dimming', async () => {
    const el = await leftWork();
    window.history.replaceState(null, '', '#/');

    let dimmed = false;
    document.body.appendChild(el);
    expect(el.messages[0].Mailbox).toBe('Work');
    await waitFor(() => { dimmed ||= el.loadingMessages; return listingReads().length > 0 && !el.isSyncing; }, 'the refresh');
    expect(dimmed).toBe(false);
    expect(listingReads()).toEqual(['/mailboxes/Work?page=0&refresh=true']);
  });

  it('puts the URL back on the folder that was open, not the Inbox', async () => {
    const el = await leftWork();
    window.history.replaceState(null, '', '#/');

    document.body.appendChild(el);
    expect(window.location.hash).toBe('#/mailbox/Work');
    expect(el.currentMailbox).toBe('Work');
  });

  it('follows a link to another folder as a switch', async () => {
    const el = await leftWork();
    window.history.replaceState(null, '', '#/mailbox/INBOX');

    document.body.appendChild(el);
    expect(el.loadingMessages).toBe(true);
    await waitFor(() => el.messages?.[0]?.Mailbox === 'INBOX' && !el.isSyncing, 'the Inbox listing');
    expect(listingReads()).toEqual(['/mailboxes/INBOX?page=0']);
  });
});
