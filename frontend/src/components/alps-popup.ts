import { modalOpened, modalClosed, topModal } from '../utils/modal-layers';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consumesSpaceAsText, isComposingKey, isMultilineTextEntry } from '../utils/active-element';
import { motionStyles } from '../utils/motion';

export const popupStyles = css`
  .dropdown-header {
    padding: 12px 16px 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 16px;
    font-size: 14px;
    color: var(--text-primary, #111827);
    background: none;
    border: none;
    cursor: pointer;
    text-align: start;
    transition: background-color 0.2s;
    white-space: nowrap;
    position: relative;
  }

  .dropdown-item:focus,
  .dropdown-item:focus-visible {
    z-index: 10;
  }

  .dropdown-item:hover:not(:disabled) {
    background-color: var(--bg-tertiary, #f3f4f6);
  }

  .dropdown-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dropdown-item:first-of-type {
    border-start-start-radius: 4px;
    border-start-end-radius: 4px;
  }

  .dropdown-item:last-of-type {
    border-end-start-radius: 4px;
    border-end-end-radius: 4px;
  }

  .dropdown-item.active {
    color: var(--text-primary, #111827);
    background-color: var(--bg-tertiary, #f3f4f6);
    font-weight: 600;
  }

  .dropdown-item.active svg {
    color: var(--text-primary, #111827);
  }

  .dropdown-item svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
    color: var(--text-secondary, #4b5563);
    flex-shrink: 0;
  }

  .item-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-divider {
    height: 1px;
    background: var(--border-color, #e5e7eb);
    margin: 4px 0;
  }
`;

/** Whether the browser has the Popover API; without it a menu is drawn in place. */
const popoverSupported = () => Object.hasOwn(HTMLElement.prototype, 'popover');

/**
 * A menu, opened from its trigger, as a popover.
 *
 * A click menu is `popover="auto"`: it is drawn in the top layer, closes on
 * Escape and on a click outside it, and that click still reaches what it lands
 * on. The page stays live under it. It was a modal `<dialog>` over the whole
 * window, which made the page inert and took the outside click for itself, so
 * a click on another folder only closed the menu, and a screen reader
 * announced every menu as a dialog with no name.
 *
 * A hover menu, the submenus inside a menu, is `popover="manual"`: in the top
 * layer as well, closed by the pointer leaving, and by the menu it is in.
 */
@customElement('alps-popup')
export class AlpsPopup extends LitElement {
  /** `start`/`end` and `inline-start`/`inline-end` follow the page's
   * direction, so a menu opens on the mirrored side in a right-to-left
   * language. `left`/`right` stay physical, for callers that mean the
   * screen's sides. */
  @property({ type: String }) align: 'start' | 'end' | 'left' | 'right' | 'top' | 'bottom' = 'end';
  @property({ type: String }) position: 'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right' = 'bottom';
  @property({ type: String, reflect: true }) triggerOn: 'click' | 'hover' = 'click';
  @property({ type: Boolean, reflect: true, attribute: 'open' }) openState = false;

  static styles = [motionStyles, css`
    :host {
      display: inline-block;
      position: relative;
    }

    /* A popover's own box. The user-agent sheet centres a popover in the
       viewport and gives it a frame and a canvas; _updatePosition places it
       beside its trigger in viewport coordinates instead. Without the Popover
       API it is drawn in place, fixed above the page. */
    .popup-content {
      position: fixed;
      inset: auto;
      margin: 0;
      overflow: visible;
      /* What the dialog it was in gave it, and a popover gives it too. */
      color: CanvasText;
      z-index: 40010;
      min-width: 160px;
      max-width: 320px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      padding: 4px 0;
      display: none;
      flex-direction: column;
    }

    /* Shown by the popover's own state where there is one, so a light dismiss
       hides it at once rather than when this element next renders. */
    .popup-content:popover-open {
      display: flex;
    }

    @supports not selector(:popover-open) {
      .popup-content.is-open {
        display: flex;
      }
    }

    .popup-content::before,
    .popup-content::after {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
      pointer-events: none;
    }

    /* Position classes and arrow offsets have already been resolved to
       physical viewport sides by _updatePosition. Do not mirror them again. */
    .popup-content.position-bottom.align-right::before {
      top: -6px;
      right: var(--arrow-right, 10px);
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color, #e5e7eb) transparent;
    }

    .popup-content.position-bottom.align-right::after {
      top: -5px;
      right: calc(var(--arrow-right, 10px) + 1px);
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-primary, #ffffff) transparent;
    }

    .popup-content.position-bottom.align-left::before {
      top: -6px;
      left: var(--arrow-left, 10px);
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color, #e5e7eb) transparent;
    }

    .popup-content.position-bottom.align-left::after {
      top: -5px;
      left: calc(var(--arrow-left, 10px) + 1px);
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-primary, #ffffff) transparent;
    }

    .popup-content.position-top.align-right::before {
      bottom: -6px;
      right: var(--arrow-right, 10px);
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color, #e5e7eb) transparent transparent transparent;
    }

    .popup-content.position-top.align-right::after {
      bottom: -5px;
      right: calc(var(--arrow-right, 10px) + 1px);
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-primary, #ffffff) transparent transparent transparent;
    }

    .popup-content.position-top.align-left::before {
      bottom: -6px;
      left: var(--arrow-left, 10px);
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color, #e5e7eb) transparent transparent transparent;
    }

    .popup-content.position-top.align-left::after {
      bottom: -5px;
      left: calc(var(--arrow-left, 10px) + 1px);
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-primary, #ffffff) transparent transparent transparent;
    }

    /* Horizontal Left Position Arrow (points right, on the right border of popup) */
    .popup-content.position-left::before {
      right: -6px;
      top: var(--arrow-top, 10px);
      border-width: 6px 0 6px 6px;
      border-color: transparent transparent transparent var(--border-color, #e5e7eb);
    }
    .popup-content.position-left::after {
      right: -5px;
      top: calc(var(--arrow-top, 10px) + 1px);
      border-width: 5px 0 5px 5px;
      border-color: transparent transparent transparent var(--bg-primary, #ffffff);
    }

    /* Horizontal Right Position Arrow (points left, on the left border of popup) */
    .popup-content.position-right::before {
      left: -6px;
      top: var(--arrow-top, 10px);
      border-width: 6px 6px 6px 0;
      border-color: transparent var(--border-color, #e5e7eb) transparent transparent;
    }
    .popup-content.position-right::after {
      left: -5px;
      top: calc(var(--arrow-top, 10px) + 1px);
      border-width: 5px 5px 5px 0;
      border-color: transparent var(--bg-primary, #ffffff) transparent transparent;
    }

  `];

  public open() {
    this.openState = true;
    this.dispatchEvent(new CustomEvent('popup-open', { bubbles: true, composed: true }));
  }

  public close() {
    this.openState = false;
    this.dispatchEvent(new CustomEvent('popup-close', { bubbles: true, composed: true }));
  }

  public toggle(e: Event) {
    if (this.triggerOn === 'hover') {
      e.stopPropagation();
      return;
    }
    // A press on the trigger of an open menu is a click outside it where the
    // browser cannot tell the popover where it was opened from: the press
    // already closed it, and the click must not open it again.
    // Keyboard and assistive-technology clicks have no pointer press. A
    // pointer gesture abandoned before its click must not decide their state.
    const wasOpen = e instanceof MouseEvent && e.detail > 0
      ? this._openAtPointerDown ?? this.openState : this.openState;
    this._openAtPointerDown = null;
    if (wasOpen) {
      if (this.openState) this.close();
    } else {
      this.open();
    }
  }

  private _openAtPointerDown: boolean | null = null;

  private _handleTriggerPointerDown = () => {
    this._openAtPointerDown = this.openState;
  };

  private get _content(): HTMLElement | null {
    return this.shadowRoot?.querySelector<HTMLElement>('.popup-content') ?? null;
  }

  /** Whether the popover is showing as far as this element knows: set when it
   * shows it, cleared by the popover's own `toggle`. */
  private _shown = false;

  /** The popover closed on its own: a click outside it, a close request it
   * took itself (the Android back gesture), another menu opening. */
  private _handleToggle = (e: Event) => {
    if ((e as ToggleEvent).newState !== 'closed') return;
    this._shown = false;
    if (!this.openState) return;
    this._closedByPopover = true;
    this.close();
  };

  /**
   * Where the focus goes back to when the menu closes: what had it when a
   * click menu opened, or a hover submenu's trigger. A popover gives it back
   * only when it was inside the popover itself, and a menu's items are slotted,
   * so closing from one dropped the
   * focus on the page. Not after a click outside, which put the focus where
   * the user wanted it.
   */
  private _returnFocus: HTMLElement | null = null;
  private _closedByPopover = false;

  /** Whether `node` is this menu or in it, its trigger included, across shadow roots. */
  private _holds(node: Node | null): boolean {
    for (let at: Node | null = node; at; at = at.parentNode ?? (at instanceof ShadowRoot ? at.host : null)) {
      if (at === this) return true;
    }
    return false;
  }

  private _giveFocusBack() {
    const back = this._returnFocus;
    const byPopover = this._closedByPopover;
    this._returnFocus = null;
    this._closedByPopover = false;
    if (!back || byPopover || !back.isConnected) return;
    const active = this._getActiveElement();
    if (!active || active === document.body || this._holds(active)) back.focus();
  }

  private _showContent(content: HTMLElement) {
    // A manual submenu has no native focus restoration. If its focused item
    // closes it, return to its trigger in the still-open parent menu.
    this._returnFocus = this.triggerOn === 'hover'
      ? this._triggerElements().find((el): el is HTMLElement => el instanceof HTMLElement) ?? null
      : this._getActiveElement() as HTMLElement | null;
    if (popoverSupported()) {
      // `source` makes the trigger part of the menu for light dismiss, so a
      // press on it does not close the menu before the click toggles it.
      try {
        (content.showPopover as (options?: { source?: HTMLElement }) => void)({ source: this.shadowRoot?.querySelector<HTMLElement>('.trigger') ?? undefined });
      } catch {
        return;
      }
    } else {
      document.addEventListener('pointerdown', this._handleOutsidePointer, true);
    }
    this._shown = true;
    if (this.triggerOn === 'click') modalOpened(content);
  }

  private _hideContent(content: HTMLElement | null) {
    modalClosed(content);
    document.removeEventListener('pointerdown', this._handleOutsidePointer, true);
    if (!this._shown) return;
    this._shown = false;
    if (content && popoverSupported()) {
      try { content.hidePopover(); } catch { /* already hidden */ }
    }
  }

  /** Light dismiss where there is no Popover API. */
  private _handleOutsidePointer = (e: Event) => {
    if (!this.openState || e.composedPath().includes(this)) return;
    this.close();
  };

  /** The menus inside this one. A submenu is a manual popover, which closes
   * only when told to. */
  private _nestedPopups(): AlpsPopup[] {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    return (slot?.assignedElements({ flatten: true }) ?? []).flatMap(el => [
      ...(el instanceof AlpsPopup ? [el] : []),
      ...Array.from(el.querySelectorAll('alps-popup')) as AlpsPopup[],
    ]);
  }

  private _triggerElements(): Element[] {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
    return slot?.assignedElements({ flatten: true }) ?? [];
  }

  /** The trigger says whether its menu is open. An alps-icon-btn passes it on
   * to the button inside it; a plain button carries it itself. */
  private _syncExpanded = () => {
    for (const el of this._triggerElements()) {
      if ('expanded' in el) (el as Element & { expanded?: boolean }).expanded = this.openState;
      else if (el instanceof HTMLButtonElement || el.getAttribute('role') === 'button') el.setAttribute('aria-expanded', String(this.openState));
    }
  };

  private _getActiveElement(): Element | null {
    let active = document.activeElement;
    while (active?.shadowRoot && active.shadowRoot.activeElement) {
      active = active.shadowRoot.activeElement;
    }
    return active;
  }

  private _getFocusableElements(): HTMLElement[] {
    const slot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
    if (!slot) return [];
    
    const elements = slot.assignedElements({ flatten: true });
    const focusable: HTMLElement[] = [];
    
    const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        if (el.matches(selector)) {
          focusable.push(el);
        }
        const children = Array.from(el.querySelectorAll(selector)) as HTMLElement[];
        focusable.push(...children);
      }
    });
    
    return focusable;
  }

  /**
   * The keys of an open menu, from its trigger or from inside it.
   *
   * The page is live under a popover, so the menu's keys travel on to the
   * page's own handlers; each of them leaves alone a key that was handled.
   * Only the innermost open menu on the key's path answers it, and a dialog
   * opened from the menu keeps its own keys.
   */
  private _handleKeydown = (e: KeyboardEvent) => {
    // Handled already: by what is focused inside the menu, or by a menu inside
    // this one, which an Escape has just closed.
    if (!this.openState || e.defaultPrevented) return;
    const path = e.composedPath();
    const owner = path.find((node): node is AlpsPopup => node instanceof AlpsPopup && node.openState);
    if (owner !== this) return;
    const dialog = path.findIndex(node => node instanceof HTMLDialogElement && node.open);
    if (dialog !== -1 && dialog < path.indexOf(this)) return;
    this._handleMenuKey(e, path.includes(this._content as EventTarget));
  };

  /** The keys of the topmost menu while the focus is outside every menu, as it
   * is after a click on a trigger that takes no focus. */
  private _handleWindowKeydown = (e: KeyboardEvent) => {
    if (!this.openState || e.defaultPrevented || topModal() !== this._content) return;
    if (e.composedPath().some(node => node instanceof AlpsPopup && node.openState)) return;
    this._handleMenuKey(e, false);
  };

  private _handleMenuKey(e: KeyboardEvent, inside: boolean) {
    if (isComposingKey(e)) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (isMultilineTextEntry(this._getActiveElement())) return;
      e.preventDefault();
      const focusable = this._getFocusableElements();
      if (focusable.length === 0) return;

      const active = this._getActiveElement();
      let index = focusable.findIndex(el => el === active);

      if (e.key === 'ArrowDown') {
        index = index === -1 ? 0 : (index + 1) % focusable.length;
      } else {
        index = index === -1 ? focusable.length - 1 : (index - 1 + focusable.length) % focusable.length;
      }

      focusable[index].focus();
    } else if (inside && (e.key === 'Enter' || e.key === ' ')) {
      const active = this._getActiveElement() as HTMLElement;
      // Not from a field that owns the key. Keystrokes from slotted content bubble
      // to this menu, so a space typed into the composer's link fields or a
      // contact's new-category box was turned into a click on the input, and never
      // typed. A radio or checkbox still takes the space as activation, and Enter
      // in a single-line field still activates (the link form submits that way);
      // in a textarea Enter is a newline.
      if (e.key === ' ' ? consumesSpaceAsText(active) : isMultilineTextEntry(active)) return;
      if (active && typeof active.click === 'function') {
        e.preventDefault();
        active.click();
      }
    }
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    if (changedProperties.has('openState')) {
      const content = this._content;
      // The drawn state where there is no Popover API: a class, not the
      // template, which _updatePosition's side classes would be lost to.
      content?.classList.toggle('is-open', this.openState);
      if (this.openState) {
        if (content && !this._shown) this._showContent(content);
        window.addEventListener('keydown', this._handleWindowKeydown, true);
        this._updatePosition();
        this._followTrigger();
      } else if (changedProperties.get('openState') === true) {
        window.removeEventListener('keydown', this._handleWindowKeydown, true);
        this._stopFollowing();
        for (const nested of this._nestedPopups()) if (nested.openState) nested.close();
        this._hideContent(content);
        this._giveFocusBack();
        // Focus given back preserves the keyboard user's place.
        // Only release pointer focus, so hover-only row actions can disappear.
        const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="trigger"]');
        const active = this._getActiveElement() as HTMLElement | null;
        const onTrigger = slot?.assignedElements({ flatten: true }).some(el => el === active || el.matches(':focus-within'));
        if (onTrigger && active && !active.matches(':focus-visible')) active.blur();
      }
      this._syncExpanded();
    }
  }

  /**
   * Where the trigger was when the menu was placed. The page scrolls under an
   * open menu now, in scrollers inside shadow roots whose `scroll` reaches no
   * listener here, so the trigger is looked up once a frame and the menu
   * placed again when it moved.
   */
  private _triggerRect: DOMRect | null = null;
  private _frame = 0;

  private _followTrigger() {
    if (this._frame || typeof requestAnimationFrame !== 'function') return;
    const step = () => {
      this._frame = 0;
      if (!this.openState) return;
      const rect = this.shadowRoot?.querySelector('.trigger')?.getBoundingClientRect();
      const last = this._triggerRect;
      if (rect && last && (rect.top !== last.top || rect.left !== last.left || rect.width !== last.width || rect.height !== last.height)) {
        this._updatePosition();
      }
      this._frame = requestAnimationFrame(step);
    };
    this._frame = requestAnimationFrame(step);
  }

  private _stopFollowing() {
    if (this._frame) cancelAnimationFrame(this._frame);
    this._frame = 0;
  }

  private _updatePosition() {
    const trigger = this.shadowRoot?.querySelector('.trigger') as HTMLElement;
    const content = this.shadowRoot?.querySelector('.popup-content') as HTMLElement;
    if (!trigger || !content) return;

    const rect = trigger.getBoundingClientRect();
    this._triggerRect = rect;
    const contentRect = content.getBoundingClientRect();

    // The arithmetic below is in the viewport's physical coordinates, so the
    // logical anchors are resolved to a side once, here.
    const rtl = getComputedStyle(this).direction === 'rtl';
    const position = this.position === 'inline-start' ? (rtl ? 'right' : 'left')
      : this.position === 'inline-end' ? (rtl ? 'left' : 'right') : this.position;
    const align = this.align === 'start' ? (rtl ? 'right' : 'left')
      : this.align === 'end' ? (rtl ? 'left' : 'right') : this.align;
    let effectivePosition = position;
    let effectiveAlign = align;

    // Reset styles
    content.style.top = '';
    content.style.bottom = '';
    content.style.left = '';
    content.style.right = '';
    content.style.removeProperty('--arrow-right');
    content.style.removeProperty('--arrow-left');
    content.style.removeProperty('--arrow-top');
    content.style.removeProperty('--arrow-bottom');

    const isHorizontal = position === 'left' || position === 'right';

    if (isHorizontal) {
      // 1. Horizontal Position check & fallback
      if (position === 'right') {
        if (rect.right + 6 + contentRect.width > window.innerWidth && rect.left - 6 - contentRect.width >= 0) {
          effectivePosition = 'left';
        }
      } else {
        if (rect.left - 6 - contentRect.width < 0 && rect.right + 6 + contentRect.width <= window.innerWidth) {
          effectivePosition = 'right';
        }
      }

      // 2. Vertical Alignment fallback
      if (align === 'top') {
        if (rect.top + contentRect.height > window.innerHeight && rect.bottom - contentRect.height >= 0) {
          effectiveAlign = 'bottom';
        }
      } else {
        if (rect.bottom - contentRect.height < 0 && rect.top + contentRect.height <= window.innerHeight) {
          effectiveAlign = 'top';
        }
      }

      // 3. Set horizontal position styles
      if (effectivePosition === 'right') {
        content.style.left = `${rect.right + 6}px`;
        content.style.right = 'auto';
      } else {
        content.style.right = `${window.innerWidth - rect.left + 6}px`;
        content.style.left = 'auto';
      }

      // 4. Set vertical alignment styles & vertical arrow property
      const triggerCenterY = rect.top + rect.height / 2;
      if (effectiveAlign === 'top') {
        let topOffset = rect.top - 4; // slight offset
        if (topOffset + contentRect.height > window.innerHeight) {
          topOffset = window.innerHeight - contentRect.height - 8;
        }
        topOffset = Math.max(8, topOffset);
        content.style.top = `${topOffset}px`;
        content.style.bottom = 'auto';

        const arrowTop = triggerCenterY - topOffset - 6;
        content.style.setProperty('--arrow-top', `${Math.max(10, Math.min(contentRect.height - 20, arrowTop))}px`);
      } else {
        let bottomOffset = window.innerHeight - rect.bottom - 4;
        if (bottomOffset + contentRect.height > window.innerHeight) {
          bottomOffset = window.innerHeight - contentRect.height - 8;
        }
        bottomOffset = Math.max(8, bottomOffset);
        content.style.bottom = `${bottomOffset}px`;
        content.style.top = 'auto';

        const popupTop = window.innerHeight - bottomOffset - contentRect.height;
        const arrowTop = triggerCenterY - popupTop - 6;
        content.style.setProperty('--arrow-top', `${Math.max(10, Math.min(contentRect.height - 20, arrowTop))}px`);
      }

    } else {
      // Standard vertical positions (top / bottom)
      if (position === 'bottom') {
        if (rect.bottom + 8 + contentRect.height > window.innerHeight && rect.top - 8 - contentRect.height >= 0) {
          effectivePosition = 'top';
        }
      } else {
        if (rect.top - 8 - contentRect.height < 0 && rect.bottom + 8 + contentRect.height <= window.innerHeight) {
          effectivePosition = 'bottom';
        }
      }

      if (align === 'right') {
        if (rect.right - contentRect.width < 0 && rect.left + contentRect.width <= window.innerWidth) {
          effectiveAlign = 'left';
        }
      } else {
        if (rect.left + contentRect.width > window.innerWidth && rect.right - contentRect.width >= 0) {
          effectiveAlign = 'right';
        }
      }

      if (effectivePosition === 'bottom') {
        content.style.top = `${rect.bottom + 8}px`;
        content.style.bottom = 'auto';
      } else {
        content.style.bottom = `${window.innerHeight - rect.top + 8}px`;
        content.style.top = 'auto';
      }

      if (effectiveAlign === 'right') {
        let rightOffset = window.innerWidth - rect.right;
        if (rightOffset + contentRect.width > window.innerWidth) {
          rightOffset = window.innerWidth - contentRect.width - 8;
        }
        rightOffset = Math.max(8, rightOffset);
        content.style.right = `${rightOffset}px`;
        content.style.left = 'auto';

        const triggerCenter = rect.left + rect.width / 2;
        const popupRight = window.innerWidth - rightOffset;
        const arrowRight = popupRight - triggerCenter - 6;
        content.style.setProperty('--arrow-right', `${Math.max(10, Math.min(contentRect.width - 20, arrowRight))}px`);
      } else {
        let leftOffset = rect.left;
        if (leftOffset + contentRect.width > window.innerWidth) {
          leftOffset = window.innerWidth - contentRect.width - 8;
        }
        leftOffset = Math.max(8, leftOffset);
        content.style.left = `${leftOffset}px`;
        content.style.right = 'auto';

        const triggerCenter = rect.left + rect.width / 2;
        const arrowLeft = triggerCenter - leftOffset - 6;
        content.style.setProperty('--arrow-left', `${Math.max(10, Math.min(contentRect.width - 20, arrowLeft))}px`);
      }
    }

    content.classList.remove('position-top', 'position-bottom', 'position-left', 'position-right', 'align-left', 'align-right', 'align-top', 'align-bottom');
    content.classList.add(`position-${effectivePosition}`, `align-${effectiveAlign}`);
  }

  private _closeTimeout: any = null;
  // An open menu moves with a language switch to or from a right-to-left
  // one, though none of its own properties changed.
  private _directionObserver = new MutationObserver(() => {
    if (this.openState) this._updatePosition();
  });

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._handleResize, { passive: true });
    this._directionObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    this.addEventListener('mouseenter', this._handleMouseEnter);
    this.addEventListener('mouseleave', this._handleMouseLeave);
    this.addEventListener('keydown', this._handleKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._handleResize);
    window.removeEventListener('keydown', this._handleWindowKeydown, true);
    this._directionObserver.disconnect();
    this.removeEventListener('mouseenter', this._handleMouseEnter);
    this.removeEventListener('mouseleave', this._handleMouseLeave);
    this.removeEventListener('keydown', this._handleKeydown);
    this._stopFollowing();
    if (this._closeTimeout) {
      clearTimeout(this._closeTimeout);
      this._closeTimeout = null;
    }
    // Being torn down is not a close. updated() only acts when openState
    // CHANGES, so an element removed while open never runs its close branch:
    // the popover leaves the top layer with the element, but openState stays
    // true, and an instance that comes back believes it is still open and never
    // shows its popover again — a menu that cannot be opened. Closing here
    // makes teardown and state agree however it is reached.
    this._hideContent(this._content);
    this._returnFocus = null;
    this.openState = false;
  }

  private _handleMouseEnter = () => {
    if (this.triggerOn === 'hover') {
      if (this._closeTimeout) {
        clearTimeout(this._closeTimeout);
        this._closeTimeout = null;
      }
      this.open();
    }
  };

  private _handleMouseLeave = () => {
    if (this.triggerOn === 'hover') {
      if (this._closeTimeout) {
        clearTimeout(this._closeTimeout);
      }
      this._closeTimeout = setTimeout(() => {
        this.close();
        this._closeTimeout = null;
      }, 300); // 300ms smoothing delay to prevent accidental/flickery hover closures
    }
  };

  private _handleResize = () => {
    if (this.openState) {
      this._updatePosition();
    }
  };

  render() {
    return html`
      <div class="trigger" @click=${this.toggle} @pointerdown=${this._handleTriggerPointerDown}>
        <slot name="trigger" @slotchange=${this._syncExpanded}></slot>
      </div>

      <div class="popup-content align-${this.align} position-${this.position}"
        popover=${this.triggerOn === 'hover' ? 'manual' : 'auto'}
        @toggle=${this._handleToggle}>
        <slot></slot>
      </div>
    `;
  }
}
