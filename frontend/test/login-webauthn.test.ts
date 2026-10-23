import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as webauthnUtils from '../src/utils/webauthn-utils';
import '../src/pages/login-webauthn-page';
import { LoginWebAuthnPage } from '../src/pages/login-webauthn-page';

describe('login-webauthn-page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    window.location.hash = '#/login/webauthn';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('dispatches user-logged-in with username and navigates to mailbox on successful verification', async () => {
    vi.spyOn(webauthnUtils, 'isWebAuthnSupported').mockReturnValue(true);
    vi.spyOn(webauthnUtils, 'authenticateCredential').mockResolvedValue({ id: 'cred-1' } as any);

    const loggedInEvents: any[] = [];
    window.addEventListener('user-logged-in', (e: any) => {
      loggedInEvents.push(e.detail);
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).endsWith('/webauthn/verify/begin')) {
        return {
          ok: true,
          json: async () => ({ publicKey: { challenge: 'challenge' } }),
        } as any;
      }
      if (String(url).endsWith('/webauthn/verify/finish')) {
        return {
          ok: true,
          json: async () => ({ success: true, username: 'ada@example.com' }),
        } as any;
      }
      return { ok: false } as any;
    });

    const el = document.createElement('login-webauthn-page') as LoginWebAuthnPage;
    document.body.appendChild(el);

    try {
      await vi.waitFor(() => {
        expect(loggedInEvents.length).toBe(1);
      }, { timeout: 2000 });

      expect(loggedInEvents[0]).toEqual({ username: 'ada@example.com' });
      expect(window.location.hash).toBe('#/mailbox/INBOX');
    } finally {
      el.remove();
    }
  });

  it('falls back to pending_2fa_username from sessionStorage if backend response omits username', async () => {
    vi.spyOn(webauthnUtils, 'isWebAuthnSupported').mockReturnValue(true);
    vi.spyOn(webauthnUtils, 'authenticateCredential').mockResolvedValue({ id: 'cred-1' } as any);
    sessionStorage.setItem('pending_2fa_username', 'ada@example.com');

    const loggedInEvents: any[] = [];
    window.addEventListener('user-logged-in', (e: any) => {
      loggedInEvents.push(e.detail);
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).endsWith('/webauthn/verify/begin')) {
        return {
          ok: true,
          json: async () => ({ publicKey: { challenge: 'challenge' } }),
        } as any;
      }
      if (String(url).endsWith('/webauthn/verify/finish')) {
        return {
          ok: true,
          json: async () => ({ success: true }), // no username field in response
        } as any;
      }
      return { ok: false } as any;
    });

    const el = document.createElement('login-webauthn-page') as LoginWebAuthnPage;
    document.body.appendChild(el);

    try {
      await vi.waitFor(() => {
        expect(loggedInEvents.length).toBe(1);
      }, { timeout: 2000 });

      expect(loggedInEvents[0]).toEqual({ username: 'ada@example.com' });
      expect(sessionStorage.getItem('pending_2fa_username')).toBeNull();
      expect(window.location.hash).toBe('#/mailbox/INBOX');
    } finally {
      el.remove();
    }
  });

  it('triggers window.location.reload when pending_2fa_is_switch is set', async () => {
    vi.spyOn(webauthnUtils, 'isWebAuthnSupported').mockReturnValue(true);
    vi.spyOn(webauthnUtils, 'authenticateCredential').mockResolvedValue({ id: 'cred-1' } as any);
    sessionStorage.setItem('pending_2fa_username', 'bob@example.com');
    sessionStorage.setItem('pending_2fa_is_switch', '1');

    const origLocation = window.location;
    const reload = vi.fn();
    delete (window as any).location;
    (window as any).location = {
      href: 'http://localhost/#/login/webauthn',
      hash: '#/login/webauthn',
      reload,
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).endsWith('/webauthn/verify/begin')) {
        return {
          ok: true,
          json: async () => ({ publicKey: { challenge: 'challenge' } }),
        } as any;
      }
      if (String(url).endsWith('/webauthn/verify/finish')) {
        return {
          ok: true,
          json: async () => ({ success: true, username: 'bob@example.com' }),
        } as any;
      }
      return { ok: false } as any;
    });

    const el = document.createElement('login-webauthn-page') as LoginWebAuthnPage;
    document.body.appendChild(el);

    try {
      await vi.waitFor(() => {
        expect(reload).toHaveBeenCalled();
      }, { timeout: 2000 });

      expect(sessionStorage.getItem('pending_2fa_is_switch')).toBeNull();
      expect(sessionStorage.getItem('pending_2fa_username')).toBeNull();
      expect(window.location.hash).toBe('/mailbox/INBOX');
    } finally {
      el.remove();
      delete (window as any).location;
      (window as any).location = origLocation;
    }
  });

  describe('an answer that is not a verdict on the key', () => {
    const answer = (status: number, body?: unknown) => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (body === undefined) throw new SyntaxError('Unexpected token < in JSON at position 0');
        return body;
      },
    }) as any;

    const options = () => answer(200, { publicKey: { challenge: 'challenge' } });

    /** Mounts the page with the two answers, and waits for what it says. */
    async function verify(begin: () => any, finish: () => any = () => answer(200, { success: true })) {
      vi.spyOn(webauthnUtils, 'isWebAuthnSupported').mockReturnValue(true);
      const key = vi.spyOn(webauthnUtils, 'authenticateCredential').mockResolvedValue({ id: 'cred-1' } as any);
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        if (String(url).endsWith('/webauthn/verify/begin')) return begin();
        if (String(url).endsWith('/webauthn/verify/finish')) return finish();
        return answer(404, {});
      });
      const el = document.createElement('login-webauthn-page') as LoginWebAuthnPage & Record<string, any>;
      el.i18nStore = { t: (k: string) => k, addEventListener() {}, removeEventListener() {} };
      document.body.appendChild(el);
      return { el, key };
    }

    const said = async (el: Record<string, any>, message: string) => {
      await vi.waitFor(() => expect(el.statusMessage).toBe(message), { timeout: 2000 });
      expect(el.statusType).toBe('error');
      // Still on the key: Verify runs the ceremony again, no password asked.
      expect(window.location.hash).toBe('#/login/webauthn');
    };

    it('says the server could not check the key when the options cannot be had', async () => {
      const { el, key } = await verify(() => answer(503, { error: 'Service temporarily unavailable' }));
      try {
        await said(el, 'webauthn.errors.unavailable');
        expect(key).not.toHaveBeenCalled();
      } finally {
        el.remove();
      }
    });

    it('does not call an outage during verification a failed verification', async () => {
      const { el } = await verify(options, () => answer(500, { error: 'An internal error occurred' }));
      try {
        await said(el, 'webauthn.errors.unavailable');
      } finally {
        el.remove();
      }
    });

    it('does not show a proxy\'s error page as a parser error', async () => {
      const { el } = await verify(options, () => answer(502));
      try {
        await said(el, 'webauthn.errors.unavailable');
      } finally {
        el.remove();
      }
    });

    it('says the network failed, not the browser\'s "Failed to fetch", when nothing answered', async () => {
      const { el } = await verify(options, () => { throw new TypeError('Failed to fetch'); });
      try {
        await said(el, 'login.networkError');
      } finally {
        el.remove();
      }
    });

    it('still says a key the server refused failed verification', async () => {
      const { el } = await verify(options, () => answer(400, { error: 'verification failed' }));
      try {
        await said(el, 'webauthn.errors.verification_failed');
      } finally {
        el.remove();
      }
    });

    // Cancelling the browser's prompt, or letting it time out, rejects with a
    // NotAllowedError whose message is the browser's own, in English whatever
    // the language here, with a link to the WebAuthn specification.
    it('says the key was not used, in the user\'s language, when the prompt is cancelled or times out', async () => {
      for (const name of ['NotAllowedError', 'AbortError']) {
        const { el, key } = await verify(options);
        key.mockRejectedValue(new DOMException(
          'The operation either timed out or was not allowed. See: https://www.w3.org/TR/webauthn-2/#sctn-privacy-considerations-client.',
          name,
        ));
        try {
          await said(el, 'webauthn.errors.cancelled');
        } finally {
          el.remove();
          vi.restoreAllMocks();
        }
      }
    });

    it('says an error occurred, not the browser\'s words, when the key fails otherwise', async () => {
      const { el, key } = await verify(options);
      key.mockRejectedValue(new DOMException('The relying party ID is not a registrable domain suffix of, nor equal to the current domain.', 'SecurityError'));
      try {
        await said(el, 'webauthn.errors.general');
      } finally {
        el.remove();
      }
    });

    it('says the key was not used when the browser hands back no credential', async () => {
      const get = vi.fn(async () => null);
      Object.defineProperty(navigator, 'credentials', { value: { get }, configurable: true });
      // The challenge is decoded on the way to the browser, so it is base64url.
      const { el, key } = await verify(() => answer(200, { publicKey: { challenge: 'AAAA' } }));
      key.mockRestore();
      try {
        await said(el, 'webauthn.errors.cancelled');
        expect(get).toHaveBeenCalled();
      } finally {
        el.remove();
        delete (navigator as any).credentials;
      }
    });

    // The options are decoded on the way to the browser. A challenge or a
    // credential id that was missing failed with the decoder's own English
    // sentence, "base64url is null or undefined"; one that was not base64url
    // failed in atob, and read as a general error.
    it.each([
      ['without a challenge', { allowCredentials: [] }],
      ['with a credential that has no id', { challenge: 'AAAA', allowCredentials: [{ type: 'public-key' }] }],
      ['with a challenge that is not base64url', { challenge: '!!!' }],
      ['with only whitespace for a challenge', { challenge: ' \t\n' }],
      ['with whitespace inside a challenge', { challenge: 'AA AA' }],
      ['with only whitespace for a credential id', { challenge: 'AAAA', allowCredentials: [{ type: 'public-key', id: ' \t' }] }],
      ['with a plus sign in a challenge', { challenge: 'AA+_' }],
      ['with a slash in a credential id', { challenge: 'AAAA', allowCredentials: [{ type: 'public-key', id: '/w' }] }],
    ])('says the options cannot be used, in the user\'s language, when they come %s', async (_, publicKey) => {
      const get = vi.fn(async () => null);
      Object.defineProperty(navigator, 'credentials', { value: { get }, configurable: true });
      const { el, key } = await verify(() => answer(200, { publicKey }));
      key.mockRestore();
      try {
        await said(el, 'webauthn.errors.invalid_options');
        expect(get).not.toHaveBeenCalled();
      } finally {
        el.remove();
        delete (navigator as any).credentials;
      }
    });

    it('goes back to the password, and says why, when the pending sign-in is gone', async () => {
      sessionStorage.setItem('pending_2fa_username', 'ada@example.com');
      const { el } = await verify(options, () => answer(401, { error: 'no pending 2FA session' }));
      try {
        await vi.waitFor(() => expect(window.location.hash).toBe('#/login'), { timeout: 2000 });
        expect(sessionStorage.getItem('alps-login-notice')).toBe('secondFactorExpired');
        expect(sessionStorage.getItem('pending_2fa_username')).toBeNull();
      } finally {
        el.remove();
      }
    });
  });
});
