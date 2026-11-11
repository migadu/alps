/**
 * alps-input says `change` when its value is committed, as a native input does.
 *
 * It said `change` with every `input` instead, so whatever saves on `change`
 * saved every keystroke. The settings' display name and Reply-To do: typing an
 * address one key at a time sent "r", which the server refused as no address,
 * and the refusal put the field back to the saved value before the next key.
 *
 * The inner input's own `change` is not composed, so it stops at the shadow
 * root; alps-input passes it on.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, shadow } from './helpers/dom';
import '../src/components/alps-input';

type El = HTMLElement & { value: string; clearable: boolean; updateComplete: Promise<unknown> };

function counting(el: HTMLElement, type: string): { count: number } {
  const seen = { count: 0 };
  el.addEventListener(type, () => { seen.count++; });
  return seen;
}

function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

afterEach(() => {
  cleanup();
});

describe('alps-input change', () => {
  it('is not said while the value is being typed', async () => {
    const el = await mount<El>('alps-input');
    const changes = counting(el, 'change');
    const inputs = counting(el, 'input');
    const input = shadow<HTMLInputElement>(el, 'input');

    type(input, 'r');
    type(input, 're');

    expect(el.value).toBe('re');
    expect(inputs.count).toBeGreaterThan(0);
    expect(changes.count).toBe(0);
  });

  it('is said once when the value is committed', async () => {
    const el = await mount<El>('alps-input');
    const changes = counting(el, 'change');
    const input = shadow<HTMLInputElement>(el, 'input');

    type(input, 'reply@example.com');
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(changes.count).toBe(1);
    expect(el.value).toBe('reply@example.com');
  });

  it('is said when the field is cleared', async () => {
    const el = await mount<El>('alps-input', { clearable: true, value: 'old@example.com' });
    const changes = counting(el, 'change');

    shadow<HTMLButtonElement>(el, 'button').click();

    expect(changes.count).toBe(1);
    expect(el.value).toBe('');
  });
});
