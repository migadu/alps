/**
 * What the mail page's lists report reaches the toast stack.
 *
 * Both lists report through a bubbling `toast` event, and the page turns it
 * into the app's `show-toast`. It did so for the folder list only, so
 * everything the message list reported — emptying Trash or Junk, and whether
 * that worked — was never shown.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/mailbox-page';
import { cleanup, mount, record, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

function settingsStore() {
  const state: Record<string, unknown> = {
    layoutMode: 'vertical',
    densityMode: 'compact',
    sortOrder: 'desc',
    messagesPerPage: 50,
    checkMailInterval: 0,
    loginUsername: 'ada@example.com',
  };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => {
      Object.assign(state, updates);
    },
  });
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('toasts from the mail page', () => {
  for (const list of ['alps-message-list', 'alps-folder-list']) {
    it(`shows what ${list} reports`, async () => {
      const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
      await waitFor(() => !!el.shadowRoot?.querySelector(list), list);
      const shown = record<CustomEvent>(window, 'show-toast');

      el.shadowRoot!.querySelector(list)!.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', message: 'Mailbox emptied successfully.' },
        bubbles: true,
        composed: true,
      }));

      expect(shown.map(e => e.detail.message)).toEqual(['Mailbox emptied successfully.']);
    });
  }
});
