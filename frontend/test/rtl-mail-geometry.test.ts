/**
 * The mail page's own geometry in a right-to-left interface: the list splitter
 * is measured from the sidebar's side, the contacts list widens toward its
 * inline end, and composers dock in the bottom corner the reading direction
 * ends in. Each is arithmetic on physical coordinates that the stylesheets
 * cannot mirror for it.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow } from './helpers/dom';
import { messageSync } from '../src/services/message-sync';
import { ComposeStore } from '../src/store/compose-store';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import '../src/pages/mailbox-page';
import '../src/components/alps-floating-composer';
import '../../plugins/carddav/frontend/contacts-page';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

function settingsStore() {
  const state: Record<string, unknown> = { layoutMode: 'vertical', messagesPerPage: 50, checkMailInterval: 0, loginUsername: 'ada@example.com' };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: async (updates: Record<string, unknown>) => { Object.assign(state, updates); },
  });
}

/** Mounted with its direction already set, as a page with `dir` is. */
async function mountIn<T extends El>(direction: string, tag: string, props: Record<string, unknown>): Promise<T> {
  const el = document.createElement(tag) as T;
  Object.assign(el, props);
  el.style.direction = direction;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

const press = (node: Element, clientX: number) =>
  node.dispatchEvent(new MouseEvent('mousedown', { clientX, bubbles: true, cancelable: true }));
const move = (clientX: number) => window.dispatchEvent(new MouseEvent('mousemove', { clientX }));

afterEach(() => {
  window.dispatchEvent(new MouseEvent('mouseup'));
  messageSync.stop();
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('resizing', () => {
  it.each(['ltr', 'rtl'])('measures the list splitter from the inline start in %s', async (direction) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
    const el = await mountIn(direction, 'mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
    // 700px from the sidebar's edge of the window, whichever edge that is.
    const at = direction === 'rtl' ? window.innerWidth - 700 : 700;
    press(shadow(el, '.resizer'), at);
    move(at);
    expect(el.resizerPositionX).toBe(700);
  });

  it.each(['ltr', 'rtl'])('widens the contacts list toward its inline end in %s', async (direction) => {
    vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [] } as never);
    const el = await mountIn(direction, 'contacts-page', { i18nStore, settingsStore: settingsStore() });
    const outward = direction === 'rtl' ? -1 : 1;
    el.listWidth = 400;
    press(shadow(el, '.resizer'), 500);
    move(500 + 80 * outward);
    expect(el.listWidth).toBe(480);
    move(500 - 40 * outward);
    expect(el.listWidth).toBe(360);
  });
});

describe('docking', () => {
  it.each(['ltr', 'rtl'])('puts a composer in the inline-end corner in %s', async (direction) => {
    localStorage.setItem('alps_active_user', 'ada@example.com');
    const store = new ComposeStore();
    store.openComposer({ subject: 'Engines', text: 'Notes', format: 'text' });
    const [instance] = store.getState().activeComposers;
    const el = await mountIn(direction, 'alps-floating-composer', { instance, composeStore: store, i18nStore, windowWidth: 1400, windowHeight: 900 });
    // 470px wide, 24px in from the corner.
    expect(el.style.left).toBe(direction === 'rtl' ? '24px' : `${1400 - 24 - 470}px`);
  });
});
