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
