/**
 * A draft discarded from its composer, while the reader is showing it.
 *
 * Open a draft, Edit Draft, Discard: the composer deletes the draft and the
 * list re-syncs. The re-sync takes the row away and never closes the reader,
 * so the deleted draft stayed open beside a list that no longer held it.
 *
 * Every save of a draft stores a new message and deletes the one before, so
 * "the draft on screen" and "the draft the composer discards" are the same
 * message only if the page followed each save. It did that only while Drafts
 * was the folder on screen, and a search of all mailboxes lists drafts too.
 * A UID means something only in its mailbox, so every match here is on both.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup, flush, installMatchMedia, installResizeObserver, installScrollIntoView, mount, record, shadowAll, update, waitFor,
} from './helpers/dom';
import type { ComposerInstance } from '../src/store/compose-store';
import { ComposeStore } from '../src/store/compose-store';
import { messageOperations } from '../src/services/message-operations';
import { MessageCache } from '../src/utils/message-cache';
import '../src/components/message-reader';
import '../src/components/alps-floating-composer';
import '../src/pages/mailbox-page';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

const envelope = (subject: string, date: string) => ({
  Subject: subject,
  Date: date,
  From: [{ Name: '', Mailbox: 'ada', Host: 'example.com' }],
  To: [],
  Cc: [],
});

const draft = (uid: string, mailbox = 'Drafts') => ({
  UID: uid,
  Mailbox: mailbox,
  Flags: ['\\Seen', '\\Draft'],
  Envelope: envelope('Engines', '2026-09-02T10:00:00Z'),
});

/** An Inbox message under the same UID as the draft: never the same message. */
const inboxNamesake = (uid: string) => ({
  UID: uid,
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: envelope('Engines', '2026-09-01T10:00:00Z'),
});

const discarded = (mailbox: string, uid: string) =>
  window.dispatchEvent(new CustomEvent('draft-discarded', { detail: { mailbox, uid } }));

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the composer', () => {
  function storeFor(instance: ComposerInstance) {
    return {
      getState: () => ({ activeComposers: [instance] }),
      getComposer: (id: string) => (id === instance.id ? instance : undefined),
      updateComposer: vi.fn(),
      bringComposerToFront: vi.fn(),
      closeComposer: vi.fn(),
    };
  }

  async function discardFrom(instance: ComposerInstance) {
    const composeStore = storeFor(instance);
    const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });
    await el._performDiscard('delete');
    return composeStore;
  }

  it('says which draft it deleted', async () => {
    const del = vi.spyOn(messageOperations, 'deleteMessagesResult').mockResolvedValue({ ok: true });
    const seen = record<CustomEvent>(window, 'draft-discarded');

    const store = await discardFrom({ id: 'c1', draftUid: '7', draftMailbox: 'Drafts', subject: 'Engines' });

    expect(del).toHaveBeenCalledWith('Drafts', ['7']);
    expect(seen.map(e => e.detail)).toEqual([{ mailbox: 'Drafts', uid: '7' }]);
    expect(store.closeComposer).toHaveBeenCalledWith('c1');
  });

  it('says nothing when the draft is still there', async () => {
    vi.spyOn(messageOperations, 'deleteMessagesResult').mockResolvedValue({ ok: false, reason: 'failed' });
    const seen = record<CustomEvent>(window, 'draft-discarded');

    const store = await discardFrom({ id: 'c1', draftUid: '7', draftMailbox: 'Drafts', subject: 'Engines' });

    expect(seen).toEqual([]);
    expect(store.closeComposer).toHaveBeenCalledWith('c1');
  });

  it('names the mailbox it is saving over, along with the UID', async () => {
    // A save stores a new draft and deletes this one; the page follows it
    // only if it can tell which listed message this was.
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts', size: 10 } as any);
    const seen = record<CustomEvent>(window, 'draft-autosaved');
    const instance: ComposerInstance = {
      id: 'c1', draftUid: '7', draftMailbox: 'Drafts', subject: 'Engines', text: 'Notes', format: 'text',
    };
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: storeFor(instance), i18nStore });

    await el._saveDraft();

    expect(seen[0].detail).toMatchObject({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8', mailbox: 'Drafts' });
  });
});

describe('the compose store', () => {
  it('says which draft it deleted, as the composer does', async () => {
    localStorage.setItem('alps_active_user', 'ada');
    vi.spyOn(messageOperations, 'deleteMessagesResult').mockResolvedValue({ ok: true });
    const seen = record<CustomEvent>(window, 'draft-discarded');
    const store = new ComposeStore();
    store.openComposer({ draftUid: '7', draftMailbox: 'Drafts' });

    store.discardDraft(store.getState().activeComposers[0].id);

    await vi.waitFor(() => expect(seen.map(e => e.detail)).toEqual([{ mailbox: 'Drafts', uid: '7' }]));
  });
});

describe('the reader', () => {
  function settingsStore() {
    const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
    return Object.assign(new EventTarget(), { getState: () => state });
  }

  async function open(message: any, mailbox: string, messages: any[] = [message]): Promise<El> {
    return mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore: { openComposer: vi.fn() },
      mailbox,
      mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Drafts', Attrs: ['\\Drafts'] }],
      messages,
      message,
    });
  }

  it('closes when the draft it shows is discarded', async () => {
    const el = await open(draft('7'), 'Drafts');
    const closed = record(el, 'close');

    discarded('Drafts', '7');

    expect(closed).toHaveLength(1);
  });

  it('closes for a draft found by a search of all mailboxes', async () => {
    const el = await open(draft('7'), '*');
    const closed = record(el, 'close');

    discarded('Drafts', '7');

    expect(closed).toHaveLength(1);
  });

  it('stays open for a message that only shares the UID', async () => {
    const el = await open(inboxNamesake('7'), 'INBOX');
    const closed = record(el, 'close');

    discarded('Drafts', '7');

    expect(closed).toHaveLength(0);
  });

  it('takes the card of a discarded draft out of the conversation on screen', async () => {
    // A thread of three in Drafts: the open message and two drafts under it.
    // Three, so what is left is still a conversation and still drawn as cards.
    const root = draft('7');
    const second = { ...draft('9'), Envelope: envelope('Re: Engines', '2026-09-03T10:00:00Z') };
    const third = { ...draft('11'), Envelope: envelope('Re: Engines', '2026-09-04T10:00:00Z') };
    const el = await open(root, 'Drafts', [{ ...root, SubMessages: [second, third] }]);
    await waitFor(() => shadowAll(el, 'alps-thread-card').length === 3, 'the conversation cards');
    const closed = record(el, 'close');

    discarded('Drafts', '9');
    await update(el, {});

    expect(shadowAll<El>(el, 'alps-thread-card').map(c => c.item.message.UID)).toEqual(['7', '11']);
    expect(closed).toHaveLength(0);
  });

  it('edits a draft found by a search of all mailboxes in its own mailbox', async () => {
    // `*` is the view, not a mailbox: saving over it, or discarding from it,
    // asked the server to delete from a mailbox that does not exist.
    const composeStore = { openComposer: vi.fn() };
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore,
      mailbox: '*',
      mailboxes: [],
      messages: [draft('7')],
      message: draft('7'),
    });

    await el._handleEditDraft();

    expect(composeStore.openComposer).toHaveBeenCalledWith(expect.objectContaining({
      draftUid: '7',
      draftMailbox: 'Drafts',
      quoteSource: expect.objectContaining({ mailbox: 'Drafts', uid: '7' }),
    }));
  });
});

describe('the mail page, when a draft is saved', () => {
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
      updateSettings: async (updates: Record<string, unknown>) => { Object.assign(state, updates); },
    });
  }

  async function page(currentMailbox: string, messages: any[], selectedMessage: any): Promise<El> {
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
    await flush();
    await update(el, { currentMailbox, messages, selectedMessage });
    return el;
  }

  const saved = (detail: Record<string, unknown>) =>
    window.dispatchEvent(new CustomEvent('draft-autosaved', {
      detail: { mailbox: 'Drafts', subject: 'Engines', hasAttachments: false, size: 10, ...detail },
    }));

  it('follows the open draft in a search of all mailboxes', async () => {
    const found = draft('7');
    const el = await page('*', [inboxNamesake('7'), found], found);

    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8' });

    expect(el.selectedMessage).toMatchObject({ UID: '8', Mailbox: 'Drafts' });
    // The row moved with it, and its namesake in the Inbox did not.
    expect(el.messages.map((m: any) => [m.Mailbox, String(m.UID)])).toEqual([['INBOX', '7'], ['Drafts', '8']]);
  });

  it('leaves a message that only shares the UID alone, and inserts nothing outside Drafts', async () => {
    const namesake = inboxNamesake('7');
    const el = await page('INBOX', [namesake], namesake);

    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8' });

    expect(el.selectedMessage).toBe(namesake);
    expect(el.messages).toEqual([namesake]);
  });

  it('still follows the draft in Drafts', async () => {
    const row = { ...draft('7'), Mailbox: undefined };
    const el = await page('Drafts', [row], row);

    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8' });

    expect(el.selectedMessage).toMatchObject({ UID: '8' });
    expect(el.messages.map((m: any) => String(m.UID))).toEqual(['8']);
  });
});
