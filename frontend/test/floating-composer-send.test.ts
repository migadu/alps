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
});
