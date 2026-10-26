// The composer's surface under a theme that sets it apart.
//
// In Migadu the page is a pale blue, and the composer's body painted the same
// --bg-primary as the reader under it: only a thin border said where the
// window was. Migadu now gives floating windows a raised surface of their own,
// and the composer redefines --bg-primary to it, so the surfaces inside the
// window — the editor's toolbar is in a component of its own — follow too.
// jsdom resolves no custom properties, so only a browser can say what colour
// these end up.

import type { Locator, Page } from "@playwright/test";
import { expect, login, resetSettings, test } from "./fixtures";

const composerOf = (page: Page) => page.locator("alps-floating-composer");

async function openComposer(page: Page): Promise<Locator> {
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  return composer;
}

const background = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).backgroundColor);

// A record another spec left behind would decide the theme instead of the one
// set below, and the one set below must not decide the next spec's.
test.beforeAll(async () => {
  await resetSettings();
});
test.afterAll(async () => {
  await resetSettings();
});

for (const [mode, pageColor, raised] of [
  ["light", "rgb(245, 249, 255)", "rgb(255, 255, 255)"],
  ["dark", "rgb(12, 26, 59)", "rgb(19, 39, 86)"],
] as const) {
  test(`in Migadu ${mode}, the composer's body stands apart from the page`, async ({ page }) => {
    await page.addInitScript((mode) => {
      localStorage.setItem("alps_settings", JSON.stringify({ themeMode: mode, colorFamily: "migadu" }));
    }, mode);
    await login(page);
    await expect.poll(() => background(page.locator("body"))).toBe(pageColor);

    const composer = await openComposer(page);
    await expect.poll(() => background(composer.locator(".window-frame > .content"))).toBe(raised);
    await expect.poll(() => background(composer.locator("alps-message-composer .formatting-toolbar"))).toBe(raised);

    // A blank composer closes without asking.
    await composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true }).click();
    await expect(composer).toHaveCount(0);
  });
}
