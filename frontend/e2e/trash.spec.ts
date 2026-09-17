// The trash lifecycle.
//
// alps deletes in two tiers, and which one a gesture reaches depends on the
// folder it is taken in, by the folder's special-use ROLE:
//
//   INBOX, Archive, … --delete--> Trash --delete / empty--> gone
//   Junk              ------------delete / empty-----------> gone
//
//   * out of an ordinary folder, a delete is a MOVE into Trash, and the toast
//     that says so can take it back;
//   * inside Trash — and inside Junk, whose contents are discarded rather than
//     kept — a delete is permanent, so it asks first and offers no undo (as
//     does discarding a draft, which is not this file's subject);
//   * emptying is offered in those two folders only, and removes everything
//     in the one on screen.
//
// So every test here asserts on WHERE a gesture left the message, never just
// that a click did something.

import type { Page } from "@playwright/test";
import { deliver, expect, login, test, toast } from "./fixtures";

/** Sidebar entry (its title, which is what a user reads) → the route it opens. */
const JUNK = { title: "Junk", route: "Junk" };
const TRASH = { title: "Trash", route: "Trash" };

/** A row in the message list — never the copy of the subject the reader shows. */
function row(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/** Clicks a folder in the sidebar and waits for the route to be that folder's. */
async function openFolder(page: Page, folder: { title: string; route: string }) {
  await page.locator(`alps-folder-list .folder-item[title="${folder.title}"]`).click();
  await expect(page).toHaveURL(new RegExp(`#/mailbox/${folder.route}(\\?|$)`));
}

/**
 * Opens a message and waits for the reader to be showing that message.
 *
 * The click target is the SUBJECT, deliberately, and never the row itself: the
 * row is a strip of controls that each swallow the click that opens a message
 * (the checkbox column, the thread caret and the star all stop it). A click
 * aimed at the row's centre can land on the star, which silently FLAGS the
 * message and opens nothing; the failure then surfaces much later, as a
 * timeout on whatever the reader was supposed to be showing.
 */
async function openMessage(page: Page, subject: string) {
  await row(page, subject).locator(".message-subject").first().click();
  await expect(page).toHaveURL(/[?&]uid=/);
  await expect(page.locator("alps-message-reader .reader-subject").getByText(subject)).toBeVisible();
}

/** A reader-toolbar control, addressed by the tooltip that names it. */
function readerAction(page: Page, title: string) {
  return page.locator(`alps-message-reader alps-icon-btn[title="${title}"]`);
}

/** The discard banner at the top of Trash and Junk. */
function discardBanner(page: Page) {
  return page.locator("alps-message-list alps-banner").filter({ hasText: "total messages in" });
}

/**
 * Deletes a listed message from an ordinary folder — a move into Trash — and
 * waits for the move to have happened.
 */
async function moveToTrash(page: Page, subject: string) {
  await openMessage(page, subject);
  await readerAction(page, "Delete").click();
  // Gate on the toast before asserting the row is gone: a bare
  // `toHaveCount(0)` here would also pass while the request was still in
  // flight, which is the one state it exists to rule out.
  await expect(toast(page, "Message moved to Trash")).toBeVisible();
  await expect(row(page, subject)).toHaveCount(0);
}

/**
 * Files a listed message in Junk the way a user would: by moving it there
 * with the folder picker.
 */
async function moveToJunk(page: Page, subject: string) {
  await openMessage(page, subject);
  await readerAction(page, "Copy/Move to...").click();
  await page
    .locator("alps-message-reader alps-folder-selector-popup button.folder-item:visible")
    .filter({ hasText: /^\s*Junk\s*$/ })
    .click();
  // The toast names the destination by the folder's own name.
  await expect(toast(page, "Message moved to Junk")).toBeVisible();
  await expect(row(page, subject)).toHaveCount(0);
}

test("deleting a message takes it out of the INBOX", async ({ page }) => {
  const subject = `Trash delete ${Date.now()}`;
  await deliver({ subject });
  await login(page);

  await moveToTrash(page, subject);
  // The reader held that message, so it has nothing left to show.
  await expect(page.locator("alps-message-reader").getByText("Select a message to read")).toBeVisible();
});

// A deleted message has to be somewhere the user can get it back from — that is
// the entire promise of a soft delete.
test("a message deleted from the INBOX is in the Trash", async ({ page }) => {
  const subject = `Trash lands ${Date.now()}`;
  await deliver({ subject });
  await login(page);
  await moveToTrash(page, subject);

  await openFolder(page, TRASH);
  await expect(row(page, subject)).toBeVisible();
  // A trash row is a real message, not a stub — the listing carries the same
  // metadata an ordinary listing does.
  await expect(row(page, subject)).toContainText("Ada Lovelace");
});

test("a message deleted inside Junk is deleted for good, after asking", async ({ page }) => {
  // Many round trips against a real stack; a slow machine is not a defect.
  test.slow();
  const stampNow = Date.now();
  const subject = `Trash junk ${stampNow}`;
  // Something that IS in Trash, so the check at the end that the Junk message
  // is not there looks at a list that has demonstrably loaded.
  const control = `Trash control ${stampNow}`;
  await deliver({ subject });
  await deliver({ subject: control });
  await login(page);
  await moveToJunk(page, subject);
  await moveToTrash(page, control);

  await openFolder(page, JUNK);
  await openMessage(page, subject);
  await readerAction(page, "Delete").click();

  // Junk is not filed into Trash: what is in it was never wanted, so a delete
  // there is the last one, and says so before it happens.
  const confirm = page.locator("mailbox-page ui-confirm");
  await expect(confirm.getByText("Permanently Delete?")).toBeVisible();
  // By role and name: picking the wrong button here destroys mail.
  await confirm.getByRole("button", { name: "Delete Permanently" }).click();

  await expect(toast(page, "Message permanently deleted")).toBeVisible();
  await expect(row(page, subject)).toHaveCount(0);
  await expect(page.locator("alps-message-reader").getByText("Select a message to read")).toBeVisible();

  await openFolder(page, TRASH);
  await expect(row(page, control)).toBeVisible();
  await expect(row(page, subject)).toHaveCount(0);
});

// Taking a delete back is the point of deleting into a folder at all. The toast
// that reports the move carries the undo, and the undo is a move BACK to the
// folder the message was deleted from — not merely out of Trash to anywhere.
test("undoing a delete returns the message to the folder it came from", async ({ page }) => {
  const stampNow = Date.now();
  const subject = `Trash undo ${stampNow}`;
  // A message that goes to Trash and stays there, so the absence asserted
  // there at the end is an answer from a list that has loaded. It is deleted
  // only AFTER the undo, so that the undo clicked is the only one on screen.
  const control = `Trash kept ${stampNow}`;
  await deliver({ subject });
  await deliver({ subject: control });
  await login(page);

  await openMessage(page, subject);
  await readerAction(page, "Delete").click();
  const moved = toast(page, "Message moved to Trash");
  await expect(moved).toBeVisible();
  await expect(row(page, subject)).toHaveCount(0);
  await moved.getByRole("button", { name: "Undo" }).click();
  // The toast is used up by its action — and gone before the next delete puts
  // up a toast with the same words.
  await expect(moved).toHaveCount(0);

  // Back in the INBOX, and open again: the undo follows the message to its new
  // UID rather than leaving the user to find it.
  await expect(row(page, subject)).toBeVisible();
  await expect(page).toHaveURL(/#\/mailbox\/INBOX\?(.*&)?uid=/);
  await expect(page.locator("alps-message-reader .reader-subject").getByText(subject)).toBeVisible();

  // And NOT in Trash: an undo that copied the message back and left the trashed
  // one behind would show it in both places.
  await moveToTrash(page, control);
  await openFolder(page, TRASH);
  await expect(row(page, control)).toBeVisible();
  await expect(row(page, subject)).toHaveCount(0);
});

test("the Trash's empty control is labelled, not keyed", async ({ page }) => {
  const subject = `Trash label ${Date.now()}`;
  await deliver({ subject });
  await login(page);
  await moveToTrash(page, subject);

  await openFolder(page, TRASH);
  await expect(row(page, subject)).toBeVisible();

  // Words, and the RIGHT words: the banner names the folder it would empty and
  // how much is in it, because emptying is decided on exactly that.
  const banner = discardBanner(page);
  await expect(banner).toContainText(/\d+ total messages in Trash/);
  await expect(banner.getByRole("button", { name: "Delete All Now" })).toBeVisible();
  // An unresolved key renders as the key.
  await expect(banner).not.toContainText("messageList.");
});

// DESTRUCTIVE — everything below removes EVERY message in the folder, not just
// the one the test seeded, because that is what the gesture means. Two
// consequences this file has to carry explicitly:
//
//  * These must run AFTER every other spec that cares about what is in Trash
//    or Junk, and nothing enforces that. `playwright.config.ts` runs a single
//    worker with `fullyParallel: false`, so specs execute in collection
//    (alphabetical) order, and `trash.spec.ts` merely happens to sort late. A
//    spec sorting after it would find those folders emptied underneath it with
//    no hint as to why. This comment is the hint; such a spec has to seed its
//    own trash.
//  * `.serial` keeps them adjacent and in order, and makes a failure in the
//    first SKIP the second rather than let it assert against folders the first
//    left half-emptied.
//
// Each seeds its own message first, so neither depends on whatever an earlier
// test happened to leave behind.
test.describe.serial("emptying the discard folders", () => {
  test("emptying the Trash empties the Trash", async ({ page }) => {
    const subject = `Trash empty ${Date.now()}`;
    await deliver({ subject });
    await login(page);
    await moveToTrash(page, subject);

    await openFolder(page, TRASH);
    await expect(row(page, subject)).toBeVisible();

    // The banner's control and the confirmation's control share a label, so
    // each is addressed inside the thing that owns it. By role, not by
    // `variant="danger"`: picking the wrong button here permanently deletes
    // mail.
    await discardBanner(page).getByRole("button", { name: "Delete All Now" }).click();
    const confirm = page.locator("alps-message-list ui-confirm");
    await expect(confirm.getByText("Empty Trash")).toBeVisible();
    await confirm.getByRole("button", { name: "Delete All Now" }).click();

    // The end state is the whole folder empty, not merely this row — "No
    // messages" is the observable form of "emptied", and it is a positive
    // assertion, so it cannot pass before the expunge has actually landed.
    await expect(page.locator("alps-message-list .empty-state")).toHaveText("No messages");
    await expect(row(page, subject)).toHaveCount(0);
    // Nothing left to empty, so the offer withdraws itself. Safe as a negative
    // only because the assertion above already proves the folder was re-read.
    await expect(discardBanner(page)).toHaveCount(0);
  });

  test("emptying Junk empties Junk", async ({ page }) => {
    // The same control in the other folder that offers it. Junk is where the
    // bulk of unwanted mail piles up, and the one a user is most likely to
    // clear without reading.
    const subject = `Junk empty ${Date.now()}`;
    await deliver({ subject });
    await login(page);
    await moveToJunk(page, subject);

    await openFolder(page, JUNK);
    await expect(row(page, subject)).toBeVisible();

    await discardBanner(page).getByRole("button", { name: "Delete All Now" }).click();
    const confirm = page.locator("alps-message-list ui-confirm");
    // Names the folder it empties, like the banner that started it.
    await expect(confirm.getByText("Empty Junk")).toBeVisible();
    await confirm.getByRole("button", { name: "Delete All Now" }).click();

    await expect(page.locator("alps-message-list .empty-state")).toHaveText("No messages");
    await expect(row(page, subject)).toHaveCount(0);
    await expect(discardBanner(page)).toHaveCount(0);
  });

  // Emptying is permanent, so the user is told it happened, not left to infer
  // it from an empty list.
  test("emptying a folder says it was emptied", async ({ page }) => {
    const subject = `Trash emptied ${Date.now()}`;
    await deliver({ subject });
    await login(page);
    await moveToTrash(page, subject);

    await openFolder(page, TRASH);
    await expect(row(page, subject)).toBeVisible();
    await discardBanner(page).getByRole("button", { name: "Delete All Now" }).click();
    await page.locator("alps-message-list ui-confirm").getByRole("button", { name: "Delete All Now" }).click();

    await expect(toast(page, "Mailbox emptied successfully.")).toBeVisible();
    await expect(page.locator("alps-message-list .empty-state")).toHaveText("No messages");
  });
});
