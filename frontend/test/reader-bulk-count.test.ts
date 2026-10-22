/**
 * What the reader says while several messages are checked.
 *
 * It said the number, then a bare "messages selected" from the dictionary, so
 * one checked message read "1 messages selected". Serbian could not be right
 * either: its noun takes a different form for 1, for 2 to 4 and for 5, and a
 * string that never sees the number cannot pick one. The count is now inside
 * one translated sentence, a plural key.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../src/components/message-reader';
import { cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount } from './helpers/dom';
import { I18nStore } from '../src/store/i18n-store';

type El = HTMLElement & Record<string, any>;

function settingsStore() {
  const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

async function sentence(language: string, selectedCount: number): Promise<string | undefined> {
  const i18nStore = new I18nStore();
  await i18nStore.setLanguage(language);
  const el = await mount<El>('alps-message-reader', { i18nStore, settingsStore: settingsStore(), selectedCount });
  return el.shadowRoot!.querySelector('.empty-reader-state > span')?.textContent?.trim();
}

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
});

afterEach(cleanup);

describe('the bulk selection count', () => {
  it.each([
    ['en', 1, '1 message selected'],
    ['en', 3, '3 messages selected'],
    ['de', 1, '1 Nachricht ausgewählt'],
    ['sr', 1, '1 izabrana poruka'],
    ['sr', 3, '3 izabrane poruke'],
    ['sr', 5, '5 izabranih poruka'],
    ['sr', 21, '21 izabrana poruka'],
    ['rs', 3, '3 изабране поруке'],
  ])('reads %s %i as one sentence', async (language, count, expected) => {
    expect(await sentence(language, count)).toBe(expected);
  });
});
