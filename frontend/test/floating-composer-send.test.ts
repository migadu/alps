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
import { replyContext } from '../src/utils/reply-context';
import '../src/components/alps-floating-composer';

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
    for (const field of ['in_reply_to', 'references', 'reply_mailbox', 'reply_uid']) {
      expect(form.has(field)).toBe(false);
    }
  });
});
