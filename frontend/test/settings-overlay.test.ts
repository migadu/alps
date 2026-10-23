/**
 * Settings opens as a window over the page it was opened from.
 *
 * The shell used to route `#/settings` to a page of its own, which unmounted
 * whatever the user was reading; its Back button then went to `#/`, the Inbox,
 * wherever they had been. Now the page stays mounted beneath the window:
 *
 *  - the SAME element, so its folder, open message, scroll and live data are
 *    all still there when the window closes;
 *  - dimmed and inert, in a stacking context of its own at 0, so the window
 *    (and the composers above it) cover the page's header too, and neither a
 *    click nor Tab reaches it;
 *  - closed back onto by Close, Escape and the browser's Back alike, by
 *    walking the history back to the entry it was opened from — choosing a
 *    section replaces the entry rather than pushing one, and a navigation from
 *    one section to another by URL is walked back over;
 *  - drawn from the stamped entry on a reload, and as the mailbox under a
 *    direct load, which closes onto the Inbox's URL.
 *
 * The plugin page here is a stand-in: what is under test is which element the
 * shell keeps and what the URL says. One case mounts the real mailbox, whose
 * own hash handling is the half that used to reset it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registry } from '../src/plugin-registry';
import { messageSync } from '../src/services/message-sync';
import { settingsEntry } from '../src/utils/settings-history';
import { cleanup, flush, mount, waitFor } from './helpers/dom';

import '../src/components/app-root';

const PAGE = 'overlay-notes-page';
if (!customElements.get(PAGE)) customElements.define(PAGE, class extends HTMLElement {});
registry.registerRoute({ path: '/notes/*', component: PAGE });

type AppRoot = HTMLElement & { updateComplete: Promise<unknown> };

beforeEach(() => {
  // Signed in, so the shell does not send itself to the login page.
  document.cookie = 'alps_logged_in=1; path=/';
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));
});

afterEach(() => {
  cleanup();
  messageSync.stop();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.cookie = 'alps_logged_in=; path=/; max-age=0';
  history.replaceState(null, '', '#/');
});

async function shell(hash: string, state: unknown = null): Promise<AppRoot> {
  history.replaceState(state, '', hash);
  const el = await mount<AppRoot>('app-root');
  await flush();
  await el.updateComplete;
  return el;
}

/** A navigation, the browser's way: the hash, then the event as a task. */
async function go(el: AppRoot, hash: string): Promise<void> {
  window.location.hash = hash;
  await settle(el);
}

async function settle(el: AppRoot): Promise<void> {
  await flush();
  await flush();
  await el.updateComplete;
}

const windowOf = (el: AppRoot) =>
  el.shadowRoot!.querySelector('settings-window') as (HTMLElement & { category: string }) | null;
const routeView = (el: AppRoot) => el.shadowRoot!.querySelector('.route-view') as HTMLElement;
const notes = (el: AppRoot) => el.shadowRoot!.querySelector(PAGE);

/** What the window's Close (or Escape) asks the shell for. */
async function close(el: AppRoot): Promise<void> {
  windowOf(el)!.dispatchEvent(new CustomEvent('settings-close', { bubbles: true, composed: true }));
  await waitFor(() => windowOf(el) === null, 'the window to close');
  await settle(el);
}

describe('opening Settings', () => {
  it('keeps the page it was opened from mounted beneath the window', async () => {
    const el = await shell('#/notes/all');
    const page = notes(el);
    expect(page).not.toBeNull();

    await go(el, '#/settings/appearance');
    expect(windowOf(el)?.category).toBe('appearance');
    expect(notes(el)).toBe(page);
  });

  it('dims the page and takes it out of reach while the window is up', async () => {
    const el = await shell('#/notes/all');
    expect(routeView(el).hasAttribute('inert')).toBe(false);
    expect(routeView(el).classList.contains('behind-window')).toBe(false);

    await go(el, '#/settings/appearance');
    expect(routeView(el).hasAttribute('inert')).toBe(true);
    // Its own stacking context at 0, or the page's header (z-index 20000)
    // would be drawn over the window.
    expect(routeView(el).classList.contains('behind-window')).toBe(true);

    await close(el);
    expect(routeView(el).hasAttribute('inert')).toBe(false);
    expect(routeView(el).classList.contains('behind-window')).toBe(false);
  });

  it('is the login screen for a visitor with no session', async () => {
    document.cookie = 'alps_logged_in=; path=/; max-age=0';
    const el = await shell('#/settings/appearance');
    await settle(el);
    expect(windowOf(el)).toBeNull();
    expect(el.shadowRoot!.querySelector('login-page')).not.toBeNull();
  });
});

describe('closing Settings', () => {
  it('goes back to the page it was opened from, as it was', async () => {
    const el = await shell('#/notes/all');
    const page = notes(el);
    await go(el, '#/settings/appearance');

    await close(el);
    expect(window.location.hash).toBe('#/notes/all');
    expect(notes(el)).toBe(page);
  });

  it('switches sections in place, so the same single step closes it', async () => {
    const el = await shell('#/notes/all');
    await go(el, '#/settings/appearance');
    const entries = history.length;

    windowOf(el)!.dispatchEvent(new CustomEvent('settings-category', {
      detail: { category: 'localization' }, bubbles: true, composed: true,
    }));
    await settle(el);
    expect(window.location.hash).toBe('#/settings/localization');
    expect(history.length).toBe(entries);
    expect(windowOf(el)?.category).toBe('localization');
    expect(settingsEntry()).toEqual({ depth: 1, background: '#/notes/all' });

    await close(el);
    expect(window.location.hash).toBe('#/notes/all');
  });

  it('walks back over a navigation from one section to another', async () => {
    const el = await shell('#/notes/all');
    await go(el, '#/settings/appearance');
    await go(el, '#/settings/localization');
    expect(settingsEntry()).toEqual({ depth: 2, background: '#/notes/all' });

    await close(el);
    expect(window.location.hash).toBe('#/notes/all');
    expect(windowOf(el)).toBeNull();
  });

  it('closes when the browser goes Back, like any other page', async () => {
    const el = await shell('#/notes/all');
    await go(el, '#/settings/appearance');
    history.back();
    await waitFor(() => windowOf(el) === null, 'Back to close the window');
    expect(window.location.hash).toBe('#/notes/all');
  });
});

describe('a Settings URL loaded directly', () => {
  it('draws the mailbox beneath, without rewriting the URL', async () => {
    const el = await shell('#/settings/appearance');
    expect(window.location.hash).toBe('#/settings/appearance');
    expect(windowOf(el)?.category).toBe('appearance');
    expect(el.shadowRoot!.querySelector('mailbox-page')).not.toBeNull();
    expect(settingsEntry()).toBeNull();
  });

  it("closes onto the Inbox's URL, over the same mailbox", async () => {
    const el = await shell('#/settings/appearance');
    const mailbox = el.shadowRoot!.querySelector('mailbox-page');
    const entries = history.length;
    await close(el);
    expect(window.location.hash).toBe('#/');
    // Replaced, not pushed: Back from the mail does not reopen the window.
    expect(history.length).toBe(entries);
    expect(el.shadowRoot!.querySelector('mailbox-page')).toBe(mailbox);
  });

  it('draws the page a reloaded entry was opened over', async () => {
    const el = await shell('#/settings/appearance', { alpsSettings: { depth: 1, background: '#/notes/all' } });
    expect(notes(el)).not.toBeNull();
    expect(el.shadowRoot!.querySelector('mailbox-page')).toBeNull();
  });

  it('draws the mailbox for a background that is never beneath', async () => {
    const el = await shell('#/settings/appearance', { alpsSettings: { depth: 1, background: '#/print?uid=1' } });
    expect(el.shadowRoot!.querySelector('print-page')).toBeNull();
    expect(el.shadowRoot!.querySelector('mailbox-page')).not.toBeNull();
  });
});

describe('the mailbox beneath the window', () => {
  type Mailbox = HTMLElement & {
    currentMailbox: string;
    targetUid: string | null;
    filterQuery: string;
  };

  it('keeps its folder, its open message and its search', async () => {
    // The mailbox read `#/settings` as a URL naming no folder, which is the
    // Inbox, and dropped the message and the search with it.
    const el = await shell('#/mailbox/Work?uid=7&q=invoice');
    const page = el.shadowRoot!.querySelector('mailbox-page') as Mailbox;
    expect(page.currentMailbox).toBe('Work');

    await go(el, '#/settings/appearance');
    expect(el.shadowRoot!.querySelector('mailbox-page')).toBe(page);
    expect(page.currentMailbox).toBe('Work');
    expect(page.targetUid).toBe('7');
    expect(page.filterQuery).toBe('invoice');

    await close(el);
    expect(window.location.hash).toBe('#/mailbox/Work?uid=7&q=invoice');
    expect(page.currentMailbox).toBe('Work');
  });
});
