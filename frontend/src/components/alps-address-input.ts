import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';

@customElement('alps-address-input')
export class AlpsAddressInput extends LitElement {
  @property({ type: Array }) addresses: string[] = [];
  @property({ type: Boolean }) disabled = false;
  
  @state() private inputText = '';

  public focus() {
    const input = this.shadowRoot?.querySelector('input');
    if (input) {
      input.focus();
    }
  }

  private _isBlockedAddress(email: string): boolean {
    let rawEmail = email.trim();
    const match = rawEmail.match(/^.*?<([^>]+)>$/);
    if (match && match[1]) {
      rawEmail = match[1];
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
    const match = addr.match(/^(.*?)\s*<([^>]+)>$/);
    if (match && match[1]) {
      const name = match[1].replace(/^["']|["']$/g, '').trim();
      return name || match[2];
    }
    return addr;
  }

  private _handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.inputText = target.value;
  }

  private _handleKeyDown(e: KeyboardEvent) {
    const inputVal = this.inputText.trim();

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
    const inputVal = this.inputText.trim();
    if (inputVal && this._isValidEmail(inputVal)) {
      this._addAddress(inputVal, false);
    }
  }

  static styles = css`
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

    .input-wrapper {
      flex: 1;
      min-width: 8px;
      display: flex;
    }

    .input-wrapper:focus-within,
    .input-wrapper.has-value {
      min-width: 144px;
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
  `;

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
        
        <div class="input-wrapper ${this.inputText.length > 0 ? 'has-value' : ''}">
          <input
            type="text"
            .value=${this.inputText}
            @input=${this._handleInput}
            @keydown=${this._handleKeyDown}
            @blur=${this._handleBlur}
            ?disabled=${this.disabled}
          />
        </div>
      </div>
    `;
  }
}
