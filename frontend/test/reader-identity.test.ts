/**
 * Which message the reader is showing.
 *
 * A UID is unique only within its folder, and a search across every folder
 * lists messages from several side by side. Opening one after another that
 * has the same UID is opening a different message, and the body shown has to
 * be the new one's.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import {
  cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, update, waitFor,
} from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const envelope = (subject: string) => ({
  Subject: subject,
  Date: '2026-09-01T10:00:00Z',
  From: [{ Name: '', Mailbox: 'charles', Host: 'example.com' }],
  To: [],
  Cc: [],
});

const inInbox = { UID: '7', Mailbox: 'INBOX', Flags: ['\\Seen'], Envelope: envelope('In the inbox') };
const inArchive = { UID: '7', Mailbox: 'Archive', Flags: ['\\Seen'], Envelope: envelope('In the archive') };

function settingsStore() {
  const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

let bodies: string[] = [];

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  bodies = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url);
    const body = /^\/mailboxes\/([^/]+)\/messages\/7\?view=/.exec(u);
    if (body) {
      const mailbox = decodeURIComponent(body[1]);
      bodies.push(mailbox);
      const message = mailbox === 'Archive' ? inArchive : inInbox;
      return json({ Message: message, Part: { Path: [1], MIMEType: 'text/plain' }, HasText: true, Attachments: [] });
    }
    if (u.includes('/messages/7/raw')) return new Response(u.includes('/Archive/') ? 'archive body' : 'inbox body');
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('in a search of all mailboxes', () => {
  it('loads the body of a message with the same UID in another folder', async () => {
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore: new EventTarget(),
      mailbox: '*',
      mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Archive', Attrs: ['\\Archive'] }],
      messages: [inInbox, inArchive],
      message: inInbox,
    });
    await waitFor(() => bodies.includes('INBOX'), 'the first body');

    await update(el, { message: inArchive });

    await waitFor(() => bodies.includes('Archive'), 'the second body');
  });
});
