// The sidebars, from the keyboard alone.
//
// A folder's or a calendar's menu is display: none until its row is hovered
// or holds the focus, and a control inside display: none is no Tab stop. So
// whether Tab reaches the menu at all is a question of layout and focus order,
// which only a browser answers; the unit tests (sidebar-keyboard.test.ts)
// cover the roles, the keys and the names.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, test } from "./fixtures";

/** Every folder created here carries it, so its litter is recognisable. */
const PREFIX = "e2e-keys-";
const litter = new Set<string>();

test.afterEach(async ({ page }) => {
  // Deepest first, so a folder is never deleted before the ones inside it.
  const names = [...litter].sort((a, b) => b.length - a.length);
  litter.clear();
  for (const name of names) {
    await page.request.delete(`/mailboxes/${encodeURIComponent(encodeURIComponent(name))}`).catch(() => null);
  }
});

/**
 * Whether `target` has the focus, looking into shadow roots as the browser
 * does. False, without waiting, where there is no such element.
 */
function hasFocus(target: Locator): Promise<boolean> {
  return target.evaluateAll((els) => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return els.some((el) => el === active);
  });
}

/** Presses Tab until `target` has the focus, as a keyboard user would. */
async function tabTo(page: Page, target: Locator, what: string, presses = 60): Promise<void> {
  for (let i = 0; i < presses; i++) {
    if (await hasFocus(target)) return;
    await page.keyboard.press("Tab");
  }
  expect(await hasFocus(target), `Tab never reached ${what}`).toBe(true);
}

/** Creates a folder of the user's own, which has a menu, and returns its name. */
async function createFolder(page: Page): Promise<string> {
  const name = `${PREFIX}${Date.now()}`;
  await page.locator('mailbox-page alps-icon-btn[title="Create Folder"]').click();
  const prompt = page.locator("alps-folder-list ui-prompt");
  await prompt.locator("input").fill(name);
  litter.add(name);
  await prompt.getByRole("button", { name: "Create Folder", exact: true }).click();
  await expect(page.locator(`alps-folder-list .folder-item[title="${name}"]`)).toBeVisible();
  return name;
}

test("a folder is opened, and its menu reached, from the keyboard", async ({ page }) => {
  await login(page);
  const name = await createFolder(page);
  const row = page.locator(`alps-folder-list .folder-item[title="${name}"]`);

  // From the Compose button, through the folders, to the new one.
  await page.locator("alps-folder-list alps-create-button button").first().focus();
  const folder = row.getByRole("button", { name, exact: true });
  await tabTo(page, folder, `the ${name} folder`);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`#/mailbox/${name}`));
  await expect(folder).toHaveAttribute("aria-current", "true");

  // The next stop is the folder's menu, though nothing hovers the row.
  await page.keyboard.press("Tab");
  const menu = row.getByRole("button", { name: "More options" });
  expect(await hasFocus(menu), "Tab from the folder reaches its menu").toBe(true);
  await page.keyboard.press("Enter");
  await expect(row.locator("button.dropdown-item").filter({ hasText: "Rename" })).toBeVisible();
  await page.keyboard.press("Escape");
});

/**
 * A folder of the user's own with a folder inside it and an unread message
 * in it, so that its row has an expander, a menu and an unread count.
 */
async function createParentFolder(page: Page): Promise<string> {
  const stamp = Date.now();
  const name = `${PREFIX}${stamp}`;
  const subject = `Keys filed ${stamp}`;
  await deliver({ subject });
  const headers = { Origin: new URL(page.url()).origin };
  for (const folder of [name, `${name}/${PREFIX}child-${stamp}`]) {
    const created = await page.request.post("/mailboxes", { headers, form: { name: folder } });
    expect(created.ok()).toBe(true);
    litter.add(folder);
  }
  const listing = await page.request.get("/mailboxes/INBOX?page=0");
  const body = (await listing.json()) as { Messages?: { UID: string; Envelope?: { Subject?: string } }[] | null };
  const uids = (body.Messages ?? []).filter((m) => m.Envelope?.Subject === subject).map((m) => String(m.UID));
  expect(uids).toHaveLength(1);
  const moved = await page.request.put("/mailboxes/INBOX/messages/move", {
    headers: { ...headers, "Content-Type": "application/json" },
    data: { uids, to: name },
  });
  expect(moved.ok()).toBe(true);
  // The sidebar read its folders before these existed.
  await page.reload();
  return name;
}

test("a folder opened or expanded with the mouse leaves its row as it was, and the arrow keys to the list", async ({ page }) => {
  const subject = `Keys ${Date.now()}`;
  await deliver({ subject });
  await login(page);
  const name = await createParentFolder(page);
  const row = page.locator(`alps-folder-list .folder-item[title="${name}"]`);
  await expect(row.locator(".folder-badge")).toHaveText("1");

  // A click on the expander puts the focus on its button. Once the pointer
  // has gone, the row shows its unread count again, and no menu.
  await row.locator("alps-icon-btn.folder-toggle-btn").click();
  await expect(page.locator(`alps-folder-list .folder-item[title^="${PREFIX}child-"]`)).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(row.locator(".folder-actions")).toBeHidden();
  await expect(row.locator(".folder-badge")).toBeVisible();

  // The click puts the focus on the folder's name, but draws no focus ring
  // and shows no menu once the pointer has gone.
  await row.getByRole("button", { name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#/mailbox/${name}`));
  await page.mouse.move(0, 0);
  await expect(row.locator(".folder-actions")).toBeHidden();

  // The list takes the arrow keys from a folder's name, as it does from the page.
  await page.locator("alps-folder-list").getByRole("button", { name: "Inbox", exact: true }).click();
  await expect(page.locator("alps-message-list .message-item").filter({ hasText: subject })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("alps-message-list .message-item.focused")).toHaveCount(1);
});

test("a calendar is hidden and shown, its menu reached, and a day picked, from the keyboard", async ({ page }) => {
  await login(page);
  await page.goto("/#/calendar/month/2026-06");
  const sidebar = page.locator("calendar-page .sidebar-content");
  const calendar = sidebar.locator(".calendar-item:not(.tasks-toggle)").first();
  const checkbox = calendar.getByRole("checkbox");
  await expect(calendar).toBeVisible();

  await page.locator("calendar-page alps-create-button button").first().focus();
  await tabTo(page, checkbox, "the first calendar");
  await expect(checkbox).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Space");
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
  await page.keyboard.press("Space");
  await expect(checkbox).toHaveAttribute("aria-checked", "true");

  await page.keyboard.press("Tab");
  expect(await hasFocus(calendar.getByRole("button", { name: "More options" })), "Tab from the calendar reaches its menu").toBe(true);

  // The mini calendar is one Tab stop, on the day on screen; the arrows move
  // from day to day, and Enter opens the day.
  const mini = page.locator("alps-sidebar-calendar calendar-mini-month");
  const day = mini.getByRole("button", { name: "Monday, June 1, 2026" });
  await tabTo(page, day, "the mini calendar");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  const picked = mini.getByRole("button", { name: "Tuesday, June 9, 2026" });
  expect(await hasFocus(picked), "the arrows move to 9 June").toBe(true);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/calendar\/day\/2026-06-09/);

  // June's grid ends with the first days of July. Opening one turns the mini
  // calendar to July, and the focus stays on the day opened.
  for (const key of ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowRight"]) await page.keyboard.press(key);
  const july = mini.getByRole("button", { name: "Wednesday, July 1, 2026" });
  expect(await hasFocus(july), "the arrows move to 1 July").toBe(true);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/calendar\/day\/2026-07-01/);
  await expect(page.locator("alps-sidebar-calendar .mini-header span")).toHaveText("July 2026");
  await expect.poll(() => hasFocus(july), { message: "the focus stays on 1 July" }).toBe(true);
});

test("a settings category is opened from the keyboard", async ({ page }) => {
  await login(page);
  await page.goto("/#/settings/general");
  const sidebar = page.locator("settings-window nav.sections");
  const general = sidebar.getByRole("button", { name: "General", exact: true });
  await expect(general).toHaveAttribute("aria-current", "true");

  // From the category the window opens on, Tab reaches the others; Enter
  // opens one.
  const appearance = sidebar.getByRole("button", { name: "Appearance", exact: true });
  await tabTo(page, appearance, "the Appearance category");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/settings\/appearance$/);
  await expect(appearance).toHaveAttribute("aria-current", "true");
  await expect(general).not.toHaveAttribute("aria-current", "true");

  // The next category is the next stop, and Space opens it.
  await page.keyboard.press("Tab");
  const localization = sidebar.getByRole("button", { name: "Localization", exact: true });
  expect(await hasFocus(localization), "Tab from Appearance reaches Localization").toBe(true);
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/#\/settings\/localization$/);
});
