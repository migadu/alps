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

it('keeps the kept pages when a save left the connection as it was', async () => {
  const shell = await mount<Shell>('app-root');
  const calendar = shell.getRoutes()['/dav-calendar']();
  window.dispatchEvent(new CustomEvent('dav-connections-updated', { detail: { service: 'caldav', configured: true, unchanged: true } }));
  await flush();
  expect(shell.getRoutes()['/dav-calendar']()).toBe(calendar);
});

it('shows the DAV pages an account had before /session answers, and corrects them when it does', async () => {
  registry.setEnabledPlugins(null);
  localStorage.setItem('alps_active_user', 'ada@example.test');
  localStorage.setItem('alps_dav_active:ada@example.test', JSON.stringify(['caldav', 'gpg']));
  let answer!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { answer = resolve; })));
  const shell = await mount<Shell>('app-root');
  const pending = shell._fetchSessionData();
  // A reload on the calendar has its page at once; contacts, which the
  // account had no connection for, waits for the answer.
  expect(shell.getRoutes()['/dav-calendar']).toBeDefined();
  expect(shell.getRoutes()['/dav-contacts']).toBeUndefined();
  answer(Response.json({ EnabledPlugins: ['caldav', 'carddav'], ActivePlugins: ['carddav'] }));
  await pending;
  expect(shell.getRoutes()['/dav-calendar']).toBeUndefined();
  expect(shell.getRoutes()['/dav-contacts']).toBeDefined();
  expect(JSON.parse(localStorage.getItem('alps_dav_active:ada@example.test')!)).toEqual(['carddav']);
  // Signing out forgets it for the page; the next account starts unknown.
  window.dispatchEvent(new CustomEvent('session-cleared'));
  expect(shell.getRoutes()['/dav-contacts']).toBeUndefined();
  localStorage.clear();
});

it('asks /session again after a failure instead of leaving the DAV pages off', async () => {
  registry.setEnabledPlugins(null);
  vi.useFakeTimers();
  try {
    const shell = await mount<Shell>('app-root');
    const failing = vi.fn(async () => new Response('', { status: 502 }));
    vi.stubGlobal('fetch', failing);
    await shell._fetchSessionData();
    expect(failing).toHaveBeenCalledTimes(1);
    expect(shell.getRoutes()['/dav-calendar']).toBeUndefined();
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ EnabledPlugins: ['caldav'], ActivePlugins: ['caldav'] })));
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(shell.getRoutes()['/dav-calendar']).toBeDefined();
    // An answer ends the asking, and so does an ended session.
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetch).toHaveBeenCalledTimes(1);
    const ended = vi.fn(async () => new Response('', { status: 401 }));
    vi.stubGlobal('fetch', ended);
    await shell._fetchSessionData();
    await vi.advanceTimersByTimeAsync(60000);
    expect(ended).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});
