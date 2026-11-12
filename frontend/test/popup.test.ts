/**
 * alps-popup: the menus and pickers across the app.
 *
 * A click menu is an auto popover: the page stays live under it, a click
 * outside closes it and still reaches what it lands on, and the popover's own
 * state must agree with the element's, or a menu that believes it is closed
 * stays drawn. And keystrokes from fields inside it bubble to its key
 * handling, which must leave typing alone.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, record, shadow } from './helpers/dom';
import { topModal } from '../src/utils/modal-layers';
import '../src/components/alps-popup';
import '../src/components/alps-icon-btn';

type Popup = HTMLElement & {
  openState: boolean;
  triggerOn: 'click' | 'hover';
  open(): void;
  close(): void;
  updateComplete: Promise<unknown>;
};

const MENU = '<button id="one">One</button><button id="two">Two</button><button id="three" disabled>Off</button><button id="four">Four</button>';

async function popup(props: Partial<Popup> = {}, items = MENU, trigger = '<button slot="trigger" id="trigger">Menu</button>'): Promise<Popup> {
  const el = document.createElement('alps-popup') as Popup;
  el.innerHTML = `${trigger}${items}`;
  Object.assign(el, props);
  document.body.append(el);
  await el.updateComplete;
  return el;
}

const contentOf = (el: Popup) => shadow<HTMLElement>(el, '.popup-content');
const byId = (id: string) => document.getElementById(id) as HTMLElement;

async function clickTrigger(el: Popup) {
  shadow(el, '.trigger').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  await el.updateComplete;
}

/** A click outside the menu, as the browser handles it: the popover hides
 * itself and says so in `toggle`. */
async function lightDismiss(el: Popup) {
  contentOf(el).hidePopover();
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
    expect(contentOf(el).getAttribute('popover')).toBe('auto');
  });

  it('opens from the trigger as a popover, not a modal, reflects it, and announces it', async () => {
    const showPopover = vi.spyOn(HTMLElement.prototype, 'showPopover');
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    const el = await popup();
    const opens = record(el, 'popup-open');
    await clickTrigger(el);
    expect(el.openState).toBe(true);
    expect(el.hasAttribute('open')).toBe(true);
    expect(showPopover).toHaveBeenCalledTimes(1);
    // Opened from the trigger, so a press on the trigger is not a press outside.
    expect(showPopover.mock.calls[0][0]).toEqual({ source: shadow(el, '.trigger') });
    expect(showModal).not.toHaveBeenCalled();
    expect(el.shadowRoot!.querySelector('dialog')).toBeNull();
    expect(opens).toHaveLength(1);
  });

  it('closes on a second press, announcing it once', async () => {
    const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover');
    const el = await popup();
    const closes = record(el, 'popup-close');
    await clickTrigger(el);
    await clickTrigger(el);
    expect(el.openState).toBe(false);
    expect(hidePopover).toHaveBeenCalledTimes(1);
    expect(closes).toHaveLength(1);
  });

  it('follows its popover closing on its own, as a click outside does', async () => {
    const el = await popup();
    const closes = record(el, 'popup-close');
    await clickTrigger(el);
    await lightDismiss(el);
    expect(el.openState).toBe(false);
    expect(el.hasAttribute('open')).toBe(false);
    expect(closes).toHaveLength(1);
  });

  it('is not opened again by the click whose press on the trigger closed it', async () => {
    // Where the browser does not know the popover's source, the press on the
    // trigger is outside the popover and dismisses it before the click lands.
    const el = await popup();
    await clickTrigger(el);
    shadow(el, '.trigger').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await lightDismiss(el);
    await clickTrigger(el);
    expect(el.openState).toBe(false);
    // The next click opens it, as ever.
    await clickTrigger(el);
    expect(el.openState).toBe(true);
  });

  it('ignores an abandoned pointer press when the trigger is later activated from the keyboard', async () => {
    const el = await popup();
    await clickTrigger(el);
    shadow(el, '.trigger').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    // That press was dragged away, so it never clicked the trigger. Escape
    // closes the menu; the keyboard's later click must use its current state.
    key(document.body, 'Escape');
    await el.updateComplete;
    byId('trigger').click();
    await el.updateComplete;
    expect(el.openState).toBe(true);
  });

  it('keeps restored keyboard focus, and releases a pointer-focused trigger', async () => {
    const el = await popup();
    const trigger = byId('trigger');
    const hide = HTMLElement.prototype.hidePopover;
    vi.spyOn(contentOf(el), 'hidePopover').mockImplementation(function (this: HTMLElement) { hide.call(this); trigger.focus(); });
    let keyboard = true;
    const matches = trigger.matches.bind(trigger);
    vi.spyOn(trigger, 'matches').mockImplementation(selector => selector === ':focus-visible' ? keyboard : matches(selector));
    await clickTrigger(el);
    el.close();
    await el.updateComplete;
    expect(document.activeElement).toBe(trigger);
    keyboard = false;
    await clickTrigger(el);
    el.close();
    await el.updateComplete;
    expect(document.activeElement).not.toBe(trigger);
  });

  it('gives the focus back to what had it when it opened, when closed from an item', async () => {
    // A popover gives the focus back only from inside itself, and the items
    // are slotted: closing from one left the focus nowhere.
    const el = await popup();
    byId('one').addEventListener('click', () => el.close());
    const trigger = byId('trigger');
    // This case starts from keyboard focus. jsdom otherwise inherits the
    // :focus-visible heuristic from a preceding pointer-interaction test.
    const matches = trigger.matches.bind(trigger);
    vi.spyOn(trigger, 'matches').mockImplementation(selector => selector === ':focus-visible' ? true : matches(selector));
    trigger.focus();
    await clickTrigger(el);
    byId('one').focus();
    byId('one').click();
    await el.updateComplete;
    expect(document.activeElement?.id).toBe('trigger');
  });

  it('leaves the focus where a click outside put it', async () => {
    const el = await popup();
    const outside = document.createElement('button');
    outside.id = 'outside';
    document.body.append(outside);
    byId('trigger').focus();
    await clickTrigger(el);
    outside.focus();
    await lightDismiss(el);
    expect(document.activeElement?.id).toBe('outside');
  });

  it('can be opened again after being removed while open', async () => {
    // Teardown is not a change of openState, so an instance that came back
    // still believed it was open and could never show its popover again.
    const el = await popup();
    const showPopover = vi.spyOn(HTMLElement.prototype, 'showPopover');
    await clickTrigger(el);
    el.remove();
    expect(el.openState).toBe(false);
    expect(topModal()).toBeUndefined();
    document.body.append(el);
    await el.updateComplete;
    await clickTrigger(el);
    expect(el.openState).toBe(true);
    expect(showPopover).toHaveBeenCalledTimes(2);
  });

  it('stays open for a click on an item', async () => {
    const el = await popup();
    await clickTrigger(el);
    byId('one').click();
    await el.updateComplete;
    expect(el.openState).toBe(true);
  });

  it('is the top layer while open, so a toast raised over it is drawn inside it', async () => {
    const el = await popup();
    await clickTrigger(el);
    expect(topModal()).toBe(contentOf(el));
    await lightDismiss(el);
    expect(topModal()).toBeUndefined();
  });
});

describe('the trigger', () => {
  it('says whether its menu is open, on a plain button', async () => {
    const el = await popup();
    expect(byId('trigger').getAttribute('aria-expanded')).toBe('false');
    await clickTrigger(el);
    expect(byId('trigger').getAttribute('aria-expanded')).toBe('true');
    await lightDismiss(el);
    expect(byId('trigger').getAttribute('aria-expanded')).toBe('false');
  });

  it('says it on the button inside an alps-icon-btn, not on the element around it', async () => {
    const el = await popup({}, MENU, '<alps-icon-btn slot="trigger" id="icon" icon="x" title="More"></alps-icon-btn>');
    const icon = byId('icon') as HTMLElement & { updateComplete: Promise<unknown> };
    await icon.updateComplete;
    expect(icon.hasAttribute('aria-expanded')).toBe(false);
    await clickTrigger(el);
    await icon.updateComplete;
    expect(shadow(icon, 'button').getAttribute('aria-expanded')).toBe('true');
    expect(icon.hasAttribute('aria-expanded')).toBe(false);
  });
});

describe('without the Popover API', () => {
  it('draws the menu in place and closes it on a press outside', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'popover')!;
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).popover;
    try {
      const showPopover = vi.spyOn(HTMLElement.prototype, 'showPopover');
      const el = await popup();
      const outside = document.createElement('button');
      document.body.append(outside);
      await clickTrigger(el);
      expect(showPopover).not.toHaveBeenCalled();
      expect(contentOf(el).classList.contains('is-open')).toBe(true);
      byId('one').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
      expect(el.openState).toBe(true);
      outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(el.openState).toBe(false);
      expect(contentOf(el).classList.contains('is-open')).toBe(false);
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'popover', descriptor);
    }
  });
});

describe('hover menus', () => {
  it('returns focus from a closed submenu to its trigger in the open parent', async () => {
    const el = await popup({}, '<alps-popup triggerOn="hover" id="sub"><button slot="trigger" id="sub-trigger">Order</button><button id="sub-item">Top</button></alps-popup>');
    const sub = byId('sub') as Popup;
    await clickTrigger(el);
    sub.dispatchEvent(new MouseEvent('mouseenter'));
    await sub.updateComplete;
    // jsdom has no keyboard/pointer focus-visible heuristic.
    const trigger = byId('sub-trigger');
    const matches = trigger.matches.bind(trigger);
    vi.spyOn(trigger, 'matches').mockImplementation(selector => selector === ':focus-visible' ? true : matches(selector));
    byId('sub-item').focus();
    key(byId('sub-item'), 'Escape');
    await sub.updateComplete;
    expect(sub.openState).toBe(false);
    expect(el.openState).toBe(true);
    expect(document.activeElement).toBe(byId('sub-trigger'));
  });

  it('open on pointer entry as a manual popover, outside the layers a toast goes into', async () => {
    const showPopover = vi.spyOn(HTMLElement.prototype, 'showPopover');
    const el = await popup({ triggerOn: 'hover' });
    expect(contentOf(el).getAttribute('popover')).toBe('manual');
    el.dispatchEvent(new MouseEvent('mouseenter'));
    await el.updateComplete;
    expect(el.openState).toBe(true);
    expect(showPopover).toHaveBeenCalledTimes(1);
    expect(topModal()).toBeUndefined();
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

  it('close with the menu they are in, which a manual popover would not do by itself', async () => {
    const el = await popup({}, `<alps-popup triggerOn="hover" id="sub"><button slot="trigger">Order</button><button id="top">Top</button></alps-popup>`);
    const sub = byId('sub') as Popup;
    await clickTrigger(el);
    sub.dispatchEvent(new MouseEvent('mouseenter'));
    await sub.updateComplete;
    expect(sub.openState).toBe(true);
    await lightDismiss(el);
    await sub.updateComplete;
    expect(sub.openState).toBe(false);
  });
});

describe('the keyboard', () => {
  const focused = () => document.activeElement?.id;

  it('moves through the enabled items with the arrows, wrapping at both ends', async () => {
    const el = await popup();
    await clickTrigger(el);
    byId('trigger').focus();
    const down = key(byId('trigger'), 'ArrowDown');
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
    key(byId('trigger'), 'ArrowUp');
    expect(focused()).toBe('four');
  });

  it('takes the arrows where the focus is outside every menu, before the page sees them', async () => {
    // A click on a trigger that takes no focus leaves it on the body, and the
    // page under a popover is live: the mailbox moves its list on a stray arrow.
    const el = await popup();
    await clickTrigger(el);
    (document.activeElement as HTMLElement | null)?.blur();
    const page = vi.fn((e: KeyboardEvent) => { if (!e.defaultPrevented) e.preventDefault(); });
    document.addEventListener('keydown', page);
    try {
      const down = key(document.body, 'ArrowDown');
      expect(down.defaultPrevented).toBe(true);
      expect(focused()).toBe('one');
    } finally {
      document.removeEventListener('keydown', page);
    }
  });

  it('closes on Escape and marks it handled, so the page does not close too', async () => {
    const el = await popup();
    const closes = record(el, 'popup-close');
    await clickTrigger(el);
    byId('two').focus();
    const escape = key(byId('two'), 'Escape');
    await el.updateComplete;
    expect(escape.defaultPrevented).toBe(true);
    expect(el.openState).toBe(false);
    expect(closes).toHaveLength(1);
    // Closed, it leaves the key alone.
    expect(key(document.body, 'Escape').defaultPrevented).toBe(false);
  });

  it('answers from the innermost open menu only', async () => {
    const el = await popup({}, `<button id="outer-item">Outer</button><alps-popup id="inner"><button slot="trigger" id="inner-trigger">More</button><button id="inner-one">A</button><button id="inner-two">B</button></alps-popup>`);
    const inner = byId('inner') as Popup;
    await clickTrigger(el);
    shadow(inner, '.trigger').click();
    await inner.updateComplete;
    byId('inner-one').focus();
    key(byId('inner-one'), 'ArrowDown');
    expect(focused()).toBe('inner-two');
    key(byId('inner-two'), 'Escape');
    await inner.updateComplete;
    expect(inner.openState).toBe(false);
    expect(el.openState).toBe(true);
  });

  it('leaves a dialog opened from the menu its own keys', async () => {
    const el = await popup({}, `<button id="item">Item</button><dialog id="opened" open><button id="inside">Inside</button></dialog>`);
    await clickTrigger(el);
    byId('inside').focus();
    const escape = key(byId('inside'), 'Escape');
    expect(escape.defaultPrevented).toBe(false);
    expect(el.openState).toBe(true);
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

  it('leaves Enter on the trigger to the trigger', async () => {
    const el = await popup();
    await clickTrigger(el);
    byId('trigger').focus();
    expect(key(byId('trigger'), 'Enter').defaultPrevented).toBe(false);
  });

  it('ignores keys while closed', async () => {
    await popup();
    byId('trigger').focus();
    const down = key(byId('trigger'), 'ArrowDown');
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
