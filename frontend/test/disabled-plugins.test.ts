/**
 * A plugin the server has turned off is gone from the app, not only from its
 * tabs.
 *
 * Every plugin's frontend is compiled in; /session says which are on. The
 * registry leaves a disabled plugin out of the header, the settings sidebar
 * and the route table. But the shell built its router once, before /session
 * answered, with every plugin's routes in it, so `#/calendar` typed into the
 * address bar still mounted the page of a plugin that was off. The shell read
 * /session only when the page loaded already signed in, so a sign-in on the
 * login page left every plugin on for the whole session, and a sign-out kept
 * the last account's answer. And the settings page drew its sidebar before
 * /session answered and was not drawn again after.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/app-root';
import '../src/components/settings-window';
import { registry } from '../src/plugin-registry';
import { SettingsStore } from '../src/store/settings-store';
import { cleanup, flush, mount, waitFor } from './helpers/dom';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const USER = 'ada@example.com';
const signedIn = () => {
  document.cookie = 'alps_logged_in=1';
  localStorage.setItem('alps_active_user', USER);
};

/** fetch, answering /session with the plugins given and anything else with 404. */
function serverWith(enabledPlugins: string[]) {
  return vi.fn(async (input: RequestInfo | URL) => {
    if (String(input) === '/session') {
      return new Response(JSON.stringify({ Username: USER, EnabledPlugins: enabledPlugins }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404 });
  });
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

afterEach(() => {
  cleanup();
  registry.routes = [];
  registry.settingsTabs = [];
  registry.enabledPlugins = null;
  document.cookie = 'alps_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  localStorage.clear();
  window.location.hash = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the shell, for a plugin the server has turned off', () => {
  it('answers its address with the 404 page, and drops the page it had made', async () => {
    registry.registerRoute({ path: '/offplug', component: 'offplug-page', pluginId: 'offplug' });
    signedIn();
    window.location.hash = '#/offplug';
    const root = await mount<El>('app-root');
    // Before /session answers, every plugin counts as on.
    expect(root.shadowRoot!.querySelector('offplug-page')).not.toBeNull();

    registry.setEnabledPlugins(['base']);
    await root.updateComplete;
    await flush();

    expect(root.shadowRoot!.querySelector('offplug-page')).toBeNull();
    expect(root.shadowRoot!.textContent).toContain('404');
    expect(root.pluginPages.has('/offplug')).toBe(false);
  });

  it('asks /session which plugins are on when the user signs in without a reload', async () => {
    vi.stubGlobal('fetch', serverWith(['base']));
    window.location.hash = '#/login';
    await mount<El>('app-root');
    expect(registry.enabledPlugins).toBeNull();

    signedIn();
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: USER } }));

    await waitFor(() => registry.enabledPlugins !== null, 'the plugins /session names');
    expect([...registry.enabledPlugins!]).toEqual(['base']);
  });

  it('forgets which plugins were on when the session ends', async () => {
    signedIn();
    await mount<El>('app-root');
    registry.setEnabledPlugins(['base']);

    window.dispatchEvent(new CustomEvent('session-cleared'));

    expect(registry.enabledPlugins).toBeNull();
  });

  it('ignores a delayed session answer after the session has ended', async () => {
    // The settings store has its own separately guarded identity read. Keep
    // this regression on the shell's plugin-list read.
    vi.spyOn(SettingsStore.prototype as any, 'initializeSession').mockResolvedValue(undefined);
    let answer!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => String(input) === '/session'
      ? new Promise<Response>(resolve => { answer = resolve; })
      : Promise.resolve(new Response('{}', { status: 404 }))));
    signedIn();
    await mount<El>('app-root');
    window.dispatchEvent(new CustomEvent('session-cleared'));
    answer(Response.json({ EnabledPlugins: ['base', 'offplug'] }));
    await flush();
    await flush();
    expect(registry.enabledPlugins).toBeNull();
  });

  it('keeps the next account answer when an older session answers later', async () => {
    vi.spyOn(SettingsStore.prototype as any, 'initializeSession').mockResolvedValue(undefined);
    const answers: ((response: Response) => void)[] = [];
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => String(input) === '/session'
      ? new Promise<Response>(resolve => { answers.push(resolve); })
      : Promise.resolve(new Response('{}', { status: 404 }))));
    signedIn();
    await mount<El>('app-root');
    window.dispatchEvent(new CustomEvent('session-cleared'));
    localStorage.setItem('alps_active_user', 'grace@example.com');
    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: 'grace@example.com' } }));
    expect(answers).toHaveLength(2);
    answers[1](Response.json({ EnabledPlugins: ['base'] }));
    await flush(); await flush();
    expect([...registry.enabledPlugins!]).toEqual(['base']);
    answers[0](Response.json({ EnabledPlugins: ['base', 'offplug'] }));
    await flush(); await flush();
    expect([...registry.enabledPlugins!]).toEqual(['base']);
  });

  it('does not let a disconnected shell overwrite the current plugin list', async () => {
    vi.spyOn(SettingsStore.prototype as any, 'initializeSession').mockResolvedValue(undefined);
    let answer!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => String(input) === '/session'
      ? new Promise<Response>(resolve => { answer = resolve; })
      : Promise.resolve(new Response('{}', { status: 404 }))));
    signedIn();
    const root = await mount<El>('app-root');
    root.remove();
    registry.setEnabledPlugins(['base']);
    answer(Response.json({ EnabledPlugins: ['base', 'offplug'] }));
    await flush(); await flush();
    expect([...registry.enabledPlugins!]).toEqual(['base']);
  });

  it('refreshes routes and drops disabled cached pages when reconnected', async () => {
    registry.registerRoute({ path: '/offplug', component: 'offplug-page', pluginId: 'offplug' });
    signedIn();
    window.location.hash = '#/offplug';
    const root = await mount<El>('app-root');
    expect(root.shadowRoot!.querySelector('offplug-page')).not.toBeNull();

    root.remove();
    registry.setEnabledPlugins(['base']);
    document.body.append(root);
    await root.updateComplete;
    await flush();

    expect(root.shadowRoot!.querySelector('offplug-page')).toBeNull();
    expect(root.pluginPages.has('/offplug')).toBe(false);
    expect(root.shadowRoot!.textContent).toContain('404');
  });
});

describe('the settings page, for a plugin the server has turned off', () => {
  const i18nStore = Object.assign(new EventTarget(), {
    t: (key: string) => key,
    getLanguage: () => 'en',
    getIntlLanguage: () => 'en',
  });
  const settingsStore = () => {
    const state = { ...new SettingsStore().getState(), checkMailInterval: 0, loginUsername: USER };
    return Object.assign(new EventTarget(), { getState: () => state, updateSettings: async () => {} });
  };
  const tabs = (el: El) =>
    [...el.shadowRoot!.querySelectorAll('alps-category-item')].map(item => item.textContent!.trim());

  it('takes its tab out of the sidebar once /session answers', async () => {
    registry.registerSettingsTab({
      id: 'offplug',
      pluginId: 'offplug',
      labelKey: 'offplug.tab',
      icon: 'tune',
      component: 'offplug-settings',
    });
    const el = await mount<El>('settings-window', { i18nStore, settingsStore: settingsStore() });
    expect(tabs(el)).toContain('offplug.tab');

    registry.setEnabledPlugins(['base']);
    await el.updateComplete;

    expect(tabs(el)).not.toContain('offplug.tab');
  });

  it('removes the settings pane already shown for a disabled plugin', async () => {
    registry.registerSettingsTab({ id: 'offplug', pluginId: 'offplug', labelKey: 'offplug.tab', icon: 'tune', component: 'offplug-settings' });
    const el = await mount<El>('settings-window', { category: 'offplug', i18nStore, settingsStore: settingsStore() });
    expect(el.shadowRoot!.querySelector('offplug-settings')).not.toBeNull();
    registry.setEnabledPlugins(['base']);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('offplug-settings')).toBeNull();
  });
});
