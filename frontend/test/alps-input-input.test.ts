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
