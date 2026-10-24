// A plugin page whose module could not be fetched, while a message is being
// written.
//
// A plugin's page loads when it is first shown. A transient failure fetching
// its module (here a 503) left the page blank, with no word of why and no
// navigation, since a plugin page draws its own; with a composer open nothing
// reloads by itself, and showing the page again fetched nothing, because the
// browser keeps a failed import in the document's module map. In a browser,
// because that module map is the browser's.

import type { Locator, Page } from "@playwright/test";
import { allowConsoleErrors, expect, login, test } from "./fixtures";

const composerOf = (page: Page) => page.locator("alps-floating-composer");
const discardButton = (composer: Locator) =>
  composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true });
const confirmDiscardButton = (composer: Locator) =>
  composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true });

test.afterEach(async ({ page }) => {
  const composer = composerOf(page).first();
  if (!(await composer.locator(".window-frame").isVisible().catch(() => false))) return;
  await discardButton(composer).click({ timeout: 2_000 }).catch(() => {});
  await confirmDiscardButton(composer).click({ timeout: 2_000 }).catch(() => {});
});

test("a page that could not be fetched says so, keeps the composer, and opens after Reload", async ({ page }) => {
  await login(page);
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  const subject = `Kept through a reload ${Date.now()}`;
  await composer.getByPlaceholder("Subject").fill(subject);

  // The calendar page's module is refused once, as by a server restarting.
  let requests = 0;
  await page.route(/\/assets\/calendar-page-[^/]+\.js(\?.*)?$/, (route) =>
    requests++ === 0 ? route.fulfill({ status: 503, body: "" }) : route.continue(),
  );
  allowConsoleErrors(page, /status of 503/, /Failed to load <calendar-page>/, /dynamically imported module/);
  await page.evaluate(() => {
    window.location.hash = "#/calendar";
  });

  const notice = page.locator("alps-page-load-error");
  await expect(notice.getByRole("alert")).toContainText("This page could not be loaded.");
  await expect(notice.getByRole("link", { name: "Messages" })).toHaveAttribute("href", "#/mailbox/INBOX");
  await expect(composer.getByPlaceholder("Subject")).toHaveValue(subject);
  expect(requests).toBe(1);

  // Reload is the one way the module is fetched again, and the composer opens
  // again after it with what it held.
  await notice.getByRole("button", { name: "Reload" }).click();
  await page.waitForFunction(() => !!customElements.get("calendar-page"), undefined, { timeout: 15_000 });
  expect(requests).toBe(2);
  await expect(page.locator("alps-page-load-error")).toHaveCount(0);
  await expect(composerOf(page).getByPlaceholder("Subject")).toHaveValue(subject);
});

test("Reload keeps the live draft when recovery storage is full, and retries after storage recovers", async ({ page }) => {
  allowConsoleErrors(page, /status of 503|Failed to load <calendar-page>|dynamically imported module|Failed to save compose drafts to localStorage|QuotaExceededError/);
  await login(page);
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  const subject = `Only live draft ${Date.now()}`;
  await composer.getByPlaceholder("Subject").fill(subject);
  let requests = 0;
  await page.route(/\/assets\/calendar-page-[^/]+\.js(\?.*)?$/, route =>
    requests++ === 0 ? route.fulfill({ status: 503, body: "" }) : route.continue());
  await page.goto('/#/calendar');
  const notice = page.locator('alps-page-load-error');
  await expect(notice).toContainText('This page could not be loaded.');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as any).restoreRecoveryStorage = () => { Storage.prototype.setItem = original; };
    (window as any).recoveryDocument = 'unchanged';
    Storage.prototype.setItem = function(key, value) {
      if (key.startsWith('alps_compose_drafts_')) throw new DOMException('Storage is full', 'QuotaExceededError');
      original.call(this, key, value);
    };
  });
  const text = 'This latest body must survive a refused reload.';
  await composer.locator('.ProseMirror').fill(text);
  await notice.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect(notice.locator('.persist-error')).toContainText('Could not save this draft');
  await expect(composer.getByPlaceholder('Subject')).toHaveValue(subject);
  await expect(composer.locator('.ProseMirror')).toContainText(text);
  expect(await page.evaluate(() => (window as any).recoveryDocument)).toBe('unchanged');
  expect(requests).toBe(1);

  await page.evaluate(() => (window as any).restoreRecoveryStorage());
  await notice.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect(page.locator('calendar-month-view')).toBeVisible({ timeout: 15_000 });
  expect(requests).toBe(2);
  expect(await page.evaluate(() => (window as any).recoveryDocument)).toBeUndefined();
  await expect(composerOf(page).getByPlaceholder('Subject')).toHaveValue(subject);
  await expect(composerOf(page).locator('.ProseMirror')).toContainText(text);
});
