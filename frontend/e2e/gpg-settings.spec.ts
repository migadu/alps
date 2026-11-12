// Each passphrase step is a form of its own. Moving to confirmation (or back
// after a mismatch) must not retain the previous form's value or submit latch.
import { test, expect, allowConsoleErrors, createAccount, deleteAccount, signInAs } from './fixtures';

const accounts: string[] = [];
test.afterAll(async () => {
  for (const address of accounts.splice(0)) await deleteAccount(address);
});

test('GPG passphrase confirmation, cancellation and mismatch retry can reach one real key save', async ({ page }) => {
  const address = `gpg-flow-${Date.now()}@example.test`;
  const password = 'gpg-browser-password-123';
  await createAccount({ address, password });
  accounts.push(address);
  await signInAs(page, address, password);
  await page.goto('/#/settings/localization');
  const savedLanguage = page.waitForResponse(r => new URL(r.url()).pathname === '/settings' && r.request().method() === 'PUT');
  await page.locator('settings-window select:has(option[value="de"])').selectOption('de');
  expect((await savedLanguage).ok()).toBe(true);
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe('de');

  let releaseRead!: () => void;
  let releaseSave!: () => void;
  const read = new Promise<void>(resolve => releaseRead = resolve);
  const save = new Promise<void>(resolve => releaseSave = resolve);
  const writes: { public_key: string; encrypted_private_key: string }[] = [];
  await page.route('**/gpg/keys', async route => {
    if (route.request().method() === 'POST') {
      writes.push(route.request().postDataJSON());
      await save;
    } else await read;
    await route.continue();
  });
  await page.goto('/#/settings/gpg');
  const pane = page.locator('alps-gpg-settings');
  await expect(pane.locator('alps-loader')).toContainText('Laden...');
  releaseRead();
  const generate = pane.getByRole('button', { name: 'Neues Schlüsselpaar generieren', exact: true });
  const prompt = pane.locator('ui-prompt');
  const passphrase = prompt.locator('input');
  const set = prompt.getByRole('button', { name: 'Passphrase festlegen', exact: true });
  const confirm = prompt.getByRole('button', { name: 'Bestätigen', exact: true });
  const cancel = prompt.getByRole('button', { name: 'Abbrechen', exact: true });

  // An empty step and Cancel both stop without generating or storing a key.
  await generate.click();
  await set.click();
  await expect(prompt).toHaveCount(0);
  await generate.click();
  await passphrase.fill('first attempt');
  await set.click();
  await expect(passphrase).toHaveValue('');
  await expect(confirm).toBeEnabled();
  await cancel.click();
  await expect(prompt).toHaveCount(0);
  expect(writes).toHaveLength(0);

  // The two prompts can replace one another in a single render. The next
  // one still starts empty and allows its own one submission.
  await generate.click();
  await passphrase.fill('different');
  await set.click();
  await expect(passphrase).toHaveValue('');
  await passphrase.fill('mismatch');
  await confirm.click();
  const error = pane.locator('ui-modal');
  await expect(error).toContainText('Passphrasen stimmen nicht überein.');
  await error.getByRole('button', { name: 'Schließen', exact: true }).click();
  await expect(passphrase).toHaveValue('');
  await passphrase.fill('new matching passphrase');
  await set.click();
  await expect(passphrase).toHaveValue('');
  await expect(confirm).toBeEnabled();
  await passphrase.fill('new matching passphrase');
  // Two immediate native clicks exercise the shared prompt's submission
  // guard. The second must not generate or save another key.
  await confirm.evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  await expect(pane.locator('alps-loader')).toContainText('Schlüsselpaar wird generiert...');
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].public_key).toContain('BEGIN PGP PUBLIC KEY BLOCK');
  expect(writes[0].encrypted_private_key).toContain('BEGIN PGP PRIVATE KEY BLOCK');
  const stored = page.waitForResponse(r => new URL(r.url()).pathname === '/gpg/keys' && r.request().method() === 'POST');
  releaseSave();
  expect((await stored).ok()).toBe(true);
  await expect(pane.getByRole('button', { name: 'Schlüsselpaar löschen', exact: true })).toBeVisible();
  await expect(pane.locator('.key-info')).toContainText(writes[0].public_key.trim());
  expect(writes).toHaveLength(1);
});

// The page offers to generate or import a keypair only once a read has
// answered that there is none. A read that fails says so and offers Try again,
// and the server keeps a stored keypair against a save that does not say it
// replaces it.
test('a failed keypair read offers Try again, and no new keypair over the stored one', async ({ page }) => {
  const address = `gpg-read-${Date.now()}@example.test`;
  const password = 'gpg-browser-password-123';
  await createAccount({ address, password });
  accounts.push(address);
  await signInAs(page, address, password);
  const origin = { Origin: new URL(page.url()).origin };
  const stored = { public_key: 'stored public key', encrypted_private_key: 'stored private key' };
  expect((await page.request.post('/gpg/keys', { headers: origin, data: stored })).ok()).toBe(true);

  allowConsoleErrors(page, /status of 500/, /500 Internal Server Error/);
  let refuse = true;
  await page.route('**/gpg/keys', route => refuse && route.request().method() === 'GET'
    ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"An internal error occurred"}' })
    : route.continue());
  await page.goto('/#/settings/gpg');
  const pane = page.locator('alps-gpg-settings');
  await expect(pane.getByRole('alert')).toHaveText('Could not load the GPG keys.');
  await expect(pane.getByText('No key present')).toHaveCount(0);
  await expect(pane.getByRole('button', { name: 'Generate New Keypair', exact: true })).toHaveCount(0);
  await expect(pane.getByRole('button', { name: 'Import Existing GPG Keypair', exact: true })).toHaveCount(0);

  refuse = false;
  await pane.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(pane.locator('.key-info')).toHaveText('stored public key');
  await expect(pane.getByRole('button', { name: 'Purge Keypair', exact: true })).toBeVisible();

  const other = { public_key: 'other public key', encrypted_private_key: 'other private key' };
  expect((await page.request.post('/gpg/keys', { headers: origin, data: other })).status()).toBe(409);
  expect(await (await page.request.get('/gpg/keys')).json()).toEqual(stored);
});
