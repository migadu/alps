// Print: the print tab prints the message it is opened for, whether or not the
// reader left a copy of it in the tab's session cache.
//
// The page asks the server when the cache misses, and the answer wraps the
// message. The unit tests stand in for that answer; here it is the server's
// own, with the structure go-imap gives it.

import { deliver, expect, login, test, USER } from "./fixtures";

/** A message with a plain-text and an HTML alternative that read differently. */
function alternative(subject: string): string {
  const boundary = `alt-${Date.now()}`;
  return [
    "From: Ada Lovelace <ada@remote.test>",
    `To: ${USER.address}`,
    `Subject: ${subject}`,
    `Message-ID: <${subject.replace(/\W/g, "")}@remote.test>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    "The plain alternative.",
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    "<html><body><p>The <b>HTML</b> body.</p></body></html>",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

test("a message the session cache does not hold prints its subject, sender and body", async ({ page }) => {
  const subject = `Print uncached ${Date.now()}`;
  await deliver({ subject, raw: alternative(subject) });

  await login(page);
  await page.locator("alps-message-list .message-subject", { hasText: subject }).first().click();
  await expect(page.locator("alps-message-reader")).toContainText("HTML");
  const uid = new URLSearchParams(page.url().split("?")[1] ?? "").get("uid");
  expect(uid, "the reader's URL names the message").toBeTruthy();

  // A tab of its own starts with an empty session cache, as a print tab
  // reloaded after its entry expired does.
  const tab = await page.context().newPage();
  await tab.addInitScript(() => {
    window.print = () => {};
  });
  await tab.goto(`/#/print?mailbox=INBOX&uid=${uid}`);

  const printed = tab.locator("print-page");
  await expect(printed.locator(".print-header h2")).toHaveText(subject);
  await expect(printed.locator(".print-meta-row")).toContainText("Ada Lovelace");
  await expect(printed.locator(".print-meta-row")).toContainText("ada@remote.test");
  await expect(tab.frameLocator("print-page iframe.print-iframe").locator("body")).toContainText("The HTML body.");
  await tab.close();
});

// A message whose one part is text but neither plain nor HTML: the server
// answers with the whole message as the part to show, and that part has no
// path. The page asked for part "null" and printed an error.
test("a single-part calendar invitation prints its text", async ({ page }) => {
  const subject = `Print invitation ${Date.now()}`;
  await deliver({
    subject,
    raw: [
      "From: Ada Lovelace <ada@remote.test>",
      `To: ${USER.address}`,
      `Subject: ${subject}`,
      `Message-ID: <${subject.replace(/\W/g, "")}@remote.test>`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      "Content-Type: text/calendar; charset=utf-8; method=REQUEST",
      "",
      "BEGIN:VCALENDAR",
      "METHOD:REQUEST",
      "SUMMARY:Printed planning",
      "END:VCALENDAR",
      "",
    ].join("\r\n"),
  });

  // The UID comes from the listing rather than from opening the message: the
  // reader asks for part "null" of this message too, which is not the print
  // page's to fix here.
  await login(page);
  const listing = await page.request.get("/mailboxes/INBOX?page=0&refresh=true");
  const body = (await listing.json()) as { Messages?: { UID: string; Envelope?: { Subject?: string } }[] | null };
  const uid = (body.Messages ?? []).find((m) => m.Envelope?.Subject === subject)?.UID;
  expect(uid, "the listing holds the invitation").toBeTruthy();

  const tab = await page.context().newPage();
  await tab.addInitScript(() => {
    window.print = () => {};
  });
  await tab.goto(`/#/print?mailbox=INBOX&uid=${uid}`);

  const printed = tab.locator("print-page");
  await expect(printed.locator(".print-header h2")).toHaveText(subject);
  await expect(printed.locator(".print-body pre")).toContainText("SUMMARY:Printed planning");
  await tab.close();
});
