import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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
    text-align: left;
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
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  .dropdown-item:last-of-type {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
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

@customElement('alps-popup')
export class AlpsPopup extends LitElement {
  @property({ type: String }) align: 'left' | 'right' | 'top' | 'bottom' = 'right';
  @property({ type: String }) position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  @property({ type: String }) triggerOn: 'click' | 'hover' = 'click';
  @property({ type: Boolean, reflect: true, attribute: 'open' }) openState = false;

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }

    .popup-dialog {
      position: fixed;
      inset: 0;
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      width: 100vw;
      height: 100vh;
      max-width: none;
      max-height: none;
      overflow: visible;
    }

    .popup-dialog::backdrop {
      background: transparent;
    }

    .popup-content {
      position: absolute;
      
      z-index: 40010;
      min-width: 160px;
      max-width: 320px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      padding: 4px 0;
      display: flex;
      flex-direction: column;
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

  `;

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
    if (this.openState) {
      this.close();
    } else {
      this.open();
    }
  }

  private _handleDialogClick = (e: Event) => {
    if (!this.openState) return;
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      e.preventDefault();
      this.close();
    }
  };

  private _handleDialogClose = () => {
    if (this.openState) {
      this.close();
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

  private _handleDialogKeydown = (e: KeyboardEvent) => {
    if (!this.openState) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
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
    } else if (e.key === 'Enter' || e.key === ' ') {
      const active = this._getActiveElement() as HTMLElement;
      if (active && typeof active.click === 'function') {
        e.preventDefault();
        active.click();
      }
    }
  };

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    if (changedProperties.has('openState')) {
      const dialog = this.shadowRoot?.querySelector('.popup-dialog') as HTMLDialogElement | null;
      if (this.openState) {
        if (dialog && !dialog.open) {
          dialog.showModal();
        }
        this._updatePosition();
      } else {
        if (dialog && dialog.open) {
          dialog.close();
          // Dialog natively restores focus to the trigger element on close.
          // We blur it immediately so parent containers don't get stuck with :focus-within.
          const triggerSlot = this.shadowRoot?.querySelector('slot[name="trigger"]') as HTMLSlotElement | null;
          if (triggerSlot) {
            const elements = triggerSlot.assignedElements({ flatten: true });
            elements.forEach(el => {
              if (el instanceof HTMLElement) el.blur();
            });
          }
        }
      }
    }
  }

  private _updatePosition() {
    const trigger = this.shadowRoot?.querySelector('.trigger') as HTMLElement;
    const content = this.shadowRoot?.querySelector('.popup-content') as HTMLElement;
    if (!trigger || !content) return;

    const rect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    let effectivePosition = this.position;
    let effectiveAlign = this.align;

    // Reset styles
    content.style.top = '';
    content.style.bottom = '';
    content.style.left = '';
    content.style.right = '';
    content.style.removeProperty('--arrow-right');
    content.style.removeProperty('--arrow-left');
    content.style.removeProperty('--arrow-top');
    content.style.removeProperty('--arrow-bottom');

    const isHorizontal = this.position === 'left' || this.position === 'right';

    if (isHorizontal) {
      // 1. Horizontal Position check & fallback
      if (this.position === 'right') {
        if (rect.right + 6 + contentRect.width > window.innerWidth && rect.left - 6 - contentRect.width >= 0) {
          effectivePosition = 'left';
        }
      } else {
        if (rect.left - 6 - contentRect.width < 0 && rect.right + 6 + contentRect.width <= window.innerWidth) {
          effectivePosition = 'right';
        }
      }

      // 2. Vertical Alignment fallback
      if (this.align === 'top') {
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
      if (this.position === 'bottom') {
        if (rect.bottom + 8 + contentRect.height > window.innerHeight && rect.top - 8 - contentRect.height >= 0) {
          effectivePosition = 'top';
        }
      } else {
        if (rect.top - 8 - contentRect.height < 0 && rect.bottom + 8 + contentRect.height <= window.innerHeight) {
          effectivePosition = 'bottom';
        }
      }

      if (this.align === 'right') {
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

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._handleResize, { passive: true });
    this.addEventListener('mouseenter', this._handleMouseEnter);
    this.addEventListener('mouseleave', this._handleMouseLeave);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._handleResize);
    this.removeEventListener('mouseenter', this._handleMouseEnter);
    this.removeEventListener('mouseleave', this._handleMouseLeave);
  }

  private _handleMouseEnter = () => {
    if (this.triggerOn === 'hover') {
      this.open();
    }
  };

  private _handleMouseLeave = () => {
    if (this.triggerOn === 'hover') {
      this.close();
    }
  };

  private _handleResize = () => {
    if (this.openState) {
      this._updatePosition();
    }
  };

  render() {
    return html`
      <div class="trigger" @click=${this.toggle}>
        <slot name="trigger"></slot>
      </div>
      
      <dialog class="popup-dialog" 
        @pointerdown=${this._handleDialogClick} 
        @contextmenu=${this._handleDialogClick} 
        @close=${this._handleDialogClose}
        @keydown=${this._handleDialogKeydown}>
        <div class="popup-content align-${this.align} position-${this.position}">
          <slot></slot>
        </div>
      </dialog>
    `;
  }
}
