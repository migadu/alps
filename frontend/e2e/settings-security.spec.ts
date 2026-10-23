// Settings → security, end to end: the 2FA / WebAuthn pane and the password
// plugin.
//
// The WebAuthn pane follows one rule — STATE AT REST, FORM ON INTENT: it says
// where the account stands and offers a verb, and nothing asks for input until
// the verb is pressed. That is a claim about what the whole pane adds up to,
// which a component test rendering one piece at a time cannot make.
//
// The password pane is the app's only surface where a success is a CREDENTIAL
// rather than a rendered row. So its test proves the result where it matters —
// at the login form, in a browser that has never seen the account: the new
// password opens it and the old one does not. A pane that showed a convincing
// toast and changed nothing would pass every assertion that stops at the DOM.
//
// EVERY TEST USES ITS OWN THROWAWAY ACCOUNT, and that is not tidiness: the run
// shares one account with one password (`fixtures.USER`), and changing it would
// break `signIn` for every later spec.

import type { Browser, Locator, Page } from "@playwright/test";
import { allowConsoleErrors, createAccount, deleteAccount, expect, signInAs, test, toast } from "./fixtures";

const PASSWORD = "throwaway-password-123";

/** Every account this file created, removed at the end. */
const created: string[] = [];

/**
 * Signs `page` in to an account nobody else in the run touches.
 *
 * Timestamped rather than fixed: sora's delete is a SOFT delete that keeps the
 * address, so a fixed name would collide with the previous run's tombstone
 * whenever the harness state is kept.
 */
async function freshAccount(page: Page, tag: string): Promise<string> {
  const address = `sec-${tag}-${Date.now()}@example.test`;
  await createAccount({ address, password: PASSWORD });
  created.push(address);
  await signInAs(page, address, PASSWORD);
  return address;
}

test.afterAll(async () => {
  for (const address of created.splice(0)) await deleteAccount(address);
});

/**
 * What alps's login form answers for these credentials, asked in a browser
 * context of its own: no cookie, no session, nothing the tab under test holds.
 * The status of the sign-in request — 200 for "welcome", 401 for "these
 * credentials open nothing".
 */
async function signInStatus(browser: Browser, address: string, password: string): Promise<number> {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const page = await context.newPage();
    await page.goto("/#/login");
    await page.locator("login-page #username").fill(address);
    await page.locator("login-page #password").fill(password);
    const answered = page.waitForResponse(
      (r) => new URL(r.url()).pathname === "/session" && r.request().method() === "POST",
    );
    await page.locator("login-page button[type=submit]").click();
    const status = (await answered).status();
    if (status === 200) await page.waitForURL(/#\/mailbox/, { timeout: 15_000 });
    return status;
  } finally {
    await context.close();
  }
}

/**
 * A button, by role and exact name. It lands on the NATIVE `<button>` inside
 * `alps-button`, which is the element whose `disabled` the browser honours —
 * the custom element is not a form control.
 */
function action(scope: Locator, name: string) {
  return scope.getByRole("button", { name, exact: true });
}

/**
 * A password field, by the placeholder a user reads. An attribute selector on
 * the native input rather than `getByPlaceholder`: `alps-input` keeps the
 * attribute on its host as well, so a by-placeholder lookup finds the custom
 * element AND the control inside it.
 */
function field(scope: Locator, placeholder: string) {
  return scope.locator(`input[placeholder="${placeholder}"]`);
}

test("the WebAuthn pane opens as state, not as a form", async ({ page }) => {
  await freshAccount(page, "rest");
  await page.goto("/#/settings/webauthn");

  const pane = page.locator("alps-webauthn-settings");
  await expect(page.locator("settings-window .category-title")).toHaveText("2FA / WebAuthn");

  // Where the account stands, in words, before it offers anything.
  await expect(pane.getByText("Security Keys", { exact: true })).toBeVisible();
  await expect(pane).toContainText("No registered keys.");

  // The verb, first. Asserted BEFORE the absences below so those cannot pass
  // vacuously: a locator that reached nothing at all (a renamed pane, a shadow
  // root it no longer pierces) would satisfy every `toHaveCount(0)` here.
  await expect(action(pane, "Add Security Key")).toBeEnabled();
  await expect(pane.getByRole("button")).toHaveCount(1);

  // THE RULE. Not one input until the user says what they came to do: no name
  // prompt, no dialog, no confirmation, and — with no key registered — not the
  // linked-accounts trust switch either, which only means something once there
  // is a key to trust.
  await expect(pane.locator("input")).toHaveCount(0);
  await expect(pane.locator("ui-prompt")).toHaveCount(0);
  await expect(pane.locator("ui-modal")).toHaveCount(0);
  await expect(pane.locator("ui-confirm")).toHaveCount(0);
  await expect(pane).not.toContainText("Trust Linked Accounts");
});

test("changing the password refuses a wrong one, then rotates without ending the session", async ({
  page,
  browser,
}) => {
  const address = await freshAccount(page, "pw");
  // A wrong current password is a 403 the pane HANDLES; Chromium logs every
  // non-2xx response as a console error, which the fixture is strict about.
  allowConsoleErrors(page, /status of 403/);
  await page.goto("/#/settings/password");

  const pane = page.locator("alps-password-settings");
  const current = field(pane, "Current Password");
  const next = field(pane, "New Password");
  const repeat = field(pane, "Confirm New Password");
  const commit = action(pane, "Update Password");

  // Every request the pane makes, so a check that is meant to stay in the
  // browser can be held to it.
  const changes: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).pathname === "/password/change") changes.push(r.method());
  });

  const rotated = "rotated-password-456";

  // Nothing to commit until all three fields are filled.
  await expect(commit).toBeDisabled();
  await current.fill(PASSWORD);
  await next.fill(rotated);
  await expect(commit).toBeDisabled();

  // The client-side gate: a repeat that does not match is caught here, so the
  // server never sees it.
  await repeat.fill("something-else");
  await expect(commit).toBeEnabled();
  await commit.click();
  await expect(toast(page, "New passwords do not match.")).toBeVisible();
  expect(changes, "a mismatched repeat reached the server").toEqual([]);

  // Now the one refusal a correctly-filled form can still meet: the current
  // password is wrong. The server checks it against the session before it asks
  // anyone to change anything.
  await repeat.fill(rotated);
  await current.fill("not-the-password");
  const refused = page.waitForResponse((r) => new URL(r.url()).pathname === "/password/change");
  await commit.click();
  expect((await refused).status()).toBe(403);
  await expect(toast(page, "Current password is incorrect")).toBeVisible();
  // The refusal keeps what was typed, for the retry.
  await expect(next).toHaveValue(rotated);
  // And nothing changed: the password the user asked for does not open the
  // account.
  expect(await signInStatus(browser, address, rotated)).toBe(401);

  await current.fill(PASSWORD);
  const accepted = page.waitForResponse((r) => new URL(r.url()).pathname === "/password/change");
  await commit.click();
  expect((await accepted).status()).toBe(200);
  await expect(toast(page, "Password successfully changed")).toBeVisible();
  // The form empties, so nothing of either password is left on screen.
  await expect(current).toHaveValue("");
  await expect(next).toHaveValue("");
  await expect(repeat).toHaveValue("");

  // The server really rotated it: the new password opens the account and the
  // old one does not.
  expect(await signInStatus(browser, address, rotated)).toBe(200);
  expect(await signInStatus(browser, address, PASSWORD)).toBe(401);

  // THE SESSION SURVIVES, which is the property only a browser can check:
  // alps signs in to the IMAP server again with the new password as part of the
  // change, so the tab that made it is not ejected by its own success. A
  // folder switch needs the mail server, so it proves the session still reaches
  // it.
  await page.goto("/#/mailbox/INBOX");
  const archive = page.locator('alps-folder-list .folder-item[title="Archive"]');
  await expect(archive).toBeVisible();
  const listed = page.waitForResponse(
    (r) => decodeURIComponent(new URL(r.url()).pathname).includes("/mailboxes/Archive") && r.ok(),
  );
  await archive.click();
  await listed;
  await expect(page).toHaveURL(/#\/mailbox\/Archive/);
  await expect(page.locator("login-page")).toHaveCount(0);
});

// A security key is bound to a hostname, and Chromium takes no IP address as
// one, so these tests reach alps as localhost (which the harness configures as
// the WebAuthn relying party) rather than at the suite's 127.0.0.1.
test.describe("with a security key", () => {
  test.use({ baseURL: (process.env.ALPS_URL ?? "http://127.0.0.1:8900").replace("127.0.0.1", "localhost") });

  /**
   * Gives the page an authenticator of its own, through the DevTools
   * protocol: a platform key that is always present and always verifies the
   * user, so a registration completes without anyone touching anything.
   */
  async function withAuthenticator(page: Page) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("WebAuthn.enable");
    const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });
    return { cdp, authenticatorId };
  }

  /** Registers a key under `name` from the WebAuthn pane, and waits for it to be listed. */
  async function addKey(page: Page, name: string): Promise<Locator> {
    const pane = page.locator("alps-webauthn-settings");
    await action(pane, "Add Security Key").click();
    const naming = pane.locator("ui-prompt");
    await field(naming, "Device name (e.g. YubiKey)").fill(name);
    const finished = page.waitForResponse((r) => new URL(r.url()).pathname === "/settings/2fa/finish");
    await action(naming, "Save").click();
    expect((await finished).status()).toBe(200);
    const row = pane.locator(".setting-row").filter({ hasText: name });
    await expect(row).toBeVisible();
    return row;
  }

  test("removing a key asks for the password, refuses a wrong one, and takes the right one", async ({
    page,
    browser,
  }) => {
    const address = await freshAccount(page, "key");
    await withAuthenticator(page);
    // The wrong password is a 403 the prompt HANDLES; Chromium logs every
    // non-2xx response as a console error, which the fixture is strict about.
    allowConsoleErrors(page, /status of 403/);
    await page.goto("/#/settings/webauthn");

    const pane = page.locator("alps-webauthn-settings");
    const row = await addKey(page, "Laptop");

    // Every removal the page asks for, so a check meant to stay in the
    // browser can be held to it.
    const removals: string[] = [];
    page.on("request", (r) => {
      if (/\/settings\/2fa\/credential\/.+\/delete$/.test(new URL(r.url()).pathname)) removals.push(r.postData() ?? "");
    });

    await action(row, "Remove").click();
    const prompt = pane.locator("ui-prompt");
    await expect(prompt.locator("h3")).toHaveText("Are you sure you want to remove this security key?");
    await expect(prompt).toContainText("Enter your password to remove this security key");
    const password = prompt.locator('input[type="password"]');
    const remove = action(prompt, "Remove");

    // An empty password is answered in the prompt and never sent.
    await remove.click();
    await expect(prompt.getByRole("alert")).toHaveText("Enter your current password.");
    expect(removals, "an empty password reached the server").toEqual([]);

    // A wrong one is refused by the server: the prompt stays, says so, and
    // the key is still there.
    await password.fill("not-the-password");
    const refused = page.waitForResponse((r) => new URL(r.url()).pathname.endsWith("/delete"));
    await remove.click();
    expect((await refused).status()).toBe(403);
    await expect(prompt.getByRole("alert")).toHaveText("That password is not right.");
    await expect(row).toBeVisible();

    // Typing again clears the error; the right password removes the key.
    await password.fill(PASSWORD);
    await expect(prompt.getByRole("alert")).toHaveCount(0);
    const accepted = page.waitForResponse((r) => new URL(r.url()).pathname.endsWith("/delete"));
    await remove.click();
    expect((await accepted).status()).toBe(200);
    await expect(prompt).toHaveCount(0);
    await expect(pane).toContainText("No registered keys.");
    expect(removals.map((body) => JSON.parse(body).current_password)).toEqual(["not-the-password", PASSWORD]);

    // It was the last key, so the second factor is off: a browser that has
    // never seen the account signs in with the password alone.
    expect(await signInStatus(browser, address, PASSWORD)).toBe(200);
  });

  test("a click on Verify as the key page appears signs in with one ceremony", async ({ page }) => {
    const address = await freshAccount(page, "verify");
    await withAuthenticator(page);
    await page.goto("/#/settings/webauthn");
    await addKey(page, "Laptop");

    // Signed out, with a key: the password leads to the key page, which
    // starts the ceremony by itself 300 ms after it appears. The reload asks
    // for a session that is gone, a 401 the page handles.
    await page.context().clearCookies();
    allowConsoleErrors(page, /status of 401/);
    const begins: string[] = [];
    page.on("request", (r) => {
      if (new URL(r.url()).pathname === "/webauthn/verify/begin") begins.push(r.url());
    });
    // Reloaded in the same tab, which keeps the authenticator and its key.
    await page.goto("/#/login");
    await page.reload();
    await page.locator("login-page #username").fill(address);
    await page.locator("login-page #password").fill(PASSWORD);
    await page.locator("login-page button[type=submit]").click();

    // Clicked the moment it is there, without waiting for it to be enabled:
    // a ceremony already running has disabled it, and the click is then lost
    // as a user's would be.
    const verify = action(page.locator("login-webauthn-page"), "Verify Identity");
    await verify.evaluate((button: HTMLButtonElement) => button.click());

    await page.waitForURL(/#\/mailbox/, { timeout: 15_000 });
    expect(begins, "the sign-in ran more than one ceremony").toHaveLength(1);
  });

  test("Back to login cancels the native key prompt and a later sign-in still works", async ({ page }) => {
    const address = await freshAccount(page, "leave-key");
    const { cdp, authenticatorId } = await withAuthenticator(page);
    await page.goto("/#/settings/webauthn");
    await addKey(page, "Laptop");
    await cdp.send("WebAuthn.setAutomaticPresenceSimulation", { authenticatorId, enabled: false });
    await page.context().clearCookies();
    allowConsoleErrors(page, /status of 401/);
    await page.goto("/#/login");
    await page.reload();
    await page.evaluate(() => {
      const state = window as any;
      state.keyPromptEvents = [];
      const get = navigator.credentials.get.bind(navigator.credentials);
      navigator.credentials.get = async options => {
        state.keyPromptEvents.push('started');
        try {
          return await get(options);
        } catch (error: any) {
          state.keyPromptEvents.push(error.name);
          throw error;
        }
      };
    });
    const finishes: string[] = [];
    page.on("request", request => {
      if (new URL(request.url()).pathname === '/webauthn/verify/finish') finishes.push(request.url());
    });
    const passwordSignIn = async () => {
      await page.locator("login-page #username").fill(address);
      await page.locator("login-page #password").fill(PASSWORD);
      await page.locator("login-page button[type=submit]").click();
    };
    await passwordSignIn();
    await expect.poll(() => page.evaluate(() => (window as any).keyPromptEvents)).toEqual(['started']);
    await page.locator("login-webauthn-page").getByRole("button", { name: /Back to Login/ }).click();
    await expect(page.locator("login-page #username")).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).keyPromptEvents)).toEqual(['started', 'AbortError']);
    expect(finishes).toHaveLength(0);
    await cdp.send("WebAuthn.setAutomaticPresenceSimulation", { authenticatorId, enabled: true });
    await passwordSignIn();
    await page.waitForURL(/#\/mailbox/, { timeout: 15_000 });
    expect(finishes).toHaveLength(1);
  });

  test("Back to login before the key page has its options asks for no key, and the next sign-in still works", async ({ page }) => {
    const address = await freshAccount(page, "back");
    await withAuthenticator(page);
    await page.goto("/#/settings/webauthn");
    await addKey(page, "Laptop");

    await page.context().clearCookies();
    allowConsoleErrors(page, /status of 401/);
    // The key page's first request for options is held until the user has
    // gone back. Answered then, it used to open the key prompt over the login
    // form, and the always-present key below signed the account in.
    let release!: () => void;
    const released = new Promise<void>((resolve) => (release = resolve));
    let held = true;
    await page.route("**/webauthn/verify/begin", async (route) => {
      if (!held) return route.continue();
      await released;
      // Called off by the page meanwhile, the request has nothing to continue.
      await route.continue().catch(() => {});
    });
    const finishes: string[] = [];
    page.on("request", (r) => {
      if (new URL(r.url()).pathname === "/webauthn/verify/finish") finishes.push(r.url());
    });
    await page.goto("/#/login");
    await page.reload();
    const signIn = async () => {
      await page.locator("login-page #username").fill(address);
      await page.locator("login-page #password").fill(PASSWORD);
      await page.locator("login-page button[type=submit]").click();
    };
    const asked = page.waitForRequest((r) => new URL(r.url()).pathname === "/webauthn/verify/begin");
    await signIn();
    await asked;

    await page.locator("login-webauthn-page").getByRole("button", { name: /Back to Login/ }).click();
    await expect(page.locator("login-page #password")).toBeVisible();
    release();
    // Nothing to wait for but time: what is being shown is that nothing comes.
    await page.waitForTimeout(2_000);
    expect(finishes, "a key was sent from the page the user had left").toEqual([]);
    expect(page.url()).toContain("#/login");

    // Signed in again, the key page starts a ceremony of its own, and it works.
    held = false;
    await signIn();
    await page.waitForURL(/#\/mailbox/, { timeout: 15_000 });
    expect(finishes).toHaveLength(1);
  });
});
