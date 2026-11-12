import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/user-profile-menu';
import { cleanup, mount, record } from './helpers/dom';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('switching linked accounts', () => {
  it.each([
    ['relink_required', 'linkedAccounts.relinkRequired'],
    ['account_not_found', 'linkedAccounts.accountNotFound'],
    ['service_unavailable', 'linkedAccounts.switchUnavailable'],
  ])('translates %s into an actionable notice', async (code, key) => {
    const store = (extra: Record<string, unknown>) => Object.assign(new EventTarget(), extra);
    const el = await mount<HTMLElement & { _handleSwitchAccount(username: string): Promise<void> }>('user-profile-menu', {
      username: 'alice@example.com',
      i18nStore: store({ t: (k: string) => k }),
      settingsStore: store({ getState: () => ({ name: 'Alice' }) }),
      linkedAccountsStore: store({ getAccounts: () => [], isInitialized: () => true, switchAccount: async () => { throw Object.assign(new Error('server prose'), { code }); } }),
    });
    const toasts = record<CustomEvent>(window, 'show-toast');
    await el._handleSwitchAccount('bob@example.com');
    expect(toasts.at(-1)?.detail.message).toBe(key);
  });
});
