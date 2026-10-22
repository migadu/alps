// A link to a message the list does not show as a row: one read of it.
//
// A bookmarked or reloaded address names a message by UID, and so does the
// address of a conversation member listed behind its row, or of a message that
// moved to another page. When that message is not a row on the page, the page
// asks the server for it so the reader has a message to show, and the reader
// then read the same message again for its body. The server's answer carries
// the body, so the page's read is kept where the reader looks first, and the
// reader does not read the message again.
//
// In a browser, against the server's own answer: the unit test stands in for
// it, and the point is that the real one carries what the reader needs.
//
// The conversation goes into a folder of its own. Left in the INBOX, which
// every other spec shares, it added a member hidden behind its row to the
// counts the specs after this one make there.

import type { Page } from "@playwright/test";
import { deliver, expect, login, test, USER } from "./fixtures";

function stamp(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const asPage = (page: Page) => ({ Origin: new URL(page.url()).origin, "Content-Type": "application/json" });

function rawMail(opts: { subject: string; messageId: string; body: string; inReplyTo?: string; secondsAgo: number }): string {
  const lines = [
    "From: Ada Lovelace <ada@remote.test>",
    `To: ${USER.address}`,
    `Subject: ${opts.subject}`,
    `Message-ID: ${opts.messageId}`,
    `Date: ${new Date(Date.now() - opts.secondsAgo * 1000).toUTCString()}`,
  ];
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`, `References: ${opts.inReplyTo}`);
  lines.push("MIME-Version: 1.0", "Content-Type: text/plain; charset=utf-8", "", opts.body, "");
  return lines.join("\r\n");
}

type ListedMessage = { UID: number | string; Envelope?: { Subject?: string }; SubMessages?: ListedMessage[] | null };

/** A folder's first page, its rows and the members listed behind them. */
async function listing(page: Page, folder: string): Promise<{ rows: ListedMessage[]; members: ListedMessage[] }> {
  const response = await page.request.get(`/mailboxes/${encodeURIComponent(encodeURIComponent(folder))}?page=0&refresh=true`);
  expect(response.ok(), `the listing of ${folder} is readable`).toBe(true);
  const { Messages } = (await response.json()) as { Messages: ListedMessage[] | null };
  const rows = Messages ?? [];
  return { rows, members: rows.flatMap((row) => row.SubMessages ?? []) };
}

let folder = "";

test.afterEach(async ({ page }) => {
  if (folder) {
    await page.request
      .delete(`/mailboxes/${encodeURIComponent(encodeURIComponent(folder))}`, { headers: { Origin: new URL(page.url()).origin } })
      .catch(() => null);
    folder = "";
  }
});

test("a linked message that is not a row is read once", async ({ page }) => {
  const run = stamp();
  const subject = `Deep link ${run}`;
  const text = `The first message of run ${run}.`;
  const first = `<alps-link-${run}-1@remote.test>`;
  await deliver({ subject, raw: rawMail({ subject, messageId: first, body: text, secondsAgo: 2 }) });
  await deliver({
    subject: `Re: ${subject}`,
    raw: rawMail({ subject: `Re: ${subject}`, messageId: `<alps-link-${run}-2@remote.test>`, body: "The reply.", inReplyTo: first, secondsAgo: 1 }),
  });

  await login(page);
  folder = `Link-${run}`;
  const created = await page.request.post("/mailboxes", { headers: { Origin: new URL(page.url()).origin }, form: { name: folder } });
  expect(created.ok(), "the folder is created").toBe(true);
  const inbox = await listing(page, "INBOX");
  const uids = [...inbox.rows, ...inbox.members]
    .filter((m) => m.Envelope?.Subject === subject || m.Envelope?.Subject === `Re: ${subject}`)
    .map((m) => String(m.UID));
  expect(uids, "both messages are in the INBOX").toHaveLength(2);
  const moved = await page.request.put("/mailboxes/INBOX/messages/move", { headers: asPage(page), data: { uids, to: folder } });
  expect(moved.ok(), "both messages are moved").toBe(true);

  const member = (await listing(page, folder)).members.find((m) => m.Envelope?.Subject === subject);
  expect(member, `"${subject}" is listed behind a conversation row`).toBeTruthy();
  const uid = String(member!.UID);

  // Every request for that message itself: its conversation and its parts
  // are other questions. Matched in full, so that message 1 does not count
  // the reads of messages 10 and 100.
  const own = new RegExp(`^/mailboxes/${folder}/messages/${uid}(\\?|/|$)`);
  const reads: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (request.method() === "GET" && own.test(url.pathname + url.search)) {
      reads.push(url.pathname + url.search);
    }
  });

  await page.goto(`/#/mailbox/${folder}?uid=${uid}`);
  await expect(page.locator("alps-message-reader")).toContainText(text);

  const ownReads = reads.filter((url) => !url.includes("/thread"));
  expect(ownReads).toHaveLength(1);
  expect(ownReads[0]).toMatch(new RegExp(`^/mailboxes/${folder}/messages/${uid}\\?view=(html|text)$`));
});
