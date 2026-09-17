// Flags (star, read/unread) and the bulk actions that apply them to a
// selection.
//
// Two things are pinned here, and both are about not trusting the screen.
//
// 1. A star from the list is painted before the request has landed
//    (mailbox-page's updateLocalMessageFlags runs first and is rolled back only
//    if the write fails), so a star that never reached the IMAP server looks
//    right for the rest of the session. Each test therefore re-checks its
//    assertion after a reload, which is the only place the local guess and the
//    mailbox have to agree.
//
// 2. Batching. A gesture on several messages is ONE flag or move request for
//    all their UIDs (services/message-operations.ts), which alps turns into one
//    STORE or MOVE on the IMAP session. The failure mode of a batch is PARTIAL
//    application: three rows selected, one changed. So the bulk tests assert on
//    every selected message, never on "something happened".

import type { Page } from "@playwright/test";
import { deliver, expect, login, test, toast } from "./fixtures";

/**
 * The list row carrying a subject. Row state is on the row's own classes:
 * `unread` when \Seen is absent, `starred` when \Flagged is present, which is
 * what styles the row for a user.
 */
function row(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/**
 * The reader pane. It doubles as the bulk-action toolbar: with rows checked,
 * alps-message-reader shows the selection count and its toolbar acts on the
 * whole selection. Scoped so that "Archive" cannot resolve to the sidebar
 * folder of the same name.
 */
function reader(page: Page) {
  return page.locator("alps-message-reader");
}

/**
 * The flag write for the INBOX, answered successfully. Waited for before a
 * reload, because a reload cancels a request still in flight and the star on
 * screen does not wait for it.
 */
function flagWrite(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      new URL(response.url()).pathname === "/mailboxes/INBOX/messages/flag" &&
      response.ok(),
  );
}

test("starring a message from the list survives a reload", async ({ page }) => {
  const subject = `Flags star ${Date.now()}`;
  await deliver({ subject });

  await login(page);
  const message = row(page, subject);
  await expect(message).toBeVisible();
  await expect(message).not.toHaveClass(/starred/);

  const written = flagWrite(page);
  await message.locator(".star-btn").click();
  await expect(message).toHaveClass(/starred/);
  await written;

  // The star is painted before the write answers, so only re-reading the
  // mailbox proves \Flagged was stored.
  await page.reload();
  await expect(message).toHaveClass(/starred/);
  await expect(message.locator(".star-btn")).toHaveClass(/starred/);
});

test("un-starring clears the star for good", async ({ page }) => {
  const subject = `Flags unstar ${Date.now()}`;
  await deliver({ subject });

  await login(page);
  const message = row(page, subject);
  const star = message.locator(".star-btn");

  let written = flagWrite(page);
  await star.click();
  await written;
  // Reload between the two clicks rather than clicking twice in a row: it
  // confirms the add was stored before the remove is sent, so a failure below
  // is unambiguously the REMOVE and not two racing requests.
  await page.reload();
  await expect(message).toHaveClass(/starred/);

  written = flagWrite(page);
  await star.click();
  await expect(message).not.toHaveClass(/starred/);
  await written;

  await page.reload();
  await expect(message).not.toHaveClass(/starred/);
});

test("opening a message marks it read and it stays read", async ({ page }) => {
  const subject = `Flags read ${Date.now()}`;
  await deliver({ subject });

  await login(page);
  const message = row(page, subject);
  // Delivered mail arrives unseen; the row's unread styling is where a user
  // sees that.
  await expect(message).toHaveClass(/unread/);

  await message.locator(".message-subject").click();
  // The row is repainted only once the \Seen write has succeeded.
  await expect(message).not.toHaveClass(/unread/);

  // Drop the open message from the URL BEFORE reloading: a reload with `uid=`
  // still set would re-open the message and mark it read a second time, which
  // would hide a \Seen that never reached the server.
  await page.goto("/#/mailbox/INBOX");
  await page.reload();
  await expect(message).not.toHaveClass(/unread/);
});

test("marking a read message unread puts the row back to unread", async ({ page }) => {
  const subject = `Flags unread ${Date.now()}`;
  await deliver({ subject });

  await login(page);
  const message = row(page, subject);
  await message.locator(".message-subject").click();
  await expect(message).not.toHaveClass(/unread/);

  // The toolbar button is named for what it will DO, so its name flipping to
  // "Mark as unread" is itself evidence the reader saw the message as read.
  await reader(page).getByRole("button", { name: "Mark as unread", exact: true }).click();
  await expect(message).toHaveClass(/unread/);

  // This action closes the reader (mailbox-page drops the uid from the URL),
  // so the reload cannot re-read the message behind the assertion.
  await expect(page).not.toHaveURL(/uid=/);
  await page.reload();
  await expect(message).toHaveClass(/unread/);
});

test("select all checks every row and the reader counts the selection", async ({ page }) => {
  const subject = `Flags selectall ${Date.now()}`;
  await deliver({ subject });

  await login(page);
  await expect(row(page, subject)).toBeVisible();

  await page.locator("alps-message-list input.select-all-checkbox").check();

  // The seeded message is IN the selection: the only row this test knows by
  // name, so it can say something definite before the counting below.
  await expect(row(page, subject).locator("input.message-checkbox")).toBeChecked();

  // The number itself is not knowable: the mailbox is shared and holds
  // whatever the tests before this one left in it. What must hold is that the
  // reader's count IS the number of rows on screen — select-all takes every
  // row (alps-message-list's handleSelectAll walks visibleMessages, which is
  // exactly the set rendered as `.message-item`, expanded thread rows
  // included), not some of them.
  //
  // Both numbers are read together on every attempt, and deliberately not
  // once up front: a count taken while the list is still rendering can
  // disagree with a label read after the click for reasons that are not a bug,
  // and that would be reported as a broken selection. Read as a pair, a
  // disagreement can only mean the two actually disagree, and the mismatch
  // names both numbers.
  await expect
    .poll(async () => {
      const [rows, labels] = await Promise.all([
        page.locator("alps-message-list .message-item").count(),
        // allInnerTexts() rather than innerText(): it yields [] instead of
        // throwing while the reader is not showing a selection yet, and a throw
        // inside poll() is not retried.
        reader(page).getByText(/\d+ messages selected/).allInnerTexts(),
      ]);
      const selected = labels[0]?.match(/(\d+) messages selected/)?.[1];
      return selected !== undefined && Number(selected) === rows
        ? "every row"
        : `${selected ?? "no"} selected of ${rows} rows`;
    })
    .toBe("every row");
});

test("a bulk mark-as-read applies to every selected message", async ({ page }) => {
  const stamp = Date.now();
  const subjects = [`Flags bulk read A ${stamp}`, `Flags bulk read B ${stamp}`, `Flags bulk read C ${stamp}`];
  for (const subject of subjects) await deliver({ subject });

  await login(page);
  const rows = subjects.map((subject) => row(page, subject));
  for (const message of rows) await expect(message).toHaveClass(/unread/);

  for (const message of rows) await message.locator("input.message-checkbox").check();
  await expect(reader(page).getByText("3 messages selected")).toBeVisible();

  // All three are unseen, so the button offers the direction that changes
  // them. If it read "Mark as unread" the selection state would be wrong and
  // the click would clear a \Seen none of them has.
  await reader(page).getByRole("button", { name: "Mark as read", exact: true }).click();
  for (const message of rows) await expect(message).not.toHaveClass(/unread/);

  // The batch is one request for all three UIDs. A partial application would
  // still look complete until the list is re-read from the mailbox.
  await page.reload();
  for (const message of rows) await expect(message).not.toHaveClass(/unread/);
});

test("a bulk archive moves every selected message to Archive", async ({ page }) => {
  const stamp = Date.now();
  const subjects = [`Flags bulk arch A ${stamp}`, `Flags bulk arch B ${stamp}`, `Flags bulk arch C ${stamp}`];
  for (const subject of subjects) await deliver({ subject });

  await login(page);
  const rows = subjects.map((subject) => row(page, subject));
  for (const message of rows) await expect(message).toBeVisible();

  for (const message of rows) await message.locator("input.message-checkbox").check();
  await expect(reader(page).getByText("3 messages selected")).toBeVisible();

  await reader(page).getByRole("button", { name: "Archive", exact: true }).click();

  // A move takes the messages out of the INBOX, so all three must leave its
  // listing.
  for (const message of rows) await expect(message).toHaveCount(0);
  await expect(toast(page, "3 messages moved to Archive")).toBeVisible();

  // …and all three must actually be there. Half a batch would show up as an
  // inbox that emptied and an Archive that is short.
  // The sidebar entry carries the folder's display name as its title.
  await page.locator('alps-folder-list .folder-item[title="Archive"]').click();
  await expect(page).toHaveURL(/#\/mailbox\/Archive/);
  for (const message of rows) await expect(message).toBeVisible();
});
