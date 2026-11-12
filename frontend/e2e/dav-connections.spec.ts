import { randomUUID } from 'node:crypto';
import { allowConsoleErrors, createAccount, deleteAccount, expect, login, resetSettings, test, toast } from './fixtures';

const personal = process.env.E2E_DAV_PERSONAL === '1';
const davURL = process.env.DAV_URL ?? 'http://127.0.0.1:8906';
let remote: { address: string; password: string };

test.beforeEach(async () => {
  remote = { address: `dav-${randomUUID()}@example.test`, password: 'separate-dav-password' };
  await createAccount(remote);
});
test.afterEach(async ({ page }) => {
  await page.goto('about:blank');
  for (const service of ['caldav', 'carddav']) {
    const reset = await page.request.delete(`/settings/dav/${service}`);
    expect(reset.ok()).toBe(true);
  }
  await page.request.delete('/session');
  await resetSettings();
  await deleteAccount(remote.address);
});

for (const service of ['caldav', 'carddav'] as const) {
  test(`${service} saves independent credentials, survives reload, and returns to its default`, async ({ page }) => {
    await login(page);
    const tab = page.locator(`app-header a[href="#/${service === 'caldav' ? 'calendar' : 'contacts'}"]`);
    if (personal) await expect(tab).toHaveCount(0);
    else await expect(tab).toBeVisible();

    await page.goto(`/#/settings/${service}`);
    const form = page.locator(`alps-${service}-settings`);
    await expect(form.getByLabel('Server URL')).toBeVisible();
    const category = service === 'caldav' ? 'Calendar' : 'Contacts';
    await expect(page.locator(`settings-window alps-category-item[data-category="${service}"]`)).toHaveText(category);
    await expect(page.locator('settings-window .category-title')).toHaveText(category);
    await expect(form.getByRole('button', { name: 'Remove connection', exact: true })).toHaveCount(0);
    await expect(form.locator('alps-input[type="url"][icon="globe"]')).toBeVisible();
    await expect(form.locator('h3, legend')).toHaveCount(0);
    await expect(form).toContainText('Enter the full HTTPS address of your DAV server.');
    await page.screenshot({ path: test.info().outputPath(`${service}-setup.png`) });
    if (personal) {
      await form.getByLabel('Server URL').fill(`${davURL.replace('http://', 'http+insecure://')}/${service}/`);
    }
    const useMail = form.locator('input[name="use_mail_credentials"]');
    if (personal) await expect(useMail).not.toBeChecked();
    else await expect(useMail).toBeChecked();
    await useMail.uncheck();
    const authentication = form.locator('alps-setting-group[label="Authentication"]');
    await expect(authentication.locator('input[placeholder="Username"]')).toBeVisible();
    await expect(authentication.locator('input[placeholder="Password"]')).toBeVisible();
    await expect(authentication.locator('alps-input[name="username"][type="text"][icon="user"]')).toBeVisible();
    await expect(form.locator('alps-setting-group[label="Username"], alps-setting-group[label="Password"]')).toHaveCount(0);
    await form.getByLabel('Username', { exact: true }).fill(remote.address);
    await form.getByLabel('Password', { exact: true }).fill('incorrect-password');
    allowConsoleErrors(page, /Failed to load resource: the server responded with a status of 400/);
    await form.getByRole('button', { name: 'Save connection', exact: true }).click();
    await expect(form.getByRole('alert')).toContainText('Could not access this DAV account.');
    await expect(form.getByRole('button', { name: 'Remove connection', exact: true })).toHaveCount(0);
    const rejected = await (await page.request.get(`/settings/dav/${service}`)).json();
    expect(rejected.personal_configured).toBe(false);

    await form.getByLabel('Password', { exact: true }).fill(remote.password);
    // Enter inside the shared input follows the same submission path as Save.
    await form.getByLabel('Password', { exact: true }).press('Enter');
    await expect(toast(page, 'Connection saved.').last()).toBeVisible();
    await expect(form.getByRole('button', { name: 'Remove connection', exact: true })).toBeVisible();
    await expect(form).not.toContainText('Connection saved.');
    await expect(form.getByLabel('Password', { exact: true })).toHaveValue('');
    await expect(tab).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`${service}-connection.png`) });

    const publicSettings = await (await page.request.get(`/settings/dav/${service}`)).json();
    expect(publicSettings.username).toBe(remote.address);
    expect(publicSettings.password_configured).toBe(true);
    expect(publicSettings.personal_configured).toBe(true);
    expect(JSON.stringify(publicSettings)).not.toContain(remote.password);
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
    expect(stored).not.toContain(remote.password);

    // The authenticated principal is the DAV account, while /session still
    // describes the mail account. Verify actual DAV access, not only settings.
    if (service === 'caldav') {
      const listing = await page.request.get('/calendar/calendars');
      expect(listing.ok()).toBe(true);
      const calendars = (await listing.json()).calendars;
      expect(calendars[0].path).toContain(remote.address);
      const made = await page.request.post('/calendar/calendars', { data: { name: 'Personal calendar' } });
      expect(made.ok()).toBe(true);
      await page.goto('/#/calendar');
      await expect(page.locator('calendar-page .calendars-list')).toContainText('Personal calendar');
    } else {
      const made = await page.request.post('/contacts/create', {
        data: { creation_id: randomUUID(), name: 'Personal DAV contact', email: 'personal@example.test' },
      });
      expect(made.ok()).toBe(true);
      await page.goto('/#/contacts');
      await expect(page.locator('alps-contacts-list')).toContainText('Personal DAV contact');
    }

    await page.goto(`/#/settings/${service}`);
    await page.reload();
    await expect(form.getByLabel('Username', { exact: true })).toHaveValue(remote.address);
    await expect(form).toContainText('Password configured. Leave blank to keep it.');
    await form.getByRole('button', { name: 'Save connection', exact: true }).click();
    await expect(toast(page, 'Connection saved.').last()).toBeVisible();

    const remove = form.getByRole('button', { name: 'Remove connection', exact: true });
    await remove.click();
    const confirm = form.locator('ui-confirm');
    await expect(confirm.getByRole('dialog', { name: 'Remove connection', exact: true })).toBeVisible();
    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(confirm).toHaveCount(0);
    expect((await (await page.request.get(`/settings/dav/${service}`)).json()).personal_configured).toBe(true);
    await remove.click();
    await expect(confirm.getByRole('dialog', { name: 'Remove connection', exact: true })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`${service}-remove-confirm.png`) });
    await confirm.getByRole('button', { name: 'Remove connection', exact: true }).click();
    await expect(toast(page, personal ? 'Personal connection removed.' : 'Default connection restored.').last()).toBeVisible();
    await expect(remove).toHaveCount(0);
    await expect(form).not.toContainText(personal ? 'Personal connection removed.' : 'Default connection restored.');
    if (personal) await expect(tab).toHaveCount(0);
    else await expect(tab).toBeVisible();
    await expect(form.getByLabel('Server URL')).toBeVisible();
  });
}
