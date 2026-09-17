// The settings page, and whether a preference sticks.
//
// Two things are pinned here. First, that the settings page renders at all:
// it is the only route that mounts `alps-select`, `alps-setting-group` and the
// plugin settings tabs, none of which the mailbox exercises, and a component
// that renders nothing is exactly the failure this suite exists to catch. An
// element whose module was never imported stays an unknown tag: no shadow
// root, no label, no `<select>`, no error — so a test that reaches a labelled
// `<select>` is the only alarm.
//
// Second, that a preference actually STICKS. alps keeps preferences in the
// account's IMAP METADATA and mirrors them into localStorage, so a reload with
// the local copy thrown away is what tells a server write from a no-op. The
// record is shared by every test in the run, hence the reset after each one: a
// preference left changed here is inherited by every later spec.

import type { Browser, Page } from "@playwright/test";
import { expect, login, resetSettings, signIn, test } from "./fixtures";

// afterEach rather than a restore inside each test: the leak must be closed
// even when a test fails half-way, which is exactly when it is hardest to
// diagnose.
//
// The session that read the old record is ended too. `resetSettings` already
// makes the next test sign in afresh; signing this one out keeps the sessions
// left behind from piling up. The page leaves first, so nothing of it is still
// talking when its session goes.
test.afterEach(async ({ page }) => {
  await page.goto("about:blank");
  await resetSettings();
  await page.request.delete("/session");
});

/** The settings sidebar entries, addressed as a user would read them. */
function category(page: Page, name: string) {
  return page.locator("alps-category-item").filter({ hasText: name });
}

/**
 * The native `<select>` a labelled setting group owns.
 *
 * TWO shadow boundaries sit between the label and the control: the visible
 * label is rendered by `alps-setting-group` into its own shadow root, and the
 * `<select>` is rendered by the slotted `alps-select` into a second one.
 * Playwright pierces open shadow roots, so addressing the control by the label
 * a user reads works — but only once both custom elements are registered. An
 * unregistered element has no shadow root at all, so this helper resolving to
 * nothing is not a selector bug; it means the page is missing its controls.
 */
function setting(page: Page, label: string) {
  return page.locator("alps-setting-group").filter({ hasText: label }).locator("select");
}

/**
 * Signs in and opens a settings category once the account's settings have been
 * READ. alps sends no change before that read has answered (a save writes the
 * whole record), so a control touched earlier would be a change that is never
 * saved — a race in the test, not the behaviour under test.
 */
async function openSettings(page: Page, path = "/#/settings"): Promise<void> {
  const read = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "GET",
  );
  await login(page);
  expect((await read).ok(), "the account's settings could not be read").toBe(true);
  await page.goto(path);
  await expect(page.locator("settings-page")).toBeVisible();
}

/** Resolves when the next settings save has been accepted by the server. */
function settingsSaved(page: Page) {
  return page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "PUT" && r.ok(),
  );
}

test("the settings page opens on General and lists every category", async ({ page }) => {
  await openSettings(page);

  await expect(page.locator(".settings-title")).toHaveText("Settings / General");

  // The plugin tabs are in this list deliberately: each takes its label from
  // its plugin's own dictionary, and `I18nStore.t()` returns the KEY on a
  // miss, so a plugin whose strings failed to merge would put
  // `settings.categories.filters` in front of the user.
  for (const name of [
    "General",
    "Reading & Composing",
    "Appearance",
    "Localization",
    "Identity",
    "Linked Accounts",
    "2FA / WebAuthn",
    "Filters",
    "GPG Keys",
    "Password",
  ]) {
    await expect(category(page, name)).toBeVisible();
  }
  // Safe as a negative only because the assertions above have already waited
  // for the sidebar to be on screen.
  await expect(page.locator("settings-page")).not.toContainText("settings.");

  // The General panel itself, not just its heading. Its two checkboxes are
  // addressed by the label a user reads rather than by position, so reordering
  // the panel cannot quietly turn this into an assertion about a different one.
  await expect(page.getByLabel("Enable Desktop Notifications")).toBeVisible();
  await expect(page.getByLabel("Play sound notification on new messages")).toBeVisible();
});

test("choosing a category swaps the panel", async ({ page }) => {
  await openSettings(page);

  await expect(page.getByLabel("Enable Desktop Notifications")).toBeVisible();

  // General -> Reading, then Reading -> Identity. Each of these three panels
  // carries a checkbox with its own visible label, which is what makes the
  // "old panel is gone" half of the assertion cheap; whether the DROPDOWN
  // panels render at all is the separate subject of a test below.
  await category(page, "Reading & Composing").click();

  await expect(page).toHaveURL(/#\/settings\/reading/);
  await expect(page.locator(".settings-title")).toHaveText("Settings / Reading & Composing");
  await expect(page.getByLabel("Use threading")).toBeVisible();
  // Only NOW is the old panel's absence meaningful: asserted before the new
  // panel had rendered, it would pass while nothing whatsoever had happened.
  await expect(page.getByLabel("Enable Desktop Notifications")).toHaveCount(0);

  await category(page, "Identity").click();

  await expect(page).toHaveURL(/#\/settings\/identity/);
  await expect(page.locator(".settings-title")).toHaveText("Settings / Identity");
  await expect(page.getByLabel("Always BCC myself on outgoing mail")).toBeVisible();
  await expect(page.getByLabel("Use threading")).toHaveCount(0);
});

/**
 * Another browser, signed in to the same account with a session of its own —
 * and so an IMAP connection of its own, which has read nothing yet. Closing it
 * signs it out, so it leaves no session behind.
 */
async function anotherBrowser(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await signIn(page);
  return {
    page,
    close: async () => {
      await page.goto("about:blank");
      await page.request.delete("/session");
      await context.close();
    },
  };
}

test("a preference survives a reload, from the server", async ({ page, browser }) => {
  await openSettings(page, "/#/settings/reading");

  // Threading, not messages-per-page: what is under test is that a write
  // SURVIVES, and a checkbox says that in one bit without a dropdown's option
  // list muddying which value was actually stored.
  const threading = page.getByLabel("Use threading");
  await expect(threading).toBeEnabled();
  await expect(threading).toBeChecked();

  const saved = settingsSaved(page);
  await threading.uncheck();
  await expect(threading).not.toBeChecked();
  await saved;

  // The reload is the whole test, and the local copy goes first: alps mirrors
  // preferences into localStorage, and a reload that read them back from there
  // would pass with nothing written to the server at all. With it gone, the
  // page starts from the defaults (threading ON) and only the server's record
  // can turn it off again.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByLabel("Use threading")).not.toBeChecked();

  // And the record is the ACCOUNT's, not this session's: a browser that signs
  // in now reads it from the IMAP server and finds the same choice.
  const other = await anotherBrowser(browser);
  try {
    await other.page.goto("/#/settings/reading");
    await expect(other.page.getByLabel("Use threading")).not.toBeChecked();
  } finally {
    await other.close();
  }
});

// A session keeps a copy of the record on its IMAP connection, and the page
// must not be shown that copy: a change saved from another browser, or by any
// other client of the account, has to reach an open session on reload.
test("a preference changed in another browser shows after a reload", async ({ page, browser }) => {
  // This tab's session reads the record first, as any open tab has.
  await openSettings(page, "/#/settings/reading");
  await expect(page.getByLabel("Use threading")).toBeChecked();

  const other = await anotherBrowser(browser);
  try {
    const read = other.page.waitForResponse(
      (r) => new URL(r.url()).pathname === "/settings" && r.request().method() === "GET" && r.ok(),
    );
    await other.page.goto("/#/settings/reading");
    await read;
    const threading = other.page.getByLabel("Use threading");
    await expect(threading).toBeChecked();
    const saved = settingsSaved(other.page);
    await threading.uncheck();
    await saved;
  } finally {
    await other.close();
  }

  // Local storage goes too, so the reload can only show what the server says.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByLabel("Use threading")).not.toBeChecked();
});

// Two open browsers, each changing a different setting: both changes stay. A
// save that wrote this tab's whole copy of the record put back the value the
// other browser had just replaced.
test("a change saved here keeps a change another browser saved since", async ({ page, browser }) => {
  await openSettings(page, "/#/settings/identity");
  const bcc = page.getByLabel("Always BCC myself on outgoing mail");
  await expect(bcc).not.toBeChecked();

  const other = await anotherBrowser(browser);
  try {
    await other.page.goto("/#/settings/reading");
    const threading = other.page.getByLabel("Use threading");
    await expect(threading).toBeChecked();
    const saved = settingsSaved(other.page);
    await threading.uncheck();
    await saved;
  } finally {
    await other.close();
  }

  // This tab still shows threading on, and saves something else.
  const saved = settingsSaved(page);
  await bcc.check();
  expect((await saved).request().postDataJSON(), "the save sent more than the change").toEqual({ bcc_myself: true });

  const third = await anotherBrowser(browser);
  try {
    await third.page.goto("/#/settings/reading");
    await expect(third.page.getByLabel("Use threading")).not.toBeChecked();
    await third.page.goto("/#/settings/identity");
    await expect(third.page.getByLabel("Always BCC myself on outgoing mail")).toBeChecked();
  } finally {
    await third.close();
  }
});

// The regression guard for the unregistered-component failure described at the
// top of this file, on all four panels built from dropdowns. It fails the
// moment `alps-setting-group` or `alps-select` stops being registered, and the
// moment any of these panels stops rendering its controls for any other reason.
test("each settings panel renders its labelled dropdowns", async ({ page }) => {
  await openSettings(page);

  // The label is the half a user reads. The value is the half that proves
  // `alps-select`'s `?selected` binding matched an option — and Auto-logout is
  // the dropdown on which that can be told apart from nothing having happened,
  // because its default (30 minutes) is the THIRD option. A `<select>` whose
  // options all rendered without a `selected` among them falls back to index 0
  // on its own, so a setting that defaults to its first option would assert the
  // same value either way.
  await expect(page.getByText("Auto-logout", { exact: true })).toBeVisible();
  await expect(setting(page, "Auto-logout")).toHaveValue("30");

  await page.goto("/#/settings/reading");
  // Mark as Read defaults to its first option, so the value says little here
  // (see above). The OPTION LIST does: an `alps-select` whose tag never
  // registered has no shadow root and no `<select>` at all, and one that
  // registered without its `.options` renders an empty control — so reaching
  // the last entry by the text a user reads rules out both.
  const markRead = setting(page, "Mark as Read");
  await expect(markRead).toHaveValue("0");
  await expect(markRead).toContainText("Never mark automatically");

  // The two panels made of nothing but setting groups and dropdowns: with the
  // tags unregistered they would render completely empty below the header, so
  // a visible label on either is itself proof that registration held.
  await page.goto("/#/settings/appearance");
  await expect(page.getByText("Color Theme", { exact: true })).toBeVisible();
  await expect(page.getByText("List Density", { exact: true })).toBeVisible();

  await page.goto("/#/settings/localization");
  await expect(setting(page, "Date Format")).toHaveValue("YYYY-MM-DD");
});

test("the theme mode applies at once and survives a reload", async ({ page }) => {
  await openSettings(page, "/#/settings/appearance");

  const themeMode = setting(page, "Theme Mode");
  // Gate on the control first. A body with no theme class is also what a page
  // that has not finished rendering looks like, so asserting the absence of
  // `theme-dark` before anything is on screen would prove nothing.
  await expect(themeMode).toHaveValue("auto");
  // The browser is driven with a light colour-scheme preference, so the
  // default `auto` must not be dark.
  await expect(page.locator("body")).not.toHaveClass(/theme-dark/);

  const saved = settingsSaved(page);
  await themeMode.selectOption("dark");

  await expect(page.locator("body")).toHaveClass(/theme-dark/);
  await saved;

  await page.reload();
  // The theme is one of the few preferences also mirrored to the
  // browser-global key, so it is dark before the account's record has been
  // read back — and stays dark once it has.
  await expect(page.locator("body")).toHaveClass(/theme-dark/);
  await expect(setting(page, "Theme Mode")).toHaveValue("dark");
});

test("switching language re-renders the interface and survives a reload", async ({ page }) => {
  await openSettings(page, "/#/settings/localization");

  const saved = settingsSaved(page);
  await setting(page, "Language").selectOption("de");

  // The dictionary is loaded by dynamic import, so this also proves the
  // non-English bundles resolve at all — a broken glob would leave the UI in
  // English with only a logged error to show for it.
  await expect(page.locator(".settings-title")).toHaveText("Einstellungen / Lokalisierung");
  await expect(category(page, "Allgemein")).toBeVisible();
  await saved;

  await page.reload();
  await expect(page.locator(".settings-title")).toHaveText("Einstellungen / Lokalisierung");
});
