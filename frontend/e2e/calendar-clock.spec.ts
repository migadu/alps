import { expect, login, resetDav, seedCalendarObject, seedEvent, test } from './fixtures';

test.use({ timezoneId: 'UTC' });
test.afterEach(async ({ page }) => {
  await page.request.put('/settings', { data: { hour_format: 'auto' } });
  await resetDav();
});

test('calendar and tasks follow the chosen clock and changes made over an open calendar', async ({ page }) => {
  const day = new Date().toISOString().slice(0, 10);
  const stamp = day.replaceAll('-', '');
  await seedEvent({ uid: 'clock-event', summary: 'Clock event', dtstart: `${stamp}T143000Z`, dtend: `${stamp}T153000Z` });
  await seedCalendarObject('clock-task', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//alps//clock test//EN', 'BEGIN:VTODO', 'UID:clock-task', 'DTSTAMP:20260101T000000Z', `DUE:${stamp}T143000Z`, 'SUMMARY:Clock task', 'END:VTODO', 'END:VCALENDAR', ''].join('\r\n'));
  await login(page);
  for (const format of ['24', '12', 'auto']) {
    await page.goto('/#/settings/localization');
    const saved = page.waitForResponse(r => new URL(r.url()).pathname === '/settings' && r.request().method() === 'PUT');
    await page.locator('alps-setting-group[label="Time Format"] select').selectOption(format);
    expect((await saved).status()).toBe(200);
    const time = format === '24' ? '14:30' : '02:30 PM';
    const hour = format === '24' ? '14:00' : '02:00 PM';
    await page.goto(`/#/calendar/day/${day}`);
    await expect(page.locator('calendar-time-grid .time-label').nth(14)).toHaveText(hour);
    const chip = page.locator('calendar-time-grid .time-event').filter({ hasText: 'Clock event' });
    await chip.click();
    await expect(page.locator('calendar-event-preview').filter({ visible: true })).toContainText(time);
    await page.keyboard.press('Escape');
    await page.goto(`/#/calendar/day/${day}?q=Clock%20event`);
    await expect(page.locator('calendar-list-view .event-item').filter({ hasText: 'Clock event' }).locator('.date-time')).toHaveText(time);
    await page.goto('/#/tasks/all');
    await expect(page.locator('tasks-list .row').filter({ hasText: 'Clock task' }).locator('.due')).toHaveText(time);
  }
});
