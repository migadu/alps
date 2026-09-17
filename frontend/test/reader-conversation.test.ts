/**
 * The conversation a message opens into.
 *
 * The list threads one folder, and the replies the user sent are filed in Sent,
 * so the reader asks the server for the whole conversation and adds what the
 * list lacks. A UID is unique only within its folder: a reply in Sent can have
 * the UID of the message it answers, and must stay a separate card, never
 * mistaken for the open message or for a row of the list.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import {
  cleanup, flush, installMatchMedia, installResizeObserver, installScrollIntoView, mount, shadowAll, update, waitFor,
} from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';
import { messageKey } from '../src/utils/message-key';

type El = HTMLElement & Record<string, any>;

const envelope = (subject: string, date: string, from: string) => ({
  Subject: subject,
  Date: date,
  From: [{ Name: '', Mailbox: from, Host: 'example.com' }],
  To: [],
  Cc: [],
});

const inboxMessage = {
  UID: '7',
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: { ...envelope('Engines', '2026-09-01T10:00:00Z', 'charles'), MessageID: 'engines@example.com' },
};

// The reply, in Sent, under the same UID as the message it answers.
const sentReply = {
  UID: '7',
  Mailbox: 'Sent',
  Flags: ['\\Seen'],
  Envelope: { ...envelope('Re: Engines', '2026-09-02T10:00:00Z', 'ada'), MessageID: 'reply@example.com', InReplyTo: 'engines@example.com' },
};

function settingsStore() {
  const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

let requests: { url: string; method: string; body?: string }[] = [];

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  requests = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const u = String(url);
    requests.push({ url: u, method: init.method || 'GET', body: init.body as string | undefined });
    if (u.startsWith('/mailboxes/INBOX/messages/7/thread')) return json({ Messages: [inboxMessage, sentReply] });
    if (u.startsWith('/mailboxes/INBOX/messages/7/raw')) return new Response('the body', { status: 200 });
    if (u.startsWith('/mailboxes/INBOX/messages/7?')) {
      return json({ Message: inboxMessage, Part: { Path: [1], MIMEType: 'text/plain' }, HasText: true, Attachments: [] });
    }
    if (u.endsWith('/messages/flag')) return json({ ok: true });
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function openInbox(): Promise<El> {
  const el = await mount<El>('alps-message-reader', {
    settingsStore: settingsStore(),
    i18nStore,
    composeStore: new EventTarget(),
    mailbox: 'INBOX',
    mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Sent', Attrs: ['\\Sent'] }],
    messages: [inboxMessage],
    message: inboxMessage,
  });
  await waitFor(() => shadowAll(el, 'alps-thread-card').length === 2, 'the conversation cards');
  return el;
}

const cards = (el: El) => shadowAll<El>(el, 'alps-thread-card');

describe('the conversation of an opened message', () => {
  it('shows the reply from Sent after the message it answers', async () => {
    const el = await openInbox();
    expect(requests.some(r => r.url === '/mailboxes/INBOX/messages/7/thread')).toBe(true);
    const [first, second] = cards(el).map(c => c.item);
    expect(first.mailbox).toBe('INBOX');
    expect(first.expanded).toBe(true);
    expect(second.mailbox).toBe('Sent');
    expect(second.isSent).toBe(true);
    expect(second.expanded).toBe(false);
    expect(second.message.Envelope.Subject).toBe('Re: Engines');
    expect(new Set(cards(el).map(c => c.id)).size).toBe(2);
  });

  it('keeps the reply when the list is refreshed', async () => {
    const el = await openInbox();
    await update(el, { messages: [{ ...inboxMessage }] });
    await flush();
    expect(cards(el).map(c => c.item.mailbox)).toEqual(['INBOX', 'Sent']);
  });

  it('stars the reply in Sent, and does not tell the list, whose row has the same UID', async () => {
    const el = await openInbox();
    const changes: CustomEvent[] = [];
    el.addEventListener('message-flags-changed', e => changes.push(e as CustomEvent));

    const reply = cards(el)[1];
    reply.dispatchEvent(new CustomEvent('toggle-star', { detail: { item: reply.item } }));
    await waitFor(() => requests.some(r => r.method === 'PUT'), 'the flag request');

    const put = requests.find(r => r.method === 'PUT')!;
    expect(put.url).toBe('/mailboxes/Sent/messages/flag');
    expect(JSON.parse(put.body!).uids).toEqual(['7']);
    await flush();
    expect(changes).toHaveLength(0);
    expect(el.message.Flags).not.toContain('\\Flagged');
    expect(cards(el)[0].item.message.Flags).not.toContain('\\Flagged');
    expect(cards(el)[1].item.message.Flags).toContain('\\Flagged');
  });

  it('applies a flag change from the list to the message it names, not the reply with the same UID', async () => {
    const el = await openInbox();
    // As the page does it: its own rows first, then the event for the reader.
    const starred = { ...inboxMessage, Flags: [...inboxMessage.Flags, '\\Flagged'] };
    await update(el, { messages: [starred], message: starred });
    window.dispatchEvent(new CustomEvent('external-message-flags-changed', {
      detail: { keys: [messageKey('INBOX', '7')], flag: '\\Flagged', action: 'add' },
    }));
    await flush();
    expect(cards(el)[0].item.message.Flags).toContain('\\Flagged');
    expect(cards(el)[1].item.message.Flags).not.toContain('\\Flagged');
  });
});
