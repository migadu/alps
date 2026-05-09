import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { CATEGORY_ALL_CONTACTS, CATEGORY_FAVORITES } from './constants';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { renderIcon } from '../../../frontend/src/utils/ui';
import { popupStyles } from '../../../frontend/src/components/alps-popup';

@customElement('alps-contacts-categories')
export class AlpsContactsCategories extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: Array }) contacts: any[] = [];
  @property({ type: Array }) uniqueCategories: string[] = [];
  @property({ type: String }) selectedCategory = '';
  @property({ type: String }) filterQuery = '';
  @property({ type: Boolean }) sidebarCollapsed = false;
  @property({ type: Boolean }) isSidebarHovered = false;
  @property({ type: Boolean }) suppressSidebarHover = false;
  @property({ type: Boolean }) isMobile = false;

  @state() private activeKebabMenu: string | null = null;
  @state() private sidebarScrolled = false;

  static styles = [
    popupStyles,
    css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
    .sidebar-wrapper {
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: var(--bg-secondary, #f9fafb);
    }
    .sidebar-header {
      padding: 0 12px;
      gap: 8px;
      background-color: var(--bg-secondary, #f9fafb);
      z-index: 10;
    }
    .sidebar-wrapper.collapsed .sidebar-header {
      padding: 0 14px !important;
      justify-content: flex-start;
    }
    .sidebar-wrapper.collapsed .sidebar-content {
      opacity: 0.5;
      overflow-y: hidden;
    }
    .sidebar-scroll-content {
      width: calc(max(100%, 215px));
      margin-left: calc(min(0px, (100% - 215px) * 50 / 167));
    }
    .sidebar-wrapper.collapsed .category-item {
      border-radius: 6px 0 0 6px;
    }
    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 8px;
    }
    .category-item {
      display: flex;
      align-items: center;
      position: relative;
      height: 36px;
      padding: 0 8px;
      box-sizing: border-box;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-color, #111827);
      margin-bottom: 2px;
      user-select: none;
      transition: background 0.15s;
    }
    .category-item:hover {
      background: var(--hover-color, #e5e7eb);
    }
    .category-item.active {
      background: var(--bg-selected, #eff6ff);
      color: var(--accent-hover, #2563eb);
      font-weight: 600;
    }
    .category-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .category-actions {
      display: none;
      align-items: center;
      padding-left: 8px;
      margin-left: auto;
      margin-right: -4px;
    }
    .category-item.active .category-actions {
      display: none;
    }
    .category-badge {
      background: rgba(0,0,0,0.08);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
    }
    
    .category-item.active .category-badge {
      background: rgba(255,255,255,0.2);
    }

    @media (hover: hover) {
      .category-item:hover .category-actions {
        display: flex;
      }
      .category-item.has-actions:hover .category-badge {
        display: none;
      }
    }
    .category-actions:focus-within,
    .category-actions.popup-open {
      display: flex;
    }
    .category-actions:focus-within ~ .category-badge,
    .category-actions.popup-open ~ .category-badge {
      display: none;
    }
    .category-icon {
      pointer-events: none;
      margin-right: 8px;
    }
    .kebab-btn {
      --btn-padding: 8px;
    }
  `];

  private handleSidebarScroll(e: Event) {
    const target = e.target as HTMLElement;
    const isScrolled = target.scrollTop > 0;
    if (this.sidebarScrolled !== isScrolled) {
      this.sidebarScrolled = isScrolled;
    }
  }

  render() {
    return html`
      <div class="sidebar-wrapper ${this.sidebarCollapsed && (!this.isSidebarHovered || this.suppressSidebarHover) ? 'collapsed' : ''}">
        <alps-toolbar class="sidebar-header" ?scrolled=${this.sidebarScrolled}>
          <alps-create-button 
            icon="userPlus" 
            ?collapsed=${this.sidebarCollapsed && (!this.isSidebarHovered || this.suppressSidebarHover)}
            @click=${() => this.dispatchEvent(new CustomEvent('create-contact'))}
          >${this.i18nStore?.t('contacts.addContact')}</alps-create-button>
        </alps-toolbar>
        
        <div class="sidebar-content" @scroll=${this.handleSidebarScroll}>
          <div class="sidebar-scroll-content">
            ${[CATEGORY_ALL_CONTACTS, CATEGORY_FAVORITES, ...this.uniqueCategories.filter(c => c !== CATEGORY_FAVORITES)].map(cat => {
      const count = cat === CATEGORY_ALL_CONTACTS
        ? this.contacts.length
        : this.contacts.filter(c => c.categories && c.categories.includes(cat)).length;

      const isSystem = cat === CATEGORY_ALL_CONTACTS || cat === CATEGORY_FAVORITES;

      return html`
                <div class="category-item ${cat === CATEGORY_ALL_CONTACTS ? ((!this.selectedCategory && !this.filterQuery) ? 'active' : '') : (this.selectedCategory === cat ? 'active' : '')} ${!isSystem ? 'has-actions' : ''}"
                  @click=${() => this.dispatchEvent(new CustomEvent('select-category', { detail: { category: cat } }))}
                  draggable=${!isSystem ? 'true' : 'false'}
                  @dragstart=${(e: DragEvent) => {
          if (isSystem) return;
          e.dataTransfer?.setData('text/plain', cat);
          this.dispatchEvent(new CustomEvent('drag-start', { detail: { category: cat } }));
        }}
                  @dragend=${() => {
          if (isSystem) return;
          this.dispatchEvent(new CustomEvent('drag-end'));
        }}
                >
                  <alps-icon-btn class="category-icon" icon=${cat === CATEGORY_ALL_CONTACTS ? 'users' : (cat === CATEGORY_FAVORITES ? 'starFourFill' : 'folderUser')}></alps-icon-btn>
                  <span class="category-name">${cat === CATEGORY_ALL_CONTACTS ? this.i18nStore?.t('contacts.allContacts') : (cat === CATEGORY_FAVORITES ? this.i18nStore?.t('contacts.favorites') : cat)}</span>
                  
                  ${!isSystem ? html`
                    <div class="category-actions ${this.activeKebabMenu === cat ? 'popup-open' : ''}" @click=${(e: Event) => e.stopPropagation()}>
                      <alps-popup 
                        align="right" 
                        position="bottom"
                        @popup-open=${() => { this.activeKebabMenu = cat; }}
                        @popup-close=${() => { if (this.activeKebabMenu === cat) this.activeKebabMenu = null; }}
                      >
                        <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical"></alps-icon-btn>
                        <button class="dropdown-item" @click=${(e: Event) => {
            const popup = (e.target as HTMLElement).closest('alps-popup') as any;
            if (popup) popup.close();
            this.dispatchEvent(new CustomEvent('rename-category', { detail: { category: cat } }));
          }}>
                          ${renderIcon('pen')} <span class="item-text">${this.i18nStore?.t('contacts.rename')}</span>
                        </button>
                        <button class="dropdown-item text-danger" @click=${(e: Event) => {
            const popup = (e.target as HTMLElement).closest('alps-popup') as any;
            if (popup) popup.close();
            this.dispatchEvent(new CustomEvent('delete-category', { detail: { category: cat } }));
          }}>
                          ${renderIcon('trash')} <span class="item-text">${this.i18nStore?.t('contacts.delete')}</span>
                        </button>
                      </alps-popup>
                    </div>
                  ` : ''}

                  ${(count > 0 || cat === CATEGORY_FAVORITES) ? html`<div class="category-badge">${count}</div>` : ''}
                </div>
              `;
    })}
          </div>
        </div>
      </div>
    `;
  }
}
