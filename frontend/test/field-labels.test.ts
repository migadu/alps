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
 *
 * alps-select and alps-address-input draw their <select> and <input> inside a
 * shadow root too, and had no way to take a name: every one of them was
 * unnamed, whatever label stood beside it (an event's calendar and repeat, a
 * task's status and priority, every setting, a message's To, Cc and Bcc).
 * They take `label` as alps-input does. The fields still without one get
 * theirs: the settings' name and Reply-To (named only by their
 * placeholders), a contact's birthday (a date input shows no placeholder), a
 * filter condition's value. The toast's dismiss button put its name on the
 * host as aria-label, which alps-icon-btn does not pass on; its title is.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, type TemplateResult } from 'lit';
import { cleanup, mount, shadow, shadowAll, waitFor } from './helpers/dom';
import type { ComposerInstance } from '../src/store/compose-store';
import { SettingsStore } from '../src/store/settings-store';
import '../src/components/alps-input';
import '../src/components/alps-select';
import '../src/components/alps-address-input';
import '../src/components/toast-notification';
import '../src/components/ui-prompt';
import '../src/components/alps-floating-composer';
import '../src/pages/settings-page';
import '../../plugins/caldav/frontend/calendar-event-modal';
import '../../plugins/caldav/frontend/task-modal';
import '../../plugins/carddav/frontend/contact-view';
import '../../plugins/managesieve/frontend/visual-editor';
import '../../plugins/caldav/frontend/calendar-invitation-banner';
import { invitationService, type InvitationView } from '../../plugins/caldav/frontend/invitation-service';

vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const i18nStore = {
  t: (key: string) => key,
  getLanguage: () => 'en',
  addEventListener: () => {},
  removeEventListener: () => {},
};

type Control = HTMLInputElement | HTMLSelectElement;

/** The fields that draw their control inside their own shadow root. */
const FIELDS = ['alps-input', 'alps-select', 'alps-address-input'];

/** The <input> or <select> inside an alps-input, alps-select or alps-address-input. */
const inner = (field: Element) => shadow<Control>(field as HTMLElement, 'input, select');

/**
 * The control's accessible name, as a browser takes it for these fields: its
 * aria-label, or else the text of the labels associated with it, or else the
 * placeholder of an input that shows one.
 */
function accessibleName(control: Control): string {
  const label = control.getAttribute('aria-label');
  if (label) return label.trim();
  const labels = Array.from(control.labels ?? []).map(l => l.textContent?.trim()).join(' ');
  if (labels) return labels;
  const shown = control instanceof HTMLInputElement && !['date', 'time'].includes(control.type);
  return shown ? control.placeholder.trim() : '';
}

/** The element that has focus, looking into shadow roots. */
function focused(): Element | null {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

/** Each <label> placed before one of those fields in `root`, with the name its field ends up with. */
function labelledFields(root: ShadowRoot): [string, string][] {
  return Array.from(root.querySelectorAll('label'))
    .filter(l => FIELDS.includes(l.nextElementSibling?.localName ?? ''))
    .map(l => [l.textContent!.trim(), accessibleName(inner(l.nextElementSibling!))]);
}

/** A button's accessible name: its aria-label, its text, or its title. */
function buttonName(button: HTMLButtonElement): string {
  return button.getAttribute('aria-label')?.trim() || button.textContent?.trim() || button.title.trim();
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

describe('alps-select and alps-address-input', () => {
  it('give their label to the control inside as its accessible name', async () => {
    const select = await mount<El>('alps-select', { label: 'Repeat', options: [{ value: '', label: 'None' }] });
    const address = await mount<El>('alps-address-input', { label: 'Guests' });
    expect(accessibleName(inner(select))).toBe('Repeat');
    expect(accessibleName(inner(address))).toBe('Guests');
  });

  it('add no empty name without one', async () => {
    const select = await mount<El>('alps-select', { options: [{ value: '', label: 'None' }] });
    const address = await mount<El>('alps-address-input');
    expect(inner(select).hasAttribute('aria-label')).toBe(false);
    expect(inner(address).hasAttribute('aria-label')).toBe(false);
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

/** A composer window with its editor ready. */
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

describe("the composer's Insert Link popup", () => {
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

describe("the composer's address fields", () => {
  it('are named by their captions', async () => {
    const el = await composerWindow();
    el.showCc = true;
    el.showBcc = true;
    await el.updateComplete;

    const fields = shadowAll(el, 'alps-address-input');
    await Promise.all(fields.map(f => (f as El).updateComplete));
    expect(fields.map(f => accessibleName(inner(f)))).toEqual([
      'floatingComposer.to',
      'floatingComposer.cc',
      'floatingComposer.bcc',
    ]);
  });
});

describe('the event and task editors', () => {
  it('name every field by the label above it', async () => {
    const el = await mount<El>('calendar-event-modal', {
      i18nStore,
      initialDate: new Date(2026, 8, 14, 10, 0),
      // Two calendars, so the calendar picker is shown too.
      calendars: [{ name: 'Home', path: '/cal/home/' }, { name: 'Work', path: '/cal/work/' }],
      open: true,
    });
    // Both time fields are labelled "Time"; each is named for which it is.
    expect(labelledFields(el.shadowRoot!)).toEqual([
      ['calendar.summary', 'calendar.summary'],
      ['calendar.calendar', 'calendar.calendar'],
      ['invitations.guests', 'invitations.guests'],
      ['calendar.startDate', 'calendar.startDate'],
      ['calendar.time', 'calendar.startTime'],
      ['calendar.endDate', 'calendar.endDate'],
      ['calendar.time', 'calendar.endTime'],
      ['calendar.repeat', 'calendar.repeat'],
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
    expect(fields.map(([label]) => label)).toEqual([
      'tasks.titleField', 'tasks.due', 'tasks.time', 'tasks.status', 'tasks.priority', 'tasks.repeat', 'tasks.assignTo',
    ]);
    for (const [label, name] of fields) expect(name, label).toBe(label);
  });

  it('name the task list picker of a new task', async () => {
    const el = await mount<El>('task-modal', {
      i18nStore,
      lists: [{ name: 'Work', description: '', path: '/cal/work/' }, { name: 'Home', description: '', path: '/cal/home/' }],
      open: true,
    });
    expect(labelledFields(el.shadowRoot!)).toContainEqual(['tasks.list', 'tasks.list']);
  });
});

describe("an invitation's calendar picker", () => {
  it('is named by its title', async () => {
    const view = {
      method: 'request', kind: 'event', uid: 'review@example.org', summary: 'Review',
      start: '2099-09-16T08:00:00Z', end: '2099-09-16T09:00:00Z', allDay: false,
      organizer: { email: 'grace@example.org', name: 'Grace Hopper' },
      attendees: [{ email: 'ada@example.com', status: 'needs-action' }],
      me: 'ada@example.com', status: 'needs-action', state: 'answer', autoApply: false,
      sender: 'grace@example.org', senderVerified: true, ended: false, scheduling: 'email', clashes: [],
      calendars: [{ name: 'Work', path: '/cal/work/' }, { name: 'Home', path: '/cal/home/' }],
    } as unknown as InvitationView;
    vi.spyOn(invitationService, 'fetchInvitation').mockResolvedValue(view);
    const el = await mount<El>('calendar-invitation-banner', {
      i18nStore: { ...i18nStore, getIntlLanguage: () => 'en' }, mailbox: 'INBOX', uid: '42',
    });
    await waitFor(() => !!el.shadowRoot?.querySelector('alps-select'), 'the picker');
    const picker = shadow<El>(el, 'alps-select');
    await picker.updateComplete;

    expect(accessibleName(inner(picker))).toBe('invitations.calendar');
  });
});

describe('the settings', () => {
  /** The defaults, as the settings page shows them. */
  const settingsState = () => ({ ...new SettingsStore().getState(), loginUsername: 'ada@example.com' });

  /** Each setting's label with the name of the field it holds, for every section of the page. */
  async function settingFields(): Promise<[string, string][]> {
    const page = document.createElement('settings-page') as El;
    Object.assign(page, { i18nStore, settingsState: settingsState() });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const sections: (() => TemplateResult)[] = [
      page.renderGeneral, page.renderIdentity, page.renderReading, page.renderAppearance, page.renderLocalization,
    ];
    render(sections.map(section => section.call(page)), host);
    const fields = Array.from(host.querySelectorAll<El>(FIELDS.join(', ')));
    await Promise.all(fields.map(f => f.updateComplete));
    return fields.map(f => [f.closest('alps-setting-group')!.getAttribute('label')!, accessibleName(inner(f))]);
  }

  it('name every field by its setting', async () => {
    const fields = await settingFields();
    // Every section shows at least one field, and the identity's two fields
    // (named only by their placeholders before) are among them.
    expect(fields.length).toBeGreaterThan(15);
    expect(fields.map(([label]) => label)).toEqual(expect.arrayContaining([
      'settings.identity.displayName', 'settings.identity.replyTo', 'settings.localization.language',
    ]));
    for (const [label, name] of fields) expect(name, label).toBe(label);
  });
});

describe('the contact editor', () => {
  it('names the birthday field, whose date input shows no placeholder', async () => {
    const el = await mount<El>('alps-contact-view', {
      i18nStore,
      settingsStore: { getState: () => ({ dateFormat: 'YYYY-MM-DD' }) },
      contact: { name: 'Ada Lovelace', email: 'ada@example.com', birthday: '1815-12-10', path: '/card/ada.vcf' },
      isEditing: true,
    });
    await el.updateComplete;
    const fields = shadowAll<El>(el, 'alps-input');
    await Promise.all(fields.map(f => f.updateComplete));
    const birthday = fields.find(f => inner(f).type === 'date');
    expect(birthday, 'the birthday field').toBeDefined();

    expect(accessibleName(inner(birthday!))).toBe('contacts.birthday');
  });
});

describe('the filter editor', () => {
  it("names the value a condition is compared with", async () => {
    const el = await mount<El>('alps-visual-editor', {
      i18nStore,
      folders: ['INBOX', 'Invoices'],
      state: {
        rules: [{
          id: 'r1',
          matchType: 'all',
          conditions: [{ field: 'Subject', operator: 'contains', value: 'invoice' }],
          actions: [{ type: 'fileinto', value: 'Invoices' }],
        }],
      },
    });
    const value = shadowAll<El>(el, '.condition-row alps-input');
    expect(value).toHaveLength(1);
    await value[0].updateComplete;

    expect(accessibleName(inner(value[0]))).toBe('managesieve.visual.value');
  });
});

describe("a toast's dismiss button", () => {
  it('is named', async () => {
    const el = await mount<El>('alps-toast', { i18nStore, show: true, message: 'Message sent.' });
    const dismiss = shadow<El>(el, '.dismiss-btn');
    await dismiss.updateComplete;

    expect(buttonName(shadow<HTMLButtonElement>(dismiss, 'button'))).toBe('toast.dismiss');
  });
});
