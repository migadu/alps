// Flags changed in another client, against a real IMAP server.
//
// alps keeps the pages of a folder it has listed and answers from them while
// the folder is unchanged. Unchanged meant the same message and unread
// counts, and a star set in another client changes neither: the check found
// nothing, and the list showed the message without its star until the cache
// expired. With [server] condstore on, which scripts/e2e.sh sets, the check
// also compares the folder's change number (CONDSTORE's HIGHESTMODSEQ), and
// the page is patched with the flags that changed.

import type { Browser, Page } from "@playwright/test";
import { deliver, expect, login, signIn, test } from "./fixtures";

/** The list row carrying a subject: `starred` and `unread` are on its classes. */
function row(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/**
 * Sets flags on the Inbox message with this subject from another browser,
 * signed in with a session, and so an IMAP connection, of its own: another
 * client, as far as the first session can tell.
 */
async function flagElsewhere(browser: Browser, subject: string, flags: string[], action: "add" | "remove") {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const page = await context.newPage();
    await signIn(page);
    const listing = await page.request.get("/mailboxes/INBOX?page=0&refresh=true");
    expect(listing.ok()).toBe(true);
    const body = (await listing.json()) as { Messages?: { UID: string; Envelope?: { Subject?: string } }[] | null };
    const uid = (body.Messages ?? []).find((m) => m.Envelope?.Subject === subject)?.UID;
    expect(uid, `the other client lists ${subject}`).toBeTruthy();
    const flagged = await page.request.put("/mailboxes/INBOX/messages/flag", {
      headers: { Origin: new URL(page.url()).origin, "Content-Type": "application/json" },
      data: { uids: [uid], flags, action },
    });
    expect(flagged.ok(), "the other client's flag write").toBe(true);
    await page.goto("about:blank");
    await page.request.delete("/session");
  } finally {
    await context.close();
  }
}

async function checkForNewMessages(page: Page) {
  await page.locator("alps-message-list").getByRole("button", { name: "Check for new messages" }).click();
}

test("a star set in another client shows after the check", async ({ page, browser }) => {
  const subject = `Starred elsewhere ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await deliver({ subject });

  await login(page);
  await expect(row(page, subject)).toBeVisible();
  await expect(row(page, subject)).not.toHaveClass(/starred/);

  // Neither the message count nor the unread count moves.
  await flagElsewhere(browser, subject, ["\\Flagged"], "add");

  await checkForNewMessages(page);
  await expect(row(page, subject)).toHaveClass(/starred/);
  await expect(row(page, subject)).toHaveClass(/unread/);
});

test("a star taken off in another client goes after the check", async ({ page, browser }) => {
  const subject = `Unstarred elsewhere ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await deliver({ subject });
  await flagElsewhere(browser, subject, ["\\Flagged"], "add");

  await login(page);
  await expect(row(page, subject)).toHaveClass(/starred/);

  await flagElsewhere(browser, subject, ["\\Flagged"], "remove");

  await checkForNewMessages(page);
  await expect(row(page, subject)).not.toHaveClass(/starred/);
});
