// Editing a task and saving it — through a real browser, against a real
// CalDAV server.
//
// The unit suites drive the task editor in jsdom with the network stubbed. That
// shows the editor builds a request; it cannot show what a native `date` or
// `time` control does when a person drives it, and it can never show what the
// server made of the write. A save that sent nothing, a save that was refused
// and a save that stored the wrong thing look alike from the editor: the
// window closes each time. Only the wire and the stored object tell them
// apart.
//
// So every test here drives the editor as a person does, waits for the write
// and its answer, and then reads the calendar object back from the DAV server:
// the stored iCalendar is the proof an edit arrived.

import type { Locator, Page } from "@playwright/test";
import {
  expect,
  login,
  readCalendarObject,
  resetDav,
  seedCalendarObject,
  test,
  toast,
  USER,
  waitForSent,
} from "./fixtures";

const run = Date.now();

test.afterEach(async () => {
  await resetDav();
});

/** Files a VTODO into the account's calendar the way a CalDAV client would. */
async function seedTask(opts: {
  uid: string;
  summary: string;
  /** `YYYYMMDDTHHMMSSZ`; for an all-day task only its date is used. Omitted: an undated task. */
  due?: string;
  /** A DATE-valued DUE: an all-day task, which the editor shows without a time. */
  allDay?: boolean;
  rrule?: string;
  organizer?: string;
  attendees?: string[];
}): Promise<void> {
  const due =
    opts.due === undefined ? [] : opts.allDay ? [`DUE;VALUE=DATE:${opts.due.slice(0, 8)}`] : [`DUE:${opts.due}`];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//alps//e2e//EN",
    "BEGIN:VTODO",
    `UID:${opts.uid}`,
    "DTSTAMP:20260101T000000Z",
    ...due,
    `SUMMARY:${opts.summary}`,
    ...(opts.rrule ? [`RRULE:${opts.rrule}`] : []),
    ...(opts.organizer ? [`ORGANIZER:mailto:${opts.organizer}`] : []),
    ...(opts.attendees ?? []).map((a) => `ATTENDEE;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a}`),
    "END:VTODO",
    "END:VCALENDAR",
    "",
  ];
  await seedCalendarObject(opts.uid, lines.join("\r\n"));
}

/** A property of the stored object as one unfolded line, e.g.
 * `DUE;VALUE=DATE:20260623`, or null when it has none. */
async function storedProp(uid: string, name: string): Promise<string | null> {
  const ics = await readCalendarObject(uid);
  if (ics === null) throw new Error(`the calendar holds no object ${uid}`);
  const lines = ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  return lines.find((line) => line.startsWith(`${name}:`) || line.startsWith(`${name};`)) ?? null;
}

/**
 * The UTC date-time a wall-clock time in the browser's zone is stored as.
 * alps writes a timed due date in UTC, so the expectation is computed where
 * the editor read the time, not assumed from the test machine's zone.
 */
async function utcStamp(page: Page, local: string): Promise<string> {
  const iso = await page.evaluate((value) => new Date(value).toISOString(), local);
  return iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
}

/** The iCalendar an iMIP message carries, decoded, and the method its part
 * declares. alps sends the calendar part base64-encoded. */
function calendarPart(raw: string): { method: string; ics: string } | null {
  const unfold = (text: string) => text.replace(/\r?\n[ \t]+/g, " ");
  const head = raw.slice(0, Math.max(0, raw.search(/\r?\n\r?\n/)));
  const boundary = /boundary="?([^";\s]+)"?/i.exec(unfold(head))?.[1];
  if (!boundary) return null;
  for (const part of raw.split(`--${boundary}`)) {
    const split = part.search(/\r?\n\r?\n/);
    if (split < 0) continue;
    const headers = unfold(part.slice(0, split));
    if (!/content-type:\s*text\/calendar/i.test(headers)) continue;
    const method = (/method="?([a-z-]+)/i.exec(headers)?.[1] ?? "").toUpperCase();
    let body = part.slice(split).trim();
    if (/content-transfer-encoding:\s*base64/i.test(headers)) {
      body = Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8");
    }
    return { method, ics: body.replace(/\r?\n[ \t]/g, "") };
  }
  return null;
}

const taskRow = (page: Page, title: string) => page.locator("tasks-list .row", { hasText: title });
const dueDate = (editor: Locator) => editor.locator("alps-input.due-date input");
const dueTime = (editor: Locator) => editor.locator("alps-input.due-time input");
const allDayBox = (editor: Locator) => editor.locator("input.all-day");

/** Opens a task's editor the way a user does: by clicking its row. */
async function openTask(page: Page, title: string): Promise<Locator> {
  await page.goto("/#/tasks/all");
  const row = taskRow(page, title);
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.locator(".title").click();
  const editor = page.locator("tasks-page task-modal");
  await expect(dueDate(editor)).toBeVisible();
  return editor;
}

/** Types into a date or time control as a person does: focus, replace,
 * commit with a real blur. Assigning `.value` fires no events and would prove
 * nothing. */
async function enter(control: Locator, value: string): Promise<void> {
  await control.click();
  await control.fill(value);
  await control.blur();
}

/**
 * Types a date into a date control segment by segment, as the keyboard does.
 *
 * The segments come in the order of the platform's regional format — on macOS
 * the system's, whatever language the page declares — so the order is found
 * first, by typing a probe whose day and month cannot be mistaken for each
 * other and reading back what the control made of it.
 */
async function typeDate(page: Page, control: Locator, iso: string): Promise<void> {
  const [y, m, d] = iso.split("-");
  const probes: Array<[string, Record<string, string>]> = [
    ["02012003", { "2003-02-01": "mdy", "2003-01-02": "dmy" }],
    ["20030201", { "2003-02-01": "ymd", "2003-01-02": "ydm" }],
  ];
  // Emptied, then focused afresh: a date control takes focus at its first
  // segment, but one that still has it stays on the segment typed last.
  const restart = async () => {
    await control.fill("");
    await control.blur();
    await control.focus();
  };
  let order: string | undefined;
  for (const [keys, orders] of probes) {
    await restart();
    await page.keyboard.type(keys);
    order = orders[await control.inputValue()];
    if (order) break;
  }
  if (!order) throw new Error("could not tell the date control's segment order");
  await restart();
  const parts: Record<string, string> = { y, m, d };
  await page.keyboard.type([...order].map((part) => parts[part]).join(""));
}

/**
 * Clicks Save, answers the question the editor asks first if `confirm` names
 * the answer, and waits for the write. Returns the server's status for it.
 *
 * A save that sends nothing fails here, as a wait for a write that never
 * comes, rather than passing as a closed window.
 */
async function save(page: Page, editor: Locator, confirm?: string): Promise<number> {
  const write = page.waitForResponse(
    (res) => res.request().method() === "POST" && /\/calendar\/tasks(\/[^/]+\/edit)?$/.test(new URL(res.url()).pathname),
  );
  await editor.getByRole("button", { name: "Save", exact: true }).click();
  if (confirm) {
    await editor.locator("ui-confirm").getByRole("button", { name: confirm, exact: true }).click();
  }
  const response = await write;
  // Closed once the save is through: the form is gone with the window.
  await expect(editor.locator("alps-input.due-date")).toHaveCount(0);
  return response.status();
}

test("editing a task's due date persists it", async ({ page }) => {
  const uid = `e2e-edit-due-${run}`;
  const title = `E2E Edit Due ${run}`;
  await seedTask({ uid, summary: title, due: "20260615T170000Z" });

  // Every task write and its status, so a silent no-request save is
  // distinguishable from a rejected one.
  const writes: string[] = [];
  page.on("response", (res) => {
    if (res.request().method() !== "GET" && new URL(res.url()).pathname.startsWith("/calendar/tasks")) {
      writes.push(`${res.request().method()} ${res.status()}`);
    }
  });

  await login(page);
  const editor = await openTask(page, title);
  // A timed task: its date and its time are separate controls.
  await expect(dueTime(editor)).toBeVisible();
  await enter(dueDate(editor), "2026-06-22");
  await enter(dueTime(editor), "09:30");
  await save(page, editor);

  // Link 1: a request was made at all. Link 2: the server accepted it.
  expect(writes, "the save should have issued one accepted write").toEqual(["POST 200"]);
  // Link 3: what the calendar server now holds.
  expect(await storedProp(uid, "DUE")).toBe(`DUE:${await utcStamp(page, "2026-06-22T09:30")}`);

  // And it survives a reload — the user's own test.
  await page.reload();
  const reopened = await openTask(page, title);
  await expect(dueDate(reopened)).toHaveValue("2026-06-22");
  await expect(dueTime(reopened)).toHaveValue("09:30");
});

/*
 * The variants a real task can be, each driven the same way.
 *
 * These are the shapes that take a different path through the editor and the
 * server: an all-day task (a DATE, not a date-time, with no time control), a
 * recurring one (the rule must survive a schedule edit), an ASSIGNED one (an
 * ordinary save is an iTIP rescheduling), and an undated one being given a
 * date for the first time.
 */

test("an all-day task keeps its edit", async ({ page }) => {
  const uid = `e2e-allday-${run}`;
  const title = `E2E AllDay Task ${run}`;
  await seedTask({ uid, summary: title, due: "20260615", allDay: true });
  await login(page);
  const editor = await openTask(page, title);

  await expect(allDayBox(editor)).toBeChecked();
  await expect(dueTime(editor)).toHaveCount(0);
  await enter(dueDate(editor), "2026-06-23");
  expect(await save(page, editor)).toBe(200);

  expect(await storedProp(uid, "DUE")).toBe("DUE;VALUE=DATE:20260623");
});

test("a recurring task keeps its edit and its rule", async ({ page }) => {
  const uid = `e2e-recur-${run}`;
  const title = `E2E Recurring Task ${run}`;
  await seedTask({ uid, summary: title, due: "20260615T170000Z", rrule: "FREQ=WEEKLY" });
  await login(page);
  const editor = await openTask(page, title);

  await enter(dueDate(editor), "2026-06-24");
  await enter(dueTime(editor), "11:00");
  expect(await save(page, editor)).toBe(200);

  expect(await storedProp(uid, "DUE")).toBe(`DUE:${await utcStamp(page, "2026-06-24T11:00")}`);
  expect(await storedProp(uid, "RRULE")).toBe("RRULE:FREQ=WEEKLY");
});

test("an assigned task keeps its edit, and the assignee is told", async ({ page }) => {
  // A task the user assigned is scheduled like a meeting: moving its due date
  // is a rescheduling, which raises SEQUENCE and — with no scheduling server —
  // is mailed to the assignee by alps, once the editor has asked.
  const uid = `e2e-assigned-${run}`;
  const title = `E2E Assigned Task ${run}`;
  const assignee = "bob@remote.test";
  await seedTask({ uid, summary: title, due: "20260615T170000Z", organizer: USER.address, attendees: [assignee] });
  await login(page);
  const editor = await openTask(page, title);

  await enter(dueDate(editor), "2026-06-25");
  await enter(dueTime(editor), "14:00");
  expect(await save(page, editor, "Send")).toBe(200);

  const due = `DUE:${await utcStamp(page, "2026-06-25T14:00")}`;
  expect(await storedProp(uid, "DUE")).toBe(due);
  expect(await storedProp(uid, "SEQUENCE")).toBe("SEQUENCE:1");

  const sent = await waitForSent((m) => {
    const part = calendarPart(m.data);
    return !!part && m.recipients.includes(assignee) && part.ics.includes(`UID:${uid}`);
  });
  const part = calendarPart(sent.data)!;
  expect(part.method).toBe("REQUEST");
  expect(part.ics).toContain(due);
  expect(part.ics).toContain("SEQUENCE:1");
});

test("an undated task can be given a due date", async ({ page }) => {
  const uid = `e2e-undated-${run}`;
  const title = `E2E Undated Task ${run}`;
  await seedTask({ uid, summary: title });
  await login(page);
  const editor = await openTask(page, title);

  // Nothing to call all-day or timed until there is a date.
  await expect(dueDate(editor)).toHaveValue("");
  await expect(allDayBox(editor)).toHaveCount(0);
  await enter(dueDate(editor), "2026-06-26");
  // A first date is all-day until the user says otherwise.
  await expect(allDayBox(editor)).toBeChecked();
  await allDayBox(editor).uncheck();
  await enter(dueTime(editor), "08:15");
  expect(await save(page, editor)).toBe(200);

  expect(await storedProp(uid, "DUE")).toBe(`DUE:${await utcStamp(page, "2026-06-26T08:15")}`);
});

/*
 * Un-ticking "All day" and giving the task a time.
 *
 * The one edit that is not a value change but a MODE change: the stored DUE
 * has to turn from a DATE into a date-time. A save that kept the DATE and
 * dropped the time would still answer 200, so only the stored value shows it.
 */
test("un-ticking All day gives the task a real time", async ({ page }) => {
  const uid = `e2e-untick-${run}`;
  const title = `E2E Untick AllDay ${run}`;
  await seedTask({ uid, summary: title, due: "20260615", allDay: true });
  await login(page);
  const editor = await openTask(page, title);

  await expect(allDayBox(editor)).toBeChecked();
  await allDayBox(editor).uncheck();
  // The time control appears once the box is clear.
  await expect(dueTime(editor)).toBeVisible();
  await enter(dueTime(editor), "14:30");
  expect(await save(page, editor)).toBe(200);

  // The whole point: a bare DATE would mean the time was thrown away.
  expect(await storedProp(uid, "DUE"), "the due date should carry the time the user typed").toBe(
    `DUE:${await utcStamp(page, "2026-06-15T14:30")}`,
  );
});

test("ticking All day ON drops the time", async ({ page }) => {
  // The mirror of the case above.
  const uid = `e2e-tick-${run}`;
  const title = `E2E Tick AllDay ${run}`;
  await seedTask({ uid, summary: title, due: "20260615T170000Z" });
  await login(page);
  const editor = await openTask(page, title);

  await expect(allDayBox(editor)).not.toBeChecked();
  await allDayBox(editor).check();
  await expect(dueTime(editor)).toHaveCount(0);
  expect(await save(page, editor)).toBe(200);

  // The day the editor showed, which is the due instant's date where the
  // browser is.
  const day = await page.evaluate(() => {
    const due = new Date("2026-06-15T17:00:00Z");
    return `${due.getFullYear()}${String(due.getMonth() + 1).padStart(2, "0")}${String(due.getDate()).padStart(2, "0")}`;
  });
  expect(await storedProp(uid, "DUE"), "an all-day task carries a bare DATE").toBe(`DUE;VALUE=DATE:${day}`);
});

/** Ticks a task off from its row, and waits for the server's answer. */
async function completeFromRow(page: Page, title: string): Promise<void> {
  await page.goto("/#/tasks/all");
  // Scoped to ITS row: the first checkbox on the page may belong to another task.
  const row = taskRow(page, title);
  await expect(row).toBeVisible({ timeout: 15_000 });
  const done = page.waitForResponse(
    (res) => res.request().method() === "POST" && /\/calendar\/tasks\/[^/]+\/complete$/.test(new URL(res.url()).pathname),
  );
  await row.getByRole("checkbox", { name: "Mark as done" }).click();
  expect((await done).status()).toBe(200);
}

test("completing an all-day RECURRING task keeps it all-day", async ({ page }) => {
  // Ticking a repeating task off moves it to its next occurrence. Moved as a
  // date-time, every completion of an all-day repeating task would silently
  // turn it into a timed one.
  const uid = `e2e-allday-recur-${run}`;
  const title = `E2E AllDay Recurring ${run}`;
  await seedTask({ uid, summary: title, due: "20260615", allDay: true, rrule: "FREQ=WEEKLY" });
  await login(page);
  await completeFromRow(page, title);

  expect(await storedProp(uid, "DUE"), "the roll-forward must not convert an all-day task to a timed one").toMatch(
    /^DUE;VALUE=DATE:\d{8}$/,
  );
});

test("completing an all-day RECURRING task advances to the next occurrence", async ({ page }) => {
  // A completion that rewrote DUE to the date it already had would leave a
  // task that can never be finished: the tick simply undoes itself.
  const uid = `e2e-allday-advance-${run}`;
  const title = `E2E AllDay Advance ${run}`;
  await seedTask({ uid, summary: title, due: "20260615", allDay: true, rrule: "FREQ=WEEKLY" });
  await login(page);
  await completeFromRow(page, title);

  await expect(toast(page, "The task repeats, and is now due")).toBeVisible();
  expect(await storedProp(uid, "DUE"), "a weekly all-day task should move to the following week").toBe(
    "DUE;VALUE=DATE:20260622",
  );
  expect(await storedProp(uid, "STATUS")).toBe("STATUS:NEEDS-ACTION");
});

/*
 * The whole flow driven through the UI.
 *
 * The seeded-undated case above passes, so what differs here is how the task
 * was CREATED: through the app's own editor rather than seeded as raw
 * iCalendar, so whatever that path stores is what the edit then has to merge
 * over.
 */
test("a task CREATED in the UI can then be given a due date", async ({ page }) => {
  const title = `E2E UI Created ${run}`;
  await login(page);
  await page.goto("/#/tasks/all");

  // Add Task is disabled until the task lists are loaded, and the Lists
  // section is drawn by the same load: waiting for it is waiting for exactly
  // the precondition the button gates on. Affirmative on purpose — waiting for
  // a loader to go away would pass vacuously before the loader appeared.
  await expect(page.locator("tasks-page .calendar-lists")).toBeVisible({ timeout: 15_000 });

  await page.locator("tasks-page alps-create-button").click();
  // Scoped to the editor: the page behind it has a search box.
  const editor = page.locator("tasks-page task-modal");
  const titleField = editor.locator("alps-input.title-input input");
  await expect(titleField).toBeVisible();
  await titleField.fill(title);
  const created = page.waitForResponse(
    (res) => res.request().method() === "POST" && new URL(res.url()).pathname === "/calendar/tasks",
  );
  await editor.getByRole("button", { name: "Save", exact: true }).click();
  const createdResponse = await created;
  expect(createdResponse.status()).toBe(200);
  const { uid } = (await createdResponse.json()) as { uid: string };
  await expect(taskRow(page, title)).toBeVisible();

  // What the server stored for a task made here: the input to the edit.
  expect(await storedProp(uid, "SUMMARY")).toBe(`SUMMARY:${title}`);
  expect(await storedProp(uid, "DUE")).toBeNull();

  // Now the flow itself: open it, date it, save.
  const reopened = await openTask(page, title);
  await enter(dueDate(reopened), "2026-06-29");
  await allDayBox(reopened).uncheck();
  await enter(dueTime(reopened), "10:00");
  expect(await save(page, reopened)).toBe(200);

  expect(await storedProp(uid, "DUE"), "the due date the user set should be stored").toBe(
    `DUE:${await utcStamp(page, "2026-06-29T10:00")}`,
  );
});

/*
 * A task written by THUNDERBIRD.
 *
 * A Mozilla VTODO carries CREATED, LAST-MODIFIED, X-MOZ-GENERATION and
 * friends. alps edits the object it read rather than writing a fresh one, so
 * everything it has no field for must come back out beside the due date the
 * editor set.
 */
test("an undated THUNDERBIRD task can be given a due date", async ({ page }) => {
  const uid = `e2e-tb-task-${run}`;
  const title = `E2E Thunderbird Task ${run}`;
  await seedCalendarObject(
    uid,
    [
      "BEGIN:VCALENDAR",
      "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN",
      "VERSION:2.0",
      "BEGIN:VTODO",
      "CREATED:20260810T120000Z",
      "LAST-MODIFIED:20260810T120000Z",
      "DTSTAMP:20260810T120000Z",
      `UID:${uid}`,
      `SUMMARY:${title}`,
      "STATUS:NEEDS-ACTION",
      "PERCENT-COMPLETE:0",
      "X-MOZ-GENERATION:1",
      "END:VTODO",
      "END:VCALENDAR",
      "",
    ].join("\r\n"),
  );
  await login(page);
  const editor = await openTask(page, title);

  await enter(dueDate(editor), "2026-06-30");
  await allDayBox(editor).uncheck();
  await enter(dueTime(editor), "16:45");
  expect(await save(page, editor)).toBe(200);

  expect(await storedProp(uid, "DUE"), "the due date the user set should be stored").toBe(
    `DUE:${await utcStamp(page, "2026-06-30T16:45")}`,
  );
  expect(await storedProp(uid, "X-MOZ-GENERATION")).toBe("X-MOZ-GENERATION:1");
  expect(await storedProp(uid, "CREATED")).toBe("CREATED:20260810T120000Z");
});

/*
 * Typing a date and no time — what a person does when the field looks like a
 * date field.
 *
 * alps's due field IS a date field, with the time a control of its own, so a
 * date typed alone is a complete answer: an all-day due date. What must never
 * happen is the silent kind of save, where the window closes and the date the
 * user typed is not what was stored.
 */
test("setting a date but no time is saved as an all-day due date, never discarded", async ({ page }) => {
  const uid = `e2e-dateonly-${run}`;
  const title = `E2E Date Only ${run}`;
  await seedCalendarObject(
    uid,
    [
      "BEGIN:VCALENDAR",
      "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN",
      "VERSION:2.0",
      "BEGIN:VTODO",
      "DTSTAMP:20260810T120000Z",
      `UID:${uid}`,
      `SUMMARY:${title}`,
      "STATUS:NEEDS-ACTION",
      "END:VTODO",
      "END:VCALENDAR",
      "",
    ].join("\r\n"),
  );
  await login(page);
  const editor = await openTask(page, title);

  // Only the date segments, exactly as the keyboard drives the control.
  const date = dueDate(editor);
  await typeDate(page, date, "2026-06-30");
  await expect(date).toHaveValue("2026-06-30");
  // No time is asked for: a first date is all-day.
  await expect(dueTime(editor)).toHaveCount(0);

  expect(await save(page, editor)).toBe(200);
  expect(await storedProp(uid, "DUE"), "the date the user typed should be stored").toBe("DUE;VALUE=DATE:20260630");
});
