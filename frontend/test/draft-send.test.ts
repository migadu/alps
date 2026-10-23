/**
 * A draft sent from its composer, while the reader is showing it.
 *
 * Open a draft, Edit Draft, Send: the server sends the message and deletes the
 * draft it was saved as, and the list re-syncs. The re-sync takes the row away
 * and never closes the reader, so the deleted draft stayed open, its Edit
 * Draft button still offered, beside a list that no longer held it. A discard
 * tells the reader which draft went (draft-discard.test.ts); a send did not.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadowAll, update, waitFor } from './helpers/dom';
import type { ComposerInstance } from '../src/store/compose-store';
import { messageOperations } from '../src/services/message-operations';
import { MessageCache } from '../src/utils/message-cache';
import '../src/components/message-reader';
import '../src/components/alps-floating-composer';

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
  To: [{ Name: '', Mailbox: 'bob', Host: 'example.com' }],
  Cc: [],
});

const draft = (uid: string) => ({
  UID: uid,
  Mailbox: 'Drafts',
  Flags: ['\\Seen', '\\Draft'],
  Envelope: envelope('Engines', '2026-09-02T10:00:00Z'),
});

function storeFor(instance: ComposerInstance) {
  return {
    getState: () => ({ activeComposers: [instance] }),
    getComposer: (id: string) => (id === instance.id ? instance : undefined),
    updateComposer: vi.fn(),
    bringComposerToFront: vi.fn(),
    closeComposer: vi.fn(),
  };
}

const saved = (uid?: string): ComposerInstance => ({
  id: 'c1', to: ['bob@example.com'], subject: 'Engines', text: 'Ready to go', format: 'text',
  ...(uid ? { draftUid: uid, draftMailbox: 'Drafts' } : {}),
});

/** Presses Send and skips the undo window; resolves once the send is over. */
async function send(instance: ComposerInstance) {
  const composeStore = storeFor(instance);
  const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });
  const toasts = record<CustomEvent>(window, 'show-toast');
  const sending = el._handleSend();
  await waitFor(() => toasts.length > 0, 'the undo toast');
  toasts[0].detail.dismissFn();
  await sending;
  return composeStore;
}

beforeEach(() => {
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

describe('the composer, sending a saved draft', () => {
  it('says which draft the send deleted', async () => {
    vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const seen = record<CustomEvent>(window, 'draft-discarded');

    const store = await send(saved('7'));

    expect(seen.map(e => e.detail)).toEqual([{ mailbox: 'Drafts', uid: '7' }]);
    expect(store.closeComposer).toHaveBeenCalledWith('c1');
  });

  it('says nothing when the server refused the send, and the draft is still there', async () => {
    vi.spyOn(messageOperations, 'sendDraft').mockRejectedValue(new Error('refused'));
    const seen = record<CustomEvent>(window, 'draft-discarded');

    const store = await send(saved('7'));

    expect(seen).toEqual([]);
    expect(store.closeComposer).not.toHaveBeenCalled();
  });

  it('says nothing on an expired session, which sent nothing', async () => {
    vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(false);
    const seen = record<CustomEvent>(window, 'draft-discarded');

    await send(saved('7'));

    expect(seen).toEqual([]);
  });

  it('says nothing for a message that was never saved as a draft', async () => {
    vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const seen = record<CustomEvent>(window, 'draft-discarded');

    await send(saved());

    expect(seen).toEqual([]);
  });
});

describe('the reader, when the draft it shows is sent', () => {
  function settingsStore() {
    const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
    return Object.assign(new EventTarget(), { getState: () => state });
  }

  async function open(message: any, messages: any[] = [message]): Promise<El> {
    return mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore: { openComposer: vi.fn() },
      mailbox: 'Drafts',
      mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Drafts', Attrs: ['\\Drafts'] }],
      messages,
      message,
    });
  }

  it('closes', async () => {
    vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const reader = await open(draft('7'));
    const closed = record(reader, 'close');

    await send(saved('7'));

    expect(closed).toHaveLength(1);
  });

  it('takes the sent draft\'s card out of the conversation on screen', async () => {
    vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const root = draft('7');
    const second = { ...draft('9'), Envelope: envelope('Re: Engines', '2026-09-03T10:00:00Z') };
    const third = { ...draft('11'), Envelope: envelope('Re: Engines', '2026-09-04T10:00:00Z') };
    const reader = await open(root, [{ ...root, SubMessages: [second, third] }]);
    await waitFor(() => shadowAll(reader, 'alps-thread-card').length === 3, 'the conversation cards');
    const closed = record(reader, 'close');

    await send(saved('9'));
    await update(reader, {});

    expect(shadowAll<El>(reader, 'alps-thread-card').map(c => c.item.message.UID)).toEqual(['7', '11']);
    expect(closed).toHaveLength(0);
  });
});
