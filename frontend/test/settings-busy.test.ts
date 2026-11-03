/**
 * An unsaved Settings edit holds automatic reloads back, as an open composer
 * does.
 *
 * app-update reloads a tab on its own when a newer build is live and the tab
 * has been hidden for half an hour, and when a page's module is gone from the
 * server; it first asks the shell whether the user is in the middle of
 * something (its busy probe). The shell answered for the composers alone, so
 * either reload threw away a Filters or Auto-reply edit not yet saved: in the
 * open Settings window, or kept in memory for the section's next visit after
 * the window went (managesieve's `UnsavedEdit`). It answers for both now.
 *
 * The section here is a stand-in that says whether it has unsaved changes;
 * the kept edit is the real `UnsavedEdit`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registry } from '../src/plugin-registry';
import { messageSync } from '../src/services/message-sync';
import { cleanup, flush, mount, waitFor } from './helpers/dom';
import { UnsavedEdit } from '../../plugins/managesieve/frontend/unsaved';

const probe = vi.hoisted(() => ({ current: null as (() => boolean) | null }));
vi.mock('../src/services/app-update', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/services/app-update')>()),
  registerBusyProbe: (fn: (() => boolean) | null) => { probe.current = fn; },
}));

import '../src/components/app-root';

const PAGE = 'busy-notes-page';
if (!customElements.get(PAGE)) customElements.define(PAGE, class extends HTMLElement {});
registry.registerRoute({ path: '/busy-notes/*', component: PAGE });

/** A section with a Save of its own, and an edit not saved while `unsaved`. */
const SECTION = 'busy-form-section';
let unsaved = false;
if (!customElements.get(SECTION)) {
  customElements.define(SECTION, class extends HTMLElement {
    get hasUnsavedChanges() { return unsaved; }
  });
}
registry.registerSettingsTab({ id: 'busy-form', labelKey: 'busy-form', icon: 'gear', component: SECTION });

type AppRoot = HTMLElement & { updateComplete: Promise<unknown> };

beforeEach(() => {
  unsaved = false;
  document.cookie = 'alps_logged_in=1; path=/';
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));
});

afterEach(() => {
  cleanup();
  messageSync.stop();
  window.dispatchEvent(new CustomEvent('session-cleared'));
  vi.unstubAllGlobals();
  document.cookie = 'alps_logged_in=; path=/; max-age=0';
  history.replaceState(null, '', '#/');
});

async function shell(hash: string): Promise<AppRoot> {
  history.replaceState(null, '', hash);
  const el = await mount<AppRoot>('app-root');
  await flush();
  await el.updateComplete;
  return el;
}

const busy = () => probe.current?.() ?? false;

describe('the shell holds an automatic reload back', () => {
  it('while the open Settings section has unsaved changes', async () => {
    const el = await shell('#/busy-notes/all');
    window.location.hash = '#/settings/busy-form';
    await waitFor(() => !!el.shadowRoot!.querySelector(`settings-window`)?.shadowRoot?.querySelector(SECTION), 'the section');
    expect(busy()).toBe(false);

    unsaved = true;
    expect(busy()).toBe(true);

    unsaved = false;
    expect(busy()).toBe(false);
  });

  it('while a section keeps an unsaved edit for its next visit', async () => {
    await shell('#/busy-notes/all');
    const edit = new UnsavedEdit<string>();
    const visit = edit.visit();
    expect(busy()).toBe(false);

    edit.keep('as stored', 'as typed', visit);
    expect(busy()).toBe(true);

    // The next visit takes it back, and its section answers for it again.
    edit.take('as stored', edit.visit());
    expect(busy()).toBe(false);
  });

  it('not for an edit the session that kept it has ended', async () => {
    await shell('#/busy-notes/all');
    const edit = new UnsavedEdit<string>();
    edit.keep('as stored', 'as typed', edit.visit());
    expect(busy()).toBe(true);

    window.dispatchEvent(new CustomEvent('session-cleared'));
    expect(busy()).toBe(false);
  });
});
