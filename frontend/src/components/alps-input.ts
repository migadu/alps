import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';

@customElement('alps-input')
export class AlpsInput extends LitElement {
  @property({ type: String }) type = 'text';
  @property({ type: String }) value = '';
  @property({ type: String }) placeholder = '';
  @property({ type: Boolean }) required = false;
  @property({ type: String }) autocomplete = '';
  @property({ type: String }) inputId = '';
  @property({ type: String }) icon = '';
  @property({ type: Boolean }) clearable = false;
  @property({ type: Boolean }) autofocus = false;

  @state() private showPassword = false;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    input {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      background: var(--alps-input-bg, var(--bg-primary, #ffffff));
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: var(--input-radius, 6px);
      color: var(--text-primary, #111827);
      font-family: var(--font-base, 'Inter', sans-serif);
      font-size: var(--input-font-size, 14px);
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }

    /* Padding adjustments for icons */
    .has-left-icon input {
      padding-left: 36px;
    }

    .has-right-icon input {
      padding-right: 36px;
    }

    input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
    }

    input::placeholder {
      color: var(--text-muted, #9ca3af);
    }

    .icon-left {
      position: absolute;
      left: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: var(--text-muted, #9ca3af);
      pointer-events: none;
    }

    .icon-left svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .action-btn {
      position: absolute;
      right: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: var(--text-muted, #9ca3af);
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0;
      border-radius: 4px;
      transition: color 0.2s ease, background 0.2s ease;
      outline: none;
    }

    .action-btn:hover {
      color: var(--text-primary, #111827);
      background: var(--bg-tertiary, #f3f4f6);
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
  `;

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    // Dispatch standard input and change events so it behaves like a native input
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  private togglePassword() {
    this.showPassword = !this.showPassword;
  }

  private handleClear() {
    this.value = '';
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('clear', { bubbles: true, composed: true }));
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const form = this.closest('form');
      if (form) {
        e.preventDefault();
        form.requestSubmit();
      }
    }
  }

  public checkValidity(): boolean {
    const input = this.shadowRoot?.querySelector('input');
    return input ? input.checkValidity() : true;
  }

  public reportValidity(): boolean {
    const input = this.shadowRoot?.querySelector('input');
    return input ? input.reportValidity() : true;
  }

  public focus() {
    const input = this.shadowRoot?.querySelector('input');
    if (input) input.focus();
  }

  render() {
    const isPasswordType = this.type === 'password';
    const currentType = isPasswordType && this.showPassword ? 'text' : this.type;
    const effectiveIcon = this.icon || (this.type === 'email' ? 'at' : '');

    return html`
      <div class="input-wrapper ${effectiveIcon ? 'has-left-icon' : ''} ${(isPasswordType || this.clearable) && this.value ? 'has-right-icon' : ''}">
        ${effectiveIcon ? html`
          <span class="icon-left">
            ${renderIcon(effectiveIcon)}
          </span>
        ` : ''}

        <input 
          id=${this.inputId || ''}
          type=${currentType} 
          .value=${this.value}
          placeholder=${this.placeholder}
          ?required=${this.required}
          ?autofocus=${this.autofocus}
          autocomplete=${this.autocomplete}
          @input=${this.handleInput}
          @change=${this.handleInput}
          @keydown=${this.handleKeyDown}
        />

        ${isPasswordType && this.value ? html`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.togglePassword}
            title=${this.showPassword ? 'Hide password' : 'Show password'}
            tabindex="-1"
          >
            ${renderIcon(this.showPassword ? 'eyeSlash' : 'eye')}
          </button>
        ` : this.clearable && this.value ? html`
          <button 
            type="button" 
            class="action-btn" 
            @click=${this.handleClear}
            title="Clear"
            tabindex="-1"
          >
            ${renderIcon('x')}
          </button>
        ` : ''}
      </div>
    `;
  }
}
