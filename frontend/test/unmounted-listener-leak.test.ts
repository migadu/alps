import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/folder-list';
import '../src/components/alps-floating-composer';
import '../src/components/alps-sidebar';
import '../src/pages/mailbox-page';
import '../../plugins/carddav/frontend/contacts-page';
import { messageSync } from '../src/services/message-sync';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { cleanup, mount, record, shadow } from './helpers/dom';

describe('unmounted component listener leak prevention', () => {
  it('does not register store listeners if alps-folder-list is disconnected before updateComplete resolves', async () => {
    const composeStore = Object.assign(new EventTarget(), {
      getState: () => ({ activeComposers: [] }),
    });
    const addListenerSpy = vi.spyOn(composeStore, 'addEventListener');

    const el = document.createElement('alps-folder-list') as any;
    el.composeStore = composeStore;

    // Connect and immediately disconnect before updateComplete resolves
    document.body.appendChild(el);
    el.remove();

    await el.updateComplete;

    // Listener should not be added to an already disconnected element
    expect(addListenerSpy).not.toHaveBeenCalled();
  });

  it('does not register store listeners if alps-floating-composer is disconnected before updateComplete resolves', async () => {
    const i18nStore = Object.assign(new EventTarget(), {
      t: (k: string) => k,
    });
    const addListenerSpy = vi.spyOn(i18nStore, 'addEventListener');

    const el = document.createElement('alps-floating-composer') as any;
    el.instance = { id: 'test-composer' };
    el.i18nStore = i18nStore;

    document.body.appendChild(el);
    el.remove();

    await el.updateComplete;

    expect(addListenerSpy).not.toHaveBeenCalled();
  });
});

/**
 * A resize drag holds mousemove and mouseup listeners on the window. An
 * element that left the page mid-drag (a sign-out, a route change) kept them
 * until the next mouseup, and every move in between still resized it.
 */
describe('a resize drag in progress when the element leaves the page', () => {
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

  const press = (node: Element, clientX: number) =>
    node.dispatchEvent(new MouseEvent('mousedown', { clientX, bubbles: true, cancelable: true }));
  const move = (clientX: number) => window.dispatchEvent(new MouseEvent('mousemove', { clientX }));

  afterEach(() => {
    messageSync.stop();
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('alps-sidebar lets go of the window, and says the drag ended', async () => {
    const el = await mount<El>('alps-sidebar', { i18nStore, width: 250 });
    const resizes = record<CustomEvent>(el, 'sidebar-resize');
    const ends = record(el, 'drag-end');

    press(shadow(el, '.sidebar-resizer'), 250);
    move(300);
    expect(resizes.map((e) => e.detail.newWidth)).toEqual([300]);

    el.remove();
    expect(ends).toHaveLength(1);
    move(350);
    expect(resizes).toHaveLength(1);
  });

  it('the mail page lets go of the window, and is no longer dragging', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });

    press(shadow(el, '.resizer'), 630);
    move(700);
    expect(el.resizerPositionX).toBe(700);

    el.remove();
    expect(el.isPaneDragging).toBe(false);
    move(680);
    expect(el.resizerPositionX).toBe(700);
  });

  it('the contacts page lets go of the window, and is no longer dragging', async () => {
    vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [] } as never);
    const el = await mount<El>('contacts-page', { i18nStore, settingsStore: settingsStore() });

    press(shadow(el, '.resizer'), 400);
    move(450);
    expect(el.listWidth).toBe(430);

    el.remove();
    expect(el.isPaneDragging).toBe(false);
    move(500);
    expect(el.listWidth).toBe(430);
  });
});
