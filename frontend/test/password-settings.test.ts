import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record } from './helpers/dom';
import '../../plugins/password/frontend/password-settings';

type El = HTMLElement & Record<string, any>;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function change(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json(body, { status })));
  const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => `translated:${key}` });
  const page = await mount<El>('alps-password-settings', { i18nStore });
  page.passwordForm = { old: 'current', new: 'new password', confirm: 'new password' };
  const notices = record<CustomEvent>(window, 'show-toast');
  await page.submitPasswordChange();
  return { page, notice: notices.at(-1)!.detail };
}

describe('password change messages', () => {
  it.each([
    [403, 'current_password_incorrect', 'webauthn.errors.wrong_password'],
    [429, 'rate_limited', 'settings.password.tooManyAttempts'],
    [502, 'password_service_unavailable', 'settings.password.serviceUnavailable'],
    [400, 'password_change_rejected', 'settings.password.changeFailed'],
  ])('translates refusal %s/%s while keeping the entered passwords', async (status, code, key) => {
    const { page, notice } = await change(Number(status), { code, error: 'English from server' });
    expect(notice.message).toBe(`translated:${key}`);
    expect(notice.type).toBe('error');
    expect(page.passwordForm.old).toBe('current');
  });

  it.each([
    [{ code: 'password_changed', message: 'Password successfully changed' }, 'changed'],
    [{ code: 'reauthenticate', message: 'Password changed, but please log in again' }, 'changedSignInAgain'],
    [{ warning: 'linked_accounts_not_refreshed', message: 'Password successfully changed' }, 'changedLinkedWarning'],
  ])('translates success and any required follow-up', async (body, key) => {
    const { page, notice } = await change(200, body);
    expect(notice.message).toBe(`translated:settings.password.${key}`);
    expect(page.passwordForm).toEqual({ old: '', new: '', confirm: '' });
  });
});
