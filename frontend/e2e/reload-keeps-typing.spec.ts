// A reload with a message being written.
//
// The compose store writes the open composers to disk half a second after
// the last change, and they open again after a reload from what is there.
// A reload within that half second, the update offer's or the browser's own,
// came before the write, and what had been typed in it was gone. In a
// browser, because what matters is what survives a real reload.

import type { Locator, Page } from "@playwright/test";
import { expect, login, test, toast } from "./fixtures";

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

test("the update offer's Reload keeps what was typed just before it", async ({ page }) => {
  await login(page);
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  const subject = composer.getByPlaceholder("Subject");
  const stem = `Engines ${Date.now()}`;
  await subject.fill(stem);
  // Long past the store's half-second wait: this much is on disk.
  await page.waitForTimeout(1_500);

  // A newer build is served, and the toast offers a reload.
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("app-update-available")));
  const offer = toast(page, "A new version is available.");
  await expect(offer).toBeVisible();

  // Typed, and Reload pressed straight after, as a user does.
  await subject.fill(`${stem} and looms`);
  await offer.getByRole("button", { name: "Reload" }).click();
  await page.waitForLoadState("load");

  const reopened = composerOf(page).getByPlaceholder("Subject");
  await expect(reopened).toBeVisible({ timeout: 15_000 });
  await expect(reopened).toHaveValue(`${stem} and looms`);
});

test("a reload of the page keeps what was typed just before it", async ({ page }) => {
  await login(page);
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  const subject = composer.getByPlaceholder("Subject");
  const stem = `Looms ${Date.now()}`;
  await subject.fill(stem);
  await page.waitForTimeout(1_500);

  // Typed, and the page reloaded straight after, as by F5.
  await subject.fill(`${stem} and engines`);
  await page.reload();

  const reopened = composerOf(page).getByPlaceholder("Subject");
  await expect(reopened).toBeVisible({ timeout: 15_000 });
  await expect(reopened).toHaveValue(`${stem} and engines`);
});
