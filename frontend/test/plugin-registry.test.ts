/**
 * The plugin registry: registration, ordering, enablement and hooks.
 *
 * Every plugin's frontend is imported eagerly, whatever the deployment enables,
 * because that import is what registers it. Enablement arrives later from
 * /session and is applied by filtering, so `null` (not yet known) has to mean
 * everything and an empty set nothing — and hooks, routes and settings tabs
 * have to be filtered as well as the nav, or a disabled plugin keeps running.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registry } from '../src/plugin-registry';
import { Router } from '../src/router';

beforeEach(() => {
  registry.navTabs = [];
  registry.settingsTabs = [];
  registry.routes = [];
  registry.hooks = new Map();
  registry.enabledPlugins = null;
  vi.restoreAllMocks();
});

describe('registration', () => {
  it('keeps the first registration of a tab, settings tab or route', () => {
    registry.registerNavTab({ id: 'calendar', labelKey: 'nav.calendar' });
    registry.registerNavTab({ id: 'calendar', labelKey: 'nav.other' });
    registry.registerSettingsTab({ id: 'gpg', labelKey: 'a', icon: 'key', component: 'a-el' });
    registry.registerSettingsTab({ id: 'gpg', labelKey: 'b', icon: 'key', component: 'b-el' });
    registry.registerRoute({ path: '/calendar/*', component: 'calendar-page' });
    registry.registerRoute({ path: '/calendar/*', component: 'other-page' });

    expect(registry.getNavTabs().map((t) => t.labelKey)).toEqual(['nav.calendar']);
    expect(registry.getSettingsTabs().map((t) => t.component)).toEqual(['a-el']);
    expect(registry.getRoutes().map((r) => r.component)).toEqual(['calendar-page']);
  });
});

describe('ordering', () => {
  it('sorts nav tabs by their order, unordered ones last', () => {
    registry.registerNavTab({ id: 'unordered', labelKey: 'u' });
    registry.registerNavTab({ id: 'c', labelKey: 'c', order: 30 });
    registry.registerNavTab({ id: 'a', labelKey: 'a', order: 10 });
    expect(registry.getNavTabs().map((t) => t.id)).toEqual(['a', 'c', 'unordered']);
  });

  it('sorts a copy, not the registered list', () => {
    registry.registerNavTab({ id: 'b', labelKey: 'b', order: 2 });
    registry.registerNavTab({ id: 'a', labelKey: 'a', order: 1 });
    registry.getNavTabs();
    expect(registry.navTabs.map((t) => t.id)).toEqual(['b', 'a']);
  });
});

describe('enablement', () => {
  beforeEach(() => {
    registry.registerNavTab({ id: 'mail', labelKey: 'm' });
    registry.registerNavTab({ id: 'calendar', pluginId: 'caldav', labelKey: 'c' });
    registry.registerNavTab({ id: 'contacts', pluginId: 'carddav', labelKey: 'k' });
    registry.registerSettingsTab({ id: 'gpg', labelKey: 'g', icon: 'key', component: 'gpg-settings' });
    registry.registerRoute({ path: '/settings', component: 'settings-page' });
    registry.registerRoute({ path: '/calendar/*', pluginId: 'caldav', component: 'calendar-page' });
    registry.registerRoute({ path: '/contacts/*', pluginId: 'carddav', component: 'contacts-page' });
  });

  it('shows everything until the deployment has answered', () => {
    expect(registry.getNavTabs()).toHaveLength(3);
    expect(registry.getSettingsTabs()).toHaveLength(1);
    expect(registry.getRoutes()).toHaveLength(3);
  });

  it('keeps only what the enabled plugins own, matching on pluginId before id', () => {
    registry.setEnabledPlugins(['caldav', 'mail']);
    expect(registry.getNavTabs().map((t) => t.id)).toEqual(['mail', 'calendar']);
    expect(registry.getSettingsTabs()).toHaveLength(0);
  });

  it('leaves a disabled plugin\'s route out, not just its tab', () => {
    // The address bar reaches a route without the tab.
    registry.setEnabledPlugins(['carddav']);
    expect(registry.getRoutes().map((r) => r.path)).toEqual(['/settings', '/contacts/*']);

    const table: Record<string, () => unknown> = {};
    for (const route of registry.getRoutes()) table[route.path] = () => route.component;
    window.location.hash = '#/calendar/2026-08';
    expect(new Router(table, () => 'not-found', () => {}).render()).toBe('not-found');
    window.location.hash = '#/contacts/all';
    expect(new Router(table, () => 'not-found', () => {}).render()).toBe('contacts-page');
    window.location.hash = '';
  });

  it('keeps a route that belongs to no plugin when nothing is enabled', () => {
    registry.setEnabledPlugins([]);
    expect(registry.getRoutes().map((r) => r.path)).toEqual(['/settings']);
    expect(registry.getNavTabs()).toHaveLength(0);
  });

  it('announces a change once, and an unchanged answer not at all', () => {
    // /session is re-read on every sign-in and reconnect.
    const heard = vi.fn();
    window.addEventListener('plugins-updated', heard);
    registry.setEnabledPlugins(['caldav', 'carddav']);
    registry.setEnabledPlugins(['carddav', 'caldav']);
    registry.setEnabledPlugins(['caldav']);
    window.removeEventListener('plugins-updated', heard);
    expect(heard).toHaveBeenCalledTimes(2);
  });
});

describe('hooks', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('runs every handler with the payload and collects the results in order', () => {
    const seen: unknown[] = [];
    registry.registerHook('compose', (p: unknown) => (seen.push(p), 'a'));
    registry.registerHook('compose', () => 'b');
    const payload = { to: ['a@example.com'] };
    expect(registry.invokeHook('compose', payload)).toEqual(['a', 'b']);
    expect(seen).toEqual([payload]);
  });

  it('isolates a throwing handler on the synchronous path', () => {
    registry.registerHook('compose', () => {
      throw new Error('broken plugin');
    });
    registry.registerHook('compose', () => 'survivor');
    expect(registry.invokeHook('compose', {})).toEqual(['survivor']);
    expect(console.error).toHaveBeenCalled();
  });

  it('keeps what the other async handlers produced when one rejects', async () => {
    const ran: string[] = [];
    registry.registerHook('save', async () => (ran.push('a'), 'first'));
    registry.registerHook('save', async () => {
      ran.push('b');
      throw new Error('broken plugin');
    });
    registry.registerHook('save', async () => (ran.push('c'), 'third'));
    expect(await registry.invokeHookAsync('save', {})).toEqual(['first', 'third']);
    expect(ran).toEqual(['a', 'b', 'c']);
  });

  it('reports the failure count to a caller that must not proceed', async () => {
    // composer:presend: a GPG handler that threw has not approved the send.
    registry.registerHook('composer:presend', async () => 'ok');
    registry.registerHook('composer:presend', async () => {
      throw new Error('encryption failed');
    });
    expect(await registry.invokeHookSettled('composer:presend', {})).toEqual({ results: ['ok'], failed: 1 });
  });

  it('answers an unregistered hook with nothing', async () => {
    expect(registry.invokeHook('nobody', {})).toEqual([]);
    expect(await registry.invokeHookAsync('nobody', {})).toEqual([]);
    expect(await registry.invokeHookSettled('nobody', {})).toEqual({ results: [], failed: 0 });
  });

  it('skips a disabled plugin\'s handlers on both paths', async () => {
    const seen: string[] = [];
    registry.registerHook('composer:send', () => void seen.push('carddav'), 'carddav');
    registry.registerHook('composer:presend', async () => void seen.push('gpg'), 'gpg');
    registry.setEnabledPlugins(['caldav']);
    registry.invokeHook('composer:send', {});
    await registry.invokeHookAsync('composer:presend', {});
    expect(seen).toEqual([]);
  });

  it('runs a plugin\'s handlers before the deployment has answered, and when enabled', async () => {
    const seen: string[] = [];
    registry.registerHook('composer:send', async () => void seen.push('carddav'), 'carddav');
    await registry.invokeHookAsync('composer:send', {});
    registry.setEnabledPlugins(['carddav']);
    await registry.invokeHookAsync('composer:send', {});
    expect(seen).toEqual(['carddav', 'carddav']);
  });

  it('always runs a handler that belongs to no plugin', async () => {
    const seen: string[] = [];
    registry.registerHook('composer:send', async () => void seen.push('app'));
    registry.setEnabledPlugins([]);
    await registry.invokeHookAsync('composer:send', {});
    expect(seen).toEqual(['app']);
  });
});
