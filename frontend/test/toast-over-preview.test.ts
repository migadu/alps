/**
 * A toast raised while the attachment preview is open is drawn in it.
 *
 * The preview is a modal dialog: the browser draws it above everything else
 * in the page and makes the rest inert. The toasts were the shell's, under it,
 * so one raised over the preview, the undo of a send among them, was hidden
 * behind it and its button could not be pressed. While the preview is open the
 * shell now draws its toasts inside the dialog (a slot), and back in the shell
 * once it closes. Each move makes new toast elements, so a toast carries its
 * deadline (`expiresAt`), and one that moves keeps its remaining time rather
 * than waiting its whole timeout again.
 *
 * jsdom has no top layer and no hit testing; the e2e spec
 * (attachment-preview-toast.spec.ts) presses the button in a browser.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { messageSync } from '../src/services/message-sync';
import { cleanup, mount } from './helpers/dom';

import '../src/components/app-root';
import '../src/components/toast-notification';

type El = HTMLElement & Record<string, any> & { updateComplete: Promise<unknown> };

beforeEach(() => {
  document.cookie = 'alps_logged_in=1; path=/';
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  messageSync.stop();
  vi.unstubAllGlobals();
  document.cookie = 'alps_logged_in=; path=/; max-age=0';
  history.replaceState(null, '', '#/');
});

const toast = (message: string, extra: Record<string, unknown> = {}) =>
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, actionLabel: 'Undo', ...extra } }));

const openPreview = () =>
  window.dispatchEvent(new CustomEvent('open-attachment-preview', {
    detail: { attachments: [{ Filename: 'file.bin', MIMEType: 'application/octet-stream', Size: 1 }], mailbox: 'INBOX', messageUid: '7', index: 0 },
  }));

/** The toasts drawn, by message, in `root` (a shadow root, or the preview's
 * own children). */
const messages = (root: ParentNode) => [...root.querySelectorAll<El>('alps-toast')].map((t) => t.message);

describe('the shell, while the attachment preview is open', () => {
  it('draws its toasts inside the preview dialog, and back in the shell once it closes', async () => {
    history.replaceState(null, '', '#/nowhere');
    const root = await mount<El>('app-root');
    toast('Raised before');
    openPreview();
    await root.updateComplete;
    toast('Raised during');
    await root.updateComplete;

    const preview = root.shadowRoot!.querySelector('alps-attachment-preview') as El;
    await preview.updateComplete;
    const slot = preview.shadowRoot!.querySelector<HTMLSlotElement>('dialog slot[name="notifications"]')!;
    expect(slot).not.toBeNull();
    const stack = slot.assignedElements();
    expect(stack.map((el) => el.className)).toEqual(['toast-stack']);
    expect(messages(stack[0])).toEqual(['Raised before', 'Raised during']);
    // One stack: none left in the shell beneath the dialog.
    expect(root.shadowRoot!.querySelectorAll('.toast-stack')).toHaveLength(1);

    preview.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    await root.updateComplete;
    expect(root.shadowRoot!.querySelector('alps-attachment-preview')).toBeNull();
    const shellStack = root.shadowRoot!.querySelector('.toast-stack')!;
    expect(shellStack.hasAttribute('slot')).toBe(false);
    expect(messages(shellStack)).toEqual(['Raised before', 'Raised during']);
  });
});

describe('a toast drawn again elsewhere', () => {
  it('goes at its first deadline, not a whole timeout after the move', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const expiresAt = Date.now() + 1000;
    const first = await mount<El>('alps-toast', { show: true, timeout: 1000, expiresAt, onDismiss });
    vi.advanceTimersByTime(600);
    first.remove();

    const again = await mount<El>('alps-toast', { show: true, timeout: 1000, expiresAt, onDismiss });
    vi.advanceTimersByTime(399);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    await again.updateComplete;
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(again.show).toBe(false);
  });

  it('is dismissed by the element drawing it, not also by the one it left', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const expiresAt = Date.now() + 1000;
    const left = await mount<El>('alps-toast', { show: true, timeout: 1000, expiresAt, onDismiss });
    left.remove();
    vi.advanceTimersByTime(2000);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
