/**
 * The sidebars' lists are navigation landmarks, named.
 *
 * Every sidebar sits in alps-sidebar's `<aside>`, an unnamed complementary
 * landmark, and none of the lists in it was a navigation landmark: a screen
 * reader's landmark list could not say which was the folder list, the
 * contacts groups or the task lists, nor jump straight to one. The Tasks
 * sidebar had an unnamed `<nav>` around its smart lists alone, which left
 * its task lists outside.
 *
 * Mail's is named for what it lists, Folders; Contacts' and Tasks' for their
 * tab, as their lists hold groups and lists rather than places of their own.
 * The calendar's sidebar holds checkboxes and a date picker, which filter
 * the view rather than go anywhere, and keeps the aside alone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/folder-list';
import '../../plugins/carddav/frontend/contacts-categories';
import '../../plugins/caldav/frontend/tasks-page';
import { I18nStore } from '../src/store/i18n-store';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, installMatchMedia, installResizeObserver, mount, shadow, shadowAll, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const settingsStore = Object.assign(new EventTarget(), {
  getState: () => ({}),
  updateSettings: async () => {},
});
const composeStore = Object.assign(new EventTarget(), { getState: () => ({}) });

async function german(): Promise<I18nStore> {
  const store = new I18nStore();
  await store.setLanguage('de');
  return store;
}

beforeEach(() => {
  installResizeObserver();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
});

describe('the sidebar lists', () => {
  it.each([
    ['Mail', 'Ordner', async (i18nStore: I18nStore) => mount<El>('alps-folder-list', {
      i18nStore, settingsStore, composeStore, mailboxes: [{ Name: 'INBOX', Attrs: [], Delimiter: '/' }], currentMailbox: 'INBOX',
    })],
    ['Contacts', 'Kontakte', async (i18nStore: I18nStore) => mount<El>('alps-contacts-categories', {
      i18nStore, contacts: [], uniqueCategories: [],
    })],
    ['Tasks', 'Aufgaben', async (i18nStore: I18nStore) => {
      vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 } as any);
      window.location.hash = '#/tasks/all';
      const el = await mount<El>('tasks-page', { i18nStore, settingsStore });
      await waitFor(() => !el.loading, 'the first read');
      return el;
    }],
  ])('%s is a navigation landmark named in the reader’s language', async (_, name, open) => {
    const el = await open(await german());
    const list = shadow(el, 'alps-sidebar-content');
    expect(list.getAttribute('role')).toBe('navigation');
    expect(list.getAttribute('aria-label')).toBe(name);
    // One landmark per list, not one inside another.
    expect(shadowAll(el, 'nav, [role="navigation"]')).toEqual([list]);
  });
});
