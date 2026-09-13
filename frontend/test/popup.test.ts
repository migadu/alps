/**
 * alps-popup: the menus and pickers across the app.
 *
 * A click menu opens modally, which makes everything else inert, so a popup
 * that believes it is closed while its dialog is open freezes the page. And
 * keystrokes from fields inside it bubble to its key handling, which must leave
 * typing alone.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, record, shadow } from './helpers/dom';
import '../src/components/alps-popup';

type Popup = HTMLElement & {
  openState: boolean;
  triggerOn: 'click' | 'hover';
  open(): void;
  close(): void;
  updateComplete: Promise<unknown>;
};

const MENU = '<button id="one">One</button><button id="two">Two</button><button id="three" disabled>Off</button><button id="four">Four</button>';

async function popup(props: Partial<Popup> = {}, items = MENU): Promise<Popup> {
  const el = document.createElement('alps-popup') as Popup;
  el.innerHTML = `<button slot="trigger" id="trigger">Menu</button>${items}`;
  Object.assign(el, props);
  document.body.append(el);
  await el.updateComplete;
  return el;
}

const dialogOf = (el: Popup) => shadow<HTMLDialogElement>(el, 'dialog');
const byId = (id: string) => document.getElementById(id) as HTMLElement;

async function clickTrigger(el: Popup) {
  shadow(el, '.trigger').click();
  await el.updateComplete;
}

function key(target: EventTarget, k: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe('opening and closing', () => {
  it('starts closed', async () => {
    const el = await popup();
    expect(el.openState).toBe(false);
    expect(el.hasAttribute('open')).toBe(false);
    expect(dialogOf(el).open).toBe(false);
  });

  it('opens from the trigger modally, reflects it, and announces it', async () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    const el = await popup();
    const opens = record(el, 'popup-open');
    await clickTrigger(el);
    expect(el.openState).toBe(true);
    expect(el.hasAttribute('open')).toBe(true);
    expect(dialogOf(el).open).toBe(true);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(opens).toHaveLength(1);
  });

  it('closes on a second press, announcing it once', async () => {
    const el = await popup();
    const closes = record(el, 'popup-close');
    await clickTrigger(el);
    await clickTrigger(el);
    expect(el.openState).toBe(false);
    expect(dialogOf(el).open).toBe(false);
    expect(closes).toHaveLength(1);
  });

  it('follows its dialog closing on its own, as Escape does', async () => {
    const el = await popup();
    const closes = record(el, 'popup-close');
    await clickTrigger(el);
    dialogOf(el).close();
    await el.updateComplete;
    expect(el.openState).toBe(false);
    expect(closes).toHaveLength(1);
  });

  it('can be opened again after being removed while open', async () => {
    // Teardown is not a change of openState, so an instance that came back
    // still believed it was open and could never show its dialog again.
    const el = await popup();
    await clickTrigger(el);
    el.remove();
    expect(el.openState).toBe(false);
    document.body.append(el);
    await el.updateComplete;
    await clickTrigger(el);
    expect(dialogOf(el).open).toBe(true);
  });
});

describe('the backdrop', () => {
  it('closes on a click or right-click that lands on the dialog itself', async () => {
    for (const type of ['click', 'contextmenu']) {
      const el = await popup();
      await clickTrigger(el);
      const event = new MouseEvent(type, { bubbles: true, cancelable: true });
      dialogOf(el).dispatchEvent(event);
      await el.updateComplete;
      expect(el.openState, type).toBe(false);
      expect(event.defaultPrevented, type).toBe(true);
      el.remove();
    }
  });

  it('stays open for a click on an item', async () => {
    const el = await popup();
    await clickTrigger(el);
    byId('one').click();
    await el.updateComplete;
    expect(el.openState).toBe(true);
  });

  it('does nothing while closed', async () => {
    const el = await popup();
    const closes = record(el, 'popup-close');
    dialogOf(el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(closes).toHaveLength(0);
  });
});

describe('hover menus', () => {
  it('open on pointer entry, without making the page inert', async () => {
    const show = vi.spyOn(HTMLDialogElement.prototype, 'show');
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    const el = await popup({ triggerOn: 'hover' });
    el.dispatchEvent(new MouseEvent('mouseenter'));
    await el.updateComplete;
    expect(el.openState).toBe(true);
    expect(show).toHaveBeenCalledTimes(1);
    expect(showModal).not.toHaveBeenCalled();
  });

  it('close a moment after the pointer leaves, unless it comes back', async () => {
    vi.useFakeTimers();
    const el = await popup({ triggerOn: 'hover' });
    el.dispatchEvent(new MouseEvent('mouseenter'));
    el.dispatchEvent(new MouseEvent('mouseleave'));
    await vi.advanceTimersByTimeAsync(299);
    expect(el.openState).toBe(true);
    el.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(el.openState).toBe(true);
    el.dispatchEvent(new MouseEvent('mouseleave'));
    await vi.advanceTimersByTimeAsync(300);
    expect(el.openState).toBe(false);
  });

  it('ignore a click on the trigger', async () => {
    const el = await popup({ triggerOn: 'hover' });
    await clickTrigger(el);
    expect(el.openState).toBe(false);
  });

  it('drop a pending close when removed', async () => {
    vi.useFakeTimers();
    const el = await popup({ triggerOn: 'hover' });
    el.dispatchEvent(new MouseEvent('mouseenter'));
    el.dispatchEvent(new MouseEvent('mouseleave'));
    const closes = record(el, 'popup-close');
    el.remove();
    await vi.advanceTimersByTimeAsync(1000);
    expect(closes).toHaveLength(0);
  });

  it('are not opened by the pointer on a click menu', async () => {
    const el = await popup();
    el.dispatchEvent(new MouseEvent('mouseenter'));
    await el.updateComplete;
    expect(el.openState).toBe(false);
  });
});

describe('the keyboard', () => {
  const focused = () => document.activeElement?.id;

  it('moves through the enabled items with the arrows, wrapping at both ends', async () => {
    const el = await popup();
    await clickTrigger(el);
    const down = key(dialogOf(el), 'ArrowDown');
    expect(down.defaultPrevented).toBe(true);
    expect(focused()).toBe('one');
    key(byId('one'), 'ArrowDown');
    expect(focused()).toBe('two');
    key(byId('two'), 'ArrowDown');
    expect(focused()).toBe('four');
    key(byId('four'), 'ArrowDown');
    expect(focused()).toBe('one');
    key(byId('one'), 'ArrowUp');
    expect(focused()).toBe('four');
  });

  it('starts from the last item on the way up', async () => {
    const el = await popup();
    await clickTrigger(el);
    key(dialogOf(el), 'ArrowUp');
    expect(focused()).toBe('four');
  });

  it('activates the focused item on Enter and on Space', async () => {
    const el = await popup();
    await clickTrigger(el);
    const clicks = record(byId('two'), 'click');
    byId('two').focus();
    expect(key(byId('two'), 'Enter').defaultPrevented).toBe(true);
    expect(key(byId('two'), ' ').defaultPrevented).toBe(true);
    expect(clicks).toHaveLength(2);
  });

  it('ignores keys while closed', async () => {
    const el = await popup();
    const down = key(dialogOf(el), 'ArrowDown');
    expect(down.defaultPrevented).toBe(false);
    expect(focused()).not.toBe('one');
  });

  describe('with a field inside', () => {
    const FORM = '<input id="field" type="text"><input id="check" type="checkbox"><textarea id="notes"></textarea><button id="after">After</button>';

    it('lets a space be typed into a text field', async () => {
      const el = await popup({}, FORM);
      await clickTrigger(el);
      const clicks = record(byId('field'), 'click');
      byId('field').focus();
      expect(key(byId('field'), ' ').defaultPrevented).toBe(false);
      expect(clicks).toHaveLength(0);
    });

    it('still toggles a checkbox on Space', async () => {
      const el = await popup({}, FORM);
      await clickTrigger(el);
      const box = byId('check') as HTMLInputElement;
      box.focus();
      expect(key(box, ' ').defaultPrevented).toBe(true);
      expect(box.checked).toBe(true);
    });

    it('leaves Enter and the arrows to a textarea', async () => {
      const el = await popup({}, FORM);
      await clickTrigger(el);
      byId('notes').focus();
      expect(key(byId('notes'), 'Enter').defaultPrevented).toBe(false);
      expect(key(byId('notes'), 'ArrowDown').defaultPrevented).toBe(false);
      expect(focused()).toBe('notes');
    });

    it('takes the arrows from a single-line field, so it can step into the list', async () => {
      const el = await popup({}, FORM);
      await clickTrigger(el);
      byId('field').focus();
      expect(key(byId('field'), 'ArrowDown').defaultPrevented).toBe(true);
      expect(focused()).toBe('check');
    });
  });
});
