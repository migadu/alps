/**
 * The sidebars can be used from the keyboard.
 *
 * A mail folder, a calendar, the Tasks toggle and a day of the mini calendar
 * were each a <div> with a click handler: no Tab stop, no role, no key. A
 * keyboard could not open a folder, show or hide a calendar, or pick a day.
 * The icon buttons beside them (a folder's expander, the menu of a folder,
 * calendar or contacts category, the mini calendar's arrows, Add Calendar)
 * had no names.
 *
 * Each row's name is now its control, as a contacts category's is: a button
 * for a folder, a checkbox for a calendar and for Tasks, one Tab stop per
 * month for the mini calendar, whose arrow keys move between its days. The
 * menus beside them are shown while their row has focus, so Tab reaches them
 * (browser test: e2e/sidebar-keyboard.spec.ts); here, that they are named.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/folder-list';
import '../../plugins/carddav/frontend/contacts-categories';
import '../../plugins/caldav/frontend/calendar-page';
import '../../plugins/caldav/frontend/alps-sidebar-calendar';
import '../../plugins/caldav/frontend/calendar-mini-month';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, record, shadow, shadowAll, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

const settingsStore = Object.assign(new EventTarget(), {
  getState: () => ({}),
  updateSettings: async () => {},
});

const composeStore = Object.assign(new EventTarget(), { getState: () => ({}) });

function key(target: Element, name: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

/** The name an alps-icon-btn's button is announced by. */
async function buttonName(iconButton: Element): Promise<string> {
  await (iconButton as El).updateComplete;
  const button = shadow<HTMLButtonElement>(iconButton as HTMLElement, 'button');
  return (button.getAttribute('aria-label') || button.textContent?.trim() || button.title).trim();
}

/** The element that has focus, looking into shadow roots. */
function focused(): Element | null {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
  localStorage.clear();
});

describe('a mail folder row', () => {
  const mb = (Name: string, Attrs: string[] = []) => ({ Name, Attrs, Delimiter: '/' });
  const mailboxes = [
    mb('INBOX'),
    mb('Projects', ['\\Noselect', '\\HasChildren']),
    mb('Projects/2026'),
    mb('Work', ['\\HasChildren']),
    mb('Work/Clients'),
  ];

  async function folders(expanded: string[] = []): Promise<El> {
    return mount<El>('alps-folder-list', {
      i18nStore, settingsStore, composeStore, mailboxes, currentMailbox: 'INBOX', expandedFolders: new Set(expanded),
    });
  }

  const rows = (el: El) => shadowAll<HTMLElement>(el, '.folder-item:not(.more-row)');
  const control = (row: HTMLElement) => row.querySelector<HTMLElement>('.folder-name')!;

  it('has one button, named by the folder', async () => {
    const el = await folders(['Work']);
    expect(rows(el).map(row => {
      const name = control(row);
      return [name.textContent?.trim(), name.getAttribute('role'), name.tabIndex];
    })).toEqual([
      ['folderList.inbox', 'button', 0],
      ['Projects', 'button', 0],
      ['Work', 'button', 0],
      ['Clients', 'button', 0],
    ]);
  });

  it('marks the folder on screen as the current one', async () => {
    const el = await folders();
    expect(rows(el).map(row => control(row).getAttribute('aria-current'))).toEqual(['true', null, null]);
  });

  it.each(['Enter', ' '])('opens its folder with %j', async (name) => {
    const el = await folders();
    const selected = record<CustomEvent>(el, 'select-mailbox');
    const event = key(control(rows(el)[2]), name);

    expect(selected.map(e => e.detail.name)).toEqual(['Work']);
    // Space would otherwise also scroll the sidebar.
    expect(event.defaultPrevented).toBe(true);
  });

  it('opens and closes a folder that holds only folders, as a click does', async () => {
    const el = await folders();
    const toggled = record<CustomEvent>(el, 'toggle-folder');
    const selected = record<CustomEvent>(el, 'select-mailbox');

    key(control(rows(el)[1]), 'Enter');

    expect(toggled.map(e => e.detail.folderName)).toEqual(['Projects']);
    expect(selected).toEqual([]);
  });

  it('tells whether a folder that holds only folders is open', async () => {
    const expanded = (el: El) => rows(el).map(row => control(row).getAttribute('aria-expanded'));
    // Only the placeholder's name opens and closes it; Work's opens Work.
    expect(expanded(await folders(['Work']))).toEqual([null, 'false', null, null]);
    cleanup();
    expect(expanded(await folders(['Projects']))).toEqual([null, 'true', null, null]);
  });

  it('opens its folder once while Space is held, as a button does', async () => {
    const el = await folders();
    const selected = record<CustomEvent>(el, 'select-mailbox');
    const work = control(rows(el)[2]);
    key(work, ' ');
    const repeat = key(work, ' ', { repeat: true });
    expect(selected.map(e => e.detail.name)).toEqual(['Work']);
    expect(repeat.defaultPrevented).toBe(true);
  });

  it('keeps the focus on the folder opened with the keyboard', async () => {
    const el = await folders();
    const work = control(rows(el)[2]);
    work.focus();
    key(work, 'Enter');
    expect(el.shadowRoot!.activeElement).toBe(work);
  });

  it('leaves other keys, and keys meant for the buttons beside its name, alone', async () => {
    const el = await folders();
    const selected = record<CustomEvent>(el, 'select-mailbox');
    key(control(rows(el)[2]), 'a');
    key(rows(el)[2].querySelector('.kebab-btn')!, 'Enter');
    expect(selected).toEqual([]);
  });

  it('names its expander and its menu button', async () => {
    const el = await folders(['Work']);
    const work = rows(el)[2];
    expect(await buttonName(work.querySelector('.folder-toggle-btn')!)).toBe('general.collapse');
    expect(await buttonName(rows(el)[1].querySelector('.folder-toggle-btn')!)).toBe('general.expand');
    expect(await buttonName(work.querySelector('.kebab-btn')!)).toBe('general.moreOptions');
  });
});

describe("a contacts category's menu button", () => {
  it('is named', async () => {
    const el = await mount<El>('alps-contacts-categories', {
      i18nStore, contacts: [{ uid: '1', categories: ['Work'] }], uniqueCategories: ['Work'],
    });
    expect(await buttonName(shadow(el, '.category-item .kebab-btn'))).toBe('general.moreOptions');
  });
});

describe('the calendar sidebar', () => {
  async function calendarPage(): Promise<El> {
    vi.spyOn(calendarService, 'fetchCalendars').mockResolvedValue({
      calendars: [
        { name: 'Home', description: '', path: '/cal/home/', color: '#f00' },
        { name: 'Work', description: '', path: '/cal/work/', color: '#00f' },
      ],
    } as any);
    vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] } as any);
    vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 } as any);
    window.location.hash = '#/calendar/month/2026-10';
    const el = await mount<El>('calendar-page', { i18nStore, settingsStore });
    await waitFor(() => !el.loading && shadowAll(el, '.calendar-item').length === 3, 'the calendars');
    return el;
  }

  const controls = (el: El) => shadowAll<HTMLElement>(el, '.calendar-item .calendar-control');
  const states = (el: El) => controls(el).map(c => [c.textContent?.trim(), c.getAttribute('role'), c.tabIndex, c.getAttribute('aria-checked')]);

  it('has a checkbox for each calendar and for Tasks, named by it, checked while it is shown', async () => {
    const el = await calendarPage();
    expect(states(el)).toEqual([
      ['Home', 'checkbox', 0, 'true'],
      ['Work', 'checkbox', 0, 'true'],
      ['tasks.title', 'checkbox', 0, 'true'],
    ]);
  });

  it.each([' ', 'Enter'])('shows and hides a calendar, and the tasks, with %j', async (name) => {
    const el = await calendarPage();
    const event = key(controls(el)[1], name);
    key(controls(el)[2], name);
    await el.updateComplete;

    expect(states(el).map(([label, , , checked]) => [label, checked])).toEqual([
      ['Home', 'true'],
      ['Work', 'false'],
      ['tasks.title', 'false'],
    ]);
    expect(event.defaultPrevented).toBe(true);
  });

  it('shows or hides a calendar once while Space is held', async () => {
    const el = await calendarPage();
    key(controls(el)[1], ' ');
    const repeat = key(controls(el)[1], ' ', { repeat: true });
    await el.updateComplete;
    expect(repeat.defaultPrevented).toBe(true);
    expect(controls(el)[1].getAttribute('aria-checked')).toBe('false');
  });

  it('names a calendar\'s menu button and Add Calendar', async () => {
    const el = await calendarPage();
    expect(await buttonName(shadow(el, '.calendar-item .kebab-btn'))).toBe('general.moreOptions');
    expect(await buttonName(shadow(el, 'alps-icon-btn[icon="calendarPlus"]'))).toBe('calendar.addCalendar');
  });
});

describe('the mini calendar', () => {
  // 14 October 2026 is a Wednesday; the grid starts on Monday 28 September.
  // Today is in September.
  const selected = new Date(2026, 9, 14);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 7, 12, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function month(currentDate: Date | undefined = selected, monthIndex = 9): Promise<El> {
    return mount<El>('calendar-mini-month', { i18nStore, year: 2026, month: monthIndex, weekStart: 1, currentDate });
  }

  const days = (el: El) => shadowAll<HTMLElement>(el, '.mini-day');
  const stops = (el: El) => days(el).filter(d => d.tabIndex === 0);

  it('is one Tab stop, on the day selected, each day a button named by its date', async () => {
    const el = await month();
    expect(days(el).every(d => d.getAttribute('role') === 'button')).toBe(true);
    expect(stops(el)).toHaveLength(1);
    expect(stops(el)[0].getAttribute('aria-label')).toBe('Wednesday, October 14, 2026');
  });

  it('puts the Tab stop on today, or else the 1st, when the day selected is in another month', async () => {
    const october = await month(new Date(2026, 11, 25));
    expect(stops(october).map(d => d.getAttribute('aria-label'))).toEqual(['Thursday, October 1, 2026']);
    // The year view selects no day.
    const september = await month(undefined, 8);
    expect(stops(september).map(d => d.getAttribute('aria-label'))).toEqual(['Monday, September 7, 2026']);
    expect(stops(september)[0].getAttribute('aria-current')).toBe('date');
  });

  it('moves between its days with the arrow keys, by day and by week', async () => {
    const el = await month();
    const label = () => (focused() as HTMLElement | null)?.getAttribute('aria-label');
    stops(el)[0].focus();

    key(stops(el)[0], 'ArrowRight');
    await el.updateComplete;
    expect(label()).toBe('Thursday, October 15, 2026');

    key(stops(el)[0], 'ArrowDown');
    await el.updateComplete;
    expect(label()).toBe('Thursday, October 22, 2026');

    key(stops(el)[0], 'ArrowUp');
    await el.updateComplete;
    key(stops(el)[0], 'ArrowLeft');
    await el.updateComplete;
    expect(label()).toBe('Wednesday, October 14, 2026');
    expect(stops(el)).toHaveLength(1);
  });

  it.each(['Enter', ' '])('picks the day with %j', async (name) => {
    const el = await month();
    const picked = record<CustomEvent>(el, 'date-selected');
    const event = key(stops(el)[0], name);
    expect(picked.map(e => (e.detail.date as Date).getDate())).toEqual([14]);
    expect(event.defaultPrevented).toBe(true);
  });

  it('picks the day once while Space is held', async () => {
    const el = await month();
    const picked = record<CustomEvent>(el, 'date-selected');
    key(stops(el)[0], ' ');
    const repeat = key(stops(el)[0], ' ', { repeat: true });
    expect(picked).toHaveLength(1);
    expect(repeat.defaultPrevented).toBe(true);
  });

  it("keeps the focus on a day picked from the next month's edge, once that month is shown", async () => {
    // June 2026 starts on a Monday; its grid ends with 1 to 5 July. The days
    // are drawn by position, so when July is shown the node that held 2 July
    // holds 30 July.
    const sidebar = await mount<El>('alps-sidebar-calendar', { i18nStore, selectedDate: new Date(2026, 5, 25), weekStart: 1 });
    // As the calendar page does: the day picked becomes the day selected.
    sidebar.addEventListener('date-selected', (e) => { sidebar.selectedDate = (e as CustomEvent).detail.date; });
    const mini = shadow<El>(sidebar, 'calendar-mini-month');
    await mini.updateComplete;
    const label = () => (focused() as HTMLElement | null)?.getAttribute('aria-label');
    stops(mini)[0].focus();
    key(stops(mini)[0], 'ArrowDown');
    await mini.updateComplete;
    expect(label()).toBe('Thursday, July 2, 2026');

    key(focused()!, 'Enter');
    await waitFor(() => mini.month === 6, 'July on screen');
    await mini.updateComplete;

    expect(label()).toBe('Thursday, July 2, 2026');
    expect(stops(mini)).toEqual([focused()]);
  });

  it('moves the Tab stop to a day clicked, or selected elsewhere, after the arrows', async () => {
    const el = await month();
    const stop = () => stops(el).map(d => d.getAttribute('aria-label'));
    key(stops(el)[0], 'ArrowRight');
    await el.updateComplete;
    expect(stop()).toEqual(['Thursday, October 15, 2026']);

    days(el).find(d => d.getAttribute('aria-label') === 'Tuesday, October 20, 2026')!.click();
    await el.updateComplete;
    expect(stop()).toEqual(['Tuesday, October 20, 2026']);

    key(stops(el)[0], 'ArrowRight');
    await el.updateComplete;
    el.currentDate = new Date(2026, 9, 5);
    await el.updateComplete;
    expect(stop()).toEqual(['Monday, October 5, 2026']);
  });

  it("names the sidebar's arrows", async () => {
    const el = await mount<El>('alps-sidebar-calendar', { i18nStore, selectedDate: selected });
    expect(await buttonName(shadow(el, 'alps-icon-btn[icon="caretLeft"]'))).toBe('calendar.previousMonth');
    expect(await buttonName(shadow(el, 'alps-icon-btn[icon="caretRight"]'))).toBe('calendar.nextMonth');
  });
});
