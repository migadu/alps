import { allowConsoleErrors, expect, login, readContact, resetDav, seedContact, test } from './fixtures';

test.beforeEach(async () => { await resetDav(); });
test.afterEach(async ({ page }) => { await page.goto('about:blank'); await resetDav(); });
const errors = /Error saving contact|Bulk contact operation failed|ERR_FAILED|Failed to fetch/;

test('a committed create whose response is lost is edited without making a second card', async ({ page }) => {
  allowConsoleErrors(page, errors);
  await login(page);
  let id = '';
  await page.route('**/contacts/create', async route => {
    id = route.request().postDataJSON().creation_id;
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    await route.abort('failed');
  }, { times: 1 });
  await page.goto('/#/contacts');
  await expect(page.locator('contacts-page alps-initial-loader')).toBeHidden();
  await page.locator('alps-contacts-categories alps-create-button').click();
  const name = page.locator('alps-contact-view input[placeholder="Name"]');
  await name.fill('Ada first');
  await expect.poll(async () => id ? readContact(id) : null).toContain('FN:Ada first');
  await expect(page.locator('alps-contacts-list .contact-item', { hasText: 'Ada first' })).toHaveCount(1);
  const saved = page.waitForResponse(r => /\/contacts\/.+\/edit$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST');
  await name.fill('Ada later');
  expect((await saved).status()).toBe(200);
  const contacts = await (await page.request.get('/contacts')).json();
  expect(contacts.contacts).toHaveLength(1);
  expect(contacts.contacts[0].uid).toBe(`urn:uuid:${id}`);
  expect(await readContact(id)).toContain('FN:Ada later');
});

for (const remove of [false, true]) {
  test(`a committed group ${remove ? 'removal' : 'rename'} with lost replies reconciles the sidebar and address`, async ({ page }) => {
    allowConsoleErrors(page, errors);
    await seedContact({ uid: 'group-uncertain', name: 'Grouped contact', email: 'group@example.test', lines: ['CATEGORIES:Work'] });
    await login(page);
    await page.goto('/#/contacts/Work');
    await expect(page.locator('alps-contacts-list .contact-item').filter({ hasText: 'Grouped contact' })).toBeVisible();
    await expect(page.locator('contacts-page alps-initial-loader')).toBeHidden();
    const row = page.locator('alps-contacts-categories .category-item').filter({ hasText: 'Work' });
    await row.hover();
    await row.getByRole('button', { name: 'More options' }).click();
    await expect(row.locator('alps-popup')).toHaveAttribute('open', '');
    await row.getByRole('button', { name: remove ? 'Delete' : 'Rename' }).click();
    await page.route(/\/contacts\/[^/?]+\/categories$/, async route => {
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      await route.abort('failed');
    });
    if (remove) await page.locator('contacts-page ui-confirm').getByRole('button', { name: 'Delete', exact: true }).click();
    else {
      const prompt = page.locator('contacts-page ui-prompt');
      await prompt.getByRole('textbox', { name: 'Category Name' }).fill('Office');
      await prompt.getByRole('button', { name: 'Rename', exact: true }).click();
    }
    await expect(page).toHaveURL(remove ? /#\/contacts\/all$/ : /#\/contacts\/Office$/);
    await expect(page.locator('alps-contacts-categories').getByRole('button', { name: 'Work', exact: true })).toHaveCount(0);
    expect(await readContact('group-uncertain')).toContain(remove ? 'FN:Grouped contact' : 'CATEGORIES:Office');
    if (remove) expect(await readContact('group-uncertain')).not.toContain('CATEGORIES:Work');
  });
}

test('a list refresh keeps the contact editor opened while it was waiting', async ({ page }) => {
  await login(page);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/contacts', async route => {
    const response = await route.fetch();
    await held;
    await route.fulfill({ response });
  }, { times: 1 });
  await page.goto('/#/contacts');
  await page.locator('alps-contacts-categories alps-create-button').click();
  const name = page.locator('alps-contact-view input[placeholder="Name"]');
  await name.fill('Kept during refresh');
  release();
  await expect(page.locator('contacts-page alps-initial-loader')).toBeHidden();
  await expect(name).toHaveValue('Kept during refresh');
});
