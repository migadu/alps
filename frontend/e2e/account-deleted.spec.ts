// What happens when the ACCOUNT is deleted under a tab that is still signed in.
//
// The gap this fills is narrow and invisible from session-expiry.spec.ts:
// every test there ends the session by giving the browser a token alps does
// not know, so alps itself refuses. Nothing exercised the other shape, where
// alps's session is perfectly valid and the IMAP server is the one refusing —
// an administrator deletes the account while its owner has the tab open.
//
// alps holds the account's password in its session and signs in to the IMAP
// server again whenever it needs a fresh connection. For a deleted account that
// sign-in fails for good, and `handleError` treats the failure as the end of
// the session: it closes it, clears the cookies and answers 401. Were it to
// answer anything else — a 500 the user can retry forever — the tab would stay
// "signed in" to an account that no longer exists.
//
// Every test here uses its own throwaway account: deleting alice would take the
// rest of the run with her.

import type { Page } from "@playwright/test";
import { allowConsoleErrors, createAccount, deleteAccount, expect, signInAs, test } from "./fixtures";

/** Chromium logs a console error for every non-2xx RESPONSE — a network log
 * line, not something the app wrote. Deleting the account provokes these on
 * purpose. */
const EXPECTED_REFUSALS = [/status of 401/];

const PASSWORD = "throwaway-password-123";

const SORA_ADMIN_URL = process.env.SORA_ADMIN_URL ?? "http://127.0.0.1:8903";
const SORA_ADMIN_KEY = process.env.SORA_ADMIN_KEY ?? "e2e-admin-key-not-a-secret";

/**
 * A fresh address per test and per run: sora's delete is a SOFT delete that
 * keeps the address, so a fixed name would collide with the previous run's
 * tombstone whenever the harness state is kept.
 */
function throwawayAddress(tag: string): string {
  return `deleted-${tag}-${Date.now()}@example.test`;
}

/**
 * Ends the account's live IMAP connections, the way an administrator removing
 * an account does. sora's delete alone only marks the account: connections
 * already signed in keep being served, so without this the deletion would not
 * reach a tab until alps next had to sign in for some other reason.
 */
async function endImapConnections(address: string): Promise<void> {
  const response = await fetch(`${SORA_ADMIN_URL}/admin/connections/kick`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SORA_ADMIN_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ user_email: address, protocol: "IMAP" }),
  });
  if (!response.ok) {
    throw new Error(`kick ${address}: ${response.status} ${await response.text()}`);
  }
}

/**
 * The status alps's sign-in answers for these credentials, asked outside any
 * browser: no cookie is sent and none is kept, so the tab under test is not
 * touched whatever the answer.
 */
async function signInStatus(address: string, password: string): Promise<number> {
  const response = await fetch(new URL("/session", test.info().project.use.baseURL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: address, password }),
  });
  return response.status;
}

function folders(page: Page) {
  return page.locator("alps-folder-list .folder-item");
}

test("an account deleted under an open tab ends the session", async ({ page }) => {
  const address = throwawayAddress("tab");
  await createAccount({ address, password: PASSWORD });
  await signInAs(page, address, PASSWORD);
  // Let the mailbox PAINT first, so the deletion lands on a working tab rather
  // than racing the first-paint requests.
  await expect(folders(page).first()).toBeVisible();

  allowConsoleErrors(page, ...EXPECTED_REFUSALS);

  // The administrator deletes it. The browser is not told and keeps a session
  // cookie alps still honours — and the `alps_logged_in` marker the shell
  // gates rendering on.
  await deleteAccount(address);

  // The deletion has to have reached the IMAP server's sign-in before anything
  // here means something: proven, not assumed, by the right password being
  // refused before the test goes on.
  expect(await signInStatus(address, PASSWORD)).toBe(401);

  await endImapConnections(address);

  // Any action that touches the mailbox now needs a new IMAP connection, and
  // the server no longer lets the account sign in. Best-effort, exactly as in
  // session-expiry.spec: background traffic may hit the refusal first, which is
  // the property under test succeeding early.
  await folders(page)
    .filter({ hasText: "Archive" })
    .click({ timeout: 5_000 })
    .catch(() => {});

  await page.waitForURL(/#\/login/, { timeout: 15_000 });
  await expect(page.locator("login-page").getByText("Your session has expired. Please sign in again.")).toBeVisible();

  // The markers are genuinely gone, which is what keeps the shell on the login
  // form rather than booting a mailbox for an account that no longer exists.
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "alps_logged_in")).toBeUndefined();
  expect(cookies.find((c) => c.name === "alps_session")).toBeUndefined();

  // AND IT STAYS THERE. A reload is the shell deciding afresh from those
  // cookies: with the marker left behind, it would mount the mailbox and ask a
  // server that has nothing for it.
  await page.reload();
  await expect(page.locator("login-page #username")).toBeVisible();
  await expect(page).toHaveURL(/#\/login/);
  await expect(page.locator("mailbox-page")).toHaveCount(0);
});

test("signing in to a deleted account is refused as bad credentials, not a network error", async ({ page }) => {
  // The second half of the same story: having been ejected, the user tries to
  // sign back in with a password that is still perfectly correct. A deleted
  // account is an authentication refusal, never a transient one: a network
  // error here would tell the user to try again, advice that can never work.
  const address = throwawayAddress("login");
  await createAccount({ address, password: PASSWORD });
  await deleteAccount(address);

  allowConsoleErrors(page, ...EXPECTED_REFUSALS);
  await page.goto("/#/login");
  await page.locator("login-page #username").fill(address);
  await page.locator("login-page #password").fill(PASSWORD);
  const answered = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/session" && r.request().method() === "POST",
  );
  await page.locator("login-page button[type=submit]").click();
  // The server's verdict, not just the form's rendering of it: 401 is "these
  // credentials open nothing", where a 5xx would be "try again later".
  expect((await answered).status()).toBe(401);

  // It refuses, and stays on the form, saying so in the error slot.
  const error = page.locator("login-page .error-text");
  await expect(error).toContainText("Failed to login", { timeout: 15_000 });
  await expect(error).not.toContainText(/network error/i);
  await expect(page).toHaveURL(/#\/login/);
  await expect(page.locator("login-page #username")).toBeVisible();
});
