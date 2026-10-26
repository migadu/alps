/**
 * A sign-in refused for the account's connection limit is no wrong password.
 *
 * The mail server checked the password and then refused the session, because
 * the account held as many connections as it may. The page said the sign-in
 * failed and to check the credentials, and the user typed again a password
 * that was right.
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

/** Signs in on a page whose POST /session is answered with `status` and `body`. */
async function signIn(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json(body, { status })));
  const page = await mount<El>('login-page', { i18nStore, username: 'ada@example.com', password: 'correct horse' });
  vi.useFakeTimers();
  const submitted = page.handleSubmit(new Event('submit'));
  await vi.advanceTimersByTimeAsync(600);
  await submitted;
  await page.updateComplete;
  return text(page, '.error-text');
}

describe('a sign-in refused', () => {
  it('for the connection limit says so', async () => {
    expect(await signIn(503, { error: 'connection_limit' })).toBe('login.tooManyConnections');
  });

  it('for the password still says what the server said', async () => {
    expect(await signIn(401, { error: 'Failed to login' })).toBe('Failed to login');
  });
});
