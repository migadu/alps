/**
 * A sign-in refused for the account's connection limit is no wrong password.
 *
 * The mail server checked the password and then refused the session, because
 * the account held as many connections as it may. The page said the sign-in
 * failed and to check the credentials, and the user typed again a password
 * that was right.
 *
 * Nor is a server that could not answer. It showed the server's own English
 * words, or for a proxy's HTML error page "check your credentials". And a
 * refusal is said in the page's language, not in the server's English.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, text } from './helpers/dom';

import '../src/pages/login-page';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Signs in on a page whose POST /session is answered with `answer()`. */
async function signInAnswered(answer: () => Response) {
  vi.stubGlobal('fetch', vi.fn(async () => answer()));
  const page = await mount<El>('login-page', { i18nStore, username: 'ada@example.com', password: 'correct horse' });
  vi.useFakeTimers();
  const submitted = page.handleSubmit(new Event('submit'));
  await vi.advanceTimersByTimeAsync(600);
  await submitted;
  await page.updateComplete;
  return page;
}

/** Signs in on a page whose POST /session is answered with `status` and `body`. */
async function signIn(status: number, body: unknown) {
  return text(await signInAnswered(() => Response.json(body, { status })), '.error-text');
}

describe('a sign-in refused', () => {
  it('for the connection limit says so', async () => {
    expect(await signIn(503, { error: 'connection_limit' })).toBe('login.tooManyConnections');
  });

  it("for the password says so in the page's language, not the server's English", async () => {
    expect(await signIn(401, { error: 'Failed to login' })).toBe('login.loginFailed');
  });
});

describe('a sign-in held back by the rate limit', () => {
  it("says there were too many attempts, not the server's English, and holds Sign in", async () => {
    const page = await signInAnswered(() => Response.json(
      { error: 'Too many failed login attempts for this account', retry_after: 900 },
      { status: 429, headers: { 'Retry-After': '900' } },
    ));
    expect(text(page, '.error-text')).toBe('login.tooManyAttempts login.pleaseWait 15 minutes');
    expect(page.isRateLimited).toBe(true);
  });

  it("says the service is busy when the limit is the whole server's", async () => {
    const page = await signInAnswered(() => Response.json(
      { error: 'Server is experiencing high load, please try again later', retry_after: 1, code: 'server_busy' },
      { status: 429, headers: { 'Retry-After': '1' } },
    ));
    expect(text(page, '.error-text')).toBe('login.serviceUnavailable login.pleaseWait 1 second');
    expect(page.isRateLimited).toBe(true);
  });
});

describe('a sign-in the server could not answer', () => {
  it('says the service could not sign the user in, not what the server said', async () => {
    expect(await signIn(500, { error: 'An internal error occurred' })).toBe('login.serviceUnavailable');
  });

  it("says the same for a proxy's HTML error page, not to check the credentials", async () => {
    const page = await signInAnswered(() => new Response(
      '<html><head><title>502 Bad Gateway</title></head><body><h1>502 Bad Gateway</h1></body></html>',
      { status: 502, headers: { 'Content-Type': 'text/html' } },
    ));
    expect(text(page, '.error-text')).toBe('login.serviceUnavailable');
    expect(page.isRateLimited).toBe(false);
  });

  it('holds Sign in for the wait the answer names', async () => {
    const page = await signInAnswered(() => new Response('Service Unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain', 'Retry-After': '5' },
    }));
    expect(text(page, '.error-text')).toMatch(/^login\.serviceUnavailable login\.pleaseWait 5 seconds$/);
    expect(page.isRateLimited).toBe(true);

    await vi.advanceTimersByTimeAsync(5000);
    await page.updateComplete;
    expect(page.isRateLimited).toBe(false);
  });
});
