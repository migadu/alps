import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount } from './helpers/dom';
import '../src/pages/login-page';

afterEach(cleanup);

describe('localized sign-in retry durations', () => {
  it.each([
    ['de', 1, '1 Sekunde'], ['de', 30, '30 Sekunden'], ['de', 61, '2 Minuten'],
    ['pt-PT', 0, '0 segundos'], ['pt-PT', 1, '1 segundo'], ['zh-Hans', 30, '30秒钟'],
  ])('%s formats %s seconds as %s', async (locale, seconds, expected) => {
    const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key, getIntlLanguage: () => locale });
    const page = await mount<HTMLElement & { formatRetryTime: (seconds: number) => string }>('login-page', { i18nStore });
    expect(page.formatRetryTime(Number(seconds))).toBe(expected);
  });
});
