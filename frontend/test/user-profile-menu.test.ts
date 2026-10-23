/**
 * What the account menu offers.
 *
 * It listed Messages, Contacts, Calendar and Tasks above Settings on every
 * screen. A desktop's header has those as tabs, so there the menu only
 * repeated them; a phone's header has no room for the tabs, and the menu is
 * then the only way between the pages. Settings is never the current item:
 * it is a window over the page, whose tab stays the current one.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/user-profile-menu';
import { registry } from '../src/plugin-registry';
import { cleanup, mount, record } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const store = (extra: Record<string, unknown> = {}) => Object.assign(new EventTarget(), extra);
const stores = () => ({
  i18nStore: store({ t: (key: string) => key }),
  settingsStore: store({ getState: () => ({ name: 'Ada' }) }),
  linkedAccountsStore: store({ getAccounts: () => [], isInitialized: () => true, fetchAccounts: () => {} }),
});

registry.registerNavTab({ id: 'menu-test-calendar', labelKey: 'nav.calendar', icon: 'calendar' });

const items = (el: El) => [...el.shadowRoot!.querySelectorAll('button.dropdown-item')]
  .map((b) => b.querySelector('.item-text')?.textContent?.trim());

afterEach(cleanup);

describe('the account menu', () => {
  it('offers Settings and Sign out on a desktop, not the pages its header has', async () => {
    const el = await mount<El>('user-profile-menu', { ...stores(), username: 'ada@example.com', isMobile: false });
    expect(items(el)).toEqual(['userMenu.settings', 'userMenu.signOut']);
  });

  it('offers the pages first on a phone, whose header has no room for them', async () => {
    const el = await mount<El>('user-profile-menu', { ...stores(), username: 'ada@example.com', isMobile: true, currentTab: 'messages' });
    expect(items(el)).toEqual(['navigation.messages', 'nav.calendar', 'userMenu.settings', 'userMenu.signOut']);
    const current = [...el.shadowRoot!.querySelectorAll('button.dropdown-item.active')].map((b) => b.textContent?.trim());
    expect(current).toEqual(['navigation.messages']);
  });

  it('follows the header across the breakpoint', async () => {
    const el = await mount<El>('user-profile-menu', { ...stores(), username: 'ada@example.com', isMobile: true });
    expect(items(el)).toContain('navigation.messages');
    el.isMobile = false;
    await el.updateComplete;
    expect(items(el)).not.toContain('navigation.messages');
  });

  it('opens Settings', async () => {
    const el = await mount<El>('user-profile-menu', { ...stores(), username: 'ada@example.com' });
    const opened = record(el, 'open-settings');
    const settings = [...el.shadowRoot!.querySelectorAll<HTMLElement>('button.dropdown-item')]
      .find((b) => b.textContent?.includes('userMenu.settings'))!;
    expect(settings.classList.contains('active')).toBe(false);
    settings.click();
    expect(opened).toHaveLength(1);
  });
});
