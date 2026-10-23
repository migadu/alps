/**
 * A click on a field's label puts the focus in the field.
 *
 * Only the prompts built on ui-prompt did this, with a click handler of their
 * own. Everywhere else a click on a label left the focus where it was, for
 * one of three reasons:
 *
 *  - alps-input, alps-select and alps-address-input draw their control in a
 *    shadow root of their own and are no control a <label> can point at, so a
 *    label wrapped around one (the auto-reply's dates) did nothing;
 *  - the event and task editors, and the composer's link bubble, put a bare
 *    <label> before each field, tied to nothing;
 *  - alps-setting-group draws its label in its own shadow root, from which
 *    it cannot point at the field slotted into the group: every setting.
 *
 * The three fields now take the focus when a label around them, or one whose
 * `for` names them, is clicked; the editors' and the bubble's labels name
 * their fields; and alps-setting-group passes a click on its label to its
 * field. A click on a label does nothing else: it opens and sends nothing.
 * In a browser: e2e/field-labels.spec.ts.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, render, type TemplateResult } from 'lit';
import { cleanup, mount, shadow, shadowAll, waitFor } from './helpers/dom';
import type { ComposerInstance } from '../src/store/compose-store';
import '../src/components/alps-input';
import '../src/components/alps-select';
import '../src/components/alps-address-input';
import '../src/components/alps-setting-group';
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

/** The fields that draw their control inside their own shadow root. */
const FIELDS = ['alps-input', 'alps-select', 'alps-address-input'];

/** The element that has focus, looking into shadow roots. */
function focused(): Element | null {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

/** The control a field is: its inner input or select, or itself. */
function control(field: Element): Element {
  return FIELDS.includes(field.localName) ? field.shadowRoot!.querySelector('input, select')! : field;
}

/** Draws `template` into a shadow root, as every form in alps is drawn, and lets its fields render. */
async function form(template: TemplateResult): Promise<ShadowRoot> {
  const host = document.createElement('div');
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  render(template, root);
  await Promise.all([...root.querySelectorAll<El>('*')].map((el) => el.updateComplete));
  return root;
}

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('a label around a field, or one whose `for` names it', () => {
  it('focuses alps-input from a label wrapped around it', async () => {
    const root = await form(html`<label><span class="text">Start date</span><alps-input type="date" label="Start date"></alps-input></label>`);
    root.querySelector<HTMLElement>('.text')!.click();
    expect(focused()).toBe(control(root.querySelector('alps-input')!));
  });

  it('leaves a click on a button inside that label to the button', async () => {
    const root = await form(html`<label><span>Start date</span><alps-input type="date" label="Start date"></alps-input><button type="button">Today</button></label>`);
    root.querySelector('button')!.click();
    expect(focused()).not.toBe(control(root.querySelector('alps-input')!));
  });

  it.each(FIELDS)('focuses %s from a label whose `for` names it', async (tag) => {
    const root = await form(html`
      <label for="field">The field</label>
      ${tag === 'alps-input' ? html`<alps-input id="field" label="The field"></alps-input>`
        : tag === 'alps-select' ? html`<alps-select id="field" label="The field" .options=${[{ value: 'a', label: 'A' }]}></alps-select>`
        : html`<alps-address-input id="field" label="The field"></alps-address-input>`}
    `);
    root.querySelector('label')!.click();
    expect(focused()).toBe(control(root.querySelector(tag)!));
  });

  it("leaves a field alone when the label is another field's", async () => {
    const root = await form(html`
      <label for="other">Other</label><input id="other">
      <alps-input id="field" label="The field"></alps-input>
    `);
    root.querySelector('label')!.click();
    expect(focused()).not.toBe(control(root.querySelector('alps-input')!));
  });

  it('only focuses: a click on the label inside a form sends nothing', async () => {
    const submitted = vi.fn((e: Event) => e.preventDefault());
    const root = await form(html`
      <form @submit=${submitted}>
        <label for="name">Name</label>
        <alps-input id="name" label="Name"></alps-input>
        <button type="submit">Send</button>
      </form>
    `);
    root.querySelector('label')!.click();
    expect(focused()).toBe(control(root.querySelector('alps-input')!));
    expect(submitted).not.toHaveBeenCalled();
  });
});

describe("a setting's label", () => {
  it.each([
    ['an alps-input', html`<alps-setting-group label="Display Name"><alps-input label="Display Name"></alps-input></alps-setting-group>`, 'alps-input'],
    ['a <textarea>', html`<alps-setting-group label="Signature"><textarea aria-label="Signature"></textarea></alps-setting-group>`, 'textarea'],
    ['an alps-select', html`<alps-setting-group label="Language"><alps-select label="Language" .options=${[{ value: 'en', label: 'English' }]}></alps-select></alps-setting-group>`, 'alps-select'],
  ])('focuses %s in its group', async (_, template, tag) => {
    const root = await form(template);
    shadow(root.querySelector('alps-setting-group') as HTMLElement, 'label').click();
    expect(focused()).toBe(control(root.querySelector(tag)!));
  });

  it("does not reach into a group of its own inside it: that one's field has its own label", async () => {
    const root = await form(html`
      <alps-setting-group class="outer" label="Import keys">
        <alps-setting-group label="Public key"><textarea aria-label="Public key"></textarea></alps-setting-group>
      </alps-setting-group>
    `);
    shadow(root.querySelector('.outer') as HTMLElement, 'label').click();
    expect(focused()).not.toBe(root.querySelector('textarea'));
  });
});

/**
 * Each label of a form-group in `root`, with whether it reaches its group's
 * field: a click on it focuses one of the three fields, and it is the label of
 * a native one (whose focus the browser gives; jsdom does not). A checkbox's
 * label is only checked, not clicked: a click would tick it.
 */
function clickEachLabel(root: ShadowRoot): [string, boolean][] {
  return [...root.querySelectorAll<HTMLLabelElement>('.form-group > label')].map((label) => {
    const field = label.parentElement!.querySelector(`${FIELDS.join(', ')}, textarea, input, select`);
    if (!field || !FIELDS.includes(field.localName)) return [label.textContent!.trim(), !!field && label.control === field];
    (focused() as HTMLElement | null)?.blur();
    label.click();
    return [label.textContent!.trim(), focused() === control(field)];
  });
}

describe('the event and task editors', () => {
  it("focus each of the event's fields from its label", async () => {
    const el = await mount<El>('calendar-event-modal', {
      i18nStore,
      initialDate: new Date(2026, 8, 14, 10, 0),
      calendars: [{ name: 'Home', path: '/cal/home/' }, { name: 'Work', path: '/cal/work/' }],
      open: true,
    });
    const clicked = clickEachLabel(el.shadowRoot!);
    expect(clicked.map(([text]) => text)).toEqual([
      'calendar.summary', 'calendar.calendar', 'invitations.guests', 'calendar.startDate', 'calendar.time',
      'calendar.endDate', 'calendar.time', 'calendar.allDay', 'calendar.repeat', 'calendar.location', 'calendar.description',
    ]);
    expect(clicked.filter(([, ok]) => !ok)).toEqual([]);
    // Nothing was saved or closed along the way.
    expect(el.open).toBe(true);
  });

  it("focus each of the task's fields from its label", async () => {
    const el = await mount<El>('task-modal', {
      i18nStore,
      lists: [{ name: 'Work', description: '', path: '/cal/work/' }],
      open: true,
      task: {
        uid: 'call', title: 'Call', allDay: false, due: '2026-10-01T14:30:00Z', status: 'needs-action',
        path: '/cal/work/call.ics', calendarPath: '/cal/work/', etag: 'call-v1',
      },
    });
    const clicked = clickEachLabel(el.shadowRoot!);
    expect(clicked.map(([text]) => text)).toEqual([
      'tasks.titleField', 'tasks.due', 'tasks.time', 'tasks.status', 'tasks.priority', 'tasks.percentComplete',
      'tasks.repeat', 'tasks.notes', 'tasks.assignTo',
    ]);
    expect(clicked.filter(([, ok]) => !ok)).toEqual([]);
    expect(el.open).toBe(true);
  });
});

describe("the composer's link bubble", () => {
  it('focuses its Text and Link fields from their labels', async () => {
    const instance: ComposerInstance = { id: 'c1', to: [], subject: '', text: '', format: 'html' };
    const composeStore = {
      getState: () => ({ activeComposers: [instance] }),
      getComposer: () => instance,
      updateComposer: vi.fn(),
      bringComposerToFront: vi.fn(),
      closeComposer: vi.fn(),
    };
    const win = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });
    const composer = win.shadowRoot!.querySelector('alps-message-composer') as El;
    await composer.updateComplete;
    await waitFor(() => !!composer.editor, 'the editor');
    composer.i18nStore = i18nStore;
    composer.bubbleMenuState = 'edit';
    await composer.updateComplete;
    const fields = shadowAll<El>(composer, '.bubble-edit alps-input');
    await Promise.all(fields.map((f) => f.updateComplete));

    const labels = shadowAll<HTMLLabelElement>(composer, '.bubble-edit label');
    expect(labels).toHaveLength(2);
    labels.forEach((label, i) => {
      label.click();
      expect(focused(), label.textContent!).toBe(control(fields[i]));
    });
  });
});
