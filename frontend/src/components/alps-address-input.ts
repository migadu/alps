import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';
import { registry } from '../plugin-registry';
import { popupStyles } from './alps-popup.js';

@customElement('alps-address-input')
export class AlpsAddressInput extends LitElement {
  @property({ type: Array }) addresses: string[] = [];
  @property({ type: Boolean }) disabled = false;
  
  @state() private inputText = '';
  @state() private suggestions: { name: string, address: string }[] = [];
  @state() private focusedSuggestionIndex = -1;
  private _suggestionTimeout: number | null = null;

  public focus() {
    const input = this.shadowRoot?.querySelector('input');
    if (input) {
      input.focus();
    }
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    if (changedProperties.has('focusedSuggestionIndex') && this.focusedSuggestionIndex >= 0) {
      const activeBtn = this.shadowRoot?.querySelector('.dropdown-item.active') as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  private _isBlockedAddress(email: string): boolean {
    let rawEmail = email.trim();
    if (rawEmail.endsWith('>')) {
      const startObj = rawEmail.lastIndexOf('<');
      if (startObj !== -1) {
        rawEmail = rawEmail.substring(startObj + 1, rawEmail.length - 1);
      }
    }
    const lowerEmail = rawEmail.toLowerCase();
    return lowerEmail.startsWith('noreply') || 
           lowerEmail.startsWith('no-reply') || 
           lowerEmail.startsWith('mailer-daemon');
  }

  private _isValidEmail(email: string) {
    if (this._isBlockedAddress(email)) return false;

    const trimmed = email.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return true;
    if (/^.*?<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(trimmed)) return true;
    return false;
  }

  private _displayAddr(addr: string) {
    const trimmed = addr.trim();
    if (trimmed.endsWith('>')) {
      const startObj = trimmed.lastIndexOf('<');
      if (startObj !== -1) {
        const namePart = trimmed.substring(0, startObj).trim();
        const emailPart = trimmed.substring(startObj + 1, trimmed.length - 1);
        const name = namePart.replace(/^["']|["']$/g, '').trim();
        return name || emailPart;
      }
    }
    return addr;
  }

  private _handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.inputText = target.value;

    if (this._suggestionTimeout !== null) {
      window.clearTimeout(this._suggestionTimeout);
    }

    if (this.inputText.trim().length > 1) {
      this._suggestionTimeout = window.setTimeout(async () => {
        try {
          const results = await registry.invokeHookAsync('composer:suggest', { query: this.inputText.trim() });
          this.suggestions = results.flat();
          this.focusedSuggestionIndex = -1;
        } catch (err) {
          console.error('Failed to get suggestions', err);
          this.suggestions = [];
          this.focusedSuggestionIndex = -1;
        }
      }, 300);
    } else {
      this.suggestions = [];
      this.focusedSuggestionIndex = -1;
    }
  }

  private _handleKeyDown(e: KeyboardEvent) {
    const inputVal = this.inputText.trim();

    if (this.suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.focusedSuggestionIndex = Math.min(this.focusedSuggestionIndex + 1, this.suggestions.length - 1);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.focusedSuggestionIndex = Math.max(this.focusedSuggestionIndex - 1, -1);
        return;
      } else if (e.key === 'Enter' && this.focusedSuggestionIndex >= 0) {
        e.preventDefault();
        const s = this.suggestions[this.focusedSuggestionIndex];
        const addr = s.name ? '"' + s.name + '" <' + s.address + '>' : s.address;
        this._addAddress(addr);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.suggestions = [];
        this.focusedSuggestionIndex = -1;
        return;
      }
    }

    if (e.key === 'Enter' && inputVal) {
      e.preventDefault();
      if (this._isValidEmail(inputVal)) {
        this._addAddress(inputVal);
      }
    } else if ((e.key === ' ' || e.key === ',') && inputVal) {
      e.preventDefault();
      if (this._isValidEmail(inputVal)) {
        this._addAddress(inputVal);
      }
    } else if (e.key === 'Backspace' && !this.inputText && this.addresses.length > 0) {
      const lastAddr = this.addresses[this.addresses.length - 1];
      this._removeAddress(lastAddr);
      this.inputText = lastAddr + ' ';
    }
  }

  private _addAddress(addr: string, restoreFocus = true) {
    if (!this.addresses.includes(addr)) {
      this.addresses = [...this.addresses, addr];
      this._notifyChange();
    }
    this.inputText = '';
    this.suggestions = [];
    this.focusedSuggestionIndex = -1;
    
    if (restoreFocus) {
      this.focus();
    }
  }

  private _removeAddress(addrToRemove: string) {
    this.addresses = this.addresses.filter(addr => addr !== addrToRemove);
    this._notifyChange();
  }

  private _notifyChange() {
    this.dispatchEvent(new CustomEvent('addresses-changed', {
      detail: { addresses: this.addresses },
      bubbles: true,
      composed: true
    }));
  }

  private _handleBlur() {
    // Small timeout to allow mousedown to fire on suggestion buttons before we hide them by clearing inputText
    setTimeout(() => {
      const inputVal = this.inputText.trim();
      if (inputVal && this._isValidEmail(inputVal)) {
        this._addAddress(inputVal, false);
      }
      this.suggestions = [];
      this.focusedSuggestionIndex = -1;
    }, 150);
  }

  static styles = [
    popupStyles,
    css`
    :host {
      display: block;
      width: 100%;
      position: relative;
      font-family: inherit;
    }

    .address-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      min-height: 32px;
      cursor: text;
    }

    .pill {
      display: flex;
      align-items: center;
      background: var(--bg-selected);
      border: none;
      border-radius: 4px;
      padding: 2px 2px 2px 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent-hover);
      gap: 4px;
    }

    .pill-addr {
      font-size: 13px;
      line-height: 1;
    }

    .pill-remove {
      background: none;
      border: none;
      color: var(--accent-hover);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border-radius: 4px;
    }

    .pill-remove svg {
      width: 14px;
      height: 14px;
    }

    .pill-remove:hover {
      color: var(--text-color);
    }

    .input-container {
      flex: 1;
      min-width: 8px;
      position: relative;
    }

    .input-wrapper {
      width: 100%;
      display: flex;
    }

    .input-container:focus-within,
    .input-container.has-value {
      min-width: 144px;
    }

    .suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 40010;
      min-width: 200px;
      max-width: 320px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      padding: 4px 0;
      display: flex;
      flex-direction: column;
      margin-top: 4px;
      max-height: 250px;
      overflow-y: auto;
    }

    input {
      width: 100%;
      border: none;
      outline: none;
      font-size: 14px;
      color: var(--text-color);
      background: transparent;
      padding: 4px 0;
    }
  `];

  render() {
    return html`
      <div class="address-container" @click=${this.focus}>
        ${this.addresses.map(addr => html`
          <div class="pill" title=${addr}>
            <span class="pill-addr">${this._displayAddr(addr)}</span>
            <button class="pill-remove" @click=${() => this._removeAddress(addr)} ?disabled=${this.disabled}>
              ${renderIcon('x')}
            </button>
          </div>
        `)}
        
        <div class="input-container ${this.inputText.length > 0 ? 'has-value' : ''}">
          <div class="input-wrapper">
            <input
              type="text"
              .value=${this.inputText}
              @input=${this._handleInput}
              @keydown=${this._handleKeyDown}
              @blur=${this._handleBlur}
              @click=${(e: Event) => e.stopPropagation()}
              ?disabled=${this.disabled}
            />
          </div>
          ${this.suggestions.length > 0 ? html`
            <div class="suggestions-dropdown">
              ${this.suggestions.map((s, index) => html`
                <button class="dropdown-item ${index === this.focusedSuggestionIndex ? 'active' : ''}"
                  @mousedown=${(e: Event) => {
                    // Prevent mousedown from stealing focus from the input
                    e.preventDefault();
                  }}
                  @click=${(e: Event) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const addr = s.name ? '"' + s.name + '" <' + s.address + '>' : s.address;
                    this._addAddress(addr);
                  }}>
                  <span class="item-text"><b>${s.name}</b> &lt;${s.address}&gt;</span>
                </button>
              `)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}
