import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { renderIcon } from '../utils/ui';

/**
 * A row of the Settings sidebar, and its button.
 *
 * The row was a host with a click handler and nothing else: no Tab stop, no
 * role, no key. Tab went past every category, so Settings could not leave the
 * category it opened on from the keyboard, and a screen reader did not present
 * the rows as controls or say which one was shown. The row is now a button,
 * as a mail folder's name is: one Tab stop, named by its label, answering
 * Enter and Space with the click the page listens for, and current while its
 * category is shown. It holds no other control, so the whole row can be one.
 */
@customElement('alps-category-item')
export class AlpsCategoryItem extends LitElement {
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: String }) icon = '';

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.handleKeyDown);
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has('active')) {
      if (this.active) this.setAttribute('aria-current', 'true');
      else this.removeAttribute('aria-current');
    }
  }

  /** Enter and Space, as on a <button>, and Space once while it is held. */
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (e.key === ' ' && e.repeat) return;
    this.click();
  };

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
