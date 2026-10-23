/**
 * A draft in the conversation on screen, saved again from its composer.
 *
 * Every save of a draft stores a new message and deletes the one before, so
 * the draft is known by a new UID after it. The page follows it in the list
 * and in the open message, but the reader's own record of the conversation,
 * the messages the server named for it and the cards drawn from them, kept
 * the old UID: the conversation collapsed to the draft alone when the draft
 * was the open message, the old draft came back as a second card beside the
 * new one, and a discard named by the new UID left the card on screen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import {
  cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, shadowAll, update, waitFor,
} from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const envelope = (subject: string, date: string, from: string) => ({
  Subject: subject,
  Date: date,
  From: [{ Name: '', Mailbox: from, Host: 'example.com' }],
  To: [],
  Cc: [],
});

const inboxMessage = {
  UID: '7', Mailbox: 'INBOX', Flags: ['\\Seen'],
  Envelope: { ...envelope('Engines', '2026-09-01T10:00:00Z', 'charles'), MessageID: 'engines@example.com' },
};
const sentReply = {
  UID: '3', Mailbox: 'Sent', Flags: ['\\Seen'],
  Envelope: { ...envelope('Re: Engines', '2026-09-02T10:00:00Z', 'ada'), MessageID: 'reply@example.com', InReplyTo: 'engines@example.com' },
};
const draft = (uid: string) => ({
  UID: uid, Mailbox: 'Drafts', Flags: ['\\Seen', '\\Draft'],
  Envelope: { ...envelope('Re: Engines', '2026-09-03T10:00:00Z', 'ada'), MessageID: `draft-${uid}@example.com`, InReplyTo: 'reply@example.com' },
});

function settingsStore() {
  const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

/** The server: each message's body, and the conversations by the message asked about. */
function serve(conversations: Record<string, any[]>) {
  const messages = [inboxMessage, sentReply, draft('7'), draft('8'), draft('9'), draft('10')];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url);
    const m = /^\/mailboxes\/([^/]+)\/messages\/([^/?]+)(\/thread|\/raw)?/.exec(u);
    if (!m) return new Response('{}', { status: 404 });
    const [, mailbox, uid, what] = m;
    const found = messages.find(x => x.Mailbox === decodeURIComponent(mailbox) && x.UID === uid);
    if (what === '/thread') return json({ Messages: conversations[`${decodeURIComponent(mailbox)}/${uid}`] ?? [found] });
    if (what === '/raw') return new Response(`the body of ${decodeURIComponent(mailbox)}/${uid}`, { status: 200 });
    if (!found) return new Response('{}', { status: 404 });
    return json({ Message: found, Part: { Path: [1], MIMEType: 'text/plain' }, HasText: true, Attachments: [] });
  }));
}

async function reader(props: Record<string, unknown>, cardsExpected: number): Promise<El> {
  const el = await mount<El>('alps-message-reader', {
    settingsStore: settingsStore(),
    i18nStore,
    composeStore: new EventTarget(),
    mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Sent', Attrs: ['\\Sent'] }, { Name: 'Drafts', Attrs: ['\\Drafts'] }],
    ...props,
  });
  await waitFor(() => cards(el).length === cardsExpected, `the ${cardsExpected} cards of the conversation`);
  return el;
}

const cards = (el: El) => shadowAll<El>(el, 'alps-thread-card');
const shown = (el: El) => cards(el).map(c => `${c.item.mailbox}/${c.item.message.UID}`);

/** The save as the composer announces it. */
const saved = (oldUid: string, newUid: string) =>
  window.dispatchEvent(new CustomEvent('draft-autosaved', {
    detail: { oldUid, oldMailbox: 'Drafts', newUid, mailbox: 'Drafts', subject: 'Re: Engines', to: [], cc: [], bcc: [], hasAttachments: false, size: 10 },
  }));

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('a draft in the conversation on screen, saved again', () => {
  it('keeps the conversation when the draft is the open message, and its card its text', async () => {
    serve({ 'Drafts/7': [inboxMessage, sentReply, draft('7')] });
    const el = await reader({ mailbox: 'Drafts', messages: [draft('7')], message: draft('7') }, 3);
    await waitFor(() => cards(el).some(c => c.item.message.UID === '7' && c.item.content), 'the draft\'s text');

    // As the page follows the save: the open message and its row, renumbered.
    saved('7', '8');
    await update(el, { messages: [draft('8')], message: { ...draft('8'), _isAutosaveUpdate: true } });

    expect(shown(el)).toEqual(['INBOX/7', 'Sent/3', 'Drafts/8']);
    // Its text kept, not emptied while the saved copy is read again.
    expect(cards(el).find(c => c.item.message.UID === '8')!.item.content).toContain('the body of Drafts/');
  });

  it('draws the draft once when it is in the list and in the conversation', async () => {
    const listed = (d: any) => ({ ...inboxMessage, SubMessages: [d] });
    serve({ 'INBOX/7': [inboxMessage, draft('9')] });
    const el = await reader({ mailbox: 'INBOX', messages: [listed(draft('9'))], message: inboxMessage }, 2);
    // The list alone draws both cards; the conversation names the draft too.
    await waitFor(() => el._conversation?.messages.length === 2, 'the conversation');

    saved('9', '10');
    await update(el, { messages: [listed(draft('10'))] });

    expect(shown(el)).toEqual(['INBOX/7', 'Drafts/10']);
  });

  it('takes the draft\'s card away when it is discarded by the UID the save gave it', async () => {
    serve({ 'INBOX/7': [inboxMessage, draft('9')] });
    const el = await reader({ mailbox: 'INBOX', messages: [inboxMessage], message: inboxMessage }, 2);

    saved('9', '10');
    await el.updateComplete;
    window.dispatchEvent(new CustomEvent('draft-discarded', { detail: { mailbox: 'Drafts', uid: '10' } }));
    await el.updateComplete;

    // The message left is shown on its own, as a conversation of one is.
    expect(el.threadItems.map((i: any) => `${i.mailbox}/${i.message.UID}`)).toEqual(['INBOX/7']);
    expect(shown(el)).toEqual([]);
  });
});
