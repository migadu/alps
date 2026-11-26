import type { Page } from "@playwright/test";
import { deliver, expect, login, test, toast } from "./fixtures";

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const help = (page: Page) => page.locator("keyboard-shortcuts-dialog");
const accountMenu = (page: Page) => page.locator("user-profile-menu");
const accountTrigger = (page: Page) => accountMenu(page).locator('alps-icon-btn[slot="trigger"] button');
const helpEntry = (page: Page) => accountMenu(page).getByRole("button", { name: "Keyboard shortcuts", exact: true });

async function openFromAccountMenu(page: Page) {
  const trigger = accountTrigger(page);
  await trigger.click();
  await expect(helpEntry(page)).toBeVisible();
  await helpEntry(page).click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(help(page).getByRole("dialog", { name: "Keyboard shortcuts", exact: true })).toBeVisible();
  return trigger;
}
const enabled = (page: Page) => help(page).getByRole("checkbox", { name: "Enable character shortcuts", exact: true });
const row = (page: Page, subject: string) => page.locator("alps-message-list .message-item").filter({ hasText: subject });

function written(page: Page, action: "flag" | "move", mailbox = "INBOX") {
  return page.waitForResponse(response =>
    response.request().method() === "PUT"
    && new URL(response.url()).pathname === `/mailboxes/${mailbox}/messages/${action}` && response.ok());
}

async function flagsIn(page: Page, mailbox: string, subject: string): Promise<string[] | null> {
  const response = await page.request.get(`/mailboxes/${mailbox}?page=0&refresh=true`);
  expect(response.ok()).toBe(true);
  const data = await response.json() as { Messages?: { Envelope?: { Subject?: string }; Flags?: string[] }[] };
  return data.Messages?.find(message => message.Envelope?.Subject === subject)?.Flags ?? null;
}

test("question mark opens a modal reference, contains focus and returns it on Escape", async ({ page }) => {
  const subject = `Shortcut modal ${unique()}`;
  await deliver({ subject });
  await login(page);
  const message = row(page, subject);
  await message.locator("input.message-checkbox").check();
  await expect(message).toHaveClass(/unread/);

  const trigger = accountTrigger(page);
  await expect(page.locator("alps-header button.shortcuts-help")).toHaveCount(0);
  await trigger.focus();
  await page.keyboard.press("Shift+Slash");
  const dialog = help(page).getByRole("dialog", { name: "Keyboard shortcuts", exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element => element.matches(":modal"))).toBe(true);
  await page.screenshot({ path: test.info().outputPath("shortcut-help.png") });
  const close = help(page).getByRole("button", { name: "Close", exact: true });
  await expect(enabled(page)).toBeFocused();

  // Tab visits both controls through their shadow slots. The native modal
  // makes page controls inert; the browser chrome remains reachable.
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(enabled(page)).toBeFocused();
  expect(await trigger.evaluate(element => {
    element.focus();
    return element.matches(":focus");
  })).toBe(false);
  await expect(enabled(page)).toBeFocused();

  // Selected unread mail gives these keys real operands behind the modal.
  await close.focus();
  await page.keyboard.press("q");
  await page.keyboard.press("z");
  await page.keyboard.press("Shift+Slash");
  await expect(help(page)).toHaveCount(1);
  await expect(message).toHaveClass(/unread/);
  await page.keyboard.press("Escape");
  await expect(help(page)).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(message.locator("input.message-checkbox")).toBeChecked();
  expect(await flagsIn(page, "INBOX", subject)).not.toContain("\\Seen");
});

test("character shortcuts can be disabled across reloads and help stays clickable", async ({ page }) => {
  const subject = `Shortcut disabled ${unique()}`;
  await deliver({ subject });
  await login(page);
  const settings = await page.request.get("/settings");
  const original = ((await settings.json()).Settings?.ui?.keyboardShortcuts ?? true) as boolean;
  try {
    await openFromAccountMenu(page);
    const saved = page.waitForResponse(response => response.request().method() === "PUT"
      && new URL(response.url()).pathname === "/settings" && response.ok());
    await enabled(page).uncheck();
    await saved;
    await help(page).getByRole("button", { name: "Close", exact: true }).click();
    await page.reload();
    await expect(row(page, subject)).toBeVisible();
    await row(page, subject).locator("input.message-checkbox").check();
    await page.locator("alps-message-list .list-content").focus();

    const actions: string[] = [];
    page.on("request", request => {
      if (/\/messages\/(flag|move)$/.test(new URL(request.url()).pathname)) actions.push(request.url());
    });
    await page.keyboard.press("q");
    await page.keyboard.press("z");
    await page.keyboard.press("Shift+Slash");
    await expect(help(page)).toHaveCount(0);
    await expect(row(page, subject)).toHaveClass(/unread/);

    await openFromAccountMenu(page);
    await expect(enabled(page)).not.toBeChecked();
    expect(actions).toEqual([]);
    expect(await flagsIn(page, "INBOX", subject)).not.toContain("\\Seen");
  } finally {
    // The account is shared by the suite: restore its effective preference.
    const response = await page.request.put("/settings", {
      headers: { Origin: new URL(page.url()).origin }, data: { ui: { keyboardShortcuts: original } },
    });
    expect(response.ok()).toBe(true);
  }
});

test("the help dialog fits a short viewport and backdrop dismissal returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 320 });
  await login(page);
  const trigger = await openFromAccountMenu(page);
  await expect(enabled(page)).toBeFocused();
  await expect(enabled(page)).toBeInViewport();
  await expect(help(page).getByRole("heading", { name: "Keyboard shortcuts", exact: true })).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath("shortcut-help-short.png") });
  // The card leaves at least 16px at the viewport edges.
  await page.mouse.click(4, 4);
  await expect(help(page)).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

for (const { layout, width, height } of [
  { layout: "desktop", width: 1280, height: 720 },
  { layout: "mobile", width: 390, height: 844 },
]) {
  test(`the ${layout} account menu opens shortcut help with the keyboard and restores focus`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await login(page);
    await expect(page.locator("alps-header button.shortcuts-help")).toHaveCount(0);
    const trigger = accountTrigger(page);
    const entry = helpEntry(page);
    await expect(entry).toBeHidden();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(entry).toBeVisible();
    await expect(entry.locator("kbd")).toHaveText("?");
    await expect(entry).toHaveAccessibleName("Keyboard shortcuts");
    expect(await entry.evaluate(element => element.previousElementSibling?.textContent?.trim())).toBe("Settings");
    await page.screenshot({ path: test.info().outputPath(`shortcut-account-menu-${layout}.png`) });

    // Walk the actual menu with arrows; mobile also contains the app links.
    const items = await accountMenu(page).locator(".dropdown-item").count();
    for (let i = 0; i < items; i++) {
      await page.keyboard.press("ArrowDown");
      if (await entry.evaluate(element => element.matches(":focus"))) break;
    }
    await expect(entry).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(entry).toBeHidden();
    await expect(help(page).getByRole("dialog", { name: "Keyboard shortcuts", exact: true })).toBeVisible();
    await expect(enabled(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(help(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test("q marks every selected message read and z archives with Undo", async ({ page }) => {
  const stamp = unique();
  const subjects = [`Shortcut actions A ${stamp}`, `Shortcut actions B ${stamp}`];
  for (const subject of subjects) await deliver({ subject });
  await login(page);
  const messages = subjects.map(subject => row(page, subject));
  for (const message of messages) {
    await expect(message).toHaveClass(/unread/);
    await message.locator("input.message-checkbox").check();
  }
  let flagged = written(page, "flag");
  await page.keyboard.press("q");
  await flagged;
  for (const message of messages) await expect(message).not.toHaveClass(/unread/);
  // q has one direction, including over an already-read selection.
  flagged = written(page, "flag");
  await page.keyboard.press("q");
  await flagged;
  await page.reload();
  for (const message of messages) {
    await expect(message).not.toHaveClass(/unread/);
    await message.locator("input.message-checkbox").check();
  }
  const moved = written(page, "move");
  await page.keyboard.press("z");
  await moved;
  for (const message of messages) await expect(message).toHaveCount(0);
  const notice = toast(page, "2 messages moved to Archive");
  await expect(notice).toBeVisible();
  for (const subject of subjects) expect(await flagsIn(page, "Archive", subject)).toContain("\\Seen");
  await notice.getByRole("button", { name: "Undo", exact: true }).click();
  for (const message of messages) await expect(message).toBeVisible();
  for (const subject of subjects) {
    expect(await flagsIn(page, "Archive", subject)).toBeNull();
    expect(await flagsIn(page, "INBOX", subject)).toContain("\\Seen");
  }
});

test("typing q, z and question marks in search and a composer keeps the mailbox intact", async ({ page }) => {
  const subject = `Shortcut typing ${unique()}`;
  await deliver({ subject });
  await login(page);
  const message = row(page, subject);
  await message.locator("input.message-checkbox").check();
  const search = page.locator("app-header alps-input input").first();
  await search.pressSequentially("qz?");
  await expect(search).toHaveValue("qz?");
  await expect(help(page)).toHaveCount(0);
  await expect(message).toHaveClass(/unread/);
  await search.fill("");

  await page.locator("alps-folder-list alps-create-button").click();
  const composer = page.locator("alps-floating-composer");
  try {
    const editor = composer.locator(".ProseMirror");
    await expect(editor).toBeFocused();
    await page.keyboard.type("qz?");
    await expect(editor).toContainText("qz?");
    await expect(help(page)).toHaveCount(0);
    await expect(message).toHaveClass(/unread/);
    expect(await flagsIn(page, "INBOX", subject)).not.toContain("\\Seen");
  } finally {
    await composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true }).click();
    const confirm = composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true });
    await expect(confirm).toBeVisible();
    await confirm.click();
    await expect(composer).toHaveCount(0);
  }
});

test("mail actions keep the cursor on its row and choose a neighbour when the last row is archived", async ({ page }) => {
  const stamp = unique();
  const mailbox = `e2e-shortcuts-${stamp}`;
  const older = `Shortcut cursor older ${stamp}`;
  const newer = `Shortcut cursor newer ${stamp}`;
  await login(page);
  const origin = { Origin: new URL(page.url()).origin };
  const created = await page.request.post("/mailboxes", { headers: origin, form: { name: mailbox } });
  expect(created.ok()).toBe(true);
  try {
    await deliver({ subject: older, mailbox, date: new Date("2026-09-01T10:00:00Z").toUTCString() });
    await deliver({ subject: newer, mailbox, date: new Date("2026-09-02T10:00:00Z").toUTCString() });
    await page.goto(`/#/mailbox/${mailbox}`);
    const oldRow = row(page, older);
    const newRow = row(page, newer);
    await expect(page.locator("alps-message-list .message-item")).toHaveCount(2);
    await newRow.locator(".message-subject").click();
    await expect(page.locator("alps-message-reader pre.reader-preformatted")).toContainText("Message body.");
    await page.keyboard.press("ArrowDown");
    await expect(oldRow).toHaveClass(/focused/);

    const flagged = written(page, "flag", mailbox);
    await page.keyboard.press("q");
    await flagged;
    await expect(oldRow).not.toHaveClass(/unread/);
    await expect(oldRow).toHaveClass(/focused/);

    const moved = written(page, "move", mailbox);
    await page.keyboard.press("z");
    await moved;
    await expect(oldRow).toHaveCount(0);
    await expect(newRow).toHaveClass(/focused/);
    const notice = toast(page, "Message moved to Archive");
    await expect(notice).toBeVisible();
    await notice.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(oldRow).toBeVisible();
  } finally {
    await page.goto("/#/mailbox/INBOX");
    await expect(page.locator("alps-message-list")).toBeVisible();
    const removed = await page.request.delete(`/mailboxes/${mailbox}`, { headers: origin });
    expect(removed.ok()).toBe(true);
  }
});
