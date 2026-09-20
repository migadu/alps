import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import './alps-icon-btn';

@customElement('alps-pagination')
export class AlpsPagination extends LitElement {
  @property({ type: Number }) currentPage = 0;
  /** Rows in the whole result set. 0 means nobody counted, and the range is
   * then shown without an "of N" — see rangeText. With threading on this
   * counts CONVERSATIONS, because that is what the server pages and what the
   * list draws; the units on both sides of the "of" are the same. */
  @property({ type: Number }) totalItems = 0;
  @property({ type: Number }) itemsPerPage = 50;
  /**
   * Rows this page actually returned.
   *
   * The end of the range used to be `(currentPage + 1) * itemsPerPage`, an
   * assumed page length. A page comes up short for reasons other than being
   * the last one — a thread group whose representative the FETCH did not
   * return is dropped — and every such page then numbered itself as if the
   * rows were there. Counting what is on screen cannot overstate it.
   */
  @property({ type: Number }) currentCount = 0;
  /**
   * The list is showing SEARCH RESULTS rather than a folder.
   *
   * It changes one word and it is not cosmetic. A folder's single page reads
   * "{n} total", which is a claim about the folder; a search's single page is
   * simply exhausted, so the same shape must read "{n} results" — a claim
   * about the query.
   */
  @property({ type: Boolean }) isSearch = false;

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
    /* Sized by its content and pushed to the end of the toolbar, rather than
       stretched across whatever room is left. Stretched, the count sat in the
       middle of that space (margin: 0 auto) with the arrows far off at the
       right edge, so the two halves of one control read as unrelated. */
    :host {
      display: inline-flex;
      align-items: center;
      margin-left: auto;
      flex-shrink: 0;
    }

    .pagination-container {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-muted);
      user-select: none;
    }

    .pagination-controls {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .pagination-text {
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
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

  /** A count nobody supplied. 0 is treated as absent: every caller without a
   * total has been passing 0, and "of 0" under rows on screen is a lie. */
  private get knownTotal(): number | undefined {
    return this.totalItems > 0 ? this.totalItems : undefined;
  }

  private get hasPrev(): boolean {
    return this.currentPage > 0;
  }

  private get hasNext(): boolean {
    const total = this.knownTotal;
    if (total === undefined) return false;
    return (this.currentPage + 1) * this.itemsPerPage < total;
  }

  /** What the text says, which is three different claims wearing one shape. */
  private get rangeText(): string {
    const rows = this.currentCount > 0 ? this.currentCount : 0;
    if (rows === 0) {
      return this.i18nStore?.t('pagination.zeroMessages') || '0 messages';
    }
    if (!this.hasPrev && !this.hasNext) {
      // One page, and there is no next: the rows on screen ARE the result set,
      // so a search can state its own count exactly and needs no total from
      // anywhere. A folder still prefers its counter, which spans every page
      // it would have had.
      const total = this.isSearch ? rows : (this.knownTotal ?? rows);
      const key = this.isSearch ? 'pagination.searchResults' : 'pagination.totalCount';
      const fallback = this.isSearch ? '{total} results' : '{total} total';
      return (this.i18nStore?.t(key) || fallback).replace('{total}', String(total));
    }
    const start = this.currentPage * this.itemsPerPage + 1;
    const end = start + rows - 1;
    const total = this.knownTotal;
    if (total !== undefined) {
      return (this.i18nStore?.t('pagination.rangeOfTotal') || '{start}\u2013{end} of {total}')
        .replace('{start}', String(start))
        .replace('{end}', String(end))
        .replace('{total}', String(total));
    }
    // No total to show. A bare range is the honest shape — it says where you
    // are without claiming how far it goes.
    return `${start}\u2013${end}`;
  }

  render() {
    const text = this.rangeText;

    return html`
      <div class="pagination-container">
        <div class="pagination-text" title="${text}">${text}</div>
        <div class="pagination-controls">
          <alps-icon-btn 
            title=${this.i18nStore?.t('pagination.previousPage')} 
            ?disabled=${!this.hasPrev} 
            @click=${() => this.changePage(-1)}
            icon="caretLeft"
            style="--icon-size: 16px;"
          ></alps-icon-btn>
          <alps-icon-btn 
            title=${this.i18nStore?.t('pagination.nextPage')} 
            ?disabled=${!this.hasNext} 
            @click=${() => this.changePage(1)}
            icon="caretRight"
            style="--icon-size: 16px;"
          ></alps-icon-btn>
        </div>
      </div>
    `;
  }
}
