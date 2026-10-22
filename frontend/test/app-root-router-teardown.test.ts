/**
 * A shell routes only while it is in the document.
 *
 * The router listened for `hashchange` on `window` from the moment it was
 * built and never stopped, and nothing in app-root's teardown detached it. A
 * removed shell therefore went on re-rendering on every hash change, for the
 * rest of the page's life. Production mounts one `<app-root>`, so what this
 * cost was every test that mounts one: each left a live listener behind.
 *
 * A shell put back into the document routes again, from the URL as it is
 * then, not as it was when it left.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registry } from '../src/plugin-registry';
import { cleanup, flush, mount } from './helpers/dom';

import '../src/components/app-root';

/** Stand-ins for two plugin pages: what is under test is which one a shell
 * mounts, not what they render. */
for (const id of ['alpha', 'beta']) {
  const tag = `teardown-${id}-page`;
  if (!customElements.get(tag)) customElements.define(tag, class extends HTMLElement {});
  registry.registerRoute({ path: `/teardown-${id}`, component: tag });
}

type AppRoot = HTMLElement & { updateComplete: Promise<unknown>; render(): unknown };

beforeEach(() => {
  // Signed in, so the shell does not send itself to the login page, and every
  // request it makes on the way answers with nothing.
  document.cookie = 'alps_logged_in=1; path=/';
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.cookie = 'alps_logged_in=; path=/; max-age=0';
  history.replaceState(null, '', '#/');
});

/** Mounts a shell at `hash` and lets it land. */
async function shell(hash: string): Promise<AppRoot> {
  history.replaceState(null, '', hash);
  const el = await mount<AppRoot>('app-root');
  await flush();
  await el.updateComplete;
  return el;
}

/** A navigation, the browser's way: the hash, then the event as a task. */
async function go(hash: string): Promise<void> {
  window.location.hash = hash;
  await flush();
  await flush();
}

const page = (el: AppRoot, id: string) => el.shadowRoot!.querySelector(`teardown-${id}-page`);

describe('a shell removed from the document', () => {
  it('does not render when the hash changes', async () => {
    const old = await shell('#/teardown-alpha');
    expect(page(old, 'alpha')).not.toBeNull();
    old.remove();

    const renders = vi.spyOn(old, 'render');
    await go('#/teardown-beta');
    await old.updateComplete;
    expect(renders).not.toHaveBeenCalled();
  });

  it('leaves the shell that replaced it to route on its own', async () => {
    (await shell('#/teardown-alpha')).remove();

    const current = await shell('#/teardown-alpha');
    await go('#/teardown-beta');
    await current.updateComplete;
    expect(page(current, 'beta')).not.toBeNull();
  });
});

describe('a shell put back into the document', () => {
  it('routes again, from the URL as it is now', async () => {
    const el = await shell('#/teardown-alpha');
    el.remove();
    await go('#/teardown-beta');

    document.body.appendChild(el);
    await flush();
    await el.updateComplete;
    expect(page(el, 'beta')).not.toBeNull();

    await go('#/teardown-alpha');
    await el.updateComplete;
    expect(page(el, 'alpha')).not.toBeNull();
  });
});
