/**
 * A refusal that arrives after the user signed out is not an expiry.
 *
 * Signing out ends the session on the server, and the reads still in flight
 * then are refused (401) once it has. Each raised `auth-error`, and the shell
 * took it for an expired session: "Your session has expired" replaced "You
 * have been signed out". On the login screen when the refusal came before that
 * page read its notice, and otherwise at the next visit to it, since the
 * notice waits in sessionStorage until it is read.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registry } from '../src/plugin-registry';
import { autoLogoutService } from '../src/services/auto-logout';
import { cleanup, flush, mount, waitFor } from './helpers/dom';

import '../src/components/app-root';
import '../src/components/alps-header';

type El = HTMLElement & Record<string, any>;

const USER = 'ada@example.com';
const NOTICE_KEY = 'alps-login-notice';
const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

/** A stand-in for the mailbox: what is under test is the shell's handling of
 * a refusal, not what it shows while signed in. */
const PAGE = 'late-refusal-page';
if (!customElements.get(PAGE)) customElements.define(PAGE, class extends HTMLElement {});
registry.registerRoute({ path: '/late-refusal', component: PAGE });

/** Answers the sign-out's DELETE /session, which is held until called. */
let endRequest: (() => void) | undefined;

beforeEach(() => {
  // A sign-in, as the login page announces one: each test starts with a
  // session the user has not ended.
  window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: USER } }));
  document.cookie = 'alps_logged_in=1; path=/';
  endRequest = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/session' && init?.method === 'DELETE') {
      await new Promise<void>((resolve) => { endRequest = resolve; });
      return new Response(null, { status: 204 });
    }
    return Response.json({});
  }));
});

afterEach(() => {
  cleanup();
  autoLogoutService.onBeforeLogout = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.cookie = 'alps_logged_in=; path=/; max-age=0';
  sessionStorage.clear();
  localStorage.clear();
  history.replaceState(null, '', '#/');
});

async function signedIn() {
  history.replaceState(null, '', '#/late-refusal');
  const shell = await mount<El>('app-root');
  await flush();
  const header = await mount<El>('alps-header', {
    username: USER,
    i18nStore,
    composeStore: { saveAllDirtyDrafts: async () => {} },
  });
  return { shell, header };
}

/** A read that was in flight when the session ended, refused. */
const lateRefusal = () => window.dispatchEvent(new CustomEvent('auth-error'));

const loginPage = (shell: El) => shell.shadowRoot!.querySelector<El>('login-page');

/** Runs a sign-out, with `meanwhile` while its request is under way. */
async function endSession(signOut: () => Promise<void>, meanwhile = () => {}) {
  const ended = signOut();
  await waitFor(() => endRequest !== undefined, 'the sign-out request');
  meanwhile();
  endRequest!();
  await ended;
}

describe('a refusal after the user signed out', () => {
  it('leaves the sign-out notice when it comes while the sign-out is under way', async () => {
    const { shell, header } = await signedIn();
    await endSession(() => header.handleSignOut(), lateRefusal);

    await waitFor(() => loginPage(shell) !== null, 'the login page');
    expect(loginPage(shell)!.notice).toBe('signedOut');
  });

  it('leaves no notice for the next visit when it comes after the login page has read its own', async () => {
    const { shell, header } = await signedIn();
    await endSession(() => header.handleSignOut());
    await waitFor(() => loginPage(shell) !== null, 'the login page');
    expect(loginPage(shell)!.notice).toBe('signedOut');

    lateRefusal();
    await flush();
    expect(sessionStorage.getItem(NOTICE_KEY)).toBeNull();
  });

  it('leaves the idle sign-out notice as well', async () => {
    const { shell } = await signedIn();
    await endSession(() => (autoLogoutService as any).logout(), lateRefusal);

    await waitFor(() => loginPage(shell) !== null, 'the login page');
    expect(loginPage(shell)!.notice).toBe('inactivitySignedOut');
  });

  it('is an expiry again once the user has signed in again', async () => {
    const { shell, header } = await signedIn();
    await endSession(() => header.handleSignOut());
    await waitFor(() => loginPage(shell) !== null, 'the login page');

    window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username: USER } }));
    window.location.hash = '#/late-refusal';
    await waitFor(() => loginPage(shell) === null, 'the mailbox');
    lateRefusal();

    await waitFor(() => loginPage(shell)?.notice === 'sessionExpired', 'the session-expired notice');
  });
});
