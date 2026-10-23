/** Settings reloads and restored history mount real pages from their recorded
 * background addresses, while live pages still ignore the window's hash. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import '../src/components/app-root';
import '../../plugins/caldav/frontend/calendar-page';
import '../../plugins/caldav/frontend/tasks-page';
import '../../plugins/carddav/frontend/contacts-page';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { registry } from '../src/plugin-registry';
import { messageSync } from '../src/services/message-sync';
import { cleanup, flush, mount, waitFor } from './helpers/dom';

const ADA = { path: '/book/ada.vcf', uid: 'ada', name: 'Ada', categories: ['Work'] };
const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };
type Page = HTMLElement & Record<string, any>;

function settingsOver(background: string) {
  history.replaceState({ alpsSettings: { depth: 1, background } }, '', '#/settings/appearance');
}
async function settle(page: Page) {
  for (let i = 0; i < 8; i++) { await flush(); await page.updateComplete; }
}

beforeEach(() => {
  document.cookie = 'alps_logged_in=1; path=/';
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));
  vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({ calendars: [] });
  vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
  vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
  vi.spyOn(contactsService, 'fetchContacts').mockResolvedValue({ contacts: [ADA] });
  vi.spyOn(contactsService, 'fetchContact').mockResolvedValue(ADA);
});
afterEach(() => {
  cleanup();
  messageSync.stop();
  window.dispatchEvent(new CustomEvent('session-cleared'));
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.cookie = 'alps_logged_in=; path=/; max-age=0';
  history.replaceState(null, '', '#/');
});
it('reloads the actual mailbox view recorded beneath Settings', async () => {
  const background = '#/mailbox/Work?p=2&uid=7&in=Sent&q=invoice';
  history.replaceState({ alpsSettings: { depth: 1, background } }, '', '#/settings/appearance');
  const app = await mount<HTMLElement & { updateComplete: Promise<unknown> }>('app-root');
  await flush();
  await app.updateComplete;
  const mailbox = app.shadowRoot!.querySelector('mailbox-page') as unknown as Record<string, any>;
  expect(mailbox).toBeTruthy();
  expect(mailbox.currentMailbox).toBe('Work');
  expect(mailbox.currentPage).toBe(2);
  expect(mailbox.targetUid).toBe('7');
  expect(mailbox.targetMailbox).toBe('Sent');
  expect(mailbox.filterQuery).toBe('invoice');
  expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).startsWith('/mailboxes/Work?page=2&query=invoice'))).toBe(true);
  expect(window.location.hash).toBe('#/settings/appearance');
});


it('restores the calendar view, date and search on its initial connection', async () => {
  settingsOver('#/calendar/week/2031-02-17?q=planning');
  const page = await mount<Page>('calendar-page', { i18nStore });
  await settle(page);
  expect(page.viewMode).toBe('week');
  expect([page.currentDate.getFullYear(), page.currentDate.getMonth(), page.currentDate.getDate()]).toEqual([2031, 1, 17]);
  expect(page.searchQuery).toBe('planning');
  expect(window.location.hash).toBe('#/settings/appearance');
});

it('restores the task list, calendar and search on its initial connection', async () => {
  settingsOver('#/tasks/completed?list=%2Fcal%2Fwork%2F&q=planning');
  const page = await mount<Page>('tasks-page', { i18nStore });
  await settle(page);
  expect(page.selectedList).toBe('completed');
  expect(page.selectedCalendar).toBe('/cal/work/');
  expect(page.searchQuery).toBe('planning');
  expect(window.location.hash).toBe('#/settings/appearance');
});

it('restores the contacts category and card after a delayed book read', async () => {
  let release!: (value: { contacts: typeof ADA[] }) => void;
  vi.mocked(contactsService.fetchContacts).mockReturnValue(new Promise(resolve => { release = resolve; }));
  settingsOver('#/contacts/Work/ada');
  const page = await mount<Page>('contacts-page', { i18nStore });
  await settle(page);
  expect(page.selectedContact).toBeNull();
  release({ contacts: [ADA] });
  await settle(page);
  expect(page.selectedCategory).toBe('Work');
  expect(page.selectedContact?.uid).toBe('ada');
  expect(window.location.hash).toBe('#/settings/appearance');
});

it.each(['calendar-page', 'tasks-page'])('keeps the window URL and stamp when %s completes a bare background address', async tag => {
  const background = tag === 'calendar-page' ? '#/calendar' : '#/tasks';
  settingsOver(background);
  const state = history.state;
  const entries = history.length;
  const page = await mount<Page>(tag, { i18nStore });
  await settle(page);
  expect(window.location.hash).toBe('#/settings/appearance');
  expect(history.state).toEqual(state);
  expect(history.length).toBe(entries);
});

it('restores a cached mailbox reattached beneath a restored Settings entry', async () => {
  const tag = 'settings-restore-away-page';
  if (!customElements.get(tag)) customElements.define(tag, class extends HTMLElement {});
  registry.registerRoute({ path: '/restore-away', component: tag });
  history.replaceState(null, '', '#/mailbox/INBOX');
  const app = await mount<Page>('app-root');
  await settle(app);
  const mailbox = app.shadowRoot!.querySelector('mailbox-page') as Page;
  window.location.hash = '#/restore-away';
  await waitFor(() => !mailbox.isConnected, 'the mailbox to detach');
  settingsOver('#/mailbox/Work?p=2&uid=7&in=Sent&q=invoice');
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  await settle(app);
  expect(app.shadowRoot!.querySelector('mailbox-page')).toBe(mailbox);
  expect(mailbox.currentMailbox).toBe('Work');
  expect(mailbox.currentPage).toBe(2);
  expect(mailbox.targetUid).toBe('7');
  expect(mailbox.targetMailbox).toBe('Sent');
  expect(mailbox.filterQuery).toBe('invoice');
});
