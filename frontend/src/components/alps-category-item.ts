import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';

@customElement('alps-category-item')
export class AlpsCategoryItem extends LitElement {
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: String }) icon = '';

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      margin: 2px 12px;
      cursor: pointer;
      border-radius: 6px;
      color: var(--text-secondary);
      font-weight: 500;
      transition: background 0.15s;
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
    }

    .category-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      margin-right: 12px;
      opacity: 0.7;
    }

    :host([active]) .category-icon {
      opacity: 1;
    }

    .category-icon svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    :host(:hover) {
      background: var(--hover-color);
      color: var(--text-primary);
    }

    :host([active]) {
      background: var(--bg-selected);
      color: var(--accent-hover);
      font-weight: 600;
    }

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  render() {
    return html`
      ${this.icon ? html`
        <span class="category-icon">${renderIcon(this.icon as any)}</span>
      ` : ''}
      <span class="label"><slot></slot></span>
    `;
  }
}
