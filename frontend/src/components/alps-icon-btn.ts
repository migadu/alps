import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';

@customElement('alps-icon-btn')
export class AlpsIconBtn extends LitElement {
  @property({ type: String }) icon = '';
  @property({ type: String }) title = '';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean }) spinning = false;

  static styles = css`
    :host {
      display: inline-flex;
      line-height: 0;
    }

    button {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: var(--btn-icon-padding, 6px);
      border-radius: var(--btn-radius, 4px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      margin: 0;
      line-height: 0;
      aspect-ratio: 1 / 1;
      box-sizing: border-box;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (hover: hover) {
      button:hover:not(:disabled) {
        background: var(--btn-hover-bg, var(--hover-color, rgba(0, 0, 0, 0.05)));
      }
      button:hover:not(:disabled) .icon {
        color: var(--text-primary);
      }
    }

    :host([active]) button {
      background: var(--btn-hover-bg, var(--hover-color, rgba(0, 0, 0, 0.05)));
    }
    :host([active]) .icon {
      color: var(--text-primary);
    }

    .icon {
      width: var(--btn-icon-size, 18px);
      height: var(--btn-icon-size, 18px);
      fill: currentColor;
      color: var(--btn-color, var(--text-muted));
      transition: color 0.2s;
    }

    .spinning .icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  private _handleAnimationIteration() {
    // Forward the animationiteration event since it doesn't cross the Shadow DOM boundary by default.
    this.dispatchEvent(new Event('animationiteration', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <button 
        type="button"
        title=${this.title}
        ?disabled=${this.disabled}
        class=${this.spinning ? 'spinning' : ''}
        part="button"
        @animationiteration=${this._handleAnimationIteration}
      >
        ${this.icon ? renderIcon(this.icon as any) : html`<slot></slot>`}
      </button>
    `;
  }
}
