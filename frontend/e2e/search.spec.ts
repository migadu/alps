// Search, and getting back out of it.
//
// Three things share ONE box and one `q` in the URL: the text query, and the
// `is:starred` / `is:unread` filters behind the list's two toggle buttons. All
// three go to the server as the listing's `query`, where alps turns them into
// an IMAP SEARCH (provider/imap/search.go: TEXT for words, FLAGGED and UNSEEN
// for the filters). Both kinds are covered here, and so is clearing — a user
// who cannot get back to the unfiltered list is stuck looking at one message.

import type { Page } from "@playwright/test";
import { deliver, expect, login, test, toast } from "./fixtures";

/**
 * A word that exists nowhere else in the mailbox.
 *
 * The mailbox is shared with every other spec, so a fixed word like "needle"
 * would match mail this test never delivered. Letters and digits only: the
 * IMAP server finds a body word through a full-text index that splits on
 * everything else. Fixed width, because a subject is matched as a substring,
 * and no token can then be part of another.
 */
function token(): string {
  return `zq${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6).padEnd(4, "x")}`;
}

/** One row of the message list, addressed the way a user finds it: by subject. */
function listRow(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/** The header search box. Its placeholder is the current folder's NAME, so it
 * cannot be addressed by placeholder text. */
function searchBox(page: Page) {
  return page.locator("app-header alps-input input");
}

/**
 * The banner naming the active query. alps-message-list can draw one other
 * banner, the "Delete All Now" strip, but only in Trash and Junk, so in the
 * INBOX these tests run in this is exactly one element or none — including for
 * the `toHaveCount(0)` assertions.
 */
function searchBanner(page: Page) {
  return page.locator("alps-message-list alps-banner");
}

/** The toggle buttons in the list's toolbar, named by their titles. */
function listButton(page: Page, name: string) {
  return page.locator("alps-message-list").getByRole("button", { name, exact: true });
}

/** Waits for the IMAP server to actually hold a flag, not the optimistic paint. */
function flagWrite(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      new URL(response.url()).pathname === "/mailboxes/INBOX/messages/flag" &&
      response.ok(),
  );
}

/** The INBOX listing filtered by `query`, answered successfully. */
function listing(page: Page, query: string) {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/mailboxes/INBOX" && url.searchParams.get("query") === query && response.ok();
  });
}

/** Types a query and submits it, waiting for the answer the list is painted from. */
async function searchFor(page: Page, term: string): Promise<void> {
  const box = searchBox(page);
  await box.fill(term);
  const answered = listing(page, term);
  await box.press("Enter");
  await answered;
}

/**
 * Waits until the IMAP server's search can see a term.
 *
 * A subject is matched as it is stored, but a body word is found through a
 * full-text index that the server builds in the background, on a timer, after
 * delivery. So a message is listed and counted well before its body is
 * searchable, and NOTHING in the UI re-runs a search when the index catches up.
 * Without this the tests below would be measuring that timer rather than
 * search.
 *
 * Asked through the same listing the page uses, but via `page.request`,
 * outside the page. Every ask is a search on the IMAP server, which rations
 * them per account, so the asking is spaced out; and a refusal throws, which
 * ends the wait at once with the server's reason instead of reading as "not
 * indexed yet" until the timeout.
 */
async function waitForSearchable(page: Page, term: string): Promise<void> {
  await expect
    .poll(
      async () => {
        const response = await page.request.get(`/mailboxes/INBOX?page=0&query=${encodeURIComponent(term)}`);
        if (!response.ok()) {
          throw new Error(`the search for "${term}" was refused: ${response.status()} ${await response.text()}`);
        }
        const body = (await response.json()) as { Messages?: unknown[] | null };
        return body.Messages?.length ?? 0;
      },
      {
        timeout: 45_000,
        intervals: [500, 1000, 3000],
        message: `"${term}" never became searchable`,
      },
    )
    .toBeGreaterThan(0);
}

test("searching narrows the list to the one matching message", async ({ page }) => {
  const wanted = token();
  const wantedSubject = `Search hit ${wanted}`;
  const otherSubject = `Search miss ${token()}`;
  await Promise.all([
    deliver({ subject: wantedSubject, body: "The one to find." }),
    deliver({ subject: otherSubject, body: "The one to leave behind." }),
  ]);

  await login(page);
  await expect(listRow(page, otherSubject)).toBeVisible();
  await waitForSearchable(page, wanted);
  await searchFor(page, wanted);

  await expect(listRow(page, wantedSubject)).toBeVisible();
  await expect(listRow(page, otherSubject)).toHaveCount(0);
  // Not "at least one": a search that silently fell back to the ordinary
  // listing would still show the message we asked for.
  await expect(page.locator("alps-message-list .message-item")).toHaveCount(1);
  await expect(searchBanner(page)).toContainText(wanted);
});

test("a word that appears only in the body is searchable", async ({ page }) => {
  test.setTimeout(75_000); // waitForSearchable: the body index lags delivery
  const needle = token();
  const subject = `Body search ${token()}`;
  await deliver({ subject, body: `Nothing to see until the word ${needle} in the middle.` });

  await login(page);
  await waitForSearchable(page, needle);
  await searchFor(page, needle);

  // The subject does not contain the search term at all — the only way this
  // row can be here is the indexed body.
  await expect(listRow(page, subject)).toBeVisible();
  await expect(page.locator("alps-message-list .message-item")).toHaveCount(1);
});

test("clearing the search restores the full list", async ({ page }) => {
  const wanted = token();
  const wantedSubject = `Clear hit ${wanted}`;
  const otherSubject = `Clear miss ${token()}`;
  await Promise.all([
    deliver({ subject: wantedSubject, body: "Found by the query." }),
    deliver({ subject: otherSubject, body: "Hidden by the query." }),
  ]);

  await login(page);
  await waitForSearchable(page, wanted);
  await searchFor(page, wanted);
  await expect(listRow(page, wantedSubject)).toBeVisible();
  await expect(listRow(page, otherSubject)).toHaveCount(0);

  await searchBanner(page).getByRole("button", { name: "Clear search" }).click();

  await expect(listRow(page, otherSubject)).toBeVisible();
  await expect(listRow(page, wantedSubject)).toBeVisible();
  await expect(searchBanner(page)).toHaveCount(0);
  // The query lives in the URL, so a stale `q` would come back on reload.
  await expect(page).toHaveURL(/#\/mailbox\/INBOX$/);
});

test("the search box's own clear button restores the list", async ({ page }) => {
  // A separate code path from the banner's button: the input's `clear` event,
  // which app-header turns into an empty search-submit.
  const wanted = token();
  const wantedSubject = `Box clear hit ${wanted}`;
  const otherSubject = `Box clear miss ${token()}`;
  await Promise.all([
    deliver({ subject: wantedSubject, body: "Found by the query." }),
    deliver({ subject: otherSubject, body: "Hidden by the query." }),
  ]);

  await login(page);
  await waitForSearchable(page, wanted);
  await searchFor(page, wanted);
  await expect(listRow(page, wantedSubject)).toBeVisible();
  await expect(listRow(page, otherSubject)).toHaveCount(0);

  // `exact` and scoped to the header, because the banner's "Clear search"
  // button is on screen too.
  await page.locator("app-header").getByRole("button", { name: "Clear", exact: true }).click();

  await expect(listRow(page, otherSubject)).toBeVisible();
  await expect(searchBox(page)).toHaveValue("");
  await expect(searchBanner(page)).toHaveCount(0);
});

test("a search with no matches shows the empty state, not the whole mailbox", async ({ page }) => {
  const subject = `Unmatched ${token()}`;
  await deliver({ subject, body: "Ordinary mail." });

  await login(page);
  await expect(listRow(page, subject)).toBeVisible();

  // A word nothing was ever delivered with.
  await searchFor(page, token());

  // The empty state FIRST: it is the positive fact, and it renders in place of
  // the rows, so gating on it means the count below cannot pass merely because
  // the list has not been repainted yet.
  await expect(page.locator("alps-message-list").getByText("No messages", { exact: true })).toBeVisible();
  await expect(page.locator("alps-message-list .message-item")).toHaveCount(0);
  // The query stays on screen: an empty list with no explanation reads as a
  // broken mailbox rather than as a search that found nothing.
  await expect(searchBanner(page)).toBeVisible();

  await searchBanner(page).getByRole("button", { name: "Clear search" }).click();
  await expect(listRow(page, subject)).toBeVisible();
});

test("the starred filter narrows the list to starred messages", async ({ page }) => {
  const starredSubject = `Star me ${token()}`;
  const plainSubject = `Leave me ${token()}`;
  await Promise.all([
    deliver({ subject: starredSubject, body: "Worth keeping." }),
    deliver({ subject: plainSubject, body: "Not worth keeping." }),
  ]);

  await login(page);
  const starredRow = listRow(page, starredSubject);
  await expect(starredRow).toBeVisible();
  await expect(listRow(page, plainSubject)).toBeVisible();

  // Wait for the write, not the optimistic paint: the filter re-reads the
  // list from the server, so a filter applied before the flag landed would
  // hide the message it was supposed to reveal.
  const written = flagWrite(page);
  await starredRow.locator(".star-btn").click();
  await written;

  const filtered = listing(page, "is:starred");
  await listButton(page, "Filter by starred").click();
  await filtered;

  await expect(listRow(page, starredSubject)).toBeVisible();
  await expect(listRow(page, plainSubject)).toHaveCount(0);
  // The toggle is stored in the same place as a search, so it reads back as
  // the query.
  await expect(searchBanner(page)).toContainText("is:starred");

  await listButton(page, "Filter by starred").click();

  await expect(listRow(page, plainSubject)).toBeVisible();
  await expect(listRow(page, starredSubject)).toBeVisible();
  await expect(searchBanner(page)).toHaveCount(0);
});

test("the unread filter hides messages that have been read", async ({ page }) => {
  const readSubject = `Read me ${token()}`;
  const unreadSubject = `Ignore me ${token()}`;
  await Promise.all([
    deliver({ subject: readSubject, body: "Opened during the test." }),
    deliver({ subject: unreadSubject, body: "Never opened." }),
  ]);

  await login(page);
  const readRow = listRow(page, readSubject);
  await expect(readRow).toBeVisible();
  await expect(listRow(page, unreadSubject)).toBeVisible();

  const written = flagWrite(page);
  await readRow.locator(".message-subject").click();
  await written;
  // The row stops rendering as unread once the flag is written — the same
  // state the filter below asks the server about.
  await expect(readRow).not.toHaveClass(/unread/);

  const filtered = listing(page, "is:unread");
  await listButton(page, "Filter by unread").click();
  await filtered;

  await expect(listRow(page, unreadSubject)).toBeVisible();
  await expect(listRow(page, readSubject)).toHaveCount(0);

  await listButton(page, "Filter by unread").click();

  await expect(listRow(page, readSubject)).toBeVisible();
});

/** The flags a folder's copy of a message carries, read from the server. */
async function flagsIn(page: Page, folder: string, subject: string): Promise<string[] | null> {
  const response = await page.request.get(
    `/mailboxes/${encodeURIComponent(encodeURIComponent(folder))}?page=0&query=${encodeURIComponent(subject)}`,
  );
  if (!response.ok()) return null;
  const body = (await response.json()) as { Messages?: { Flags?: string[]; Envelope?: { Subject?: string } }[] | null };
  const found = (body.Messages ?? []).find((m) => m.Envelope?.Subject === subject);
  return found ? found.Flags ?? [] : null;
}

test("checked results from several folders are starred and deleted each in its own folder", async ({ page }) => {
  // A search across every folder is viewed as "*", which is not a folder. Its
  // writes used to be sent to "*", and none of them worked.
  test.setTimeout(75_000);
  const word = token();
  const inboxSubject = `Everywhere inbox ${word}`;
  const archivedSubject = `Everywhere archived ${word}`;
  await Promise.all([
    deliver({ subject: inboxSubject, body: "Stays in the inbox." }),
    deliver({ subject: archivedSubject, body: "Filed in Archive first." }),
  ]);

  await login(page);
  const reader = page.locator("alps-message-reader");
  const archived = listRow(page, archivedSubject);
  await expect(archived).toBeVisible();
  await archived.locator("input.message-checkbox").check();
  await reader.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(archived).toHaveCount(0);
  await expect.poll(() => flagsIn(page, "Archive", archivedSubject), { timeout: 15_000 }).not.toBeNull();

  await waitForSearchable(page, word);
  await searchFor(page, word);
  const everywhere = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/mailboxes/*" && url.searchParams.get("query") === word && response.ok();
  });
  await searchBanner(page).getByRole("button", { name: "Search All", exact: true }).click();
  await everywhere;
  await expect(page).toHaveURL(/#\/mailbox\/\*\?/);

  const rows = [listRow(page, inboxSubject), listRow(page, archivedSubject)];
  for (const row of rows) await expect(row).toBeVisible();
  for (const row of rows) await row.locator("input.message-checkbox").check();
  await expect(reader.getByText("2 messages selected")).toBeVisible();

  // One write per folder, each to the folder its message is in.
  const flagged = (folder: string) =>
    page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        new URL(response.url()).pathname === `/mailboxes/${folder}/messages/flag` &&
        response.ok(),
    );
  const written = Promise.all([flagged("INBOX"), flagged("Archive")]);
  await reader.getByRole("button", { name: "Star", exact: true }).click();
  await written;
  expect(await flagsIn(page, "INBOX", inboxSubject)).toContain("\\Flagged");
  expect(await flagsIn(page, "Archive", archivedSubject)).toContain("\\Flagged");

  await reader.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(toast(page, "2 messages moved to Trash")).toBeVisible();
  await expect.poll(() => flagsIn(page, "Trash", inboxSubject), { timeout: 15_000 }).not.toBeNull();
  await expect.poll(() => flagsIn(page, "Trash", archivedSubject), { timeout: 15_000 }).not.toBeNull();
  expect(await flagsIn(page, "INBOX", inboxSubject)).toBeNull();
  expect(await flagsIn(page, "Archive", archivedSubject)).toBeNull();
});
