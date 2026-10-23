import { SieveCompiler } from '../../plugins/managesieve/frontend/sieve-compiler';
import { test, expect, login, resetSieve } from './fixtures';
import { storeActiveScript, storedScripts } from './sieve-server';

const raw = '# filters before editing\nkeep;\n';
const visual = SieveCompiler.compile({ rules: [{
  id: 'kept-rule', matchType: 'all',
  conditions: [{ field: 'Subject', operator: 'contains', value: 'invoice' }],
  actions: [{ type: 'fileinto', value: 'Archive' }],
}] });

test.afterEach(async () => { await resetSieve(); });

for (const kind of ['auto-reply', 'raw', 'visual'] as const) {
  test(`${kind}: Keep editing, explicit Discard, and Back/Forward retention`, async ({ page }) => {
    if (kind !== 'auto-reply') await storeActiveScript('retained-edit', kind === 'raw' ? raw : visual);
    await login(page);
    const hash = kind === 'auto-reply' ? '#/settings/autoreply' : '#/settings/managesieve';
    const open = async () => { await page.evaluate(value => { location.hash = value; }, hash); };
    const host = page.locator(kind === 'auto-reply' ? 'alps-auto-reply-page' : 'alps-managesieve-page');
    const field = kind === 'auto-reply' ? host.locator('textarea') : kind === 'raw'
      ? host.locator('alps-raw-editor textarea') : host.locator('.condition-row alps-input input').first();
    const original = kind === 'auto-reply' ? '' : kind === 'raw' ? raw : 'invoice';
    const typed = kind === 'raw' ? raw + '# still unsaved\n' : 'Still unsaved after navigation';
    const save = host.getByRole('button', { name: 'Save', exact: true });
    const expectClean = async () => {
      if (kind === 'visual') await expect(save).toHaveCount(0);
      else await expect(save).toBeDisabled();
    };
    const leave = async () => {
      if (kind === 'auto-reply') await page.locator('settings-window .close-btn').click();
      else if (kind === 'raw') await field.press('Escape');
      else await page.locator('settings-window alps-category-item').filter({ hasText: 'Appearance' }).click();
    };

    await open();
    await expect(field).toHaveValue(original);
    await field.fill(typed);
    await leave();
    const confirm = page.locator('settings-window ui-confirm');
    await confirm.getByRole('button', { name: 'Keep editing', exact: true }).click();
    await expect(field).toHaveValue(typed);
    await expect(save).toBeEnabled();
    await leave();
    await confirm.getByRole('button', { name: 'Discard', exact: true }).click();
    if (kind === 'visual') await expect(page.locator('settings-window .category-title')).toHaveText('Appearance');
    else await expect(page.locator('settings-window')).toHaveCount(0);
    await open();
    await expect(field).toHaveValue(original);
    await expectClean();

    // Browser history leaves without the explicit Discard contract.
    await field.fill(typed);
    await page.goBack();
    await expect(host).toHaveCount(0);
    await page.goForward();
    await expect(field).toHaveValue(typed);
    await expect(save).toBeEnabled();
    expect((await storedScripts())[0]?.content ?? '').not.toContain('Still unsaved');
    const put = page.waitForResponse(response => response.url().endsWith('/managesieve/script') && response.request().method() === 'PUT');
    await save.click();
    expect((await put).status()).toBe(200);
    await expectClean();
    await page.locator('settings-window .close-btn').click();
    await expect(page.locator('settings-window')).toHaveCount(0);
    await open();
    await expect(field).toHaveValue(typed);
    await expectClean();
  });
}

test('newer reply typing survives Back while the preceding save is pending', async ({ page }) => {
  await login(page);
  await page.evaluate(() => { location.hash = '#/settings/autoreply'; });
  const field = page.locator('alps-auto-reply-page textarea');
  const save = page.locator('alps-auto-reply-page').getByRole('button', { name: 'Save', exact: true });
  await field.fill('Snapshot sent to the server.');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let entered!: () => void;
  const pending = new Promise<void>(resolve => { entered = resolve; });
  await page.route('**/managesieve/script', async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    entered();
    await gate;
    await route.continue();
  });
  const response = page.waitForResponse(res => res.url().endsWith('/managesieve/script') && res.request().method() === 'PUT');
  await save.click();
  await pending;
  await field.fill('Typing after the save, still unsaved.');
  await page.goBack();
  await expect(field).toHaveCount(0);
  release();
  expect((await response).status()).toBe(200);
  await page.goForward();
  await expect(field).toHaveValue('Typing after the save, still unsaved.');
  await expect(save).toBeEnabled();
});
