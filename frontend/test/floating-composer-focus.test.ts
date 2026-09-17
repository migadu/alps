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
