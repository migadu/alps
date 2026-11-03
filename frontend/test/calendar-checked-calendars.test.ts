/**
 * Which calendars are checked in the sidebar.
 *
 * A calendar is checked on the first read that lists it. The page once
 * checked every calendar whenever none was checked, on every read: a
 * navigation, the periodic refresh, a save, coming back to the page. A user
 * who unchecked every calendar leaves the same empty choice behind, so the
 * next read checked them all again and their events came back. Then it
 * checked calendars only on the read that listed its first ones, and one
 * added later, in another client or shared by another account, came
 * unchecked, its events hidden until the user found its box.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, click, mount, shadow, shadowAll, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };
const work = { name: 'Work', description: '', path: '/cal/work/' };
const trips = { name: 'Trips', description: '', path: '/cal/trips/' };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
});

/** The page, with the server listing whatever `listed` holds at each read. */
async function calendarPage(listed: object[]): Promise<{ el: El; reads: () => number }> {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const fetchCalendars = vi.spyOn(calendarService, 'fetchCalendars')
    .mockImplementation(async () => ({ calendars: [...listed] }));
  vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
  vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
  window.location.hash = '#/calendar/month/2026-09';
  const el = await mount<El>('calendar-page', { i18nStore });
  const reads = () => fetchCalendars.mock.calls.length;
  await waitFor(() => reads() === 1 && el.loading === false, 'the first read');
  await el.updateComplete;
  return { el, reads };
}

/** Waits for a read after `asked` reads to finish and be drawn. */
async function readAgain(el: El, reads: () => number, asked: number): Promise<void> {
  await waitFor(() => reads() > asked && el.loading === false, 'the next read');
  await el.updateComplete;
}

/** The calendars' boxes; the Tasks switch below them is not one. */
const calendarBoxes = '.calendar-item:not(.tasks-toggle) .calendar-control';

/** Each calendar in the sidebar by its name, and whether its box is checked. */
function boxes(el: El): Record<string, boolean> {
  return Object.fromEntries(shadowAll(el, calendarBoxes).map((box) => [
    box.textContent!.trim(),
    box.getAttribute('aria-checked') === 'true',
  ]));
}

/** Deleting a calendar takes it out of what the server lists. */
function deletesFrom(listed: object[]): void {
  vi.spyOn(calendarService, 'deleteCalendar').mockImplementation(async (path: string) => {
    listed.splice(listed.findIndex((calendar: any) => calendar.path === path), 1);
  });
}

async function uncheckAll(el: El): Promise<void> {
  for (const box of shadowAll(el, `${calendarBoxes}[aria-checked="true"]`)) await click(box, el);
  expect(boxes(el)).toEqual({ Work: false, Trips: false });
}

describe('the calendars checked in the sidebar', () => {
  it('checks every calendar on the first read that lists any', async () => {
    const listed: object[] = [];
    const { el, reads } = await calendarPage(listed);
    expect(boxes(el)).toEqual({});

    listed.push(work, trips);
    const asked = reads();
    shadow(el, 'alps-icon-btn[icon="arrowsClockwise"]').click();
    await readAgain(el, reads, asked);
    expect(boxes(el)).toEqual({ Work: true, Trips: true });
  });

  it('keeps every calendar unchecked through the next read', async () => {
    const { el, reads } = await calendarPage([work, trips]);
    expect(boxes(el)).toEqual({ Work: true, Trips: true });
    await uncheckAll(el);

    const asked = reads();
    shadow(el, 'alps-icon-btn[icon="arrowsClockwise"]').click();
    await readAgain(el, reads, asked);
    expect(boxes(el)).toEqual({ Work: false, Trips: false });
  });

  it('keeps every calendar unchecked when the user leaves the page and comes back', async () => {
    const { el, reads } = await calendarPage([work, trips]);
    await uncheckAll(el);

    // The page is kept while another one is on screen, and reads again when
    // it is shown.
    const asked = reads();
    el.remove();
    document.body.appendChild(el);
    await readAgain(el, reads, asked);
    expect(boxes(el)).toEqual({ Work: false, Trips: false });
  });

  it('keeps every calendar unchecked when one of them is deleted', async () => {
    const listed: object[] = [work, trips];
    const { el, reads } = await calendarPage(listed);
    deletesFrom(listed);
    await uncheckAll(el);

    // A delete reads the calendars again at once.
    const asked = reads();
    el.handleDeleteCalendar(trips);
    await el._executeDeleteCalendar();
    await readAgain(el, reads, asked);
    expect(boxes(el)).toEqual({ Work: false });
  });

  it('checks a calendar another client adds, and keeps the boxes of the others', async () => {
    const listed: object[] = [work, trips];
    const { el, reads } = await calendarPage(listed);
    const refresh = async () => {
      const asked = reads();
      shadow(el, 'alps-icon-btn[icon="arrowsClockwise"]').click();
      await readAgain(el, reads, asked);
    };
    await click(shadowAll(el, calendarBoxes).find((box) => box.textContent!.trim() === 'Trips')!, el);

    listed.push({ name: 'Home', description: '', path: '/cal/home/' });
    await refresh();
    expect(boxes(el)).toEqual({ Work: true, Trips: false, Home: true });
    // Checked once, on the read that first lists it, and not again.
    await click(shadowAll(el, calendarBoxes).find((box) => box.textContent!.trim() === 'Home')!, el);
    await refresh();
    expect(boxes(el)).toEqual({ Work: true, Trips: false, Home: false });
  });

  it('checks only the new calendar when every other was unchecked', async () => {
    const listed: object[] = [work, trips];
    const { el, reads } = await calendarPage(listed);
    await uncheckAll(el);

    // As a calendar shared by another account appears.
    listed.push({ name: 'Shared', description: '', path: '/cal/shared/' });
    const asked = reads();
    shadow(el, 'alps-icon-btn[icon="arrowsClockwise"]').click();
    await readAgain(el, reads, asked);
    expect(boxes(el)).toEqual({ Work: false, Trips: false, Shared: true });
  });

  it('checks a calendar that comes back once it was no longer listed', async () => {
    const listed: object[] = [work, trips];
    const { el, reads } = await calendarPage(listed);
    const refresh = async () => {
      const asked = reads();
      shadow(el, 'alps-icon-btn[icon="arrowsClockwise"]').click();
      await readAgain(el, reads, asked);
    };
    await uncheckAll(el);

    // Deleted in another client, then made again under the same path.
    listed.splice(1, 1);
    await refresh();
    expect(boxes(el)).toEqual({ Work: false });
    expect([...el.activeCalendars]).toEqual([]);
    listed.push(trips);
    await refresh();
    expect(boxes(el)).toEqual({ Work: false, Trips: true });
  });

  it('checks every calendar listed after every calendar was deleted', async () => {
    const listed: object[] = [work];
    const { el, reads } = await calendarPage(listed);
    deletesFrom(listed);
    el.handleDeleteCalendar(work);
    await el._executeDeleteCalendar();
    expect(boxes(el)).toEqual({});

    listed.push(trips, { name: 'Home', description: '', path: '/cal/home/' });
    const asked = reads();
    shadow(el, 'alps-icon-btn[icon="arrowsClockwise"]').click();
    await readAgain(el, reads, asked);
    expect(boxes(el)).toEqual({ Trips: true, Home: true });
  });
});
