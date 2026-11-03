// Coming back to Messages from another tab finds both lists where they were
// left, in a real browser.
//
// The mailbox page is kept for the session while Calendar, Contacts or Tasks
// shows, out of the document in between, and a browser drops the scroll
// offset of an element out of the document. Coming back put the message list
// and the folder list at the top, whatever the user had scrolled to. The unit
// test (mailbox-scroll-kept.test.ts) stands a scroll offset in for jsdom's
// missing layout; this is the browser's own.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, test } from "./fixtures";

const unique = () => Math.random().toString(36).slice(2, 8);

/** Every folder created here, for teardown: the account is every spec's. */
const litter = new Set<string>();

test.afterEach(async ({ page }) => {
  for (const name of litter) {
    await page.request.delete(`/mailboxes/${encodeURIComponent(encodeURIComponent(name))}`).catch(() => null);
  }
  litter.clear();
});

/** Scrolls `scroller` the way a wheel does, by its own offset, and waits for
 * the scroll event to have been handled. Returns where it came to rest. */
async function scrollDown(page: Page, scroller: Locator, by: number): Promise<number> {
  const top = await scroller.evaluate((el, delta) => {
    el.scrollTop += delta;
    return el.scrollTop;
  }, by);
  // A scroll event is dispatched with the next frame.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  return top;
}

test("the message list and the folder list keep their place across a tab switch", async ({ page }) => {
  // Short, so a few folders overflow the sidebar and a few messages the list.
  await page.setViewportSize({ width: 1280, height: 520 });
  const id = unique();
  const subjects = Array.from({ length: 20 }, (_, i) => `Kept place ${id} ${String(i).padStart(2, "0")}`);
  for (const subject of subjects) await deliver({ subject });

  await login(page);
  for (let i = 0; i < 10; i++) {
    const name = `Kept place ${id} ${i}`;
    litter.add(name);
    const response = await page.request.post("/mailboxes", { form: { name } });
    expect(response.ok(), `creating ${name}`).toBe(true);
  }
  await page.reload();

  const rows = page.locator("mailbox-page alps-message-list .list-content");
  const folders = page.locator("mailbox-page alps-folder-list .sidebar-content");
  await expect(rows.locator(".message-item").filter({ hasText: subjects[subjects.length - 1] })).toBeVisible();
  await expect(folders.locator(`.folder-item[title="Kept place ${id} 9"]`)).toBeAttached();

  const rowsAt = await scrollDown(page, rows, 300);
  const foldersAt = await scrollDown(page, folders, 120);
  expect(rowsAt, "the message list does not scroll at this size").toBeGreaterThan(0);
  expect(foldersAt, "the folder list does not scroll at this size").toBeGreaterThan(0);

  await page.locator('mailbox-page .nav-tab[title="Calendar"]').click();
  await expect(page.locator("calendar-page app-header")).toBeVisible();
  await expect(page.locator("mailbox-page")).toHaveCount(0);

  await page.locator('calendar-page .nav-tab[title="Messages"]').click();
  await expect(rows).toBeVisible();
  await expect.poll(() => rows.evaluate((el) => el.scrollTop)).toBe(rowsAt);
  await expect.poll(() => folders.evaluate((el) => el.scrollTop)).toBe(foldersAt);
});
