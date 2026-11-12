import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'lit';
const pgp = vi.hoisted(() => ({ readPrivateKey: vi.fn(), readMessage: vi.fn(), decrypt: vi.fn(), decryptKey: vi.fn() }));
vi.mock('openpgp', () => pgp);
import { clearCachedPrivateKey, handleReaderContent } from '../../plugins/gpg/frontend/gpg-crypto';
import { waitFor } from './helpers/dom';
const content = '-----BEGIN PGP MESSAGE-----\nx\n-----END PGP MESSAGE-----';
const i18nStore = { t: (key: string) => key };
async function banner() {
  const payload = { content, i18nStore, banners: [] };
  await handleReaderContent(payload);
  const el = document.createElement('div');
  render(payload.banners, el);
  return el.textContent;
}
beforeEach(() => {
  clearCachedPrivateKey();
  pgp.readPrivateKey.mockResolvedValue({ isDecrypted: () => true, getKeyIDs: () => [{ toHex: () => 'aaaa' }] });
  pgp.readMessage.mockResolvedValue({ getEncryptionKeyIDs: () => [{ toHex: () => 'aaaa' }] });
  pgp.decrypt.mockResolvedValue({ data: 'clear' });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"encrypted_private_key":"key"}')));
});
afterEach(() => { clearCachedPrivateKey(); document.querySelectorAll('ui-prompt').forEach(el => el.remove()); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetAllMocks(); });
describe('GPG reader failures', () => {
  it('distinguishes an unreadable keyring', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })));
    expect(await banner()).toContain('gpg.keyringUnreadable');
  });
  it('distinguishes no stored private key', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
    expect(await banner()).toContain('gpg.noPrivateKey');
  });
  it('distinguishes unreadable armor', async () => {
    pgp.readMessage.mockRejectedValueOnce(new Error('bad armor'));
    expect(await banner()).toContain('gpg.messageUnreadable');
  });
  it('distinguishes a different recipient key', async () => {
    pgp.readMessage.mockResolvedValueOnce({ getEncryptionKeyIDs: () => [{ toHex: () => 'bbbb' }] });
    expect(await banner()).toContain('gpg.noMatchingKey');
    expect(pgp.decrypt).not.toHaveBeenCalled();
  });
  it('translates the retry label without exposing the library error', async () => {
    pgp.readPrivateKey.mockResolvedValueOnce({ isDecrypted: () => false });
    pgp.decryptKey.mockRejectedValueOnce(new Error('English library explanation'));
    const result = banner();
    await waitFor(() => !!document.querySelector('ui-prompt'), 'passphrase prompt');
    const first = document.querySelector('ui-prompt')!;
    first.dispatchEvent(new CustomEvent('submit', { detail: { passphrase: 'wrong' } }));
    await waitFor(() => !!document.querySelector('ui-prompt') && document.querySelector('ui-prompt') !== first, 'retry prompt');
    const retry = document.querySelector('ui-prompt') as HTMLElement & { fields: { label: string }[] };
    expect(retry.fields[0].label).toContain('gpg.importIncorrectPassphrase');
    expect(retry.fields[0].label).not.toContain('English library explanation');
    retry.dispatchEvent(new CustomEvent('cancel'));
    await result;
  });
  it('distinguishes cancelling the passphrase prompt', async () => {
    pgp.readPrivateKey.mockResolvedValueOnce({ isDecrypted: () => false });
    const result = banner();
    await waitFor(() => !!document.querySelector('ui-prompt'), 'passphrase prompt');
    document.querySelector('ui-prompt')!.dispatchEvent(new CustomEvent('cancel'));
    expect(await result).toContain('gpg.passphraseCancelled');
  });
});
