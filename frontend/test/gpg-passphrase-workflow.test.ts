import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, waitFor } from './helpers/dom';
import { I18nStore } from '../src/store/i18n-store';

const pgp = vi.hoisted(() => ({
  generateKey: vi.fn(),
  readKey: vi.fn(),
  readPrivateKey: vi.fn(),
  decryptKey: vi.fn(),
  encryptKey: vi.fn(),
}));
vi.mock('openpgp', () => pgp);
import '../../plugins/gpg/frontend/gpg-settings';

type El = HTMLElement & Record<string, any>;
let saves: string[];

beforeEach(() => {
  vi.resetAllMocks();
  saves = [];
  pgp.generateKey.mockResolvedValue({ publicKey: 'public armour', privateKey: 'encrypted armour' });
  pgp.readKey.mockResolvedValue({});
  pgp.readPrivateKey.mockResolvedValue({ isDecrypted: () => false });
  pgp.decryptKey.mockRejectedValueOnce(new Error('wrong passphrase')).mockResolvedValue({ isDecrypted: () => true });
  pgp.encryptKey.mockResolvedValue('new encrypted armour');
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'POST') saves.push(String(init.body));
    return new Response('{}');
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

async function pane(): Promise<El> {
  const el = await mount<El>('alps-gpg-settings', { i18nStore: new I18nStore() });
  await waitFor(() => !el.loading, 'the key read');
  await el.updateComplete;
  return el;
}

async function prompt(el: El, previous?: El): Promise<El> {
  await waitFor(() => {
    const next = el.shadowRoot?.querySelector('ui-prompt');
    return !!next && next !== previous;
  }, 'a fresh passphrase form');
  const next = shadow<El>(el, 'ui-prompt');
  await next.updateComplete;
  return next;
}

async function input(form: El): Promise<HTMLInputElement> {
  const field = shadow<El>(form, 'alps-input');
  await field.updateComplete;
  return shadow<HTMLInputElement>(field, 'input');
}

async function fill(form: El, value: string) {
  const field = await input(form);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await form.updateComplete;
}

async function action(form: El, index: number): Promise<HTMLButtonElement> {
  const host = form.shadowRoot!.querySelectorAll<El>('alps-button')[index];
  await host.updateComplete;
  return shadow<HTMLButtonElement>(host, 'button');
}

async function submit(form: El, value: string, twice = false) {
  await fill(form, value);
  const button = await action(form, 1);
  expect(button.disabled).toBe(false);
  button.click();
  if (twice) button.click();
}

async function dismissError(el: El) {
  await waitFor(() => !!el.shadowRoot?.querySelector('ui-modal'), 'the passphrase error');
  const host = shadow<El>(el, 'ui-modal');
  const close = host.querySelector<El>('alps-button')!;
  await close.updateComplete;
  shadow<HTMLButtonElement>(close, 'button').click();
}

describe('GPG passphrase steps', () => {
  it('confirms in a fresh empty form and generates/saves once, despite duplicate submits', async () => {
    const el = await pane();
    const finished = el.generateKeys();
    const first = await prompt(el);
    await submit(first, 'new secret', true);
    const confirmation = await prompt(el, first);
    expect((await input(confirmation)).value).toBe('');
    await submit(confirmation, 'new secret', true);
    await finished;
    expect(pgp.generateKey).toHaveBeenCalledTimes(1);
    expect(pgp.generateKey).toHaveBeenCalledWith(expect.objectContaining({ passphrase: 'new secret' }));
    expect(saves).toHaveLength(1);
    expect(JSON.parse(saves[0])).toEqual({ public_key: 'public armour', encrypted_private_key: 'encrypted armour' });
  });

  it('can stop an empty step or cancel confirmation, then start again', async () => {
    const el = await pane();
    let finished = el.generateKeys();
    await submit(await prompt(el), '');
    await finished;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('ui-prompt')).toBeNull();

    finished = el.generateKeys();
    const first = await prompt(el);
    expect((await input(first)).value).toBe('');
    await submit(first, 'secret');
    const confirmation = await prompt(el, first);
    (await action(confirmation, 0)).click();
    await finished;
    expect(pgp.generateKey).not.toHaveBeenCalled();
    expect(saves).toHaveLength(0);
  });

  it('a mismatch starts another empty, usable pair of prompts', async () => {
    const el = await pane();
    const finished = el.generateKeys();
    const first = await prompt(el);
    await submit(first, 'first secret');
    const confirmation = await prompt(el, first);
    await submit(confirmation, 'a different secret');
    await dismissError(el);
    const retry = await prompt(el);
    expect((await input(retry)).value).toBe('');
    await submit(retry, 'matching secret');
    const secondConfirmation = await prompt(el, retry);
    expect((await input(secondConfirmation)).value).toBe('');
    await submit(secondConfirmation, 'matching secret');
    await finished;
    expect(pgp.generateKey).toHaveBeenCalledTimes(1);
    expect(saves).toHaveLength(1);
  });

  it('a same-mode unlock retry also receives an empty form and an unlatched submit', async () => {
    const el = await pane();
    // This is the coalesced hide/show that two workflow continuations can
    // produce: mode alone cannot identify a new invocation of the same step.
    const finished = (async () => {
      expect(await el.promptForPassphrase('unlock')).toBe('wrong');
      return el.promptForPassphrase('unlock');
    })();
    const first = await prompt(el);
    await submit(first, 'wrong');
    const retry = await prompt(el, first);
    expect((await input(retry)).value).toBe('');
    await submit(retry, 'right');
    expect(await finished).toBe('right');
  });

  it('an imported encrypted key can retry its old passphrase and cancel before saving a replacement', async () => {
    const el = await pane();
    el.pubKeyInput = 'public armour';
    el.privKeyInput = 'protected private armour';
    const finished = el.importKeys();
    const first = await prompt(el);
    await submit(first, 'wrong');
    await dismissError(el);
    const retry = await prompt(el);
    expect(retry).not.toBe(first);
    expect((await input(retry)).value).toBe('');
    await submit(retry, 'old secret');
    const lock = await prompt(el, retry);
    await submit(lock, 'replacement');
    const confirmation = await prompt(el, lock);
    (await action(confirmation, 0)).click();
    await finished;
    expect(pgp.decryptKey).toHaveBeenCalledTimes(2);
    expect(pgp.encryptKey).not.toHaveBeenCalled();
    expect(saves).toHaveLength(0);
  });
});
