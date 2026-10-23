/**
 * An attendee typed into the event editor's Guests, or the task editor's
 * Assign to, and not yet a pill, when Save is pressed.
 *
 * The field made typed text a pill 150ms after it lost the focus, and Save
 * read the attendees as they were when pressed: the event or task was saved
 * without the person just typed, who appeared in the field once the save had
 * gone.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/caldav/frontend/calendar-event-modal';
import '../../plugins/caldav/frontend/task-modal';
import { calendarService } from '../../plugins/caldav/frontend/calendar-service';
import { tasksService } from '../../plugins/caldav/frontend/tasks-service';
import { cleanup, mount, shadow } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, addEventListener: () => {}, removeEventListener: () => {} };

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const inputOf = (field: El) => field.shadowRoot!.querySelector('input')!;

async function typeInto(field: El, value: string) {
  const input = inputOf(field);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await field.updateComplete;
}

/**
 * Presses Save. A mouse takes the focus from the field as the button goes
 * down, and the click follows at once, so `leaving` blurs the field first;
 * without it, the focus stays where it was.
 */
async function pressSave(el: El, field: El, leaving: boolean) {
  if (leaving) inputOf(field).dispatchEvent(new FocusEvent('blur'));
  shadow<El>(el, 'alps-button[variant="primary"]').click();
  for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(0);
}

async function eventEditor() {
  const el = await mount<El>('calendar-event-modal', {
    i18nStore,
    calendars: [{ name: 'Work', description: '', path: '/cal/work/' }],
    initialDate: new Date(2026, 8, 14, 10, 0),
    open: true,
  });
  el.summary = 'Review';
  await el.updateComplete;
  return { el, field: shadow<El>(el, 'alps-address-input.guests') };
}

async function taskEditor() {
  const el = await mount<El>('task-modal', { i18nStore, lists: [{ name: 'Tasks', path: '/cal/tasks/' }], open: true });
  el.title = 'Call';
  await el.updateComplete;
  return { el, field: shadow<El>(el, 'alps-address-input.assignees') };
}

describe.each([
  ['the field loses the focus first', true],
  ['the focus is still in the field', false],
])('Save pressed while an attendee is typed, when %s', (_when, leaving) => {
  it('saves the event with the guest', async () => {
    const create = vi.spyOn(calendarService, 'createEvent').mockResolvedValue({ ok: 'true', path: '/cal/work/review.ics' } as any);
    const { el, field } = await eventEditor();
    await typeInto(field, 'bob@example.com');
    vi.useFakeTimers();

    await pressSave(el, field, leaving);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].attendees).toEqual([expect.objectContaining({ email: 'bob@example.com' })]);
  });

  it('saves the task with the assignee', async () => {
    const create = vi.spyOn(tasksService, 'createTask').mockResolvedValue({ ok: 'true', path: '/cal/tasks/call.ics' } as any);
    const { el, field } = await taskEditor();
    await typeInto(field, 'bob@example.com');
    vi.useFakeTimers();

    await pressSave(el, field, leaving);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].attendees).toEqual([expect.objectContaining({ email: 'bob@example.com' })]);
  });
});
