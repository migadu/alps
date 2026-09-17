/**
 * Shared setup for the browser tests.
 *
 * The important piece is {@link test}, which FAILS a test on any console error
 * or unhandled rejection. Most of what these tests exist to catch does not
 * throw where anyone is looking: it logs, renders nothing, and carries on. A
 * test that only asserted on visible text would miss it.
 *
 * Everything else talks to the stack `scripts/e2e.sh` started — sora's admin
 * API to create accounts and deliver mail, the test stack's control API to
 * reset an account and read what was sent, and the DAV server to seed events
 * and contacts — the way mail and data really arrive, never through alps.
 */
import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";
import { keepSession } from "./session-probe";

const CONTROL_URL = process.env.CONTROL_URL ?? "http://127.0.0.1:8907";
const SORA_ADMIN_URL = process.env.SORA_ADMIN_URL ?? "http://127.0.0.1:8903";
const SORA_ADMIN_KEY = process.env.SORA_ADMIN_KEY ?? "e2e-admin-key-not-a-secret";
const DAV_URL = process.env.DAV_URL ?? "http://127.0.0.1:8906";

export const USER = {
  address: process.env.E2E_USER ?? "alice@example.test",
  password: process.env.E2E_PASSWORD ?? "alice-e2e-password",
};

/** Noise that is not the application's doing and would fail every test. */
const IGNORED = [
  /favicon/i,
  /Lit is in dev mode/i,
  /\[vite\]/i,
  // Playwright instruments every frame it can see, including the reader's
  // `srcdoc` frame, which is sandboxed WITHOUT `allow-scripts` so that nothing
  // in a message can run. Chromium reports the refusal as a console error:
  // this line is the containment working, and it appears on every HTML message.
  /Blocked script execution in 'about:srcdoc'/i,
];

/**
 * Per-test console-error allowances, keyed by page so one test cannot loosen
 * another.
 *
 * Chromium logs a console error for every non-2xx response, a network log line
 * the application never wrote, and a few tests exist precisely to provoke a
 * refusal. Ignoring those globally would hide a genuine 500 everywhere else.
 */
const allowances = new WeakMap<Page, RegExp[]>();

/** Permits console errors matching `patterns` for THIS test only. Call it
 * before the action that provokes them. */
export function allowConsoleErrors(page: Page, ...patterns: RegExp[]): void {
  allowances.set(page, [...(allowances.get(page) ?? []), ...patterns]);
}

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const problems: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (IGNORED.some((re) => re.test(text))) return;
      if ((allowances.get(page) ?? []).some((re) => re.test(text))) return;
      problems.push(`console.error: ${text}`);
    });
    page.on("pageerror", (err) => problems.push(`uncaught: ${err.message}`));

    await use(page);

    // After the body, so a failed expectation surfaces before the error it
    // caused.
    expect(problems, "the page logged errors").toEqual([]);
  },
});

export { expect };

async function checked(response: Response, what: string): Promise<Response> {
  if (!response.ok) {
    throw new Error(`${what}: ${response.status} ${await response.text()}`);
  }
  return response;
}

let deliveries = 0;

/**
 * Delivers a message into the mailbox through sora's delivery API, the path
 * real mail takes: Sieve filters run on it.
 *
 * `raw` replaces the generated message entirely. Otherwise a plain-text
 * message is built, with a Message-ID derived from `messageId` or made unique.
 */
export async function deliver(opts: {
  subject: string;
  from?: string;
  to?: string;
  body?: string;
  /** Extra header lines, CRLF-separated. */
  headers?: string;
  messageId?: string;
  raw?: string;
  recipient?: string;
}): Promise<void> {
  const from = opts.from ?? "Ada Lovelace <ada@remote.test>";
  const messageId =
    opts.messageId ?? `e2e-${Date.now()}-${++deliveries}-${Math.random().toString(36).slice(2)}@remote.test`;
  const raw =
    opts.raw ??
    [
      `From: ${from}`,
      `To: ${opts.to ?? USER.address}`,
      `Subject: ${opts.subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${messageId}>`,
      "MIME-Version: 1.0",
      ...(opts.headers ? [opts.headers] : []),
      "Content-Type: text/plain; charset=utf-8",
      "",
      opts.body ?? "Message body.",
      "",
    ].join("\r\n");

  const response = await checked(
    await fetch(`${SORA_ADMIN_URL}/admin/mail/deliver`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SORA_ADMIN_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: [opts.recipient ?? USER.address], message: raw }),
    }),
    "deliver",
  );
  const result = (await response.json()) as { success?: boolean; error?: string };
  if (!result.success) throw new Error(`delivery failed: ${JSON.stringify(result)}`);
}

/**
 * Types the password in and waits for the mailbox — a REAL sign-in, every
 * time. For the tests about signing in; everything else wants {@link login}.
 */
export async function signIn(page: Page): Promise<void> {
  return signInAs(page, USER.address, USER.password);
}

/** {@link signIn} for an arbitrary account. */
export async function signInAs(page: Page, address: string, password: string): Promise<void> {
  await page.goto("/#/login");
  await page.locator("login-page #username").fill(address);
  await page.locator("login-page #password").fill(password);
  await page.locator("login-page button[type=submit]").click();
  try {
    await page.waitForURL(/#\/mailbox/, { timeout: 15_000 });
  } catch (error) {
    // The form's own message, if it has one: a refused sign-in otherwise
    // presents as a bare navigation timeout.
    const shown = await page.locator("login-page .error-container").innerText().catch(() => "");
    const reason = shown ? ` — the login form says: ${shown.trim()}` : "";
    throw new Error(`sign-in did not reach the mailbox${reason}`, { cause: error });
  }
}

type Cookie = Awaited<ReturnType<BrowserContext["cookies"]>>[number];

/**
 * The cookies of the last sign-in that worked, replayed into later tests.
 *
 * A sign-in costs a password hash on the IMAP server and opens a session alps
 * keeps in memory, capped per user; a suite that signed every test in through
 * the form would spend most of its time there and churn through that cap.
 *
 * Cookies only, not `storageState()`: that would carry localStorage across too,
 * and one test's saved drafts or remembered view would arrive in the next.
 *
 * Every reuse is PROVED first, because signing out really does end the session
 * and a later test must not start on a dead one.
 */
let cachedCookies: Cookie[] | null = null;

/**
 * Whether the cookies in the jar still open a working session. Asked through
 * `page.request`, outside the page, so the refusal for a dead session does not
 * reach the console watcher of a test that is about to recover from it.
 */
async function sessionIsLive(page: Page): Promise<boolean> {
  const probe = await page.request.get("/mailboxes/INBOX/status").catch(() => null);
  return keepSession(probe ? probe.status() : null);
}

/** Puts the mailbox on screen, signed in as {@link USER}, reusing the run's
 * session when it is still good. */
export async function login(page: Page): Promise<void> {
  if (cachedCookies) {
    await page.context().addCookies(cachedCookies);
    if (await sessionIsLive(page)) {
      await page.goto("/#/mailbox/INBOX");
      await page.waitForURL(/#\/mailbox/, { timeout: 15_000 });
      return;
    }
    // Cleared rather than overwritten: the `alps_logged_in` marker left behind
    // would make the shell render the mailbox for a session that is gone.
    await page.context().clearCookies();
    cachedCookies = null;
  }
  await signIn(page);
  cachedCookies = await page.context().cookies();
}

async function control(path: string, init?: RequestInit): Promise<Response> {
  return checked(await fetch(`${CONTROL_URL}${path}`, init), `control ${path}`);
}

function asAccount(account = USER) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: account.address, password: account.password }),
  };
}

/**
 * Drops every setting alps has stored for the account.
 *
 * Settings live on the IMAP server (METADATA), shared by every test in the
 * run, so a preference one spec changes is a preference every later spec
 * inherits unless it is put back.
 *
 * Dropping the server's record is not enough on its own: an alps session keeps
 * a copy of it on its IMAP connection for the reads a listing makes, so the
 * session {@link login} reuses could list mail as the test left it. The next
 * `login` therefore signs in afresh.
 */
export async function resetSettings(account = USER): Promise<void> {
  await control("/reset/settings", asAccount(account));
  if (account.address === USER.address) cachedCookies = null;
}

/** Deactivates and deletes every Sieve script on the account. */
export async function resetSieve(account = USER): Promise<void> {
  await control("/reset/sieve", asAccount(account));
}

/** Empties the account's calendar and address book. */
export async function resetDav(account = USER): Promise<void> {
  await control("/reset/dav", asAccount(account));
}

export type SentMessage = {
  from: string;
  recipients: string[];
  username: string;
  data: string;
  at: string;
};

/** Everything the SMTP server has accepted this run, oldest first. */
export async function sentMessages(): Promise<SentMessage[]> {
  return (await (await control("/outbox")).json()) as SentMessage[];
}

/** Forgets what the SMTP server has accepted so far. */
export async function clearSent(): Promise<void> {
  await control("/outbox", { method: "DELETE" });
}

/** Waits for a submission whose raw message matches `match`, and returns it. */
export async function waitForSent(match: (m: SentMessage) => boolean, timeout = 10_000): Promise<SentMessage> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const found = (await sentMessages()).find(match);
    if (found) return found;
    if (Date.now() > deadline) throw new Error("no matching message was sent");
    await new Promise((r) => setTimeout(r, 200));
  }
}

function davAuth(account = USER): string {
  return "Basic " + Buffer.from(`${account.address}:${account.password}`).toString("base64");
}

/**
 * Files a calendar object straight into the account's calendar, as raw
 * iCalendar: a DAV client's bytes, not alps's.
 */
export async function seedEvent(opts: {
  uid: string;
  summary: string;
  /** `YYYYMMDDTHHMMSSZ`, or `YYYYMMDD` for an all-day event. */
  dtstart: string;
  dtend?: string;
  rrule?: string;
  organizer?: string;
  attendees?: string[];
}): Promise<void> {
  const allDay = /^\d{8}$/.test(opts.dtstart);
  const dateProp = (name: string, value: string) => (allDay ? `${name};VALUE=DATE:${value}` : `${name}:${value}`);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//alps//e2e//EN",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    "DTSTAMP:20260101T000000Z",
    dateProp("DTSTART", opts.dtstart),
    ...(opts.dtend ? [dateProp("DTEND", opts.dtend)] : []),
    `SUMMARY:${opts.summary}`,
    ...(opts.rrule ? [`RRULE:${opts.rrule}`] : []),
    ...(opts.organizer ? [`ORGANIZER:mailto:${opts.organizer}`] : []),
    ...(opts.attendees ?? []).map((a) => `ATTENDEE;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a}`),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];
  await seedCalendarObject(opts.uid, lines.join("\r\n"));
}

/** Files arbitrary iCalendar text under `{uid}.ics`. */
export async function seedCalendarObject(uid: string, ics: string, account = USER): Promise<void> {
  await checked(
    await fetch(`${DAV_URL}/caldav/${account.address}/calendars/default/${uid}.ics`, {
      method: "PUT",
      headers: { Authorization: davAuth(account), "Content-Type": "text/calendar" },
      body: ics,
    }),
    "seed calendar object",
  );
}

/** Reads a calendar object back as the server holds it, or null. */
export async function readCalendarObject(uid: string, account = USER): Promise<string | null> {
  const response = await fetch(`${DAV_URL}/caldav/${account.address}/calendars/default/${uid}.ics`, {
    headers: { Authorization: davAuth(account) },
  });
  if (response.status === 404) return null;
  return (await checked(response, "read calendar object")).text();
}

/** Files a contact into the account's address book, as raw vCard. */
export async function seedContact(opts: { uid: string; name: string; email: string }): Promise<void> {
  const body = ["BEGIN:VCARD", "VERSION:3.0", `UID:${opts.uid}`, `FN:${opts.name}`, `EMAIL:${opts.email}`, "END:VCARD", ""].join(
    "\r\n",
  );
  await checked(
    await fetch(`${DAV_URL}/carddav/${USER.address}/contacts/default/${opts.uid}.vcf`, {
      method: "PUT",
      headers: { Authorization: davAuth(), "Content-Type": "text/vcard" },
      body,
    }),
    "seed contact",
  );
}

/**
 * Creates a THROWAWAY account in sora. For the tests that sign in as someone
 * else or delete what they signed into — never {@link USER}, whom every other
 * spec depends on.
 */
export async function createAccount(opts: { address: string; password: string }): Promise<void> {
  await checked(
    await fetch(`${SORA_ADMIN_URL}/admin/accounts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SORA_ADMIN_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: opts.address, password: opts.password }),
    }),
    `create account ${opts.address}`,
  );
}

/** Deletes an account in sora, the way an administrator would, leaving
 * whatever the browser holds alone. */
export async function deleteAccount(address: string): Promise<void> {
  await checked(
    await fetch(`${SORA_ADMIN_URL}/admin/accounts/${encodeURIComponent(address)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${SORA_ADMIN_KEY}` },
    }),
    `delete account ${address}`,
  );
}

/** The visible toast carrying `text`. */
export function toast(page: Page, text: string | RegExp) {
  return page.locator("alps-toast").filter({ hasText: text });
}
