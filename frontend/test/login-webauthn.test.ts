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
});
