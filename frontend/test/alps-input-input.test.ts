/**
 * alps-input says `input` once per key, with the value typed so far.
 *
 * The inner input's own `input` is composed: it leaves the shadow root and
 * reaches whoever listens on alps-input, retargeted to it. alps-input sent a
 * second one of its own after it, so every listener heard every key twice.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, shadow } from './helpers/dom';
import '../src/components/alps-input';

type El = HTMLElement & { value: string; updateComplete: Promise<unknown> };

function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

afterEach(() => {
  cleanup();
});

describe('alps-input input', () => {
  it('is said once per key, with the value typed so far', async () => {
    const el = await mount<El>('alps-input');
    const seen: string[] = [];
    el.addEventListener('input', (e) => seen.push((e.target as El).value));
    const input = shadow<HTMLInputElement>(el, 'input');

    type(input, 'a');
    type(input, 'ab');

    expect(seen).toEqual(['a', 'ab']);
  });

  it('is said when the field is cleared', async () => {
    const el = await mount<El>('alps-input', { clearable: true, value: 'old' });
    const seen: string[] = [];
    el.addEventListener('input', (e) => seen.push((e.target as El).value));

    shadow<HTMLButtonElement>(el, 'button').click();

    expect(seen).toEqual(['']);
  });
});

describe('alps-input constraints and credentials', () => {
  it('passes named-field constraints to the native input without changing its styling', async () => {
    const el = await mount<El>('alps-input', { type: 'url', name: 'server', maxLength: 2048, required: true });
    const input = shadow<HTMLInputElement>(el, 'input');
    expect(input.type).toBe('url');
    expect(input.name).toBe('server');
    expect(input.maxLength).toBe(2048);
    expect(input.required).toBe(true);
    expect(input.checkValidity()).toBe(false);
  });

  it.each([
    ['url', 'url'], ['email', 'email'], ['password', 'current-password'], ['text', 'section-caldav username'],
  ])('preserves %s identifiers without correction or capitalization', async (type, autocomplete) => {
    const el = await mount<El>('alps-input', { type, autocomplete });
    const input = shadow<HTMLInputElement>(el, 'input');
    expect(input.autocomplete).toBe(autocomplete);
    expect(input.getAttribute('autocorrect')).toBe('off');
    expect(input.getAttribute('autocapitalize')).toBe('none');
    expect(input.getAttribute('spellcheck')).toBe('false');
  });

  it('leaves ordinary text correction and capitalization at the browser defaults', async () => {
    const el = await mount<El>('alps-input', { type: 'text', autocomplete: 'name' });
    const input = shadow<HTMLInputElement>(el, 'input');
    expect(input.hasAttribute('autocorrect')).toBe(false);
    expect(input.hasAttribute('autocapitalize')).toBe(false);
    expect(input.hasAttribute('spellcheck')).toBe(false);
  });

  it('locks both the field and its password action when disabled', async () => {
    const el = await mount<El>('alps-input', { type: 'password', value: 'secret', disabled: true });
    const input = shadow<HTMLInputElement>(el, 'input');
    const toggle = shadow<HTMLButtonElement>(el, 'button');
    expect(input.disabled).toBe(true);
    expect(toggle.disabled).toBe(true);
    toggle.click();
    await el.updateComplete;
    expect(input.type).toBe('password');
  });

  it('hides a newly entered password after the previous password was cleared', async () => {
    const el = await mount<El>('alps-input', { type: 'password', value: 'first' });
    shadow<HTMLButtonElement>(el, 'button').click();
    await el.updateComplete;
    expect(shadow<HTMLInputElement>(el, 'input').type).toBe('text');
    el.value = '';
    await el.updateComplete;
    el.value = 'next';
    await el.updateComplete;
    expect(shadow<HTMLInputElement>(el, 'input').type).toBe('password');
  });
});
