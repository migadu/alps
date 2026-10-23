/**
 * A field is named by the label shown with it.
 *
 * alps-input draws its <input> inside its own shadow root. A `<label for>`
 * outside that root finds no element with the id, so the label never named
 * its field, in any prompt built on ui-prompt or in the composer's Insert Link
 * popup. A field with a placeholder was announced by its placeholder (a
 * security key's name, the GPG passphrase, the link popup's fields); one
 * without had no name at all (the name of a new or renamed folder, calendar,
 * task list or contact category). A click on the label did not focus the
 * field either. The forms that put a bare <label> before an alps-input did
 * not name their fields by it either.
 *
 * alps-input now takes its accessible name as `label` and gives it to its
 * input, and the prompt and the link popup focus a field when its label is
 * clicked.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, shadowAll, waitFor } from './helpers/dom';
import type { ComposerInstance } from '../src/store/compose-store';
import '../src/components/alps-input';
import '../src/components/ui-prompt';
import '../src/components/alps-floating-composer';
import '../../plugins/caldav/frontend/calendar-event-modal';
import '../../plugins/caldav/frontend/task-modal';

vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const i18nStore = {
  t: (key: string) => key,
  getLanguage: () => 'en',
  addEventListener: () => {},
  removeEventListener: () => {},
};

/** The <input> inside an alps-input. */
const inner = (field: Element) => shadow<HTMLInputElement>(field as HTMLElement, 'input');

/**
 * The input's accessible name, as a browser takes it for these fields: its
 * aria-label, or else the text of the labels associated with it.
 */
function accessibleName(input: HTMLInputElement): string {
  const label = input.getAttribute('aria-label');
  if (label) return label.trim();
  return Array.from(input.labels ?? []).map(l => l.textContent?.trim()).join(' ');
}

/** The element that has focus, looking into shadow roots. */
function focused(): Element | null {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

/** Each <label> placed before an alps-input in `root`, with the name its field ends up with. */
function labelledFields(root: ShadowRoot): [string, string][] {
  return Array.from(root.querySelectorAll('label'))
    .filter(l => l.nextElementSibling?.localName === 'alps-input')
    .map(l => [l.textContent!.trim(), accessibleName(inner(l.nextElementSibling!))]);
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('alps-input', () => {
  it('gives its label to its input as the accessible name', async () => {
    const el = await mount<El>('alps-input', { label: 'Folder name' });
    expect(accessibleName(inner(el))).toBe('Folder name');
  });

  it('adds no empty name without one', async () => {
    const el = await mount<El>('alps-input', { placeholder: 'Search' });
    expect(inner(el).hasAttribute('aria-label')).toBe(false);
  });
});

describe('ui-prompt', () => {
  const fields = [
    { id: 'name', label: 'Folder name', value: 'Work' },
    { id: 'parent', label: 'Parent' },
  ];

  it('names each field by its label', async () => {
    const el = await mount<El>('ui-prompt', { fields });
    expect(labelledFields(el.shadowRoot!)).toEqual([
      ['Folder name', 'Folder name'],
      ['Parent', 'Parent'],
    ]);
  });

  it('focuses a field when its label is clicked', async () => {
    const el = await mount<El>('ui-prompt', { fields });
    const [first, second] = shadowAll(el, 'alps-input');
    // The prompt focuses its first field itself, shortly after it opens.
    await waitFor(() => focused() === inner(first), 'the first field to take focus');

    shadowAll(el, 'label')[1].click();

    expect(focused()).toBe(inner(second));
  });
});

describe("the composer's Insert Link popup", () => {
  async function composerWindow(): Promise<El> {
    const instance: ComposerInstance = { id: 'c1', to: [], subject: '', text: '', format: 'html' };
    const composeStore = {
      getState: () => ({ activeComposers: [instance] }),
      getComposer: () => instance,
      updateComposer: vi.fn(),
      bringComposerToFront: vi.fn(),
      closeComposer: vi.fn(),
    };
    const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });
    const composer = el.shadowRoot!.querySelector('alps-message-composer') as El;
    await composer.updateComplete;
    await waitFor(() => !!composer.editor, 'the editor');
    return el;
  }

  it('names its fields by their labels, and a click on a label focuses the field', async () => {
    const el = await composerWindow();
    const popup = shadow<El>(el, '#linkPopup');
    // Opened as the user opens it, from the toolbar's Insert Link button.
    shadow(el, '#linkPopup alps-icon-btn[slot="trigger"]').click();
    await el.updateComplete;
    await popup.updateComplete;
    expect(popup.openState).toBe(true);

    expect(labelledFields(el.shadowRoot!)).toEqual([
      ['floatingComposer.displayText', 'floatingComposer.displayText'],
      ['floatingComposer.linkUrl', 'floatingComposer.linkUrl'],
    ]);

    popup.querySelectorAll('label')[1].click();
    expect(focused()).toBe(inner(popup.querySelectorAll('alps-input')[1]));
  });

  it("the editor's own link bubble names its fields too", async () => {
    const el = await composerWindow();
    const composer = shadow<El>(el, 'alps-message-composer');
    // It takes its strings from the app's context, which this test has none of.
    composer.i18nStore = i18nStore;
    composer.bubbleMenuState = 'edit';
    await composer.updateComplete;

    expect(labelledFields(composer.shadowRoot!)).toEqual([
      ['messageComposer.text', 'messageComposer.text'],
      ['messageComposer.link', 'messageComposer.link'],
    ]);
  });
});

describe('the event and task editors', () => {
  it('name every field by the label above it', async () => {
    const el = await mount<El>('calendar-event-modal', {
      i18nStore,
      initialDate: new Date(2026, 8, 14, 10, 0),
      open: true,
    });
    // Both time fields are labelled "Time"; each is named for which it is.
    expect(labelledFields(el.shadowRoot!)).toEqual([
      ['calendar.summary', 'calendar.summary'],
      ['calendar.startDate', 'calendar.startDate'],
      ['calendar.time', 'calendar.startTime'],
      ['calendar.endDate', 'calendar.endDate'],
      ['calendar.time', 'calendar.endTime'],
      ['calendar.location', 'calendar.location'],
    ]);
  });

  it('name every task field by the label above it', async () => {
    const el = await mount<El>('task-modal', {
      i18nStore,
      lists: [{ name: 'Work', description: '', path: '/cal/work/' }],
      open: true,
      // A timed due date, so the time field is shown too.
      task: {
        uid: 'call', title: 'Call', allDay: false, due: '2026-10-01T14:30:00Z', status: 'needs-action',
        path: '/cal/work/call.ics', calendarPath: '/cal/work/', etag: 'call-v1',
      },
    });
    const fields = labelledFields(el.shadowRoot!);
    expect(fields.map(([label]) => label)).toEqual(['tasks.titleField', 'tasks.due', 'tasks.time']);
    for (const [label, name] of fields) expect(name, label).toBe(label);
  });
});
