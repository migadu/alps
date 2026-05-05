import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';

export type ButtonVariant = 'primary' | 'normal' | 'danger' | 'text';
export type ButtonType = 'button' | 'submit' | 'reset';

@customElement('alps-button')
export class AlpsButton extends LitElement {
  @property({ type: String, reflect: true }) variant: ButtonVariant = 'normal';
  @property({ type: String }) icon = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) spinning = false;
  @property({ type: String }) type: ButtonType = 'button';
  @property({ type: String }) title = '';
  @property({ type: Boolean, attribute: 'full-width', reflect: true }) fullWidth = false;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleClick);
  }

  private handleClick = (e: Event) => {
    if (this.disabled || this.spinning) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (this.type === 'submit') {
      const form = this.closest('form');
      if (form) {
        e.preventDefault();
        form.requestSubmit();
      }
    } else if (this.type === 'reset') {
      const form = this.closest('form');
      if (form) {
        e.preventDefault();
        form.reset();
      }
    }
  };

  static styles = css`
    :host {
      display: inline-flex;
    }

    :host([full-width]) {
      display: flex;
      width: 100%;
    }

    :host([full-width]) button {
      width: 100%;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--btn-gap, 8px);
      font-family: inherit;
      font-size: var(--btn-font-size, 14px);
      font-weight: 500;
      border-radius: var(--btn-radius, 4px);
      padding: var(--btn-padding, 8px 16px);
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;
      line-height: normal;
      outline: none;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button:active:not(:disabled) {
      transform: scale(0.98);
    }

    /* Variant: Normal (Default) */
    :host([variant="normal"]) button {
      background-color: transparent;
      color: var(--text-primary, #111827);
      border: 1px solid var(--border-color, #e5e7eb);
    }
    
    @media (hover: hover) {
      :host([variant="normal"]) button:hover:not(:disabled) {
        background-color: var(--bg-tertiary, #f3f4f6);
      }
    }

    /* Variant: Primary */
    :host([variant="primary"]) button {
      background-color: var(--accent-color, #3b82f6);
      color: #ffffff;
      border: 1px solid transparent;
    }
    
    @media (hover: hover) {
      :host([variant="primary"]) button:hover:not(:disabled) {
        background-color: var(--accent-hover, #2563eb);
      }
    }

    /* Variant: Danger */
    :host([variant="danger"]) button {
      background-color: transparent;
      color: var(--error, #ef4444);
      border: 1px solid var(--border-color, #e5e7eb);
    }
    
    @media (hover: hover) {
      :host([variant="danger"]) button:hover:not(:disabled) {
        background-color: var(--error-light, #fee2e2);
        border-color: var(--error, #ef4444);
      }
    }

    /* Variant: Text */
    :host([variant="text"]) button {
      background-color: transparent;
      color: var(--text-muted, #6b7280);
      border: 1px solid transparent;
    }
    
    @media (hover: hover) {
      :host([variant="text"]) button:hover:not(:disabled) {
        color: var(--text-primary, #111827);
        background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
      }
    }

    /* Icons and Spinners */
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--btn-icon-size, 18px);
      height: var(--btn-icon-size, 18px);
    }

    .icon-container svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .spinner {
      animation: spin 1s linear infinite;
      display: flex;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Slot wrapper for proper alignment */
    .content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }
  `;

  render() {
    return html`
      <button 
        type=${this.type}
        title=${this.title}
        ?disabled=${this.disabled || this.spinning}
        part="button"
      >
        ${this.spinning ? html`
          <span class="icon-container spinner">
            ${renderIcon('edelweiss')}
          </span>
        ` : this.icon ? html`
          <span class="icon-container">
            ${renderIcon(this.icon as any)}
          </span>
        ` : ''}
        <span class="content"><slot></slot></span>
      </button>
    `;
  }
}
