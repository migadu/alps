// Conversations: does a reply chain collapse into one list row, and does
// opening it show the whole conversation?
//
// Threading is the IMAP server's answer, not the browser's guess. The listing
// asks sora for `UID THREAD` (REFS when offered), so a list row is a whole
// thread: the newest message, with the rest of the thread carried behind it.
// Opening a message then asks the server for that message's conversation
// (`/messages/{uid}/thread`), which is how a member that is not on screen as a
// row — reached by a link, or sitting on another page — still brings the whole
// conversation with it. The tests below open conversations through exactly
// those routes.
//
// The other half is the grouping RULE. REFS threads on the reply chain
// (In-Reply-To / References) and never on the subject, so two tests here are
// the pair that tells those apart: same subject, no chain → separate rows; new
// subject, chain intact → one row. Every other test uses a chain as mail
// clients write one — the replies keep the subject behind a "Re:" — so what
// they pin is how alps shows a thread, whichever rule the server grouped by.
//
// Every test seeds its own chain under a stamp of its own and asserts only on
// that stamp, so nothing here depends on another test having run, on the order
// they run in, or on what else is sitting in the shared mailbox.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, resetSettings, test, USER } from "./fixtures";

/** A value no other test run, and no other mail in the shared mailbox, carries. */
function stamp(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * The list rows carrying a subject. `.message-item` belongs to
 * alps-message-list, and Playwright pierces the component's open shadow root;
 * scoping to `alps-message-list` keeps the reader pane — which renders the same
 * subject again, in its own markup — from ever answering a question about the
 * LIST. Counted rather than asserted-visible: the whole point of a thread row
 * is that three messages produce ONE of these.
 */
function rows(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/**
 * Opens a listed message.
 *
 * Deliberately NOT a click on the row: the row is a strip of controls that
 * each stop the click from opening anything — the checkbox column, the thread
 * caret, and the star, which silently STARS the message instead. A test that
 * clicked one of those would fail much later, on an assertion that has nothing
 * to do with the cause. The subject carries no handler of its own, so its
 * click reaches the row's.
 */
async function openRow(row: Locator): Promise<void> {
  await row.locator(".message-subject").click();
}

/**
 * One card per message in the open conversation, oldest first. Scoped to the
 * reader: an unscoped match would quietly start counting cards rendered
 * anywhere else instead of failing.
 */
function cards(page: Page) {
  return page.locator("alps-message-reader alps-thread-card");
}

/**
 * Picks a card's body. A collapsed card renders none — only its sender and a
 * "click to expand" line — so a body in a card is proof that card is expanded
 * AND that its own message was fetched into it.
 */
function bodyOf(card: Locator) {
  return card.locator("pre.reader-preformatted");
}

/** The bodies of the expanded cards, in card order. */
function cardBodies(page: Page) {
  return bodyOf(cards(page));
}

/**
 * Every message body the reader has rendered — the single-message view's and
 * the conversation cards' alike, since the two are alternative branches of the
 * same reader and only one is ever on screen. Used where the test's subject is
 * which branch rendered at all.
 */
function bodies(page: Page) {
  return page.locator("alps-message-reader pre.reader-preformatted");
}

/**
 * Who sent each message of a chain. A collapsed card shows its sender and no
 * text, so distinct senders are what let a test read the ORDER of a
 * conversation without expanding every card first.
 */
const SENDERS = [
  { name: "Ada Lovelace", header: "Ada Lovelace <ada@remote.test>" },
  { name: "Charles Babbage", header: "Charles Babbage <charles@remote.test>" },
  { name: "Mary Somerville", header: "Mary Somerville <mary@remote.test>" },
] as const;

/**
 * A complete RFC 5322 message with a reply chain of its own.
 *
 * Dated SECONDS apart and in the recent past, not minutes: the list is sorted
 * by Date, fifty threads to a page, and a chain dated half an hour back sinks
 * below everything the rest of a full suite run has delivered since.
 */
function rawMail(opts: {
  subject: string;
  messageId: string;
  body: string;
  from?: string;
  inReplyTo?: string;
  references?: string[];
  secondsAgo: number;
}): string {
  const lines = [
    `From: ${opts.from ?? SENDERS[0].header}`,
    `To: ${USER.address}`,
    `Subject: ${opts.subject}`,
    `Message-ID: ${opts.messageId}`,
    `Date: ${new Date(Date.now() - opts.secondsAgo * 1000).toUTCString()}`,
  ];
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references?.length) lines.push(`References: ${opts.references.join(" ")}`);
  lines.push("MIME-Version: 1.0", "Content-Type: text/plain; charset=utf-8", "", opts.body, "");
  return lines.join("\r\n");
}

/**
 * Delivers a three-message reply chain through the real inbound path: the
 * second cites the first, the third cites the second and carries the whole
 * References chain. Subjects and bodies are stamped so the shared mailbox's
 * other mail — including chains seeded by the other tests in this file — can
 * never satisfy an assertion.
 *
 * Both replies are "Re: <subject>", so `subject` is found in every row of the
 * chain, and the first message is the only one whose subject is exactly it.
 */
async function deliverChain(): Promise<{
  run: string;
  subject: string;
  texts: [string, string, string];
}> {
  const run = stamp();
  const subject = `Analytical Engine ${run}`;
  const msgid = (n: number) => `<alps-chain-${run}-${n}@remote.test>`;
  const texts: [string, string, string] = [
    `Notes on the engine, sent first in run ${run}.`,
    `A reply about punch cards, sent second in run ${run}.`,
    `Bernoulli numbers, sent third in run ${run}.`,
  ];

  await deliver({
    subject,
    raw: rawMail({ subject, messageId: msgid(1), from: SENDERS[0].header, body: texts[0], secondsAgo: 3 }),
  });
  await deliver({
    subject: `Re: ${subject}`,
    raw: rawMail({
      subject: `Re: ${subject}`,
      messageId: msgid(2),
      from: SENDERS[1].header,
      inReplyTo: msgid(1),
      references: [msgid(1)],
      body: texts[1],
      secondsAgo: 2,
    }),
  });
  // The newest message is the one the thread row will show, and it is the only
  // one from its sender — a row showing an older member is a real defect, not a
  // detail.
  await deliver({
    subject: `Re: ${subject}`,
    raw: rawMail({
      subject: `Re: ${subject}`,
      messageId: msgid(3),
      from: SENDERS[2].header,
      inReplyTo: msgid(2),
      references: [msgid(1), msgid(2)],
      body: texts[2],
      secondsAgo: 1,
    }),
  });

  return { run, subject, texts };
}

type ListedMessage = {
  UID: number | string;
  Envelope?: { Subject?: string };
  SubMessages?: ListedMessage[] | null;
};

/**
 * The UID of a thread member that is NOT a row of its own, read from the same
 * listing the page shows. A link to a message is the only way to open it
 * without clicking its row, and the link needs the UID, which delivery does
 * not report.
 */
async function memberUid(page: Page, memberSubject: string): Promise<string> {
  const response = await page.request.get("/mailboxes/INBOX?page=0");
  expect(response.ok(), "the listing is readable").toBe(true);
  const { Messages } = (await response.json()) as { Messages: ListedMessage[] | null };
  const member = (Messages ?? [])
    .flatMap((row) => row.SubMessages ?? [])
    .find((m) => m.Envelope?.Subject === memberSubject);
  expect(member, `"${memberSubject}" is listed behind a thread row`).toBeTruthy();
  return String(member!.UID);
}

/**
 * The reader paints the opened message immediately and only THEN asks the
 * server for its conversation. Anything that asserts a conversation did NOT
 * appear has to wait for that answer, or it passes in the window before the
 * cards it is looking for could possibly exist.
 *
 * Set up BEFORE the click that opens the message. Resolves either way: a
 * reader that never asked also never threaded, which is the same conclusion.
 */
function threadLookup(page: Page): Promise<unknown> {
  return page
    .waitForResponse((response) => /\/mailboxes\/[^/]+\/messages\/[^/?]+\/thread(\?|$)/.test(response.url()), {
      timeout: 10_000,
    })
    .catch(() => null);
}

test("a reply chain lists as one row showing the newest message", async ({ page }) => {
  const chain = await deliverChain();

  await login(page);
  const conversation = rows(page, chain.subject);
  await expect(conversation).toHaveCount(1);
  // The row's face is the most recent thing said, which is what makes it a
  // thread row rather than the first message with a badge on it. A row shows
  // the sender of the message it stands for, and only the newest message came
  // from this one.
  await expect(conversation).toContainText(SENDERS[2].name);
  await expect(conversation).not.toContainText(SENDERS[0].name);
  await expect(conversation).not.toContainText(SENDERS[1].name);
});

test("a conversation row says how many messages it holds", async ({ page }) => {
  // Collapsed, a thread row shows ONE message; the count beside its caret is
  // the only thing on screen saying the other messages exist. The row carries
  // the badge only when the thread holds more than one message, so a listing
  // that lost the thread size loses the badge, not just the number.
  const chain = await deliverChain();

  await login(page);
  const conversation = rows(page, chain.subject);
  await expect(conversation).toHaveCount(1);
  // Three delivered messages, one row: the only thing that tells the user the
  // other two exist is this number.
  await expect(conversation.locator(".thread-count-caret-badge")).toHaveText("3");

  // And the number is what is behind it: the caret lays the thread out under
  // its row, one row per message — the two older ones included.
  await conversation.locator(".caret-col").click();
  await expect(rows(page, chain.subject)).toHaveCount(3);
  const underneath = page.locator("alps-message-list .message-item.sub-message-item");
  await expect(underneath.filter({ hasText: chain.subject })).toHaveCount(2);
});

test("checking a conversation's row checks every message in it", async ({ page }) => {
  // Collapsed, the row is the whole conversation, so its checkbox is too. It
  // stood for the newest message alone: the selection bar said "1 message",
  // "Mark as read" left the two older ones unread, and the row stayed bold
  // under a gesture that looked like it had worked.
  const chain = await deliverChain();

  await login(page);
  const conversation = rows(page, chain.subject);
  await expect(conversation).toHaveCount(1);
  await expect(conversation).toHaveClass(/unread/);

  await conversation.locator("input.message-checkbox").check();
  const bar = page.locator("alps-message-reader");
  await expect(bar.getByText("3 messages selected")).toBeVisible();

  const flagged = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      new URL(response.url()).pathname === "/mailboxes/INBOX/messages/flag" &&
      response.ok(),
  );
  await bar.getByRole("button", { name: "Mark as read", exact: true }).click();
  await flagged;
  await expect(conversation).not.toHaveClass(/unread/);

  // Read from the mailbox again, and laid out: every message of the three was
  // written, not only the one the row shows.
  await page.reload();
  await expect(rows(page, chain.subject)).toHaveCount(1);
  await rows(page, chain.subject).locator(".caret-col").click();
  await expect(rows(page, chain.subject)).toHaveCount(3);
  await expect(page.locator("alps-message-list .message-item.unread").filter({ hasText: chain.subject })).toHaveCount(0);
});

test("a conversation's row wears the star of any message in it, sets one, and clears it wherever it is", async ({ page }) => {
  // The row showed its newest message's star alone. A star on an older message
  // vanished when the thread collapsed, and pressing the unlit star over it put
  // a second one on the thread instead of taking the first off.
  const chain = await deliverChain();

  /** The next star write, as the server took it. */
  const starWrite = () =>
    page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        new URL(response.url()).pathname === "/mailboxes/INBOX/messages/flag" &&
        response.ok(),
    ).then((response) => response.request().postDataJSON() as { uids: string[]; action: string });
  const starred = () => page.locator("alps-message-list .message-item.starred").filter({ hasText: chain.subject });

  await login(page);
  const conversation = rows(page, chain.subject);
  await expect(conversation).toHaveCount(1);

  // Setting it stars ONE message, not all three.
  let write = starWrite();
  await conversation.locator(".star-btn").click();
  expect(await write).toMatchObject({ action: "add", uids: [expect.any(String)] });
  await expect(conversation).toHaveClass(/starred/);

  // Laid out, that one is the row's own message, the newest.
  await conversation.locator(".caret-col").click();
  await expect(rows(page, chain.subject)).toHaveCount(3);
  await expect(starred()).toHaveCount(1);
  await expect(rows(page, chain.subject).first()).toHaveClass(/starred/);

  // Move the star to the OLDEST message, each row now speaking for itself.
  write = starWrite();
  await rows(page, chain.subject).first().locator(".star-btn").click();
  expect((await write).action).toBe("remove");
  write = starWrite();
  await rows(page, chain.subject).last().locator(".star-btn").click();
  const oldest = await write;
  expect(oldest.action).toBe("add");
  await expect(starred()).toHaveCount(1);

  // Collapsed again — and read from the mailbox again — the row is still lit,
  // by a message it does not show.
  await page.reload();
  await expect(rows(page, chain.subject)).toHaveCount(1);
  await expect(rows(page, chain.subject)).toHaveClass(/starred/);

  // Pressing it takes the star off THAT message.
  write = starWrite();
  await rows(page, chain.subject).locator(".star-btn").click();
  expect(await write).toEqual(expect.objectContaining({ action: "remove", uids: oldest.uids }));
  await expect(rows(page, chain.subject)).not.toHaveClass(/starred/);

  await page.reload();
  await expect(rows(page, chain.subject)).toHaveCount(1);
  await rows(page, chain.subject).locator(".caret-col").click();
  await expect(rows(page, chain.subject)).toHaveCount(3);
  await expect(starred()).toHaveCount(0);
});

test("opening a conversation shows all three messages, oldest first", async ({ page }) => {
  const chain = await deliverChain();

  await login(page);
  await openRow(rows(page, chain.subject));

  // One row was clicked and three messages are shown.
  await expect(cards(page)).toHaveCount(3);
  // A conversation reads top to bottom, and the message that was opened — the
  // newest — is the one expanded, at the bottom.
  await expect(cards(page).nth(0)).toContainText(SENDERS[0].name);
  await expect(cards(page).nth(1)).toContainText(SENDERS[1].name);
  await expect(cards(page).nth(2)).toContainText(SENDERS[2].name);
  await expect(bodyOf(cards(page).nth(2))).toContainText(chain.texts[2]);

  // And it SURVIVES a re-render. The reader re-resolves its conversation
  // whenever the message list it holds changes, and one that rebuilt the thread
  // from the opened message alone would collapse the conversation to a single
  // card moments after it appeared. A new arrival plus "check for new messages"
  // replaces that list for real; waiting for the new row proves the re-render
  // happened before the conversation is re-checked, so this cannot pass by
  // being early.
  const nudge = `Unrelated arrival ${chain.run}`;
  await deliver({
    subject: nudge,
    raw: rawMail({
      subject: nudge,
      messageId: `<alps-nudge-${chain.run}@remote.test>`,
      body: `Nothing to do with run ${chain.run}.`,
      secondsAgo: 0,
    }),
  });
  await page.locator("alps-message-list").getByRole("button", { name: "Check for new messages" }).click();
  await expect(rows(page, nudge)).toHaveCount(1);

  await expect(cards(page)).toHaveCount(3);
  await expect(cards(page).nth(0)).toContainText(SENDERS[0].name);
  await expect(cards(page).nth(2)).toContainText(SENDERS[2].name);
  await expect(bodyOf(cards(page).nth(2))).toContainText(chain.texts[2]);
});

test("each message in a conversation can be expanded and read", async ({ page }) => {
  const chain = await deliverChain();

  await login(page);
  await openRow(rows(page, chain.subject));
  await expect(cards(page)).toHaveCount(3);

  // The chain was just delivered, so nobody has read any of it — and a
  // conversation opens with its unread messages expanded, not only the one that
  // was opened. Each body is its own request, which is where a wrong UID shows
  // up as the wrong text (or none).
  await expect(bodyOf(cards(page).nth(2))).toContainText(chain.texts[2]);
  await expect(cardBodies(page)).toHaveCount(3);
  // Asked per card rather than by position among the bodies: the body has to
  // be in the card it belongs to, not merely somewhere on screen.
  await expect(bodyOf(cards(page).nth(0))).toContainText(chain.texts[0]);
  await expect(bodyOf(cards(page).nth(1))).toContainText(chain.texts[1]);

  // A card's header still collapses and expands it by hand. The sender's name
  // is part of the header, and carries no handler of its own, unlike the star
  // and the menu beside it.
  await cards(page).nth(0).locator(".thread-card-sender").click();
  await expect(cardBodies(page)).toHaveCount(2);
  await cards(page).nth(0).locator(".thread-card-sender").click();
  await expect(cardBodies(page)).toHaveCount(3);
  await expect(bodyOf(cards(page).nth(0))).toContainText(chain.texts[0]);
});

test("opening a member the list never listed still shows the whole conversation", async ({ page }) => {
  const chain = await deliverChain();

  await login(page);
  // The list holds ONE row, and it is the newest message. The first message is
  // not on screen in any form.
  await expect(rows(page, chain.subject)).toHaveCount(1);
  const first = await memberUid(page, chain.subject);

  // A link to that first message — a bookmark, a search result, a
  // notification. It is not a row, so the page has to fetch it by UID.
  await page.goto(`/#/mailbox/INBOX?uid=${first}`);

  await expect(cards(page)).toHaveCount(3);
  // The linked message is opened with its own body. Not stated as a count of
  // one: the chain was just delivered, and unread messages open expanded
  // alongside it.
  await expect(bodyOf(cards(page).nth(0))).toContainText(chain.texts[0]);
  await expect(cards(page).nth(2)).toContainText(SENDERS[2].name);
});

// FIXME (mail server, not alps): the sora under test offers THREAD=REFERENCES
// and THREAD=ORDEREDSUBJECT but not THREAD=REFS, so alps falls back to
// REFERENCES, whose last step merges mail by subject (RFC 5256 §2.2) — this
// pair arrives as one row.
test.fixme("messages sharing a subject but no reply chain stay separate", async ({ page }) => {
  // Subject-based grouping is the classic wrong implementation: it merges
  // unrelated "Invoice" or "Hello" mail from strangers into one conversation.
  // REFS groups on the reply chain only, and this is where a user would see
  // the difference.
  const run = stamp();
  const subject = `Monthly report ${run}`;
  const first = `First unrelated report of run ${run}.`;
  const second = `Second unrelated report of run ${run}.`;

  await deliver({
    subject,
    raw: rawMail({ subject, messageId: `<alps-solo-${run}-1@remote.test>`, body: first, secondsAgo: 2 }),
  });
  await deliver({
    subject,
    raw: rawMail({ subject, messageId: `<alps-solo-${run}-2@remote.test>`, body: second, secondsAgo: 1 }),
  });

  await login(page);
  await expect(rows(page, subject)).toHaveCount(2);

  // And each is a lone message, not a one-member conversation: opening one
  // shows the plain reader, with no conversation cards at all.
  const lookup = threadLookup(page);
  await openRow(rows(page, subject).first());
  await expect(bodies(page)).toHaveCount(1);
  await expect(bodies(page).first()).toContainText(second);
  // The reader has now been told what this message's conversation contains, so
  // "no cards" is a verdict rather than a head start.
  await lookup;
  await expect(cards(page)).toHaveCount(0);
});

// FIXME (mail server, not alps): sora links no reply to its parent. It stores
// Message-ID, In-Reply-To and References without their angle brackets, and its
// thread builder only splits bracketed ids, so every reference misses and a
// reply stays with its parent only where the subjects agree — this pair lists
// as two rows.
test.fixme("a reply that renames the subject stays in the conversation", async ({ page }) => {
  // The mirror of the test above: the chain decides, so a renamed reply must
  // NOT split off. The two subjects share no words, so nothing but
  // In-Reply-To can hold them together.
  const run = stamp();
  const opening = `Difference engine ${run}`;
  const renamed = `Punch cards ${run}`;
  const openingText = `The original question of run ${run}.`;
  const renamedText = `The renamed answer of run ${run}.`;
  const rootId = `<alps-rename-${run}-1@remote.test>`;

  await deliver({
    subject: opening,
    raw: rawMail({ subject: opening, messageId: rootId, from: SENDERS[0].header, body: openingText, secondsAgo: 2 }),
  });
  await deliver({
    subject: renamed,
    raw: rawMail({
      subject: renamed,
      messageId: `<alps-rename-${run}-2@remote.test>`,
      from: SENDERS[1].header,
      inReplyTo: rootId,
      references: [rootId],
      body: renamedText,
      secondsAgo: 1,
    }),
  });

  await login(page);
  // One row, and it carries the newest subject. Asserted first, so the list is
  // on screen before the next line asks what is NOT in it — the older subject
  // has no row of its own anywhere.
  await expect(rows(page, renamed)).toHaveCount(1);
  await expect(rows(page, opening)).toHaveCount(0);

  await openRow(rows(page, renamed));
  await expect(cards(page)).toHaveCount(2);
  await expect(cards(page).nth(0)).toContainText(SENDERS[0].name);
  await expect(bodyOf(cards(page).nth(1))).toContainText(renamedText);
  // The older card is the older MESSAGE, not a stray: its own body says so.
  await cards(page).nth(0).locator(".thread-card-sender").click();
  await expect(bodyOf(cards(page).nth(0))).toContainText(openingText);
});

test.describe("the threading preference", () => {
  // The preference lives on the IMAP server (METADATA), shared by every test
  // in the run, so it is put back after the test whatever happened in it.
  test.afterEach(async () => {
    await resetSettings();
  });

  test("with threading switched off the same chain lists as three messages", async ({ page }) => {
    // The control for every test above: the same three messages, the same
    // listing, one setting apart. If the grouped view were built client-side
    // from these rows, this is the test that would still pass while the
    // conversation reader quietly lost members.
    const chain = await deliverChain();

    await login(page);
    await expect(rows(page, chain.subject)).toHaveCount(1);

    await page.goto("/#/settings/reading");
    // Addressed by its label, not by position among the settings checkboxes —
    // this pane grows a new one every few releases.
    const threading = page.locator("settings-page").getByLabel("Use threading");
    await expect(threading).toBeChecked();
    // The listing reads the preference from the server, so the save has to have
    // landed before the mailbox is asked for.
    const saved = page.waitForResponse((r) => r.request().method() === "PUT" && /\/settings$/.test(r.url()));
    await threading.uncheck();
    expect((await saved).ok(), "the preference was saved").toBe(true);

    await page.goto("/#/mailbox/INBOX");
    await expect(rows(page, chain.subject)).toHaveCount(3);
    // One row per message, each under its own sender: not three copies of the
    // thread's newest.
    for (const sender of SENDERS) {
      await expect(rows(page, chain.subject).filter({ hasText: sender.name })).toHaveCount(1);
    }
    await expect(page.locator("alps-message-list .thread-count-caret-badge")).toHaveCount(0);
  });
});
