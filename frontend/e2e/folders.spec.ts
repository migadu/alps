// Folders: the sidebar's view of the account's IMAP mailboxes.
//
// Six of them carry a special-use ROLE (INBOX, Drafts, Sent, Archive, Junk,
// Trash — the ones the server creates with every account). alps draws those
// first, in a fixed order, under its own names, and offers no folder verbs on
// them: they belong to the server, which relies on them existing. Everything
// else is the user's, and can be created, renamed and deleted — where deleting
// moves a folder into Trash, and only a folder already in Trash is deleted for
// good. The sidebar is the only place a user meets that model, so it is the
// only place alps can silently contradict it: by offering a verb on a system
// folder, by losing the unread counts, or by claiming a folder was deleted
// when it was not.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, test, toast } from "./fixtures";

/** The six special-use folders, in the fixed order the sidebar renders them,
 * spelled as the UI displays them (INBOX shows as "Inbox"). */
const SYSTEM_FOLDERS = ["Inbox", "Drafts", "Sent", "Archive", "Junk", "Trash"];

/** Every folder created here carries it, so its litter is recognisable. */
const PREFIX = "e2e-folders-";

/**
 * Every name a folder of this test may have ended up under, for teardown.
 *
 * Recorded rather than rediscovered: finding them again would mean listing
 * the mailbox, and a listing is one of the searches the IMAP server rations
 * per minute — a teardown that ran out of them would silently leave its
 * folders behind.
 */
const litter = new Set<string>();

/** A sidebar row. `title` carries the DISPLAYED name, so this is exact where a
 * text match would also hit a folder whose name merely contains another's. A
 * user folder displays the last segment of its name, so a folder moved into
 * Trash keeps its title. */
function folder(page: Page, name: string) {
  return page.locator(`alps-folder-list .folder-item[title="${name}"]`);
}

/** The unread badge is absent (not "0") when there is nothing unread — that is
 * the state this returns 0 for.
 *
 * One page-side read, so a badge that appears or disappears between a `count()`
 * and an `innerText()` cannot be caught half-way, and so this is safe to hand to
 * `expect.poll`. */
async function unread(page: Page, name: string): Promise<number> {
  const badges = await folder(page, name).locator(".folder-badge").allTextContents();
  return badges.length === 0 ? 0 : Number(badges[0].trim());
}

/** The list row carrying a subject, whatever pane state the app is in. */
function row(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/** The server's mailbox names, as the session lists them — the answer to
 * "does this folder exist", which the sidebar only reflects. */
async function mailboxNames(page: Page): Promise<string[] | null> {
  const response = await page.request.get("/mailboxes/INBOX?refresh=true");
  if (!response.ok()) return null;
  const { Mailboxes } = (await response.json()) as { Mailboxes: { Mailbox: string }[] | null };
  return (Mailboxes ?? []).map((m) => m.Mailbox);
}

async function createFolder(page: Page, name: string): Promise<void> {
  // By TOOLTIP, the thing a user reads, rather than by a class that exists for
  // styling.
  await page.locator('mailbox-page alps-icon-btn[title="Create Folder"]').click();
  const prompt = page.locator("alps-folder-list ui-prompt");
  const field = prompt.locator("input");
  await expect(field).toBeVisible();
  await field.fill(name);
  litter.add(name);
  await prompt.getByRole("button", { name: "Create Folder", exact: true }).click();
  await expect(folder(page, name)).toBeVisible();
}

/** Opens a folder's kebab menu. `.folder-actions` is `display: none` until the
 * row is hovered, so the hover is load-bearing here: without it the click would
 * wait for an element the layout never gives a box to. */
async function openFolderMenu(page: Page, name: string, scope = page.locator("alps-folder-list")) {
  const item = scope.locator(`.folder-item[title="${name}"]`);
  await item.hover();
  await item.locator("alps-icon-btn.kebab-btn").click();
  return item;
}

/** A folder menu's entry, by the words on it. */
function menuItem(item: Locator, text: string) {
  return item.locator("button.dropdown-item").filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) });
}

/** Deletes a top-level user folder, which moves it into Trash. */
async function moveFolderToTrash(page: Page, name: string) {
  const item = await openFolderMenu(page, name);
  await menuItem(item, "Delete").click();
  const confirm = page.locator("alps-folder-list ui-confirm");
  await expect(confirm.getByText(`move "${name}" to the Trash`)).toBeVisible();
  litter.add(`Trash/${name}`);
  await confirm.getByRole("button", { name: "Move to Trash", exact: true }).click();
}

/** Opens Trash in the sidebar, which holds the folders deleted into it. The
 * caret is only drawn when Trash has folders inside it. */
async function expandTrash(page: Page) {
  const toggle = folder(page, "Trash").locator("alps-icon-btn.folder-toggle-btn");
  await expect(toggle).toBeVisible();
  await toggle.click();
  return page.locator("alps-folder-list .folder-children");
}

// Teardown, not the happy path: a test that fails half-way must not leave a
// folder behind in a mailbox every other spec in this suite shares — it would
// show up in their sidebars, and in their screenshots, from then on. Names that
// no longer exist are refused, which is fine: this runs outside the page, so a
// refusal reaches no console.
test.afterEach(async ({ page }) => {
  // Deepest first, so a folder is never deleted before the ones inside it.
  const names = [...litter].sort((a, b) => b.length - a.length);
  litter.clear();
  for (const name of names) {
    await page.request.delete(`/mailboxes/${encodeURIComponent(encodeURIComponent(name))}`).catch(() => null);
  }
});

test("the sidebar lists every system folder, in role order", async ({ page }) => {
  await login(page);

  // Trash is last of the six, so waiting on it means the whole set has painted.
  await expect(folder(page, "Trash")).toBeVisible();
  for (const name of SYSTEM_FOLDERS) {
    await expect(folder(page, name)).toBeVisible();
  }

  // The order is the ROLE order, not alphabetical and not the order the server
  // lists them in. User folders are rendered after these, so the first six are
  // the system block however many folders the shared mailbox has accumulated.
  const names = await page.locator("alps-folder-list .folder-item .folder-name").allTextContents();
  expect(names.slice(0, SYSTEM_FOLDERS.length).map((n) => n.trim())).toEqual(SYSTEM_FOLDERS);

  // The inbox is the landing folder, and the sidebar says so.
  await expect(folder(page, "Inbox")).toHaveClass(/\bactive\b/);
});

// fixme: opening an unread message takes the inbox count down by TWO. The
// session's cached status is decremented whenever \Seen is added
// (updateCachedMessageFlags, plugins/base/routes.go), without asking whether
// the message was unread: once when the body is fetched, and again when the
// reader's mark-as-read write lands. With a single unread message the second
// decrement stops at zero and hides; the control message below keeps the count
// above one so it cannot.
test.fixme("unread mail is counted on the inbox, and reading it takes the count down", async ({ page }) => {
  const stamp = Date.now();
  const subject = `Folders unread ${stamp}`;
  await deliver({ subject: `Folders control ${stamp}`, body: "Stays unread, keeping the count above one." });
  await deliver({ subject, body: "Counted while unread." });

  await login(page);
  await expect(row(page, subject)).toBeVisible();
  await expect(folder(page, "Inbox")).toBeVisible();

  // The badge counts UNSEEN, not total — the distinction the whole widget
  // exists for, and the one a naive port gets wrong by wiring up the total.
  //
  // Polled, not read once: the counts and the rows ride the same response but
  // are painted by two different components, so a read taken the moment a row
  // appears can land before the badge exists and see 0 — a flake that says
  // "the count is missing" when it is merely late. The value that satisfied
  // the poll is the one the decrement below is measured against.
  let before = 0;
  await expect
    .poll(
      async () => {
        before = await unread(page, "Inbox");
        return before;
      },
      { message: "the inbox never reported an unread count" },
    )
    .toBeGreaterThanOrEqual(2);

  // The subject, not the row's centre: the row's own centre can land on the
  // star, which stops propagation and never opens anything.
  await row(page, subject).locator(".message-subject").click();
  // The row losing its unread styling is the app telling us the flag write
  // landed; asserting the badge before that would race the request.
  await expect(row(page, subject)).not.toHaveClass(/\bunread\b/);

  // Leaving and re-entering re-lists the folders, so the badge below is an
  // answer from the server rather than whatever the client kept in memory.
  await folder(page, "Archive").click();
  await expect(page).toHaveURL(/#\/mailbox\/Archive/);
  await folder(page, "Inbox").click();
  await expect(page).toHaveURL(/#\/mailbox\/INBOX/);

  // `unread` reports an absent badge as 0, so this covers the "the badge went
  // away entirely" case (before === 1) without a second spelling of it.
  await expect
    .poll(() => unread(page, "Inbox"), {
      message: "reading the message did not take the inbox count down",
    })
    .toBe(before - 1);
});

test("switching folders changes the URL, the selection, and the list", async ({ page }) => {
  const subject = `Folders nav ${Date.now()}`;
  await deliver({ subject, body: "Only ever in the inbox." });

  await login(page);
  await expect(row(page, subject)).toBeVisible();

  await folder(page, "Archive").click();
  // The URL carries the MAILBOX name (Archive), not the displayed one — and the
  // inbox message is not in the archive, so the list genuinely changed rather
  // than the header alone.
  await expect(page).toHaveURL(/#\/mailbox\/Archive/);
  await expect(folder(page, "Archive")).toHaveClass(/\bactive\b/);
  await expect(folder(page, "Inbox")).not.toHaveClass(/\bactive\b/);
  await expect(row(page, subject)).toHaveCount(0);

  await folder(page, "Inbox").click();
  await expect(page).toHaveURL(/#\/mailbox\/INBOX/);
  await expect(folder(page, "Inbox")).toHaveClass(/\bactive\b/);
  await expect(row(page, subject)).toBeVisible();
});

test("a created folder appears under Folders and opens as an empty list", async ({ page }) => {
  const name = `${PREFIX}new-${Date.now()}`;
  await login(page);
  await expect(folder(page, "Trash")).toBeVisible();

  await createFolder(page, name);

  // It must land in the USER block, after the six system folders. A new folder
  // that sorted into the system block would mean the role check fell back to
  // something other than the server's roles.
  const names = await page.locator("alps-folder-list .folder-item .folder-name").allTextContents();
  expect(names.map((n) => n.trim()).indexOf(name)).toBeGreaterThanOrEqual(SYSTEM_FOLDERS.length);

  await folder(page, name).click();
  await expect(page).toHaveURL(new RegExp(`#/mailbox/${name}(\\?|$)`));
  await expect(folder(page, name)).toHaveClass(/\bactive\b/);
  await expect(page.locator("alps-message-list .empty-state")).toHaveText("No messages");

  // Back to the inbox before the test ends: teardown deletes this folder, and a
  // list still pointing at it would re-sync into a 404 that the console-error
  // check in fixtures.ts would report against this test.
  await folder(page, "Inbox").click();
  await expect(page).toHaveURL(/#\/mailbox\/INBOX/);
});

test("system folders offer no rename or delete; a user folder offers both", async ({ page }) => {
  const name = `${PREFIX}menu-${Date.now()}`;
  await login(page);
  await expect(folder(page, "Trash")).toBeVisible();

  // The user folder comes FIRST, as the positive control for the checks below:
  // it proves `.folder-actions` and the kebab are selectors that can match at
  // all. Without it, a renamed class would make the system-folder assertions
  // pass for the wrong reason — an absence is only evidence once the same
  // selector has been seen to find something.
  await createFolder(page, name);
  const mine = await openFolderMenu(page, name);
  await expect(mine.locator(".folder-actions")).toHaveCount(1);
  await expect(menuItem(mine, "Rename")).toBeVisible();
  await expect(menuItem(mine, "Delete")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuItem(mine, "Rename")).toBeHidden();

  // These folders are the server's: it refuses to delete them, and alps itself
  // files mail into them — sent copies, drafts, the delete gesture. So the UI
  // must not offer to rename or delete them — a control that always fails, or
  // that quietly breaks where mail is filed, is worse than none. A system folder
  // carries no folder menu at all, even when hovered, which is where the menu
  // of a user folder appears.
  for (const system of SYSTEM_FOLDERS) {
    const item = folder(page, system);
    await item.hover();
    await expect(item.locator(".folder-actions")).toHaveCount(0);
    await expect(item.locator("alps-icon-btn.kebab-btn")).toHaveCount(0);
  }
});

test("renaming a folder updates the sidebar and offers an undo", async ({ page }) => {
  const name = `${PREFIX}rename-${Date.now()}`;
  const renamed = `${name}-renamed`;
  await login(page);
  await expect(folder(page, "Trash")).toBeVisible();

  await createFolder(page, name);
  const item = await openFolderMenu(page, name);
  await menuItem(item, "Rename").click();

  const prompt = page.locator("alps-folder-list ui-prompt");
  const field = prompt.locator("input");
  // Prefilled with the current name: a rename box that opened empty would read
  // as "name a new folder".
  await expect(field).toHaveValue(name);
  await field.fill(renamed);
  litter.add(renamed);
  await prompt.getByRole("button", { name: "Rename", exact: true }).click();

  await expect(folder(page, renamed)).toBeVisible();
  await expect(folder(page, name)).toHaveCount(0);

  // A rename is worth taking back, and IMAP can simply rename it back, so undo
  // is a real inverse rather than a re-creation.
  const renamedToast = toast(page, "Folder renamed");
  await expect(renamedToast).toContainText("Undo");
  await renamedToast.getByRole("button", { name: "Undo" }).click();

  await expect(folder(page, name)).toBeVisible();
  await expect(folder(page, renamed)).toHaveCount(0);
  const names = await mailboxNames(page);
  expect(names).toContain(name);
  expect(names).not.toContain(renamed);
});

// Deleting a user folder is not immediate: it is moved into Trash, where it can
// still be opened, and only a folder already inside Trash is deleted for good.
// "Gone from the list" is therefore not by itself proof of anything — a moved
// folder is also gone from the top of the list, merely hidden inside the
// collapsed Trash — so these tests look inside Trash, and ask the server.
test("deleting a user folder moves it into the Trash", async ({ page }) => {
  const name = `${PREFIX}trash-${Date.now()}`;
  await login(page);
  await expect(folder(page, "Trash")).toBeVisible();

  await createFolder(page, name);
  await moveFolderToTrash(page, name);

  await expect(toast(page, "Folder moved to Trash")).toBeVisible();
  // Not at the top level any more (Trash is collapsed, so nothing inside it is
  // drawn yet)…
  await expect(folder(page, name)).toHaveCount(0);
  // …but inside Trash, under the same name.
  const inTrash = await expandTrash(page);
  await expect(inTrash.locator(`.folder-item[title="${name}"]`)).toBeVisible();
  const names = await mailboxNames(page);
  expect(names).toContain(`Trash/${name}`);
  expect(names).not.toContain(name);
});

test("a folder deleted into the Trash comes back with undo", async ({ page }) => {
  const name = `${PREFIX}restore-${Date.now()}`;
  await login(page);
  await expect(folder(page, "Trash")).toBeVisible();

  await createFolder(page, name);
  await moveFolderToTrash(page, name);

  const moved = toast(page, "Folder moved to Trash");
  await expect(moved).toContainText("Undo");
  await moved.getByRole("button", { name: "Undo" }).click();

  // Back at the top level, and ONLY there: Trash is collapsed, so the one row
  // this matches is the top-level one, and the server confirms nothing of the
  // same name was left inside Trash.
  await expect(folder(page, name)).toBeVisible();
  await expect(folder(page, name)).toHaveCount(1);
  await expect.poll(() => mailboxNames(page)).toContain(name);
  expect(await mailboxNames(page)).not.toContain(`Trash/${name}`);
});

// FIXME (alps): a folder inside Trash is offered "Move to Trash" again, never
// the permanent delete. folder-list.ts decides with
// `isSelfOrDescendantMailbox(node.fullName, trashName, node.mb?.Delimiter ||
// node.mb?.Delim)`, and the listing carries the delimiter as a NUMBER (the
// rune, 47 for "/"); `rest.startsWith(47)` looks for the text "47", so no
// folder is ever inside Trash and a folder can never be deleted for good.
test.fixme("deleting a folder inside the Trash deletes it for good", async ({ page }) => {
  const name = `${PREFIX}purge-${Date.now()}`;
  await login(page);
  await expect(folder(page, "Trash")).toBeVisible();

  await createFolder(page, name);
  await moveFolderToTrash(page, name);
  const inTrash = await expandTrash(page);
  await expect(inTrash.locator(`.folder-item[title="${name}"]`)).toBeVisible();

  // The second delete is the permanent one, and it says so.
  const item = await openFolderMenu(page, name, inTrash);
  await menuItem(item, "Delete").click();
  const confirm = page.locator("alps-folder-list ui-confirm");
  await expect(confirm.getByText("Delete Folder")).toBeVisible();
  await expect(confirm).toContainText("permanently deleted");
  // Scoped to the dialog and matched by ROLE and name: the destructive button
  // is the one thing here that must never be picked by position or by styling.
  await confirm.getByRole("button", { name: "Delete", exact: true }).click();

  await expect(toast(page, "Folder permanently deleted")).toBeVisible();
  // Trash is still open, so this covers the row inside it as well as the top
  // level — and the server has neither.
  await expect(folder(page, name)).toHaveCount(0);
  const names = await mailboxNames(page);
  expect(names).not.toContain(name);
  expect(names).not.toContain(`Trash/${name}`);
});
