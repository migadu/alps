// New mail pushed to the browser as the mail server announces it.
//
// alps waits for news of the Inbox on the session's background connection
// (IMAP IDLE) while a mail page holds its event stream open (GET /events),
// and the page checks for new mail on each piece of news, as a poll would.
// scripts/e2e.sh turns push on ([server] push_new_mail). sora re-checks a
// mailbox in IDLE every 15 seconds, so news can take that long to come; a
// poll is far longer away in these tests. Pushed are arrivals and removals
// in the Inbox; flags come with the poll.
//
// scripts/e2e.sh pushes the subscribed folders too ([server]
// push_subscribed_folders), which sora tells of with NOTIFY, every 15 seconds
// as well.
//
// The stream is a request held open, and a browser lets a page hold six to a
// host at once, so one tab of a browser holds it and tells the others.

import type { Page, Request } from "@playwright/test";
import { deliver, expect, login, mailboxElsewhere, resetSettings, test } from "./fixtures";

const asPage = (page: Page) => ({ Origin: new URL(page.url()).origin, "Content-Type": "application/json" });

function listRow(page: Page, subject: string) {
  return page.locator("alps-message-list .message-item").filter({ hasText: subject });
}

const isStream = (request: Request) => new URL(request.url()).pathname === "/events";

/** The folder list, painted once a listing has landed. */
function sidebar(page: Page) {
  return page.locator('alps-folder-list .folder-item[title="Archive"]');
}

/** Long enough for sora's next look at the Inbox, and for the check after it. */
const NEWS = { timeout: 40_000 };

/**
 * Has the page note what its event streams say, for a test to wait until the
 * stream says it watches the folders: news of a change made before would not
 * come, and a check the page makes is no sure sign of the stream.
 */
async function recordStream(page: Page) {
  await page.addInitScript(() => {
    const said: string[] = [];
    (window as any).__streamSaid = said;
    const Original = window.EventSource;
    window.EventSource = class extends Original {
      constructor(url: string | URL, init?: EventSourceInit) {
        super(url, init);
        for (const type of ["watching", "inbox", "folder"]) {
          this.addEventListener(type, (e) => said.push(`${type} ${(e as MessageEvent).data}`));
        }
      }
    } as typeof EventSource;
  });
}

async function streamSaid(page: Page, what: string) {
  await expect.poll(() => page.evaluate(() => (window as any).__streamSaid ?? []), { timeout: 20_000 }).toContain(what);
}

/** Files the message called subject from a folder (the Inbox) into another, from another session of the account. */
async function fileElsewhere(page: Page, subject: string, folder: string, from = "INBOX") {
  const other = await page.context().browser()!.newContext();
  try {
    const elsewhere = await other.newPage();
    await login(elsewhere);
    const response = await elsewhere.request.get(`/mailboxes/${encodeURIComponent(from)}?page=0&refresh=true`);
    expect(response.ok()).toBe(true);
    const data = await response.json();
    const found = (data.Messages ?? []).flatMap((m: any) => [m, ...(m.SubMessages ?? [])])
      .find((m: any) => m.Envelope?.Subject === subject);
    expect(found, `"${subject}" is in ${from}`).toBeTruthy();
    const moved = await elsewhere.request.put(`/mailboxes/${encodeURIComponent(from)}/messages/move`, {
      headers: asPage(elsewhere), data: { uids: [String(found.UID)], to: folder },
    });
    expect(moved.ok(), "the message is filed").toBe(true);
  } finally {
    await other.close();
  }
}

test.afterEach(async () => {
  await resetSettings();
});

test("mail delivered while the next poll is an hour away appears without waiting for it", async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.request.put("/settings", { headers: asPage(page), data: { check_mail_interval: 60 } });

  // The page checks once the server says it waits for news ("watching"), and
  // that check is the sign that the IDLE has begun: mail delivered before it
  // would be found by that check, which is not what this test is about.
  let streamUp = false;
  const stream = page.waitForResponse((response) => {
    if (!isStream(response.request())) return false;
    streamUp = true;
    return true;
  }, { timeout: 15_000 });
  const watching = page.waitForRequest((request) =>
    streamUp && new URL(request.url()).pathname === "/mailboxes/INBOX/status", { timeout: 15_000 });
  await page.reload();
  expect((await stream).status()).toBe(200);
  await expect(sidebar(page)).toBeVisible();
  await watching;

  const subject = `Pushed ${Date.now()}`;
  await deliver({ subject, body: "Here before the poll." });
  await expect(listRow(page, subject)).toBeVisible(NEWS);
});

test("two tabs hold one event stream between them, both hear it, and the other takes it on", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  await page.request.put("/settings", { headers: asPage(page), data: { check_mail_interval: 60 } });
  // Off the mail page, so that the stream it opened is gone before the
  // counting begins.
  await page.goto("about:blank");

  // Every stream asked for from here on, the tab that asked, and whether it
  // has ended.
  const context = page.context();
  const streams: { request: Request; tab: Page }[] = [];
  const ended = new Set<Request>();
  context.on("request", (request) => {
    if (isStream(request)) streams.push({ request, tab: request.frame().page() });
  });
  context.on("requestfinished", (request) => ended.add(request));
  context.on("requestfailed", (request) => ended.add(request));
  const open = () => streams.filter((s) => !ended.has(s.request)).map((s) => s.tab);

  await page.goto("/#/mailbox/INBOX");
  await expect(sidebar(page)).toBeVisible();
  await expect.poll(() => streams.length).toBe(1);

  const second = await context.newPage();
  await second.goto("/#/mailbox/INBOX");
  await expect(sidebar(second)).toBeVisible();
  // Time for the second tab to open a stream of its own, were it to.
  await second.waitForTimeout(3_000);
  expect(streams.map((s) => s.tab), "the tabs that asked for an event stream").toEqual([page]);
  expect(open(), "the tabs holding an event stream").toEqual([page]);

  const subject = `Pushed to both ${Date.now()}`;
  await deliver({ subject, body: "For every tab." });
  await expect(listRow(second, subject)).toBeVisible(NEWS);
  await expect(listRow(page, subject)).toBeVisible();

  await page.close();
  await expect.poll(() => streams.length, { timeout: 15_000 }).toBe(2);
  expect(streams[1].tab, "the tab that took the stream on").toBe(second);
  await second.close();
});

test("mail filed into a subscribed folder elsewhere appears in it, on screen, without waiting for the poll", async ({ page }) => {
  test.setTimeout(120_000);
  await mailboxElsewhere("subscribe", "Archive");
  const first = `Filed ${Date.now()}`;
  const second = `Filed next ${Date.now()}`;
  await deliver({ subject: first, body: "Filed by another program." });
  await deliver({ subject: second, body: "Filed by another program, later." });
  await recordStream(page);
  await login(page);
  await page.request.put("/settings", { headers: asPage(page), data: { check_mail_interval: 60 } });
  await page.goto("/#/mailbox/Archive");
  await page.reload();
  await streamSaid(page, "watching SUBSCRIBED");

  // The page checks the folder as the stream comes up, and that check may
  // read the folder after the first is filed: the second, filed once the
  // first is shown, is the one only the news can bring.
  await fileElsewhere(page, first, "Archive");
  await expect(listRow(page, first)).toBeVisible(NEWS);
  await expect(listRow(page, second)).toHaveCount(0);
  await fileElsewhere(page, second, "Archive");
  await expect(listRow(page, second)).toBeVisible(NEWS);
});

test("mail filed into a subscribed folder elsewhere counts in the sidebar while the Inbox is on screen", async ({ page }) => {
  test.setTimeout(120_000);
  await mailboxElsewhere("subscribe", "Archive");
  const subject = `Filed unread ${Date.now()}`;
  // Filed from a folder of its own, not from the Inbox: news of the Inbox
  // has the page read every folder's counts again, Archive's among them.
  const holding = `Holding ${Date.now()}`;
  await mailboxElsewhere("create", holding);
  await deliver({ subject, body: "Filed by another program, unread." });
  await fileElsewhere(page, subject, holding);
  await recordStream(page);
  await login(page);
  await page.request.put("/settings", { headers: asPage(page), data: { check_mail_interval: 60 } });
  await page.reload();
  await streamSaid(page, "watching SUBSCRIBED");
  await expect(sidebar(page)).toBeVisible();
  const badge = sidebar(page).locator(".folder-badge");
  const before = Number((await badge.count()) ? await badge.textContent() : 0);

  await fileElsewhere(page, subject, "Archive", holding);
  await streamSaid(page, "folder Archive");
  await expect(badge).toHaveText(String(before + 1), NEWS);
});
