import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon } from '../utils/ui';
import './alps-popup';

@customElement('alps-folder-selector-popup')
export class AlpsFolderSelectorPopup extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: Array }) mailboxes: any[] = [];
  @property({ type: String }) currentMailbox = '';
  @property({ type: Boolean }) noActionBox = false;
  @property({ type: Boolean }) noSearchBox = false;

  @state() private filterQuery = '';
  @state() private isMove = true;

  @query('alps-popup') popup!: any;
  @query('input') filterInput!: HTMLInputElement;

  static styles = css`
    :host {
      display: inline-block;
    }

    alps-popup {
      display: block;
      width: 100%;
    }

    .selector-container {
      display: flex;
      flex-direction: column;
      width: 240px;
    }

    .search-box {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .action-box {
      padding: 10px 12px 6px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      background-color: var(--bg-secondary, #f9fafb);
      display: flex;
      flex-direction: row;
      gap: 16px;
      margin-top: -4px; /* offset popup padding at top */
      border-radius: 6px 6px 0 0;
    }

    .action-box label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary, #111827);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
    }

    .search-input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--accent-color, #005A9E);
    }

    .folder-list {
      max-height: 250px;
      overflow-y: auto;
      padding: 4px 0 0 0;
      margin-bottom: -4px; /* offset the bottom padding of the popup */
    }

    .folder-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: 36px;
      padding: 0 12px;
      box-sizing: border-box;
      font-size: 13px;
      color: var(--text-primary, #111827);
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background-color 0.2s;
    }

    .folder-item:hover {
      background-color: var(--hover-color, #f3f4f6);
    }

    .folder-item svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
      color: var(--text-secondary, #4b5563);
      flex-shrink: 0;
    }

    .folder-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .no-results {
      padding: 12px;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted, #6b7280);
      font-style: italic;
    }

    input[type="radio"] {
      cursor: pointer;
      margin: 0;
    }
  `;

  private _handleFilter(e: Event) {
    const target = e.target as HTMLInputElement;
    this.filterQuery = target.value.toLowerCase();
  }

  private _handleSelect(folderName: string) {
    if (this.popup) this.popup.close();
    this.dispatchEvent(new CustomEvent('folder-selected', {
      detail: { folderName, isMove: this.isMove },
      bubbles: true,
      composed: true
    }));
  }

  private _handlePopupToggle() {
    this.filterQuery = '';
    // Focus the input when popup opens
    // Using setTimeout to allow the popup to render first
    setTimeout(() => {
      if (this.filterInput) {
        this.filterInput.focus();
      }
    }, 50);
  }

  render() {
    const filteredFolders = this.mailboxes
      .map(mb => mb.Name || mb.Mailbox || '')
      .filter(name => name !== '' && name !== this.currentMailbox)
      .filter(name => name.toLowerCase().includes(this.filterQuery));

    return html`
      <alps-popup align="right" @click=${this._handlePopupToggle}>
        <slot name="trigger" slot="trigger"></slot>
        
        <div class="selector-container" @click=${(e: Event) => e.stopPropagation()}>
          ${this.noActionBox ? '' : html`
          <div class="action-box">
            <label>
              <input 
                type="radio" 
                name="folderAction"
                .checked=${this.isMove}
                @change=${() => this.isMove = true}
              />
              ${this.i18nStore?.t('folderSelector.actionMove')}
            </label>
            <label>
              <input 
                type="radio" 
                name="folderAction"
                .checked=${!this.isMove}
                @change=${() => this.isMove = false}
              />
              ${this.i18nStore?.t('folderSelector.actionCopy')}
            </label>
          </div>
          `}
          
          ${this.noSearchBox ? '' : html`
            <div class="search-box">
              <input 
                type="text" 
                class="search-input" 
                placeholder=${this.i18nStore?.t('folderSelector.filter')}
                .value=${this.filterQuery}
                @input=${this._handleFilter}
              />
            </div>
          `}
          
          <div class="folder-list">
            ${filteredFolders.length > 0 ? filteredFolders.map(folderName => html`
              <button class="folder-item" @click=${() => this._handleSelect(folderName)}>
                ${renderIcon('folder')}
                <span class="folder-name">${folderName}</span>
              </button>
            `) : html`
              <div class="no-results">${this.i18nStore?.t('folderSelector.noResults')}</div>
            `}
          </div>
        </div>
      </alps-popup>
    `;
  }
}
