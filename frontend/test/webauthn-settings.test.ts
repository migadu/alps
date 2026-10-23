/**
 * Removing a security key from Settings → 2FA / WebAuthn.
 *
 * The removal asks for the account's password, which the server checks, so a
 * browser left signed in cannot strip the second factor. What the pane must get
 * right is the conversation around that: a destructive prompt with a password
 * field, an empty password stopped before it is sent, and every refusal kept in
 * the prompt in words of its own — a wrong password named as one, and an
 * outage never mistaken for it.
 *
 * No i18n provider is mounted, so the pane shows its dictionary keys and the
 * assertions name them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, shadowAll, waitFor } from './helpers/dom';
import '../src/components/alps-webauthn-settings';

type Pane = HTMLElement & { updateComplete: Promise<boolean>; requestUpdate(): void };
type Prompt = HTMLElement & {
  updateComplete: Promise<boolean>;
  fields: { id: string; type?: string; autocomplete?: string; validate?: (v: string) => string | null | undefined }[];
  errors: Record<string, string>;
  isDanger: boolean;
  busy: boolean;
};

const KEY_ID = 'a2V5';
const settings = (names: string[]) => ({
  credentialCount: names.length,
  credentials: names.map((name, i) => ({ ID: i === 0 ? KEY_ID : `key${i}`, Name: name, AddedAt: '2026-10-01T10:00:00Z' })),
  isSecuritySettings: true,
  trustLinkedAccounts: false,
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** What the server answers each removal with, in order; the settings read always answers `keys`. */
let removals: Array<Response | Error>;
let keys: string[];
let fetchMock: ReturnType<typeof vi.fn>;

const removeCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('/delete'));
const settingsReads = () => fetchMock.mock.calls.filter(([url]) => String(url) === '/settings/2fa');

beforeEach(() => {
  keys = ['Laptop'];
  removals = [];
  fetchMock = vi.fn(async (url: RequestInfo | URL) => {
    if (String(url) === '/settings/2fa') return json(200, settings(keys));
    const next = removals.shift();
    if (!next) throw new Error(`unexpected request to ${String(url)}`);
    if (next instanceof Error) throw next;
    return next;
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function pane(): Promise<Pane> {
  const el = await mount<Pane>('alps-webauthn-settings');
  await waitFor(() => !!el.shadowRoot?.querySelector('alps-icon-btn'), 'the key list');
  return el;
}

const prompt = (el: Pane) => el.shadowRoot?.querySelector('ui-prompt') as Prompt | null;

async function openRemove(el: Pane): Promise<Prompt> {
  shadow(el, 'alps-icon-btn[icon="trash"]').click();
  await el.updateComplete;
  const host = prompt(el);
  expect(host, 'no removal prompt').not.toBeNull();
  await host!.updateComplete;
  return host!;
}

/** Submits the prompt as its own button does: a `submit` carrying the field values. */
async function submit(el: Pane, password: string): Promise<void> {
  prompt(el)!.dispatchEvent(new CustomEvent('submit', { detail: { password }, bubbles: true, composed: true }));
  await waitFor(() => !(el as unknown as { removeBusy: boolean }).removeBusy, 'the removal to settle');
  await el.updateComplete;
}

describe('removing a security key asks for the password', () => {
  it('opens a destructive prompt with a password field, not a bare confirm', async () => {
    const el = await pane();
    const host = await openRemove(el);
    expect(host.isDanger).toBe(true);
    expect(host.fields).toEqual([
      expect.objectContaining({ id: 'password', type: 'password', autocomplete: 'current-password' }),
    ]);
    expect(host.getAttribute('heading')).toBe('webauthn.confirm_remove');
    expect(el.shadowRoot?.querySelector('ui-confirm')).toBeNull();
    // The confirm button is the danger one.
    expect(shadowAll(host, 'alps-button').at(-1)!.getAttribute('variant')).toBe('danger');
  });

  it('sends the password with the removal, then closes and reads the keys again', async () => {
    const el = await pane();
    await openRemove(el);
    removals.push(json(200, { success: true }));
    keys = [];

    await submit(el, 'my-password');

    const [[url, init]] = removeCalls();
    expect(url).toBe(`/settings/2fa/credential/${KEY_ID}/delete`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ current_password: 'my-password' });
    expect(prompt(el)).toBeNull();
    await waitFor(() => settingsReads().length === 2, 'the keys to be read again');
  });

  it('keeps the prompt open on a wrong password and says so; the key stays', async () => {
    const el = await pane();
    await openRemove(el);
    removals.push(json(403, { error: 'wrong_password' }));

    await submit(el, 'wrong');

    expect(prompt(el)).not.toBeNull();
    expect(prompt(el)!.errors).toEqual({ password: 'webauthn.errors.wrong_password' });
    expect(settingsReads()).toHaveLength(1);
    expect(el.shadowRoot?.textContent).toContain('Laptop');
  });

  it('says a session that has not given the second factor must sign in with the key', async () => {
    const el = await pane();
    await openRemove(el);
    removals.push(json(403, { error: 'two_factor_required' }));

    await submit(el, 'my-password');

    expect(prompt(el)).not.toBeNull();
    expect(prompt(el)!.errors).toEqual({ password: 'webauthn.errors.two_factor_required' });
  });

  it('then takes the right one', async () => {
    const el = await pane();
    await openRemove(el);
    removals.push(json(403, { error: 'wrong_password' }), json(200, { success: true }));

    await submit(el, 'wrong');
    await submit(el, 'right');

    expect(removeCalls().map(([, init]) => JSON.parse(init.body).current_password)).toEqual(['wrong', 'right']);
    expect(prompt(el)).toBeNull();
  });

  it('stops an empty password in the prompt and never sends it', async () => {
    const el = await pane();
    const host = await openRemove(el);
    const [field] = host.fields;
    expect(field.validate?.('')).toBe('webauthn.errors.password_required');
    expect(field.validate?.('something')).toBeFalsy();

    // Pressing Remove with the field empty: the prompt's own check answers.
    shadowAll(host, 'alps-button').at(-1)!.click();
    await host.updateComplete;
    expect(shadow(host, '.field-error').textContent).toBe('webauthn.errors.password_required');

    // And a submit that got past it anyway is answered by the pane.
    await submit(el, '');
    expect(prompt(el)!.errors).toEqual({ password: 'webauthn.errors.password_required' });
    expect(removeCalls()).toHaveLength(0);
  });

  it('names a throttle, and never calls an outage a wrong password', async () => {
    const cases: Array<[Response | Error, string]> = [
      [json(429, { error: 'rate_limited', retry_after: 900 }), 'webauthn.errors.rate_limited'],
      [json(400, { error: 'password_required' }), 'webauthn.errors.password_required'],
      [json(503, { error: 'keys_unavailable' }), 'webauthn.errors.remove_unavailable'],
      [json(500, { error: 'An internal error occurred' }), 'webauthn.errors.remove_unavailable'],
      [new TypeError('Failed to fetch'), 'webauthn.errors.remove_unavailable'],
      // A 403 without the code is not a wrong password either: the server
      // refused for a reason of its own, such as the request's origin.
      [json(403, { error: 'Invalid origin' }), 'webauthn.errors.remove_failed'],
    ];
    for (const [answer, expected] of cases) {
      const el = await pane();
      await openRemove(el);
      removals.push(answer);
      await submit(el, 'pw');
      expect(prompt(el)?.errors.password, String(expected)).toBe(expected);
      cleanup();
    }
  });

  it('closes on a key that is already gone, as removed elsewhere', async () => {
    const el = await pane();
    await openRemove(el);
    removals.push(json(404, { error: 'credential not found' }));
    keys = [];

    await submit(el, 'pw');

    expect(prompt(el)).toBeNull();
    await waitFor(() => settingsReads().length === 2, 'the keys to be read again');
  });

  it('hands the prompt the same errors object across re-renders, so an error typed past stays gone', async () => {
    const el = await pane();
    await openRemove(el);
    removals.push(json(403, { error: 'wrong_password' }));
    await submit(el, 'wrong');
    const first = prompt(el)!.errors;

    el.requestUpdate();
    await el.updateComplete;
    expect(prompt(el)!.errors).toBe(first);
  });

  it('starts each removal without the last one\'s error', async () => {
    const el = await pane();
    await openRemove(el);
    removals.push(json(403, { error: 'wrong_password' }));
    await submit(el, 'wrong');

    prompt(el)!.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(prompt(el)).toBeNull();

    const again = await openRemove(el);
    expect(again.errors).toEqual({});
  });
});
