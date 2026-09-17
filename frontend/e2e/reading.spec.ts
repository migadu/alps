// Reading a message: does opening one actually put its body on screen?
//
// The reader is where four server facts (the text part, the HTML part, the
// attachment list, the \Seen flag) meet four render paths (a <pre>, a sandboxed
// iframe, the attachment pills, the list row's unread styling). Each of those
// paths renders nothing at all when its input changes shape, and none of them
// throws when it does.
//
// These specs pass `raw` rather than letting the fixture assemble a message from
// `body`: the fixture always writes a text/plain Content-Type, and what is under
// test here IS the MIME structure — an HTML part, a multipart body, an
// attachment disposition — so it has to be exactly what each test says.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, test, USER } from "./fixtures";

const FROM = "Ada Lovelace <ada@remote.test>";

/** A complete message — note the blank line, which is what makes a body a body. */
function rfc822(subject: string, headers: string[], body: string): string {
  return [
    `From: ${FROM}`,
    `To: ${USER.address}`,
    `Subject: ${subject}`,
    `Message-ID: <${subject.replace(/\W/g, "")}@remote.test>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    ...headers,
    "",
    body,
    "",
  ].join("\r\n");
}

/** `parts` are whole part sources: header lines, a blank line, then body lines. */
function multipart(subject: string, parts: string[][]): string {
  const boundary = "alps-e2e-boundary";
  const body = [...parts.flatMap((part) => [`--${boundary}`, ...part]), `--${boundary}--`].join("\r\n");
  return rfc822(subject, [`Content-Type: multipart/mixed; boundary="${boundary}"`], body);
}

/** The list row for a subject. Rows live in the message list's shadow root. */
function row(page: Page, subject: string): Locator {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/**
 * The reader's OWN rendering of the open message — the scope for everything
 * below.
 *
 * `.reader-meta`, `.reader-preformatted`, `.reader-iframe` and
 * `.reader-empty-body` are rendered by alps-message-reader AND by
 * alps-thread-card, and a thread card is a DESCENDANT of the reader. That
 * matters more than it looks: Playwright's CSS descendant combinator pierces
 * open shadow roots, so `alps-message-reader pre.reader-preformatted` resolves
 * one element per card and dies on strict mode the moment a message turns out
 * to be part of a conversation. The `>` combinator does NOT cross into a nested
 * component's shadow root, so anchoring on the reader's own `.reader-body`
 * children excludes every card by construction — and in the conversation
 * branch these locators resolve to nothing, which fails as a plain "expected 1,
 * got 0" instead of an unreadable strict-mode error.
 */
function readerBody(page: Page): Locator {
  return page.locator("alps-message-reader > .reader-body");
}

/** The open message's plain-text body, as the reader itself rendered it. */
function bodyText(page: Page): Locator {
  return readerBody(page).locator("> .message-content pre.reader-preformatted");
}

/** The open message's HTML body frame. */
function bodyFrame(page: Page): Locator {
  return readerBody(page).locator("> .message-content iframe.reader-iframe");
}

/** The desktop attachment list. (The template renders a mobile one too, outside
 * the body, and CSS picks between them; an unscoped locator matches both.) */
function attachmentList(page: Page): Locator {
  return readerBody(page).locator("> alps-attachment-list.desktop-attachments");
}

/** Clicks a row the way a user does and waits for the reader to be showing it. */
async function openMessage(page: Page, subject: string): Promise<void> {
  // The subject, not the row's centre: the centre can land on the checkbox or
  // the star toggle.
  await row(page, subject).locator(".message-subject").click();
  await expect(readerBody(page).locator("> .reader-header > .reader-subject")).toContainText(subject);
}

/**
 * The text the HTML body actually rendered as.
 *
 * The reader mounts it as `srcdoc` in a sandbox WITHOUT `allow-scripts`, so it
 * is read from the parent document — the same access the reader itself uses to
 * size the frame, and the reason the sandbox keeps `allow-same-origin`.
 */
function renderedFrameText(frame: Locator): Promise<string> {
  return frame.evaluate((el) => (el as HTMLIFrameElement).contentDocument?.body?.innerText ?? "");
}

test("a plain-text message renders its body", async ({ page }) => {
  const subject = `Plain ${Date.now()}`;
  const body = "Carry the tens, then verify the engine's second column.";
  await deliver({ subject, raw: rfc822(subject, ["Content-Type: text/plain; charset=utf-8"], body) });

  await login(page);
  await openMessage(page, subject);

  await expect(bodyText(page)).toContainText(body);
  // A text/plain body must not be routed through the HTML renderer: that path
  // sanitizes and reframes, and would show the user their text as markup.
  // (Safe as a negative: the assertion above already proves the body rendered,
  // so this can only be reading a settled DOM.)
  await expect(bodyFrame(page)).toHaveCount(0);
});

test("the reader shows who the open message is from, to, and when", async ({ page }) => {
  const subject = `Meta ${Date.now()}`;
  await deliver({
    subject,
    raw: rfc822(subject, ["Content-Type: text/plain; charset=utf-8"], "Header fields under test."),
  });

  await login(page);
  await openMessage(page, subject);

  // Four envelope fields, each drawn by its own piece of the header, and each
  // with a blank-render failure mode of its own.
  const meta = readerBody(page).locator("> .reader-header > .reader-meta");
  await expect(meta).toContainText("Ada Lovelace");
  await expect(meta).toContainText("ada@remote.test");
  await expect(meta).toContainText(USER.address);
  await expect(meta.locator(".reader-date.desktop-date")).toHaveText(/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}/);
});

test("an HTML message renders as markup, not as source", async ({ page }) => {
  const subject = `Html ${Date.now()}`;
  const heading = "Analytical Engine";
  const paragraph = "It weaves algebraic patterns as the loom weaves flowers.";
  await deliver({
    subject,
    raw: rfc822(
      subject,
      ["Content-Type: text/html; charset=utf-8"],
      `<html><body><h1>${heading}</h1><p>${paragraph}</p></body></html>`,
    ),
  });

  await login(page);
  await openMessage(page, subject);

  const frame = bodyFrame(page);
  await expect(frame).toBeVisible();
  await expect.poll(() => renderedFrameText(frame)).toContain(heading);
  expect(await renderedFrameText(frame)).toContain(paragraph);

  // The tags themselves must never reach the user as text — the fallback that
  // treats an HTML body as plaintext is exactly what that looks like.
  expect(await renderedFrameText(frame)).not.toContain("<h1>");
  await expect(bodyText(page)).toHaveCount(0);
});

test("a message with an attachment lists it and links at its MIME part", async ({ page }) => {
  const subject = `Attach ${Date.now()}`;
  await deliver({
    subject,
    raw: multipart(subject, [
      ["Content-Type: text/plain; charset=utf-8", "", "The figures are attached."],
      [
        'Content-Type: text/csv; charset=utf-8; name="figures.csv"',
        'Content-Disposition: attachment; filename="figures.csv"',
        "",
        "punch,card",
        "1,2",
      ],
    ]),
  });

  await login(page);
  await openMessage(page, subject);

  const attachments = attachmentList(page);
  await expect(attachments).toContainText("Attachments (1)");

  const link = attachments.locator("a.attachment-chip");
  await expect(link).toContainText("figures.csv");
  // It has to save the file, not navigate the app away to it.
  await expect(link).toHaveAttribute("download", "figures.csv");
  // The part is addressed by the MIME path the SERVER reported for it in the
  // message's attachment list. The shape is pinned; the number deliberately is
  // not — hard-coding it would assert the test's own arithmetic rather than
  // the server's answer. A wrong path fails invisibly: a failed `<a download>`
  // shows the user nothing at all.
  await expect(link).toHaveAttribute("href", /\/messages\/\d+\/raw\?part=\d+(\.\d+)*$/);

  // The claim that actually matters to a user: following that link yields the
  // attachment's bytes, decoded. Fetched through the browser context so it
  // carries the same session cookie the download would; the relative href
  // resolves against the config's baseURL.
  const href = (await link.getAttribute("href"))!;
  const download = await page.request.get(href);
  expect(download.status(), `GET ${href}`).toBe(200);
  const bytes = await download.text();
  expect(bytes).toContain("punch,card");
  expect(bytes).toContain("1,2");

  // An attachment must not cost the reader its body.
  await expect(bodyText(page)).toContainText("The figures are attached.");
});

// The row's paperclip and the reader's attachment list must agree — they read
// the same fact by two routes: the listing's HasAttachments, and the open
// message's Attachments. Both are the server's walk of the body structure, so
// neither side is inferring anything.
test("the list row of a message with an attachment shows a paperclip", async ({ page }) => {
  const subject = `Paperclip ${Date.now()}`;
  await deliver({
    subject,
    raw: multipart(subject, [
      ["Content-Type: text/plain; charset=utf-8", "", "The figures are attached."],
      [
        'Content-Type: text/csv; charset=utf-8; name="figures.csv"',
        'Content-Disposition: attachment; filename="figures.csv"',
        "",
        "punch,card",
      ],
    ]),
  });

  await login(page);
  await expect(row(page, subject).getByTitle("Has attachments")).toBeVisible();
});

// fixme: the MAIL STACK, not alps, cannot take this message. sora's delivery
// API panics on a message with no inline text/plain or text/html part — its
// plaintext extraction answers nil with no error, and the delivery path
// dereferences that for Sieve — so `deliver` fails with the connection closed.
// The same message stored with IMAP APPEND renders exactly as asserted below.
// Drop the fixme once sora's delivery handles a body-less message.
test.fixme("a message that is nothing but an attachment says so", async ({ page }) => {
  const subject = `Bodyless ${Date.now()}`;
  await deliver({
    subject,
    raw: multipart(subject, [
      [
        'Content-Type: text/csv; charset=utf-8; name="ledger.csv"',
        'Content-Disposition: attachment; filename="ledger.csv"',
        "",
        "row,total",
        "1,42",
      ],
    ]),
  });

  await login(page);
  await openMessage(page, subject);

  // There is genuinely nothing to render, which must read as an explanation and
  // not as the blank pane a failed load produces.
  await expect(readerBody(page).locator("> .message-content .reader-empty-body")).toContainText(
    "contains no readable text, only attachments",
  );
  await expect(attachmentList(page)).toContainText("ledger.csv");
});

test("opening an unread message marks it read", async ({ page }) => {
  const subject = `Unread ${Date.now()}`;
  await deliver({
    subject,
    raw: rfc822(subject, ["Content-Type: text/plain; charset=utf-8"], "Newly arrived."),
  });

  await login(page);
  // Arrived unread — without this the test would pass on a mailbox that never
  // marked anything read.
  await expect(row(page, subject)).toHaveClass(/\bunread\b/);

  await openMessage(page, subject);

  await expect(row(page, subject)).not.toHaveClass(/\bunread\b/);
  // And the reader agrees: the action its toolbar offers is now the inverse one.
  await expect(page.locator("alps-message-reader").getByRole("button", { name: "Mark as unread" })).toBeVisible();
});

test("reopening a message already read still renders its body", async ({ page }) => {
  // The second open of a message is served from the reader's message cache
  // rather than the server, and that is a separate render path in
  // alps-message-reader: a cache entry whose shape the render no longer reads
  // shows a blank reader on every revisit while the first open looks fine.
  const first = `Reopen A ${Date.now()}`;
  const second = `Reopen B ${Date.now()}`;
  const firstBody = "Note the marginalia on folio twelve.";
  const secondBody = "A second message, somewhere else to be.";

  await deliver({
    subject: first,
    raw: rfc822(first, ["Content-Type: text/plain; charset=utf-8"], firstBody),
  });
  await deliver({
    subject: second,
    raw: rfc822(second, ["Content-Type: text/plain; charset=utf-8"], secondBody),
  });

  await login(page);
  await openMessage(page, first);
  await expect(bodyText(page)).toContainText(firstBody);

  await openMessage(page, second);
  await expect(bodyText(page)).toContainText(secondBody);

  await openMessage(page, first);
  await expect(bodyText(page)).toContainText(firstBody);

  // Reloading re-enters the reader straight from the URL, with the message
  // still in the tab's session-storage cache, which a reload keeps. What is
  // asserted is what the user sees — the body — and not where it was served
  // from: a cache that moved but still renders is not a defect.
  await page.reload();
  await expect(readerBody(page).locator("> .reader-header > .reader-subject")).toContainText(first);
  await expect(bodyText(page)).toContainText(firstBody);
});
