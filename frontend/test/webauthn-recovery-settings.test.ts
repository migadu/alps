/**
 * Recovery codes in Settings → 2FA / WebAuthn.
 *
 * The first key comes with ten codes, which the server shows once, in the
 * answer that adds the key: the pane must show them then, until the user says
 * they are done with them, and offer to copy or download them. Afterwards it
 * says how many are left, and new ones take the password, as removing a key
 * does.
 *
 * The pane is handed a dictionary that answers each key with itself, and a
 * count after a bar, so the assertions name the keys.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, shadowAll, waitFor } from './helpers/dom';

vi.mock('../src/utils/webauthn-utils', () => ({
  registerCredential: vi.fn(async () => ({ id: 'bmV3', rawId: 'bmV3', type: 'public-key', response: {} })),
}));

import '../src/components/alps-webauthn-settings';

type Pane = HTMLElement & { updateComplete: Promise<boolean> } & Record<string, any>;
type Prompt = HTMLElement & { updateComplete: Promise<boolean>; message: string; errors: Record<string, string>; fields: { id: string; type?: string }[] };

const CODES = Array.from({ length: 10 }, (_, i) => `abcd${i}-efgh${i}`);

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let keys: string[];
let left: number;
let answers: Record<string, () => Response>;
let fetchMock: ReturnType<typeof vi.fn>;
const calls = (path: string) => fetchMock.mock.calls.filter(([url]) => String(url) === path);

beforeEach(() => {
  keys = [];
  left = 0;
  answers = {};
  fetchMock = vi.fn(async (url: RequestInfo | URL) => {
    const path = String(url);
    if (path === '/settings/2fa') {
      return json(200, {
        credentialCount: keys.length,
        credentials: keys.map((name, i) => ({ ID: `key${i}`, Name: name, AddedAt: '2026-11-01T10:00:00Z' })),
        isSecuritySettings: true,
        trustLinkedAccounts: false,
        recoveryCodesLeft: left,
      });
    }
    if (answers[path]) return answers[path]();
    throw new Error(`unexpected request to ${path}`);
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function pane(): Promise<Pane> {
  const i18nStore = {
    t: (key: string, params?: Record<string, unknown>) => (params?.count !== undefined ? `${key}|${params.count}` : key),
    addEventListener() {},
    removeEventListener() {},
  };
  const el = await mount<Pane>('alps-webauthn-settings', { i18nStore });
  await waitFor(() => shadowAll(el, 'alps-button').length > 0, 'the pane');
  return el;
}

/** A button by its words: in the pane's shadow root, or among what a dialog is given to show. */
const button = (root: ParentNode, label: string) =>
  [...root.querySelectorAll('alps-button')].find((b) => b.textContent?.includes(label)) as HTMLElement | undefined;
const group = (el: Pane, label: string) => el.shadowRoot!.querySelector(`alps-setting-group[label="${label}"]`);

/** The dialog that shows codes, and the codes it lists. */
const codesDialog = (el: Pane) =>
  [...el.shadowRoot!.querySelectorAll('ui-modal')].find((m) => m.getAttribute('heading') === 'webauthn.recovery.codes_title') as HTMLElement | undefined;
const listed = (dialog: HTMLElement) => [...dialog.querySelectorAll('li')].map((li) => li.textContent?.trim());

async function addFirstKey(el: Pane) {
  answers['/settings/2fa/begin'] = () => json(200, { publicKey: {} });
  answers['/settings/2fa/finish'] = () => {
    keys = ['Laptop'];
    left = 10;
    return json(200, { success: true, recovery_codes: CODES });
  };
  button(el.shadowRoot!, 'webauthn.add_key')!.click();
  await waitFor(() => !!el.shadowRoot?.querySelector('ui-prompt'), 'the name dialog');
  shadow(el, 'ui-prompt').dispatchEvent(new CustomEvent('submit', { detail: { keyName: 'Laptop' }, bubbles: true, composed: true }));
  await waitFor(() => !!codesDialog(el), 'the codes');
}

describe('the codes that come with the first key', () => {
  it('are shown once the key is added, and stay until Done', async () => {
    const el = await pane();
    await addFirstKey(el);
    const dialog = codesDialog(el)!;
    expect(listed(dialog)).toEqual(CODES);
    expect(dialog.textContent).toContain('webauthn.recovery.codes_intro');
    // Not closed by Escape or a click beside it: the codes are not shown again.
    expect((dialog as unknown as { dismissible: boolean }).dismissible).toBe(false);

    button(dialog, 'webauthn.recovery.done')!.click();
    await el.updateComplete;
    expect(codesDialog(el)).toBeUndefined();
    await waitFor(() => (el.shadowRoot?.textContent ?? '').includes('webauthn.recovery.left|10'), 'the count');
  });

  it('can be copied, one to a line', async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const el = await pane();
    await addFirstKey(el);
    button(codesDialog(el)!, 'originalMessage.copyClipboard')!.click();
    await waitFor(() => writeText.mock.calls.length === 1, 'the copy');
    expect(writeText).toHaveBeenCalledWith(CODES.join('\n'));
  });
});

describe('the codes left', () => {
  it('are counted beside the keys, and said to be none when none are left', async () => {
    keys = ['Laptop'];
    left = 3;
    let el = await pane();
    expect(group(el, 'webauthn.recovery.title')).not.toBeNull();
    expect(el.shadowRoot!.textContent).toContain('webauthn.recovery.left|3');
    cleanup();

    left = 0;
    el = await pane();
    expect(el.shadowRoot!.textContent).toContain('webauthn.recovery.none');
  });

  it('are not mentioned while there is no key', async () => {
    const el = await pane();
    expect(group(el, 'webauthn.recovery.title')).toBeNull();
    expect(el.shadowRoot!.textContent).not.toContain('webauthn.recovery.');
  });
});

describe('new codes', () => {
  async function askForNew(el: Pane): Promise<Prompt> {
    button(el.shadowRoot!, 'webauthn.recovery.create')!.click();
    await waitFor(() => !!el.shadowRoot?.querySelector('ui-prompt'), 'the password prompt');
    const prompt = shadow<Prompt>(el, 'ui-prompt');
    await prompt.updateComplete;
    return prompt;
  }

  const submit = async (el: Pane, password: string) => {
    shadow(el, 'ui-prompt').dispatchEvent(new CustomEvent('submit', { detail: { password }, bubbles: true, composed: true }));
    await waitFor(() => !el.codesBusy, 'the request to settle');
    await el.updateComplete;
  };

  it('take the password, say they replace the old ones, and are shown', async () => {
    keys = ['Laptop'];
    left = 2;
    const el = await pane();
    const prompt = await askForNew(el);
    expect(prompt.message).toBe('webauthn.recovery.create_notice');
    expect(prompt.fields).toEqual([expect.objectContaining({ id: 'password', type: 'password' })]);

    answers['/settings/2fa/recovery-codes'] = () => {
      left = 10;
      return json(200, { recovery_codes: CODES });
    };
    await submit(el, 'my-password');
    const [[, init]] = calls('/settings/2fa/recovery-codes');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ current_password: 'my-password' });
    expect(el.shadowRoot!.querySelector('ui-prompt')).toBeNull();
    expect(listed(codesDialog(el)!)).toEqual(CODES);
  });

  it('keep the prompt open on a wrong password, and say so', async () => {
    keys = ['Laptop'];
    left = 2;
    const el = await pane();
    await askForNew(el);
    answers['/settings/2fa/recovery-codes'] = () => json(403, { error: 'wrong_password' });
    await submit(el, 'not-it');
    expect(shadow<Prompt>(el, 'ui-prompt').errors).toEqual({ password: 'webauthn.errors.wrong_password' });
    expect(codesDialog(el)).toBeUndefined();
  });
});
