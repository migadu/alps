// Calendar and contacts, through the real stack.
//
// These exist for the seams the unit tests cannot reach: that the caldav and
// carddav plugins load and mount at all, that the Go routes read data seeded
// as raw iCalendar/vCard — the way a DAV client writes it — and that what they
// answer renders. The unit suites stub the fetches on both sides of that.
//
// Note what the shared fixture adds: any console error fails the test. A plugin
// that loads but throws on mount would pass a "does the tab exist" assertion and
// fail here, which is the point.

import {
  deliver,
  expect,
  login,
  resetDav,
  seedContact,
  seedEvent,
  test,
  USER,
  waitForSent,
} from "./fixtures";

const run = Date.now();

test.afterEach(async () => {
  await resetDav();
});

/**
 * The iCalendar an iMIP message carries, decoded, and the method its part
 * declares. alps sends the calendar part base64-encoded, so the raw message
 * says nothing readable about it until this unwraps it.
 */
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
    // RFC 5545 unfolding: a line break followed by one blank continues the line.
    return { method, ics: body.replace(/\r?\n[ \t]/g, "") };
  }
  return null;
}

test("a seeded event appears in the calendar", async ({ page }) => {
  const summary = `E2E Standup ${run}`;
  await seedEvent({ uid: `e2e-standup-${run}`, summary, dtstart: "20260615T090000Z", dtend: "20260615T093000Z" });
  await login(page);

  // `#/calendar/{mode}/{date}`; month mode wants YYYY-MM. The page opens on
  // today, and the seed lives in June 2026.
  await page.goto("/#/calendar/month/2026-06");
  await expect(page.locator("calendar-month-view .event-chip", { hasText: summary })).toBeVisible({ timeout: 15_000 });
});

test("a recurring series renders each of its occurrences", async ({ page }) => {
  // The DAV server answers a time-range query with the series' master alone,
  // one object; the calendar page expands the rule itself. If that expansion
  // were lost, the series would render once, on its first date.
  const summary = `E2E Weekly ${run}`;
  await seedEvent({
    uid: `e2e-weekly-${run}`,
    summary,
    dtstart: "20260601T090000Z",
    dtend: "20260601T093000Z",
    rrule: "FREQ=WEEKLY;COUNT=4",
  });
  await login(page);
  await page.goto("/#/calendar/month/2026-06");

  // COUNT=4 from Monday June 1: the 1st, 8th, 15th and 22nd, one chip in each
  // of those cells. The chips are counted rather than the text, because each
  // chip also carries a (closed) preview naming the event.
  const chips = page.locator("calendar-month-view .event-chip", { hasText: summary });
  await expect(chips.first()).toBeVisible({ timeout: 15_000 });
  await expect(chips).toHaveCount(4);
});

test("a seeded contact is listed", async ({ page }) => {
  const name = `Ada E2E ${run}`;
  await seedContact({ uid: `e2e-ada-${run}`, name, email: `ada.${run}@example.test` });
  await login(page);

  await page.goto("/#/contacts");
  await expect(page.locator("alps-contacts-list .contact-item", { hasText: name })).toBeVisible({ timeout: 15_000 });
});

test("contacts feed the composer's recipient autocomplete", async ({ page }) => {
  // The composer's To field asks the `composer:suggest` hook, which only the
  // carddav plugin answers. This is that wiring, end to end.
  const email = `grace.${run}@example.test`;
  await seedContact({ uid: `e2e-grace-${run}`, name: `Grace E2E ${run}`, email });
  await login(page);
  // Confirm the seed landed before asking the composer about it — suggestions
  // are a server-side `query=` lookup, so a missing card would look like a
  // broken dropdown rather than a missing fixture.
  await page.goto("/#/contacts");
  await expect(page.locator("alps-contacts-list .contact-item", { hasText: email })).toBeVisible({ timeout: 15_000 });

  await page.goto("/#/mailbox/INBOX");
  // The button inside carries no accessible name of its own, so it is found
  // by the component that draws it.
  await page.locator("alps-folder-list alps-create-button").click();
  const to = page.locator("alps-floating-composer alps-address-input").first();
  await to.locator("input").fill("grace");
  await expect(to.locator(".suggestions-dropdown")).toContainText(email, { timeout: 10_000 });
});

test("an emailed invitation offers Accept, and answering it files the event and replies", async ({ page }) => {
  // In the future, or alps reads it as over and offers no answers at all.
  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 15, 14));
  const ymd = day.toISOString().slice(0, 10).replace(/-/g, "");
  const month = day.toISOString().slice(0, 7);
  const uid = `e2e-invite-${run}`;
  const summary = `E2E Invitation ${run}`;
  const organizer = "boss@far.example";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//e2e//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    "DTSTAMP:20260101T000000Z",
    `DTSTART:${ymd}T140000Z`,
    `DTEND:${ymd}T150000Z`,
    `SUMMARY:${summary}`,
    `ORGANIZER:mailto:${organizer}`,
    `ATTENDEE;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${USER.address}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  const boundary = `e2eboundary${run}`;
  const raw = [
    `From: ${organizer}`,
    `To: ${USER.address}`,
    `Subject: ${summary}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${uid}@far.example>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    "Please join us.",
    `--${boundary}`,
    "Content-Type: text/calendar; method=REQUEST; charset=utf-8",
    'Content-Disposition: attachment; filename="invite.ics"',
    "",
    ics,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  await deliver({ subject: summary, raw });

  await login(page);
  await page.locator("alps-message-list").getByText(summary).first().click();

  // The banner is the mail↔calendar seam. It never writes the calendar
  // itself: it names the message, and the server reads the invitation from
  // the mailbox, files it and mails the answer — so a page cannot forge
  // either.
  const banner = page.locator("calendar-invitation-banner");
  const accept = banner.getByRole("button", { name: "Accept" });
  await expect(accept).toBeVisible({ timeout: 15_000 });
  await accept.click();
  await expect(banner.getByRole("status")).toHaveText(
    "Saved to your calendar, and your answer was sent to the organizer.",
    { timeout: 15_000 },
  );

  // The answer that left: an iTIP REPLY to the organizer, accepting this UID.
  const reply = await waitForSent((m) => {
    const part = calendarPart(m.data);
    return !!part && m.recipients.includes(organizer) && part.ics.includes(`UID:${uid}`);
  });
  const part = calendarPart(reply.data)!;
  expect(part.method).toBe("REPLY");
  expect(part.ics).toContain("METHOD:REPLY");
  expect(part.ics).toMatch(new RegExp(`ATTENDEE[^\\r\\n]*PARTSTAT=ACCEPTED[^\\r\\n]*:mailto:${USER.address}`, "i"));

  // And the event it filed, read back from the calendar server.
  await page.goto(`/#/calendar/month/${month}`);
  await expect(page.locator("calendar-month-view .event-chip", { hasText: summary })).toBeVisible({ timeout: 15_000 });
});
