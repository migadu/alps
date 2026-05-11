import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface AlpsToggleOption {
  value: string;
  label: string;
}

@customElement('alps-toggle')
export class AlpsToggle extends LitElement {
  @property({ type: Array }) options: AlpsToggleOption[] = [];
  @property({ type: String }) value = '';

  static styles = css`
    :host {
      display: inline-flex;
      background-color: var(--bg-secondary, #f3f4f6);
      border-radius: 6px;
      padding: 2px;
      border: 1px solid var(--border-color, #e5e7eb);
    }

    button {
      background: none;
      border: none;
      padding: 4px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #4b5563);
      transition: all 0.2s;
    }

    button.active {
      background-color: var(--bg-primary, #ffffff);
      color: var(--text-primary, #111827);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    :host([full-width]) {
      display: flex;
      width: 100%;
      box-sizing: border-box;
    }

    :host([full-width]) button {
      flex: 1;
    }
  `;

  render() {
    return html`
      ${this.options.map(opt => html`
        <button 
          class="${this.value === opt.value ? 'active' : ''}" 
          @click=${() => this._select(opt.value)}
        >${opt.label}</button>
      `)}
    `;
  }

  private _select(val: string) {
    if (this.value !== val) {
      this.value = val;
      this.dispatchEvent(new CustomEvent('change', { detail: { value: val } }));
    }
  }
}
