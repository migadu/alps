import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { settingsContext, SettingsStore } from '../../../frontend/src/store/settings-store';
import { renderIcon, formatDateList } from '../../../frontend/src/utils/ui';
import { MessageList } from '../../../frontend/src/components/message-list';
import '../../../frontend/src/components/alps-loader';
import '../../../frontend/src/components/alps-avatar';
import '../../../frontend/src/components/alps-toolbar';
import '../../../frontend/src/components/alps-icon-btn';
import '../../../frontend/src/components/alps-banner';
import '../../../frontend/src/components/alps-button';

@customElement('alps-contacts-list')
export class AlpsContactsList extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @property({ type: Array }) contacts: any[] = [];
  @property({ type: String }) selectedCategory = '';
  @property({ type: String }) filterQuery = '';
  @property({ type: String }) sortOrder: 'asc' | 'desc' = 'asc';
  @property({ type: Boolean }) showOnlyStarred = false;
  @property({ type: Boolean }) isMobile = false;
  @property({ type: String }) densityMode: 'loose' | 'normal' | 'compact' | 'ultra-compact' = 'compact';
  @property({ type: Object }) selectedContacts = new Set<string>();
  @property({ type: Object }) selectedContact: any = null;
  @property({ type: Boolean }) isSpinning = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) listScrolled = false;

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    if (changedProperties.has('densityMode')) {
      this.classList.remove('density-loose', 'density-normal', 'density-compact', 'density-ultra-compact');
      this.classList.add(`density-${this.densityMode}`);
    }
  }

  static styles = [
    MessageList.styles,
    css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      height: 100%;
    }
    .list-header {
      padding: 0 12px;
      gap: 12px;
      background: var(--bg-primary, #fff);
      z-index: 10;
      min-height: 48px;
    }
    .header-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 4px;
    }
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted, #9ca3af);
    }
    .contact-item {
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: background 0.15s, padding 0.2s, gap 0.2s;
    }
    :host(.density-loose) .contact-item {
      padding: 16px 12px 16px 0;
      gap: 16px;
    }
    :host(.density-compact) .contact-item {
      padding: 8px 12px 8px 0;
      gap: 12px;
    }
    :host(.density-ultra-compact) .contact-item {
      padding: 4px 12px 4px 0;
      gap: 12px;
    }
    @media (max-width: 768px) {
      :host(.density-ultra-compact) .contact-item,
      :host(.density-compact) .contact-item {
        padding: 12px;
      }
      :host(.density-loose) .contact-item {
        padding: 16px 12px;
      }
    }
    .contact-item:hover {
      background: var(--hover-color);
    }
    .contact-item.active {
      background: var(--bg-selected);
    }
    .contact-item.starred .contact-sender,
    .contact-item.starred .contact-subject {
      color: var(--accent-color);
      font-weight: 600;
    }
    .contact-item.active .avatar-wrapper {
      border-color: var(--bg-selected);
      background: var(--bg-selected);
    }
    .contact-item:hover .avatar-wrapper {
      border-color: var(--hover-color);
      background: var(--hover-color);
    }
    .contact-checkbox {
      cursor: pointer;
      opacity: 0.4;
      transition: opacity 0.2s;
    }
    .contact-item:hover .contact-checkbox,
    .contact-checkbox:checked {
      opacity: 1;
    }
    .contact-details {
      flex: 1;
      min-width: 0;
    }
    .contact-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    :host(.density-compact) .contact-header-row {
      margin-bottom: 2px;
    }
    .contact-header-inner {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
      margin-right: 12px;
    }
    .contact-sender {
      font-weight: 450;
      color: var(--text-sender-read, #202020);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    :host(.density-ultra-compact) .contact-sender {
      width: 120px;
      flex-shrink: 1;
      min-width: 80px;
    }
    @media (max-width: 768px) {
      :host(.density-ultra-compact) .contact-sender {
        width: 80px;
        min-width: 60px;
      }
    }
    .contact-date {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      margin-left: 8px;
      text-align: right;
      flex-shrink: 0;
    }
    .contact-item.active .contact-date {
      color: var(--text-muted);
    }
    .contact-subject-row {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      overflow: hidden;
    }
    .contact-subject {
      font-size: 14px;
      margin-bottom: 0;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host(.density-compact) .contact-subject {
      font-size: 13px;
      margin-bottom: 2px;
    }
    :host(.density-ultra-compact) .contact-subject {
      font-size: 13px;
      flex: 1;
      margin: 0;
    }
  `];

  private formatRevision(rev: string): string {
    if (!rev) return '';
    let d = rev;
    if (d.length === 16 && d.indexOf('-') === -1) {
      d = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:${d.slice(13, 16)}`;
    }
    const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
    const hourFormat = String(this.settingsStore?.getState()?.hourFormat || '12');
    return formatDateList(new Date(d), dateFormat, hourFormat);
  }

  private handleListScroll(e: Event) {
    const target = e.target as HTMLElement;
    const isScrolled = target.scrollTop > 0;
    if (this.listScrolled !== isScrolled) {
      this.listScrolled = isScrolled;
      this.dispatchEvent(new CustomEvent('list-scrolled', { detail: { scrolled: isScrolled } }));
    }
  }

  render() {
    return html`
      ${!this.isMobile ? html`
        <alps-toolbar class="list-header" ?scrolled=${this.listScrolled}>
          <input type="checkbox" class="select-all-checkbox" title=${this.i18nStore?.t('messageList.selectAll')}
            .checked=${this.contacts.length > 0 && this.selectedContacts.size === this.contacts.length}
            @change=${(e: Event) => this.dispatchEvent(new CustomEvent('select-all', { detail: { checked: (e.target as HTMLInputElement).checked } }))}>
          <alps-icon-btn 
            title="${this.i18nStore?.t('contacts.refreshContacts')}"
            @click=${() => this.dispatchEvent(new CustomEvent('refresh'))}
            @animationiteration=${() => this.dispatchEvent(new CustomEvent('spin-iteration'))}
            ?spinning=${this.isSpinning}
            icon="arrowsClockwise"
          ></alps-icon-btn>
          <div class="header-divider"></div>
          <alps-icon-btn 
            title=${this.sortOrder === 'asc' ? this.i18nStore?.t('contacts.sortZa') : this.i18nStore?.t('contacts.sortAz')}
            @click=${() => this.dispatchEvent(new CustomEvent('sort-toggle'))} 
            icon=${this.sortOrder === 'asc' ? 'sortAscending' : 'sortDescending'}
          ></alps-icon-btn>
          <alps-icon-btn 
            @click=${() => this.dispatchEvent(new CustomEvent('filter-star-toggle'))} 
            title="${this.i18nStore?.t('contacts.filterStarred')}"
            icon=${this.showOnlyStarred ? 'starFourFill' : 'starFour'}
            ?active=${this.showOnlyStarred}
          ></alps-icon-btn>
        </alps-toolbar>
      ` : ''}
      
      <div @scroll=${this.handleListScroll} style="flex: 1; overflow-y: auto; transition: opacity 0.2s ease-in-out; opacity: ${this.loading && this.contacts.length > 0 ? 0.5 : 1}; pointer-events: ${this.loading ? 'none' : 'auto'};">
        ${this.loading && this.contacts.length === 0
          ? html`<alps-loader full-height .text=${this.i18nStore?.t('messageList.loading')}></alps-loader>`
          : (() => {
            let filteredContacts = this.contacts.filter(c => {
              if (this.selectedCategory) {
                if (!c.categories || !c.categories.includes(this.selectedCategory)) return false;
              }
              if (this.showOnlyStarred) {
                if (!c.categories || !c.categories.includes('Favorites')) return false;
              }
              if (this.filterQuery) {
                const query = this.filterQuery.toLowerCase();
                if (!(c.name || '').toLowerCase().includes(query) &&
                  !(c.email || '').toLowerCase().includes(query) &&
                  !(c.nickname || '').toLowerCase().includes(query) &&
                  !(c.organization || '').toLowerCase().includes(query)) {
                  return false;
                }
              }
              return true;
            });

            filteredContacts.sort((a, b) => {
              const nameA = (a.name || a.email || '').toLowerCase();
              const nameB = (b.name || b.email || '').toLowerCase();
              if (nameA < nameB) return this.sortOrder === 'asc' ? -1 : 1;
              if (nameA > nameB) return this.sortOrder === 'asc' ? 1 : -1;
              return 0;
            });

            return html`
              ${this.filterQuery ? html`
                <alps-banner>
                  <span>${this.i18nStore?.t('messageList.searchResultsFor')} <strong>${this.filterQuery}</strong></span>
                  <alps-button slot="action" variant="normal" @click=${() => this.dispatchEvent(new CustomEvent('clear-search'))}>
                    ${this.i18nStore?.t('messageList.clearSearch')}
                  </alps-button>
                </alps-banner>
              ` : ''}
              
              ${filteredContacts.length === 0
                ? html`<div class="empty-state">${this.i18nStore?.t('contacts.noContacts')}</div>`
                : filteredContacts.map(c => html`
                  <div class="contact-item ${this.selectedContact?.path === c.path || (c.isTemporary && this.selectedContact?.isTemporary) ? 'active' : ''} ${this.selectedContacts.has(c.path) ? 'selected' : ''}" @click=${() => this.dispatchEvent(new CustomEvent('select-contact', { detail: { contact: c } }))}>
                    ${!this.isMobile ? html`
                      <div class="checkbox-col" @click=${(e: Event) => {
                        if (c.isTemporary) { e.stopPropagation(); return; }
                        this.dispatchEvent(new CustomEvent('toggle-selection', { detail: { path: c.path, event: e } }));
                      }}>
                        <input type="checkbox" class="contact-checkbox" 
                          ?disabled=${c.isTemporary}
                          .checked=${this.selectedContacts.has(c.path)}
                          @click=${(e: Event) => e.stopPropagation()}
                          @change=${(e: Event) => this.dispatchEvent(new CustomEvent('toggle-selection', { detail: { path: c.path, event: e } }))}>
                      </div>
                    ` : ''}
                    <div class="avatar-stack">
                      <div class="avatar-wrapper">
                        <alps-avatar .name=${c.name || c.email || 'Unknown'} .email=${c.email} .src=${c.avatar || ''} .size=${this.densityMode === 'loose' ? 48 : this.densityMode === 'compact' ? 24 : 40}></alps-avatar>
                      </div>
                    </div>
                    <div class="contact-details">
                      <div class="contact-header-row">
                        <div class="contact-header-inner">
                          <div class="contact-sender">${c.name || c.email || this.i18nStore?.t('contacts.unnamedContact')}</div>
                          <div @click=${(e: Event) => { e.stopPropagation(); this.dispatchEvent(new CustomEvent('toggle-star', { detail: { contact: c } })); }} class="star-btn ${c.categories?.includes('Favorites') ? 'starred' : ''}" style="${c.isTemporary ? 'opacity: 0.5; pointer-events: none;' : ''}">
                            ${renderIcon(c.categories?.includes('Favorites') ? 'starFourFill' : 'starFour')}
                          </div>
                        </div>
                        ${c.revision ? html`<div class="contact-date">${this.formatRevision(c.revision)}</div>` : ''}
                      </div>
                      <div class="contact-subject-row">
                        <div class="contact-subject">
                          ${this.densityMode !== 'ultra-compact' ? (c.email || '') : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                `)}
            `;
          })()
        }
      </div>
    `;
  }
}
