/**
 * The unlocked GPG private key, held in memory between messages.
 *
 * Signing out does not reload the page, so the key must not outlive the
 * session it was unlocked in: the next user to sign in on the same tab would
 * sign and decrypt with it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Stands in for openpgp: a key is its armour, and decrypting says whose key it used. */
const openpgp = vi.hoisted(() => ({
  readPrivateKey: vi.fn(async ({ armoredKey }: { armoredKey: string }) => ({
    armoredKey,
    isDecrypted: () => true,
  })),
  readMessage: vi.fn(async () => ({})),
  decrypt: vi.fn(async ({ decryptionKeys }: { decryptionKeys: { armoredKey: string } }) => ({
    data: `opened with ${decryptionKeys.armoredKey}`,
  })),
}));
vi.mock('openpgp', () => openpgp);

const { handleReaderContent } = await import('../../plugins/gpg/frontend/gpg-crypto');

const encrypted = '-----BEGIN PGP MESSAGE-----\nxyz\n-----END PGP MESSAGE-----';
const i18nStore = { t: (key: string) => key };

/** Opens an encrypted message and answers which key opened it. */
async function open(): Promise<string> {
  return String(await handleReaderContent({ content: encrypted, banners: [], i18nStore }));
}

let keyring: string;
let hold: Promise<void> | null;
let keyReads: number;

beforeEach(() => {
  keyring = 'KEY-A';
  hold = null;
  keyReads = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (String(url) !== '/gpg/keys') return new Response('{}', { status: 404 });
    keyReads++;
    const armoredKey = keyring;
    if (hold) await hold;
    return new Response(JSON.stringify({ encrypted_private_key: armoredKey }), { status: 200 });
  }));
});

afterEach(() => {
  // Each test starts with no key held.
  window.dispatchEvent(new CustomEvent('session-cleared'));
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the unlocked key across a sign-out', () => {
  it('is kept between messages, and forgotten when the session ends', async () => {
    expect(await open()).toContain('opened with KEY-A');
    expect(await open()).toContain('opened with KEY-A');
    expect(keyReads).toBe(1);

    window.dispatchEvent(new CustomEvent('session-cleared'));
    keyring = 'KEY-B';

    expect(await open()).toContain('opened with KEY-B');
    expect(keyReads).toBe(2);
  });

  it('is not kept when read for a session that has since ended', async () => {
    let release!: () => void;
    hold = new Promise<void>(resolve => { release = resolve; });
    const previous = open();
    await vi.waitFor(() => expect(keyReads).toBe(1));

    window.dispatchEvent(new CustomEvent('session-cleared'));
    hold = null;
    release();
    // The previous user's message stays closed: its reader is gone.
    expect(await previous).not.toContain('opened with');

    keyring = 'KEY-B';
    expect(await open()).toContain('opened with KEY-B');
  });
});
