// Signing out on purpose, and the notice that says so.
//
// The sibling of session-expiry.spec.ts, and it exists because the two look
// alike from the code and are easy to confuse on screen. An expiry is the
// server refusing us; a sign-out is the user asking to leave, and the login
// screen must not accuse them of the former.
//
// It needs a real browser and a real server because the defect it guards
// against is a RACE between the two. `alps-header` sets the "signed out"
// notice, then `DELETE /session` ends the session on the server. Anything the
// mailbox still has in flight at that moment (a background sync, a verdict
// lookup) comes back 401, and fetch-utils announces every 401 as `auth-error`,
// whose handler in app-root writes "your session has expired" into the same
// one-shot slot. Nothing in the jsdom suite has a server to end the session
// on, so nothing there can see it.

import type { Page } from "@playwright/test";
import { allowConsoleErrors, expect, login, signIn, test } from "./fixtures";

/** Chromium logs a console error for every non-2xx RESPONSE. Signing out ends
 * the session, so anything still in flight is refused on purpose. */
const EXPECTED_REFUSALS = [/status of 401/];

/** The one-shot notice's storage key (`utils/login-notice.ts`). */
const NOTICE_KEY = "alps-login-notice";

/** Opens the account menu in the header and signs out through it — the only
 * way a person reaches this, and the path that owns the sequence. */
async function signOut(page: Page): Promise<void> {
  await page.locator('user-profile-menu alps-icon-btn[title="Profile options"]').click();
  await page.locator("user-profile-menu").getByRole("button", { name: "Sign Out" }).click();
}

/** The Archive folder in the sidebar: on screen once the mailbox has painted. */
function archiveFolder(page: Page) {
  return page.locator('alps-folder-list .folder-item[title="Archive"]');
}

test("signing out lands on the login screen and says why", async ({ page }) => {
  await login(page);
  // Let the mailbox finish painting, so there is a settled session with its
  // background reads running to sign out OF — the race under test needs both.
  await expect(archiveFolder(page)).toBeVisible();
  const session = (await page.context().cookies()).find((c) => c.name === "alps_session");
  expect(session, "signed in without a session cookie").toBeDefined();
  allowConsoleErrors(page, ...EXPECTED_REFUSALS);

  await signOut(page);

  await page.waitForURL(/#\/login/, { timeout: 15_000 });
  await expect(page.locator("login-page").getByText("You have been signed out.")).toBeVisible();
  // The wrong notice is the whole defect, so it is asserted absent rather than
  // left to the positive check above: both are rendered in the same slot.
  await expect(page.locator("login-page").getByText("Your session has expired.")).toHaveCount(0);

  // The session is really over on the server, not just forgotten by the
  // browser: its token, presented again, opens nothing. Asked outside the page
  // so the refusal is not a console line.
  const probe = await page.request.get("/mailboxes/INBOX/status", {
    headers: { Cookie: `alps_session=${session!.value}` },
  });
  expect(probe.status()).toBe(401);
});

test("the notice does not survive into a later login", async ({ page }) => {
  // The other half of the same race. A refusal arriving after the login page
  // has already read its one-shot notice leaves an unread one in
  // sessionStorage, and the NEXT visit to the login screen — a healthy one —
  // opens with "your session has expired".
  await login(page);
  await expect(archiveFolder(page)).toBeVisible();
  allowConsoleErrors(page, ...EXPECTED_REFUSALS);

  await signOut(page);
  await page.waitForURL(/#\/login/, { timeout: 15_000 });
  await expect(page.locator("login-page").getByText("You have been signed out.")).toBeVisible();

  // The reload is the detector, and the ORDER is the whole point. A late
  // refusal can only write its notice while the signed-out document is still
  // alive; reloading ends that document and mounts a fresh `login-page`, which
  // takes whatever is in storage. So:
  //
  //   * the write never happened      -> storage empty, no notice rendered
  //   * the write happened            -> this mount consumes it and RENDERS it
  //
  // which is why the assertion that carries the defect is the rendered one.
  // (A poll on the storage key would not do it: `expect.poll` stops at its
  // first passing read, so it would be satisfied by the empty slot a moment
  // before the late write landed in it.)
  await page.reload();
  await expect(page.locator("login-page #username")).toBeVisible();
  await expect(page.locator("login-page .notice-text")).toHaveCount(0);
  // The slot itself, read after the mount above has had its chance at it —
  // nothing was left for a THIRD visit either.
  expect(await page.evaluate((key) => sessionStorage.getItem(key), NOTICE_KEY)).toBeNull();

  // Signing back in still works — the sign-out cleared the session rather than
  // leaving something behind that a second login trips over. `signIn` because
  // that claim is about the PASSWORD flow: `login` reuses a live session where
  // it can, and the one this test just ended is gone, so it would reach the
  // same form by a longer road and say less about it.
  await signIn(page);
  await expect(archiveFolder(page)).toBeVisible();
});
