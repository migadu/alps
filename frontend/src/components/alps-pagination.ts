import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import './alps-icon-btn';

@customElement('alps-pagination')
export class AlpsPagination extends LitElement {
  @property({ type: Number }) currentPage = 0;
  @property({ type: Number }) totalItems = 0;
  @property({ type: Number }) itemsPerPage = 50;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this.i18nStore?.addEventListener('change', this._handleStoreChange);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleStoreChange);
  }

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  static styles = css`
    :host {
      display: flex;
      flex: 1;
      min-width: 0;
    }

    .pagination-container {
      display: flex;
      flex: 1;
      align-items: center;
      background: var(--bg-color);
      font-size: 13px;
      color: var(--text-muted);
      min-width: 0;
    }

    .pagination-controls {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .pagination-text {
      margin: 0 auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }


  `;

  private changePage(delta: number) {
    const newPage = this.currentPage + delta;
    if (newPage >= 0 && newPage < Math.ceil(this.totalItems / this.itemsPerPage)) {
      this.dispatchEvent(new CustomEvent('change-page', {
        detail: { page: newPage },
        bubbles: true,
        composed: true
      }));
    }
  }

  render() {
    const startIdx = this.currentPage * this.itemsPerPage + 1;
    const endIdx = Math.min((this.currentPage + 1) * this.itemsPerPage, this.totalItems);

    return html`
      <div class="pagination-container">
        <div class="pagination-text" title="${this.totalItems > 0 ? `${startIdx}-${endIdx}/${this.totalItems}` : (this.i18nStore?.t('pagination.zeroMessages'))}">
          ${this.totalItems > 0 ? html`${startIdx}-${endIdx}/${this.totalItems}` : (this.i18nStore?.t('pagination.zeroMessages'))}
        </div>
        <div class="pagination-controls">
          <alps-icon-btn 
            title=${this.i18nStore?.t('pagination.previousPage')} 
            ?disabled=${this.currentPage === 0} 
            @click=${() => this.changePage(-1)}
            icon="caretLeft"
            style="--icon-size: 16px;"
          ></alps-icon-btn>
          <alps-icon-btn 
            title=${this.i18nStore?.t('pagination.nextPage')} 
            ?disabled=${(this.currentPage + 1) * this.itemsPerPage >= this.totalItems || this.totalItems === 0} 
            @click=${() => this.changePage(1)}
            icon="caretRight"
            style="--icon-size: 16px;"
          ></alps-icon-btn>
        </div>
      </div>
    `;
  }
}
