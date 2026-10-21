/**
 * Trust in linked accounts, on the security settings.
 *
 * Turning it on waives the account's second factor for every account linked
 * to it, so the server asks for the password and refuses a session that has
 * not given the second factor. What the page must get right: it asks for the
 * password before sending anything, it says why a refusal was a refusal, and
 * the box only ever shows what the server holds.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, shadow, text, waitFor } from './helpers/dom';
import { I18nStore } from '../src/store/i18n-store';
import '../src/components/alps-webauthn-settings';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

interface Sent {
  trust: boolean;
  current_password?: string;
}

let trusted: boolean;
let sent: Sent[];
let answer: (body: Sent) => Response;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  trusted = false;
  sent = [];
  answer = (body) => {
    trusted = body.trust;
    return json(200, { ok: true });
  };
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const path = String(url);
    if (path === '/settings/2fa') {
      return json(200, {
        credentialCount: 1,
        credentials: [{ ID: 'a2V5', Name: 'Laptop', AddedAt: '2026-10-01T10:00:00Z' }],
        isSecuritySettings: true,
        trustLinkedAccounts: trusted,
      });
    }
    if (path === '/settings/2fa/trust-linked-accounts') {
      const body = JSON.parse(String(init?.body)) as Sent;
      sent.push(body);
      return answer(body);
    }
    return json(404, {});
  }));
});

async function settings(): Promise<HTMLElement> {
  const el = await mount('alps-webauthn-settings', { i18nStore: new I18nStore() });
  await waitFor(() => !!el.shadowRoot?.querySelector('input[type="checkbox"]'), 'the trust checkbox');
  return el;
}

const box = (el: HTMLElement) => shadow<HTMLInputElement>(el, 'input[type="checkbox"]');

/** Clicks the box, as the user does, and lets the page answer. */
async function toggle(el: HTMLElement) {
  box(el).click();
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
}

/** Gives the open password prompt `password` and submits it. */
function submitPassword(el: HTMLElement, password: string) {
  shadow(el, 'ui-prompt').dispatchEvent(
    new CustomEvent('submit', { detail: { password }, bubbles: true, composed: true }),
  );
}

describe('trust in linked accounts', () => {
  it('asks for the password before turning trust on, and sends nothing until it is given', async () => {
    const el = await settings();
    await toggle(el);

    expect(el.shadowRoot!.querySelector('ui-prompt')).not.toBeNull();
    expect(sent).toEqual([]);
    expect(box(el).checked).toBe(false);

    submitPassword(el, 'correct horse');
    await waitFor(() => sent.length === 1, 'the request');
    expect(sent[0]).toEqual({ trust: true, current_password: 'correct horse' });
    await waitFor(() => !!el.shadowRoot?.querySelector('input[type="checkbox"]') && box(el).checked, 'the box to show trust');
  });

  it('says why the server refused, and the box stays as the server has it', async () => {
    const el = await settings();
    for (const [status, code, words] of [
      [403, 'wrong_password', 'That password is not right.'],
      [403, 'two_factor_required', 'Sign in with your security key to change this setting.'],
      [409, 'no_security_key', 'Add a security key first.'],
      [429, 'rate_limited', 'Too many attempts. Please wait a few minutes and try again.'],
      [500, undefined, 'The setting could not be changed. Please try again.'],
    ] as const) {
      answer = () => json(status, code ? { error: code } : {});
      await toggle(el);
      submitPassword(el, 'a guess');
      await waitFor(() => text(el, 'ui-modal').includes(words), `the words for ${code ?? status}`);
      expect(box(el).checked, String(code)).toBe(false);
      shadow(el, 'ui-modal alps-button').click();
      await waitFor(() => !el.shadowRoot?.querySelector('ui-modal'), 'the message to close');
    }
  });

  it('does not send an empty password', async () => {
    const el = await settings();
    await toggle(el);
    submitPassword(el, '');
    await waitFor(() => text(el, 'ui-modal').includes('Enter your current password.'), 'the request for a password');
    expect(sent).toEqual([]);
    expect(box(el).checked).toBe(false);
  });

  it('closes the prompt on cancel, with nothing sent and nothing checked', async () => {
    const el = await settings();
    await toggle(el);
    shadow(el, 'ui-prompt').dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
    await waitFor(() => !el.shadowRoot?.querySelector('ui-prompt'), 'the prompt to close');
    expect(sent).toEqual([]);
    expect(box(el).checked).toBe(false);
  });

  it('turns trust off without asking for anything', async () => {
    trusted = true;
    const el = await settings();
    expect(box(el).checked).toBe(true);

    await toggle(el);
    expect(el.shadowRoot!.querySelector('ui-prompt')).toBeNull();
    await waitFor(() => sent.length === 1, 'the request');
    expect(sent[0]).toEqual({ trust: false });
    await waitFor(() => !!el.shadowRoot?.querySelector('input[type="checkbox"]') && !box(el).checked, 'the box to clear');
  });
});
