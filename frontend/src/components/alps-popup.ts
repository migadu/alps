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
  @property({ type: String }) align: 'left' | 'right' = 'right';
  @property({ type: String }) position: 'top' | 'bottom' = 'bottom';
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

    .popup-content.align-right::before,
    .popup-content.align-right::after,
    .popup-content.align-left::before,
    .popup-content.align-left::after {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
      pointer-events: none;
    }

    .popup-content.position-bottom.align-right::before {
      top: -6px;
      right: 10px;
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color, #e5e7eb) transparent;
    }

    .popup-content.position-bottom.align-right::after {
      top: -5px;
      right: 11px;
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-primary, #ffffff) transparent;
    }

    .popup-content.position-bottom.align-left::before {
      top: -6px;
      left: 10px;
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border-color, #e5e7eb) transparent;
    }

    .popup-content.position-bottom.align-left::after {
      top: -5px;
      left: 11px;
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-primary, #ffffff) transparent;
    }

    .popup-content.position-top.align-right::before {
      bottom: -6px;
      right: 10px;
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color, #e5e7eb) transparent transparent transparent;
    }

    .popup-content.position-top.align-right::after {
      bottom: -5px;
      right: 11px;
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-primary, #ffffff) transparent transparent transparent;
    }

    .popup-content.position-top.align-left::before {
      bottom: -6px;
      left: 10px;
      border-width: 6px 6px 0 6px;
      border-color: var(--border-color, #e5e7eb) transparent transparent transparent;
    }

    .popup-content.position-top.align-left::after {
      bottom: -5px;
      left: 11px;
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-primary, #ffffff) transparent transparent transparent;
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

  public toggle(_e: Event) {
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
      content.style.right = `${window.innerWidth - rect.right}px`;
      content.style.left = 'auto';
    } else {
      content.style.left = `${rect.left}px`;
      content.style.right = 'auto';
    }

    content.classList.remove('position-top', 'position-bottom', 'align-left', 'align-right');
    content.classList.add(`position-${effectivePosition}`, `align-${effectiveAlign}`);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._handleResize, { passive: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._handleResize);
  }

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
      
      <dialog class="popup-dialog" @pointerdown=${this._handleDialogClick} @contextmenu=${this._handleDialogClick} @close=${this._handleDialogClose}>
        <div class="popup-content align-${this.align} position-${this.position}">
          <slot></slot>
        </div>
      </dialog>
    `;
  }
}
