import type { Locator } from '@playwright/test';
import { expect, login, resetDav, resetSettings, seedCalendarObject, test } from './fixtures';

test.afterEach(async ({ page }) => {
  await page.goto('about:blank');
  await resetDav();
  await resetSettings();
});

async function outline(target: Locator) {
  return target.evaluate(el => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), color: s.outlineColor };
  });
}

test.describe('touch calendar controls', () => {
  test.use({ hasTouch: true, viewport: { width: 1024, height: 900 } });
  test('offers the calendar menu without a hover or a keyboard', async ({ page }) => {
    await login(page);
    await page.goto('/#/calendar');
    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
    const menu = page.locator('calendar-page .calendar-item .kebab-btn').first();
    await expect(menu).toBeVisible({ timeout: 2000 });
    await menu.tap();
    await expect(page.locator('calendar-page .dropdown-item').filter({ hasText: 'Rename' }).first()).toBeVisible();
  });
});

test('entering the task list shows its first keyboard row immediately', async ({ page }) => {
  await seedCalendarObject('focus-task', 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//alps//e2e//EN\r\nBEGIN:VTODO\r\nUID:focus-task\r\nDTSTAMP:20260101T000000Z\r\nSUMMARY:Visible keyboard task\r\nEND:VTODO\r\nEND:VCALENDAR\r\n');
  await login(page);
  await page.goto('/#/tasks');
  const scroll = page.locator('tasks-list .scroll');
  await expect(scroll).toBeVisible();
  await page.keyboard.press('Tab');
  await scroll.focus();
  const row = scroll.locator('.row.focused');
  await expect(row).toContainText('Visible keyboard task', { timeout: 2000 });
  expect(await outline(row)).toMatchObject({ style: 'solid', width: 2 });
  await scroll.press('Enter');
  await expect(page.locator('task-modal')).toBeVisible();
});

test('today stays marked in all calendar grids under forced colors', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-15T12:00:00'));
  await login(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/#/calendar/month/2026-09');
  for (const target of [page.locator('alps-sidebar-calendar .mini-day.today'), page.locator('calendar-month-view .date-number.today')]) {
    await expect(target).toBeVisible();
    expect(await outline(target)).toMatchObject({ style: 'solid', width: 2 });
  }
  await page.goto('/#/calendar/week/2026-09-15');
  const today = page.locator('calendar-time-grid .time-grid-day-number.today');
  await expect(today).toBeVisible();
  expect(await outline(today)).toMatchObject({ style: 'solid', width: 2 });
});

for (const forcedColors of ['none', 'active'] as const) {
  test(`composer fields show their focus under ${forcedColors} forced colors`, async ({ page }) => {
    await login(page);
    await page.emulateMedia({ forcedColors });
    await page.locator('alps-folder-list alps-create-button').click();
    const composer = page.locator('alps-floating-composer');
    await composer.locator('alps-address-input input').first().focus();
    expect(await outline(composer.locator('.field-row').first())).toMatchObject({ style: 'solid', width: 2 });
    await composer.getByPlaceholder('Subject').focus();
    expect(await outline(composer.locator('.field-row').last())).toMatchObject({ style: 'solid', width: 2 });
    await composer.locator('.ProseMirror').focus();
    expect(await outline(composer.locator('alps-message-composer .editor-container'))).toMatchObject({ style: 'solid', width: 2 });
  });
}

for (const language of ['de', 'hi', 'ko', 'ar']) {
  test(`translated recipient labels share space without overlap in ${language}`, async ({ page }) => {
    await login(page);
    expect((await page.request.put('/settings', { data: { language } })).ok()).toBe(true);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await page.locator('alps-folder-list alps-create-button').click();
    const composer = page.locator('alps-floating-composer');
    await page.setViewportSize({ width: 390, height: 844 });
    while (await composer.locator('.cc-bcc-toggles span').count()) {
      await composer.locator('.cc-bcc-toggles span').first().click();
    }
    const labels = composer.locator('.field-label');
    await expect(labels).toHaveCount(3);
    const widths = await labels.evaluateAll(els => els.map(el => el.getBoundingClientRect().width));
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
    for (const label of await labels.all()) {
      expect(await label.evaluate(el => {
        const bounds = el.getBoundingClientRect();
        const input = el.nextElementSibling!.getBoundingClientRect();
        const rtl = getComputedStyle(el).direction === 'rtl';
        return el.scrollWidth <= bounds.width + 1 && (rtl ? input.right <= bounds.left : input.left >= bounds.right);
      })).toBe(true);
    }
  });
}

test('the sidebar month caption remains one line at a narrow docked width', async ({ page }) => {
  await login(page);
  await page.goto('/#/calendar/month/2026-09');
  const sidebar = page.locator('calendar-page alps-sidebar');
  const handle = await sidebar.locator('.sidebar-resizer').boundingBox();
  expect(handle).not.toBeNull();
  const x = handle!.x + handle!.width / 2;
  await page.mouse.move(x, handle!.y + 100);
  await page.mouse.down();
  await page.mouse.move(x - 60, handle!.y + 100, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => Math.round((await sidebar.locator('.sidebar').boundingBox())!.width)).toBe(190);
  const caption = sidebar.locator('alps-sidebar-calendar .mini-header span');
  await expect(caption).toContainText('September');
  expect(await caption.evaluate(el => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size;
  })).toBe(1);
  for (const button of await sidebar.locator('alps-sidebar-calendar .mini-header alps-icon-btn').all()) await expect(button).toBeVisible();
});
