// Filing mail by dragging it onto a folder in the sidebar.
//
// A drop is the Move to picker's move — an IMAP MOVE, reported with the same
// toast and taken back with the same Undo — and with Alt held it is the
// picker's copy. Drafts and Sent take no drops, and a refused drop must leave
// the message exactly where it was. Every test asks the server where the mail
// ended up, because a row leaving the list is only the page's word for it.

import type { APIRequestContext, Page } from "@playwright/test";
import { deliver, expect, login, test, toast } from "./fixtures";

/** Every folder created here carries it, so its litter is recognisable. */
const PREFIX = "e2e-drag-";

const litter = new Set<string>();

const path = (folder: string) => encodeURIComponent(encodeURIComponent(folder));

function row(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

/** A sidebar row, by the name it is drawn with. */
function folder(page: Page, title: string) {
  return page.locator(`alps-folder-list .folder-item[title="${title}"]`);
}

/** The subjects a folder's first page holds, as the server answers. */
async function subjectsIn(request: APIRequestContext, name: string): Promise<string[]> {
  const response = await request.get(`/mailboxes/${path(name)}?page=0&refresh=true`);
  if (!response.ok()) throw new Error(`listing ${name} failed: ${response.status()}`);
  const body = (await response.json()) as { Messages?: { Envelope?: { Subject?: string } }[] | null };
  return (body.Messages ?? []).map((m) => m.Envelope?.Subject ?? "");
}

/** Signs in with a folder of this test's own in the sidebar, and a message of its own in the Inbox. */
async function setUp(page: Page, what: string): Promise<{ name: string; subject: string }> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const name = `${PREFIX}${what}-${stamp}`;
  const subject = `Drag ${what} ${stamp}`;
  await deliver({ subject, body: "Filed by dragging." });

  await login(page);
  const created = await page.request.post("/mailboxes", {
    headers: { Origin: new URL(page.url()).origin },
    form: { name },
  });
  expect(created.ok()).toBe(true);
  litter.add(name);
  // The sidebar read its folders before this one existed.
  await page.reload();
  await expect(folder(page, name)).toBeVisible();
  await expect(row(page, subject)).toBeVisible();
  return { name, subject };
}

test.afterEach(async ({ page }) => {
  for (const name of litter) {
    await page.request
      .delete(`/mailboxes/${path(name)}`, { headers: { Origin: new URL(page.url()).origin } })
      .catch(() => null);
  }
  litter.clear();
});

test("dragging a message onto a folder moves it there, and Undo brings it back", async ({ page }) => {
  const { name, subject } = await setUp(page, "move");

  await row(page, subject).dragTo(folder(page, name));

  const moved = toast(page, `Message moved to ${name}`);
  await expect(moved).toBeVisible();
  await expect(row(page, subject)).toHaveCount(0);
  await expect.poll(() => subjectsIn(page.request, name)).toContain(subject);
  expect(await subjectsIn(page.request, "INBOX")).not.toContain(subject);

  await moved.getByRole("button", { name: "Undo" }).click();
  await expect(row(page, subject)).toBeVisible();
  await expect.poll(() => subjectsIn(page.request, name)).not.toContain(subject);
  expect(await subjectsIn(page.request, "INBOX")).toContain(subject);
});

test("dragging with Alt held copies the message, leaving it where it was", async ({ page }) => {
  const { name, subject } = await setUp(page, "copy");

  await page.keyboard.down("Alt");
  try {
    await row(page, subject).dragTo(folder(page, name));
  } finally {
    await page.keyboard.up("Alt");
  }

  // The COPY wording and only that: a move would say "moved".
  await expect(toast(page, `Message copied to ${name}`)).toBeVisible();
  await expect(row(page, subject)).toBeVisible();
  await expect.poll(() => subjectsIn(page.request, name)).toContain(subject);
  expect(await subjectsIn(page.request, "INBOX")).toContain(subject);
});

test("a drop on Drafts is refused, and the message stays in the Inbox", async ({ page }) => {
  const { name, subject } = await setUp(page, "refused");

  const moves: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PUT" && /\/messages\/(move|copy)$/.test(new URL(request.url()).pathname)) {
      moves.push(request.postData() ?? "");
    }
  });

  await row(page, subject).dragTo(folder(page, "Drafts"));
  // A control drop after the refused one, and its write awaited. Without it
  // nothing here could fail: the row is still listed the instant dragTo
  // returns whether or not a move is on its way. Requests leave the page in
  // order, so once the control's has been seen, a write from the refused drop
  // would have been seen before it.
  const control = page.waitForRequest((request) => (request.postData() ?? "").includes(name));
  await row(page, subject).dragTo(folder(page, name));
  await control;
  await expect(toast(page, `Message moved to ${name}`)).toBeVisible();

  expect(moves).toHaveLength(1);
  expect(moves[0]).toContain(name);
  expect(await subjectsIn(page.request, "Drafts")).not.toContain(subject);
});
