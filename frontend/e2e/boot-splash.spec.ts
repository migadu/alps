// The boot splash covers the page the app loaded on, never one a tab click
// lands on, in a real browser.
//
// Whether the boot was over used to be a `window` global that only the
// mailbox and contacts pages set. A session loaded on the calendar or the
// tasks page never set it, so the first switch from there to Messages drew
// the mailbox's full-window `<alps-initial-loader>`: everything below the
// header went white, then faded back in, the look of a reload. Contacts drew
// its own on every visit.
//
// The unit test (boot-splash.test.ts) pins the shell's half. This is the whole
// of it: the shell, the lazy plugin chunks, the pages' own splashes and a real
// server.

import type { Page } from "@playwright/test";
import { deliver, expect, login, seedContact, test } from "./fixtures";

const unique = () => Math.random().toString(36).slice(2, 8);

/**
 * Watches every frame for a splash that is up: an `<alps-initial-loader>`
 * anywhere in the app, shadow roots included, without `hidden`, and notes the
 * page that drew it. A splash stays up for at least the page's first read
 * plus 100 ms, many frames, so a frame-by-frame watch cannot miss one.
 *
 * Runs in the page, through `evaluate` or `addInitScript`, so it closes over
 * nothing.
 */
function watchForSplash(): void {
  const seen = new Set<string>();
  const find = (root: ParentNode) => {
    for (const el of root.querySelectorAll("*")) {
      if (el.localName === "alps-initial-loader" && !el.hasAttribute("hidden")) {
        const host = (el.getRootNode() as ShadowRoot).host;
        seen.add(host ? host.localName : "document");
      }
      if (el.shadowRoot) find(el.shadowRoot);
    }
  };
  const w = window as unknown as { __splashes: Set<string>; __splashWatch: boolean };
  w.__splashes = seen;
  w.__splashWatch = true;
  const tick = () => {
    if (!w.__splashWatch) return;
    find(document);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Stops the watch, and says which pages drew a splash while it ran. */
function splashesSeen(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = window as unknown as { __splashes: Set<string>; __splashWatch: boolean };
    w.__splashWatch = false;
    return [...w.__splashes];
  });
}

/** Reloads the app on `hash`, so that page is the one the boot draws. */
async function bootOn(page: Page, hash: string, ready: string): Promise<void> {
  await login(page);
  await page.goto(`/${hash}`);
  await page.reload();
  await expect(page.locator(`${ready} app-header`)).toBeVisible();
}

test("Messages, reached from a session loaded on the calendar, draws no boot splash", async ({ page }) => {
  const subject = `Boot splash ${unique()}`;
  await deliver({ subject });
  await bootOn(page, "#/calendar", "calendar-page");

  await page.evaluate(watchForSplash);
  await page.locator('calendar-page .nav-tab[title="Messages"]').click();
  await expect(page.locator("alps-message-list .message-item").filter({ hasText: subject })).toBeVisible();

  expect(await splashesSeen(page)).toEqual([]);
});

test("Contacts, reached from a session loaded on the tasks page, draws no boot splash", async ({ page }) => {
  const id = unique();
  const name = `Boot Splash ${id}`;
  await seedContact({ uid: `boot-splash-${id}`, name, email: `boot-splash-${id}@example.test` });
  await bootOn(page, "#/tasks", "tasks-page");

  await page.evaluate(watchForSplash);
  await page.locator('tasks-page .nav-tab[title="Contacts"]').click();
  await expect(page.locator("contacts-page").getByText(name)).toBeVisible();

  expect(await splashesSeen(page)).toEqual([]);
});

test("the page the app loaded on still covers itself until its first listing", async ({ page }) => {
  // The other half of the rule: the boot's own page keeps its splash, so the
  // fix did not simply turn it off.
  await login(page);
  await page.goto("/#/contacts");
  await page.addInitScript(watchForSplash);
  await page.reload();
  await expect(page.locator("contacts-page app-header")).toBeVisible();
  await expect(page.locator("contacts-page alps-initial-loader")).toHaveAttribute("hidden", "");

  expect(await splashesSeen(page)).toEqual(["contacts-page"]);
});
