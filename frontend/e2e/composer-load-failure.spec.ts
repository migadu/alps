// When the message window cannot be loaded.
//
// The composer window's module is fetched on the first compose, or ahead of
// it once the app is idle. In a build, a fetch of it that failed was answered
// by Vite's preload helper with nothing, once app-update had handled its error
// event: pressing Compose drew no window and said nothing, each press left a
// composer in the store and on disk, drawn nowhere, and nothing ever loaded
// the module again. In a browser, because both the helper and the module map
// that keeps the failed import are the build's and the browser's.

import type { Locator, Page } from "@playwright/test";
import { allowConsoleErrors, expect, login, test, toast } from "./fixtures";

const CHUNK = /\/assets\/alps-floating-composer-[^/]+\.js(\?.*)?$/;
const NOTICE = "The message window could not be loaded.";

const composerOf = (page: Page) => page.locator("alps-floating-composer");
const discardButton = (composer: Locator) =>
  composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true });
const confirmDiscardButton = (composer: Locator) =>
  composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true });

/** What the compose store holds, and what it has on disk. */
const held = (page: Page) =>
  page.evaluate(() => {
    const root = document.querySelector("app-root") as any;
    const user = localStorage.getItem("alps_active_user");
    return {
      inStore: root.composeStore.getState().activeComposers.map((c: any) => c.subject ?? ""),
      onDisk: JSON.parse(localStorage.getItem(`alps_compose_drafts_${user}`) ?? "[]").map((c: any) => c.subject ?? ""),
    };
  });

/** Refuses the composer window's chunk until the returned function is called. */
async function refuseTheChunk(page: Page) {
  let requests = 0;
  await page.route(CHUNK, (route) => {
    requests++;
    return route.fulfill({ status: 503, body: "" });
  });
  allowConsoleErrors(page, /status of 503/, /dynamically imported module/, /Failed to load the composer/);
  return { requests: () => requests, restore: () => page.unroute(CHUNK) };
}

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
  for (const composer of await composerOf(page).all()) {
    if (!(await composer.locator(".window-frame").isVisible().catch(() => false))) continue;
    await discardButton(composer).click({ timeout: 2_000 }).catch(() => {});
    await confirmDiscardButton(composer).click({ timeout: 2_000 }).catch(() => {});
  }
});

test("Compose says the message window could not be loaded, and Reload brings it back", async ({ page }) => {
  const chunk = await refuseTheChunk(page);
  await login(page);
  // The idle prefetch fails; nothing is open, so app-update reloads once, and
  // the prefetch after that reload fails again, within its cooldown.
  await expect.poll(chunk.requests, { timeout: 30_000 }).toBeGreaterThanOrEqual(2);

  const compose = page.locator("alps-folder-list alps-create-button");
  await compose.click();
  const notice = toast(page, NOTICE);
  await expect(notice).toBeVisible();
  expect((await held(page)).inStore, "a composer is kept that cannot be shown").toEqual([]);

  // Pressed again, as a user does when nothing happened: one notice, and still
  // no composer kept for a window that cannot be drawn.
  await compose.click();
  await compose.click();
  await expect(notice).toHaveCount(1);
  expect(await held(page)).toEqual({ inStore: [], onDisk: [] });

  // The server answers again; Reload fetches the module in a new document.
  await chunk.restore();
  await notice.getByRole("button", { name: "Reload" }).click();
  await page.waitForLoadState("load");
  await compose.click();
  await expect(composerOf(page).locator(".window-frame")).toBeVisible({ timeout: 15_000 });
});

test("a draft restored as the app starts is kept, and opens after Reload", async ({ page }) => {
  await login(page);
  await page.locator("alps-folder-list alps-create-button").click();
  await expect(composerOf(page).locator(".window-frame")).toBeVisible();
  const subject = `Restored ${Date.now()}`;
  await composerOf(page).getByPlaceholder("Subject").fill(subject);
  await page.waitForTimeout(1_500);

  const chunk = await refuseTheChunk(page);
  await page.reload();
  const notice = toast(page, NOTICE);
  await expect(notice).toBeVisible({ timeout: 15_000 });
  expect(await held(page)).toEqual({ inStore: [subject], onDisk: [subject] });

  await chunk.restore();
  await notice.getByRole("button", { name: "Reload" }).click();
  await page.waitForLoadState("load");
  await expect(composerOf(page).getByPlaceholder("Subject")).toHaveValue(subject, { timeout: 15_000 });
});
