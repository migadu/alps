import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import '../src/components/app-root';
import { registry } from '../src/plugin-registry';
import { cleanup, flush, mount } from './helpers/dom';

type Shell = HTMLElement & {
  updateComplete: Promise<unknown>;
  getRoutes(): Record<string, () => HTMLElement>;
  _fetchSessionData(): Promise<void>;
};

beforeEach(() => {
  history.replaceState(null, '', '#/login');
  registry.navTabs = [];
  registry.settingsTabs = [];
  registry.routes = [];
  registry.hooks = new Map();
  registry.setEnabledPlugins(['caldav', 'carddav']);
  registry.registerRoute({ path: '/dav-calendar', pluginId: 'caldav', component: 'div' });
  registry.registerRoute({ path: '/dav-contacts', pluginId: 'carddav', component: 'div' });
  registry.registerSettingsTab({ id: 'caldav', labelKey: 'calendar', icon: 'calendar', component: 'div' });
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({
    EnabledPlugins: ['caldav', 'carddav'], ActivePlugins: ['caldav', 'carddav'],
  })));
});

afterEach(() => {
  cleanup();
  registry.setEnabledPlugins(null);
  vi.unstubAllGlobals();
  history.replaceState(null, '', '#/');
});

it('replaces the previous DAV account page and refreshes connection availability after saving', async () => {
  const shell = await mount<Shell>('app-root');
  const firstCalendar = shell.getRoutes()['/dav-calendar']();
  const firstContacts = shell.getRoutes()['/dav-contacts']();
  window.dispatchEvent(new CustomEvent('dav-connections-updated', { detail: { service: 'caldav', configured: true } }));
  await flush();
  expect(fetch).toHaveBeenCalledWith('/session');
  expect(shell.getRoutes()['/dav-calendar']()).not.toBe(firstCalendar);
  expect(shell.getRoutes()['/dav-contacts']()).toBe(firstContacts);

  vi.stubGlobal('fetch', vi.fn(async () => Response.json({
    EnabledPlugins: ['caldav', 'carddav'], ActivePlugins: ['carddav'],
  })));
  window.dispatchEvent(new CustomEvent('dav-connections-updated', { detail: { service: 'caldav', configured: false } }));
  expect(shell.getRoutes()['/dav-calendar']).toBeUndefined();
  await flush();
  expect(shell.getRoutes()['/dav-calendar']).toBeUndefined();
  expect(registry.getSettingsTabs().map(tab => tab.id)).toEqual(['caldav']);
});

it('does not restore the previous account availability when a delayed session response arrives after logout', async () => {
  const shell = await mount<Shell>('app-root');
  let answer!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { answer = resolve; })));
  const pending = shell._fetchSessionData();
  window.dispatchEvent(new CustomEvent('session-cleared'));
  answer(Response.json({ EnabledPlugins: ['caldav'], ActivePlugins: ['caldav'] }));
  await pending;
  expect(registry.enabledPlugins).toBeNull();
  expect(registry.getRoutes().some(route => route.pluginId === 'caldav')).toBe(false);
});
