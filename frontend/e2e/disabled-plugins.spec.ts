import { expect, login, signIn, test, USER } from './fixtures';

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  const composer = page.locator('alps-floating-composer').first();
  if (!(await composer.locator('.window-frame').isVisible().catch(() => false))) return;
  await composer.locator('.send-actions').getByRole('button', { name: 'Discard', exact: true }).click();
  await composer.locator('ui-confirm').getByRole('button', { name: 'Discard', exact: true }).click().catch(() => {});
});

test('a sign-in without a reload removes disabled plugin addresses', async ({ page }) => {
  await page.route('**/session', async route => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const data = await response.json();
    await route.fulfill({ response, json: { ...data, EnabledPlugins: ['base'] } });
  });
  await signIn(page);
  for (const route of ['calendar', 'tasks', 'contacts']) {
    await page.evaluate(route => { window.location.hash = `#/${route}`; }, route);
    await expect(page.locator('app-root .route-view')).toContainText('404');
    await expect(page.locator(`${route}-page`)).toHaveCount(0);
  }
});

test('a plugin turned off by session refresh loses its cached page and Settings pane while composition is kept', async ({ page }) => {
  await login(page);
  await page.locator('alps-folder-list alps-create-button').click();
  const composer = page.locator('alps-floating-composer');
  const subject = `Kept while plugins change ${Date.now()}`;
  await composer.getByPlaceholder('Subject').fill(subject);
  await page.evaluate(() => { window.location.hash = '#/calendar'; });
  await expect(page.locator('calendar-month-view')).toBeVisible();
  await page.evaluate(() => { window.location.hash = '#/settings/autoreply'; });
  await expect(page.locator('alps-auto-reply-page')).toBeVisible();

  await page.route('**/session', async route => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const data = await response.json();
    await route.fulfill({ response, json: { ...data, EnabledPlugins: ['base'] } });
  });
  await page.evaluate(username => window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { username } })), USER.address);
  await expect(page.locator('alps-auto-reply-page')).toHaveCount(0);
  await expect(page.locator('calendar-page')).toHaveCount(0);
  await expect(page.locator('settings-window')).toBeVisible();
  await expect(composer.getByPlaceholder('Subject')).toHaveValue(subject);
  await page.evaluate(() => { window.location.hash = '#/calendar'; });
  await expect(page.locator('app-root .route-view')).toContainText('404');
  await expect(page.locator('calendar-page')).toHaveCount(0);
});
