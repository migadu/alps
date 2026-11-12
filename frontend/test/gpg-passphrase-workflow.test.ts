import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, shadowAll, text, waitFor } from './helpers/dom';
import { I18nStore } from '../src/store/i18n-store';

const pgp = vi.hoisted(() => ({
  generateKey: vi.fn(),
  readKey: vi.fn(),
  readPrivateKey: vi.fn(),
  decryptKey: vi.fn(),
  encryptKey: vi.fn(),
  readMessage: vi.fn(),
  decrypt: vi.fn(),
}));
vi.mock('openpgp', () => pgp);
import '../../plugins/gpg/frontend/gpg-settings';
import { handleReaderContent } from '../../plugins/gpg/frontend/gpg-crypto';

type El = HTMLElement & Record<string, any>;
let saves: string[];

beforeEach(() => {
  vi.resetAllMocks();
  saves = [];
  pgp.generateKey.mockResolvedValue({ publicKey: 'public armour', privateKey: 'encrypted armour' });
  pgp.readKey.mockResolvedValue({});
  pgp.readPrivateKey.mockResolvedValue({ isDecrypted: () => false });
  pgp.decryptKey.mockRejectedValueOnce(new Error('wrong passphrase')).mockResolvedValue({ isDecrypted: () => true });
  // OpenPGP.encryptKey returns a PrivateKey object; the transport needs its armor.
  pgp.encryptKey.mockResolvedValue({ armor: () => 'new encrypted armour' });
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
    localStorage.setItem('alps_active_user', 'ada');
    localStorage.setItem('alps_settings_ada', JSON.stringify({ loginUsername: 'ada', loginAddress: 'ada@example.com', name: 'Ada Lovelace' }));
    const el = await pane();
    const finished = el.generateKeys();
    const first = await prompt(el);
    await submit(first, 'new secret', true);
    const confirmation = await prompt(el, first);
    expect((await input(confirmation)).value).toBe('');
    await submit(confirmation, 'new secret', true);
    await finished;
    expect(pgp.generateKey).toHaveBeenCalledTimes(1);
    expect(pgp.generateKey).toHaveBeenCalledWith(expect.objectContaining({ passphrase: 'new secret', userIDs: [{ name: 'Ada Lovelace', email: 'ada@example.com' }] }));
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

/**
 * A keypair generated or imported is saved to the server, and replaces the
 * one the page holds unlocked. Neither save looked at the answer: a refused
 * import cleared the pasted keys and said nothing, and a refused generation
 * went back to the pane as though it had worked. Nor did either forget the
 * unlocked key, so the page went on reading, and signing, with the old one.
 */
describe('saving a keypair', () => {
  const encrypted = '-----BEGIN PGP MESSAGE-----\nxyz\n-----END PGP MESSAGE-----';
  /** Opens an encrypted message, and answers which key opened it. */
  const read = async () => String(await handleReaderContent({ content: encrypted, banners: [], i18nStore: { t: (k: string) => k } }));

  let stored: string;
  let refuse: boolean;
  let alerts: string[];

  beforeEach(() => {
    stored = 'OLD-KEY';
    refuse = false;
    alerts = [];
    vi.stubGlobal('alert', (message: string) => { alerts.push(message); });
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        saves.push(String(init.body));
        if (refuse) return new Response('{"error":"An internal error occurred"}', { status: 500, statusText: 'Internal Server Error' });
        stored = JSON.parse(String(init.body)).encrypted_private_key;
        return new Response('{"success":true}');
      }
      return new Response(JSON.stringify({ public_key: 'public armour', encrypted_private_key: stored }));
    }));
    pgp.readPrivateKey.mockImplementation(async ({ armoredKey }: { armoredKey: string }) => ({ armoredKey, isDecrypted: () => true }));
    pgp.readMessage.mockResolvedValue({});
    pgp.decrypt.mockImplementation(async ({ decryptionKeys }: { decryptionKeys: { armoredKey: string } }) => ({ data: `opened with ${decryptionKeys.armoredKey}` }));
  });

  afterEach(() => {
    window.dispatchEvent(new CustomEvent('session-cleared'));
  });

  async function generate(el: El) {
    const finished = el.generateKeys();
    const first = await prompt(el);
    await submit(first, 'new secret');
    await submit(await prompt(el, first), 'new secret');
    await finished;
  }

  async function importPasted(el: El) {
    el.viewState = 'import';
    el.pubKeyInput = 'public armour';
    el.privKeyInput = 'private armour';
    const finished = el.importKeys();
    const first = await prompt(el);
    await submit(first, 'new secret');
    await submit(await prompt(el, first), 'new secret');
    await finished;
  }

  it('reads with a generated keypair once it is saved, not with the one unlocked before', async () => {
    expect(await read()).toContain('opened with OLD-KEY');
    await generate(await pane());
    expect(stored).toBe('encrypted armour');
    expect(await read()).toContain('opened with encrypted armour');
  });

  it('reads with an imported keypair once it is saved, not with the one unlocked before', async () => {
    expect(await read()).toContain('opened with OLD-KEY');
    await importPasted(await pane());
    expect(stored).toBe('new encrypted armour');
    expect(await read()).toContain('opened with new encrypted armour');
  });

  it('saves an imported encrypted PrivateKey as armored text', async () => {
    await importPasted(await pane());
    expect(saves).toHaveLength(1);
    expect(JSON.parse(saves[0]).encrypted_private_key).toBe('new encrypted armour');
  });

  it.each([['generate', false], ['import', false], ['generate', true], ['import', true]] as const)('pending key read after %s, refused=%s, keeps the accepted key', async (method, refused) => {
    let release!: () => void;
    let entered!: () => void;
    const pendingKey = new Promise<void>(resolve => { release = resolve; });
    const parsing = new Promise<void>(resolve => { entered = resolve; });
    pgp.readPrivateKey.mockImplementationOnce(async ({ armoredKey }: { armoredKey: string }) => {
      entered();
      await pendingKey;
      return { armoredKey, isDecrypted: () => true };
    });
    const earlier = read();
    await parsing;
    try {
      refuse = refused;
      if (method === 'generate') await generate(await pane());
      else await importPasted(await pane());
    } finally {
      release();
    }
    // The read already underway may use its old key, but must not restore it
    // as the key future reads/signatures use after the replacement succeeded.
    expect(await earlier).toContain('opened with OLD-KEY');
    const expected = refused ? 'OLD-KEY' : method === 'generate' ? 'encrypted armour' : 'new encrypted armour';
    const parses = pgp.readPrivateKey.mock.calls.length;
    expect(await read()).toContain(`opened with ${expected}`);
    expect(pgp.readPrivateKey).toHaveBeenCalledTimes(parses + (refused ? 0 : 1));
  });

  it('says so when the server refuses a generated keypair, and keeps the key it has', async () => {
    expect(await read()).toContain('opened with OLD-KEY');
    refuse = true;
    await generate(await pane());
    expect(saves).toHaveLength(1);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatch(/^Failed to generate keys: /);
    expect(await read()).toContain('opened with OLD-KEY');
  });

  it('says so when the server refuses an import, and keeps the pasted keys', async () => {
    refuse = true;
    const el = await pane();
    await importPasted(el);
    expect(saves).toHaveLength(1);
    expect(el.importError).toMatch(/^Import failed: /);
    expect(el.viewState).toBe('import');
    expect([el.pubKeyInput, el.privKeyInput]).toEqual(['public armour', 'private armour']);
  });
});

/**
 * Purging the keypair deletes it from the server, and only then from the
 * page. The page cleared its keys and forgot the unlocked one whatever the
 * server answered: a refused delete showed no keypair, the keypair came back
 * on the next visit, and in the meantime this tab could no longer open
 * encrypted mail.
 */
describe('purging the keypair', () => {
  const encrypted = '-----BEGIN PGP MESSAGE-----\nxyz\n-----END PGP MESSAGE-----';
  const read = async () => String(await handleReaderContent({ content: encrypted, banners: [], i18nStore: { t: (k: string) => k } }));

  /** How the server answers the delete: 'ok', a refusal, or no answer at all. */
  let answer: 'ok' | 'refused' | 'offline';
  let keyring: Record<string, string>;
  let alerts: string[];

  beforeEach(() => {
    answer = 'ok';
    keyring = { public_key: 'public armour', encrypted_private_key: 'OLD-KEY' };
    alerts = [];
    vi.stubGlobal('alert', (message: string) => { alerts.push(message); });
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        if (answer === 'offline') throw new TypeError('Failed to fetch');
        if (answer === 'refused') return new Response('{"error":"An internal error occurred"}', { status: 500, statusText: 'Internal Server Error' });
        keyring = {};
        return new Response('{"success":true}');
      }
      return new Response(JSON.stringify(keyring));
    }));
    pgp.readPrivateKey.mockImplementation(async ({ armoredKey }: { armoredKey: string }) => ({ armoredKey, isDecrypted: () => true }));
    pgp.readMessage.mockResolvedValue({});
    pgp.decrypt.mockImplementation(async ({ decryptionKeys }: { decryptionKeys: { armoredKey: string } }) => ({ data: `opened with ${decryptionKeys.armoredKey}` }));
  });

  afterEach(() => {
    window.dispatchEvent(new CustomEvent('session-cleared'));
  });

  it.each(['ok', 'refused', 'offline'] as const)('a pending old key read respects a purge answered %s', async (how) => {
    let release!: () => void;
    let entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const parsing = new Promise<void>(resolve => { entered = resolve; });
    pgp.readPrivateKey.mockImplementationOnce(async ({ armoredKey }: { armoredKey: string }) => {
      entered();
      await gate;
      return { armoredKey, isDecrypted: () => true };
    });
    const earlier = read();
    await parsing;
    const el = await pane();
    answer = how;
    try { await el.purgeKeys(); } finally { release(); }
    expect(await earlier).toContain('opened with OLD-KEY');
    if (how === 'ok') {
      expect(el.keyring).toBeNull();
      expect(await read()).not.toContain('opened with OLD-KEY');
    } else {
      expect(el.keyring).toEqual(keyring);
      const parses = pgp.readPrivateKey.mock.calls.length;
      expect(await read()).toContain('opened with OLD-KEY');
      expect(pgp.readPrivateKey).toHaveBeenCalledTimes(parses);
    }
  });

  it('clears the keypair and the unlocked key once the server has deleted them', async () => {
    expect(await read()).toContain('opened with OLD-KEY');
    const el = await pane();
    expect(el.keyring).not.toBeNull();
    await el.purgeKeys();
    expect(el.keyring).toBeNull();
    expect(alerts).toEqual([]);
    // The unlocked key is gone with it: the next message reads the keyring
    // again, and finds none.
    expect(await read()).not.toContain('opened with OLD-KEY');
  });

  it.each(['refused', 'offline'] as const)('keeps both, and says so, when the delete is %s', async (how) => {
    expect(await read()).toContain('opened with OLD-KEY');
    const el = await pane();
    answer = how;
    await el.purgeKeys();
    await el.updateComplete;
    expect(el.loading).toBe(false);
    expect(el.keyring).toEqual(keyring);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatch(/^Failed to purge keys: /);
    expect(await read()).toContain('opened with OLD-KEY');
  });
});

/**
 * The page offers to generate or import a keypair only once a read has
 * answered that there is none. A read that failed, refused or timed out, left
 * the page saying "No key present" beside both, and either one saved a new
 * keypair over the one stored: for a keypair generated here, the only copy of
 * its private key.
 */
describe('reading the keypair', () => {
  const stored = { public_key: 'public armour', encrypted_private_key: 'OLD-KEY' };
  /** How the server answers the read: the keypair, a refusal, or no answer in time. */
  let answer: 'ok' | 'refused' | 'timed out';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      if (answer === 'timed out') throw new DOMException('The operation was aborted.', 'AbortError');
      if (answer === 'refused') return new Response('{"error":"An internal error occurred"}', { status: 500, statusText: 'Internal Server Error' });
      return new Response(JSON.stringify(stored));
    }));
  });

  /** The labels of the pane's buttons. */
  const buttons = (el: El) => shadowAll<HTMLElement>(el, 'alps-button').map(b => b.textContent?.trim());

  it.each(['refused', 'timed out'] as const)('a read %s says so, offers Try again, and offers no new keypair', async (how) => {
    answer = how;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const el = await pane();
    expect(text(el)).not.toContain('No key present');
    expect(text(el, '[role="alert"]')).toBe('Could not load the GPG keys.');
    expect(buttons(el)).toEqual(['Try again']);

    // Try again reads once more, and this time shows the keypair stored.
    answer = 'ok';
    shadow<El>(el, 'alps-button').click();
    await waitFor(() => !el.loading && !!el.shadowRoot?.querySelector('.key-info'), 'the keypair');
    expect(text(el, '.key-info')).toBe('public armour');
    expect(buttons(el)).toEqual(['Purge Keypair']);
  });

  it('a read that answers no keypair offers to generate or import one', async () => {
    answer = 'ok';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"public_key":"","encrypted_private_key":""}')));
    const el = await pane();
    expect(el.shadowRoot!.querySelector('[role="alert"]')).toBeNull();
    expect(text(el)).toContain('No key present');
    expect(buttons(el)).toEqual(['Generate New Keypair', 'Import Existing GPG Keypair']);
  });
});

/**
 * A save from a page that showed no keypair does not ask the server to
 * replace one, and the server keeps a keypair stored since the page read. The
 * page then reads again, and shows the keypair the server kept.
 */
describe('saving a keypair the page did not show', () => {
  let keyring: Record<string, string>;
  let posted: string[];
  let alerts: string[];

  beforeEach(() => {
    keyring = {};
    posted = [];
    alerts = [];
    vi.stubGlobal('alert', (message: string) => { alerts.push(message); });
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        posted.push(url);
        if (keyring.public_key && !new URL(url, 'http://alps.test').searchParams.has('replace')) {
          return new Response('{"error":"a keypair is stored already"}', { status: 409, statusText: 'Conflict' });
        }
        keyring = JSON.parse(String(init.body));
        return new Response('{"success":true}');
      }
      return new Response(JSON.stringify(keyring));
    }));
    pgp.readPrivateKey.mockResolvedValue({ isDecrypted: () => true });
  });

  async function generate(el: El) {
    const finished = el.generateKeys();
    const first = await prompt(el);
    await submit(first, 'new secret');
    await submit(await prompt(el, first), 'new secret');
    await finished;
  }

  async function importPasted(el: El) {
    el.viewState = 'import';
    el.pubKeyInput = 'pasted public';
    el.privKeyInput = 'pasted private';
    const finished = el.importKeys();
    const first = await prompt(el);
    await submit(first, 'new secret');
    await submit(await prompt(el, first), 'new secret');
    await finished;
  }

  it.each(['generate', 'import'] as const)('%s, over a keypair stored meanwhile, keeps it and shows it', async (method) => {
    const el = await pane();
    expect(el.keyring).toBeNull();
    // Another session stores a keypair after this page read none.
    keyring = { public_key: 'stored elsewhere', encrypted_private_key: 'OTHER-KEY' };
    if (method === 'generate') await generate(el);
    else await importPasted(el);
    expect(posted).toEqual(['/gpg/keys']);
    expect(keyring).toEqual({ public_key: 'stored elsewhere', encrypted_private_key: 'OTHER-KEY' });
    await waitFor(() => !el.loading, 'the read after the refusal');
    await el.updateComplete;
    expect(text(el, '.key-info')).toBe('stored elsewhere');
    if (method === 'generate') expect(alerts).toEqual(['Failed to generate keys: 409 Conflict']);
    else expect(el.importError).toBe('Import failed: 409 Conflict');
  });

  it('generate, with no keypair stored, saves one without asking to replace any', async () => {
    const el = await pane();
    await generate(el);
    expect(posted).toEqual(['/gpg/keys']);
    expect(keyring).toEqual({ public_key: 'public armour', encrypted_private_key: 'encrypted armour' });
    expect(alerts).toEqual([]);
    await el.updateComplete;
    expect(text(el, '.key-info')).toBe('public armour');
  });

  it('a save over the keypair the page shows asks to replace it', async () => {
    keyring = { public_key: 'shown', encrypted_private_key: 'SHOWN-KEY' };
    const el = await pane();
    expect(el.keyring).not.toBeNull();
    await generate(el);
    expect(posted).toEqual(['/gpg/keys?replace=1']);
    expect(keyring).toEqual({ public_key: 'public armour', encrypted_private_key: 'encrypted armour' });
  });
});
