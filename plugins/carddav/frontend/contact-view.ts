import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { CATEGORY_FAVORITES } from './constants';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { composeContext, ComposeStore } from '../../../frontend/src/store/compose-store';
import { settingsContext, SettingsStore } from '../../../frontend/src/store/settings-store';
import { formatFullDate, renderIcon } from '../../../frontend/src/utils/ui';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-icon-btn';
import '../../../frontend/src/components/alps-input';
import '../../../frontend/src/components/alps-avatar';
import '../../../frontend/src/components/alps-toolbar';
import '../../../frontend/src/components/alps-popup';
import { popupStyles } from '../../../frontend/src/components/alps-popup';

@customElement('alps-contact-view')
export class AlpsContactView extends LitElement {
  @property({ type: Object }) contact: any = null;
  @property({ type: Boolean }) isEditing = false;
  @property({ type: Boolean }) saving = false;
  @property({ type: Array }) uniqueCategories: string[] = [];
  @property({ type: Boolean }) isMobile = false;
  @property({ type: Number }) selectedCount = 0;
  @property({ type: Boolean }) allSelectedStarred = false;

  @state() private scrolled = false;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @consume({ context: composeContext })
  composeStore!: ComposeStore;

  @consume({ context: settingsContext, subscribe: true })
  settingsStore!: SettingsStore;

  @state() private editForm: any = {};
  @state() private isDirty = false;
  @state() private newCategoryName = '';

  private handleAddCategory() {
    const name = this.newCategoryName.trim();
    if (name) {
      this.dispatchEvent(new CustomEvent('update-categories', { detail: { category: name }, bubbles: true, composed: true }));
      this.newCategoryName = '';
      const popup = this.shadowRoot?.querySelector('alps-popup') as any;
      if (popup) popup.close();
    }
  }

  static styles = [
    popupStyles,
    css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-primary, #ffffff);
    }
    
    .toolbar {
      padding: 0 16px;
      gap: 12px;
      background: var(--bg-primary, #fff);
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      z-index: 10;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .toolbar-separator {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 8px;
    }
    
    .desktop-only {
      display: block;
    }
    @media (max-width: 768px) {
      .desktop-only {
        display: none !important;
      }
    }

    .content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted, #9ca3af);
    }

    .contact-detail-header {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      text-align: center;
    }
    .contact-detail-email {
      font-size: 16px;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 24px;
    }
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
      width: 100%;
      margin: 0 auto;
    }
    .edit-textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px 12px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
    }
    .view-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 32px;
    }
    .view-name {
      font-size: 24px;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 4px;
      text-align: center;
      color: var(--text-color, #111827);
    }
    .view-organization {
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 12px;
      text-align: center;
    }
    .view-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }
    .category-pill {
      background: var(--bg-selected, #eff6ff);
      color: var(--accent-hover, #2563eb);
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .view-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
      width: 100%;
      margin: 0 auto;
    }
    .detail-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-group:not(:last-child) {
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      padding-bottom: 16px;
    }
    .group-label {
      font-size: 11px;
      font-weight: 400;
      color: var(--text-muted, #9ca3af);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .group-value {
      font-size: 15px;
      color: var(--text-color, #111827);
      word-break: break-word;
      white-space: pre-wrap;
    }
    .group-value a {
      color: var(--accent-hover, #2563eb);
      text-decoration: none;
    }
    .group-value a:hover {
      text-decoration: underline;
    }
    .view-categories alps-button {
      --btn-padding: 2px 8px;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `];

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('contact') || changedProperties.has('isEditing')) {
      if (this.contact && this.isEditing && (!this.editForm || this.editForm.path !== this.contact.path)) {
        this.editForm = { ...this.contact };
        this.isDirty = false;
        if (Array.isArray(this.editForm.categories)) {
          this.editForm.categories = this.editForm.categories.join(', ');
        }
      }
    }
  }

  private saveTimeout: any = null;

  private debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.handleSave();
    }, 500);
  }

  private handleInput(field: string, value: string) {
    this.editForm = { ...this.editForm, [field]: value };
    this.isDirty = true;
    this.debouncedSave();
  }

  private handleSave() {
    this.dispatchEvent(new CustomEvent('save', {
      detail: this.editForm,
      bubbles: true,
      composed: true
    }));
  }

  private renderDetailRow(label: string, value: string) {
    if (!value) return '';
    
    let content = html`${value}`;
    if (label === 'Email Address') {
      content = html`<a href="mailto:${value}" @click=${(e: Event) => {
        e.preventDefault();
        const formattedEmail = this.contact?.name ? `"${this.contact.name}" <${value}>` : value;
        this.composeStore?.openComposer({ to: [formattedEmail] });
      }}>${value}</a>`;
    } else if (label === 'Phone') {
      content = html`<a href="tel:${value}">${value}</a>`;
    } else if (label === 'URL') {
      const url = value.startsWith('http') ? value : `https://${value}`;
      content = html`<a href=${url} target="_blank" rel="noopener noreferrer">${value}</a>`;
    }

    return html`
      <div class="detail-group">
        <div class="group-label">${label}</div>
        <div class="group-value">${content}</div>
      </div>
    `;
  }

  private get isStarred() {
    if (this.selectedCount > 1) {
      return this.allSelectedStarred;
    }
    return this.contact?.categories?.includes(CATEGORY_FAVORITES) || false;
  }

  private get formattedBirthday() {
    if (!this.contact?.birthday) return '';
    const d = new Date(this.contact.birthday);
    if (isNaN(d.getTime())) return this.contact.birthday; // fallback if invalid like --10-31
    const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
    return formatFullDate(d, dateFormat, '24').split(' ')[0];
  }

  render() {
    if (!this.contact && !this.isEditing && this.selectedCount === 0) {
      return html`
        <div class="empty-state">${this.i18nStore?.t('contacts.selectContact')}</div>
      `;
    }

    return html`
      <alps-toolbar class="toolbar" ?scrolled=${this.scrolled}>
        ${this.isMobile ? html`
          <alps-icon-btn @click=${() => this.dispatchEvent(new CustomEvent('close'))} title="${this.i18nStore?.t('contacts.back')}" icon="arrowLeft"></alps-icon-btn>
          <div class="toolbar-separator"></div>
        ` : ''}

        <alps-icon-btn title="${this.i18nStore?.t('contacts.delete')}" @click=${() => this.dispatchEvent(new CustomEvent('delete'))} icon="trash" ?disabled=${this.contact?.isTemporary}></alps-icon-btn>
        
        <alps-popup align="right" @popup-close=${() => {}}>
          <alps-icon-btn slot="trigger" title="${this.i18nStore?.t('contacts.addToCategory')}" icon="folderOpen" ?disabled=${this.contact?.isTemporary}></alps-icon-btn>
          
          <div style="padding: 8px; display: flex; gap: 8px; cursor: default; min-width: 200px;" @click=${(e: Event) => e.stopPropagation()}>
            <input 
              type="text" 
              placeholder="${this.i18nStore?.t('contacts.newCategory') || 'New Category'}" 
              .value=${this.newCategoryName} 
              @input=${(e: any) => this.newCategoryName = e.target.value}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  this.handleAddCategory();
                }
              }}
              style="flex: 1; padding: 4px 8px; border: 1px solid var(--border-color, #e5e7eb); border-radius: 4px; font-size: 13px; outline: none; min-width: 0; background: var(--bg-primary, #ffffff); color: var(--text-primary, #111827);">
            <alps-button variant="normal" @click=${this.handleAddCategory} style="--btn-padding: 4px 12px; --btn-font-size: 13px;">${this.i18nStore?.t('contacts.add') || 'Add'}</alps-button>
          </div>
          
          ${(this.contact?.categories && this.contact.categories.length > 0) || this.uniqueCategories.length > 0 ? html`<div class="dropdown-divider"></div>` : ''}

          ${this.uniqueCategories.map(cat => {
            const isActive = this.contact?.categories?.includes(cat);
            return html`
              <button class="dropdown-item ${isActive ? 'active' : ''}" @click=${(e: Event) => {
                e.stopPropagation();
                this.dispatchEvent(new CustomEvent('update-categories', { detail: { category: cat }, bubbles: true, composed: true }));
              }}>
                ${isActive ? renderIcon('check') : html`<div style="width: 16px;"></div>`}
                <span class="item-text">${cat}</span>
              </button>
            `;
          })}

          ${this.contact?.categories && this.contact.categories.length > 0 ? html`
            ${this.uniqueCategories.length > 0 ? html`<div class="dropdown-divider"></div>` : ''}
            <button class="dropdown-item" @click=${() => {
              this.dispatchEvent(new CustomEvent('update-categories', { detail: { category: '' }, bubbles: true, composed: true }));
              const popup = this.shadowRoot?.querySelector('alps-popup') as any;
              if (popup) popup.close();
            }}>
              <span class="item-text" style="font-weight: 500;">${this.i18nStore?.t('contacts.uncategorized')}</span>
            </button>
          ` : ''}
        </alps-popup>

        <div class="toolbar-separator"></div>
        
        <alps-icon-btn 
          title="${this.i18nStore?.t('contacts.toggleStar')}" 
          @click=${() => this.dispatchEvent(new CustomEvent('toggle-star'))} 
          icon=${this.isStarred ? 'starFourFill' : 'starFour'}
          ?active=${this.isStarred}
          ?disabled=${this.contact?.isTemporary}
        ></alps-icon-btn>
        
        <div class="toolbar-spacer"></div>
        
        ${this.selectedCount > 0 ? '' : html`
          <alps-icon-btn 
            title=${this.isEditing ? this.i18nStore?.t('contacts.cancel') : this.i18nStore?.t('contacts.editContact')} 
            @click=${() => {
              if (this.isEditing) {
                if (this.saveTimeout) clearTimeout(this.saveTimeout);
                if (this.contact?.isTemporary && !this.isDirty) {
                  // Do not save, just cancel
                } else {
                  this.handleSave();
                }
                this.dispatchEvent(new CustomEvent('cancel-edit'));
              } else {
                this.dispatchEvent(new CustomEvent('edit'));
              }
            }} 
            icon="pen"
            ?active=${this.isEditing}
          ></alps-icon-btn>
        `}
      </alps-toolbar>

      <div class="content" @scroll=${(e: Event) => {
        const isScrolled = (e.target as HTMLElement).scrollTop > 0;
        if (this.scrolled !== isScrolled) {
          this.scrolled = isScrolled;
        }
      }}>
        ${this.selectedCount > 0 ? html`
          <div class="empty-state" style="flex-direction: column; gap: 16px;">
            <alps-icon-btn icon="users" style="pointer-events: none; margin-right: 8px;"></alps-icon-btn>
            <span>${this.i18nStore?.t('contacts.selectedContacts', { count: this.selectedCount })}</span>
          </div>
        ` : html`
        <div class="view-header">
          <alps-avatar .name=${this.isEditing ? this.editForm.name : this.contact?.name} .email=${this.isEditing ? this.editForm.email : this.contact?.email} .src=${this.contact?.avatar || ''} .size=${100}></alps-avatar>
        </div>

        ${this.isEditing ? html`
          <div class="edit-form">
            <alps-input 
              placeholder="${this.i18nStore?.t('contacts.name')}" 
              .value=${this.editForm.name || ''} 
              @input=${(e: any) => this.handleInput('name', e.target.value)}>
            </alps-input>
            <alps-input placeholder="${this.i18nStore?.t('contacts.nickname')}" .value=${this.editForm.nickname || ''} @input=${(e: any) => this.handleInput('nickname', e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t('contacts.organization')}" .value=${this.editForm.organization || ''} @input=${(e: any) => this.handleInput('organization', e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t('contacts.titleField')}" .value=${this.editForm.title || ''} @input=${(e: any) => this.handleInput('title', e.target.value)}></alps-input>
            <alps-input 
              placeholder="${this.i18nStore?.t('contacts.email')}" 
              type="email"
              .value=${this.editForm.email || ''} 
              @input=${(e: any) => this.handleInput('email', e.target.value)}>
            </alps-input>
            <alps-input placeholder="${this.i18nStore?.t('contacts.phone')}" .value=${this.editForm.phone || ''} @input=${(e: any) => this.handleInput('phone', e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t('contacts.address')}" .value=${this.editForm.address || ''} @input=${(e: any) => this.handleInput('address', e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t('contacts.url')}" type="url" .value=${this.editForm.url || ''} @input=${(e: any) => this.handleInput('url', e.target.value)}></alps-input>
            <alps-input placeholder="${this.i18nStore?.t('contacts.birthday')}" type="date" .value=${this.editForm.birthday || ''} @input=${(e: any) => this.handleInput('birthday', e.target.value)}></alps-input>
            <textarea class="edit-textarea" placeholder="${this.i18nStore?.t('contacts.notes')}" .value=${this.editForm.note || ''} @input=${(e: any) => this.handleInput('note', e.target.value)}></textarea>
          </div>
        ` : html`
          <div class="view-header" style="margin-top: -32px;">
            <div class="view-name">
              ${this.contact.name || 'Unnamed Contact'} ${this.contact.nickname ? `(${this.contact.nickname})` : ''}
            </div>
            ${this.contact.organization || this.contact.title ? html`
              <div class="view-organization">
                ${[this.contact.title, this.contact.organization].filter(Boolean).join(', ')}
              </div>
            ` : ''}
            ${this.contact.categories && this.contact.categories.length > 0 ? html`
              <div class="view-categories">
                ${this.contact.categories.map((cat: string) => html`<span class="category-pill">${cat}</span>`)}
              </div>
            ` : ''}
          </div>
          <div class="view-details">
            ${this.renderDetailRow(this.i18nStore?.t('contacts.email'), this.contact.email)}
            ${this.renderDetailRow(this.i18nStore?.t('contacts.phone'), this.contact.phone)}
            ${this.renderDetailRow(this.i18nStore?.t('contacts.address'), this.contact.address)}
            ${this.renderDetailRow(this.i18nStore?.t('contacts.birthday'), this.formattedBirthday)}
            ${this.renderDetailRow(this.i18nStore?.t('contacts.url'), this.contact.url)}
            ${this.renderDetailRow(this.i18nStore?.t('contacts.notes'), this.contact.note)}
          </div>
        `}
        `}
      </div>
    `;
  }
}
