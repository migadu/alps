/**
 * A tab chosen on its own page goes nowhere.
 *
 * A plugin tab sets its bare route, `#/calendar`, which on the calendar is not
 * the address the user is on: setting it was a history entry. The calendar
 * then completed the bare address in place to the very view it was showing,
 * so the history held that address twice and the first Back appeared to do
 * nothing. Contacts and Tasks show the same page again under a second entry.
 * The header's tabs and the user menu's entries (the tabs on a phone) both
 * did it.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../src/components/app-header';
import '../src/components/user-profile-menu';
import { registry } from '../src/plugin-registry';
import { matchesTabRoute } from '../src/utils/routes';
import { cleanup, flush, mount } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

// The tabs come from the registry, where each plugin's index puts them.
registry.registerNavTab({ id: 'contacts', pluginId: 'carddav', labelKey: 'navigation.contacts', order: 10 });
registry.registerNavTab({ id: 'calendar', pluginId: 'caldav', labelKey: 'navigation.calendar', order: 20 });
registry.registerNavTab({ id: 'tasks', pluginId: 'caldav', labelKey: 'navigation.tasks', order: 30 });

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key, getLanguage: () => 'en' });

beforeEach(() => registry.setEnabledPlugins(['caldav', 'carddav']));

afterEach(() => {
  cleanup();
  registry.setEnabledPlugins(null);
  history.replaceState(null, '', '#/');
});

/** Mounts `tag` on `hash`, as the page that draws it would be. */
async function on(hash: string, tag: string, props: Record<string, unknown> = {}): Promise<El> {
  history.replaceState(null, '', hash);
  return mount<El>(tag, { i18nStore, ...props });
}

/** Clicks and lets the `hashchange` a navigation queues arrive. */
async function choose(node: Element | undefined): Promise<void> {
  expect(node).toBeDefined();
  (node as HTMLElement).click();
  await flush();
}

const headerTab = (el: El, id: string) =>
  Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.nav-tab')).find(tab => tab.title === `navigation.${id}`);

const menuEntry = (el: El, id: string) =>
  Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.dropdown-item')).find(item => item.textContent?.includes(`navigation.${id}`));

describe('matchesTabRoute', () => {
  it('matches a tab route on a segment boundary, not a bare prefix', () => {
    expect(matchesTabRoute('#/tasks', 'tasks')).toBe(true);
    expect(matchesTabRoute('#/tasks/today', 'tasks')).toBe(true);
    expect(matchesTabRoute('#/tasks?q=milk', 'tasks')).toBe(true);
    expect(matchesTabRoute('#/tasksomething', 'tasks')).toBe(false);
    expect(matchesTabRoute('#/calendar/month/2026-10', 'tasks')).toBe(false);
  });
});

describe('a header tab clicked on its own page', () => {
  for (const [id, hash] of [
    ['calendar', '#/calendar/month/2026-10'],
    ['contacts', '#/contacts/all/ada'],
    ['tasks', '#/tasks/today'],
  ] as const) {
    it(`adds no history entry on ${hash}`, async () => {
      const el = await on(hash, 'app-header', { currentTab: id });
      const before = history.length;

      await choose(headerTab(el, id));

      expect(window.location.hash).toBe(hash);
      expect(history.length).toBe(before);
    });
  }

  it("still goes to another tab's page", async () => {
    const el = await on('#/calendar/month/2026-10', 'app-header', { currentTab: 'calendar' });
    const before = history.length;

    await choose(headerTab(el, 'tasks'));

    expect(window.location.hash).toBe('#/tasks');
    expect(history.length).toBe(before + 1);
  });
});

// The tabs were bare elements with a click handler: Tab never reached them,
// and a screen reader read them as text, with no word of which was current.
describe('the header tabs', () => {
  it('are links in a named navigation landmark, the page on screen current', async () => {
    const el = await on('#/calendar/month/2026-10', 'app-header', { currentTab: 'calendar' });
    const nav = el.shadowRoot!.querySelector('nav');

    expect(nav?.getAttribute('aria-label')).toBe('navigation.label');
    const links = Array.from(nav!.querySelectorAll('a.nav-tab'));
    expect(links.map(a => a.getAttribute('href'))).toEqual(['#/', '#/contacts', '#/calendar', '#/tasks']);
    expect(links.filter(a => a.hasAttribute('aria-current')).map(a => [a.getAttribute('href'), a.getAttribute('aria-current')]))
      .toEqual([['#/calendar', 'page']]);
  });

  it('marks the page chosen current', async () => {
    const el = await on('#/calendar/month/2026-10', 'app-header', { currentTab: 'calendar' });

    await choose(headerTab(el, 'tasks'));

    expect(headerTab(el, 'tasks')!.getAttribute('aria-current')).toBe('page');
    expect(headerTab(el, 'calendar')!.hasAttribute('aria-current')).toBe(false);
  });

  it('leave a click that asks for another tab or window to the browser', async () => {
    const el = await on('#/calendar/month/2026-10', 'app-header', { currentTab: 'calendar' });
    let changed = false;
    el.addEventListener('change-tab', () => { changed = true; });
    // What the header did with the click, read past it; then the test's own
    // stop, since jsdom would follow the link here, in this window.
    const leftToBrowser: boolean[] = [];
    el.addEventListener('click', e => {
      leftToBrowser.push(!e.defaultPrevented);
      e.preventDefault();
    });

    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
      headerTab(el, 'tasks')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, ...init }));
    }
    expect(leftToBrowser).toEqual([true, true, true]);
    expect(changed).toBe(false);
    expect(window.location.hash).toBe('#/calendar/month/2026-10');
  });
});

// The menu carries the pages on a phone, whose header has no tabs.
describe('a user menu entry chosen on its own page', () => {
  it('leaves an open plugin page alone', async () => {
    const el = await on('#/calendar/month/2026-10', 'user-profile-menu', { username: 'ada@example.com', currentTab: 'calendar', isMobile: true });
    const before = history.length;

    await choose(menuEntry(el, 'calendar'));

    expect(window.location.hash).toBe('#/calendar/month/2026-10');
    expect(history.length).toBe(before);
  });

  it("still goes to another tab's page", async () => {
    const el = await on('#/calendar/month/2026-10', 'user-profile-menu', { username: 'ada@example.com', currentTab: 'calendar', isMobile: true });

    await choose(menuEntry(el, 'contacts'));

    expect(window.location.hash).toBe('#/contacts');
  });
});
