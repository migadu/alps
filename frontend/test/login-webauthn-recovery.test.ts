/**
 * A recovery code in the security key's place, on the page a sign-in waits on
 * for the key.
 *
 * Without one, an account whose only key was not at hand could not be signed
 * in to: the page could only run the ceremony again, or go back to the
 * password, which led back to it. Here the key is not at hand: the browser's
 * prompt is cancelled, as when no authenticator answers.
 *
 * The page is handed a dictionary that answers each key with itself, so the
 * assertions name the keys.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as webauthnUtils from '../src/utils/webauthn-utils';
import '../src/pages/login-webauthn-page';
import type { LoginWebAuthnPage } from '../src/pages/login-webauthn-page';

type Page = LoginWebAuthnPage & Record<string, any>;

const answer = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as any;

/** What the server answers each recovery code with. */
let recovery: () => any;
let recoveryAvailable: boolean | undefined;
/** The bodies of the recovery codes posted, in order. */
let posted: unknown[];
let key: ReturnType<typeof vi.spyOn>;
const mounted: Page[] = [];

beforeEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  window.location.hash = '#/login/webauthn';
  posted = [];
  recoveryAvailable = undefined;
  recovery = () => answer(200, { success: true, username: 'ada@example.com', recovery_codes_left: 9 });
  vi.spyOn(webauthnUtils, 'isWebAuthnSupported').mockReturnValue(true);
  key = vi.spyOn(webauthnUtils, 'authenticateCredential')
    .mockRejectedValue(new DOMException('The operation either timed out or was not allowed.', 'NotAllowedError'));
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init?: RequestInit) => {
    if (String(url).endsWith('/webauthn/verify/begin')) return answer(200, { publicKey: { challenge: 'challenge' }, recoveryCodesAvailable: recoveryAvailable });
    if (String(url).endsWith('/webauthn/verify/recovery')) {
      posted.push(JSON.parse(String(init?.body)));
      return recovery();
    }
    return answer(404, {});
  });
});

afterEach(() => {
  for (const el of mounted.splice(0)) el.remove();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

/** The page, once its own ceremony has found no key. */
async function keyNotAtHand(): Promise<Page> {
  const el = document.createElement('login-webauthn-page') as Page;
  el.i18nStore = { t: (k: string) => k, addEventListener() {}, removeEventListener() {} };
  document.body.appendChild(el);
  mounted.push(el);
  await vi.waitFor(() => expect(el.statusMessage).toBe('webauthn.errors.cancelled'), { timeout: 2000 });
  return el;
}

const button = (el: Page, label: string) =>
  [...el.shadowRoot!.querySelectorAll('alps-button')].find((b) => b.textContent?.includes(label)) as HTMLElement | undefined;

const codeField = (el: Page) => el.shadowRoot!.querySelector('#recovery-code') as HTMLInputElement | null;

/** Turns to a recovery code, and types one. */
async function typeCode(el: Page, code: string) {
  button(el, 'webauthn.use_recovery_code')!.click();
  await el.updateComplete;
  const field = codeField(el);
  expect(field, 'no field for the code').not.toBeNull();
  field!.value = code;
  field!.dispatchEvent(new Event('input'));
  await el.updateComplete;
}

async function submitCode(el: Page) {
  button(el, 'login.signIn')!.click();
  await vi.waitFor(() => expect(el.codeBusy).toBe(false));
  await el.updateComplete;
}

describe('a recovery code in the key\'s place', () => {
  it('does not offer recovery when the installation cannot consume codes safely', async () => {
    recoveryAvailable = false;
    const el = await keyNotAtHand();
    expect(button(el, 'webauthn.use_recovery_code')).toBeUndefined();
    expect(button(el, 'webauthn.verify_btn')).toBeDefined();
  });

  it('names unavailable recovery separately from a refused code or key outage', async () => {
    recovery = () => answer(503, { error: 'recovery_unavailable' });
    const el = await keyNotAtHand();
    await typeCode(el, 'abcde-fghjk');
    await submitCode(el);
    expect(el.statusMessage).toBe('webauthn.recovery.unavailable');
    expect(el.isSuccess).toBe(false);
  });

  it('is offered beside the key, and signs in', async () => {
    const signedIn: unknown[] = [];
    const listener = (e: Event) => signedIn.push((e as CustomEvent).detail);
    window.addEventListener('user-logged-in', listener);
    try {
      const el = await keyNotAtHand();
      await typeCode(el, 'abcde-fghjk');
      expect(codeField(el)!.autocomplete).toBe('one-time-code');
      await submitCode(el);

      expect(posted).toEqual([{ code: 'abcde-fghjk' }]);
      await vi.waitFor(() => expect(signedIn).toEqual([{ username: 'ada@example.com' }]), { timeout: 2000 });
      expect(window.location.hash).toBe('#/mailbox/INBOX');
    } finally {
      window.removeEventListener('user-logged-in', listener);
    }
  });

  it('is sent with Enter, from the field', async () => {
    const el = await keyNotAtHand();
    await typeCode(el, 'abcde-fghjk');
    el.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => expect(posted).toEqual([{ code: 'abcde-fghjk' }]));
  });

  it('says a wrong or used code is not right, and stays on the code', async () => {
    recovery = () => answer(400, { error: 'wrong_code' });
    const el = await keyNotAtHand();
    await typeCode(el, 'zzzzz-zzzzz');
    await submitCode(el);
    expect(el.statusMessage).toBe('webauthn.recovery.wrong_code');
    expect(el.statusType).toBe('error');
    expect(codeField(el)).not.toBeNull();
    expect(window.location.hash).toBe('#/login/webauthn');
  });

  it('names a throttle and an outage, never a wrong code', async () => {
    const el = await keyNotAtHand();
    await typeCode(el, 'abcde-fghjk');
    recovery = () => answer(429, { error: 'rate_limited', retry_after: 60 });
    await submitCode(el);
    expect(el.statusMessage).toBe('webauthn.errors.rate_limited');
    recovery = () => answer(503, { error: 'keys_unavailable' });
    await submitCode(el);
    expect(el.statusMessage).toBe('webauthn.errors.unavailable');
  });

  it('goes back to the password when the pending sign-in is gone', async () => {
    recovery = () => answer(401, { error: 'no pending 2FA session' });
    const el = await keyNotAtHand();
    await typeCode(el, 'abcde-fghjk');
    await submitCode(el);
    expect(window.location.hash).toBe('#/login');
  });

  it('sends no empty code', async () => {
    const el = await keyNotAtHand();
    await typeCode(el, '   ');
    await submitCode(el);
    expect(posted).toEqual([]);
    expect(el.statusMessage).toBe('webauthn.recovery.code_required');
  });

  it('gives way to the key again, with a new ceremony', async () => {
    const el = await keyNotAtHand();
    await typeCode(el, 'abcde-fghjk');
    expect(key).toHaveBeenCalledTimes(1);
    button(el, 'webauthn.recovery.use_key')!.click();
    await el.updateComplete;
    expect(codeField(el)).toBeNull();
    await vi.waitFor(() => expect(key).toHaveBeenCalledTimes(2));
  });
});
