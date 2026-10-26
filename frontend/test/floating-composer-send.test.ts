/**
 * Sending from the floating composer.
 *
 * A message with no subject is valid mail, and the Send button is enabled for
 * one. Pressing it must send, not return early with no toast, no request and
 * the window still open, which reads as a button that does nothing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, click, mount, record, shadow, waitFor } from './helpers/dom';
import type { ComposerInstance } from '../src/store/compose-store';
import { messageOperations } from '../src/services/message-operations';
import { messageSync } from '../src/services/message-sync';
import { replyContext } from '../src/utils/reply-context';
import '../src/components/alps-floating-composer';

// The emoji picker builds its whole grid when it connects, which takes jsdom
// seconds per composer and left these tests at their timeout. Nothing here
// opens it.
vi.mock('unicode-emoji-picker', () => ({}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
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

const i18nStore = {
  t: (key: string) => key,
  addEventListener: () => {},
  removeEventListener: () => {},
};

describe('send', () => {
  it('sends a message that has no subject', async () => {
    const instance: ComposerInstance = { id: 'c1', to: ['ada@example.com'], subject: '', text: 'Hello', format: 'text' };
    const composeStore = storeFor(instance);
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');

    const el = await mount('alps-floating-composer', { instance, composeStore, i18nStore });
    await click(shadow(el, '.send-actions alps-button[variant="primary"]'), el);

    // The undo toast is the first sign a send started; skipping its delay
    // sends now.
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();

    await waitFor(() => composeStore.closeComposer.mock.calls.length > 0, 'the composer to close after sending');
    expect(sendDraft).toHaveBeenCalledTimes(1);
    const form = sendDraft.mock.calls[0][0] as FormData;
    expect(form.get('subject')).toBe('');
    expect(form.get('to')).toBe('ada@example.com');
    expect(composeStore.closeComposer).toHaveBeenCalledWith('c1');
  });

  it('sends a reply with what it answers, so it joins that conversation', async () => {
    const original = {
      UID: 42,
      Envelope: { MessageID: 'parent@example.com', Subject: 'Engines' },
      References: ['root@example.com', 'middle@example.com'],
    };
    const instance: ComposerInstance = {
      id: 'c2', to: ['ada@example.com'], subject: 'Re: Engines', text: 'Agreed', format: 'text',
      ...replyContext(original, 'INBOX'),
    };
    const composeStore = storeFor(instance);
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');

    const el = await mount('alps-floating-composer', { instance, composeStore, i18nStore });
    await click(shadow(el, '.send-actions alps-button[variant="primary"]'), el);
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await waitFor(() => sendDraft.mock.calls.length > 0, 'the send');

    const form = sendDraft.mock.calls[0][0] as FormData;
    expect(form.get('in_reply_to')).toBe('parent@example.com');
    expect(form.get('references')).toBe('root@example.com middle@example.com');
    // Where the answered message is, so the server marks it answered.
    expect(form.get('reply_mailbox')).toBe('INBOX');
    expect(form.get('reply_uid')).toBe('42');
  });

  it('sends a forward with the message whose parts it carries', async () => {
    // A forward answers nothing, so the parts it carries can only be found in
    // the message it quotes.
    const instance: ComposerInstance = {
      id: 'c4', to: ['ada@example.com'], subject: 'Fwd: Engines', text: 'See below', format: 'text',
      attachments: [{ name: 'ledger.txt', size: 12, type: 'text/plain', partPath: '2' } as any],
      quoteSource: { mailbox: 'INBOX', uid: '42' },
    };
    const composeStore = storeFor(instance);
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');

    const el = await mount('alps-floating-composer', { instance, composeStore, i18nStore });
    await click(shadow(el, '.send-actions alps-button[variant="primary"]'), el);
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await waitFor(() => sendDraft.mock.calls.length > 0, 'the send');

    const form = sendDraft.mock.calls[0][0] as FormData;
    expect(form.get('prev_attachments')).toBe('2');
    expect(form.get('source_mailbox')).toBe('INBOX');
    expect(form.get('source_uid')).toBe('42');
    // And it answers nothing.
    expect(form.has('reply_uid')).toBe(false);
    expect(form.has('in_reply_to')).toBe(false);
  });

  it('sends no reply fields for a new message', async () => {
    const instance: ComposerInstance = { id: 'c3', to: ['ada@example.com'], subject: 'Hi', text: 'Hello', format: 'text' };
    const composeStore = storeFor(instance);
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');

    const el = await mount('alps-floating-composer', { instance, composeStore, i18nStore });
    await click(shadow(el, '.send-actions alps-button[variant="primary"]'), el);
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await waitFor(() => sendDraft.mock.calls.length > 0, 'the send');

    const form = sendDraft.mock.calls[0][0] as FormData;
    for (const field of ['in_reply_to', 'references', 'reply_mailbox', 'reply_uid', 'source_mailbox', 'source_uid']) {
      expect(form.has(field)).toBe(false);
    }
  });
});

describe('the undo window of a send', () => {
  afterEach(() => vi.useRealTimers());

  async function sending(composeStore: ReturnType<typeof storeFor>, instance: ComposerInstance) {
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const el = await mount<HTMLElement & Record<string, any>>('alps-floating-composer', { instance, composeStore, i18nStore });
    vi.useFakeTimers();
    const send = el._handleSend();
    await vi.advanceTimersByTimeAsync(2000);
    return { el, send, sendDraft };
  }

  it('ends when the window goes, and sends nothing', async () => {
    const instance: ComposerInstance = { id: 'c1', to: ['ada@example.com'], subject: 'Hi', text: 'Hello', format: 'text' };
    const composeStore = storeFor(instance);
    const { el, send, sendDraft } = await sending(composeStore, instance);

    el.remove();
    await vi.advanceTimersByTimeAsync(10_000);
    await send;

    expect(sendDraft).not.toHaveBeenCalled();
    expect(composeStore.closeComposer).not.toHaveBeenCalled();
    // Still in the store, so it is given back rather than left sending.
    expect(composeStore.updateComposer).toHaveBeenLastCalledWith('c1', { isSending: false, minimized: false });
  });

  it('sends nothing once its composer has left the store, as at sign-out', async () => {
    const instance: ComposerInstance = { id: 'c1', to: ['ada@example.com'], subject: 'Hi', text: 'Hello', format: 'text' };
    const composeStore = storeFor(instance);
    const { send, sendDraft } = await sending(composeStore, instance);

    composeStore.getComposer = () => undefined;
    await vi.advanceTimersByTimeAsync(10_000);
    await send;

    expect(sendDraft).not.toHaveBeenCalled();
    expect(composeStore.closeComposer).not.toHaveBeenCalled();
  });

  it('still sends when the countdown runs out', async () => {
    const instance: ComposerInstance = { id: 'c1', to: ['ada@example.com'], subject: 'Hi', text: 'Hello', format: 'text' };
    const composeStore = storeFor(instance);
    const { send, sendDraft } = await sending(composeStore, instance);

    await vi.advanceTimersByTimeAsync(10_000);
    await send;

    expect(sendDraft).toHaveBeenCalledTimes(1);
    expect(composeStore.closeComposer).toHaveBeenCalledWith('c1');
  });
});

describe('a maximized window that is sending', () => {
  // Sending minimizes the window and leaves `expanded` set, so that Undo gives
  // the window back maximized. Laid out as maximized, it stayed centred over
  // the page, empty but for its spinner, with a backdrop that took every click.
  it('lies minimized at the foot of the screen, with no backdrop', async () => {
    const instance: ComposerInstance = {
      id: 'c1', to: ['ada@example.com'], subject: 'Hi', text: 'Hello', format: 'text',
      expanded: true, minimized: true, isSending: true,
    };
    const el = await mount('alps-floating-composer', { instance, composeStore: storeFor(instance), i18nStore });

    expect(el.hasAttribute('minimized')).toBe(true);
    expect(el.hasAttribute('expanded')).toBe(false);
    expect(el.shadowRoot!.querySelector('.backdrop')).toBeNull();
    expect(el.style.height).toBe('40px');
    expect(el.style.zIndex).not.toBe('30000');
  });
});

describe('a send pressed during an autosave', () => {
  it('waits for the save, and sends over the draft that save stored', async () => {
    // The save stores draft 8 and deletes 7. Sent before it landed, the
    // message named 7, and 8 stayed in Drafts beside the sent message.
    let land!: (answer: unknown) => void;
    vi.spyOn(messageOperations, 'saveDraft').mockImplementationOnce(() => new Promise(resolve => { land = resolve; }) as any);
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');
    const instance: ComposerInstance = {
      id: 'c1', to: ['ada@example.com'], subject: 'Hi', text: 'Hello', initialText: '', format: 'text',
      dirty: true, draftUid: '7', draftMailbox: 'Drafts',
    };
    const composeStore = {
      ...storeFor(instance),
      updateComposer: vi.fn((_id: string, updates: Partial<ComposerInstance>) => Object.assign(instance, updates)),
    };
    const el = await mount<HTMLElement & Record<string, any>>('alps-floating-composer', { instance, composeStore, i18nStore });

    const saving = el._saveDraft();
    const send = el._handleSend();
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(sendDraft).not.toHaveBeenCalled();

    land({ uid: '8', mailbox: 'Drafts' });
    await saving;
    await send;

    expect(sendDraft).toHaveBeenCalledTimes(1);
    expect((sendDraft.mock.calls[0][0] as FormData).get('draft_uid')).toBe('8');
  });
});

describe('after a send of a message the autosave had stored', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('leaves the listing, and the polling, on the folder on screen', async () => {
    // The first autosave tells the composer where its draft lives, and the
    // send deletes that draft. Re-reading Drafts for it re-pointed the
    // listing at Drafts: Drafts' rows went up under the folder on screen,
    // and every poll and refresh after that read Drafts.
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ Messages: [] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    messageSync.setContext('INBOX', 0);

    const instance: ComposerInstance = {
      id: 'c1', to: ['ada@example.com'], subject: 'Hi', text: 'Hello', format: 'text',
      draftUid: '7', draftMailbox: 'Drafts',
    };
    const composeStore = storeFor(instance);
    vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');

    const el = await mount('alps-floating-composer', { instance, composeStore, i18nStore });
    await click(shadow(el, '.send-actions alps-button[variant="primary"]'), el);
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await waitFor(() => composeStore.closeComposer.mock.calls.length > 0, 'the composer to close after sending');

    // What the next refresh, or the next poll, lists. A write's sync first
    // probes the counts, so wait for its listing rather than inspecting the
    // requests synchronously while only that status probe has started.
    const synced = new Promise<CustomEvent>((resolve) => {
      messageSync.addEventListener('sync-success', (e) => resolve(e as CustomEvent), { once: true });
    });
    messageSync.sync();
    expect((await synced).detail.data.ListedMailbox).toBe('INBOX');
    const listed = fetchMock.mock.calls.map(call => String((call as unknown[])[0]));
    expect(listed).toEqual(['/mailboxes/INBOX/status', '/mailboxes/INBOX?page=0']);
  });
});
