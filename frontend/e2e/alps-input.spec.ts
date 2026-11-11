import { expect, login, resetSettings, test } from './fixtures';

test.afterEach(async ({ page }) => { await page.goto('about:blank'); await resetSettings(); });

// The inner input's own `input` reaches whoever listens on alps-input. It used
// to send a second one of its own after it, so a listener heard every key twice.
test('an alps-input says input once per key, with the value typed so far', async ({ page }) => {
  await login(page);
  await page.goto('/#/settings/identity');
  const host = page.locator('alps-setting-group[label="Display Name"] alps-input');
  await host.evaluate((el) => {
    const seen: string[] = [];
    (window as unknown as { inputsSeen: string[] }).inputsSeen = seen;
    el.addEventListener('input', (e) => seen.push((e.target as HTMLInputElement).value));
  });
  await host.locator('input').click();
  await page.keyboard.type('abc');
  expect(await page.evaluate(() => (window as unknown as { inputsSeen: string[] }).inputsSeen)).toEqual(['a', 'ab', 'abc']);
});
