import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type BannerVariant = 'info' | 'warning' | 'error';

@customElement('alps-banner')
export class AlpsBanner extends LitElement {
  @property({ type: String, reflect: true }) variant: BannerVariant = 'info';

  static styles = css`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .banner {
      padding: 6px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      border-bottom: 1px solid var(--border-color);
      background: var(--surface, #ffffff);
      color: var(--text-primary, #111827);
      box-shadow: rgba(95, 95, 95, 0.1) 0 4px 4px -2px;
    }

    .content {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .actions {
      margin-left: 16px;
      flex-shrink: 0;
      display: flex;
      gap: 8px;
    }

    ::slotted(alps-button) {
      --btn-padding: 4px 10px;
      --btn-font-size: 12px;
    }
  `;

  render() {
    return html`
      <div class="banner ${this.variant}">
        <div class="content">
          <slot></slot>
        </div>
        <div class="actions">
          <slot name="action"></slot>
        </div>
      </div>
    `;
  }
}
