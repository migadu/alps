/**
 * The Settings window.
 *
 * A window over the page it was opened from, whose URL the SHELL owns: the
 * window asks for a section or to close, by event, and never writes the hash.
 * What it promises on its own:
 *
 *  - a dialog titled Settings, under every composer;
 *  - Escape closes it, unless a dialog on the key's path or a composer above
 *    it takes the key;
 *  - focus moves onto the current section, and goes back when it closes;
 *  - a section with its own Save (the filters, the auto-reply) is asked about
 *    before a Close, an Escape or another section drops what it holds;
 *  - on a phone, one column at a time.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SETTINGS_WINDOW_Z } from '../src/components/settings-window';
import { SettingsStore } from '../src/store/settings-store';
import { ComposeStore } from '../src/store/compose-store';
import { registry } from '../src/plugin-registry';
import { deepActiveElement } from '../src/utils/active-element';
import { cleanup, mount, record, shadow, shadowAll } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

/** Records what the window asked to persist. */
function settingsStore() {
  const updates: Record<string, unknown>[] = [];
  const state = { ...new SettingsStore().getState(), loginUsername: 'ada@example.com' };
  return Object.assign(new EventTarget(), {
    getState: () => state,
    updateSettings: (patch: Record<string, unknown>) => { updates.push(patch); },
    updates,
  });
}

function page(props: Record<string, unknown> = {}): Promise<El> {
  return mount<El>('settings-window', { settingsStore: settingsStore(), i18nStore, ...props });
}

const rows = (el: El) => shadowAll<El>(el, 'alps-category-item');
const row = (el: El, icon: string) => rows(el).find((r) => r.icon === icon)!;
const escape = (init: KeyboardEventInit = {}) =>
  new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true, ...init });
const tick = () => new Promise((r) => setTimeout(r, 0));

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  window.dispatchEvent(new Event('resize'));
}

const desktopWidth = window.innerWidth;

beforeEach(() => {
  window.location.hash = '#/settings';
});

afterEach(() => {
  cleanup();
  setWidth(desktopWidth);
  vi.restoreAllMocks();
  registry.enabledPlugins = null;
  history.replaceState(null, '', '#/');
});

describe('the window', () => {
  it('is a dialog titled Settings', async () => {
    const el = await page();
    const frame = shadow(el, '.window-frame');
    expect(frame.getAttribute('role')).toBe('dialog');
    expect(frame.getAttribute('aria-label')).toBe('settings.title');
    expect(shadow(el, '.header-title').textContent?.trim()).toBe('settings.title');
  });

  it('sits beneath every composer', async () => {
    // A composer opened over Settings floats above it, as it floated over the
    // Settings page.
    const store = new ComposeStore();
    store.openComposer({});
    expect(SETTINGS_WINDOW_Z).toBeLessThan(store.getState().activeComposers[0].zIndex!);
  });

  it('asks to close from its Close button', async () => {
    const el = await page();
    const closes = record(el, 'settings-close');
    shadow(el, '.close-btn').click();
    expect(closes).toHaveLength(1);
  });

  it('closes on Escape', async () => {
    const el = await page();
    const closes = record(el, 'settings-close');
    const press = escape();
    rows(el)[0].dispatchEvent(press);
    expect(closes).toHaveLength(1);
    expect(press.defaultPrevented).toBe(true);
  });

  it('leaves Escape to a dialog open inside it', async () => {
    // A confirm or a dropdown, open over a section: Escape closes THAT, and
    // one press must not take the whole window with it.
    const el = await page({ category: 'general' });
    const closes = record(el, 'settings-close');
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    const field = document.createElement('input');
    dialog.appendChild(field);
    shadow(el, 'main.main-view').appendChild(dialog);

    field.dispatchEvent(escape());
    expect(closes).toHaveLength(0);
  });

  it('leaves Escape to a composer floating above it', async () => {
    const el = await page();
    const closes = record(el, 'settings-close');
    const composer = document.createElement('alps-floating-composer');
    document.body.appendChild(composer);
    composer.dispatchEvent(escape());
    composer.remove();
    expect(closes).toHaveLength(0);
  });

  it('leaves a key some other handler already took', async () => {
    const el = await page();
    const closes = record(el, 'settings-close');
    const press = escape();
    press.preventDefault();
    rows(el)[0].dispatchEvent(press);
    expect(closes).toHaveLength(0);
  });

  it('stops listening for Escape once it is gone', async () => {
    const el = await page();
    const closes = record(el, 'settings-close');
    el.remove();
    document.body.dispatchEvent(escape());
    expect(closes).toHaveLength(0);
  });

  it('moves focus into itself, onto the current section', async () => {
    const el = await page({ category: 'appearance' });
    await tick();
    expect(deepActiveElement()).toBe(row(el, 'palette'));
  });

  it('commits the field being typed in before it goes', async () => {
    // The signature saves on `change`, which fires as the field loses focus;
    // Escape removed it while it still had focus.
    const el = await page({ category: 'identity' });
    const textarea = shadow<HTMLTextAreaElement>(el, 'textarea');
    textarea.focus();
    const blurred = vi.fn();
    textarea.addEventListener('blur', blurred);
    document.body.dispatchEvent(escape());
    expect(blurred).toHaveBeenCalled();
  });

  it('gives focus back to where it was when it closes', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const el = await page();
    await tick();
    expect(document.activeElement).not.toBe(opener);
    el.remove();
    expect(document.activeElement).toBe(opener);
  });
});

describe('the section list', () => {
  it('lists the built-in sections and every plugin section', async () => {
    registry.registerSettingsTab({ id: 'sw-test', labelKey: 'swTest.label', icon: 'key', component: 'sw-test-settings' });
    const el = await page();
    const ids = rows(el).map((r) => r.icon);
    expect(ids.slice(0, 7)).toEqual(['gear', 'bookOpen', 'palette', 'globe', 'user', 'users', 'fingerprint']);
    expect(rows(el).map((r) => r.textContent?.trim())).toContain('swTest.label');
  });

  it('drops a section once its plugin turns out to be off', async () => {
    // A direct load draws before the shell has read which plugins are on.
    registry.registerSettingsTab({ id: 'sw-off', pluginId: 'sw-off-plugin', labelKey: 'swOff.label', icon: 'key', component: 'sw-off-settings' });
    const el = await page();
    expect(rows(el).map((r) => r.textContent?.trim())).toContain('swOff.label');

    registry.setEnabledPlugins(['something-else']);
    await el.updateComplete;
    expect(rows(el).map((r) => r.textContent?.trim())).not.toContain('swOff.label');
  });

  it('opens a section from the keyboard, the current one marked', async () => {
    // The rows are buttons (sidebar-keyboard.test.ts).
    const el = await page({ category: 'reading' });
    expect(row(el, 'bookOpen').getAttribute('aria-current')).toBe('true');
    const asked = record<CustomEvent>(el, 'settings-category');
    row(el, 'palette').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(asked.map((e) => e.detail.category)).toEqual(['appearance']);
  });

  it('asks the shell for a section rather than writing the URL itself', async () => {
    const el = await page({ category: 'general' });
    const asked = record<CustomEvent>(el, 'settings-category');
    row(el, 'palette').click();
    expect(asked.map((e) => e.detail.category)).toEqual(['appearance']);
    expect(window.location.hash).toBe('#/settings');
  });

  it('shows General on a desktop when no section is named', async () => {
    const el = await page({ category: '' });
    expect(row(el, 'gear').hasAttribute('active')).toBe(true);
    expect(shadow(el, '.category-title').textContent?.trim()).toBe('settings.categories.general');
  });

  it('names the open section above it', async () => {
    const el = await page({ category: 'localization' });
    expect(shadow(el, '.category-title').textContent?.trim()).toBe('settings.categories.localization');
  });
});

describe('a section with unsaved changes', () => {
  /** A stand-in for the auto-reply: a section that reports a draft. */
  async function withDraft(category = 'general') {
    const el = await page({ category });
    const section = document.createElement('div') as HTMLDivElement & { hasUnsavedChanges: boolean };
    section.hasUnsavedChanges = true;
    shadow(el, '.settings-content-wrapper').appendChild(section);
    return { el, section };
  }
  const confirmOf = (el: El) => el.shadowRoot!.querySelector('ui-confirm') as El | null;

  it('asks before Close would drop it, and closes only when told to', async () => {
    const { el } = await withDraft();
    const closes = record(el, 'settings-close');
    shadow(el, '.close-btn').click();
    await el.updateComplete;

    const confirm = confirmOf(el);
    expect(confirm, 'the discard confirm').not.toBeNull();
    expect(confirm!.heading).toBe('settings.unsavedTitle');
    expect(confirm!.confirmText).toBe('settings.discard');
    expect(confirm!.cancelText).toBe('settings.keepEditing');
    expect(closes).toHaveLength(0);

    confirm!.dispatchEvent(new CustomEvent('confirm'));
    await el.updateComplete;
    expect(closes).toHaveLength(1);
    expect(confirmOf(el)).toBeNull();
  });

  it('keeps the window, and the draft, when the user keeps editing', async () => {
    const { el, section } = await withDraft();
    const closes = record(el, 'settings-close');
    document.body.dispatchEvent(escape());
    await el.updateComplete;
    confirmOf(el)!.dispatchEvent(new CustomEvent('cancel'));
    await el.updateComplete;

    expect(closes).toHaveLength(0);
    expect(confirmOf(el)).toBeNull();
    expect(section.isConnected).toBe(true);
  });

  it('asks before another section would drop it, and goes there once told to', async () => {
    const { el } = await withDraft();
    const asked = record<CustomEvent>(el, 'settings-category');
    row(el, 'palette').click();
    await el.updateComplete;
    expect(asked).toHaveLength(0);

    confirmOf(el)!.dispatchEvent(new CustomEvent('confirm'));
    await el.updateComplete;
    expect(asked.map((e) => e.detail.category)).toEqual(['appearance']);
  });

  it('does not ask about the section already open', async () => {
    const { el } = await withDraft();
    const asked = record<CustomEvent>(el, 'settings-category');
    row(el, 'gear').click();
    await el.updateComplete;
    expect(confirmOf(el)).toBeNull();
    expect(asked).toHaveLength(0);
  });

  it('closes at once once the draft is saved', async () => {
    const { el, section } = await withDraft();
    section.hasUnsavedChanges = false;
    const closes = record(el, 'settings-close');
    shadow(el, '.close-btn').click();
    expect(closes).toHaveLength(1);
    expect(confirmOf(el)).toBeNull();
  });
});

describe('on a phone', () => {
  it('opens on the section list when no section is named', async () => {
    setWidth(400);
    const el = await page({ category: '' });
    expect(el.shadowRoot!.querySelector('nav.sections')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('main.main-view')).toBeNull();
  });

  it('shows one section, with a way back to the list', async () => {
    setWidth(400);
    const el = await page({ category: 'reading' });
    expect(el.shadowRoot!.querySelector('nav.sections')).toBeNull();
    expect(el.shadowRoot!.querySelector('main.main-view')).not.toBeNull();

    const asked = record<CustomEvent>(el, 'settings-category');
    shadow(el, '.back-to-sections').click();
    expect(asked.map((e) => e.detail.category)).toEqual(['']);
  });

  it('keeps keyboard focus in the phone view when a section replaces the list, and back', async () => {
    setWidth(400);
    const el = await page({ category: '' });
    row(el, 'palette').focus();
    el.category = 'appearance';
    await el.updateComplete;
    const back = shadow<HTMLButtonElement>(el, '.back-to-sections');
    expect(deepActiveElement()).toBe(back);

    back.focus();
    el.category = '';
    await el.updateComplete;
    expect(deepActiveElement()).toBe(row(el, 'gear'));
  });

  it('does not take focus from a composer when the phone view changes', async () => {
    setWidth(400);
    const el = await page({ category: '' });
    const composer = document.createElement('alps-floating-composer');
    const field = document.createElement('input');
    composer.appendChild(field);
    document.body.appendChild(composer);
    field.focus();
    el.category = 'appearance';
    await el.updateComplete;
    expect(deepActiveElement()).toBe(field);
    composer.remove();
  });

  it('follows the viewport across the breakpoint, and stops when it is gone', async () => {
    const el = await page({ category: '' });
    setWidth(500);
    expect(el.isMobile).toBe(true);
    setWidth(1200);
    expect(el.isMobile).toBe(false);

    el.remove();
    setWidth(500);
    expect(el.isMobile).toBe(false);
  });
});

describe('staying in step with the store', () => {
  it('re-reads when another part of the app changes a setting', async () => {
    const store = settingsStore();
    const el = await page({ settingsStore: store, category: 'identity' });
    store.getState().signature = 'new';
    store.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(shadow<HTMLTextAreaElement>(el, 'textarea').value).toBe('new');
  });

  it('stores what a control changes, one key at a time', async () => {
    const store = settingsStore();
    const el = await page({ settingsStore: store });
    await el.handleUpdate({ target: { type: 'select-one', value: '15' } } as unknown as Event, 'autoLogout');
    expect(store.updates).toEqual([{ autoLogout: 15 }]);
  });
});
