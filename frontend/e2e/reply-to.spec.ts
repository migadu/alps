import { allowConsoleErrors, expect, login, resetSettings, test, toast, USER, waitForSent } from './fixtures';

test.beforeEach(async () => { await resetSettings(); });
test.afterEach(async ({ page }) => { await page.goto('about:blank'); await resetSettings(); });

test('an invalid Reply-To is refused with translated feedback and the previous address remains', async ({ page }) => {
  allowConsoleErrors(page, /400|Failed to save backend settings/);
  await login(page);
  await page.goto('/#/settings/identity');
  const field = page.locator('alps-setting-group[label="Reply-To Address"] input');
  await field.fill('not an address');
  const refused = page.waitForResponse(r => new URL(r.url()).pathname === '/settings' && r.request().method() === 'PUT');
  await field.press('Tab');
  expect((await refused).status()).toBe(400);
  await expect(toast(page, 'Enter an email address, like name@example.com.')).toBeVisible();
  await expect(field).toHaveValue('');
  await page.reload();
  await expect(field).toHaveValue('');
});

test('a Unicode Reply-To name is saved and sent as an encoded address', async ({ page }) => {
  await login(page);
  await page.goto('/#/settings/identity');
  const field = page.locator('alps-setting-group[label="Reply-To Address"] input');
  await field.fill('Ćirić <reply@example.com>');
  const saved = page.waitForResponse(r => new URL(r.url()).pathname === '/settings' && r.request().method() === 'PUT');
  await field.press('Tab');
  expect((await saved).status()).toBe(200);
  await page.goto('/#/mailbox/INBOX');
  await page.locator('alps-folder-list alps-create-button').click();
  const composer = page.locator('alps-floating-composer');
  const recipient = composer.locator('alps-address-input input').first();
  await recipient.fill(USER.address); await recipient.press('Enter');
  const subject = `Reply-To encoding ${Date.now()}`;
  await composer.getByPlaceholder('Subject').fill(subject);
  await composer.locator('.ProseMirror').fill('Reply here.');
  await composer.locator('.send-actions').getByRole('button', { name: 'Send', exact: true }).click();
  const sent = await waitForSent(m => m.data.includes(subject));
  expect(sent.data).toMatch(/Reply-To:.*=\?utf-8\?/i);
  expect(sent.data).toContain('reply@example.com');
  expect(sent.data).not.toContain('Ćirić');
});
