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

// Typed one key at a time, as people type, the address is saved once, when the
// field is left. Every key used to save what was typed so far: "r" was refused
// as no address, and the refusal emptied the field before the next key.
test('a Reply-To typed key by key is kept, and saved once the field is left', async ({ page }) => {
  await login(page);
  await page.goto('/#/settings/identity');
  const field = page.locator('alps-setting-group[label="Reply-To Address"] input');
  const puts: string[] = [];
  page.on('request', r => {
    if (new URL(r.url()).pathname === '/settings' && r.method() === 'PUT') puts.push(r.postData() ?? '');
  });
  await field.pressSequentially('reply@example.com', { delay: 50 });
  await expect(field).toHaveValue('reply@example.com');
  expect(puts, 'saved while still being typed').toEqual([]);

  const saved = page.waitForResponse(r => new URL(r.url()).pathname === '/settings' && r.request().method() === 'PUT');
  await field.press('Tab');
  expect((await saved).status()).toBe(200);
  expect(puts).toHaveLength(1);
  expect(JSON.parse(puts[0])).toEqual({ reply_to: 'reply@example.com' });
  await page.reload();
  await expect(field).toHaveValue('reply@example.com');
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
