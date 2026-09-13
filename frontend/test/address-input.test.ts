/**
 * The recipient field: turning typed text into addresses, refusing the ones
 * mail cannot go to, and suggestions that must not land out of order.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadow, shadowAll, update } from './helpers/dom';
import { registry } from '../src/plugin-registry';
import '../src/components/alps-address-input';

type AddressInput = HTMLElement & { addresses: string[]; disabled: boolean; updateComplete: Promise<unknown> };

const inputOf = (el: AddressInput) => shadow<HTMLInputElement>(el, 'input');
const pills = (el: AddressInput) => shadowAll(el, '.pill').map((p) => ({ shown: p.querySelector('.pill-addr')?.textContent?.trim(), title: p.getAttribute('title') }));

async function typeText(el: AddressInput, value: string) {
  const input = inputOf(el);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await el.updateComplete;
}

async function press(el: AddressInput, key: string): Promise<KeyboardEvent> {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true });
  inputOf(el).dispatchEvent(event);
  await el.updateComplete;
  return event;
}

beforeEach(() => {
  registry.hooks = new Map();
  registry.enabledPlugins = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe('committing an address', () => {
  it('turns a typed address into a pill on Enter, clears the text and announces it', async () => {
    const el = await mount<AddressInput>('alps-address-input');
    const changes = record<CustomEvent>(el, 'addresses-changed');
    await typeText(el, 'ada@example.com');
    const enter = await press(el, 'Enter');
    expect(enter.defaultPrevented).toBe(true);
    expect(el.addresses).toEqual(['ada@example.com']);
    expect(inputOf(el).value).toBe('');
    expect(changes.map((e) => e.detail.addresses)).toEqual([['ada@example.com']]);
  });

  it('commits on a space or a comma that completes an address', async () => {
    const el = await mount<AddressInput>('alps-address-input');
    await typeText(el, 'ada@example.com');
    expect((await press(el, ' ')).defaultPrevented).toBe(true);
    await typeText(el, 'bob@example.com');
    expect((await press(el, ',')).defaultPrevented).toBe(true);
    expect(el.addresses).toEqual(['ada@example.com', 'bob@example.com']);
  });

  it('lets a space or comma through while the text is not yet an address', async () => {
    // Display names are typed with spaces, and a quoted one with a comma.
    const el = await mount<AddressInput>('alps-address-input');
    await typeText(el, 'Ada Lovelace');
    expect((await press(el, ' ')).defaultPrevented).toBe(false);
    await typeText(el, '"Lovelace');
    expect((await press(el, ',')).defaultPrevented).toBe(false);
    expect(el.addresses).toEqual([]);
  });

  it('accepts a display-name form and shows the name', async () => {
    const el = await mount<AddressInput>('alps-address-input');
    await typeText(el, '"Lovelace, Ada" <ada@example.com>');
    await press(el, 'Enter');
    expect(pills(el)).toEqual([{ shown: 'Lovelace, Ada', title: '"Lovelace, Ada" <ada@example.com>' }]);
  });

  it('does not list an address twice', async () => {
    const el = await mount<AddressInput>('alps-address-input', { addresses: ['ada@example.com'] });
    const changes = record(el, 'addresses-changed');
    await typeText(el, 'ada@example.com');
    await press(el, 'Enter');
    expect(el.addresses).toEqual(['ada@example.com']);
    expect(changes).toHaveLength(0);
  });
});

describe('refusing an address', () => {
  it('keeps malformed text in the field rather than committing it', async () => {
    const el = await mount<AddressInput>('alps-address-input');
    for (const text of ['ada', 'ada@localhost', 'ada@@example.com', 'ada @example.com']) {
      await typeText(el, text);
      await press(el, 'Enter');
      expect(el.addresses, text).toEqual([]);
      expect(inputOf(el).value, text).toBe(text);
    }
  });

  it('refuses no-reply and mailer-daemon addresses, through a display name and in any case', async () => {
    const el = await mount<AddressInput>('alps-address-input');
    for (const text of ['noreply@example.com', 'No-Reply@Example.com', 'Service <no-reply@example.com>', 'MAILER-DAEMON@example.com']) {
      await typeText(el, text);
      await press(el, 'Enter');
      expect(el.addresses, text).toEqual([]);
    }
  });
});

describe('editing and removing', () => {
  it('reopens the last pill for editing on Backspace in an empty field', async () => {
    const el = await mount<AddressInput>('alps-address-input', { addresses: ['ada@example.com', 'bob@example.com'] });
    const changes = record<CustomEvent>(el, 'addresses-changed');
    await press(el, 'Backspace');
    expect(el.addresses).toEqual(['ada@example.com']);
    expect(inputOf(el).value).toBe('bob@example.com ');
    expect(changes).toHaveLength(1);
  });

  it('leaves the pills alone while there is text to delete', async () => {
    const el = await mount<AddressInput>('alps-address-input', { addresses: ['ada@example.com'] });
    await typeText(el, 'bo');
    await press(el, 'Backspace');
    expect(el.addresses).toEqual(['ada@example.com']);
  });

  it('removes a pill from its button', async () => {
    const el = await mount<AddressInput>('alps-address-input', { addresses: ['ada@example.com', 'bob@example.com'] });
    const changes = record<CustomEvent>(el, 'addresses-changed');
    shadowAll<HTMLButtonElement>(el, '.pill-remove')[0].click();
    await el.updateComplete;
    expect(el.addresses).toEqual(['bob@example.com']);
    expect(changes[0].detail.addresses).toEqual(['bob@example.com']);
  });

  it('commits a valid address left in the field on blur, and keeps an invalid one', async () => {
    vi.useFakeTimers();
    const el = await mount<AddressInput>('alps-address-input');
    await typeText(el, 'ada@example.com');
    inputOf(el).dispatchEvent(new FocusEvent('blur'));
    await vi.advanceTimersByTimeAsync(150);
    expect(el.addresses).toEqual(['ada@example.com']);

    await typeText(el, 'not an address');
    inputOf(el).dispatchEvent(new FocusEvent('blur'));
    await vi.advanceTimersByTimeAsync(150);
    expect(el.addresses).toEqual(['ada@example.com']);
    expect(inputOf(el).value).toBe('not an address');
  });

  it('disables the field and the remove buttons', async () => {
    const el = await mount<AddressInput>('alps-address-input', { addresses: ['ada@example.com'] });
    await update(el, { disabled: true });
    expect(inputOf(el).disabled).toBe(true);
    expect(shadow<HTMLButtonElement>(el, '.pill-remove').disabled).toBe(true);
  });
});

describe('suggestions', () => {
  const items = (el: AddressInput) => shadowAll(el, '.dropdown-item');

  it('asks the plugins once typing pauses, not on a single character', async () => {
    vi.useFakeTimers();
    const lookup = vi.fn(async ({ query }: { query: string }) => [{ name: 'Alice', address: `${query}@example.com` }]);
    registry.registerHook('composer:suggest', lookup);
    const el = await mount<AddressInput>('alps-address-input');

    await typeText(el, 'a');
    await vi.advanceTimersByTimeAsync(300);
    expect(lookup).not.toHaveBeenCalled();

    for (const text of ['al', 'ali', 'alic']) {
      await typeText(el, text);
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(300);
    await el.updateComplete;
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith({ query: 'alic' });
    expect(items(el)).toHaveLength(1);
  });

  it('drops an answer that a newer query has superseded', async () => {
    vi.useFakeTimers();
    let releaseSlow!: (v: unknown) => void;
    registry.registerHook('composer:suggest', ({ query }: { query: string }) =>
      query === 'al'
        ? new Promise((resolve) => { releaseSlow = resolve; })
        : Promise.resolve([{ name: 'Alice', address: 'alice@example.com' }]),
    );
    const el = await mount<AddressInput>('alps-address-input');
    await typeText(el, 'al');
    await vi.advanceTimersByTimeAsync(300);
    await typeText(el, 'alice');
    await vi.advanceTimersByTimeAsync(300);
    await el.updateComplete;
    releaseSlow([{ name: 'Albert', address: 'albert@example.com' }]);
    await vi.advanceTimersByTimeAsync(0);
    await el.updateComplete;
    expect(items(el).map((i) => i.textContent)).toEqual([expect.stringContaining('alice@example.com')]);
  });

  it('highlights with the arrows and commits the highlighted name on Enter', async () => {
    vi.useFakeTimers();
    registry.registerHook('composer:suggest', async () => [
      { name: 'Alice', address: 'alice@example.com' },
      { name: '', address: 'alan@example.com' },
    ]);
    const el = await mount<AddressInput>('alps-address-input');
    await typeText(el, 'al');
    await vi.advanceTimersByTimeAsync(300);
    await el.updateComplete;

    await press(el, 'ArrowDown');
    expect(items(el)[0].classList.contains('active')).toBe(true);
    await press(el, 'Enter');
    expect(el.addresses).toEqual(['"Alice" <alice@example.com>']);
    expect(items(el)).toHaveLength(0);

    await typeText(el, 'al');
    await vi.advanceTimersByTimeAsync(300);
    await el.updateComplete;
    await press(el, 'ArrowDown');
    await press(el, 'ArrowDown');
    await press(el, 'Enter');
    expect(el.addresses).toEqual(['"Alice" <alice@example.com>', 'alan@example.com']);
  });

  it('closes the list on Escape and keeps the text', async () => {
    vi.useFakeTimers();
    registry.registerHook('composer:suggest', async () => [{ name: 'Alice', address: 'alice@example.com' }]);
    const el = await mount<AddressInput>('alps-address-input');
    await typeText(el, 'ali');
    await vi.advanceTimersByTimeAsync(300);
    await el.updateComplete;
    expect(items(el)).toHaveLength(1);
    expect((await press(el, 'Escape')).defaultPrevented).toBe(true);
    expect(items(el)).toHaveLength(0);
    expect(inputOf(el).value).toBe('ali');
  });

  it('survives a suggestion source that throws', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    registry.registerHook('composer:suggest', async () => {
      throw new Error('directory down');
    });
    registry.registerHook('composer:suggest', async () => [{ name: 'Alice', address: 'alice@example.com' }]);
    const el = await mount<AddressInput>('alps-address-input');
    await typeText(el, 'ali');
    await vi.advanceTimersByTimeAsync(300);
    await el.updateComplete;
    expect(items(el)).toHaveLength(1);
  });
});
