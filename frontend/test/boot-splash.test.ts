/**
 * The boot ends on the first move from one page to another, and not on the
 * way into or out of the login screen.
 *
 * A page covers itself with the boot splash only while the app is booting
 * (`utils/boot-splash`). Ending the boot was left to the pages, and the
 * calendar and the tasks pages never did: a session loaded on either booted
 * until the first tab click, and that click drew the mailbox's splash, a white
 * page and a fade, where the user had only asked for Messages. The shell ends
 * it now, for every page. The e2e spec (boot-splash.spec.ts) is the browser's
 * half, with the real pages.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registry } from '../src/plugin-registry';
import { isBooting, resetBootForTests } from '../src/utils/boot-splash';
import { cleanup, flush, mount, waitFor } from './helpers/dom';

import '../src/components/app-root';

/** Stand-ins: what is under test is the shell's answer, not what a page draws. */
for (const id of ['alpha', 'beta']) {
  const tag = `boot-${id}-page`;
  if (!customElements.get(tag)) customElements.define(tag, class extends HTMLElement {});
  registry.registerRoute({ path: `/boot-${id}`, component: tag });
}

type AppRoot = HTMLElement & { updateComplete: Promise<unknown> };

const signIn = () => { document.cookie = 'alps_logged_in=1; path=/'; };

beforeEach(() => {
  resetBootForTests();
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.cookie = 'alps_logged_in=; path=/; max-age=0';
  history.replaceState(null, '', '#/');
});

/** The shell, loaded on `hash`. */
async function bootOn(hash: string): Promise<AppRoot> {
  history.replaceState(null, '', hash);
  const el = await mount<AppRoot>('app-root');
  await flush();
  await el.updateComplete;
  return el;
}

/** Follows a link from inside the app, and lets the shell route it. */
async function navigate(el: AppRoot, hash: string): Promise<void> {
  window.location.hash = hash;
  await waitFor(() => window.location.hash === hash, `the address ${hash}`);
  await flush();
  await el.updateComplete;
}

const onScreen = (el: AppRoot, tag: string) => el.shadowRoot!.querySelector(tag) !== null;

describe('the boot', () => {
  it('ends on the first move away from the page the app loaded on', async () => {
    signIn();
    const el = await bootOn('#/boot-alpha');
    expect(onScreen(el, 'boot-alpha-page')).toBe(true);
    expect(isBooting()).toBe(true);

    await navigate(el, '#/boot-beta');
    expect(onScreen(el, 'boot-beta-page')).toBe(true);
    expect(isBooting()).toBe(false);
  });

  it('outlasts the way to the login screen and out of it, and ends on the next move', async () => {
    // Signed out: the shell sends the page it was loaded on to the login screen.
    const el = await bootOn('#/boot-alpha');
    await waitFor(() => onScreen(el, 'login-page'), 'the login screen');
    await flush();
    expect(isBooting()).toBe(true);

    // What a sign-in does: the cookie, then the landing by assignment.
    signIn();
    await navigate(el, '#/boot-alpha');
    expect(onScreen(el, 'boot-alpha-page')).toBe(true);
    expect(isBooting()).toBe(true);

    await navigate(el, '#/boot-beta');
    expect(isBooting()).toBe(false);
  });
});
