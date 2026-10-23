// The Settings window, in the browser.
//
// Settings used to be a page of its own, which unmounted the message being
// read; its Back button then went to the Inbox. It is now a window over the
// page, and what that promises is geometry and stacking, which the jsdom
// suite has no layout to see:
//
//  - two columns side by side in one centred window (the section list and the
//    section);
//  - the page beneath still there, the same message open, and out of reach;
//  - a composer opened before it floating ABOVE the window and taking clicks,
//    as it floated over the page;
//  - Escape and the browser's Back closing onto the message, and a section
//    chosen inside adding no history entry for Back to walk through;
//  - Escape keeping what was being typed: a field that saves as it loses
//    focus is committed before the window closes, and an unsaved auto-reply
//    is asked about first;
//  - on a phone, the whole screen, one column at a time.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, resetSettings, resetSieve, test } from "./fixtures";

const win = (page: Page) => page.locator("settings-window .window-frame");
const sections = (page: Page) => page.locator("settings-window nav.sections");
const content = (page: Page) => page.locator("settings-window .main-view");
const sectionTitle = (page: Page) => page.locator("settings-window .category-title");
const section = (page: Page, name: string) => page.locator("settings-window alps-category-item").filter({ hasText: name });
const closeButton = (page: Page) => page.locator("settings-window .close-btn");
const readerSubject = (page: Page) => page.locator("alps-message-reader > .reader-body > .reader-header > .reader-subject");
const composerOf = (page: Page) => page.locator("alps-floating-composer");

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, "a box on screen").not.toBeNull();
  return box!;
}

/** The custom elements under a point, innermost first, across shadow roots:
 * what a click there would land on. */
function tagsAt(page: Page, x: number, y: number): Promise<string[]> {
  return page.evaluate(([px, py]) => {
    let el: Element | null = document.elementFromPoint(px, py);
    while (el?.shadowRoot) {
      const inner = el.shadowRoot.elementFromPoint(px, py);
      if (!inner || inner === el) break;
      el = inner;
    }
    const tags: string[] = [];
    for (let node: Node | null = el; node; ) {
      if (node instanceof Element && node.localName.includes("-")) tags.push(node.localName);
      node = node.parentNode instanceof ShadowRoot ? node.parentNode.host : node.parentNode;
    }
    return tags;
  }, [x, y]);
}

/** Opens Settings the way every link into it does: by its URL, as a new entry. */
async function openSettings(page: Page, hash: string): Promise<void> {
  await page.evaluate((h) => { window.location.hash = h; }, hash);
  await expect(win(page)).toBeVisible();
}

async function readMessage(page: Page, subject: string): Promise<void> {
  await page.locator("alps-message-list .message-item").filter({ hasText: subject }).locator(".message-subject").click();
  await expect(readerSubject(page)).toContainText(subject);
}

test.afterEach(async ({ page }) => {
  const composer = composerOf(page).first();
  if (!(await composer.locator(".window-frame").isVisible().catch(() => false))) return;
  await composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true }).click({ timeout: 2_000 }).catch(() => {});
  await composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true }).click({ timeout: 2_000 }).catch(() => {});
});

test("opens over the message being read, and Escape closes back onto it", async ({ page }) => {
  const subject = `Settings over a message ${Date.now()}`;
  await deliver({ subject });
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await readMessage(page, subject);
  const reading = page.url();

  await openSettings(page, "#/settings/appearance");
  // One centred window, two columns in a row inside it.
  const frame = await boxOf(win(page));
  expect(Math.round(frame.width)).toBe(960);
  expect(Math.round(frame.x)).toBe(240);
  const [nav, main] = await Promise.all([boxOf(sections(page)), boxOf(content(page))]);
  expect(nav.x + nav.width).toBeLessThanOrEqual(main.x + 1);
  expect(main.x + main.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
  await expect(sectionTitle(page)).toHaveText("Appearance");

  // The page is still there, on the same message, and out of reach: what is
  // over the mailbox's own header is the window's backdrop now.
  await expect(readerSubject(page)).toContainText(subject);
  expect(await tagsAt(page, 40, 40)).toContain("settings-window");
  await expect(page.locator("app-root .route-view[inert]")).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(win(page)).toHaveCount(0);
  expect(page.url()).toBe(reading);
  await expect(readerSubject(page)).toContainText(subject);
  await expect(page.locator("app-root .route-view[inert]")).toHaveCount(0);
});

test("a section chosen inside adds no history, so Back closes the window", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  const mailbox = page.url();

  await openSettings(page, "#/settings");
  await expect(sectionTitle(page)).toHaveText("General");
  await section(page, "Localization").click();
  await expect(page).toHaveURL(/#\/settings\/localization$/);
  await expect(sectionTitle(page)).toHaveText("Localization");

  await page.goBack();
  await expect(win(page)).toHaveCount(0);
  expect(page.url()).toBe(mailbox);
});

test("the Close button closes onto the page it was opened from", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.goto("/#/contacts");
  await expect(page.locator("contacts-page")).toBeVisible();
  const contacts = page.url();

  await openSettings(page, "#/settings/identity");
  await closeButton(page).click();
  await expect(win(page)).toHaveCount(0);
  expect(page.url()).toBe(contacts);
});

test("a composer floats above the window and takes its clicks", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();

  await openSettings(page, "#/settings/identity");
  const box = await boxOf(composer.locator(".window-frame"));
  const under = await tagsAt(page, box.x + box.width / 2, box.y + box.height / 2);
  expect(under).toContain("alps-floating-composer");
  expect(under).not.toContain("settings-window");

  // And it is live: a draft half-written when the user went to fix their
  // signature can be finished without closing Settings.
  const editor = composer.locator(".ProseMirror");
  await editor.click();
  await page.keyboard.type("Still writing.");
  await expect(editor).toContainText("Still writing.");
  await expect(win(page)).toBeVisible();
});

test("on a phone it fills the screen, one column at a time", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openSettings(page, "#/settings");

  const frame = await boxOf(win(page));
  expect(Math.round(frame.width)).toBe(390);
  expect(Math.round(frame.height)).toBe(844);
  await expect(sections(page)).toBeVisible();
  await expect(content(page)).toHaveCount(0);

  await section(page, "Appearance").click();
  await expect(page).toHaveURL(/#\/settings\/appearance$/);
  await expect(sections(page)).toHaveCount(0);
  await expect(sectionTitle(page)).toHaveText("Appearance");

  await page.locator("settings-window .back-to-sections").click();
  await expect(sections(page)).toBeVisible();
  await expect(page).toHaveURL(/#\/settings$/);
});

test("on a phone, the account menu opens Settings, and Close returns to the mail", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const mailbox = page.url();

  await page.locator('user-profile-menu alps-icon-btn[title="Profile options"]').click();
  await page.locator("user-profile-menu").getByRole("button", { name: "Settings", exact: true }).click();
  await expect(win(page)).toBeVisible();
  await expect(sections(page)).toBeVisible();
  expect(Math.round((await boxOf(win(page))).width)).toBe(390);

  await section(page, "Appearance").click();
  await expect(sectionTitle(page)).toHaveText("Appearance");
  // Every control fits the screen: nothing runs off the right edge.
  for (const select of await page.locator("settings-window alps-select").all()) {
    const box = await boxOf(select);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }

  await closeButton(page).click();
  await expect(win(page)).toHaveCount(0);
  expect(page.url()).toBe(mailbox);
});

test("on a phone, Back closes Settings, from a section too", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const mailbox = page.url();

  await openSettings(page, "#/settings");
  await section(page, "Localization").click();
  await expect(page).toHaveURL(/#\/settings\/localization$/);
  await page.goBack();
  await expect(win(page)).toHaveCount(0);
  expect(page.url()).toBe(mailbox);
});

test("Escape keeps the signature being typed", async ({ page }) => {
  // The signature saves as the field loses focus. Escape would remove it with
  // focus still inside, and the change would never be heard.
  const signature = `Sent from the window ${Date.now()}`;
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  try {
    await openSettings(page, "#/settings/identity");
    const field = page.locator("settings-window alps-setting-group textarea");
    await field.click();
    await page.keyboard.type(signature);
    const saved = page.waitForResponse(
      (r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "PUT",
    );
    await page.keyboard.press("Escape");
    await expect(win(page)).toHaveCount(0);
    const put = await saved;
    expect(put.ok()).toBe(true);
    expect(put.request().postData()).toContain(signature);
  } finally {
    // The page leaves first, so nothing of it is still talking when the
    // record is put back.
    await page.goto("about:blank");
    await resetSettings();
  }
});

test("an unsaved auto-reply is asked about before the window closes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  try {
    await openSettings(page, "#/settings/autoreply");
    const body = page.locator("alps-auto-reply-page textarea");
    await body.click();
    await page.keyboard.type("Away until Monday.");

    await page.keyboard.press("Escape");
    const confirm = page.locator("settings-window ui-confirm");
    await expect(confirm.getByRole("button", { name: "Keep editing" })).toBeVisible();
    await confirm.getByRole("button", { name: "Keep editing" }).click();
    await expect(confirm).toHaveCount(0);
    await expect(win(page)).toBeVisible();
    await expect(body).toHaveValue("Away until Monday.");

    // Another section asks the same.
    await section(page, "General").click();
    await expect(confirm.getByRole("button", { name: "Keep editing" })).toBeVisible();
    await confirm.getByRole("button", { name: "Keep editing" }).click();
    await expect(page).toHaveURL(/#\/settings\/autoreply$/);

    await closeButton(page).click();
    await confirm.getByRole("button", { name: "Discard", exact: true }).click();
    await expect(win(page)).toHaveCount(0);
  } finally {
    await resetSieve();
  }
});
