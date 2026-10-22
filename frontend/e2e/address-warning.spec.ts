// Lookalike addresses: a sender whose domain mixes alphabets is listed and read
// by its A-label, flagged, and the flag's tooltip says why; a local part that
// mixes alphabets has its foreign letters marked; a hidden direction control
// cannot turn the flag's words around.
//
// The unit tests hold the rules to jsdom. This holds them to an address as it
// really arrives, through sora's delivery, the IMAP envelope and alps's message
// JSON, and to what Chromium paints and lays out, which jsdom cannot tell.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, test } from "./fixtures";

/** CYRILLIC SMALL LETTER A, which looks exactly like the Latin `a`. */
const A = "а";
const LOOKALIKE = `p${A}ypal.example`;
const LOOKALIKE_ASCII = "xn--pypal-4ve.example";

const row = (page: Page, subject: string) => page.locator("alps-message-list .message-item").filter({ hasText: subject });
/** The sender's pill in the reader's own header, not in a thread card's. */
const senderPill = (page: Page) => page.locator("alps-message-reader > .reader-body .reader-sender-block alps-recipient-pill");

async function open(page: Page, subject: string): Promise<void> {
  await row(page, subject).first().click();
  await expect(page.locator("alps-message-reader > .reader-body .reader-subject")).toContainText(subject);
}

/** The x position of each letter of the first word of `element`'s text. */
function letterPositions(element: Locator): Promise<number[]> {
  return element.evaluate((root) => {
    const nodes = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (nodes.nextNode()) {
      const node = nodes.currentNode;
      const match = /\p{L}{3,}/u.exec(node.textContent ?? "");
      if (!match) continue;
      return Array.from(match[0], (_, i) => {
        const range = document.createRange();
        range.setStart(node, match.index + i);
        range.setEnd(node, match.index + i + 1);
        return range.getBoundingClientRect().x;
      });
    }
    return [];
  });
}

test("a sender whose domain mixes alphabets is shown by its A-label and flagged", async ({ page }) => {
  const subject = `Lookalike domain ${Date.now()}`;
  // Written in UTF-8 as RFC 6532 allows, the way such mail arrives.
  await deliver({ subject, from: `Payments <service@${LOOKALIKE}>` });

  await login(page);
  const sender = row(page, subject).locator(".message-sender");
  await expect(sender).toContainText(`Payments <service@${LOOKALIKE_ASCII}>`);
  await expect(sender).not.toContainText(LOOKALIKE);
  await expect(sender.locator(".address-warning")).toHaveText("⚠ address mixes alphabets");

  await open(page, subject);
  const pill = senderPill(page);
  await expect(pill.locator(".recipient-link")).toContainText(`service@${LOOKALIKE_ASCII}`);
  const warning = pill.locator(".address-warning");
  await expect(warning).toHaveText("⚠ address mixes alphabets");
  // The tooltip explains, then names the domain as written beside its A-label.
  await expect(warning).toHaveAttribute(
    "title",
    "This address mixes letters from different alphabets, which can make it look like an address you know.\n" +
      `In ASCII, the domain ${LOOKALIKE} is spelled ${LOOKALIKE_ASCII}.`,
  );
  // Only the display changes: the pill still names, and writes to, the
  // address as the message carries it.
  await expect(pill.locator(".recipient-link")).toHaveAttribute("title", `service@${LOOKALIKE}`);
});

test("a local part that mixes alphabets has its foreign letter marked, on the theme's warning colour", async ({ page }) => {
  const subject = `Lookalike local part ${Date.now()}`;
  await deliver({ subject, from: `Payments <p${A}ypal@remote.test>` });

  await login(page);
  await open(page, subject);
  const pill = senderPill(page);
  const mark = pill.locator("mark.mixed-script");
  await expect(mark).toHaveText(A);
  await expect(pill.locator(".address-warning")).toHaveAttribute(
    "title",
    "This address mixes letters from different alphabets, which can make it look like an address you know.",
  );

  // Painted as the warning it is: not the browser's fixed yellow, and not
  // left transparent.
  const ground = await mark.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(ground).not.toBe("rgb(255, 255, 0)");
  expect(ground).not.toBe("rgba(0, 0, 0, 0)");
});

test("a direction control in the address cannot reverse its warning", async ({ page }) => {
  const subject = `Direction control address ${Date.now()}`;
  await deliver({ subject, from: "Payments <user‮@remote.test>" });

  await login(page);
  await open(page, subject);
  const warning = senderPill(page).locator(".address-warning");
  await expect(warning).toHaveText("⚠ hidden direction marks");
  await expect(warning).toHaveAttribute("title", "Hidden direction marks can reorder how this address is displayed.");
  // Measured where the glyphs land: the DOM's text is the same whether or not
  // an override reverses what the user sees.
  const positions = await letterPositions(warning);
  expect(positions.length).toBeGreaterThan(2);
  for (let i = 1; i < positions.length; i++) expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
});

test("an internationalized domain in one script is shown in it, with no warning", async ({ page }) => {
  const subject = `Single-script domain ${Date.now()}`;
  await deliver({ subject, from: "Bücher <info@xn--bcher-kva.example>" });

  await login(page);
  await open(page, subject);
  const pill = senderPill(page);
  await expect(pill.locator(".recipient-link")).toContainText("info@bücher.example");
  await expect(pill.locator(".address-warning")).toHaveCount(0);
});
