/**
 * The address an encrypted message looks up a recipient's public key by.
 *
 * A recipient is written as a pill, `Name <address>`, and a quoted name may
 * hold angle brackets of its own: the address is the one in the last pair.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Stands in for openpgp: a key is its armour, and the ciphertext names the keys it was made for. */
const openpgp = vi.hoisted(() => ({
  readKey: vi.fn(async ({ armoredKey }: { armoredKey: string }) => ({ armoredKey })),
  readPrivateKey: vi.fn(async ({ armoredKey }: { armoredKey: string }) => ({
    armoredKey,
    isDecrypted: () => true,
    toPublic: () => ({ armoredKey: `${armoredKey}-public` }),
  })),
  createMessage: vi.fn(async ({ text }: { text: string }) => ({ text })),
  encrypt: vi.fn(async ({ encryptionKeys }: { encryptionKeys: { armoredKey: string }[] }) =>
    `encrypted for ${encryptionKeys.map(k => k.armoredKey).join(', ')}`),
}));
vi.mock('openpgp', () => openpgp);

const { handlePresend } = await import('../../plugins/gpg/frontend/gpg-crypto');

const i18nStore = { t: (key: string) => key };

/** The public key each address has in the address book. */
const keys: Record<string, string> = { 'ada@example.com': 'ADA-KEY' };

let queries: string[];
let alerts: string[];

beforeEach(() => {
  localStorage.clear();
  queries = [];
  alerts = [];
  vi.stubGlobal('alert', (message: string) => { alerts.push(message); });
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    const url = new URL(String(input), 'http://alps.test');
    if (url.pathname === '/gpg/keys') {
      return new Response(JSON.stringify({ encrypted_private_key: 'MY-KEY' }), { status: 200 });
    }
    if (url.pathname === '/contacts') {
      const query = url.searchParams.get('query') ?? '';
      queries.push(query);
      const contacts = keys[query] ? [{ email: query, public_key: keys[query] }] : [];
      return new Response(JSON.stringify({ contacts }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  window.dispatchEvent(new CustomEvent('session-cleared'));
  localStorage.clear();
  vi.unstubAllGlobals();
});

/** Sends a text message to `to` with encryption on, and answers what would go out. */
async function send(recipients: string[], field: 'to' | 'cc' | 'bcc' = 'to', t = i18nStore) {
  const formData = new FormData();
  formData.set('text', 'Hello');
  formData.set('html', '');
  const instance = { encryptGpg: true, to: [], cc: [], bcc: [], format: 'text', [field]: recipients };
  return handlePresend({ instance, formData, composer: { i18nStore: t } });
}

describe('an encrypted message to a recipient', () => {
  it('looks the key up by the address, when the quoted name holds angle brackets', async () => {
    const sent = await send(['"Ada <Countess>" <ada@example.com>']);

    expect(queries).toEqual(['ada@example.com']);
    expect(alerts).toEqual([]);
    expect(sent).toBeInstanceOf(FormData);
    expect((sent as FormData).get('text')).toBe('encrypted for ADA-KEY, MY-KEY-public');
  });

  it('looks the key up by the address, for a plain name and for a bare address', async () => {
    expect(await send(['Ada Lovelace <ada@example.com>'])).toBeInstanceOf(FormData);
    expect(await send(['ada@example.com'])).toBeInstanceOf(FormData);

    expect(alerts).toEqual([]);
    expect(queries).toEqual(['ada@example.com', 'ada@example.com']);
  });
});


/**
 * The contact search the key is looked up through matches text anywhere in a
 * card's name or addresses, as CardDAV's text-match does. Its answer holds
 * every card that contains the address, and the first of them with a key was
 * taken: a message to bob@example.com was encrypted to superbob@example.com.
 */
describe('an encrypted message to an address that other contacts contain', () => {
  type Card = { name?: string; email?: string; emails?: { value: string }[]; public_key?: string };

  /** Answers a contact search with every card whose name or an address contains the text. */
  function addressBook(cards: Card[]) {
    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
      const url = new URL(String(input), 'http://alps.test');
      if (url.pathname === '/gpg/keys') {
        return new Response(JSON.stringify({ encrypted_private_key: 'MY-KEY' }), { status: 200 });
      }
      if (url.pathname === '/contacts') {
        const query = url.searchParams.get('query') ?? '';
        queries.push(query);
        const contacts = cards.filter((c) =>
          [c.name, c.email, ...(c.emails ?? []).map((e) => e.value)].some((v) => v?.toLowerCase().includes(query.toLowerCase())));
        return new Response(JSON.stringify({ contacts }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }));
  }

  /** Names the addresses without a key, as the dictionaries' template does. */
  const missing = { t: (key: string) => (key === 'gpg.missingPublicKeys' ? 'missing:\n{keys}' : key) };

  beforeEach(() => {
    openpgp.encrypt.mockClear();
  });

  it('does not encrypt to a contact whose address only contains the recipient\'s', async () => {
    addressBook([{ name: 'Super Bob', email: 'superbob@example.com', public_key: 'SUPERBOB-KEY' }]);

    expect(await send(['bob@example.com'], 'to', missing)).toBe(false);
    expect(alerts).toEqual(['missing:\nbob@example.com']);
    expect(openpgp.encrypt).not.toHaveBeenCalled();
  });

  it('does not encrypt to a contact whose name holds the recipient\'s address', async () => {
    addressBook([{ name: 'Carol (was bob@example.com)', email: 'carol@example.com', public_key: 'CAROL-KEY' }]);

    expect(await send(['Bob <bob@example.com>'], 'to', missing)).toBe(false);
    expect(alerts).toEqual(['missing:\nBob <bob@example.com>']);
    expect(openpgp.encrypt).not.toHaveBeenCalled();
  });

  it('encrypts to the contact the address belongs to, past one that only contains it, in any case', async () => {
    addressBook([
      { name: 'Super Bob', email: 'superbob@example.com', public_key: 'SUPERBOB-KEY' },
      { name: 'Bob', email: 'bob.work@example.org', emails: [{ value: 'bob.work@example.org' }, { value: 'Bob@Example.com' }], public_key: 'BOB-KEY' },
    ]);

    const sent = await send(['Bob <bob@example.com>']);

    expect(alerts).toEqual([]);
    expect((sent as FormData).get('text')).toBe('encrypted for BOB-KEY, MY-KEY-public');
  });
});

describe('an encrypted message to the user', () => {
  it.each(['to', 'cc', 'bcc'] as const)('uses the users own public key for their resolved address in %s', async (field) => {
    localStorage.setItem('alps_active_user', 'me');
    localStorage.setItem('alps_settings_me', JSON.stringify({ loginUsername: 'me', loginAddress: 'Me@Example.net' }));

    const sent = await send(['"My name" <me@example.NET>'], field);

    expect(queries).toEqual([]);
    expect(alerts).toEqual([]);
    expect(sent).toBeInstanceOf(FormData);
    expect((sent as FormData).get('text')).toBe('encrypted for MY-KEY-public');
  });

  it('falls back to an address used as the login before the server resolves it', async () => {
    localStorage.setItem('alps_active_user', 'me@example.net');
    localStorage.setItem('alps_settings_me@example.net', JSON.stringify({ loginUsername: 'me@example.net' }));

    expect(await send(['me@example.net'])).toBeInstanceOf(FormData);
    expect(queries).toEqual([]);
    expect(alerts).toEqual([]);
  });
});
