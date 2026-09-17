// What happens when the session lapses under a user who is still working.
//
// This is the most ordinary way the app breaks: alps keeps sessions in
// memory, so an idle timeout, the absolute cap or a server restart ends one
// while the tab still holds its cookie, and every long-lived tab eventually
// meets it. The jsdom suite asserts that fetch-utils dispatches `auth-error` on
// a 401 and that app-root routes on that event; nothing joined the two through
// a real browser against a real refusal.
//
// Both kinds of page are exercised deliberately. The mail services always
// handled their own 401. The plugin pages did NOT: Calendar, Tasks and
// Contacts reached the server through fetch helpers that never dispatched
// `auth-error`, so an expired session there left the user looking at "failed
// to load" with nothing sending them back to sign in. Announcing every 401 in
// `fetchWithTimeout` fixed that; these tests keep it fixed.
//
// The session is expired by giving the browser a session token the server
// does not know, which is exactly what the tab holds after the server has
// dropped its session: the cookie is still sent, the marker cookie still says
// "signed in", and the server answers 401 and clears both. The session the
// run shares is left running on the server, untouched.

import type { Page } from "@playwright/test";
import { allowConsoleErrors, expect, login, signIn, test } from "./fixtures";

/** Chromium logs a console error for every non-2xx RESPONSE: a network log
 * line, not something the app wrote. These tests provoke a 401 on purpose. */
const EXPECTED_REFUSALS = [/status of 401/];

const EXPIRED_NOTICE = "Your session has expired. Please sign in again.";

/** Swaps the tab's session token for one the server has never issued. */
async function expireSession(page: Page): Promise<void> {
  const context = page.context();
  const session = (await context.cookies()).find((c) => c.name === "alps_session");
  expect(session, "signed in without a session cookie").toBeDefined();
  await context.addCookies([{ ...session!, value: `expired-${session!.value}` }]);
}

/** The Archive folder in the sidebar: on screen once the mailbox has painted. */
function archiveFolder(page: Page) {
  return page.locator('alps-folder-list .folder-item[title="Archive"]');
}

test("an expired session on the mailbox routes back to sign-in", async ({ page }) => {
  await login(page);
  // Let the mailbox PAINT before expiring the session. Expired any earlier, the
  // first-paint requests race it: those 401 and the app routes to login on its
  // own, the right behaviour, but then there is no folder left to click.
  await expect(archiveFolder(page)).toBeVisible();
  allowConsoleErrors(page, ...EXPECTED_REFUSALS);

  // The session lapses while the tab sits there.
  await expireSession(page);

  // Any action that touches the server will now be refused. Switching folders
  // is the most ordinary one a person performs. Best-effort: background
  // traffic (a sync) may hit the 401 first and route to login before the click
  // lands, which is the property under test succeeding early, not a failure.
  await archiveFolder(page).click({ timeout: 5_000 }).catch(() => {});

  await page.waitForURL(/#\/login/, { timeout: 15_000 });
  // And it says WHY, rather than dumping the user on a bare login form as
  // though they had signed out on purpose.
  await expect(page.locator("login-page").getByText(EXPIRED_NOTICE)).toBeVisible();
  // The server cleared the marker along with the session, so nothing will
  // mount the mailbox again for a session that is gone.
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "alps_logged_in")).toBeUndefined();
  expect(cookies.find((c) => c.name === "alps_session")).toBeUndefined();
});

/** Opens Tasks and waits for its first read, so the expiry cannot race it. */
async function openTasks(page: Page): Promise<void> {
  const loaded = page.waitForResponse((r) => new URL(r.url()).pathname === "/calendar/tasks");
  await page.goto("/#/tasks");
  await expect(page.locator("tasks-page")).toBeVisible();
  await loaded;
}

/**
 * Refreshes Tasks against the expired session and waits for THAT read's
 * refusal, so it is the page's own request under test, not some other one
 * that happened to be on its way.
 */
async function refreshTasks(page: Page): Promise<void> {
  const refused = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/calendar/tasks" && r.status() === 401,
  );
  await page.locator("tasks-page").getByRole("button", { name: "Refresh", exact: true }).click();
  await refused;
}

test("an expired session on the tasks page routes back to sign-in", async ({ page }) => {
  // The plugin regression, directly: the Tasks page's own read, refused, must
  // reach app-root as an expiry rather than stop at a "failed to load" toast.
  await login(page);
  await openTasks(page);

  // The page logs the read it lost, as it logs any failed read. The line is
  // the refusal this test provokes; where the user ends up is what is tested.
  allowConsoleErrors(page, ...EXPECTED_REFUSALS, /^Failed to load tasks HttpStatusError/);
  await expireSession(page);

  // Force a fresh read of the task list, the way the user would.
  await refreshTasks(page);

  await page.waitForURL(/#\/login/, { timeout: 15_000 });
  await expect(page.locator("login-page").getByText(EXPIRED_NOTICE)).toBeVisible();
});

// FIXME: the Tasks page reports an expired session as a connection failure.
// `fetchTasks` in plugins/caldav/frontend/tasks-page.ts catches the refused
// read and toasts `tasks.loadFailed` whatever the status, after
// `fetchWithTimeout` has already dispatched `auth-error` for the 401 — so the
// login form opens with "Your session has expired" beside "Could not load your
// tasks. Check your connection and try again.", advice that cannot help. The
// read should end quietly once the session is known to be gone.
test.fixme("an expired session on the tasks page is not reported as a connection failure", async ({ page }) => {
  await login(page);
  await openTasks(page);
  allowConsoleErrors(page, ...EXPECTED_REFUSALS, /^Failed to load tasks HttpStatusError/);
  await expireSession(page);
  await refreshTasks(page);

  await page.waitForURL(/#\/login/, { timeout: 15_000 });
  await expect(page.locator("login-page").getByText(EXPIRED_NOTICE)).toBeVisible();
  // No toast at all, counted once rather than waited for. The read's rejection
  // follows the `auth-error` dispatch synchronously, so a toast's element is
  // already in the stack by the time the login form is on screen (its text
  // renders a moment later, so a match on the text could pass before it had),
  // and a polling `toHaveCount(0)` would simply wait out the toast's own
  // five-second dismissal.
  expect(await page.locator("alps-toast").count(), "a toast was raised on the way out").toBe(0);
});

test("an expired session on the contacts page routes back to sign-in", async ({ page }) => {
  await login(page);
  const loaded = page.waitForResponse((r) => new URL(r.url()).pathname === "/contacts");
  await page.goto("/#/contacts");
  await expect(page.locator("contacts-page")).toBeVisible();
  await loaded;

  // As on Tasks: the page logs the read the expiry refused.
  allowConsoleErrors(
    page,
    ...EXPECTED_REFUSALS,
    /^Failed to fetch contacts Error: Failed to fetch contacts: Unauthorized/,
  );
  await expireSession(page);
  const refused = page.waitForResponse((r) => new URL(r.url()).pathname === "/contacts" && r.status() === 401);
  await page.locator("contacts-page").getByRole("button", { name: "Refresh Contacts", exact: true }).click();
  await refused;

  await page.waitForURL(/#\/login/, { timeout: 15_000 });
  await expect(page.locator("login-page").getByText(EXPIRED_NOTICE)).toBeVisible();
  // Unlike Tasks, Contacts says nothing misleading on the way out. Counted
  // once, for the reasons given on the Tasks test above.
  expect(await page.locator("alps-toast").count(), "a toast was raised on the way out").toBe(0);
});

// FIXME: alps answers `GET /session` with a 500 when the session is gone.
// `isPublic` in server.go lets `/session` through the auth middleware for every
// method (it is public for the sign-in POST), and `handleGetSession` in
// plugins/base/routes.go calls `ctx.Session.Username()` on the nil session:
// alps.log shows "PANIC in handler for /session: runtime error: invalid memory
// address or nil pointer dereference", and the browser logs two 500s (app-root
// and the settings store both ask on boot). The user still lands on the login
// form, via the 401 from `/settings`; the answer should have been that 401.
test.fixme("reloading a tab whose session has expired routes back to sign-in", async ({ page }) => {
  // The other way a user meets an expiry: they come back to the tab and reload
  // it. The marker cookie still says "signed in", so the shell boots the
  // mailbox and asks the server for the session — and has to take no for an
  // answer.
  await login(page);
  await expect(archiveFolder(page)).toBeVisible();
  allowConsoleErrors(page, ...EXPECTED_REFUSALS);
  await expireSession(page);

  await page.reload();

  await page.waitForURL(/#\/login/, { timeout: 15_000 });
  await expect(page.locator("login-page").getByText(EXPIRED_NOTICE)).toBeVisible();
});

test("signing back in after an expiry reaches the mailbox again", async ({ page }) => {
  // The recovery, not just the ejection: a session that cannot be
  // re-established is the same outage from the user's side. Through the
  // password form the user was sent to, because that is how they recover.
  await login(page);
  await expect(archiveFolder(page)).toBeVisible();
  allowConsoleErrors(page, ...EXPECTED_REFUSALS);
  await expireSession(page);
  await archiveFolder(page).click({ timeout: 5_000 }).catch(() => {});
  await page.waitForURL(/#\/login/, { timeout: 15_000 });

  await signIn(page);
  await expect(page).toHaveURL(/#\/mailbox/);
  await expect(archiveFolder(page)).toBeVisible();
  // The form is gone with the notice on it, not left mounted under the mailbox.
  await expect(page.locator("login-page")).toHaveCount(0);
});
