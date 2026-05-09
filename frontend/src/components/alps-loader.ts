import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';

@customElement('alps-loader')
export class AlpsLoader extends LitElement {
  @property({ type: String }) text = '';
  @property({ type: Boolean, attribute: 'full-height' }) fullHeight = false;

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: currentColor;
    }
    
    :host([full-height]) {
      display: flex;
      height: 100%;
    }

    .spinner {
      animation: spin 1.5s linear infinite;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner .icon {
      width: var(--loader-size, 32px);
      height: var(--loader-size, 32px);
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `;

  render() {
    return html`
      <div class="spinner">${renderIcon('edelweiss')}</div>
      ${this.text ? html`<span>${this.text}</span>` : ''}
    `;
  }
}
