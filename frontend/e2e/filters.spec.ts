// Server-side mail filters (Settings → Filters).
//
// alps edits ONE Sieve script on the account's ManageSieve server: the active
// one, whatever its name. The visual editor compiles its rules into that script
// (carrying the rules themselves in a comment, so they can be read back), and
// the raw editor edits the script text directly. Saving uploads the script and
// activates it; saving no rules at all switches filtering off.
//
// What only a browser test against the real stack can prove:
//
//  1. What the editors emit is what the server accepts, and it is stored AND
//     active — checked by asking the ManageSieve server itself, not alps.
//  2. The stored script really filters: the server runs it on delivery, so a
//     rule built here moves a delivered message into its folder.
//  3. A script the server refuses is refused on save as well as on Validate,
//     the refusal names the offending position, and the stored script is left
//     as it was.
//  4. A script written by another Sieve client is shown as it is and edited in
//     place, never hidden behind "No rules defined." or replaced by a second
//     script.
//
// Selector note: buttons are addressed by ROLE + accessible name. `alps-button`
// renders a real `<button>` in its shadow root, so a role locator lands on the
// NATIVE control, whose `disabled` the browser honours and Playwright's
// actionability check waits for. The icon buttons have no text; their `title`
// is their name.

import { connect, type Socket } from "node:net";
import type { Locator, Page } from "@playwright/test";
import { allowConsoleErrors, deliver, expect, login, resetSieve, test, toast, USER } from "./fixtures";

let counter = 0;
const uniqueMarker = () => `filter-${Date.now()}-${String(counter++).padStart(2, "0")}`;

/** A folder every account has, and not the Inbox: filing into it is visible. */
const FOLDER = "Archive";

/** Reports `3:1: … unsupported command: fileintoo` — a position that is neither
 * the first line nor the last, so a hardcoded or off-by-one position shows. */
const INVALID = 'require ["fileinto"];\n\nfileintoo "Junk";\n';
/** The parts of the verdict these tests pin: where, and the token echoed back.
 * The prose around them is the parser's to reword. */
const POSITION = "3:1";
const OFFENDER = "fileintoo";

// ---------------------------------------------------------------------------
// The ManageSieve server, spoken to directly.
//
// The page can only say what alps believes. Whether a script is stored, which
// one is active and what it holds are the server's facts, so they are read
// from the server — the way any other Sieve client would see them.
// ---------------------------------------------------------------------------

type SieveScript = { name: string; active: boolean; content: string };

/** The ManageSieve server the harness started, as `host:port`. */
function sieveAddress(): { host: string; port: number } {
  const [host, port] = (process.env.SIEVE_ADDR ?? "127.0.0.1:8902").split(":");
  return { host, port: Number(port) };
}

const quote = (value: string) => `"${value.replace(/[\\"]/g, "\\$&")}"`;

/** A minimal RFC 5804 client session, signed in as {@link USER}. */
class SieveSession {
  private buffer = Buffer.alloc(0);
  private failure: Error | null = null;
  private wake: () => void = () => {};
  private readonly socket: Socket;

  private constructor(socket: Socket) {
    this.socket = socket;
    socket.on("data", (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.wake();
    });
    socket.on("error", (error) => {
      this.failure = error;
      this.wake();
    });
    socket.on("close", () => {
      this.failure ??= new Error("the ManageSieve server closed the connection");
      this.wake();
    });
  }

  static async open(): Promise<SieveSession> {
    const session = new SieveSession(connect(sieveAddress()));
    await session.response(); // the greeting: capabilities, then OK
    const token = Buffer.from(`\0${USER.address}\0${USER.password}`).toString("base64");
    await session.command(`AUTHENTICATE "PLAIN" ${quote(token)}`);
    return session;
  }

  close(): void {
    this.socket.end("LOGOUT\r\n");
  }

  async scripts(): Promise<SieveScript[]> {
    const scripts: SieveScript[] = [];
    for (const entry of await this.command("LISTSCRIPTS")) {
      const match = /^"((?:[^"\\]|\\.)*)"( ACTIVE)?$/i.exec(entry);
      if (!match) throw new Error(`unexpected LISTSCRIPTS entry: ${entry}`);
      const name = match[1].replace(/\\(.)/g, "$1");
      const [content = ""] = await this.command(`GETSCRIPT ${quote(name)}`);
      scripts.push({ name, active: Boolean(match[2]), content });
    }
    return scripts;
  }

  async putScript(name: string, content: string): Promise<void> {
    this.socket.write(`PUTSCRIPT ${quote(name)} {${Buffer.byteLength(content)}+}\r\n${content}\r\n`);
    await this.response();
  }

  async command(line: string): Promise<string[]> {
    this.socket.write(`${line}\r\n`);
    return this.response();
  }

  /** One response: its data lines with literals inlined, up to OK. NO and BYE
   * throw, carrying the server's reason. */
  private async response(): Promise<string[]> {
    const data: string[] = [];
    for (;;) {
      const line = await this.line();
      if (/^OK\b/i.test(line)) return data;
      if (/^(NO|BYE)\b/i.test(line)) throw new Error(`ManageSieve: ${line}`);
      const literal = /^\{(\d+)\+?\}$/.exec(line);
      if (literal) data.push(await this.octets(Number(literal[1])));
      else if (line !== "") data.push(line);
    }
  }

  private async line(): Promise<string> {
    for (;;) {
      const end = this.buffer.indexOf("\r\n");
      if (end >= 0) {
        const line = this.buffer.subarray(0, end).toString("utf8");
        this.buffer = this.buffer.subarray(end + 2);
        return line;
      }
      await this.more();
    }
  }

  private async octets(count: number): Promise<string> {
    while (this.buffer.length < count) await this.more();
    const text = this.buffer.subarray(0, count).toString("utf8");
    this.buffer = this.buffer.subarray(count);
    return text;
  }

  private async more(): Promise<void> {
    if (this.failure) throw this.failure;
    await new Promise<void>((resolve) => {
      this.wake = resolve;
    });
  }
}

async function withSieve<T>(run: (session: SieveSession) => Promise<T>): Promise<T> {
  const session = await SieveSession.open();
  try {
    return await run(session);
  } finally {
    session.close();
  }
}

/** Every script stored for {@link USER}, with its body. */
const storedScripts = () => withSieve((session) => session.scripts());

/** Stores `content` under `name` and makes it the active script, as another
 * Sieve client would. */
const storeActiveScript = (name: string, content: string) =>
  withSieve(async (session) => {
    await session.putScript(name, content);
    await session.command(`SETACTIVE ${quote(name)}`);
  });

// ---------------------------------------------------------------------------
// The page.
// ---------------------------------------------------------------------------

const settings = (page: Page) => page.locator("alps-managesieve-page");
const visual = (page: Page) => page.locator("alps-visual-editor");
const raw = (page: Page) => page.locator("alps-raw-editor");

const rules = (page: Page) => visual(page).locator(".rule-card");
const emptyState = (page: Page) => visual(page).getByText("No rules defined.", { exact: true });
const newRuleBtn = (page: Page) => visual(page).getByRole("button", { name: "New Rule", exact: true });
const rawSwitchBtn = (page: Page) => visual(page).getByRole("button", { name: "Raw Editor", exact: true });
/** Rendered only while the rules differ from what was last loaded or saved. */
const saveRulesBtn = (page: Page) => visual(page).getByRole("button", { name: "Save", exact: true });

const script = (page: Page) => raw(page).locator("textarea");
const validateBtn = (page: Page) => raw(page).getByRole("button", { name: "Validate", exact: true });
const saveScriptBtn = (page: Page) => raw(page).getByRole("button", { name: "Save", exact: true });

const confirmDialog = (page: Page) => page.locator("ui-confirm");

/** A rule's controls. The selects carry no label of their own, so they are
 * addressed by the row they sit in: the first condition row holds the "all /
 * any" choice, each one after it a condition; each action row an action. */
const condition = (rule: Locator, index = 0) => rule.locator(".condition-row").nth(index + 1);
const action = (rule: Locator, index = 0) => rule.locator(".action-row").nth(index);
const select = (row: Locator, index: number) => row.locator("alps-select select").nth(index);
const conditionValue = (rule: Locator, index = 0) => condition(rule, index).locator("alps-input input");

/** Signs in, opens Filters, and waits for the editor to replace the loader. */
async function openFilters(page: Page): Promise<void> {
  await login(page);
  await page.goto("/#/settings/managesieve");
  await expect(newRuleBtn(page).or(script(page))).toBeVisible();
}

/** Adds a rule, "Subject contains `marker` → move to `folder`", through the
 * editor's own controls, choosing every option by the label a user reads. */
async function addRule(page: Page, marker: string, folder = FOLDER): Promise<Locator> {
  await newRuleBtn(page).click();
  const rule = rules(page).last();
  await select(condition(rule), 0).selectOption({ label: "Subject" });
  await select(condition(rule), 1).selectOption({ label: "Contains" });
  await conditionValue(rule).fill(marker);
  await select(action(rule), 0).selectOption({ label: "Move to folder" });
  // The folder list arrives from its own request, possibly after the rule.
  await expect(select(action(rule), 1).locator(`option[value="${folder}"]`)).toBeAttached();
  await select(action(rule), 1).selectOption(folder);
  return rule;
}

const isScriptPut = (method: string, url: string) =>
  method === "PUT" && new URL(url).pathname === "/managesieve/script";

/** Clicks `button` and hands back the answer to the script upload it sends. */
async function clickAndAwaitSave(page: Page, button: Locator) {
  const put = page.waitForResponse((r) => isScriptPut(r.request().method(), r.url()));
  await button.click();
  return put;
}

/** Saves the visual rules and waits for the server to have them. */
async function saveRules(page: Page): Promise<void> {
  const response = await clickAndAwaitSave(page, saveRulesBtn(page));
  expect(response.status()).toBe(200);
  await expect(saveRulesBtn(page)).toHaveCount(0);
}

/** Swaps the visual editor for the raw one, through its confirmation. */
async function switchToRaw(page: Page): Promise<void> {
  await rawSwitchBtn(page).click();
  await confirmDialog(page).getByRole("button", { name: "Switch", exact: true }).click();
  await expect(confirmDialog(page)).toHaveCount(0);
  await expect(script(page)).toBeVisible();
}

/** Opens the raw editor the way a user reaches it from an empty account. */
async function openRawEditor(page: Page): Promise<void> {
  await openFilters(page);
  await newRuleBtn(page).click();
  await switchToRaw(page);
}

/** Opens a folder freshly: a reload makes the list ask the server again rather
 * than answer from what this session already fetched. */
async function openFolder(page: Page, folder: string): Promise<Locator> {
  await page.goto(`/#/mailbox/${folder}`);
  await page.reload();
  const list = page.locator("alps-message-list");
  await expect(list).toBeVisible();
  return list;
}

// Every script this file stores is ACTIVE while it exists, and an active script
// decides where mail lands for every spec that runs after this one.
test.afterEach(async () => {
  await resetSieve();
});

// --- The visual editor -----------------------------------------------------

test("a rule built in the visual editor is saved and becomes the active script", async ({ page }) => {
  const marker = uniqueMarker();
  await openFilters(page);
  await expect(emptyState(page)).toBeVisible();

  const rule = await addRule(page, marker);
  await expect(conditionValue(rule)).toHaveValue(marker);

  const response = await clickAndAwaitSave(page, saveRulesBtn(page));
  expect(response.status()).toBe(200);
  // What was uploaded is the compile of THESE rules.
  const sent = response.request().postDataJSON() as { content: string };
  expect(sent.content).toContain(`header :contains "Subject" "${marker}"`);
  expect(sent.content).toContain(`fileinto :create "${FOLDER}"`);

  await expect(toast(page, "Rules saved and activated.")).toBeVisible();
  // Nothing left unsaved: Save is offered only while the rules differ from
  // what the server has.
  await expect(saveRulesBtn(page)).toHaveCount(0);

  // Stored AND active is the server's state, so it is the server that is asked.
  const active = (await storedScripts()).filter((s) => s.active);
  expect(active).toHaveLength(1);
  expect(active[0].content).toBe(sent.content);
});

test("a saved rule files matching mail into its folder", async ({ page }) => {
  const marker = uniqueMarker();
  await openFilters(page);
  await addRule(page, marker);
  await saveRules(page);

  // Sieve runs on delivery, so this is the rule doing its job, not alps.
  const filed = `${marker} is filed`;
  const unfiled = `Unfiled ${Date.now()}`;
  await deliver({ subject: filed });
  await deliver({ subject: unfiled });

  const archive = await openFolder(page, FOLDER);
  await expect(archive.getByText(filed)).toBeVisible();

  // The message that did not match is in the Inbox — asserted first, so the
  // absence below is about a list that has loaded.
  const inbox = await openFolder(page, "INBOX");
  await expect(inbox.getByText(unfiled)).toBeVisible();
  await expect(inbox.getByText(filed)).toHaveCount(0);
});

test("saved rules come back after a reload and can be edited in place", async ({ page }) => {
  const first = uniqueMarker();
  const second = uniqueMarker();
  await openFilters(page);
  await addRule(page, first);
  await saveRules(page);

  // The rules are read back from the stored script, with their values.
  await page.reload();
  await expect(rules(page)).toHaveCount(1);
  const rule = rules(page).first();
  await expect(conditionValue(rule)).toHaveValue(first);
  await expect(select(action(rule), 1)).toHaveValue(FOLDER);
  // A rule as loaded is not an unsaved change.
  await expect(saveRulesBtn(page)).toHaveCount(0);

  await conditionValue(rule).fill(second);
  await saveRules(page);

  // Edited, not added to: the active script holds the new value only.
  const [active] = (await storedScripts()).filter((s) => s.active);
  expect(active.content).toContain(`"${second}"`);
  expect(active.content).not.toContain(`"${first}"`);

  await page.reload();
  await expect(rules(page)).toHaveCount(1);
  await expect(conditionValue(rules(page).first())).toHaveValue(second);
});

test("removing every rule turns filtering off", async ({ page }) => {
  const marker = uniqueMarker();
  await openFilters(page);
  await addRule(page, marker);
  await saveRules(page);
  expect((await storedScripts()).some((s) => s.active)).toBe(true);

  // Removing the rule is an edit like any other: nothing changes on the server
  // until it is saved.
  await rules(page).first().getByRole("button", { name: "Delete Rule", exact: true }).click();
  await expect(emptyState(page)).toBeVisible();
  expect((await storedScripts()).some((s) => s.active)).toBe(true);

  const response = await clickAndAwaitSave(page, saveRulesBtn(page));
  expect(response.status()).toBe(200);
  await expect(toast(page, "Rules deactivated.")).toBeVisible();

  // The server has no active script left — listed positively first, so the
  // check below is about a real listing.
  const scripts = await storedScripts();
  expect(scripts.length).toBeGreaterThan(0);
  expect(scripts.filter((s) => s.active)).toEqual([]);

  // And filtering really is off: mail the rule would have filed stays put.
  const subject = `${marker} stays`;
  await deliver({ subject });
  const inbox = await openFolder(page, "INBOX");
  await expect(inbox.getByText(subject)).toBeVisible();

  await page.goto("/#/settings/managesieve");
  await expect(emptyState(page)).toBeVisible();
  await expect(rules(page)).toHaveCount(0);
});

test("switching to the raw editor asks first, then shows the script the rules compile to", async ({ page }) => {
  const marker = uniqueMarker();
  await openFilters(page);
  await addRule(page, marker);

  await rawSwitchBtn(page).click();
  const dialog = confirmDialog(page);
  // The switch is one-way for these rules, so the question says so.
  await expect(dialog.getByRole("button", { name: "Switch", exact: true })).toBeVisible();
  await expect(dialog).toContainText("no longer be editable visually");

  // Declining leaves the rules where they were.
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(conditionValue(rules(page).first())).toHaveValue(marker);

  await switchToRaw(page);
  await expect(visual(page)).toHaveCount(0);
  // The only way a user sees what the rules became — and it is THESE rules.
  await expect(script(page)).toHaveValue(/require \["fileinto", "mailbox"\];/);
  await expect(script(page)).toHaveValue(new RegExp(`header :contains "Subject" "${marker}"`));
  await expect(script(page)).toHaveValue(new RegExp(`fileinto :create "${FOLDER}"`));

  // Switching is a change of view, not a save.
  expect((await storedScripts()).some((s) => s.active)).toBe(false);
});

// Switching to the raw editor starts it with the compiled rules as its
// "unchanged" text, so Save is disabled — even though those rules were never
// stored. The user sees their rules as a script they cannot save; leaving the
// page loses them. raw-editor.ts takes the first `script` it is given as the
// saved baseline (`initialScript` in willUpdate), and managesieve-page.ts
// `confirmSwitchToRaw` hands it unsaved text.
test.fixme("rules switched to the raw editor before they were saved can still be saved", async ({ page }) => {
  const marker = uniqueMarker();
  await openFilters(page);
  await addRule(page, marker);
  await switchToRaw(page);

  await expect(saveScriptBtn(page)).toBeEnabled();
  const response = await clickAndAwaitSave(page, saveScriptBtn(page));
  expect(response.status()).toBe(200);
  const [active] = (await storedScripts()).filter((s) => s.active);
  expect(active.content).toContain(`"${marker}"`);
});

// --- The raw editor --------------------------------------------------------

test("a script written by another client is opened as it is and edited in place", async ({ page }) => {
  const marker = uniqueMarker();
  const name = "catchall";
  const written = [
    'require ["fileinto"];',
    "# Kept by hand.",
    `if address :is "from" "${marker}@remote.test" {`,
    '\tfileinto "Junk";',
    "}",
    "",
  ].join("\n");
  await storeActiveScript(name, written);

  // Not "No rules defined.": it is the account's active script, and it has no
  // visual rules to show, so it opens as text — exactly as stored.
  await openFilters(page);
  await expect(script(page)).toHaveValue(written);
  await expect(visual(page)).toHaveCount(0);

  const edited = written.replace('fileinto "Junk"', `fileinto "${FOLDER}"`);
  await script(page).fill(edited);
  const response = await clickAndAwaitSave(page, saveScriptBtn(page));
  expect(response.status()).toBe(200);

  // Saved into THAT script: still the only one, still active, now edited.
  expect(await storedScripts()).toEqual([{ name, active: true, content: edited }]);
});

test("an invalid script is reported with its line and column", async ({ page }) => {
  await openRawEditor(page);
  await script(page).fill(INVALID);

  // The refusal is the behaviour under test, and Chromium logs every non-2xx
  // response as a console error — a network line, not something alps wrote.
  // Allowed by exact status, so a 500 from the same call still fails.
  allowConsoleErrors(page, /Failed to load resource:.*\b400\b/i);

  const checked = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/managesieve/validate",
  );
  await validateBtn(page).click();
  const response = await checked;
  expect(response.status()).toBe(400);
  const { error } = (await response.json()) as { error: string };
  expect(error).toContain(POSITION);
  expect(error).toContain(OFFENDER);

  // The user sees the parser's own verdict — where, and what it choked on —
  // not a generic failure.
  const verdict = toast(page, OFFENDER);
  await expect(verdict).toBeVisible();
  await expect(verdict).toContainText(POSITION);
  await expect(toast(page, "Script is valid!")).toHaveCount(0);
});

test("a valid script checks clean, saves, and survives a reload", async ({ page }) => {
  const marker = uniqueMarker();
  // imap4flags is not something the parser allows on its own: the check passes
  // only because the server advertises it.
  const valid = [
    'require ["fileinto", "imap4flags"];',
    `if header :contains "Subject" "${marker}" {`,
    '\taddflag "\\\\Flagged";',
    `\tfileinto "${FOLDER}";`,
    "}",
    "",
  ].join("\n");

  await openRawEditor(page);
  await script(page).fill(valid);

  await validateBtn(page).click();
  await expect(toast(page, "Script is valid!")).toBeVisible();

  const response = await clickAndAwaitSave(page, saveScriptBtn(page));
  expect(response.status()).toBe(200);
  await expect(toast(page, "Rules saved and activated.")).toBeVisible();
  // Nothing left unsaved.
  await expect(saveScriptBtn(page)).toBeDisabled();

  const [active] = (await storedScripts()).filter((s) => s.active);
  expect(active.content).toBe(valid);

  await page.reload();
  await expect(script(page)).toHaveValue(valid);
});

test("saving a script that does not compile is refused and leaves the stored one intact", async ({ page }) => {
  const stored = 'require ["fileinto"];\n';
  await openRawEditor(page);
  await script(page).fill(stored);
  expect((await clickAndAwaitSave(page, saveScriptBtn(page))).status()).toBe(200);
  await expect(saveScriptBtn(page)).toBeDisabled();

  await script(page).fill(INVALID);
  // A deliberate "store it anyway": nothing stops the click, so the refusal
  // below is the server's, not the editor declining to send.
  await expect(saveScriptBtn(page)).toBeEnabled();

  allowConsoleErrors(page, /Failed to load resource:.*\b400\b/i);
  const response = await clickAndAwaitSave(page, saveScriptBtn(page));
  expect(response.status()).toBe(400);
  // A refused save names the position the same way a check does.
  const verdict = toast(page, OFFENDER);
  await expect(verdict).toBeVisible();
  await expect(verdict).toContainText(POSITION);
  // Still unsaved, so still offered.
  await expect(saveScriptBtn(page)).toBeEnabled();

  // And the refusal is real: the stored script is the one that compiled.
  await page.reload();
  await expect(script(page)).toHaveValue(stored);
  const [active] = (await storedScripts()).filter((s) => s.active);
  expect(active.content).toBe(stored);
});

// --- Words -----------------------------------------------------------------

// Button labels are checked as ACCESSIBLE NAMES: the role locators resolve to
// the `<button>` inside `alps-button`'s shadow root, whose only child is an
// empty `<slot>`, and Playwright's text matching does not follow slot
// assignment. Name computation does — and the name is what a screen reader
// announces anyway.
test("the filter controls are labelled in words, not i18n keys", async ({ page }) => {
  await openFilters(page);

  await expect(page.locator("settings-page alps-category-item").filter({ hasText: /^\s*Filters\s*$/ })).toBeVisible();
  const group = settings(page).locator("alps-setting-group");
  await expect(group.locator(".setting-label")).toHaveText("Filters");
  await expect(group.locator(".setting-description")).toHaveText(
    "Add custom rules on how messages are processed and filed.",
  );
  await expect(emptyState(page)).toBeVisible();
  await expect(newRuleBtn(page)).toHaveAccessibleName("New Rule");

  await newRuleBtn(page).click();
  const rule = rules(page).first();
  await expect(rule).toContainText("IF");
  await expect(rule).toContainText("of the following conditions match");
  await expect(rule).toContainText("THEN");
  // What each choice reads as, not just what it stores.
  await expect(select(rule.locator(".condition-row").first(), 0).locator("option")).toHaveText(["ALL", "ANY"]);
  await expect(select(condition(rule), 0).locator("option")).toHaveText(["Subject", "From", "To", "Body", "Size"]);
  await expect(select(condition(rule), 1).locator("option")).toHaveText([
    "Contains",
    "Does not contain",
    "Is exactly",
    "Is not exactly",
  ]);
  await expect(select(action(rule), 0).locator("option")).toHaveText([
    "Move to folder",
    "Redirect to email",
    "Discard (Delete)",
    "Stop evaluating rules",
  ]);
  // The icon buttons have no text: their title is all a user is told.
  await expect(rule.getByRole("button", { name: "Delete Rule", exact: true })).toBeVisible();
  await expect(condition(rule).getByRole("button", { name: "Add", exact: true })).toBeVisible();
  await expect(saveRulesBtn(page)).toHaveAccessibleName("Save");
  await expect(rawSwitchBtn(page)).toHaveAccessibleName("Raw Editor");

  await rawSwitchBtn(page).click();
  const dialog = confirmDialog(page);
  await expect(dialog.getByRole("button", { name: "Switch", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeVisible();
  await expect(dialog).toContainText("Switch to Raw Mode");
  await expect(dialog).toContainText(
    "Switching to raw mode means the script will no longer be editable visually. Continue?",
  );
  await dialog.getByRole("button", { name: "Switch", exact: true }).click();

  await expect(validateBtn(page)).toHaveAccessibleName("Validate");
  await expect(saveScriptBtn(page)).toHaveAccessibleName("Save");

  // Nothing on the page is an unresolved key. Asserted last, after the words
  // above, so it cannot pass against a page that has not rendered.
  await expect(settings(page)).not.toContainText("managesieve.");
});
