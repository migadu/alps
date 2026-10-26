// Links in mail, against a real IMAP server.
//
// A plain-text body was shown as text: a URL or an address in it could not
// be clicked. A mailto: link in an HTML body opened the system's mail
// program, or nothing, instead of alps's composer.

import type { Page } from "@playwright/test";
import { deliver, expect, login, test, USER } from "./fixtures";

const reader = (page: Page) => page.locator("alps-message-reader");
const composer = (page: Page) => page.locator("alps-floating-composer");
/** The To field's chips; each holds the whole address in its `title`. */
const toPills = (page: Page) =>
  composer(page)
    .locator(".field-row")
    .filter({ has: page.locator("span.field-label", { hasText: /^To$/ }) })
    .locator("alps-address-input .pill");

async function open(page: Page, subject: string) {
  await page.locator("alps-message-list .message-subject", { hasText: subject }).first().click();
}

test("a URL and an address in a plain-text message are links, and the address opens the composer", async ({ page }) => {
  const subject = `Links ${Date.now()}`;
  await deliver({ subject, body: "See https://example.com/a, or write to ada@example.com." });
  await login(page);
  await open(page, subject);

  const body = reader(page).locator("pre.reader-preformatted");
  await expect(body).toContainText("See https://example.com/a, or write to ada@example.com.");
  const web = body.locator("a", { hasText: "https://example.com/a" });
  await expect(web).toHaveAttribute("href", "https://example.com/a");
  await expect(web).toHaveAttribute("target", "_blank");
  await expect(web).toHaveAttribute("rel", "noopener noreferrer");

  await body.locator("a", { hasText: "ada@example.com" }).click();
  await expect(toPills(page)).toHaveCount(1);
  await expect(toPills(page).first()).toHaveAttribute("title", /ada@example\.com/);
});

test("a mailto: link in an HTML message opens the composer with what the link names", async ({ page }) => {
  const subject = `Mailto ${Date.now()}`;
  await deliver({
    subject,
    raw: [
      "From: Ada Lovelace <ada@remote.test>",
      `To: ${USER.address}`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <e2e-mailto-${Date.now()}@remote.test>`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      '<p>Write to <a href="mailto:ada@example.com?subject=Engines%20again&bcc=eve@example.com">Ada</a>.</p>',
      "",
    ].join("\r\n"),
  });
  await login(page);
  await open(page, subject);

  await page.frameLocator("alps-message-reader iframe.reader-iframe").locator("a", { hasText: "Ada" }).click();
  await expect(toPills(page)).toHaveCount(1);
  await expect(toPills(page).first()).toHaveAttribute("title", /ada@example\.com/);
  await expect(composer(page).getByPlaceholder("Subject")).toHaveValue("Engines again");
  // A link may not copy anyone in unseen.
  await expect(composer(page).locator(".field-row").filter({ has: page.locator("span.field-label", { hasText: /^Bcc$/ }) })).toHaveCount(0);
});
