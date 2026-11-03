/**
 * Settings › Identity › Sending addresses.
 *
 * The other addresses the user sends from, added, edited and removed in
 * place. Each change is applied as it is saved, and what the form takes is
 * only what the server takes: one bare address, its domain in A-label form,
 * neither the account's own address nor one already listed, and twenty at
 * most. A refusal from the server would leave the entry on screen and saved
 * nowhere, so the form refuses first, and says why.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { SettingsStore } from '../src/store/settings-store';
import type { Identity } from '../src/utils/identities';
import '../src/components/alps-identities-settings';
import '../src/components/settings-window';
import { cleanup, click, mount, shadow, shadowAll, text } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string, params?: Record<string, unknown>) => (params?.address ? `${key} ${params.address}` : key),
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

/** A store whose updates are applied and recorded, as the real one applies them. */
function settingsStore(identities: Identity[] = [], name = 'Ada Lovelace') {
  const updates: Record<string, unknown>[] = [];
  const store = Object.assign(new EventTarget(), {
    state: { ...new SettingsStore().getState(), loginUsername: 'ada@example.com', name, identities },
    getState: () => store.state,
    updateSettings: (patch: Record<string, unknown>) => {
      updates.push(patch);
      store.state = { ...store.state, ...patch };
      store.dispatchEvent(new Event('change'));
    },
    updates,
  });
  return store;
}

const list = (identities: Identity[] = [], name?: string) =>
  mount<El>('alps-identities-settings', { settingsStore: settingsStore(identities, name), i18nStore });

/** Types into one of the form's fields, as alps-input reports it. */
function type(el: El, which: 'name' | 'address', value: string) {
  const field = shadowAll<El>(el, '.identity-form alps-input')[which === 'name' ? 0 : 1];
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

const button = (host: Element) => host.shadowRoot!.querySelector('button')!;

async function save(el: El) {
  await click(shadowAll<El>(el, '.identity-form alps-button')[0], el);
}

afterEach(cleanup);

describe('the list', () => {
  it('shows each address with the name it goes out under, the account\'s when it has none', async () => {
    const el = await list([{ name: 'Engines', address: 'engines@work.example' }, { name: '', address: 'ada@lists.example' }]);
    const rows = shadowAll(el, '.identity');
    expect(rows.map((row) => row.querySelector('.sender')!.textContent!.replace(/\s+/g, ' ').trim())).toEqual([
      'Engines <engines@work.example>',
      'Ada Lovelace <ada@lists.example>',
    ]);
    // The address in an isolate of its own, left to right in any language.
    expect(rows[0].querySelector('.sender bdi[dir="ltr"]')?.textContent).toBe('engines@work.example');
    // Each row's buttons are named for the address they act on.
    expect(rows[0].querySelector<El>('alps-icon-btn.edit')!.title).toBe('settings.identity.editIdentity engines@work.example');
    expect(rows[0].querySelector<El>('alps-icon-btn.remove')!.title).toBe('settings.identity.removeIdentity engines@work.example');
  });

  it('shows no list while there is nothing in it', async () => {
    const el = await list();
    expect(el.shadowRoot!.querySelector('ul')).toBeNull();
    expect(shadow(el, 'alps-button.add')).toBeTruthy();
  });
});

describe('adding an address', () => {
  it('adds it, its domain in A-label form, and puts the focus back on Add', async () => {
    const el = await list([{ name: '', address: 'ada@lists.example' }]);
    await click(shadow(el, 'alps-button.add'), el);
    // The form opens on its first field.
    expect(el.shadowRoot!.activeElement?.localName).toBe('alps-input');
    type(el, 'name', '  Ada at the bookshop ');
    type(el, 'address', ' ada@bücher.example ');
    await save(el);

    expect(el.settingsStore.updates).toEqual([{
      identities: [{ name: '', address: 'ada@lists.example' }, { name: 'Ada at the bookshop', address: 'ada@xn--bcher-kva.example' }],
    }]);
    expect(el.shadowRoot!.querySelector('.identity-form')).toBeNull();
    expect(el.shadowRoot!.activeElement).toBe(shadow(el, 'alps-button.add'));
  });

  it.each([
    ['not an address', 'ada', 'settings.identity.identityInvalid'],
    ['a name and an address', 'Ada <ada@work.example>', 'settings.identity.identityInvalid'],
    ['a quoted local part, which the server would read otherwise', '"ada"@work.example', 'settings.identity.identityInvalid'],
    ['the account\'s own address', 'ADA@example.com', 'settings.identity.identityOwn'],
    ['an address already listed', 'Engines@Work.example', 'settings.identity.identityDuplicate'],
  ])('refuses %s, and says why', async (_, address, problem) => {
    const el = await list([{ name: '', address: 'engines@work.example' }]);
    await click(shadow(el, 'alps-button.add'), el);
    type(el, 'address', address);
    await save(el);

    expect(el.settingsStore.updates).toEqual([]);
    const alert = shadow(el, '.identity-form [role="alert"]');
    expect(alert.textContent).toBe(problem);
    // Typing again takes the complaint away.
    type(el, 'address', `${address}x`);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[role="alert"]')).toBeNull();
  });

  it('saves on Enter in a field', async () => {
    const el = await list();
    await click(shadow(el, 'alps-button.add'), el);
    type(el, 'address', 'ada@work.example');
    const form = shadow<HTMLFormElement>(el, '.identity-form');
    form.requestSubmit();
    await el.updateComplete;
    expect(el.settingsStore.updates).toEqual([{ identities: [{ name: '', address: 'ada@work.example' }] }]);
  });

  it('is not offered past twenty, and says so', async () => {
    const full = Array.from({ length: 20 }, (_, i) => ({ name: '', address: `alias${i}@work.example` }));
    const el = await list(full);
    expect(button(shadow(el, 'alps-button.add')).disabled).toBe(true);
    expect(text(el, '.note')).toBe('settings.identity.identitiesFull');
  });
});

describe('editing and removing', () => {
  it('changes an entry in place, keeping its place in the list', async () => {
    const el = await list([{ name: 'Engines', address: 'engines@work.example' }, { name: '', address: 'ada@lists.example' }]);
    await click(shadowAll(el, 'alps-icon-btn.edit')[0], el);
    const fields = shadowAll<El>(el, '.identity-form alps-input');
    expect(fields.map((f) => f.value)).toEqual(['Engines', 'engines@work.example']);
    // Its own address is no duplicate of itself.
    type(el, 'name', 'Analytical Engines');
    await save(el);

    expect(el.settingsStore.updates).toEqual([{
      identities: [{ name: 'Analytical Engines', address: 'engines@work.example' }, { name: '', address: 'ada@lists.example' }],
    }]);
    // The focus goes back to the Edit button it came from.
    expect(el.shadowRoot!.activeElement).toBe(shadowAll(el, 'alps-icon-btn.edit')[0]);
  });

  it('removes an entry, and puts the focus on the next one', async () => {
    const el = await list([{ name: '', address: 'a@work.example' }, { name: '', address: 'b@work.example' }]);
    await click(shadowAll(el, 'alps-icon-btn.remove')[0], el);
    expect(el.settingsStore.updates).toEqual([{ identities: [{ name: '', address: 'b@work.example' }] }]);
    expect(el.shadowRoot!.activeElement).toBe(shadowAll(el, 'alps-icon-btn.edit')[0]);

    await click(shadowAll(el, 'alps-icon-btn.remove')[0], el);
    expect(el.settingsStore.updates.at(-1)).toEqual({ identities: [] });
    expect(el.shadowRoot!.activeElement).toBe(shadow(el, 'alps-button.add'));
  });
});

describe('what is typed and not saved', () => {
  it('keeps the open edit until Save or Cancel instead of offering conflicting list actions', async () => {
    const el = await list([{ name: 'Engines', address: 'engines@work.example' }, { name: '', address: 'ada@lists.example' }]);
    await click(shadowAll(el, 'alps-icon-btn.edit')[0], el);
    type(el, 'name', 'Unsaved engines');
    await el.updateComplete;
    expect(el.hasUnsavedChanges).toBe(true);
    for (const action of shadowAll(el, 'alps-icon-btn.edit, alps-icon-btn.remove, alps-button.add')) {
      expect(button(action).disabled).toBe(true);
      button(action).click();
    }
    await el.updateComplete;
    expect(el.settingsStore.updates).toEqual([]);
    expect(shadowAll<El>(el, '.identity-form alps-input')[0].value).toBe('Unsaved engines');
    await save(el);
    expect(el.settingsStore.updates.at(-1)).toEqual({ identities: [
      { name: 'Unsaved engines', address: 'engines@work.example' }, { name: '', address: 'ada@lists.example' },
    ] });
    expect(button(shadow(el, 'alps-button.add')).disabled).toBe(false);
  });

  it('is unsaved, so the window asks before it is dropped', async () => {
    const el = await list();
    expect(el.hasUnsavedChanges).toBe(false);
    await click(shadow(el, 'alps-button.add'), el);
    // An empty form holds nothing to lose.
    expect(el.hasUnsavedChanges).toBe(false);
    type(el, 'address', 'ada@work.example');
    expect(el.hasUnsavedChanges).toBe(true);
    el.discardUnsavedChanges();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.identity-form')).toBeNull();
    expect(el.settingsStore.updates).toEqual([]);
  });

  it('is dropped by Escape, which closes the form and not the window', async () => {
    const el = await list();
    await click(shadow(el, 'alps-button.add'), el);
    type(el, 'address', 'ada@work.example');
    const input = shadowAll<El>(el, '.identity-form alps-input')[1].shadowRoot!.querySelector('input')!;
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true });
    input.dispatchEvent(escape);
    await el.updateComplete;
    expect(escape.defaultPrevented).toBe(true);
    expect(el.shadowRoot!.querySelector('.identity-form')).toBeNull();
    expect(el.settingsStore.updates).toEqual([]);
  });

  it('is what the Identity section answers the window with', async () => {
    const store = settingsStore();
    const win = await mount<El>('settings-window', { settingsStore: store, i18nStore, category: 'identity' });
    const section = shadow<El>(win, 'alps-identities-settings');
    await section.updateComplete;
    await click(shadow(section, 'alps-button.add'), section);
    type(section, 'address', 'ada@work.example');
    expect(win.hasUnsavedChanges).toBe(true);
  });
});
