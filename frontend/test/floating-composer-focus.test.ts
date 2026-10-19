/**
 * A new composer window takes the keyboard at once.
 *
 * Focus used to move into the editor from a 100 ms timer, and until then it
 * stayed on the button that opened the window: a letter typed in that gap was
 * lost, and a space pressed Compose or Reply again.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, flush, mount } from './helpers/dom';
import type { ComposerInstance } from '../src/store/compose-store';
import '../src/components/alps-floating-composer';

// See floating-composer-send.test.ts: the picker's grid is slow to build and
// nothing here opens it.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const i18nStore = {
  t: (key: string) => key,
  addEventListener: () => {},
  removeEventListener: () => {},
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('a new composer window', () => {
  it('has the caret in its editor before any timer has run', async () => {
    const instance: ComposerInstance = { id: 'c1', to: [], subject: '', text: '', format: 'text' };
    const composeStore = {
      getState: () => ({ activeComposers: [instance] }),
      getComposer: () => instance,
      updateComposer: vi.fn(),
      bringComposerToFront: vi.fn(),
      closeComposer: vi.fn(),
    };

    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    vi.useFakeTimers();
    const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });
    const composer = el.shadowRoot!.querySelector('alps-message-composer') as El;
    await composer.updateComplete;
    // Microtasks only: the fake clock has not moved.
    for (let i = 0; i < 5; i++) await Promise.resolve();

    const editor = composer.shadowRoot!.querySelector('textarea');
    expect(editor).not.toBeNull();
    expect(composer.shadowRoot!.activeElement).toBe(editor);
    expect(document.activeElement).not.toBe(opener);
    vi.useRealTimers();
    await flush();
  });
});

/**
 * Tab from the subject line goes to the body.
 *
 * The formatting toolbar renders above the editor, inside the composer, so in
 * document order it sits between the subject and the body, and each of its
 * buttons is a tab stop: Tab from the subject landed on the first of them.
 */
describe('Tab from the subject', () => {
  /** The focused element, followed down through shadow roots. */
  const deepActive = (): Element | null => {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
  };

  /** TipTap's `focus` command focuses the view on the next animation frame. */
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

  async function open(format: 'html' | 'text' = 'html') {
    const instance: ComposerInstance = {
      id: 'c1',
      to: ['a@example.test'],
      subject: 's',
      text: 'Dear Bob, about the invoice',
      html: '<p>Dear Bob, about the invoice</p>',
      format,
    };
    const composeStore = {
      getState: () => ({ activeComposers: [instance] }),
      getComposer: () => instance,
      updateComposer: vi.fn(),
      bringComposerToFront: vi.fn(),
      closeComposer: vi.fn(),
    };
    const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });
    const body = el.shadowRoot!.querySelector('alps-message-composer') as El;
    await body.updateComplete;
    await flush();
    // Opening focuses the body, a frame late: let that land before the test
    // puts the user in the subject, or it lands afterwards and moves them.
    await nextFrame();
    const subject = el.shadowRoot!.querySelector('input.field-input') as HTMLInputElement;
    expect(subject).not.toBeNull();
    subject.focus();
    return { body, subject };
  }

  function press(target: HTMLElement, init: KeyboardEventInit) {
    const event = new KeyboardEvent('keydown', { bubbles: true, composed: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  }

  it('goes to the body, not the formatting toolbar', async () => {
    const { body, subject } = await open();
    expect(body.shadowRoot!.querySelector('.formatting-toolbar')).not.toBeNull();

    const tab = press(subject, { key: 'Tab' });

    expect(tab.defaultPrevented).toBe(true);
    await nextFrame();
    expect(body.shadowRoot!.querySelector('.editor-container')!.contains(deepActive())).toBe(true);
  });

  it('leaves the caret where the user left it', async () => {
    const { body, subject } = await open();
    const end = body.editor.state.doc.content.size - 1;
    body.editor.commands.setTextSelection(end);
    subject.focus();

    press(subject, { key: 'Tab' });
    await nextFrame();

    expect(body.editor.isFocused).toBe(true);
    expect(body.editor.state.selection.from).toBe(end);
  });

  it('goes to the plain-text body as well', async () => {
    const { body, subject } = await open('text');

    press(subject, { key: 'Tab' });

    expect(deepActive()).toBe(body.shadowRoot!.querySelector('textarea.reply-box'));
  });

  it.each([
    ['Shift+Tab', { shiftKey: true }],
    ['Ctrl+Tab', { ctrlKey: true }],
    ['Alt+Tab', { altKey: true }],
    ['Cmd+Tab', { metaKey: true }],
  ])('leaves %s to the browser', async (_name, modifiers) => {
    const { subject } = await open();

    const tab = press(subject, { key: 'Tab', ...modifiers });
    await nextFrame();

    expect(tab.defaultPrevented).toBe(false);
    expect(deepActive()).toBe(subject);
  });
});
