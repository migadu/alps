/**
 * What the reader's controls act on, over a conversation — and what reading one
 * does to it.
 *
 * With a conversation on screen the header above the cards is a subject, not a
 * message. The toolbar there used to act on the "open" message, which nothing on
 * screen marks: Archive filed one message out of a conversation and left the
 * rest, while Reply, Star, Print and the rest of the menu quietly picked that
 * same message. The rule now is positional. What sits above the cards acts on
 * the conversation's messages in the folder being viewed, and what acts on one
 * message is in that message's own menu.
 *
 * Reading used to mark the open message read and nothing else, so a
 * conversation with an older unread message could not be cleared by reading it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import type { ReaderActionDetail } from '../src/components/message-reader';
import {
  cleanup, flush, installMatchMedia, installResizeObserver, installScrollIntoView, mount, record, shadowAll, update, waitFor,
} from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';
import { messageKey } from '../src/utils/message-key';

type El = HTMLElement & Record<string, any>;

const SEEN = '\\Seen';
const DRAFT = '\\Draft';

const envelope = (subject: string, date: string, from: string, id: string) => ({
  Subject: subject,
  Date: date,
  From: [{ Name: '', Mailbox: from, Host: 'example.com' }],
  To: [],
  Cc: [],
  MessageID: id,
});

/** The conversation, oldest first: a message in the Inbox, your reply from Sent,
 * and the answer to it, back in the Inbox. */
function older(flags: string[] = [SEEN]) {
  return { UID: '5', Mailbox: 'INBOX', Flags: flags, Envelope: envelope('Engines', '2026-09-01T10:00:00Z', 'charles', 'a@example.com') };
}
function reply(flags: string[] = [SEEN]) {
  return { UID: '7', Mailbox: 'Sent', Flags: flags, Envelope: envelope('Re: Engines', '2026-09-02T10:00:00Z', 'ada', 'b@example.com') };
}
function newer(flags: string[] = [SEEN]) {
  return { UID: '9', Mailbox: 'INBOX', Flags: flags, Envelope: envelope('Re: Engines', '2026-09-03T10:00:00Z', 'charles', 'c@example.com') };
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

function settingsStore(extra: Record<string, unknown> = {}) {
  const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true, ...extra };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const server: { thread: any[]; flagWrites: { mailbox: string; uids: string[]; flags: string[]; action: string }[] } = {
  thread: [],
  flagWrites: [],
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  server.thread = [];
  server.flagWrites = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const u = String(url);
    const flag = /^\/mailboxes\/([^/]+)\/messages\/flag$/.exec(u);
    if (flag) {
      const body = JSON.parse(String(init.body));
      server.flagWrites.push({ mailbox: decodeURIComponent(flag[1]), ...body });
      return json({ ok: true });
    }
    if (/\/messages\/\d+\/thread$/.test(u)) return json({ Messages: server.thread });
    if (/\/messages\/\d+\/raw/.test(u)) return new Response('the body', { status: 200 });
    const meta = /^\/mailboxes\/([^/]+)\/messages\/(\d+)\?/.exec(u);
    if (meta) {
      const found = server.thread.find(m => m.UID === meta[2] && m.Mailbox === decodeURIComponent(meta[1]));
      return json({ Message: found, Part: { Path: [1], MIMEType: 'text/plain' }, HasText: true, Attachments: [] });
    }
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/**
 * Opens `open` in the Inbox, with the list holding the thread's Inbox messages
 * and the server answering with the whole conversation.
 */
async function openConversation(
  opts: { members?: any[]; open?: any; mailbox?: string; listed?: any[]; settings?: Record<string, unknown> } = {},
): Promise<El> {
  const members = opts.members ?? [older(), reply(), newer()];
  server.thread = members;
  const mailbox = opts.mailbox ?? 'INBOX';
  const open = opts.open ?? members[members.length - 1];
  const inFolder = members.filter(m => m.Mailbox === mailbox);
  const listed = opts.listed ?? [{ ...inFolder[0], SubMessages: inFolder.slice(1) }];
  const el = await mount<El>('alps-message-reader', {
    settingsStore: settingsStore(opts.settings),
    i18nStore,
    composeStore: new EventTarget(),
    mailbox,
    mailboxes: [
      { Name: 'INBOX', Attrs: [] },
      { Name: 'Sent', Attrs: ['\\Sent'] },
      { Name: 'Drafts', Attrs: ['\\Drafts'] },
      { Name: 'Trash', Attrs: ['\\Trash'] },
    ],
    messages: listed,
    message: open,
  });
  await waitFor(() => cards(el).length === members.length, 'the conversation cards');
  await settle();
  return el;
}

async function settle(ticks = 10) {
  for (let i = 0; i < ticks; i++) await flush();
}

const cards = (el: El) => shadowAll<El>(el, 'alps-thread-card');
const card = (el: El, mailbox: string, uid: string) =>
  cards(el).find(c => c.item.mailbox === mailbox && String(c.item.message.UID) === uid)!;
const toolbarTitles = (el: El) =>
  shadowAll(el, 'alps-toolbar > alps-icon-btn, alps-toolbar > * > alps-icon-btn[slot="trigger"]').map(b => b.getAttribute('title'));
const menuItems = (el: El) =>
  shadowAll(el, '.more-menu-popup .dropdown-item .item-text').map(n => n.textContent?.trim());
const actions = (el: El) => record<CustomEvent<ReaderActionDetail>>(el, 'action');

function assertNoStrandedDividers(menu: Element) {
  const children = Array.from(menu.children).filter(c => c.getAttribute('slot') !== 'trigger');
  const isDivider = (c: Element) => c.classList.contains('dropdown-divider');
  expect(isDivider(children[0]), 'a divider opens the menu').toBe(false);
  expect(isDivider(children[children.length - 1]), 'a divider closes the menu').toBe(false);
  for (let i = 0; i < children.length - 1; i++) {
    expect(isDivider(children[i]) && isDivider(children[i + 1]), `consecutive dividers at ${i}`).toBe(false);
  }
}

describe('the toolbar over a conversation', () => {
  it('offers nothing that is about one message', async () => {
    const el = await openConversation();

    expect(toolbarTitles(el)).not.toContain('messageReader.reply');
    expect(toolbarTitles(el)).not.toContain('messageReader.star');
    for (const gone of ['messageReader.reply', 'messageReader.replyAll', 'messageReader.forward', 'messageReader.star',
      'messageReader.print', 'messageReader.downloadMessage', 'messageReader.showOriginal', 'messageReader.delete']) {
      expect(menuItems(el), `${gone} is a verb on ONE message`).not.toContain(gone);
    }
  });

  it('keeps what is about all of it, and names its Delete for what it takes', async () => {
    const el = await openConversation();

    expect(toolbarTitles(el)).toEqual(expect.arrayContaining([
      'messageReader.archive', 'messageReader.reportSpam', 'messageReader.deleteThread', 'messageReader.moveTo',
      'messageReader.markUnread', 'messageReader.tags',
    ]));
    expect(menuItems(el)).toEqual(expect.arrayContaining([
      'messageReader.archive', 'messageReader.deleteThread', 'messageReader.moveTo', 'messageReader.markUnread',
      // A preference about the reader, not a verb on a message.
      'messageReader.showPlaintext', 'messageReader.showHtml',
    ]));
  });

  it('files the conversation\'s messages in this folder, and leaves your replies in Sent', async () => {
    const el = await openConversation();
    const seen = actions(el);

    el._handleAction('archive');
    el._handleAction('delete');
    el._handleAction('moveTo', 'Receipts');

    expect(seen.map(e => e.detail)).toEqual([
      { action: 'archive', folder: undefined, uids: ['5', '9'] },
      { action: 'delete', folder: undefined, uids: ['5', '9'] },
      { action: 'moveTo', folder: 'Receipts', uids: ['5', '9'] },
    ]);
  });

  it('tags all of it, and shows a tag as set only when all of it carries one', async () => {
    const el = await openConversation({ members: [older([SEEN, '$label1']), reply(), newer([SEEN])] });
    const seen = actions(el);

    expect(el.hasTag('$label1')).toBe(false);
    el._handleTag('$label1');
    expect(seen.at(-1)!.detail).toEqual({ action: 'addTag', folder: '$label1', uids: ['5', '9'] });

    el._handleRemoveAllTags();
    expect(seen.at(-1)!.detail).toEqual({ action: 'removeTag', tags: ['$label1'], uids: ['5', '9'] });
  });

  it('never stacks or strands a divider, in the Inbox or in Trash', async () => {
    const inbox = await openConversation();
    assertNoStrandedDividers(inbox.shadowRoot!.querySelector('.more-menu-popup')!);

    const trashed = (m: any) => ({ ...m, Mailbox: 'Trash' });
    const trash = await openConversation({
      mailbox: 'Trash',
      members: [trashed(older()), reply(), trashed(newer())],
    });
    assertNoStrandedDividers(trash.shadowRoot!.querySelector('.more-menu-popup')!);
  });

  describe('the read toggle', () => {
    it('says "Mark as read" while any of it is unread, and marks all of that read', async () => {
      // The open message is read; the one before it is not, and neither is a
      // reply of yours — which lives in another folder, so it is its own write.
      const el = await openConversation({ members: [older([]), reply([]), newer([SEEN])], settings: { markReadTimeout: -1 } });
      const seen = actions(el);
      const toList = record<CustomEvent>(el, 'message-flags-changed');
      expect(toolbarTitles(el)).toContain('messageReader.markRead');

      el._handleAction('markUnread');
      await settle();

      expect(seen).toHaveLength(0);
      expect(server.flagWrites.map(w => [w.mailbox, w.uids, w.action])).toEqual(expect.arrayContaining([
        ['INBOX', ['5'], 'add'],
        ['Sent', ['7'], 'add'],
      ]));
      // Only the listed message is news to the list, and it names its folder.
      expect(toList.map(e => e.detail)).toEqual([{ uid: '5', mailbox: 'INBOX', flag: SEEN, action: 'add' }]);
      await update(el, {});
      expect(toolbarTitles(el)).toContain('messageReader.markUnread');
    });

    it('marks a fully read conversation unread on the open message, which is the page\'s to do', async () => {
      const el = await openConversation();
      const seen = actions(el);

      el._handleAction('markUnread');

      expect(seen.map(e => e.detail)).toEqual([{ action: 'markUnread', folder: undefined }]);
    });
  });
});

describe('what the toolbar keeps outside a conversation', () => {
  it('leaves a single message everything it had', async () => {
    server.thread = [newer()];
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(), i18nStore, composeStore: new EventTarget(),
      mailbox: 'INBOX', mailboxes: [{ Name: 'INBOX', Attrs: [] }], messages: [newer()], message: newer(),
    });
    await settle();

    expect(toolbarTitles(el)).toEqual(expect.arrayContaining(['messageReader.reply', 'messageReader.star', 'messageReader.delete']));
    expect(menuItems(el)).toEqual(expect.arrayContaining([
      'messageReader.reply', 'messageReader.star', 'messageReader.print', 'messageReader.downloadMessage', 'messageReader.delete',
    ]));
    expect(el.shadowRoot!.querySelector('.conversation-reply')).toBeNull();
  });

  it('stays about the open message in a search across every folder', async () => {
    // Nothing is filed in "*", so there is no conversation in the viewed folder
    // for a conversation verb to take — and a "Delete conversation" that took
    // one message would say what it does not do.
    const el = await openConversation({ listed: [{ ...older(), SubMessages: [newer()] }] });
    await update(el, { mailbox: '*' });
    await waitFor(() => cards(el).length > 1, 'the conversation, read again');

    expect(el.toolbarIsConversation).toBe(false);
  });

  it('keeps "Discard draft" on the draft, among the messages it answers', async () => {
    const draft = { UID: '3', Mailbox: 'Drafts', Flags: [SEEN, DRAFT], Envelope: envelope('Re: Engines', '2026-09-04T10:00:00Z', 'ada', 'd@example.com') };
    const el = await openConversation({
      mailbox: 'Drafts',
      members: [{ ...older(), Mailbox: 'Drafts' }, draft],
      open: draft,
    });
    const seen = actions(el);

    expect(el.toolbarIsConversation).toBe(false);
    el._handleAction('delete');

    expect(seen.map(e => e.detail)).toEqual([{ action: 'delete', folder: undefined }]);
  });
});

describe('a card\'s own menu', () => {
  it('names its message and that message\'s folder', async () => {
    const el = await openConversation();
    const seen = actions(el);
    const sent = card(el, 'Sent', '7');

    for (const action of ['downloadMessage', 'showOriginal', 'markUnread']) {
      sent.dispatchEvent(new CustomEvent('action-for-item', { detail: { action, item: sent.item } }));
    }
    await settle();

    expect(seen.map(e => e.detail)).toEqual([
      { action: 'downloadMessage', uid: '7', mailbox: 'Sent' },
      { action: 'showOriginal', uid: '7', mailbox: 'Sent' },
      { action: 'markUnread', uid: '7', mailbox: 'Sent' },
    ]);
  });

  it('marks its own message read, itself', async () => {
    const el = await openConversation({ members: [older([]), reply(), newer()], settings: { markReadTimeout: -1 } });
    const seen = actions(el);
    const first = card(el, 'INBOX', '5');

    first.dispatchEvent(new CustomEvent('action-for-item', { detail: { action: 'markRead', item: first.item } }));
    await settle();

    expect(server.flagWrites).toEqual([{ mailbox: 'INBOX', uids: ['5'], flags: [SEEN], action: 'add' }]);
    expect(seen).toHaveLength(0);
  });

  it('offers the read toggle on a received message and not on your own reply', async () => {
    const el = await openConversation();

    expect(card(el, 'INBOX', '5').canToggleRead).toBe(true);
    expect(card(el, 'Sent', '7').canToggleRead).toBe(false);
  });

  describe('Delete', () => {
    it('asks the page, naming the message, and leaves the card until the page says it is gone', async () => {
      const el = await openConversation();
      const seen = actions(el);
      const sent = card(el, 'Sent', '7');

      sent.dispatchEvent(new CustomEvent('delete-item', { detail: { item: sent.item } }));
      const detail = seen[0].detail;
      expect(detail).toMatchObject({ action: 'delete', uid: '7', mailbox: 'Sent', nextUid: undefined });

      detail.done!(false);
      await update(el, {});
      expect(cards(el)).toHaveLength(3);

      detail.done!(true);
      await update(el, {});
      expect(cards(el).map(c => `${c.item.mailbox}/${c.item.message.UID}`)).toEqual(['INBOX/5', 'INBOX/9']);
    });

    it('says where to stay when the message being read is the one deleted', async () => {
      const el = await openConversation();
      const seen = actions(el);
      const open = card(el, 'INBOX', '9');

      open.dispatchEvent(new CustomEvent('delete-item', { detail: { item: open.item } }));

      expect(seen[0].detail).toMatchObject({ action: 'delete', uid: '9', mailbox: 'INBOX', nextUid: '5' });
    });

    it('never deletes on its own, and never asks the browser to confirm', async () => {
      const confirm = vi.spyOn(window, 'confirm');
      const el = await openConversation();
      const first = card(el, 'INBOX', '5');

      first.dispatchEvent(new CustomEvent('delete-item', { detail: { item: first.item } }));
      await settle();

      expect(confirm).not.toHaveBeenCalled();
      const fetchMock = vi.mocked(fetch);
      expect(fetchMock.mock.calls.some(([, init]) => (init as RequestInit | undefined)?.method === 'DELETE')).toBe(false);
    });
  });
});

describe('the reply row under the last card', () => {
  it('offers Reply, Reply all and Forward', async () => {
    const el = await openConversation();
    const labels = shadowAll(el, '.conversation-reply alps-button').map(b => b.textContent?.trim());
    expect(labels).toEqual(['messageReader.reply', 'messageReader.replyAll', 'messageReader.forward']);
  });

  it('answers the newest message that is not a draft', async () => {
    const draft = { UID: '11', Mailbox: 'INBOX', Flags: [SEEN, DRAFT], Envelope: envelope('Re: Engines', '2026-09-05T10:00:00Z', 'ada', 'e@example.com') };
    const el = await openConversation({ members: [older(), reply(), newer(), draft], open: newer() });
    const answered: string[][] = [];
    el._handleActionForItem = async (action: string, item: any) => {
      answered.push([action, item.mailbox, String(item.message.UID)]);
    };

    await el.answerNewest('replyAll');

    expect(answered).toEqual([['replyAll', 'INBOX', '9']]);
  });
});

describe('reading a conversation', () => {
  const expanded = (el: El, mailbox: string, uid: string) => card(el, mailbox, uid).item.expanded;
  const readWrites = () => server.flagWrites.filter(w => w.action === 'add' && w.flags.includes(SEEN));

  it('opens with the unread expanded and the read collapsed', async () => {
    const el = await openConversation({ members: [older([]), reply(), newer([])], settings: { markReadTimeout: -1 } });

    expect(expanded(el, 'INBOX', '5')).toBe(true);
    expect(expanded(el, 'INBOX', '9')).toBe(true);
    expect(expanded(el, 'Sent', '7')).toBe(false);
  });

  it('marks what it opened expanded read, and leaves the open message to the page', async () => {
    const el = await openConversation({ members: [older([]), reply(), newer([])] });
    await settle();

    expect(readWrites()).toEqual([{ mailbox: 'INBOX', uids: ['5'], flags: [SEEN], action: 'add' }]);
    expect(card(el, 'INBOX', '5').item.message.Flags).toContain(SEEN);
  });

  it('marks a card read when it is expanded by hand', async () => {
    // A message that arrived while the conversation was open is collapsed, so
    // it is read only once someone opens it.
    const el = await openConversation();
    const late = { UID: '12', Mailbox: 'INBOX', Flags: [], Envelope: envelope('Re: Engines', '2026-09-06T10:00:00Z', 'charles', 'f@example.com') };
    await update(el, { messages: [{ ...older(), SubMessages: [newer(), late] }] });
    await settle();
    expect(readWrites()).toEqual([]);

    const arrived = card(el, 'INBOX', '12');
    arrived.dispatchEvent(new CustomEvent('toggle-expansion', { detail: { item: arrived.item } }));
    await settle();

    expect(readWrites()).toEqual([{ mailbox: 'INBOX', uids: ['12'], flags: [SEEN], action: 'add' }]);
  });

  it('waits as long as opening a message does, and forgets a card collapsed before then', async () => {
    const el = await openConversation({ members: [older([]), reply([]), newer()], settings: { markReadTimeout: 1 } });
    expect(expanded(el, 'Sent', '7')).toBe(true);
    expect(readWrites()).toEqual([]);

    const sent = card(el, 'Sent', '7');
    sent.dispatchEvent(new CustomEvent('toggle-expansion', { detail: { item: sent.item } }));
    await new Promise(resolve => setTimeout(resolve, 1100));
    await settle();

    expect(readWrites()).toEqual([{ mailbox: 'INBOX', uids: ['5'], flags: [SEEN], action: 'add' }]);
  });

  it('never marks anything when the setting says never', async () => {
    const el = await openConversation({ members: [older([]), reply(), newer()], settings: { markReadTimeout: -1 } });
    await settle();

    expect(expanded(el, 'INBOX', '5')).toBe(true);
    expect(readWrites()).toEqual([]);
  });

  it('stops while rows are checked and the cards are off screen', async () => {
    const el = await openConversation({ members: [older([]), reply(), newer()], settings: { markReadTimeout: 1 } });
    await update(el, { selectedKeys: new Set([messageKey('INBOX', '42')]) });
    await new Promise(resolve => setTimeout(resolve, 1100));
    await settle();

    expect(readWrites()).toEqual([]);
  });

  it('leaves mail that arrives in an open conversation collapsed and unread', async () => {
    const el = await openConversation();
    const late = { UID: '12', Mailbox: 'INBOX', Flags: [], Envelope: envelope('Re: Engines', '2026-09-06T10:00:00Z', 'charles', 'f@example.com') };
    await update(el, { messages: [{ ...older(), SubMessages: [newer(), late] }] });
    await settle();

    expect(expanded(el, 'INBOX', '12')).toBe(false);
    expect(readWrites()).toEqual([]);
  });

  it('keeps a message it marked read as read when the list moves', async () => {
    // The message from Sent is not a row of the list, so the cards rebuilt on a
    // list change take it from the conversation the server returned — which
    // still said unread, and put it back up for marking.
    const el = await openConversation({ members: [older(), reply([]), newer()] });
    expect(readWrites()).toEqual([{ mailbox: 'Sent', uids: ['7'], flags: [SEEN], action: 'add' }]);

    await update(el, { messages: [{ ...older(), SubMessages: [newer()] }] });
    await settle();

    expect(card(el, 'Sent', '7').item.message.Flags).toContain(SEEN);
    expect(readWrites()).toHaveLength(1);
  });

  it('starts at the first unread message when that is not the open one', async () => {
    const scrolled: string[] = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function record(this: Element) { scrolled.push(this.id); };
    try {
      const el = await openConversation({ members: [older([]), reply(), newer([])], settings: { markReadTimeout: -1 } });
      await new Promise(resolve => setTimeout(resolve, 80));
      expect(scrolled.at(-1)).toBe(card(el, 'INBOX', '5').id);

      // The open message handed down again — a flag change, a sync — is not a
      // reason to take the pane back to it.
      scrolled.length = 0;
      await update(el, { message: { ...el.message } });
      await new Promise(resolve => setTimeout(resolve, 80));
      expect(scrolled).toEqual([]);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('leaves a draft opened from Drafts where it is', async () => {
    const draft = { UID: '3', Mailbox: 'Drafts', Flags: [SEEN, DRAFT], Envelope: envelope('Re: Engines', '2026-09-04T10:00:00Z', 'ada', 'd@example.com') };
    const el = await openConversation({
      mailbox: 'Drafts',
      members: [{ ...older([]), Mailbox: 'Drafts' }, draft],
      open: draft,
    });

    expect(expanded(el, 'Drafts', '5')).toBe(false);
    expect(readWrites()).toEqual([]);
  });
});
