import { afterEach, expect, it, vi } from 'vitest';
import { ContextProvider } from '@lit/context';
import { settingsContext } from '../src/store/settings-store';
import { I18nStore } from '../src/store/i18n-store';
import { cleanup, mount, shadow, shadowAll } from './helpers/dom';
import { formatDue } from '../../plugins/caldav/frontend/tasks-service';
import '../../plugins/caldav/frontend/calendar-list-view';
import '../../plugins/caldav/frontend/calendar-event-preview';
import '../../plugins/caldav/frontend/calendar-time-grid';
import '../../plugins/caldav/frontend/calendar-invitation-banner';
import '../../plugins/caldav/frontend/tasks-list';

type El = HTMLElement & Record<string, any>;
const i18nStore = new I18nStore();
const date = new Date(2026, 8, 14, 14, 30);
const event = { uid: 'u', summary: 'Clock', start: date.toISOString(), end: new Date(+date + 3600000).toISOString(), path: '/cal/u.ics', calendarPath: '/cal/', allDay: false };
const task = { uid: 't', title: 'Clock task', due: date.toISOString(), allDay: false, status: 'needs-action', path: '/cal/t.ics', calendarPath: '/cal/' };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

for (const hourFormat of ['12', '24']) {
  it(`uses the ${hourFormat}-hour clock throughout calendar and tasks, including live changes`, async () => {
    const root = await mount<El>('calendar-list-view', { i18nStore });
    // One context provider supplies the same store to each actual component.
    let current = hourFormat;
    const store = Object.assign(new EventTarget(), { getState: () => ({ hourFormat: current }) });
    const provider = new ContextProvider(root, { context: settingsContext, initialValue: store as any });
    const make = async (tag: string, props: Record<string, unknown>) => {
      const el = document.createElement(tag) as El;
      Object.assign(el, { i18nStore, ...props });
      root.append(el);
      await el.updateComplete;
      return el;
    };
    const list = await make('calendar-list-view', { events: [event] });
    const preview = await make('calendar-event-preview', { event });
    const taskPreview = await make('calendar-event-preview', { event: { ...event, task } });
    const grid = await make('calendar-time-grid', { days: [date] });
    const tasks = await make('tasks-list', { tasks: [task], now: date });
    const invite = await make('calendar-invitation-banner', {});
    const check = async () => {
      await Promise.all([list, preview, taskPreview, grid, tasks, invite].map(el => el.updateComplete));
      const expected = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: current === '12' });
      expect(shadow(list, '.date-time').textContent?.trim()).toBe(expected);
      expect(preview.formatEventTimeRange(event)).toContain(expected);
      expect(shadow(taskPreview, '.date-secondary').textContent?.trim()).toBe(expected);
      expect(shadow(tasks, '.due').textContent?.trim()).toBe(date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: current === '12' }));
      const hour = new Date(date); hour.setHours(14, 0, 0, 0);
      expect(shadowAll(grid, '.time-label')[14].textContent).toBe(hour.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: current === '12' }));
      expect(invite.when({ ...event, kind: 'event' })).toContain(current === '12' ? '2:30' : '14:30');
      expect(invite.when({ kind: 'task', end: date.toISOString() })).toContain(current === '12' ? '2:30' : '14:30');
    };
    await check();
    current = current === '12' ? '24' : '12';
    store.dispatchEvent(new Event('change'));
    await check();
    // Removed components release their settings listeners.
    for (const el of [list, preview, taskPreview, grid, tasks, invite]) el.remove();
    const update = vi.spyOn(list, 'requestUpdate');
    store.dispatchEvent(new Event('change'));
    expect(update).not.toHaveBeenCalled();
    void provider;
  });
}

it('uses the explicit task clock even when it differs from the date locale', () => {
  expect((formatDue as any)(task, date, 'Today', 'en-US', '24')).toBe('14:30');
  expect((formatDue as any)(task, date, 'Today', 'de-DE', '12')).toMatch(/02:30/);
  expect((formatDue as any)({ ...task, allDay: true }, date, 'Today', 'en-US', '24')).toBe('Today');
});
