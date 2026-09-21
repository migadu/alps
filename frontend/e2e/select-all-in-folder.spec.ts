// Acting on a whole folder, not on the page of it that is loaded.
//
// The header checkbox reaches as far as the rows on screen. Past that the list
// offers the folder itself, and the gesture that follows names the folder
// rather than a list of UIDs: the server searches it and acts on what it
// finds, so the messages no page has shown are taken too.
//
// Each test works in a folder of its own, because the account's INBOX is shared
// with every other spec and these assertions are about counts. The page size is
// lowered so that three messages are more than one page; the settings live on
// the IMAP server and are shared too, so `resetSettings` puts them back.

import type { APIRequestContext, Page } from "@playwright/test";
import { deliver, expect, login, resetSettings, test } from "./fixtures";

/** A word delivered nowhere else. */
function token(): string {
  return `zq${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6).padEnd(4, "x")}`;
}

function listRow(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/** The banner that offers the folder, and then reports it. */
function selectionBanner(page: Page) {
  return page.locator("alps-message-list alps-banner").filter({ hasText: /selected/ });
}

const asPage = (page: Page) => ({ Origin: new URL(page.url()).origin, "Content-Type": "application/json" });

const path = (folder: string) => encodeURIComponent(encodeURIComponent(folder));

/** Puts the page size back, so a listing read for an assertion holds everything. */
async function fullPages(page: Page): Promise<void> {
  await page.request.put("/settings", { headers: asPage(page), data: { messages_per_page: 50 } });
}

/** The subjects a folder's first page holds, newest first. */
async function subjectsIn(request: APIRequestContext, folder: string): Promise<string[]> {
  const response = await request.get(`/mailboxes/${path(folder)}?page=0`);
  if (!response.ok()) throw new Error(`listing ${folder} failed: ${response.status()}`);
  const body = (await response.json()) as { Messages?: { Envelope?: { Subject?: string } }[] | null };
  return (body.Messages ?? []).map((m) => m.Envelope?.Subject ?? "");
}

/**
 * Three messages in a folder of their own, newest last in the returned list,
 * with the page size set so that only two of them are ever on screen.
 */
async function folderOfThree(page: Page, name: string): Promise<string[]> {
  const word = token();
  const subjects = [`Whole folder A ${word}`, `Whole folder B ${word}`, `Whole folder C ${word}`];
  for (const subject of subjects) await deliver({ subject, body: "One of a set." });

  await login(page);
  await page.request.post("/mailboxes", {
    headers: { Origin: new URL(page.url()).origin },
    form: { name },
  });

  // The three just delivered are the newest in the INBOX, so its first page
  // holds them whatever else the other specs have left behind.
  const listing = await page.request.get("/mailboxes/INBOX?page=0");
  const body = (await listing.json()) as { Messages?: { UID: string; Envelope?: { Subject?: string } }[] | null };
  const uids = (body.Messages ?? [])
    .filter((m) => subjects.includes(m.Envelope?.Subject ?? ""))
    .map((m) => String(m.UID));
  expect(uids).toHaveLength(3);
  const moved = await page.request.put(`/mailboxes/INBOX/messages/move`, {
    headers: asPage(page),
    data: { uids, to: name },
  });
  expect(moved.ok()).toBe(true);

  await page.request.put("/settings", { headers: asPage(page), data: { messages_per_page: 2 } });
  return subjects;
}

/** Opens the folder and waits for its listing. */
async function open(page: Page, folder: string): Promise<void> {
  const listed = page.waitForResponse((r) => new URL(r.url()).pathname === `/mailboxes/${folder}` && r.ok());
  await page.goto(`/#/mailbox/${encodeURIComponent(folder)}`);
  await listed;
  await expect(page.locator("alps-message-list .message-item")).toHaveCount(2);
}

let folder = "";

test.afterEach(async ({ page }) => {
  if (folder) {
    await page.request.delete(`/mailboxes/${path(folder)}`, { headers: { Origin: new URL(page.url()).origin } }).catch(() => null);
    folder = "";
  }
  await resetSettings();
});

test("a whole folder is archived, the message no page showed included", async ({ page }) => {
  test.setTimeout(75_000);
  folder = `Bulk-${token()}`;
  const subjects = await folderOfThree(page, folder);
  await open(page, folder);

  await page.locator("alps-message-list input.select-all-checkbox").check();
  await expect(selectionBanner(page)).toContainText("All 2 messages on this page are selected");

  await selectionBanner(page).getByRole("button", { name: /Select all 3/ }).click();
  await expect(selectionBanner(page)).toContainText("All 3 messages");
  const reader = page.locator("alps-message-reader");
  await expect(reader.getByText("3 messages selected")).toBeVisible();

  // One request, naming the folder — not the two UIDs on screen.
  const archived = page.waitForResponse(
    (r) => r.request().method() === "PUT" && new URL(r.url()).pathname === `/mailboxes/${folder}/messages/move` && r.ok(),
  );
  await reader.getByRole("button", { name: "Archive", exact: true }).click();
  expect(JSON.parse((await archived).request().postData() ?? "{}")).toMatchObject({ all: true, query: "", except: [] });

  await expect(page.locator("alps-message-list .message-item")).toHaveCount(0);
  await fullPages(page);
  const archive = await subjectsIn(page.request, "Archive");
  for (const subject of subjects) expect(archive).toContain(subject);
  expect(await subjectsIn(page.request, folder)).toEqual([]);
});

test("a row unchecked after the folder was selected is left where it is", async ({ page }) => {
  test.setTimeout(75_000);
  folder = `Bulk-${token()}`;
  const subjects = await folderOfThree(page, folder);
  const kept = subjects[2]; // the newest, so it is on the first page
  await open(page, folder);

  await page.locator("alps-message-list input.select-all-checkbox").check();
  await selectionBanner(page).getByRole("button", { name: /Select all 3/ }).click();
  const reader = page.locator("alps-message-reader");
  await expect(reader.getByText("3 messages selected")).toBeVisible();

  await listRow(page, kept).locator("input.message-checkbox").uncheck();
  await expect(reader.getByText("2 messages selected")).toBeVisible();

  const archived = page.waitForResponse(
    (r) => r.request().method() === "PUT" && new URL(r.url()).pathname === `/mailboxes/${folder}/messages/move` && r.ok(),
  );
  await reader.getByRole("button", { name: "Archive", exact: true }).click();
  expect(JSON.parse((await archived).request().postData() ?? "{}").except).toHaveLength(1);

  await expect.poll(() => subjectsIn(page.request, folder), { timeout: 15_000 }).toEqual([kept]);
  await fullPages(page);
  const archive = await subjectsIn(page.request, "Archive");
  expect(archive).toContain(subjects[0]);
  expect(archive).toContain(subjects[1]);
  expect(archive).not.toContain(kept);
});
