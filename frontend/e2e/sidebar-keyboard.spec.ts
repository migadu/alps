// The sidebars, from the keyboard alone.
//
// A folder's or a calendar's menu is display: none until its row is hovered
// or holds the focus, and a control inside display: none is no Tab stop. So
// whether Tab reaches the menu at all is a question of layout and focus order,
// which only a browser answers; the unit tests (sidebar-keyboard.test.ts)
// cover the roles, the keys and the names.

import type { Locator, Page } from "@playwright/test";
import { allowConsoleErrors, deliver, expect, hasFocus, login, setDocked, tabTo, test } from "./fixtures";

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

/**
 * The collapsed strip, from the keyboard. Its content is inert, so Tab went
 * from Create to the expand button and on, and a folder, a contacts
 * category, a day or a task list was out of reach until the sidebar was
 * expanded for good. Keyboard focus coming into the strip opens the overlay
 * the pointer opens, with every row live.
 */
const STRIP: { name: string; route: string; row: (page: Page) => Locator; opens: RegExp }[] = [
  {
    name: "Mail",
    route: "/#/mailbox/INBOX",
    row: (page) => page.locator("alps-folder-list").getByRole("button", { name: "Sent", exact: true }),
    opens: /#\/mailbox\/Sent/,
  },
  {
    name: "Contacts",
    route: "/#/contacts",
    row: (page) => page.locator("alps-contacts-categories").getByRole("button", { name: "Favorites", exact: true }),
    opens: /#\/contacts\/Favorites/,
  },
  {
    name: "Calendar",
    route: "/#/calendar/month/2026-06",
    row: (page) => page.locator("alps-sidebar-calendar calendar-mini-month").getByRole("button", { name: "Monday, June 1, 2026" }),
    opens: /#\/calendar\/day\/2026-06-01/,
  },
  {
    name: "Tasks",
    route: "/#/tasks/all",
    row: (page) => page.locator('tasks-page .smart-list[data-list="today"]'),
    opens: /#\/tasks\/today/,
  },
];

/** The page's desktop sidebar, and the strip's two live controls. */
function stripOf(page: Page) {
  const sidebar = page.locator("alps-sidebar.desktop-sidebar").first();
  return { sidebar, create: sidebar.locator("alps-create-button button"), expand: sidebar.locator(".collapse-btn button") };
}

/** Whether the focus is anywhere in `sidebar`, its own controls or the page's content in it. */
function focusIn(sidebar: Locator): Promise<boolean> {
  return sidebar.evaluate((el) => {
    let node: Node | null = document.activeElement;
    while ((node as Element | null)?.shadowRoot?.activeElement) node = (node as Element).shadowRoot!.activeElement;
    for (; node; node = node.parentNode ?? (node instanceof ShadowRoot ? node.host : null)) if (node === el) return true;
    return false;
  });
}

/** Tabs from the search field above into the sidebar, as a keyboard user comes to it. */
async function tabIntoStrip(page: Page): Promise<void> {
  await page.locator("app-header alps-input input").focus();
  await tabTo(page, stripOf(page).create, "Create");
}

test("the collapsed sidebar is reached from the keyboard on every page, and a choice there closes it", async ({ page }) => {
  // Moving between four pages in a few seconds aborts the previous page's fetches.
  allowConsoleErrors(page, /Failed to fetch|aborted/i);
  await login(page);
  await setDocked(page, false);
  try {
    for (const entry of STRIP) {
      await page.goto(entry.route);
      const { sidebar, expand } = stripOf(page);
      const row = entry.row(page);
      await expect(row).toBeAttached();
      await expect(sidebar).not.toHaveAttribute("peeking");

      await tabIntoStrip(page);
      await expect(sidebar, `${entry.name}: the keyboard opens the overlay`).toHaveAttribute("peeking", "");
      await tabTo(page, row, `${entry.name}'s row`);
      await expect(row).toBeVisible();

      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(entry.opens);
      await expect(sidebar, `${entry.name}: the choice closes the overlay`).not.toHaveAttribute("peeking");
      // Not dropped on the page: the next Tab goes on from the sidebar.
      expect(await hasFocus(expand), `${entry.name}: the focus waits on the expand button`).toBe(true);
    }
  } finally {
    // Collapsed is a saved preference: leave it docked, as every other spec
    // expects, whether or not the assertions above held.
    await page.goto("/#/mailbox/INBOX");
    await setDocked(page, true);
  }
});

test("the overlay opened from the keyboard closes on Escape and when the focus leaves it, either way", async ({ page }) => {
  await login(page);
  await setDocked(page, false);
  try {
    const { sidebar, create, expand } = stripOf(page);
    const inbox = page.locator("alps-folder-list").getByRole("button", { name: "Inbox", exact: true });

    await tabIntoStrip(page);
    await tabTo(page, inbox, "the Inbox");
    await page.keyboard.press("Escape");
    await expect(sidebar).not.toHaveAttribute("peeking");
    // The Inbox went inert under the focus; it moved to the expand button.
    expect(await hasFocus(expand), "Escape leaves the focus on the expand button").toBe(true);

    // Back to Compose, the strip's other live control, past the inert rows.
    // That is no entry: the overlay stays shut.
    await page.keyboard.press("Shift+Tab");
    expect(await hasFocus(create), "Shift+Tab from the expand button reaches Compose").toBe(true);
    await expect(sidebar).not.toHaveAttribute("peeking");

    // Out and in again opens it; out backwards closes it.
    await page.keyboard.press("Shift+Tab");
    expect(await focusIn(sidebar)).toBe(false);
    await page.keyboard.press("Tab");
    await expect(sidebar).toHaveAttribute("peeking", "");
    await page.keyboard.press("Shift+Tab");
    await expect(sidebar).not.toHaveAttribute("peeking");

    // Out forwards, past the footer's last button, closes it too.
    await page.keyboard.press("Tab");
    await expect(sidebar).toHaveAttribute("peeking", "");
    await tabTo(page, page.locator('mailbox-page alps-icon-btn[title="Create Folder"] button'), "Create Folder");
    await page.keyboard.press("Tab");
    expect(await focusIn(sidebar), "Tab leaves the sidebar").toBe(false);
    await expect(sidebar).not.toHaveAttribute("peeking");
  } finally {
    await setDocked(page, true);
  }
});

test("a click on the strip's Create button opens no overlay of its own", async ({ page }) => {
  await login(page);
  await setDocked(page, false);
  try {
    await page.goto("/#/calendar/month/2026-06");
    const { sidebar, create } = stripOf(page);
    await expect(create).toBeVisible();
    // How long after the pointer came onto the sidebar the overlay opened.
    // The pointer's own overlay opens once it has rested there 300ms; the
    // focus the click leaves on the button must not open one sooner.
    await sidebar.evaluate((el) => {
      const w = window as unknown as { entered: number; peekedAfter: number | null };
      w.entered = 0;
      w.peekedAfter = null;
      el.addEventListener("mouseenter", () => { w.entered = performance.now(); });
      new MutationObserver(() => {
        if (el.hasAttribute("peeking") && w.peekedAfter === null) w.peekedAfter = performance.now() - w.entered;
      }).observe(el, { attributeFilter: ["peeking"] });
    });
    await create.click();
    const modal = page.locator("calendar-page calendar-event-modal");
    await expect(modal.getByLabel("Summary", { exact: true })).toBeVisible();
    const peekedAfter = await page.evaluate(() => (window as unknown as { peekedAfter: number | null }).peekedAfter);
    expect(peekedAfter === null || peekedAfter >= 250, `the overlay opened ${peekedAfter}ms after the pointer came`).toBe(true);
    await page.keyboard.press("Escape");
    await expect(modal.getByLabel("Summary", { exact: true })).toBeHidden();
  } finally {
    await page.goto("/#/mailbox/INBOX");
    await setDocked(page, true);
  }
});
