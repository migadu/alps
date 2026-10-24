import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadComponent, PLUGIN_LOAD_FAILED_EVENT, registry, resetComponentLoadFailures } from '../src/plugin-registry';
import { Logger } from '../src/utils/logger';
import '../src/components/app-root';
import { cleanup, flush, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;
const listeners: EventListener[] = [];
function failures() {
  const events: CustomEvent[] = [];
  const listener = ((event: CustomEvent) => events.push(event)) as EventListener;
  listeners.push(listener);
  window.addEventListener(PLUGIN_LOAD_FAILED_EVENT, listener);
  return events;
}

beforeEach(() => {
  vi.spyOn(Logger, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  for (const listener of listeners.splice(0)) window.removeEventListener(PLUGIN_LOAD_FAILED_EVENT, listener);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  registry.routes = [];
  localStorage.clear();
  document.cookie = 'alps_logged_in=; Max-Age=0; path=/';
  window.location.hash = '';
});

describe('a plugin module that fails to define its page', () => {
  it('announces a fulfilled load with no definition, as after a handled Vite preload error', async () => {
    const events = failures();
    const entry = { component: 'lazy-fulfilled-without-tag', load: vi.fn().mockResolvedValue(undefined) };
    loadComponent(entry);
    await waitFor(() => events.length > 0, 'the missing definition notice');
    expect(events.map(event => event.detail)).toEqual([{ component: entry.component }]);

    // Toast re-renders do not create a notice loop.
    loadComponent(entry);
    await flush();
    loadComponent(entry);
    await flush();
    expect(events).toHaveLength(1);
    expect(Logger.error).toHaveBeenCalledTimes(1);

    // A real navigation rearms guidance for a later visit after dismissal.
    resetComponentLoadFailures();
    loadComponent(entry);
    await waitFor(() => events.length === 2, 'the revisited failure notice');
    loadComponent(entry);
    await flush();
    expect(events).toHaveLength(2);
  });

  it('preserves the loader method receiver', async () => {
    const component = 'lazy-method-receiver';
    const entry = {
      component,
      async load() { customElements.define(this.component, class extends HTMLElement {}); },
    };
    loadComponent(entry);
    await waitFor(() => !!customElements.get(component), 'the method-loaded page');
  });

  it.each(['throw', 'reject'] as const)('handles a loader that can %s without leaking the failure', async mode => {
    const events = failures();
    const error = new Error('offline');
    const entry = {
      component: `lazy-${mode}-failure`,
      load: vi.fn(() => { if (mode === 'throw') throw error; return Promise.reject(error); }),
    };
    expect(() => loadComponent(entry)).not.toThrow();
    await waitFor(() => events.length > 0, 'the load failure notice');
    expect(events).toHaveLength(1);
    expect(Logger.error).toHaveBeenCalledWith(`Failed to load <${entry.component}>`, error);
  });

  it('shares a pending load across renders and still upgrades the existing element in place', async () => {
    const events = failures();
    const component = 'lazy-delayed-upgrade';
    const page = document.body.appendChild(document.createElement(component));
    let finish!: () => void;
    const entry = { component, load: vi.fn(() => new Promise<void>(resolve => { finish = resolve; })) };
    loadComponent(entry);
    loadComponent(entry);
    expect(entry.load).toHaveBeenCalledTimes(1);
    class Page extends HTMLElement {}
    customElements.define(component, Page);
    finish();
    await flush();
    expect(page).toBeInstanceOf(Page);
    expect(events).toEqual([]);
    loadComponent(entry);
    expect(entry.load).toHaveBeenCalledTimes(1);
    page.remove();
  });

  it('does not retry a failed native import, and accepts a later external definition', async () => {
    const events = failures();
    const component = 'lazy-recovered-definition';
    const load = vi.fn().mockResolvedValue(undefined);
    const entry = { component, load };
    loadComponent(entry);
    await waitFor(() => events.length > 0, 'the initial failure');
    await flush();
    expect(loadComponent(entry)).toBe(false);
    expect(loadComponent(entry)).toBe(false);
    expect(load).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(1);
    customElements.define(component, class extends HTMLElement {});
    expect(loadComponent(entry)).toBe(true);
  });

  it('notifies every pending caller when their one shared import fails', async () => {
    const events = failures();
    let reject!: (error: Error) => void;
    const entry = { component: 'lazy-shared-failure', load: vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail; })) };
    const first = vi.fn();
    const second = vi.fn();
    expect(loadComponent(entry, first)).toBe(true);
    expect(loadComponent(entry, second)).toBe(true);
    expect(entry.load).toHaveBeenCalledTimes(1);
    reject(new Error('offline'));
    await waitFor(() => second.mock.calls.length > 0, 'both callers to draw recovery');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(1);
    expect(loadComponent(entry)).toBe(false);
    expect(entry.load).toHaveBeenCalledTimes(1);
  });
});

it('shows persistent translated recovery guidance and Back to Mail preserves the open composer', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })));
  document.cookie = 'alps_logged_in=1; path=/';
  const entry = { path: '/lazy-failed', component: 'lazy-root-failure', load: vi.fn().mockResolvedValue(undefined) };
  registry.registerRoute(entry);
  window.location.hash = '#/lazy-failed';
  const root = document.createElement('app-root') as El;
  // This shell test checks the notice and composer state; browser coverage
  // checks the actual editor without importing it into the registry unit test.
  vi.spyOn(root, 'ensureComposerLoaded').mockResolvedValue(undefined);
  root.composeStore.openComposer({ to: ['ada@example.com'], subject: 'Keep this', text: 'Still writing', dirty: true });
  document.body.appendChild(root);
  try {
    await waitFor(() => root.shadowRoot?.querySelector('alps-toast')?.hasAttribute('show') === true && root.toasts?.length === 1, 'the visible recovery toast');
    const toast = root.shadowRoot!.querySelector('alps-toast') as El;
    expect(toast.message).toBe(root.i18nStore.t('general.pageLoadFailed'));
    expect(toast.message).toContain('could not be loaded');
    expect(toast.actionLabel).toBe(root.i18nStore.t('general.backToMail'));
    expect(toast.timeout).toBe(0);
    await flush();
    expect(root.toasts).toHaveLength(1);
    toast.onAction();
    expect(window.location.hash).toBe('#/mailbox/INBOX');
    expect(root.composeStore.getState().activeComposers).toEqual([
      expect.objectContaining({ subject: 'Keep this', text: 'Still writing', dirty: true }),
    ]);
    const firstNotice = root.toasts[0].id;
    root._handleDismissToast(firstNotice);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await flush();
    window.location.hash = '#/lazy-failed';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await waitFor(() => root.toasts.some((item: any) => item.id !== firstNotice && item.show), 'recovery guidance on a failed revisit');
    expect(root.composeStore.getState().activeComposers[0].text).toBe('Still writing');
  } finally {
    root.remove();
  }
});
