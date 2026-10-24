import { allowConsoleErrors, expect, login, test } from './fixtures';

for (const width of [1280, 390]) {
  test(`a failed plugin page keeps recovery reachable and composition intact at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    allowConsoleErrors(page, /503|Failed to load resource|Failed to fetch dynamically imported module|Failed to load <calendar-page>/i);
    await login(page);
    // Open composition at desktop width, then exercise the narrow recovery UI.
    await page.setViewportSize({ width: 1280, height: 844 });
    await page.locator('alps-folder-list alps-create-button').click();
    const composer = page.locator('alps-floating-composer');
    await expect(composer.locator('.window-frame')).toBeVisible();
    const subject = `Keep this composition ${width}`;
    await composer.getByPlaceholder('Subject').fill(subject);
    await page.setViewportSize({ width, height: 844 });
    const marker = `document-${Date.now()}`;
    await page.evaluate(value => { (window as any).pluginLoadDocument = value; }, marker);

    let refuse = true;
    let requests = 0;
    await page.route('**/assets/calendar-page-*.js', async route => {
      requests++;
      if (refuse) await route.fulfill({ status: 503, contentType: 'application/javascript', body: 'unavailable' });
      else await route.continue();
    });
    await page.goto('/#/calendar/month/2026-06');
    const notice = page.locator('alps-toast[show]').filter({ hasText: 'This page could not be loaded.' });
    await expect(notice).toHaveCount(1);
    await expect(page.locator('alps-page-load-error')).toContainText('Messages you are writing are kept.');
    const back = notice.getByRole('button', { name: 'Back to Mail', exact: true });
    const bounds = await back.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await notice.evaluate(el => (el as any).timeout)).toBe(0);
    await back.click();
    await expect(page).toHaveURL(/#\/mailbox\/INBOX$/);
    await expect(composer.getByPlaceholder('Subject')).toHaveValue(subject);

    // Native import failures can remain cached after networking recovers.
    // A revisit must explain recovery again, without a reload over the draft.
    refuse = false;
    await page.goto('/#/calendar/month/2026-06');
    await expect(notice).toHaveCount(1);
    await expect(notice.getByRole('button', { name: 'Back to Mail' })).toBeVisible();
    await expect(composer.getByPlaceholder('Subject')).toHaveValue(subject);
    expect(await page.evaluate(() => (window as any).pluginLoadDocument)).toBe(marker);
    expect(requests).toBe(1);

    await composer.locator('alps-icon-btn[title="Save & close"]').click();
    await expect(composer).toHaveCount(0);
    await expect(page.locator('calendar-month-view')).toBeVisible({ timeout: 15_000 });
    expect(await page.evaluate(() => (window as any).pluginLoadDocument)).not.toBe(marker);
    expect(requests).toBe(2);
  });
}
