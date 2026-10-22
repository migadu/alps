// The check for new mail, against a real IMAP server.
//
// alps keeps the pages of a folder it has listed and answers from them while
// the folder is unchanged. Unchanged meant the same message and unread counts,
// and a message that arrives as another is removed elsewhere leaves both as
// they were: the check then found nothing new, and the list went on without
// the arrival until the cache expired.

import type { Browser, Page } from "@playwright/test";
import { deliver, expect, login, signIn, test } from "./fixtures";

/** A row in the message list — never the copy of the subject the reader shows. */
function row(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/**
 * Another browser, signed in to the same account with a session of its own,
 * and so an IMAP connection of its own: another client, as far as the first
 * session can tell. Closing it signs it out.
 */
async function anotherBrowser(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await signIn(page);
  return {
    page,
    close: async () => {
      await page.goto("about:blank");
      await page.request.delete("/session");
      await context.close();
    },
  };
}

/** Removes the message with this subject from the Inbox for good, as the other client. */
async function removeFromInbox(page: Page, subject: string): Promise<void> {
  const listing = await page.request.get("/mailboxes/INBOX?page=0");
  expect(listing.ok()).toBe(true);
  const body = (await listing.json()) as { Messages?: { UID: string; Envelope?: { Subject?: string } }[] | null };
  const uid = (body.Messages ?? []).find((m) => m.Envelope?.Subject === subject)?.UID;
  expect(uid, `the other client lists ${subject}`).toBeTruthy();
  const removed = await page.request.delete("/mailboxes/INBOX/messages", {
    headers: { Origin: new URL(page.url()).origin },
    data: { uids: [uid] },
  });
  expect(removed.ok()).toBe(true);
}

test("a message that arrives as another is removed elsewhere is found by the check", async ({ page, browser }) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const removed = `Removed elsewhere ${stamp}`;
  const kept = `Kept ${stamp}`;
  const arrival = `Arrival ${stamp}`;
  await deliver({ subject: removed });
  await deliver({ subject: kept });

  await login(page);
  await expect(row(page, kept)).toBeVisible();
  await expect(row(page, removed)).toBeVisible();

  // One unread message fewer, and then one more: the Inbox's message and
  // unread counts are where they were when the list was read.
  const other = await anotherBrowser(browser);
  try {
    await removeFromInbox(other.page, removed);
  } finally {
    await other.close();
  }
  await deliver({ subject: arrival });

  await page.locator("alps-message-list").getByRole("button", { name: "Check for new messages" }).click();
  await expect(row(page, arrival)).toBeVisible();
  await expect(row(page, removed)).toHaveCount(0);
  await expect(row(page, kept)).toBeVisible();
});
