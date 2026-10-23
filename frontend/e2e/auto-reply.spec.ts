// Automatic replies (Settings → Auto-reply).
//
// The reply is a Sieve `vacation` action (RFC 5230) that the mail server runs
// on delivery. ManageSieve gives an account one active script, and the filters
// already live in it, so the auto-reply is a block of its own inside that same
// script: the Filters editors never show it and keep it when they save, and the
// auto-reply page keeps everything around it as it was written (it adds one
// line break at most, after a `require` that shares its line).
//
// What only a browser test against the real stack can prove:
//
//  1. Switched on here, the server really answers: the reply leaves through
//     the server's relay and arrives in the test stack's outbox, from the
//     account's own address, with the subject and message typed here.
//  2. Switched off, the replies stop, and what was written is kept.
//  3. Filters go on filing beside it, and saving either page leaves the other
//     one's part of the script alone.
//  4. A script written by another Sieve client is kept as it was written.
//  5. The dates are the server's to check, and it checks them.
//
// The server answers each sender once per `:days`, remembered for the whole
// run, so every test writes from addresses of its own.

import type { Locator, Page } from "@playwright/test";
import { deliver, expect, login, resetSieve, sentMessages, test, toast, USER, waitForSent, type SentMessage } from "./fixtures";
import { storeActiveScript, storedScripts } from "./sieve-server";

let counter = 0;
const uniqueMarker = () => `reply-${Date.now()}-${String(counter++).padStart(2, "0")}`;
/** A sender nobody else in the run writes from. */
const newSender = () => `${uniqueMarker()}@remote.test`;

/** A local calendar day as `YYYY-MM-DD`, `offset` days from today. The browser
 * runs on this machine's clock and zone, so it agrees about which day it is. */
function localDay(offset = 0): string {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** The block alps stores the auto-reply in, as it sits in the script. */
const AUTO_REPLY_BLOCK = /^# ALPS_AUTOREPLY: [^\n]*\n(?:[^\n]*\n)*?# ALPS_AUTOREPLY_END\n/m;

// ---------------------------------------------------------------------------
// The page.
// ---------------------------------------------------------------------------

const autoReply = (page: Page) => page.locator("alps-auto-reply-page");
const enabled = (page: Page) => autoReply(page).getByRole("checkbox", { name: "Send an auto-reply", exact: true });
const subject = (page: Page) => autoReply(page).locator("alps-input.subject input");
const message = (page: Page) => autoReply(page).locator("textarea");
const startDate = (page: Page) => autoReply(page).locator("alps-input.start input");
const endDate = (page: Page) => autoReply(page).locator("alps-input.end input");
const interval = (page: Page) => autoReply(page).locator("alps-select select");
const saveBtn = (page: Page) => autoReply(page).getByRole("button", { name: "Save", exact: true });

/** Signs in and opens Settings → Auto-reply, through its entry in the list. */
async function openAutoReply(page: Page): Promise<void> {
  await login(page);
  await page.goto("/#/settings/general");
  await page.locator("settings-window alps-category-item").filter({ hasText: /^\s*Auto-reply\s*$/ }).click();
  await expect(enabled(page)).toBeVisible();
}

const isScriptPut = (method: string, url: string) =>
  method === "PUT" && new URL(url).pathname === "/managesieve/script";

/** Saves the form and waits for the server to have it. */
async function save(page: Page, said: string): Promise<{ content: string }> {
  const put = page.waitForResponse((r) => isScriptPut(r.request().method(), r.url()));
  await saveBtn(page).click();
  const response = await put;
  expect(response.status()).toBe(200);
  // The newest toast: a save just before this one may still show its own.
  await expect(toast(page, said).last()).toBeVisible();
  return response.request().postDataJSON() as { content: string };
}

/** Writes an auto-reply into the form and switches it on. */
async function fillIn(page: Page, reply: { subject: string; message: string }): Promise<void> {
  await enabled(page).check();
  await subject(page).fill(reply.subject);
  await message(page).fill(reply.message);
}

/** The reply the server sent `sender`, once it is in the outbox. Sent from the
 * relay queue, which the server works through every second. */
const replyTo = (sender: string): Promise<SentMessage> =>
  waitForSent((m) => m.recipients.includes(sender), 20_000);

/**
 * That `sender` got no reply. Asked only after a reply to a LATER message has
 * left: the server sends its queue in the order it was filled, so a reply to
 * `sender` would have left first.
 */
async function expectNoReplyTo(sender: string): Promise<void> {
  expect((await sentMessages()).filter((m) => m.recipients.includes(sender))).toEqual([]);
}

/** Opens a folder freshly, so the list asks the server again. */
async function openFolder(page: Page, folder: string): Promise<Locator> {
  await page.goto(`/#/mailbox/${folder}`);
  await page.reload();
  const list = page.locator("alps-message-list");
  await expect(list).toBeVisible();
  return list;
}

// The Filters page, as much of it as these tests drive.
const filters = (page: Page) => page.locator("alps-managesieve-page");
const rules = (page: Page) => filters(page).locator("alps-visual-editor .rule-card");
const condition = (rule: Locator) => rule.locator(".condition-row").nth(1);
const action = (rule: Locator) => rule.locator(".action-row").first();
const select = (row: Locator, index: number) => row.locator("alps-select select").nth(index);
const conditionValue = (rule: Locator) => condition(rule).locator("alps-input input");
const rawScript = (page: Page) => filters(page).locator("alps-raw-editor textarea");

async function openFilters(page: Page): Promise<void> {
  await page.goto("/#/settings/managesieve");
  await expect(filters(page).getByRole("button", { name: "New Rule", exact: true }).or(rawScript(page))).toBeVisible();
}

/** Saves the visual rules and waits for the server to have them. */
async function saveRules(page: Page): Promise<void> {
  const put = page.waitForResponse((r) => isScriptPut(r.request().method(), r.url()));
  await filters(page).getByRole("button", { name: "Save", exact: true }).click();
  expect((await put).status()).toBe(200);
  await expect(toast(page, "Rules saved and activated.")).toBeVisible();
}

// Every script these tests store is active, and an active script decides what
// happens to the mail of every spec that runs after this one.
test.afterEach(async () => {
  await resetSieve();
});

// ---------------------------------------------------------------------------

test("an auto-reply switched on here answers a sender, from the account's address", async ({ page }) => {
  test.setTimeout(60_000);
  const marker = uniqueMarker();
  const sender = newSender();
  await openAutoReply(page);
  // Off until it is switched on, and saying what it is for.
  await expect(enabled(page)).not.toBeChecked();
  await expect(autoReply(page).locator("alps-setting-group").first().locator(".setting-description")).toHaveText(
    "Reply automatically to people who write to you while you are away.",
  );

  await fillIn(page, { subject: `Away ${marker}`, message: "I am away until Monday.\nBack soon." });
  const sent = await save(page, "Auto-reply saved.");
  // Asked of the script, because the delivered reply cannot tell: sora sends
  // from the recipient's address when the script names none.
  expect(sent.content).toContain(`:from "${USER.address}" :addresses ["${USER.address}"]`);
  await expect(autoReply(page)).toContainText("Replying to senders now.");

  const messageId = `${marker}@remote.test`;
  await deliver({ from: `Bob <${sender}>`, subject: `Question ${marker}`, messageId });
  const reply = await replyTo(sender);

  // From the account's address, as an automatic reply to THAT message, with
  // the subject and the message typed above, line for line.
  expect(reply.from).toBe(USER.address);
  expect(reply.data).toMatch(new RegExp(`^From: ${USER.address.replace(/\./g, "\\.")}\\r?$`, "m"));
  expect(reply.data).toMatch(new RegExp(`^Subject: Away ${marker}\\r?$`, "m"));
  expect(reply.data).toMatch(/^Auto-Submitted: auto-replied\r?$/m);
  expect(reply.data).toContain(`In-Reply-To: <${messageId}>`);
  expect(reply.data).toMatch(/I am away until Monday\.\r?\nBack soon\./);

  // The vacation action keeps the message as well: it is in the Inbox.
  const inbox = await openFolder(page, "INBOX");
  await expect(inbox.getByText(`Question ${marker}`)).toBeVisible();

  // Nothing on the page is an unresolved key.
  await openAutoReply(page);
  await expect(autoReply(page)).not.toContainText("managesieve.");
});

test("switching the auto-reply off stops the replies, and keeps what was written", async ({ page }) => {
  test.setTimeout(60_000);
  const marker = uniqueMarker();
  const first = newSender();
  const second = newSender();
  await openAutoReply(page);
  await fillIn(page, { subject: `Away ${marker}`, message: "Out until Monday." });
  await save(page, "Auto-reply saved.");
  await deliver({ from: first, subject: `First ${marker}` });
  await replyTo(first);

  // What was saved comes back on a reload, switched on.
  await page.reload();
  await expect(enabled(page)).toBeChecked();
  await expect(subject(page)).toHaveValue(`Away ${marker}`);
  await expect(message(page)).toHaveValue("Out until Monday.");

  await enabled(page).uncheck();
  const sent = await save(page, "Auto-reply turned off.");
  expect(sent.content).not.toMatch(/^\s*vacation\b/m);
  await deliver({ from: second, subject: `Second ${marker}` });

  // Off, and the text is still there for next time.
  await page.reload();
  await expect(enabled(page)).not.toBeChecked();
  await expect(subject(page)).toHaveValue(`Away ${marker}`);
  await expect(message(page)).toHaveValue("Out until Monday.");

  // Switched back on as it was, it answers again — and that reply is what
  // shows the message sent while it was off got none.
  const third = newSender();
  await enabled(page).check();
  await save(page, "Auto-reply saved.");
  await deliver({ from: third, subject: `Third ${marker}` });
  await replyTo(third);
  await expectNoReplyTo(second);
});

test("filters keep filing beside the auto-reply, and neither page undoes the other", async ({ page }) => {
  test.setTimeout(60_000);
  const marker = uniqueMarker();
  await login(page);

  // A rule built in the Filters editor: Subject contains the marker → Archive.
  await openFilters(page);
  await filters(page).getByRole("button", { name: "New Rule", exact: true }).click();
  const rule = rules(page).first();
  await select(condition(rule), 0).selectOption({ label: "Subject" });
  await select(condition(rule), 1).selectOption({ label: "Contains" });
  await conditionValue(rule).fill(marker);
  await select(action(rule), 0).selectOption({ label: "Move to folder" });
  await expect(select(action(rule), 1).locator('option[value="Archive"]')).toBeAttached();
  await select(action(rule), 1).selectOption("Archive");
  await saveRules(page);
  const [filtersOnly] = (await storedScripts()).filter((s) => s.active);

  await openAutoReply(page);
  await fillIn(page, { subject: `Away ${marker}`, message: "Out this week." });
  await save(page, "Auto-reply saved.");

  // The rules are still in the active script, exactly as Filters wrote them:
  // the auto-reply went in beside them.
  const [both] = (await storedScripts()).filter((s) => s.active);
  expect(both.name).toBe(filtersOnly.name);
  expect(both.content.replace(AUTO_REPLY_BLOCK, "")).toBe(filtersOnly.content);

  // Filed as before, and a message the rule leaves alone — its subject does
  // not hold the marker — is answered.
  const answered = newSender();
  await deliver({ from: newSender(), subject: `${marker} is filed` });
  await deliver({ from: answered, subject: `Unfiled ${uniqueMarker()}` });
  await replyTo(answered);
  const archive = await openFolder(page, "Archive");
  await expect(archive.getByText(`${marker} is filed`)).toBeVisible();

  // Filters shows its rule, and only its rule; saving an edit to it keeps the
  // auto-reply, which goes on answering.
  const edited = `${marker}-edited`;
  await openFilters(page);
  await expect(rules(page)).toHaveCount(1);
  await expect(conditionValue(rules(page).first())).toHaveValue(marker);
  await conditionValue(rules(page).first()).fill(edited);
  await saveRules(page);
  const [after] = (await storedScripts()).filter((s) => s.active);
  expect(after.content).toContain(`"${edited}"`);
  expect(after.content.match(AUTO_REPLY_BLOCK)?.[0]).toBe(both.content.match(AUTO_REPLY_BLOCK)?.[0]);

  const later = newSender();
  await deliver({ from: later, subject: `Later ${uniqueMarker()}` });
  await replyTo(later);

  // And the auto-reply page still has it, switched on.
  await openAutoReply(page);
  await expect(enabled(page)).toBeChecked();
  await expect(message(page)).toHaveValue("Out this week.");
});

test("a script written by another client is kept as written around the auto-reply", async ({ page }) => {
  test.setTimeout(60_000);
  const marker = uniqueMarker();
  const head = ['# Kept by hand.', 'require ["fileinto"];', ""].join("\n");
  const body = [`if address :is "from" "${marker}@remote.test" {`, '\tfileinto "Junk";', "}", ""].join("\n");
  const written = head + body;
  await storeActiveScript("catchall", written);

  await openAutoReply(page);
  await fillIn(page, { subject: `Away ${marker}`, message: "Away." });
  await save(page, "Auto-reply saved.");

  // Still the only script, still active, and the hand-written text is all
  // there: the reply sits after its `require`, as Sieve wants it.
  const scripts = await storedScripts();
  expect(scripts.map((s) => [s.name, s.active])).toEqual([["catchall", true]]);
  const stored = scripts[0].content;
  expect(stored.startsWith(head)).toBe(true);
  expect(stored.endsWith(body)).toBe(true);
  expect(stored.replace(AUTO_REPLY_BLOCK, "")).toBe(written);

  const sender = newSender();
  await deliver({ from: sender, subject: `Hello ${marker}` });
  await replyTo(sender);

  // The raw editor shows what was written by hand, and nothing else.
  await openFilters(page);
  await expect(rawScript(page)).toHaveValue(written);

  // Switching it off leaves the hand-written text as it was.
  await openAutoReply(page);
  await enabled(page).uncheck();
  await save(page, "Auto-reply turned off.");
  const [off] = await storedScripts();
  expect(off.content.replace(AUTO_REPLY_BLOCK, "")).toBe(written);
});

test("a reply dated to start tomorrow waits, and one dated today answers", async ({ page }) => {
  test.setTimeout(60_000);
  const marker = uniqueMarker();
  await openAutoReply(page);
  await fillIn(page, { subject: `Away ${marker}`, message: "Away for a day." });
  await startDate(page).fill(localDay(1));
  await save(page, "Auto-reply saved.");
  await expect(autoReply(page)).toContainText("Scheduled to start on");

  const early = newSender();
  await deliver({ from: early, subject: `Early ${marker}` });

  await startDate(page).fill(localDay(0));
  await endDate(page).fill(localDay(0));
  // How often one sender is answered is the server's `:days`.
  await interval(page).selectOption({ label: "1 day" });
  const sent = await save(page, "Auto-reply saved.");
  expect(sent.content).toContain(":days 1 ");
  await expect(autoReply(page)).toContainText("Replying to senders until");

  const today = newSender();
  await deliver({ from: today, subject: `Today ${marker}` });
  await replyTo(today);
  // The message that came before the start got none.
  await expectNoReplyTo(early);
});
