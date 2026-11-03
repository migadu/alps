// The browser's language, until the user chooses one.
//
// An account that has never chosen a language is shown in the browser's: a
// German browser gets alps in German, from the sign-in page on, and nothing
// is saved for the account, which stays on Auto so that each browser it
// signs in on shows its own language. A language chosen in Settings is the
// account's from then on, whatever the browser prefers.
//
// The language a browser prefers is the context's: Playwright's `locale`
// sets navigator.language and navigator.languages, as a browser set to
// German does.

import type { Page } from "@playwright/test";
import { expect, login, resetSettings, test } from "./fixtures";

test.use({ locale: "de-DE" });

// The account's record is shared by every spec: it starts with no language
// here, and is left without one.
test.beforeEach(async () => {
  await resetSettings();
});

test.afterEach(async ({ page }) => {
  await page.goto("about:blank");
  await resetSettings();
  await page.request.delete("/session");
});

const html = (page: Page) => page.locator("html");
const windowTitle = (page: Page) => page.locator("settings-window .header-title");

/** The language, time and date selects in Settings › Localization, in order. */
const localizationSelect = (page: Page, index: number) =>
  page.locator("settings-window alps-setting-group").nth(index).locator("select");

/** Every settings save the page sends, as it sends it. */
function settingsSaves(page: Page): string[] {
  const saves: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PUT" && new URL(request.url()).pathname === "/settings") {
      saves.push(request.postData() ?? "");
    }
  });
  return saves;
}

test("a German browser shows alps in German to an account that never chose a language", async ({ page }) => {
  const saves = settingsSaves(page);

  await page.goto("/#/login");
  await expect(html(page)).toHaveAttribute("lang", "de");
  await expect(page.locator("login-page button[type=submit]")).toHaveText("Anmelden");

  const read = page.waitForResponse((r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "GET");
  await login(page);
  expect((await read).ok(), "the account's settings could not be read").toBe(true);
  await expect(html(page)).toHaveAttribute("lang", "de");

  await page.goto("/#/settings/localization");
  await expect(windowTitle(page)).toHaveText("Einstellungen");
  // All three on Auto, said in the language shown.
  for (const index of [0, 1, 2]) {
    await expect(localizationSelect(page, index)).toHaveValue("auto");
    await expect(localizationSelect(page, index).locator("option:checked")).toHaveText("Automatisch (Browser-Standard)");
  }

  // Signing in saved nothing: the account is still on Auto.
  expect(saves).toEqual([]);
});

test("a language chosen in Settings sticks, whatever the browser prefers", async ({ page }) => {
  const read = page.waitForResponse((r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "GET");
  await login(page);
  expect((await read).ok(), "the account's settings could not be read").toBe(true);
  await page.goto("/#/settings/localization");
  await expect(windowTitle(page)).toHaveText("Einstellungen");

  const saved = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "PUT" && r.ok(),
  );
  await localizationSelect(page, 0).selectOption("en");
  expect((await saved).request().postDataJSON()).toEqual({ language: "en" });
  await expect(windowTitle(page)).toHaveText("Settings");
  await expect(html(page)).toHaveAttribute("lang", "en");

  // Without this browser's copy, so that only the account's record can say
  // English: the page is German until the record is read, then English.
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("alps_settings")) localStorage.removeItem(key);
    }
  });
  await page.reload();
  await expect(windowTitle(page)).toHaveText("Settings");
  await expect(html(page)).toHaveAttribute("lang", "en");
  await expect(localizationSelect(page, 0)).toHaveValue("en");
});
