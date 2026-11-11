/**
 * alps-toggle is a radio group.
 *
 * It drew a button per option and marked the chosen one with a class alone,
 * so a screen reader heard the calendar's Day, Week, Month and Year as four
 * buttons and never which view was selected.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/alps-toggle';
import { cleanup, mount, shadow, shadowAll, update } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

afterEach(cleanup);

const options = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const radios = (el: El) => shadowAll<HTMLInputElement>(el, 'input[type="radio"]');
const checked = (el: El) => radios(el).filter(radio => radio.checked).map(radio => radio.value);

describe('alps-toggle', () => {
  it('is a radio group named by its label', async () => {
    const el = await mount<El>('alps-toggle', { options, value: 'week', label: 'View' });
    const group = shadow(el, '[role="radiogroup"]');
    expect(group.getAttribute('aria-label')).toBe('View');
    expect(radios(el)).toHaveLength(3);
    // Each radio is named by the label around it.
    expect(radios(el).map(radio => radio.closest('label')?.textContent?.trim())).toEqual(['Day', 'Week', 'Month']);
  });

  it('checks the option that is its value, and only that one', async () => {
    const el = await mount<El>('alps-toggle', { options, value: 'week' });
    expect(checked(el)).toEqual(['week']);
    await update(el, { value: 'month' });
    expect(checked(el)).toEqual(['month']);
  });

  it('keeps its radios in a group of their own', async () => {
    const first = await mount<El>('alps-toggle', { options, value: 'day' });
    const second = await mount<El>('alps-toggle', { options, value: 'week' });
    const name = radios(first)[0].name;
    expect(name).not.toBe('');
    expect(radios(first).every(radio => radio.name === name)).toBe(true);
    expect(radios(second)[0].name).not.toBe(name);
  });

  it('reports the option chosen as a change with its value', async () => {
    const el = await mount<El>('alps-toggle', { options, value: 'week' });
    const seen: string[] = [];
    el.addEventListener('change', (e) => seen.push((e as CustomEvent).detail?.value));
    radios(el)[2].click();
    await el.updateComplete;
    expect(seen).toEqual(['month']);
    expect(el.value).toBe('month');
    expect(checked(el)).toEqual(['month']);
  });

  it('does not report the option already chosen', async () => {
    const el = await mount<El>('alps-toggle', { options, value: 'week' });
    const seen: string[] = [];
    el.addEventListener('change', (e) => seen.push((e as CustomEvent).detail?.value));
    radios(el)[1].click();
    await el.updateComplete;
    expect(seen).toEqual([]);
  });

  it('shows the value its owner sets back, after a click the owner refused', async () => {
    const el = await mount<El>('alps-toggle', { options, value: 'week' });
    radios(el)[0].click();
    await el.updateComplete;
    await update(el, { value: 'week' });
    expect(checked(el)).toEqual(['week']);
  });
});
