/**
 * Adding a security key from Settings → 2FA / WebAuthn turns the second factor
 * on: from the next sign-in, the webmail asks for a key after the password.
 *
 * With a platform authenticator, the browser's prompt is a single touch, and
 * the name dialog that follows came filled in with a default, so a key could be
 * added without a word about what it does. The name dialog is where the key is
 * kept or dropped (Cancel saves nothing), so that is where it is said.
 *
 * The pane is handed a dictionary that answers each key with itself, so the
 * assertions name the keys.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, shadowAll, waitFor } from './helpers/dom';

vi.mock('../src/utils/webauthn-utils', () => ({
  registerCredential: vi.fn(async () => ({ id: 'bmV3', rawId: 'bmV3', type: 'public-key', response: {} })),
}));

import '../src/components/alps-webauthn-settings';

type Pane = HTMLElement & { updateComplete: Promise<boolean> };
type Prompt = HTMLElement & { updateComplete: Promise<boolean>; message: string };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let fetchMock: ReturnType<typeof vi.fn>;
const calls = (path: string) => fetchMock.mock.calls.filter(([url]) => String(url) === path);

beforeEach(() => {
  fetchMock = vi.fn(async (url: RequestInfo | URL) => {
    switch (String(url)) {
      case '/settings/2fa':
        return json(200, { credentialCount: 0, credentials: [], isSecuritySettings: true, trustLinkedAccounts: false });
      case '/settings/2fa/begin':
        return json(200, { publicKey: {} });
      case '/settings/2fa/finish':
        return json(200, { success: true });
    }
    throw new Error(`unexpected request to ${String(url)}`);
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function nameDialog(): Promise<{ el: Pane; dialog: Prompt }> {
  const i18nStore = { t: (key: string) => key, addEventListener() {}, removeEventListener() {} };
  const el = await mount<Pane>('alps-webauthn-settings', { i18nStore });
  await waitFor(() => shadowAll(el, 'alps-button').length > 0, 'the pane');
  shadowAll(el, 'alps-button').find((b) => b.textContent?.includes('webauthn.add_key'))!.click();
  await waitFor(() => !!el.shadowRoot?.querySelector('ui-prompt'), 'the name dialog');
  const dialog = shadow<Prompt>(el, 'ui-prompt');
  await dialog.updateComplete;
  return { el, dialog };
}

describe('adding a security key', () => {
  it('says in the name dialog that signing in will ask for the key', async () => {
    const { dialog } = await nameDialog();
    expect(dialog.message).toBe('webauthn.name_key_notice');
    expect(dialog.shadowRoot?.textContent).toContain('webauthn.name_key_notice');
  });

  it('describes the dialog by the notice, so a screen reader reads it with the field', async () => {
    const { dialog } = await nameDialog();
    const modal = dialog.shadowRoot!.querySelector('ui-modal') as HTMLElement & { bodyDescribes: boolean };
    expect(modal.bodyDescribes).toBe(true);
  });

  it('saves nothing when the dialog is cancelled', async () => {
    const { el, dialog } = await nameDialog();
    dialog.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('ui-prompt')).toBeNull();
    expect(calls('/settings/2fa/finish')).toEqual([]);
  });
});
