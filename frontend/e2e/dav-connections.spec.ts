import { randomUUID } from 'node:crypto';
import { createAccount, deleteAccount, expect, login, resetSettings, test } from './fixtures';

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
    if (personal) {
      await form.getByLabel('Server URL').fill(`${davURL.replace('http://', 'http+insecure://')}/${service}/`);
    }
    const useMail = form.locator('input[name="use_mail_credentials"]');
    await useMail.uncheck();
    await form.getByLabel('DAV username', { exact: true }).fill(remote.address);
    await form.getByLabel('DAV password', { exact: true }).fill(remote.password);
    await form.getByRole('button', { name: 'Save connection', exact: true }).click();
    await expect(form.getByRole('status').last()).toHaveText('Connection saved.');
    await expect(form.getByLabel('DAV password', { exact: true })).toHaveValue('');
    await expect(tab).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`${service}-connection.png`) });

    const publicSettings = await (await page.request.get(`/settings/dav/${service}`)).json();
    expect(publicSettings.username).toBe(remote.address);
    expect(publicSettings.password_configured).toBe(true);
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
    await expect(form.getByLabel('DAV username', { exact: true })).toHaveValue(remote.address);
    await expect(form).toContainText('Password configured. Leave blank to keep it.');
    await form.getByRole('button', { name: 'Save connection', exact: true }).click();
    await expect(form.getByRole('status').last()).toHaveText('Connection saved.');
    await form.getByRole('button', { name: personal ? 'Remove connection' : 'Use default connection', exact: true }).click();
    await expect(form.getByRole('status').last()).toHaveText(personal ? 'Personal connection removed.' : 'Default connection restored.');
    if (personal) await expect(tab).toHaveCount(0);
    else await expect(tab).toBeVisible();
    await expect(form.getByLabel('Server URL')).toBeVisible();
  });
}
