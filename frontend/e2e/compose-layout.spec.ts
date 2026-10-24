// The composer's layout under many attachments.
//
// Geometry is the one thing the jsdom suite cannot see, and this defect was
// geometry: the window kept its 500px and the attachment tray took its room
// from the message body, row by row. Sixteen files left a body 34px tall, less
// than the formatting toolbar, which then spilled over the tray's header so
// that only the header's caret showed, beside the toolbar's last button.
//
// Now the window grows by the tray's height, up to what the viewport allows;
// the tray stops at four and a half rows of pills and scrolls past them, under
// a header that stays put; and where the viewport cannot fit both, the body
// keeps a floor of 200px and the tray scrolls instead.

import type { Locator, Page } from "@playwright/test";
import { expect, login, test } from "./fixtures";

const composerOf = (page: Page) => page.locator("alps-floating-composer");

async function openComposer(page: Page): Promise<Locator> {
  await page.locator("alps-folder-list alps-create-button").click();
  const composer = composerOf(page);
  await expect(composer.locator(".window-frame")).toBeVisible();
  return composer;
}

async function discardDraft(composer: Locator): Promise<void> {
  await composer.locator(".send-actions").getByRole("button", { name: "Discard", exact: true }).click();
  await composer.locator("ui-confirm").getByRole("button", { name: "Discard", exact: true }).click();
  await expect(composer).toHaveCount(0);
}

/** Attaches `n` small files to the `held` already there and waits for every
 * upload to land. */
async function attach(page: Page, composer: Locator, n: number, held = 0): Promise<void> {
  const chooser = page.waitForEvent("filechooser");
  await composer.locator('alps-icon-btn[icon="paperclip"]').click();
  await (await chooser).setFiles(
    Array.from({ length: n }, (_, i) => ({
      name: `attachment-${String(held + i + 1).padStart(2, "0")}.txt`,
      mimeType: "text/plain",
      buffer: Buffer.alloc(2048, 120),
    })),
  );
  await expect(composer.locator("alps-attachment-pill")).toHaveCount(held + n);
  await expect(composer.locator("alps-attachment-pill .progress-bar")).toHaveCount(0, { timeout: 20_000 });
}

const box = async (locator: Locator) => (await locator.boundingBox())!;
const height = async (locator: Locator) => (await locator.boundingBox())?.height ?? 0;

/** A box's height once the window's geometry transition has settled. */
async function settledHeight(locator: Locator): Promise<number> {
  let last = -1;
  await expect
    .poll(async () => {
      const now = await height(locator);
      const settled = now === last;
      last = now;
      return settled;
    }, { intervals: [150] })
    .toBe(true);
  return last;
}

test("attachments grow the window instead of covering the body", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  const composer = await openComposer(page);
  const frame = composer.locator(".window-frame");
  const body = composer.locator(".composer-wrapper");
  const before = { window: await settledHeight(frame), body: await height(body) };

  // Three rows of pills at the composer's width.
  await attach(page, composer, 6);
  const grown = await settledHeight(frame);

  // The tray's room came from the window, not the body, and all of it shows.
  expect(grown).toBeGreaterThan(before.window + 100);
  expect(await height(body)).toBeGreaterThanOrEqual(before.body - 2);
  const tray = composer.locator("alps-attachment-list .attachments-container");
  const overflow = () => tray.evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(await overflow()).toBeLessThanOrEqual(1);

  // Six rows: past its cap the tray scrolls rather than grow on, and the body
  // still loses nothing.
  await attach(page, composer, 6, 6);
  const capped = await settledHeight(frame);
  expect(await height(tray)).toBeLessThanOrEqual(205);
  expect(await overflow()).toBeGreaterThan(40);
  expect(await height(body)).toBeGreaterThanOrEqual(before.body - 2);
  // Its header totals the files against the budget, beside the caret.
  await expect(composer.locator("alps-attachment-list .attachments-size")).toHaveText("24 KB / 32 MB");

  // Collapsing the tray gives the room back.
  await composer.locator("alps-attachment-list .caret").click();
  expect(await settledHeight(frame)).toBeLessThan(capped - 100);

  await discardDraft(composer);
});

test("where the window cannot grow enough, the tray scrolls and the body keeps its floor", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 680 });
  await login(page);
  const composer = await openComposer(page);
  const frame = composer.locator(".window-frame");

  await attach(page, composer, 16);
  await settledHeight(frame);

  // The send row is still on screen.
  const placed = await box(frame);
  expect(placed.y + placed.height).toBeLessThanOrEqual(680 + 1);
  await expect(composer.locator(".send-actions").getByRole("button", { name: "Send", exact: true })).toBeInViewport();
  // The body keeps a usable height, and the tray's header starts below it:
  // a squeezed body let the formatting toolbar spill over that header.
  const body = await box(composer.locator(".composer-wrapper"));
  expect(body.height).toBeGreaterThanOrEqual(199);
  const header = composer.locator("alps-attachment-list .attachments-header");
  expect((await box(header)).y).toBeGreaterThanOrEqual(body.y + body.height - 1);
  // The tray scrolls, and ends where the send row begins.
  const tray = composer.locator("alps-attachment-list .attachments-container");
  expect(await tray.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(20);
  const sendRow = await box(composer.locator(".send-row"));
  const squeezed = await box(tray);
  expect(squeezed.y + squeezed.height).toBeLessThanOrEqual(sendRow.y + 1);

  // Scrolled to its last row, the header stays at the tray's top, with the
  // figure and the caret in reach.
  await tray.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  expect((await box(header)).y).toBeGreaterThanOrEqual(squeezed.y - 1);
  await expect(composer.locator("alps-attachment-list .attachments-size")).toBeInViewport();
  await expect(composer.locator("alps-attachment-list .caret")).toBeInViewport();

  await discardDraft(composer);
});
