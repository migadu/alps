import { expect, login, resetSettings, test } from './fixtures';

test.beforeEach(async () => { await resetSettings(); });
test.afterEach(async ({ page }) => {
  await page.goto('about:blank');
  await resetSettings();
  await page.request.delete('/session');
});

for (const words of [
  { locale: 'zh-CN', code: 'zh-Hans', signIn: '登录', settings: '设置', contact: '添加联系人', calendars: '我的日历', task: '添加任务' },
  { locale: 'zh-TW', code: 'zh-Hant', signIn: '登入', settings: '設定', contact: '新增聯絡人', calendars: '我的行事曆', task: '新增工作' },
]) {
  test.describe(words.locale, () => {
    test.use({ locale: words.locale });
    test('uses the requested Chinese script in the shell and dynamically loaded plugins', async ({ page }) => {
      await page.goto('/#/login');
      await expect(page.locator('html')).toHaveAttribute('lang', words.code);
      await expect(page.locator('login-page button[type=submit]')).toHaveText(words.signIn);
      await login(page);
      await page.goto('/#/settings/localization');
      await expect(page.locator('settings-window .header-title')).toHaveText(words.settings);
      await expect(page.locator('settings-window alps-setting-group').first().locator('select')).toHaveValue('auto');
      await page.goto('/#/contacts');
      await expect(page.locator('contacts-page alps-create-button')).toHaveText(words.contact);
      await page.goto('/#/calendar');
      await expect(page.getByText(words.calendars, { exact: true })).toBeVisible();
      await page.goto('/#/tasks');
      await expect(page.locator('tasks-page alps-create-button')).toHaveText(words.task);
      await expect(page.locator('html')).toHaveAttribute('lang', words.code);
    });
  });
}
