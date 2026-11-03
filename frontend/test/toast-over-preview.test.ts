/** Notifications follow the top modal, retaining their identity and deadline.
 * Native inertness and hit testing are exercised in the browser specs. */
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
    const dialog = preview.shadowRoot!.querySelector('dialog')!;
    expect(messages(dialog)).toEqual(['Raised before', 'Raised during']);
    expect(dialog.querySelectorAll('.toast-announce')).toHaveLength(2);
    // There is no second stack or inert pair of live regions behind it.
    expect(root.shadowRoot!.querySelectorAll('.toast-stack')).toHaveLength(0);
    expect(root.shadowRoot!.querySelectorAll('.toast-announce')).toHaveLength(0);

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


describe('independent toast deadlines', () => {
  it('keeps a later toast until its own deadline when earlier toasts leave', async () => {
    history.replaceState(null, '', '#/nowhere');
    vi.useFakeTimers();
    const root = await mount<El>('app-root');
    const lastDismiss = vi.fn();
    toast('First', { duration: 1000 });
    toast('Second', { duration: 4000 });
    toast('Third', { duration: 8000, dismissFn: lastDismiss });
    await root.updateComplete;
    await vi.advanceTimersByTimeAsync(1400);
    await root.updateComplete;
    expect(messages(root.shadowRoot!)).toEqual(['Second', 'Third']);
    await vi.advanceTimersByTimeAsync(3000);
    await root.updateComplete;
    expect(lastDismiss).not.toHaveBeenCalled();
    expect(messages(root.shadowRoot!)).toEqual(['Third']);
  });
});

it('moves the same toasts through nested menus and modals without extending their deadline', async () => {
  history.replaceState(null, '', '#/nowhere');
  vi.useFakeTimers();
  const root = await mount<El>('app-root');
  const dismissed = vi.fn();
  toast('Deadline', { duration: 2000, dismissFn: dismissed });
  await root.updateComplete;
  const original = root.shadowRoot!.querySelector<El>('alps-toast')!;
  const popup = document.createElement('alps-popup') as El;
  root.shadowRoot!.append(popup);
  await popup.updateComplete;
  await vi.advanceTimersByTimeAsync(500);
  popup.open();
  await popup.updateComplete;
  expect(popup.shadowRoot!.querySelector('dialog alps-toast')).toBe(original);
  const modal = document.createElement('ui-modal') as El;
  popup.append(modal);
  await modal.updateComplete;
  expect(modal.shadowRoot!.querySelector('dialog alps-toast')).toBe(original);
  await vi.advanceTimersByTimeAsync(500);
  modal.remove();
  expect(popup.shadowRoot!.querySelector('dialog alps-toast')).toBe(original);
  popup.close();
  await popup.updateComplete;
  expect(root.shadowRoot!.querySelector('alps-toast')).toBe(original);
  await vi.advanceTimersByTimeAsync(999);
  expect(dismissed).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(dismissed).toHaveBeenCalledOnce();
});
