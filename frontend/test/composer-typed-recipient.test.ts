/**
 * An address typed into To, Cc or Bcc and not yet a pill, when Close or Send
 * is pressed.
 *
 * The field turned typed text into a pill 150ms after it lost the focus, and
 * Close and Send read the composer as it was when pressed. So the typed
 * address raced them: a save quicker than that stored the draft without it
 * and closed the window, a slower one left the window open after Close, and
 * Send, disabled while the only recipient was typed text, had to be pressed
 * again once the pill appeared.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadow, waitFor } from './helpers/dom';
import { ComposeStore } from '../src/store/compose-store';
import { messageOperations } from '../src/services/message-operations';
import '../src/components/alps-floating-composer';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

const stores: ComposeStore[] = [];

/** A window on the real store, handed each new state of its composer as the
 * app hands it. */
async function composer(initial: Record<string, unknown>) {
  localStorage.setItem('alps_active_user', 'ada@example.com');
  const store = new ComposeStore();
  stores.push(store);
  store.openComposer({ subject: 'Engines', text: 'Notes', format: 'text', dirty: true, ...initial });
  const [instance] = store.getState().activeComposers;
  const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
  store.addEventListener('change', () => {
    const current = store.getComposer(instance.id);
    if (current) el.instance = current;
  });
  return { store, el, id: instance.id };
}

const toField = (el: El) => el.shadowRoot!.querySelector('alps-address-input') as El;
const inputOf = (field: El) => field.shadowRoot!.querySelector('input') as HTMLInputElement;

/** Types into the To field and leaves the text there, not a pill. */
async function typeTo(el: El, text: string) {
  const field = toField(el);
  const input = inputOf(field);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await field.updateComplete;
  await el.updateComplete;
}

/** A press on a button elsewhere in the window: the field loses the focus first. */
const leaveField = (el: El) => inputOf(toField(el)).dispatchEvent(new FocusEvent('blur'));

const savedTo = (call: number) => (vi.mocked(messageOperations.saveDraft).mock.calls[call][0] as FormData).get('to');
const sendButton = (el: El) => shadow<El>(el, '.send-actions alps-button[variant="primary"]');

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  for (const store of stores.splice(0)) {
    const s = store as any;
    window.removeEventListener('session-cleared', s.handleSessionCleared);
    window.removeEventListener('user-logged-in', s.adoptSession);
    window.removeEventListener('alps-active-user-changed', s.adoptSession);
    if (s.saveTimeout !== null) window.clearTimeout(s.saveTimeout);
  }
  localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Close with an address typed in To', () => {
  it('saves the draft with it, and closes, when the save is quick', async () => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts' });
    const { store, el, id } = await composer({ to: ['ada@example.com'] });
    await typeTo(el, 'bob@example.com');

    leaveField(el);
    await el._handleCloseClick();

    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(savedTo(0)).toBe('ada@example.com, bob@example.com');
    expect(store.getComposer(id)).toBeUndefined();
  });

  it('saves the draft with it, and closes on the one press, when the save is slow', async () => {
    let land!: (answer: unknown) => void;
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft')
      .mockImplementationOnce(() => new Promise(resolve => { land = resolve; }) as any);
    const { store, el, id } = await composer({ to: ['ada@example.com'] });
    await typeTo(el, 'bob@example.com');
    vi.useFakeTimers();

    leaveField(el);
    const closing = el._handleCloseClick();
    await vi.advanceTimersByTimeAsync(200);
    land({ uid: '8', mailbox: 'Drafts' });
    await closing;

    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(savedTo(0)).toBe('ada@example.com, bob@example.com');
    expect(store.getComposer(id)).toBeUndefined();
  });

  it('takes it even while the field still has the focus', async () => {
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts' });
    const { store, el, id } = await composer({ to: ['ada@example.com'] });
    await typeTo(el, 'bob@example.com');

    await el._handleCloseClick();

    expect(savedTo(0)).toBe('ada@example.com, bob@example.com');
    expect(store.getComposer(id)).toBeUndefined();
  });
});

describe('Send with the only recipient typed in To', () => {
  it('can be pressed, and sends to it on the first press', async () => {
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');
    const { el } = await composer({ to: [] });
    await typeTo(el, 'bob@example.com');

    expect(sendButton(el).disabled).toBe(false);

    leaveField(el);
    sendButton(el).click();
    await waitFor(() => toasts.some(t => t.detail.message === 'composer.sending'), 'the undo toast');
    toasts.find(t => t.detail.message === 'composer.sending')!.detail.dismissFn();
    await waitFor(() => sendDraft.mock.calls.length > 0, 'the send');

    expect((sendDraft.mock.calls[0][0] as FormData).get('to')).toBe('bob@example.com');
  });

  it('stays disabled while what is typed is not an address', async () => {
    const { el } = await composer({ to: [] });
    await typeTo(el, 'bob');

    expect(sendButton(el).disabled).toBe(true);
  });
});
