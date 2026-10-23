import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as webauthn from '../src/utils/webauthn-utils';
import '../src/pages/login-webauthn-page';
import { cleanup, mount, shadowAll } from './helpers/dom';

type Page = HTMLElement & Record<string, any>;
const options = () => ({ publicKey: { challenge: 'AAAA' } });
const answer = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

describe('leaving security-key verification', () => {
  let begins: ReturnType<typeof vi.fn>;
  let finishes: ReturnType<typeof vi.fn>;
  let key: ReturnType<typeof vi.spyOn>;
  let loggedIn: ReturnType<typeof vi.fn>;
  const originalCredentials = Object.getOwnPropertyDescriptor(navigator, 'credentials');

  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    window.location.hash = '#/login/webauthn';
    vi.spyOn(webauthn, 'isWebAuthnSupported').mockReturnValue(true);
    key = vi.spyOn(webauthn, 'authenticateCredential').mockResolvedValue({ id: 'key' } as any);
    begins = vi.fn(async () => answer(options()));
    finishes = vi.fn(async () => answer({ success: true, username: 'ada@example.com' }));
    vi.stubGlobal('fetch', vi.fn((url, init) => String(url).endsWith('/begin') ? begins(init) : finishes(init)));
    loggedIn = vi.fn();
    window.addEventListener('user-logged-in', loggedIn);
  });

  afterEach(() => {
    cleanup();
    window.removeEventListener('user-logged-in', loggedIn);
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionStorage.clear();
    if (originalCredentials) Object.defineProperty(navigator, 'credentials', originalCredentials);
    else delete (navigator as any).credentials;
  });

  const page = () => mount<Page>('login-webauthn-page', {
    i18nStore: { t: (name: string) => name, addEventListener() {}, removeEventListener() {} },
  });

  it('does not attach its language listener after an immediate disconnect', async () => {
    const addEventListener = vi.fn();
    const el = document.createElement('login-webauthn-page') as Page;
    el.i18nStore = { t: (name: string) => name, addEventListener, removeEventListener() {} };
    document.body.appendChild(el);
    el.remove();
    await el.updateComplete;
    expect(addEventListener).not.toHaveBeenCalled();
  });

  it('does not open a key prompt when begin answers after the page was removed', async () => {
    const begin = deferred<Response>();
    begins.mockReturnValue(begin.promise);
    const el = await page();
    const run = el._handleVerify();
    el.remove();
    begin.resolve(answer(options()));
    await run;
    expect(key).not.toHaveBeenCalled();
    expect(finishes).not.toHaveBeenCalled();
    expect(begins.mock.calls[0][0].signal.aborted).toBe(true);
  });

  it('does not finish verification when an old prompt resolves after removal', async () => {
    const credential = deferred<any>();
    key.mockReturnValue(credential.promise);
    const el = await page();
    const run = el._handleVerify();
    await vi.waitFor(() => expect(key).toHaveBeenCalledTimes(1));
    el.remove();
    credential.resolve({ id: 'late-key' });
    await run;
    expect(finishes).not.toHaveBeenCalled();
    expect(key.mock.calls[0][0].signal.aborted).toBe(true);
  });

  it('ignores a late finish without changing a newer pending login or navigating', async () => {
    const finish = deferred<Response>();
    finishes.mockReturnValue(finish.promise);
    const el = await page();
    const run = el._handleVerify();
    await vi.waitFor(() => expect(finishes).toHaveBeenCalledTimes(1));
    el.remove();
    window.location.hash = '#/login';
    sessionStorage.setItem('pending_2fa_username', 'newer@example.com');
    finish.resolve(answer({ success: true, username: 'ada@example.com' }));
    await run;
    await vi.advanceTimersByTimeAsync(1000);
    expect(loggedIn).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/login');
    expect(sessionStorage.getItem('pending_2fa_username')).toBe('newer@example.com');
    expect(finishes.mock.calls[0][0].signal.aborted).toBe(true);
  });

  it('cancels the delayed login notification after a successful page is left', async () => {
    const el = await page();
    await el._handleVerify();
    expect(el.isSuccess).toBe(true);
    el.remove();
    window.location.hash = '#/login';
    await vi.advanceTimersByTimeAsync(1000);
    expect(loggedIn).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/login');
  });

  it('lets a reconnected page start fresh without an old run releasing its lock', async () => {
    const oldBegin = deferred<Response>();
    const newCredential = deferred<any>();
    begins.mockReturnValueOnce(oldBegin.promise);
    key.mockReturnValue(newCredential.promise);
    const el = await page();
    const oldRun = el._handleVerify();
    el.remove();
    document.body.appendChild(el);
    const newRun = el._handleVerify();
    expect(begins).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(key).toHaveBeenCalledTimes(1));
    oldBegin.resolve(answer(options()));
    await oldRun;
    expect(el.isLoading).toBe(true);
    expect(key).toHaveBeenCalledTimes(1);
    expect(begins).toHaveBeenCalledTimes(2);
    newCredential.resolve({ id: 'new-key' });
    await newRun;
    await vi.advanceTimersByTimeAsync(500);
    expect(finishes).toHaveBeenCalledTimes(1);
    expect(loggedIn).toHaveBeenCalledTimes(1);
  });

  it('Back to password cancels immediately before the router removes the page', async () => {
    const begin = deferred<Response>();
    begins.mockReturnValue(begin.promise);
    const el = await page();
    const run = el._handleVerify();
    shadowAll<HTMLElement>(el, 'alps-button')[1].click();
    expect(el.isConnected).toBe(true);
    expect(window.location.hash).toBe('#/login');
    begin.resolve(answer(options()));
    await run;
    expect(key).not.toHaveBeenCalled();
  });

  it('passes cancellation to the native credentials prompt', async () => {
    key.mockRestore();
    const pending = deferred<any>();
    const get = vi.fn((request: CredentialRequestOptions) => {
      request.signal?.addEventListener('abort', () => pending.resolve(null), { once: true });
      return pending.promise;
    });
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get } });
    const el = await page();
    const run = el._handleVerify();
    await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    el.remove();
    const aborted = get.mock.calls[0][0].signal?.aborted;
    pending.resolve(null);
    await run;
    expect(aborted).toBe(true);
    expect(finishes).not.toHaveBeenCalled();
  });
});
