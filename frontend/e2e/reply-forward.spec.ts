// Answering mail: Reply, Reply All, and Forward.
//
// All three go through the same door — `_handleAction` in message-reader.ts,
// which hands the open message to `generateQuote` — but they disagree on
// almost everything that matters to the user: who the message is addressed
// to, what the subject becomes, and whether the original's attachments
// travel. Getting one of those wrong is silent: the composer opens, looks
// right, and sends the wrong thing. So where it matters, these tests send the
// answer and read what the SMTP server was actually handed.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, resetDav, test, toast, USER, waitForSent, type SentMessage } from "./fixtures";

/** The fixtures' default sender for delivered mail. */
const SENDER = "Ada Lovelace <ada@remote.test>";

const unique = () => Math.random().toString(36).slice(2);

/**
 * Delivers a plain-text message, with the recipient headers a test needs.
 * Returns its Message-ID, bare, for asserting what a reply says it answers.
 */
async function deliverText(opts: {
  subject: string;
  body: string;
  to?: string;
  cc?: string;
  replyTo?: string;
}): Promise<string> {
  const messageId = `${unique()}@remote.test`;
  const headers = [
    ...(opts.cc ? [`Cc: ${opts.cc}`] : []),
    ...(opts.replyTo ? [`Reply-To: ${opts.replyTo}`] : []),
  ];
  await deliver({
    subject: opts.subject,
    body: opts.body,
    to: opts.to,
    headers: headers.length ? headers.join("\r\n") : undefined,
    messageId,
  });
  return messageId;
}

/** A message with one real, non-inline attachment — the kind a forward must carry. */
function mailWithAttachment(opts: { subject: string; body: string; filename: string; contents: string }): string {
  const boundary = "alps-e2e-mixed-boundary";
  return [
    `From: ${SENDER}`,
    `To: ${USER.address}`,
    `Subject: ${opts.subject}`,
    `Message-ID: <${unique()}@remote.test>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    opts.body,
    "",
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8; name="${opts.filename}"`,
    `Content-Disposition: attachment; filename="${opts.filename}"`,
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(opts.contents, "utf8").toString("base64"),
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

/** A header of a submitted message, unfolded, or null when it is absent. */
function header(message: SentMessage, name: string): string | null {
  const head = message.data.split(/\r?\n\r?\n/, 1)[0].replace(/\r?\n[ \t]+/g, " ");
  const line = head.split(/\r?\n/).find((l) => l.toLowerCase().startsWith(`${name.toLowerCase()}:`));
  return line === undefined ? null : line.slice(name.length + 1).trim();
}

/** The submission whose Subject is exactly `subject`, waited for. */
const sentWithSubject = (subject: string) => waitForSent((m) => header(m, "Subject") === subject, 20_000);

/**
 * The open message's own body, not a conversation card's: in the single
 * message view the content block sits directly in the reader body, while a
 * card draws its own copy of the same classes further down.
 */
const readerContent = (page: Page) => page.locator("alps-message-reader .reader-body > .message-content");

/**
 * An arrived forward, as the reader shows it. A forward keeps its original's
 * subject behind the `Fwd:` prefix, and the server threads messages by base
 * subject, so the two arrive as one conversation: the forward is the card
 * whose sender is this account.
 */
const forwardCard = (page: Page) =>
  page.locator("alps-message-reader alps-thread-card").filter({
    has: page.locator(".thread-card-sender", { hasText: new RegExp(`^\\s*${USER.address.replace(/\./g, "\\.")}\\s*$`) }),
  });

/** Opens an arrived forward by its own subject — never the message it was
 * forwarded FROM — and returns its card. */
async function openArrivedForward(page: Page, subject: string): Promise<Locator> {
  await page
    .locator("alps-message-list .message-subject", { hasText: `Fwd: ${subject}` })
    .first()
    .click({ timeout: 20_000 });
  const card = forwardCard(page);
  await expect(card.locator(".thread-card.expanded")).toBeVisible({ timeout: 20_000 });
  return card;
}

/**
 * Opens a message and waits for its BODY to be on screen.
 *
 * The click lands on the row's SUBJECT cell, never on the row itself: the row
 * carries a star toggle whose handler stops propagation, so a click that
 * lands there stars the message and opens nothing — and that failure surfaces
 * much later, as a timeout on whatever the reader was supposed to show.
 *
 * The wait is load-bearing, not politeness: the quote is built from the body
 * the reader fetches after the row is selected, so a Reply clicked before
 * that lands quotes an empty message.
 */
async function openMessage(page: Page, subject: string, body: string): Promise<void> {
  // .first() only guards against a thread rendering the subject on both the
  // parent row and an expanded child; the mailbox is shared, so it stays.
  await page.locator("alps-message-list .message-subject", { hasText: subject }).first().click();
  await expect(readerContent(page).locator("pre.reader-preformatted")).toContainText(body);
}

/** The reader toolbar's Reply button. */
const replyButton = (page: Page) => page.locator('alps-message-reader alps-toolbar alps-icon-btn[title="Reply"]');

/**
 * Reply All and Forward live behind the reader's "More options" menu.
 *
 * The entries are plain buttons inside the popup; the names are exact because
 * "Reply" is a prefix of "Reply All".
 */
async function chooseFromMoreMenu(page: Page, item: "Reply All" | "Forward"): Promise<void> {
  const menu = page.locator("alps-message-reader alps-toolbar .more-menu-popup");
  await menu.locator("alps-icon-btn.more-btn").click();
  const entry = menu.getByRole("button", { name: item, exact: true });
  // Waited for explicitly so a menu that never opened fails as "the menu did
  // not open" rather than as a timeout on the click below.
  await expect(entry).toBeVisible();
  await entry.click();
}

const composer = (page: Page) => page.locator("alps-floating-composer");
const composerSubject = (page: Page) => composer(page).getByPlaceholder("Subject");

/**
 * A recipient field, addressed by the label the user reads.
 *
 * NOT by index: the Cc and Bcc rows render only once asked for or once they
 * hold something (`showCc`/`showBcc` in alps-floating-composer.ts), so "the
 * second address input" means Cc today and could mean Bcc tomorrow — and
 * picking the wrong recipient field is exactly the kind of mistake these tests
 * exist to catch.
 */
const addressField = (page: Page, label: "To" | "Cc" | "Bcc") =>
  composer(page)
    .locator(".field-row")
    // Anchored: "Cc" is a substring of "Bcc".
    .filter({ has: page.locator("span.field-label", { hasText: new RegExp(`^${label}$`) }) })
    .locator("alps-address-input");

/**
 * The recipient chips in a field. A chip SHOWS the display name when the
 * address carries one and holds the whole address, as it will be sent, in
 * its `title`.
 */
const fieldPills = (page: Page, label: "To" | "Cc" | "Bcc") => addressField(page, label).locator(".pill");
const toPills = (page: Page) => fieldPills(page, "To");
const shown = (pills: Locator) => pills.locator(".pill-addr");
const composerBody = (page: Page) => composer(page).locator("alps-message-composer .editor-container");
const composerAttachments = (page: Page) => composer(page).locator("alps-attachment-pill");

/** Commits an address to the To field. */
async function addTo(page: Page, address: string): Promise<void> {
  const input = addressField(page, "To").locator("input").first();
  await input.fill(address);
  await input.press("Enter");
  await expect(shown(toPills(page))).toContainText([address]);
}

/**
 * Sends and skips the undo window: dismissing the toast means "send now".
 * Waiting the window out would only make the test five seconds longer.
 */
async function sendNow(page: Page): Promise<void> {
  // `exact`, so no longer label that merely contains "send" can match.
  await composer(page).locator(".send-actions").getByRole("button", { name: "Send", exact: true }).click();
  const sending = toast(page, "Message is being sent");
  await expect(sending).toBeVisible();
  await sending.locator(".dismiss-btn").click();
  await expect(composer(page)).toHaveCount(0, { timeout: 20_000 });
}

/**
 * A composer a test leaves open keeps its three-second autosave running, and
 * that files a draft into the mailbox every spec shares. Discarded here,
 * best-effort, so neither a failure nor a test that never sends leaves one.
 */
test.afterEach(async ({ page }) => {
  const open = composer(page).first();
  if (!(await open.locator(".window-frame").isVisible().catch(() => false))) return;
  await open
    .locator(".send-actions")
    .getByRole("button", { name: "Discard", exact: true })
    .click({ timeout: 2_000 })
    .catch(() => {});
  await open
    .locator("ui-confirm")
    .getByRole("button", { name: "Discard", exact: true })
    .click({ timeout: 2_000 })
    .catch(() => {});
});

// Sent replies save their recipients to the address book as contacts, which
// every later spec would otherwise inherit.
test.afterAll(async () => {
  await resetDav();
});

test("replying addresses the sender, prefixes Re:, and quotes the original", async ({ page }) => {
  const subject = `Engine parts ${Date.now()}`;
  const body = "The difference engine parts shipped this morning.";
  const messageId = await deliverText({ subject, body });

  await login(page);
  await openMessage(page, subject, body);
  await replyButton(page).click();

  await expect(composerSubject(page)).toHaveValue(`Re: ${subject}`);
  // The chip shows the sender's name and holds the address it will go to.
  await expect(shown(toPills(page))).toHaveText(["Ada Lovelace"]);
  await expect(toPills(page)).toHaveAttribute("title", SENDER);
  await expect(composerBody(page)).toContainText("Ada Lovelace wrote:");
  await expect(composerBody(page)).toContainText(body);

  // What leaves: addressed to the sender alone, joined to the conversation it
  // answers, and carrying the quoted original.
  await sendNow(page);
  const sent = await sentWithSubject(`Re: ${subject}`);
  expect(sent.recipients).toEqual(["ada@remote.test"]);
  expect(header(sent, "In-Reply-To")).toBe(`<${messageId}>`);
  expect(header(sent, "References")).toContain(`<${messageId}>`);
  expect(sent.data).toContain("Ada Lovelace wrote:");
  expect(sent.data).toContain(body);
});

test("replying answers Reply-To, not From", async ({ page }) => {
  // A ticket system or list sets Reply-To, and answering the From address
  // sends mail to a box nobody reads.
  const subject = `Ticket opened ${Date.now()}`;
  const body = "Your request has been received.";
  await deliverText({ subject, body, replyTo: "Helpdesk <support@remote.test>" });

  await login(page);
  await openMessage(page, subject, body);
  await replyButton(page).click();

  await expect(composerSubject(page)).toHaveValue(`Re: ${subject}`);
  await expect(shown(toPills(page))).toHaveText(["Helpdesk"]);
  await expect(toPills(page)).toHaveAttribute("title", "Helpdesk <support@remote.test>");

  await sendNow(page);
  const sent = await sentWithSubject(`Re: ${subject}`);
  expect(sent.recipients).toEqual(["support@remote.test"]);
});

test("replying to a Re: subject does not stack a second prefix", async ({ page }) => {
  const subject = `Re: Quarterly review ${Date.now()}`;
  const body = "Agreed, let us meet on Thursday.";
  await deliverText({ subject, body });

  await login(page);
  await openMessage(page, subject, body);
  await replyButton(page).click();

  // Not "Re: Re: …" — a thread that gains a prefix per round trip is the
  // classic symptom of a client prefixing before checking.
  await expect(composerSubject(page)).toHaveValue(subject);
});

/** A message to me and Bob, copied to Grace, for Reply All to answer. */
async function deliverToGroup(subject: string, body: string): Promise<void> {
  await deliverText({
    subject,
    body,
    to: `${USER.address}, Bob Smith <bob@remote.test>`,
    cc: "Grace Hopper <grace@remote.test>",
  });
}

test("Reply All addresses the sender and everyone else on the original", async ({ page }) => {
  // Who a Reply All addresses: the sender first, then the other recipients,
  // with Cc kept as Cc. Checked apart from the test below, which also requires
  // the user's own address to be left out, so this much keeps running while
  // that one is parked.
  const subject = `Launch plan ${Date.now()}`;
  const body = "Here is the plan for Friday.";
  await deliverToGroup(subject, body);

  await login(page);
  await openMessage(page, subject, body);
  await chooseFromMoreMenu(page, "Reply All");

  await expect(composerSubject(page)).toHaveValue(`Re: ${subject}`);
  await expect(shown(toPills(page))).toContainText(["Ada Lovelace", "Bob Smith"]);
  await expect(fieldPills(page, "To").first()).toHaveAttribute("title", SENDER);
  // Cc appears only because the draft has one — an empty Cc row stays hidden.
  await expect(shown(fieldPills(page, "Cc"))).toHaveText(["Grace Hopper"]);
});

// FIXME(alps): Reply All puts the signed-in address back in To. `generateQuote`
// (src/utils/email-quote.ts, the `replyAll` branch) merges the original's To
// list into the reply target without removing the user's own address, so the
// composer shows [Ada Lovelace, alice@example.test, Bob Smith] and the reply
// mails the user a copy of their own answer.
test.fixme("Reply All keeps the other recipients and never mails me a copy", async ({ page }) => {
  const subject = `Launch checklist ${Date.now()}`;
  const body = "Here is the checklist for Friday.";
  await deliverToGroup(subject, body);

  await login(page);
  await openMessage(page, subject, body);
  await chooseFromMoreMenu(page, "Reply All");

  await expect(composerSubject(page)).toHaveValue(`Re: ${subject}`);
  // The sender first, then everyone else who was on the original — and only
  // them.
  await expect(shown(toPills(page))).toHaveText(["Ada Lovelace", "Bob Smith"]);
  await expect(shown(fieldPills(page, "Cc"))).toHaveText(["Grace Hopper"]);
  // Answering a group must not send me my own mail. Scoped to the RECIPIENT
  // fields, and matched on the chip's title, which holds the raw address even
  // when the chip shows a display name. The assertions above have already
  // waited for the draft to populate, so a count of zero here is a real answer
  // rather than a race the absence always wins.
  await expect(composer(page).locator(`alps-address-input .pill[title*="${USER.address}"]`)).toHaveCount(0);
});

test("forwarding starts a new conversation: Fwd: subject, no recipients, original quoted", async ({ page }) => {
  const subject = `Board minutes ${Date.now()}`;
  const body = "Minutes of the meeting are below.";
  await deliverText({ subject, body });

  await login(page);
  await openMessage(page, subject, body);
  await chooseFromMoreMenu(page, "Forward");

  await expect(composerSubject(page)).toHaveValue(`Fwd: ${subject}`);
  // The whole point of a forward: the user picks who it goes to. Inheriting
  // the original's recipients would mail the sender their own message back.
  await expect(toPills(page)).toHaveCount(0);
  await expect(composerBody(page)).toContainText("---------- Forwarded message ---------");
  await expect(composerBody(page)).toContainText(`Subject: ${subject}`);
  await expect(composerBody(page)).toContainText(body);
});

test("the forwarded-message header names the original sender", async ({ page }) => {
  // The header is markup built from values the sender controls, so it is
  // escaped. Unescaped, `<ada@remote.test>` would parse as a tag and the
  // provenance line would reach the recipient with no sender in it; the
  // address below only renders when it is escaped.
  const subject = `Provenance ${Date.now()}`;
  const body = "Forward this and check who it came from.";
  await deliverText({ subject, body });

  await login(page);
  await openMessage(page, subject, body);
  await chooseFromMoreMenu(page, "Forward");

  await expect(composerBody(page)).toContainText("From: Ada Lovelace <ada@remote.test>");
});

// FIXME(alps): a forward sends without the original's attachments. The
// composer names them as parts of the original (`prev_attachments`), but the
// server resolves those only against the draft being replaced or the message
// being replied to (plugins/base/routes.go, handleComposeNew: `sourcePath` is
// `draftPath` or `inReplyToPath`), and a forward carries neither — the reader
// builds reply context for reply and reply-all only (message-reader.ts,
// `_handleAction`). With no source the parts are skipped silently: the chip
// is on screen, the submitted message has no attachment.
test.fixme("forwarding carries the original's attachment, byte for byte", async ({ page }) => {
  // A forwarded attachment is carried as a REFERENCE to the original's part —
  // nothing is downloaded into the composer — so the chip on screen proves
  // nothing about what gets sent. The claim a user holds is that the
  // recipient gets the file: send the forward to yourself and read both what
  // left and what arrived. That covers the whole path the reference has to
  // survive — composer state, the form, the server's part copy, and the
  // reassembled MIME — and it fails if the reference resolved to the wrong
  // part, or to nothing.
  const subject = `Ledger enclosed ${Date.now()}`;
  const body = "The ledger is attached.";
  const filename = "ledger.txt";
  const contents = `one\ntwo\nthree\n${unique()}\n`;
  await deliver({ subject, raw: mailWithAttachment({ subject, body, filename, contents }) });

  await login(page);
  await openMessage(page, subject, body);
  // Also the gate: the reader must have loaded the attachment list before
  // Forward, because that list is where the references come from.
  await expect(page.locator("alps-message-reader alps-attachment-list.desktop-attachments")).toContainText(filename);

  await chooseFromMoreMenu(page, "Forward");

  await expect(composerSubject(page)).toHaveValue(`Fwd: ${subject}`);
  await expect(composerAttachments(page)).toHaveCount(1);
  await expect(composerAttachments(page)).toContainText(filename);

  await addTo(page, USER.address);
  await sendNow(page);

  // What left carries the file, whole.
  const sent = await sentWithSubject(`Fwd: ${subject}`);
  expect(sent.data).toContain(filename);
  expect(sent.data).toContain(Buffer.from(contents, "utf8").toString("base64"));

  // The forward, arriving.
  const card = await openArrivedForward(page, subject);
  const chip = card.locator("alps-attachment-list a.attachment-chip", { hasText: filename });
  await expect(chip).toBeVisible();

  // Fetched through the browser context, so it carries the same session
  // cookie the download would. The part number stays unasserted — a forward
  // re-assembles the MIME, so the part legitimately lands elsewhere.
  const href = (await chip.getAttribute("href"))!;
  const part = await page.request.get(href);
  expect(part.status(), `GET ${href}`).toBe(200);
  expect(await part.text()).toBe(contents);
});

test("replying leaves the original's attachment behind", async ({ page }) => {
  // The counterpart of the test above: quoting someone's file back at them is
  // noise and bandwidth, and the two actions share one code path — so the
  // forward's behaviour leaking into reply is a one-character mistake away.
  const subject = `Invoice attached ${Date.now()}`;
  const body = "Invoice for last month is attached.";
  const filename = "invoice.txt";
  await deliver({ subject, raw: mailWithAttachment({ subject, body, filename, contents: "total: 42\n" }) });

  await login(page);
  await openMessage(page, subject, body);
  await expect(page.locator("alps-message-reader alps-attachment-list.desktop-attachments")).toContainText(filename);

  await replyButton(page).click();

  await expect(composerSubject(page)).toHaveValue(`Re: ${subject}`);
  await expect(composerAttachments(page)).toHaveCount(0);

  // And nothing of it goes out with the reply either.
  await sendNow(page);
  const sent = await sentWithSubject(`Re: ${subject}`);
  expect(sent.data).toContain(body);
  expect(sent.data).not.toContain(filename);
});

/** A 1×1 PNG, carried as the HTML message's inline image. */
const PIXEL_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

/** Wider than the docked composer, so the quote has to scroll sideways. */
const WIDE_TABLE_PX = 900;

/**
 * An HTML message laid out the way mail is: a fixed-width table with a
 * coloured cell, a font, bold, an inline image referenced by `cid:`, and a
 * remote image that could be a tracking pixel. The composer's editor has no
 * node for most of that, which is what the tests below are about.
 */
function htmlMail(subject: string): string {
  const boundary = "alps-e2e-related-boundary";
  const html =
    "<html><body>" +
    "<p><b>Quarterly</b> figures below.</p>" +
    `<table style="border-collapse:collapse" width="${WIDE_TABLE_PX}"><tr>` +
    '<td style="background-color:#ffffcc">cell A</td><td>cell B</td>' +
    "</tr></table>" +
    '<p><font color="#0000cc">blue note</font></p>' +
    '<img src="cid:chart@remote.test" alt="chart">' +
    '<img src="https://tracker.remote.test/open.gif" alt="pixel" width="1" height="1">' +
    "</body></html>";
  return [
    `From: ${SENDER}`,
    `To: ${USER.address}`,
    `Subject: ${subject}`,
    `Message-ID: <${unique()}@remote.test>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/related; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    html,
    "",
    `--${boundary}`,
    'Content-Type: image/png; name="chart.png"',
    'Content-Disposition: inline; filename="chart.png"',
    "Content-ID: <chart@remote.test>",
    "Content-Transfer-Encoding: base64",
    "",
    PIXEL_PNG,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

/** What a sandboxed message frame shows, read from the parent as the app sizes it. */
function frameLayout(frame: Locator) {
  return frame.evaluate((el) => {
    const doc = (el as HTMLIFrameElement).contentDocument;
    const img = doc?.querySelector<HTMLImageElement>('img[alt="chart"]') ?? null;
    return {
      text: doc?.body?.innerText ?? "",
      /** What the remote image resolved to, or null when there is none. */
      pixel: doc?.querySelector('img[alt="pixel"]')?.getAttribute("src") ?? null,
      cells: Array.from(doc?.querySelectorAll("td") ?? [], (td) => td.textContent),
      cellStyle: doc?.querySelector("td")?.getAttribute("style") ?? "",
      font: doc?.querySelector("font")?.getAttribute("color") ?? "",
      bold: doc?.querySelector("b")?.textContent ?? "",
      image: img ? { src: img.getAttribute("src") ?? "", width: img.complete ? img.naturalWidth : 0 } : null,
    };
  });
}

const readerFrame = (page: Page) => readerContent(page).locator("iframe.reader-iframe");

/** Opens an HTML message and waits for its frame to have drawn the table. */
async function openHtmlMessage(page: Page, subject: string): Promise<void> {
  await page.locator("alps-message-list .message-subject", { hasText: subject }).first().click();
  await expect.poll(async () => (await frameLayout(readerFrame(page))).cells).toEqual(["cell A", "cell B"]);
}

const quoteFrame = (page: Page) => composer(page).locator(".quoted-message iframe");

test("replying to an HTML message keeps its layout and its images in the quote", async ({ page }) => {
  // The editor has no node for a table, a font or an image, and would flatten
  // a quoted original into its own paragraphs the moment the composer opened.
  // The quote is held as one block, drawn in a sandboxed frame.
  const subject = `Figures ${Date.now()}`;
  await deliver({ subject, raw: htmlMail(subject) });

  await login(page);
  await openHtmlMessage(page, subject);
  await replyButton(page).click();

  await expect(composerSubject(page)).toHaveValue(`Re: ${subject}`);
  await expect.poll(async () => (await frameLayout(quoteFrame(page))).cells).toEqual(["cell A", "cell B"]);
  const quoted = await frameLayout(quoteFrame(page));
  expect(quoted.cellStyle).toContain("background-color");
  expect(quoted.font).toBe("#0000cc");
  expect(quoted.bold).toBe("Quarterly");
  // The inline image is drawn from the original's part; the remote one is
  // shown blocked, as the reader shows it.
  await expect.poll(async () => (await frameLayout(quoteFrame(page))).image?.width).toBe(1);
  expect(quoted.pixel).toMatch(/^data:/);
  // Carried as the body's image, not as a chip the user never attached.
  await expect(composerAttachments(page)).toHaveCount(0);
  // Sized to its content rather than left at the default 150px or collapsed.
  await expect.poll(async () => (await quoteFrame(page).boundingBox())?.height ?? 0).toBeGreaterThan(40);
  // Wider than the composer: the frame grows to the table and the block
  // around it scrolls, since the frame itself takes no pointer events.
  await expect
    .poll(async () => (await quoteFrame(page).boundingBox())?.width ?? 0)
    .toBeGreaterThanOrEqual(WIDE_TABLE_PX);
  const block = composer(page).locator(".quoted-message");
  expect(await block.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  // And out of the tab order: Tab from the body must not land in the frame.
  expect(await quoteFrame(page).getAttribute("tabindex")).toBe("-1");
  // The header travels inside the quote block, with the original.
  expect(quoted.text).toContain("Ada Lovelace wrote:");
  // The original is never live markup in the page itself.
  await expect(composer(page).locator(".ProseMirror table")).toHaveCount(0);

  const editor = composer(page).locator(".ProseMirror");
  await editor.locator("p").first().click();
  await editor.pressSequentially("Looks right to me.");
  await expect(editor).toContainText("Looks right to me.");
  // Typing above the quote leaves it where it was.
  await expect.poll(async () => (await frameLayout(quoteFrame(page))).cells).toEqual(["cell A", "cell B"]);
});

// FIXME(alps): a forwarded HTML message arrives with a broken inline image.
// The image's part is dropped for the reason given above the attachment test,
// and a part that IS carried (a reply's) goes out as a plain attachment with
// no Content-ID (plugins/base/smtp.go, writeAttachment sets only type and
// filename), so the quote's `cid:` reference resolves for nobody. The arrived
// copy's frame then also logs a CSP refusal for the unresolved `cid:` image.
test.fixme("forwarding an HTML message sends its layout and its inline image", async ({ page }) => {
  // The round trip is the claim: what arrives is laid out as the original was,
  // and the inline image the forward carries resolves in it.
  const subject = `Figures to pass on ${Date.now()}`;
  await deliver({ subject, raw: htmlMail(subject) });

  await login(page);
  await openHtmlMessage(page, subject);
  await chooseFromMoreMenu(page, "Forward");

  await expect(composerSubject(page)).toHaveValue(`Fwd: ${subject}`);
  // The inline image is drawn from the part the forward carries, not shown as a chip.
  await expect.poll(async () => (await frameLayout(quoteFrame(page))).image?.width).toBe(1);
  await expect(composerAttachments(page)).toHaveCount(0);

  await addTo(page, USER.address);
  await sendNow(page);

  // What left names the image by the Content-ID its reference uses.
  const sent = await sentWithSubject(`Fwd: ${subject}`);
  expect(sent.data).toContain("cid:chart@remote.test");
  expect(sent.data).toMatch(/^Content-ID:\s*<chart@remote\.test>/im);

  const card = await openArrivedForward(page, subject);
  const arrived = card.locator(".message-content iframe.reader-iframe");
  await expect
    .poll(async () => (await frameLayout(arrived)).cells, { timeout: 20_000 })
    .toEqual(["cell A", "cell B"]);
  const layout = await frameLayout(arrived);
  expect(layout.cellStyle).toContain("background-color");
  expect(layout.font).toBe("#0000cc");
  expect(layout.bold).toBe("Quarterly");
  // Resolved against the arrived message's own part, so the cid: reference and
  // the part both made it through.
  expect(layout.image?.src).toContain("/raw?part=");
  await expect.poll(async () => (await frameLayout(arrived)).image?.width).toBe(1);
  // The remote image went out with the forward, as the message had it; the
  // reader shows it blocked, as it shows any remote image.
  expect(layout.pixel).toMatch(/^data:/);
});
