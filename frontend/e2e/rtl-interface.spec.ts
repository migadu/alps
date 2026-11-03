// A right-to-left interface: in Arabic the page is laid out from the right.
// The sidebar is on the right and widens toward the left, composers dock in
// the bottom-left corner, the phone drawer slides in from the right, the
// pointing icons are mirrored, and the sign-in fields keep an address left to
// right. Switching back to English mirrors it all back without a reload.
//
// jsdom lays nothing out, so where things land is checked here.

import type { Locator, Page } from "@playwright/test";
import { expect, login, resetSettings, test } from "./fixtures";

test.afterEach(async ({ page }) => {
  await page.goto("about:blank");
  await resetSettings();
  await page.request.delete("/session");
});

const html = (page: Page) => page.locator("html");
const sidebar = (page: Page) => page.locator("mailbox-page alps-sidebar .sidebar");
const messageList = (page: Page) => page.locator("alps-message-list");

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  expect(b, "the element is laid out").not.toBeNull();
  return b!;
}

/** The language select in Settings › Localization. */
const languageSelect = (page: Page) =>
  page.locator("settings-window alps-setting-group").first().locator("select");

/** Signs in and switches the interface to `code` through Settings, then shows the mailbox. */
async function useLanguage(page: Page, code: string): Promise<void> {
  const read = page.waitForResponse((r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "GET");
  await login(page);
  expect((await read).ok(), "the account's settings could not be read").toBe(true);
  await page.goto("/#/settings/localization");
  await expect(page.locator("settings-window .window-frame")).toBeVisible();
  const saved = page.waitForResponse((r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "PUT" && r.ok());
  await languageSelect(page).selectOption(code);
  await saved;
  await page.goto("/#/mailbox/INBOX");
  await expect(messageList(page)).toBeVisible();
  // The boot splash covers the page until the first listing lands; a pointer
  // pressed before then lands on the splash.
  await expect(page.locator("mailbox-page alps-initial-loader")).toBeHidden();
}

test("Arabic lays the mail page out from the right", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await useLanguage(page, "ar");

  await expect(html(page)).toHaveAttribute("dir", "rtl");
  await expect(html(page)).toHaveAttribute("lang", "ar");

  const side = await box(sidebar(page));
  const list = await box(messageList(page));
  expect(side.x, "the sidebar is right of the list").toBeGreaterThan(list.x);
  expect(Math.round(side.x + side.width)).toBe(1440);

  // A collapsed folder's caret points left, the way a right-to-left tree opens.
  const scale = await page.locator("alps-folder-list svg.icon").first().evaluate((svg) => {
    const icons = [...(svg.getRootNode() as ShadowRoot).querySelectorAll<SVGElement>("svg.icon")];
    const caret = icons.find((i) => i.querySelector("use")?.getAttribute("href")?.endsWith("#caretRight"));
    return caret ? getComputedStyle(caret).scale : "no caret";
  });
  if (scale !== "no caret") expect(scale).toBe("-1 1");
});

test("the sidebar widens toward the left in Arabic", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await useLanguage(page, "ar");

  const before = await box(sidebar(page));
  const handle = page.locator("mailbox-page alps-sidebar .sidebar-resizer");
  const h = await box(handle);
  await page.mouse.move(h.x + h.width / 2, h.y + 100);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2 - 60, h.y + 100, { steps: 5 });
  await page.mouse.up();

  const after = await box(sidebar(page));
  expect(after.width).toBeGreaterThan(before.width + 40);
  // Still against the right edge: it grew into the page, not off it.
  expect(Math.round(after.x + after.width)).toBe(1440);
});

test("a composer docks in the bottom-left corner in Arabic", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await useLanguage(page, "ar");

  await page.locator("alps-folder-list alps-create-button").click();
  const frame = page.locator("alps-floating-composer .window-frame");
  await expect(frame).toBeVisible();
  const b = await box(page.locator("alps-floating-composer"));
  expect(b.x).toBeLessThan(100);
  expect(Math.round(b.y + b.height)).toBe(900);
});

test("a menu opens on the mirrored side of its button in Arabic", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await useLanguage(page, "ar");

  // The account menu is aligned to its button's inline end: the left edge.
  const menu = page.locator("user-profile-menu alps-popup");
  const trigger = await box(menu.locator("[slot=trigger]").first());
  await menu.locator("[slot=trigger]").first().click();
  const content = menu.locator(".popup-content");
  await expect(content).toBeVisible();
  const c = await box(content);
  expect(Math.abs(c.x - trigger.x)).toBeLessThan(2);
  expect(c.x + c.width).toBeLessThanOrEqual(1440);
});

test("the phone drawer slides in from the right in Arabic", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await useLanguage(page, "ar");

  await page.locator('alps-header alps-icon-btn[icon="sidebar"]').click();
  const drawer = sidebar(page);
  await expect(async () => {
    const b = await box(drawer);
    expect(Math.round(b.x + b.width)).toBe(390);
  }).toPass();
});

test("switching back to English mirrors the page back without a reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await useLanguage(page, "ar");
  await expect(html(page)).toHaveAttribute("dir", "rtl");

  await page.goto("/#/settings/localization");
  await expect(page.locator("settings-window .window-frame")).toBeVisible();
  await languageSelect(page).selectOption("en");
  await expect(html(page)).toHaveAttribute("dir", "ltr");
  await page.goto("/#/mailbox/INBOX");

  const side = await box(sidebar(page));
  const list = await box(messageList(page));
  expect(side.x).toBeLessThan(list.x);
  expect(Math.round(side.x)).toBe(0);
});

test("the sign-in fields keep an address left to right in Arabic", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await useLanguage(page, "ar");
  await page.request.delete("/session");
  await page.goto("/#/login");

  const username = page.locator("#username");
  await expect(username).toBeVisible();
  await expect(html(page)).toHaveAttribute("dir", "rtl");
  await expect(username).toHaveAttribute("dir", "ltr");

  // The @ icon is on the field's right, where the interface starts, and the
  // address typed in still starts at the left.
  const field = await box(username);
  const icon = await box(page.locator("login-page .icon-left").first());
  expect(icon.x).toBeGreaterThan(field.x + field.width / 2);
  await username.fill("ada@example.com");
  expect(await username.evaluate((el) => getComputedStyle(el).direction)).toBe("ltr");
});

test("contacts and calendar put their sidebars on the right in Arabic", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await useLanguage(page, "ar");

  for (const [route, pageTag] of [["/#/contacts", "contacts-page"], ["/#/calendar", "calendar-page"]] as const) {
    await page.goto(route);
    const side = page.locator(`${pageTag} alps-sidebar .sidebar`);
    await expect(side).toBeVisible();
    const b = await box(side);
    expect(Math.round(b.x + b.width), pageTag).toBe(1440);
  }
});
