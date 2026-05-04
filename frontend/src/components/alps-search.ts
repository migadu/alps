import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';

@customElement('alps-search')
export class AlpsSearch extends LitElement {
  @property({ type: String }) placeholder = 'Search...';
  @property({ type: String }) value = '';

  static styles = css`
    :host {
      display: block;
      flex: 1;
    }

    .search-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      color: var(--text-muted, #888);
      display: flex;
      pointer-events: none;
    }

    .search-icon svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .search-input {
      flex: 1;
      width: 100%;
      padding: 8px 12px 8px 34px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-secondary, #f9fafb);
      color: var(--text-primary, #333);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      box-sizing: border-box;
    }

    .search-input:focus {
      border-color: var(--accent-color, #005A9E);
      box-shadow: 0 0 0 2px rgba(0, 90, 158, 0.2);
    }
  `;

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this.dispatchEvent(new CustomEvent('search-change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true
    }));
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('search-submit', {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      }));
    }
  }

  render() {
    return html`
      <div class="search-container">
        <div class="search-icon">
          ${renderIcon('magnifyingGlass')}
        </div>
        <input 
          type="text" 
          class="search-input" 
          placeholder=${this.placeholder}
          .value=${this.value}
          @input=${this.handleInput}
          @keydown=${this.handleKeyDown}
        >
      </div>
    `;
  }
}
