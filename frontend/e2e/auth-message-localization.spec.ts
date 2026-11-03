import { allowConsoleErrors, expect, login, resetSettings, test, toast, USER } from './fixtures';

test.use({ locale: 'de-DE' });
test.beforeEach(async () => { await resetSettings(); });
test.afterEach(async ({ page }) => { await page.goto('about:blank'); await resetSettings(); });

test('the German sign-in countdown includes a German duration', async ({ page }) => {
  allowConsoleErrors(page, /429/);
  await page.route('**/session', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({ status: 429, json: { error: 'Too many login attempts', retry_after: 30 } });
  });
  await page.goto('/#/login');
  await page.locator('login-page #username').fill(USER.address);
  await page.locator('login-page #password').fill(USER.password);
  await page.locator('login-page button[type=submit]').click();
  await expect(page.locator('login-page .error-text')).toContainText(/Bitte warten \d+ Sekunden/);
});

test('a wrong current password is reported in German by the real server', async ({ page }) => {
  allowConsoleErrors(page, /403/);
  await login(page);
  await page.goto('/#/settings/password');
  const form = page.locator('alps-password-settings');
  await form.locator('input').nth(0).fill('not-the-current-password');
  await form.locator('input').nth(1).fill('unused-new-password');
  await form.locator('input').nth(2).fill('unused-new-password');
  await form.locator('alps-button').click();
  await expect(toast(page, 'Dieses Passwort ist nicht richtig.')).toBeVisible();
  await expect(form.locator('input').first()).toHaveValue('not-the-current-password');
});

for (const answer of [
  { status: 400, body: { error: 'Password change rejected by server', code: 'password_change_rejected' }, message: 'Ihr Passwort konnte nicht geändert werden. Bitte versuchen Sie es erneut.' },
  { status: 200, body: { message: 'Password changed, but please log in again', code: 'reauthenticate' }, message: 'Ihr Passwort wurde geändert. Bitte melden Sie sich erneut an.' },
]) {
  test(`password response ${answer.status} uses the translated message`, async ({ page }) => {
    if (answer.status >= 400) allowConsoleErrors(page, new RegExp(String(answer.status)));
    await login(page);
    await page.goto('/#/settings/password');
    await page.route('**/password/change', route => route.fulfill({ status: answer.status, json: answer.body }));
    const form = page.locator('alps-password-settings');
    await form.locator('input').nth(0).fill(USER.password);
    await form.locator('input').nth(1).fill('unused-new-password');
    await form.locator('input').nth(2).fill('unused-new-password');
    await form.locator('alps-button').click();
    await expect(toast(page, answer.message)).toBeVisible();
  });
}
