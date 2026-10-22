// Direction: mail written in a right-to-left script reads right to left in an
// English interface, a reply sends it back that way, and a direction override
// in a display name stays inside the name.
//
// jsdom resolves `dir="auto"` but lays nothing out, so what the unit tests
// cannot see is checked here in a real browser: the direction Chromium gives
// the body, the side the quote bar is drawn on, and the order the glyphs of
// an address actually land in.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, test, toast, USER, waitForSent, type SentMessage } from "./fixtures";

const ARABIC = "مرحبًا بالعالم، هذه رسالة تجريبية.";
const OVERRIDE_NAME = "Pay‮ments";

const encodedWord = (value: string) => `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;

/** A plain-text message, its body base64 so the Arabic arrives as written. */
function rfc822(subject: string, to: string, body: string): string {
  return [
    "From: Ada Lovelace <ada@remote.test>",
    `To: ${to}`,
    `Subject: ${subject}`,
    `Message-ID: <${subject.replace(/\W/g, "")}@remote.test>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body, "utf8").toString("base64"),
    "",
  ].join("\r\n");
}

const readerBody = (page: Page) => page.locator("alps-message-reader > .reader-body");
const plainBody = (page: Page) => readerBody(page).locator("> .message-content pre.reader-preformatted");
const composer = (page: Page) => page.locator("alps-floating-composer");

async function openMessage(page: Page, subject: string): Promise<void> {
  await page.locator("alps-message-list .message-subject", { hasText: subject }).first().click();
  await expect(plainBody(page)).toContainText("مرحبًا");
}

/** The x position of each letter of the first run of `word` in `element`, in DOM order. */
function glyphPositions(element: Locator, word: string): Promise<number[]> {
  return element.evaluate((root, word) => {
    // Through shadow roots too: the pill draws its text in its own.
    const walk = (node: Node): number[] | null => {
      if (node instanceof Element && node.shadowRoot) {
        const inner = walk(node.shadowRoot);
        if (inner) return inner;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        const at = (node.textContent ?? "").indexOf(word);
        if (at >= 0) {
          return Array.from(word, (_, i) => {
            const range = document.createRange();
            range.setStart(node, at + i);
            range.setEnd(node, at + i + 1);
            return range.getBoundingClientRect().x;
          });
        }
      }
      for (const child of Array.from(node.childNodes)) {
        const found = walk(child);
        if (found) return found;
      }
      return null;
    };
    return walk(root) ?? [];
  }, word);
}

/** The text/html part of a submission, its quoted-printable undone. */
function htmlPart(message: SentMessage): string {
  const start = message.data.search(/Content-Type:\s*text\/html/i);
  const decoded = message.data
    .slice(start)
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  return Buffer.from(decoded, "latin1").toString("utf8");
}

test.afterEach(async ({ page }) => {
  const open = composer(page).first();
  if (!(await open.locator(".window-frame").isVisible().catch(() => false))) return;
  await open.locator(".send-actions").getByRole("button", { name: "Discard", exact: true }).click({ timeout: 2_000 }).catch(() => {});
  await open.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true }).click({ timeout: 2_000 }).catch(() => {});
});

test("a right-to-left plain-text message is laid out right to left", async ({ page }) => {
  const subject = `Direction plain ${Date.now()}`;
  await deliver({ subject, raw: rfc822(subject, USER.address, `${ARABIC}\nEnglish line.`) });

  await login(page);
  await openMessage(page, subject);

  const layout = await plainBody(page).evaluate((el) => [el.matches(":dir(rtl)"), getComputedStyle(el).unicodeBidi]);
  expect(layout).toEqual([true, "plaintext"]);
});

test("a direction override in a recipient's name cannot reverse the address after it", async ({ page }) => {
  const subject = `Direction override ${Date.now()}`;
  await deliver({ subject, raw: rfc822(subject, `${encodedWord(OVERRIDE_NAME)} <${USER.address}>`, ARABIC) });

  await login(page);
  await openMessage(page, subject);

  const pill = readerBody(page).locator(".reader-recipients-list alps-recipient-pill").first();
  const local = USER.address.split("@")[0];
  const positions = await glyphPositions(pill, local);
  expect(positions.length).toBe(local.length);
  for (let i = 1; i < positions.length; i++) expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
});

test("a reply quotes a right-to-left message right to left, its bar on the right, and sends it so", async ({ page }) => {
  const subject = `Direction reply ${Date.now()}`;
  await deliver({ subject, raw: rfc822(subject, USER.address, ARABIC) });

  await login(page);
  await openMessage(page, subject);
  await page.locator('alps-message-reader alps-toolbar alps-icon-btn[title="Reply"]').click();

  const quote = composer(page).locator("alps-message-composer .ProseMirror blockquote");
  await expect(quote).toContainText("مرحبًا");
  const drawn = await quote.evaluate((el) => {
    const style = getComputedStyle(el);
    return { rtl: el.matches(":dir(rtl)"), left: style.borderLeftWidth, right: style.borderRightWidth };
  });
  expect(drawn.rtl).toBe(true);
  expect(drawn.left).toBe("0px");
  expect(drawn.right).not.toBe("0px");

  await composer(page).locator(".send-actions").getByRole("button", { name: "Send", exact: true }).click();
  const sending = toast(page, "Message is being sent");
  await expect(sending).toBeVisible();
  await sending.locator(".dismiss-btn").click();
  await expect(composer(page)).toHaveCount(0, { timeout: 20_000 });

  const sent = await waitForSent((m) => m.data.includes(`Re: ${subject}`), 20_000);
  const blockquote = /<blockquote\b[^>]*>/.exec(htmlPart(sent))?.[0] ?? "";
  expect(blockquote).toContain('dir="rtl"');
  // As the browser serializes it: the quote passes through the composer's DOM.
  expect(blockquote).toMatch(/border-right:\s*1px solid/);
  expect(blockquote).not.toContain("border-left");
});
