import { html, css, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { CATEGORY_ALL_CONTACTS, CATEGORY_FAVORITES } from './constants';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { renderIcon } from '../../../frontend/src/utils/ui';
import { popupStyles } from '../../../frontend/src/components/alps-popup';
import { sidebarLayoutStyles } from '../../../frontend/src/components/alps-sidebar';
import '../../../frontend/src/components/alps-sidebar-strip';

@customElement('alps-contacts-categories')
export class AlpsContactsCategories extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: Array }) contacts: any[] = [];
  @property({ type: Array }) uniqueCategories: string[] = [];
  @property({ type: String }) selectedCategory = '';
  @property({ type: String }) filterQuery = '';

  @state() private activeKebabMenu: string | null = null;
  @state() private sidebarScrolled = false;

  static styles = [
    popupStyles,
    sidebarLayoutStyles,
    css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
      box-sizing: border-box;
      /* The collapsed strip's slide (sidebarLayoutStyles): a category's icon
         sits 22px in, after the content's 8px padding, the row's 8px and the
         icon's own 6px, so it slides 14px to stand 8px inside the strip. */
      --strip-slide: 14px;
    }
    .sidebar-wrapper {
      background-color: var(--bg-secondary, #f9fafb);
    }
    .sidebar-header {
      background-color: var(--bg-secondary, #f9fafb);
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
      color: var(--text-primary);
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
    /* A touch screen has no hover, and a tap leaves no :focus-visible, so
       neither the rule above nor the keyboard's below ever showed a menu
       there, and a category could not be renamed or deleted. The selected
       category shows its menu, as the folder list's open folder does on a
       phone: a tap selects the category, a second opens its menu. */
    @media (hover: none) {
      .category-item.active .category-actions {
        display: flex;
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
    /* The menu is shown while the keyboard is in its row, so that Tab
       reaches it from the category's button: a button inside display: none
       is no Tab stop, and so it could never take the focus that shows it.
       Not while a click has put the focus on the button: a click leaves the
       row as it was. */
    .category-item:focus-within:not(:has(.category-control:focus:not(:focus-visible))) .category-actions {
      display: flex;
    }
    .category-item.has-actions:focus-within:not(:has(.category-control:focus:not(:focus-visible))) .category-badge {
      display: none;
    }
    /* The part of the row that is its button: the icon and the name. The
       row's menu and count sit beside it, not in it. */
    .category-control {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      border-radius: 4px;
    }
    /* Drawn as alps-icon-btn draws its icon, without the button. */
    .category-icon {
      display: flex;
      padding: 6px;
      margin-right: 8px;
      color: var(--text-muted);
    }
    .category-icon .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
  `];

  private selectCategory(category: string) {
    this.dispatchEvent(new CustomEvent('select-category', { detail: { category } }));
  }

  /** The category's button answers Enter and Space, as a <button> does. */
  private handleControlKeyDown(e: KeyboardEvent, category: string) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    this.selectCategory(category);
  }

  private handleSidebarScroll(e: Event) {
    const target = e.target as HTMLElement;
    const isScrolled = target.scrollTop > 0;
    if (this.sidebarScrolled !== isScrolled) {
      this.sidebarScrolled = isScrolled;
    }
  }

  render() {
    return html`
      <!-- Frame and content follow the strip state alps-sidebar provides:
           collapsed, they keep every category, dimmed, inert and behind the
           main view. Create, above, stays live. -->
      <alps-sidebar-frame class="sidebar-wrapper">
        <alps-toolbar class="sidebar-header" ?scrolled=${this.sidebarScrolled}>
          <alps-create-button 
            icon="userPlus" 
            @click=${() => this.dispatchEvent(new CustomEvent('create-contact'))}
          >${this.i18nStore?.t('contacts.addContact')}</alps-create-button>
        </alps-toolbar>
        
        <alps-sidebar-content class="sidebar-content" @scroll=${this.handleSidebarScroll}>
          <div class="sidebar-scroll-content">
            ${[CATEGORY_ALL_CONTACTS, CATEGORY_FAVORITES, ...this.uniqueCategories.filter(c => c !== CATEGORY_FAVORITES)].map((cat, index) => {
      const count = cat === CATEGORY_ALL_CONTACTS
        ? this.contacts.length
        : this.contacts.filter(c => c.categories && c.categories.includes(cat)).length;

      const isSystem = cat === CATEGORY_ALL_CONTACTS || cat === CATEGORY_FAVORITES;
      const name = cat === CATEGORY_ALL_CONTACTS ? this.i18nStore?.t('contacts.allContacts') : (cat === CATEGORY_FAVORITES ? this.i18nStore?.t('contacts.favorites') : cat);
      const isActive = cat === CATEGORY_ALL_CONTACTS ? (!this.selectedCategory && !this.filterQuery) : this.selectedCategory === cat;
      const hasBadge = count > 0 || cat === CATEGORY_FAVORITES;
      const badgeId = `category-count-${index}`;

      return html`
                <div class="category-item ${isActive ? 'active' : ''} ${!isSystem ? 'has-actions' : ''}"
                  @click=${() => this.selectCategory(cat)}
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
                  <!--
                    The category's button: one Tab stop, named by the category,
                    with its count as the description. Not the whole row, which
                    also holds the category's menu, and a button may not contain
                    other controls. Its icon is decoration.
                  -->
                  <span class="category-control"
                    role="button"
                    tabindex="0"
                    aria-label=${name ?? cat}
                    aria-current=${isActive ? 'true' : nothing}
                    aria-describedby=${hasBadge ? badgeId : nothing}
                    @keydown=${(e: KeyboardEvent) => this.handleControlKeyDown(e, cat)}
                  >
                    <span class="category-icon">${renderIcon(cat === CATEGORY_ALL_CONTACTS ? 'users' : (cat === CATEGORY_FAVORITES ? 'starFourFill' : 'folderUser'))}</span>
                    <span class="category-name">${name}</span>
                  </span>
                  
                  ${!isSystem ? html`
                    <div class="category-actions ${this.activeKebabMenu === cat ? 'popup-open' : ''}" @click=${(e: Event) => e.stopPropagation()}>
                      <alps-popup 
                        align="right" 
                        position="bottom"
                        @popup-open=${() => { this.activeKebabMenu = cat; }}
                        @popup-close=${() => { if (this.activeKebabMenu === cat) this.activeKebabMenu = null; }}
                      >
                        <alps-icon-btn slot="trigger" class="kebab-btn" icon="dotsThreeCircleVertical" title=${this.i18nStore?.t('general.moreOptions')}></alps-icon-btn>
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

                  ${hasBadge ? html`<div class="category-badge" id=${badgeId}>${count}</div>` : ''}
                </div>
              `;
    })}
          </div>
        </alps-sidebar-content>
      </alps-sidebar-frame>
    `;
  }
}
