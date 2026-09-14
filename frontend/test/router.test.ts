/**
 * The hash router.
 *
 * It fails by showing the wrong page rather than by throwing. The subtleties are
 * the query string a search puts on the hash, and exact routes winning over the
 * prefix routes that also match them.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Router } from '../src/router';

const routes = () => ({
  '/': () => 'inbox',
  '/settings': () => 'settings',
  '/settings/*': () => 'settings-section',
  '/mailbox/*': () => 'mailbox',
});

const router = (onChange = () => {}) => new Router(routes(), () => 'not-found', onChange);

afterEach(() => {
  window.location.hash = '';
});

describe('Router', () => {
  it('treats an empty hash and a bare # as the root', () => {
    window.location.hash = '';
    expect(router().render()).toBe('inbox');
    window.location.hash = '#';
    expect(router().render()).toBe('inbox');
  });

  it('prefers the exact route over a prefix that also matches', () => {
    window.location.hash = '#/settings';
    expect(router().render()).toBe('settings');
  });

  it('matches a prefix route for anything below it', () => {
    window.location.hash = '#/mailbox/INBOX';
    expect(router().render()).toBe('mailbox');
    window.location.hash = '#/settings/accounts';
    expect(router().render()).toBe('settings-section');
  });

  it('ignores the query string', () => {
    window.location.hash = '#/mailbox/INBOX?q=quarterly';
    const r = router();
    expect(r.render()).toBe('mailbox');
    expect(r.currentPath).toBe('/mailbox/INBOX');
  });

  it('reads the hash when asked, not when constructed', () => {
    // Assigning location.hash is synchronous but hashchange is a task, while a
    // Lit update is a microtask. A cached path hid the logged-out redirect from
    // the very next render.
    window.location.hash = '';
    const r = router();
    expect(r.currentPath).toBe('/');
    window.location.hash = '#/settings';
    expect(r.currentPath).toBe('/settings');
    expect(r.render()).toBe('settings');
  });

  it('falls back for an unknown path', () => {
    window.location.hash = '#/nowhere';
    expect(router().render()).toBe('not-found');
  });

  it('tells the app when the hash changes', () => {
    const onChange = vi.fn();
    router(onChange);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('navigates by setting the hash', () => {
    const r = router();
    r.navigate('/settings');
    expect(window.location.hash).toBe('#/settings');
    expect(r.render()).toBe('settings');
  });
});
