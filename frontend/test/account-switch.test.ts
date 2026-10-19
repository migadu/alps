/**
 * Switching to a linked account from the user menu.
 *
 * With a second factor to give, the page stays up until it is given, so
 * nothing the old account's reads bring back in the meantime may be kept for
 * the new one.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/user-profile-menu';
import { MessageCache } from '../src/utils/message-cache';

afterEach(() => {
  document.body.innerHTML = '';
  sessionStorage.clear();
  window.location.hash = '';
  vi.restoreAllMocks();
});

describe('a switch that asks for a second factor', () => {
  it('stops a body still being read for the old account from being cached', async () => {
    const menu = document.createElement('user-profile-menu') as HTMLElement & Record<string, any>;
    menu.linkedAccountsStore = { switchAccount: vi.fn(async () => ({ requires_2fa: true })) };
    menu.i18nStore = { t: (key: string) => key };
    const generation = MessageCache.generation();

    await menu._handleSwitchAccount('grace@example.com');

    expect(window.location.hash).toBe('#/login/webauthn');
    expect(sessionStorage.getItem('pending_2fa_is_switch')).toBe('1');
    // What a reader of the old account checks before it writes a body.
    expect(MessageCache.generation()).not.toBe(generation);
  });
});
