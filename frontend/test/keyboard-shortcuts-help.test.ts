import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/app-root';
import { registry } from '../src/plugin-registry';
import { characterShortcutAllowed } from '../src/utils/keyboard-shortcuts';
import { cleanup, flush, mount, shadow } from './helpers/dom';

type El = HTMLElement & Record<string, any>;
const tag = 'shortcut-test-page';
if (!customElements.get(tag)) customElements.define(tag, class extends HTMLElement {});
registry.registerRoute({ path: '/shortcut-test', component: tag });

beforeEach(() => {
  localStorage.clear();
  document.cookie = 'alps_logged_in=1; path=/';
  history.replaceState(null, '', '#/shortcut-test');
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));
});

afterEach(() => {
  cleanup();
  window.dispatchEvent(new Event('session-cleared'));
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.cookie = 'alps_logged_in=; path=/; max-age=0';
  history.replaceState(null, '', '#/');
  localStorage.clear();
});

function press(target: EventTarget, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true, composed: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

async function shell() {
  const app = await mount<El>('app-root');
  await flush();
  await app.updateComplete;
  return app;
}

const help = (app: El) => app.shadowRoot!.querySelector<El>('keyboard-shortcuts-dialog');

async function openHelp(app: El) {
  expect(press(document.body).defaultPrevented).toBe(true);
  await app.updateComplete;
  const el = help(app)!;
  await el.updateComplete;
  await shadow<El>(el, 'ui-modal').updateComplete;
  return el;
}

describe('shortcut help', () => {
  it('opens a named native modal and closes via its visible action', async () => {
    const app = await shell();
    const el = await openHelp(app);
    const modal = shadow<El>(el, 'ui-modal');
    expect(shadow<HTMLDialogElement>(modal, 'dialog').open).toBe(true);
    expect(modal.heading).toBe('Keyboard shortcuts');
    expect(el.shadowRoot!.textContent).toContain('Mark as read');
    expect(el.shadowRoot!.textContent).toContain('Archive');
    shadow<HTMLButtonElement>(el, 'button').click();
    await app.updateComplete;
    expect(help(app)).toBeNull();
  });

  it('saves the opt-out and keeps the clickable help entry available', async () => {
    const app = await shell();
    const save = vi.spyOn(app.settingsStore, 'updateSettings');
    const el = await openHelp(app);
    const check = shadow<HTMLInputElement>(el, 'input');
    expect(check.checked).toBe(true);
    check.click();
    expect(save).toHaveBeenCalledWith({ keyboardShortcuts: false });
    shadow<HTMLButtonElement>(el, 'button').click();
    await app.updateComplete;
    expect(press(document.body).defaultPrevented).toBe(false);
    expect(help(app)).toBeNull();

    const header = await mount<El>('alps-header', { username: 'ada@example.com', i18nStore: app.i18nStore });
    const button = shadow<HTMLButtonElement>(header, '.shortcuts-help');
    expect(button.getAttribute('aria-label')).toBe('Keyboard shortcuts');
    expect(button.textContent?.trim()).toBe('?');
    header.addEventListener('open-shortcuts', () => app.dispatchEvent(new Event('open-shortcuts')));
    button.click();
    await app.updateComplete;
    expect(help(app)).not.toBeNull();
  });

  it('leaves a composing, repeated, modified or already consumed key alone', async () => {
    const app = await shell();
    for (const init of [{ isComposing: true }, { keyCode: 229 }, { repeat: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }]) {
      expect(press(document.body, init).defaultPrevented).toBe(false);
      await app.updateComplete;
      expect(help(app)).toBeNull();
    }
    const target = document.createElement('button');
    document.body.appendChild(target);
    target.addEventListener('keydown', e => e.preventDefault());
    press(target);
    await app.updateComplete;
    expect(help(app)).toBeNull();
  });

  it('does not open behind another modal, on settings, or on login', async () => {
    const app = await shell();
    const modal = await mount<El>('ui-modal', { heading: 'Other', dismissible: true });
    expect(press(document.body).defaultPrevented).toBe(false);
    modal.remove();
    for (const hash of ['#/settings', '#/login', '#/login/webauthn']) {
      history.replaceState(null, '', hash);
      expect(press(document.body).defaultPrevented).toBe(false);
    }
    await app.updateComplete;
    expect(help(app)).toBeNull();
  });

  it('stops listening when its shell is removed', async () => {
    const app = await shell();
    app.remove();
    expect(press(document.body).defaultPrevented).toBe(false);
  });

  it('closes the native dialog before removing a backdrop-dismissed reference', async () => {
    const app = await shell();
    const el = await openHelp(app);
    const modal = shadow<El>(el, 'ui-modal');
    const dialog = shadow<HTMLDialogElement>(modal, 'dialog');
    dialog.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    expect(dialog.open).toBe(false);
    await app.updateComplete;
    expect(help(app)).toBeNull();
  });
});

describe('character shortcut ownership', () => {
  it('allows commands from a checkbox after selecting mail', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    document.body.appendChild(checkbox);
    let allowed: boolean | undefined;
    checkbox.addEventListener('keydown', e => { allowed = characterShortcutAllowed(e as KeyboardEvent); });
    press(checkbox, { key: 'q' });
    expect(allowed).toBe(true);
  });

  for (const markup of ['<input>', '<textarea></textarea>', '<select><option>One</option></select>',
    '<div contenteditable="true"><span>text</span></div>', '<div role="textbox"><span>text</span></div>',
    '<div role="combobox"></div>', '<div role="dialog"><span>text</span></div>']) {
    it(`keeps characters in ${markup}`, () => {
      const host = document.createElement('div');
      const root = host.attachShadow({ mode: 'open' });
      root.innerHTML = markup;
      const target = root.querySelector('span') ?? root.firstElementChild!;
      document.body.appendChild(host);
      let allowed: boolean | undefined;
      host.addEventListener('keydown', e => { allowed = characterShortcutAllowed(e as KeyboardEvent); });
      press(target);
      expect(allowed).toBe(false);
    });
  }
});
