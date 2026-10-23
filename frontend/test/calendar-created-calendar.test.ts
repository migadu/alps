/**
 * A calendar the user creates from the Calendar sidebar.
 *
 * Creating one read the calendars again, but nothing checked the new one: the
 * page checks every calendar only on the read that lists its first ones, so
 * beside a calendar the user already had the new one came unchecked, and the
 * events added to it stayed hidden until the user found its box and ticked it.
 *
 * Only the user's own new calendar is checked. One that appears by other
 * means, made in another client, is left unchecked as before, and a rename
 * keeps the box as it was.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-page';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, click, mount, shadow, shadowAll, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;
type Calendar = { name: string; description: string; path: string };

const i18nStore = { t: (key: string) => key, getLanguage: () => 'en' };
const work = (): Calendar => ({ name: 'Work', description: '', path: '/cal/work/' });
const trips = (): Calendar => ({ name: 'Trips', description: '', path: '/cal/trips/' });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
});

/**
 * The page, with the server listing whatever `listed` holds at each read. A
 * calendar created through the page is listed from then on, under the path
 * the create answers with, as the server's would be.
 */
async function calendarPage(listed: Calendar[]): Promise<{ el: El; reads: () => number }> {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const fetchCalendars = vi.spyOn(calendarService, 'fetchCalendars')
    .mockImplementation(async () => ({ calendars: listed.map((calendar) => ({ ...calendar })) }));
  vi.spyOn(calendarService, 'fetchEvents').mockResolvedValue({ events: [] });
  vi.spyOn(tasksService, 'fetchTasks').mockResolvedValue({ tasks: [], calendars: [], failedCalendars: 0 });
  vi.spyOn(calendarService, 'createCalendar').mockImplementation(async (name: string) => {
    const path = `/cal/${name.toLowerCase()}-${listed.length}/`;
    listed.push({ name, description: '', path });
    return { ok: 'true', path };
  });
  vi.spyOn(calendarService, 'renameCalendar').mockImplementation(async (path: string, name: string) => {
    listed.find((calendar) => calendar.path === path)!.name = name;
    return { ok: 'true' };
  });
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

/** Answers the page's prompt, as its Save button does, with `name`. */
async function answerPrompt(el: El, name: string): Promise<void> {
  await el.updateComplete;
  shadow(el, 'ui-prompt').dispatchEvent(new CustomEvent('submit', { detail: { name } }));
}

/** Adds a calendar from the sidebar's button, and waits for the read that follows. */
async function addCalendar(el: El, reads: () => number, name: string): Promise<void> {
  const asked = reads();
  await click(shadow(el, 'alps-icon-btn[icon="calendarPlus"]'), el);
  await answerPrompt(el, name);
  await readAgain(el, reads, asked);
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

/** Clicks the box of the calendar named `name`. */
async function toggle(el: El, name: string): Promise<void> {
  const box = shadowAll(el, calendarBoxes).find((b) => b.textContent!.trim() === name);
  expect(box, `no box for ${name}`).toBeTruthy();
  await click(box!, el);
}

describe('a calendar the user creates', () => {
  it('is checked beside the calendars already there', async () => {
    const { el, reads } = await calendarPage([work()]);
    expect(boxes(el)).toEqual({ Work: true });

    await addCalendar(el, reads, 'Trips');
    expect(boxes(el)).toEqual({ Work: true, Trips: true });
  });

  it('is checked, and the other calendars keep their boxes', async () => {
    const { el, reads } = await calendarPage([work(), trips()]);
    await toggle(el, 'Trips');

    await addCalendar(el, reads, 'Home');
    expect(boxes(el)).toEqual({ Work: true, Trips: false, Home: true });

    // Also with every other calendar unchecked.
    await toggle(el, 'Work');
    await toggle(el, 'Home');
    await addCalendar(el, reads, 'Gym');
    expect(boxes(el)).toEqual({ Work: false, Trips: false, Home: false, Gym: true });
  });

  it('is checked after every calendar was deleted', async () => {
    const listed = [work()];
    const { el, reads } = await calendarPage(listed);
    vi.spyOn(calendarService, 'deleteCalendar').mockImplementation(async (path: string) => {
      listed.splice(listed.findIndex((calendar) => calendar.path === path), 1);
      return { ok: 'true' };
    });
    el.handleDeleteCalendar(work());
    await el._executeDeleteCalendar();
    expect(boxes(el)).toEqual({});

    await addCalendar(el, reads, 'Home');
    expect(boxes(el)).toEqual({ Home: true });
  });

  it('changes nothing when the create fails', async () => {
    const listed = [work(), trips()];
    const { el, reads } = await calendarPage(listed);
    await toggle(el, 'Trips');
    vi.mocked(calendarService.createCalendar).mockRejectedValue(new Error('refused'));
    const toasts: string[] = [];
    const onToast = (e: Event) => toasts.push((e as CustomEvent).detail.message);
    window.addEventListener('show-toast', onToast);

    const asked = reads();
    await click(shadow(el, 'alps-icon-btn[icon="calendarPlus"]'), el);
    await answerPrompt(el, 'Home');
    await waitFor(() => toasts.length === 1, 'the failure');
    window.removeEventListener('show-toast', onToast);
    await el.updateComplete;
    expect(toasts).toEqual(['calendar.saveCalendarFailed']);
    expect(reads()).toBe(asked);
    expect(boxes(el)).toEqual({ Work: true, Trips: false });
    expect([...el.activeCalendars]).toEqual(['/cal/work/']);
  });
});

describe('a calendar the user did not create here', () => {
  it('is left unchecked when another client adds it', async () => {
    const listed = [work()];
    const { el, reads } = await calendarPage(listed);

    listed.push(trips());
    const asked = reads();
    shadow(el, 'alps-icon-btn[icon="arrowsClockwise"]').click();
    await readAgain(el, reads, asked);
    expect(boxes(el)).toEqual({ Work: true, Trips: false });
  });
});

describe('a renamed calendar', () => {
  it('keeps its box as it was, checked or not', async () => {
    const { el, reads } = await calendarPage([work(), trips()]);
    await toggle(el, 'Trips');

    // A rename sets the calendar's display name; its path stays the same.
    for (const [calendar, name] of [[trips(), 'Travel'], [work(), 'Office']] as const) {
      const asked = reads();
      el.handleRenameCalendar(calendar);
      await answerPrompt(el, name);
      await readAgain(el, reads, asked);
    }
    expect(calendarService.renameCalendar).toHaveBeenCalledWith('/cal/trips/', 'Travel');
    expect(boxes(el)).toEqual({ Office: true, Travel: false });
  });
});
