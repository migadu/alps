/**
 * The composer's Insert Link popup.
 *
 * Its fields are `alps-input` elements, whose `<input>` sits in their own
 * shadow root. The popup read and reset `#linkPopup input` from its own, which
 * matches nothing there: Apply inserted no link, whatever was typed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, waitFor } from './helpers/dom';
import type { ComposerInstance } from '../src/store/compose-store';
import '../src/components/alps-floating-composer';

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
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

async function composerWindow(): Promise<El> {
  const instance: ComposerInstance = { id: 'c1', to: [], subject: '', text: '', format: 'html' };
  const composeStore = {
    getState: () => ({ activeComposers: [instance] }),
    getComposer: () => instance,
    updateComposer: vi.fn(),
    bringComposerToFront: vi.fn(),
    closeComposer: vi.fn(),
  };
  const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });
  const composer = el.shadowRoot!.querySelector('alps-message-composer') as El;
  await composer.updateComplete;
  await waitFor(() => !!composer.editor, 'the editor');
  return el;
}

const fields = (el: El) => Array.from(el.shadowRoot!.querySelectorAll<El>('#linkPopup alps-input'));

describe('the Insert Link popup', () => {
  it('inserts the link that was typed, where the caret was', async () => {
    const el = await composerWindow();
    const editor = (el.shadowRoot!.querySelector('alps-message-composer') as El).editor;
    editor.commands.setContent('<p>See:</p>');
    editor.commands.focus('end');
    el._handleLinkClick();
    await el.updateComplete;
    const [text, url] = fields(el);
    expect([text?.inputId, url?.inputId]).toEqual(['text', 'url']);
    text.value = 'Example';
    url.value = 'https://example.com/';
    // The window re-renders while the user types, as the editor and autosave
    // make it; what was typed stays.
    el.requestUpdate();
    await el.updateComplete;

    el._handleLinkSubmit();

    expect(editor.getHTML()).toMatch(/<p>See:<a [^>]*href="https:\/\/example\.com\/"[^>]*>Example<\/a><\/p>/);
  });

  it('opens with the fields cleared of what was typed last time', async () => {
    const el = await composerWindow();
    el._handleLinkClick();
    await el.updateComplete;
    fields(el)[1].value = 'https://left-over.example/';

    el._handleLinkClick();
    await el.updateComplete;

    expect(fields(el).map(f => f.value)).toEqual(['', '']);
  });
});
