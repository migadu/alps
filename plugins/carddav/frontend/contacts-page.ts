import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { CATEGORY_ALL_CONTACTS, CATEGORY_FAVORITES } from './constants';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { settingsContext, SettingsStore } from '../../../frontend/src/store/settings-store';
import '../../../frontend/src/components/app-header';
import '../../../frontend/src/components/alps-input';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-avatar';
import '../../../frontend/src/components/alps-sidebar';
import '../../../frontend/src/components/alps-icon-btn';
import '../../../frontend/src/components/ui-prompt';
import '../../../frontend/src/components/alps-initial-loader';
import '../../../frontend/src/components/alps-popup';
import '../../../frontend/src/components/alps-create-button';
import './contacts-categories';
import './contacts-list';
import { popupStyles } from '../../../frontend/src/components/alps-popup';
import { MailboxPage } from '../../../frontend/src/pages/mailbox-page';
import { MessageList } from '../../../frontend/src/components/message-list';
import { contactsService } from './contacts-service';

@customElement('contacts-page')
export class ContactsPage extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @state() private contacts: any[] = [];
  @state() private sortOrder: 'asc' | 'desc' = 'asc';
  @state() private showOnlyStarred = false;
  @state() private loading = true;
  @state() private isSpinning = false;
  @state() private showInitialLoader = !(window as any).alpsAppLoaded;
  @state() private selectedContact: any = null;
  @state() private filterQuery = '';

  @state() private isEditing = false;
  @state() private saving = false;
  @state() private selectedCategory = '';
  @state() private showCreatePrompt = false;
  @state() private showDeleteConfirm = false;
  @state() private addedCategories: string[] = [];
  @state() private sidebarWidth = 250;
  @state() private listWidth = 380;
  @state() private sidebarCollapsed = false;
  @state() private isSidebarHovered = false;
  @state() private isMobile = window.innerWidth <= 768;
  @state() private mobileSidebarOpen = false;
  private hoverTimeout: any = null;
  @state() private suppressSidebarHover = false;
  @state() private isSidebarDragging = false;
  @state() private isPaneDragging = false;
  @state() private densityMode: 'loose' | 'normal' | 'compact' | 'ultra-compact' = 'compact';
  @state() private selectedContacts = new Set<string>();
  @state() private listScrolled = false;
  @state() private categoryToRename: string | null = null;
  @state() private categoryToDelete: string | null = null;
  
  private syncIntervalTimer: ReturnType<typeof setInterval> | null = null;

  static styles = [
    MailboxPage.styles,
    MessageList.styles,
    popupStyles,
    css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary, #ffffff);
      color: var(--text-primary);
      overflow: hidden;
    }
    .folder-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .contact-list-pane {
      background: var(--bg-primary, #ffffff);
      display: flex;
      flex-direction: column;
      position: relative;
      border-right: 1px solid var(--border-color, #e5e7eb);
    }
    .resizer {
      background: transparent;
      position: relative;
      z-index: 25;
      flex-shrink: 0;
      width: 4px;
      margin: 0 -2px;
      cursor: col-resize;
    }
    .resizer::after {
      content: '';
      position: absolute;
      background: transparent;
      transition: background 0.2s;
      width: 3px;
      top: 0;
      bottom: 0;
      left: 1px;
    }
    .resizer:hover, .resizer.dragging {
      z-index: 9999;
    }
    .resizer:hover::after, .resizer.dragging::after {
      background: var(--accent-color, #005A9E);
      width: 3px;
      left: 0;
    }
    .app-container.collapsed .contact-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
      z-index: 25;
      border-left: 1px solid var(--border-color, #e5e7eb);
    }
    .contact-reader-pane {
      background: var(--bg-primary, #ffffff);
      padding: 0;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .contact-reader-pane alps-contact-view {
      flex: 1;
      width: 100%;
    }
    
    .app-container.mobile-view.reading .contact-list-pane {
      display: none !important;
    }
    .app-container.mobile-view:not(.reading) .contact-reader-pane {
      display: none !important;
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
      margin-bottom: 8px;
    }
    .contact-detail-email {
      font-size: 16px;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 24px;
    }
    .contact-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 400px;
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
    .contact-details-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .detail-value {
      font-size: 14px;
      color: var(--text-primary);
      white-space: pre-wrap;
    }

  `];

  private _handleSettingsChange = () => {
    if (this.settingsStore) {
      const state = this.settingsStore.getState();
      this.sidebarCollapsed = state.sidebarCollapsed;
      this.densityMode = state.densityMode || 'compact';

      // Manage background sync interval based on checkMailInterval (in minutes)
      if (this.syncIntervalTimer) {
        clearInterval(this.syncIntervalTimer);
        this.syncIntervalTimer = null;
      }
      if (state.checkMailInterval && state.checkMailInterval > 0) {
        const ms = state.checkMailInterval * 60 * 1000;
        this.syncIntervalTimer = setInterval(() => {
          this.fetchContacts();
        }, ms);
      }
    }
  };

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    if (changedProperties.has('densityMode')) {
      const mode = this.settingsStore?.getState().densityMode || 'normal';
      this.dataset.density = mode;

      const messageListPane = this.shadowRoot?.querySelector('.contact-list-pane');
      if (messageListPane) {
        messageListPane.classList.remove('density-loose', 'density-normal', 'density-compact', 'density-ultra-compact');
        messageListPane.classList.add(`density-${mode}`);
      }
    }

    if (changedProperties.has('loading') && this.loading) {
      this.isSpinning = true;
    }
  }

  private handleSpinIteration() {
    if (!this.loading) {
      this.isSpinning = false;
    }
  }

  private _handleWindowResize = () => {
    this.isMobile = window.innerWidth <= 768;
  };

  connectedCallback() {
    super.connectedCallback();
    this.showInitialLoader = !(window as any).alpsAppLoaded;
    this.classList.add('density-compact');
    const savedCats = localStorage.getItem('contacts_categories_cache');
    if (savedCats) {
      try {
        this.addedCategories = JSON.parse(savedCats);
      } catch (e) {
        // ignore
      }
    }
    this.fetchContacts();
    window.addEventListener('resize', this._handleWindowResize);
    window.addEventListener('hashchange', this._handleHashChange);
    if (this.settingsStore) {
      this.settingsStore.addEventListener('change', this._handleSettingsChange);
      this._handleSettingsChange();
    }

    // Initial hash check
    setTimeout(() => this._handleHashChange(), 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._handleWindowResize);
    window.removeEventListener('hashchange', this._handleHashChange);
    if (this.settingsStore) {
      this.settingsStore.removeEventListener('change', this._handleSettingsChange);
    }
    if (this.syncIntervalTimer) {
      clearInterval(this.syncIntervalTimer);
      this.syncIntervalTimer = null;
    }
  }

  private _handleHashChange = () => {
    // Remove any existing temporary contacts
    this.contacts = this.contacts.filter((c: any) => !c.isTemporary);

    const hash = window.location.hash;
    const match = hash.match(/^#\/contacts\/?([^\/]*)\/?(.*)$/);
    if (match) {
      const catParam = match[1] ? decodeURIComponent(match[1]) : '';
      const uidParam = match[2] ? decodeURIComponent(match[2]) : '';

      const newCategory = catParam === 'all' || !catParam ? '' : catParam;
      if (this.selectedCategory !== newCategory) {
        this.selectedCategory = newCategory;
        this.selectedContacts = new Set();
        if (this.isMobile) {
          this.mobileSidebarOpen = false;
        }
      }

      if (uidParam) {
        const currentCleanUid = this.selectedContact?.uid?.replace(/^urn:uuid:/, '') || this.selectedContact?.path;
        if (currentCleanUid !== uidParam) {
          if (this.contacts.length === 0) {
            return; // Will be handled by fetchContacts once loaded
          }
          const contact = this.contacts.find((c: any) => {
            const cleanUid = c.uid?.replace(/^urn:uuid:/, '') || c.path;
            return cleanUid === uidParam;
          });
          if (contact) {
            this.selectContact(contact, false);
          }
        }
      } else {
        this.selectedContact = null;
        this.isEditing = false;
      }
    } else {
      this.selectedContact = null;
      this.isEditing = false;
    }
  };

  get uniqueCategories() {
    const cats = new Set<string>(this.addedCategories);
    for (const c of this.contacts) {
      if (c.categories) {
        for (const cat of c.categories) {
          cats.add(cat);
        }
      }
    }
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }

  get username() {
    return this.settingsStore?.getState().loginUsername || '';
  }

  async fetchContacts() {
    this.loading = true;
    try {
      const data = await contactsService.fetchContacts(this.filterQuery);

      this.contacts = data.contacts || [];
      this._handleHashChange(); // Trigger selection if a deep link was used
    } catch (e) {
      console.error('Failed to fetch contacts', e);
    } finally {
      this.loading = false;
      if (this.showInitialLoader) {
        setTimeout(() => {
          this.showInitialLoader = false;
          (window as any).alpsAppLoaded = true;
        }, 100);
      }
    }
  }

  async selectContact(contact: any, updateHash: boolean = true) {
    if (contact.isTemporary) {
      this.selectedContact = contact;
      this.isEditing = true;
      return;
    }

    if (updateHash) {
      const catUrl = this.selectedCategory ? encodeURIComponent(this.selectedCategory) : 'all';
      const cleanUid = contact.uid?.replace(/^urn:uuid:/, '') || contact.path;
      window.location.hash = `/contacts/${catUrl}/${encodeURIComponent(cleanUid)}`;
      return;
    }
    if (this.selectedContacts.size > 0) {
      this.selectedContacts = new Set();
    }
    if (this.selectedContact?.path === contact.path) return;

    // Set immediately for instant UI feedback (prevents flashing)
    this.selectedContact = { ...contact };
    this.isEditing = false;
    try {
      const data = await contactsService.fetchContact(contact.path!);
      // Only update if the user hasn't selected another contact in the meantime
      if (this.selectedContact?.path === data.path) {
        this.selectedContact = data;
      }
    } catch (e) {
      console.error('Failed to fetch contact details', e);
    }
  }

  private get allSelectedStarred() {
    if (this.selectedContacts.size === 0) return false;
    for (const path of this.selectedContacts) {
      const contact = this.contacts.find((c: any) => c.path === path);
      if (!contact || !contact.categories?.includes(CATEGORY_FAVORITES)) {
        return false;
      }
    }
    return true;
  }

  async handleToggleStar(e: Event, contact: any) {
    e.stopPropagation();
    if (contact.isTemporary) return;

    let categories = contact.categories ? [...contact.categories] : [];
    const isStarred = categories.includes(CATEGORY_FAVORITES);

    if (isStarred) {
      categories = categories.filter((c: string) => c !== CATEGORY_FAVORITES);
    } else {
      categories.push(CATEGORY_FAVORITES);
    }

    // Optimistic UI update
    this.contacts = this.contacts.map((c: any) => c.path === contact.path ? { ...c, categories } : c);

    try {
      const payload = {
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        organization: contact.organization || '',
        address: contact.address || '',
        birthday: contact.birthday || '',
        note: contact.note || '',
        url: contact.url || '',
        nickname: contact.nickname || '',
        categories: categories
      };

      await contactsService.updateContact(contact.path, payload);

      // Update selected contact if it's the one we're viewing
      if (this.selectedContact?.path === contact.path) {
        this.selectedContact = { ...this.selectedContact, categories };
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
      // Revert optimistic update
      if (isStarred) {
        contact.categories.push(CATEGORY_FAVORITES);
      } else {
        contact.categories = contact.categories.filter((c: string) => c !== CATEGORY_FAVORITES);
      }
      this.requestUpdate();
    }
  }

  private handleSelectAll(e: Event) {
    const customEvent = e as CustomEvent;
    const checked = customEvent.detail ? customEvent.detail.checked : (e.target as HTMLInputElement).checked;
    if (checked) {
      const filteredContacts = this.contacts.filter(c => {
        if (this.selectedCategory) {
          if (!c.categories || !c.categories.includes(this.selectedCategory)) return false;
        }
        return true;
      });
      this.selectedContacts = new Set(filteredContacts.map(c => c.path));
    } else {
      this.selectedContacts = new Set();
    }
  }

  private handleSelectContact(e: Event, path: string) {
    e.stopPropagation();
    const newSet = new Set(this.selectedContacts);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    this.selectedContacts = newSet;
  }

  private handleCreateCategorySubmit(e: CustomEvent) {
    const name = e.detail.name?.trim();
    if (name) {
      if (!this.addedCategories.includes(name)) {
        this.addedCategories = [...this.addedCategories, name];
        localStorage.setItem('contacts_categories_cache', JSON.stringify(this.addedCategories));
      }
    }
    this.showCreatePrompt = false;
  }

  private handleCreateNew() {
    this.selectedContacts = new Set();
    const newContact = {
      name: this.i18nStore?.t('contacts.unnamedContact'),
      categories: this.selectedCategory ? [this.selectedCategory] : [],
      isTemporary: true
    };

    // Remove any existing temporary contacts first
    this.contacts = this.contacts.filter((c: any) => !c.isTemporary);
    this.contacts = [newContact, ...this.contacts];

    this.selectedContact = newContact;
    this.isEditing = true;
  }

  private async handleRenameCategorySubmit(e: CustomEvent) {
    const newName = e.detail.name?.trim();
    if (!newName || !this.categoryToRename || newName === this.categoryToRename) {
      this.categoryToRename = null;
      return;
    }

    const oldName = this.categoryToRename;
    this.categoryToRename = null;

    if (this.addedCategories.includes(oldName)) {
      this.addedCategories = this.addedCategories.map(c => c === oldName ? newName : c);
      localStorage.setItem('contacts_categories_cache', JSON.stringify(this.addedCategories));
    }

    if (this.selectedCategory === oldName) {
      this.selectedCategory = newName;
      window.location.hash = `/contacts/${encodeURIComponent(newName)}`;
    }

    const contactsToUpdate = this.contacts.filter(c => c.categories?.includes(oldName));
    if (contactsToUpdate.length > 0) {
      this.saving = true;
      try {
        const contactsToModify = contactsToUpdate.map((contact) => {
          const categories = contact.categories.map((c: string) => c === oldName ? newName : c);
          return { ...contact, categories };
        });
        await contactsService.bulkUpdateContacts(contactsToModify);
        this.fetchContacts();
      } catch (e) {
        console.error('Error renaming category', e);
      } finally {
        this.saving = false;
      }
    }
  }

  private async handleDeleteCategorySubmit() {
    if (!this.categoryToDelete) return;
    const oldName = this.categoryToDelete;
    this.categoryToDelete = null;

    if (this.addedCategories.includes(oldName)) {
      this.addedCategories = this.addedCategories.filter(c => c !== oldName);
      localStorage.setItem('contacts_categories_cache', JSON.stringify(this.addedCategories));
    }

    if (this.selectedCategory === oldName) {
      this.selectedCategory = '';
      window.location.hash = `/contacts/all`;
    }

    const contactsToUpdate = this.contacts.filter(c => c.categories?.includes(oldName));
    if (contactsToUpdate.length > 0) {
      this.saving = true;
      try {
        const contactsToModify = contactsToUpdate.map((contact) => {
          const categories = contact.categories.filter((c: string) => c !== oldName);
          return { ...contact, categories };
        });
        await contactsService.bulkUpdateContacts(contactsToModify);
        this.fetchContacts();
      } catch (e) {
        console.error('Error deleting category', e);
      } finally {
        this.saving = false;
      }
    }
  }

  private handleEdit() {
    this.isEditing = true;
  }

  private handleCancelEdit() {
    this.isEditing = false;
    if (this.selectedContact?.isTemporary) {
      this.selectedContact = null;
      this.contacts = this.contacts.filter((c: any) => !c.isTemporary);

      if (!this.selectedCategory) {
        window.location.hash = `/contacts/all`;
      }
    }
  }

  private async handleSave(payload: any) {
    this.saving = true;
    try {
      if (payload.categories && typeof payload.categories === 'string') {
        payload.categories = payload.categories.split(',').map((c: string) => c.trim()).filter((c: string) => c);
      } else {
        payload.categories = [];
      }

      let data;
      if (this.selectedContact && !this.selectedContact.isTemporary) {
        data = await contactsService.updateContact(this.selectedContact.path!, payload);
      } else {
        data = await contactsService.createContact(payload);
      }

      const savedContact = { ...payload, path: data.path || (this.selectedContact && !this.selectedContact.isTemporary ? this.selectedContact.path : '') };

      const contactIndex = this.contacts.findIndex((c: any) => this.selectedContact && (c.path === this.selectedContact.path || (c.isTemporary && this.selectedContact.isTemporary)));
      if (contactIndex > -1) {
        this.contacts[contactIndex] = { ...this.contacts[contactIndex], ...savedContact };
        delete this.contacts[contactIndex].isTemporary;
        this.contacts = [...this.contacts];
      } else {
        this.contacts = [savedContact, ...this.contacts];
      }

      this.selectedContact = { ...this.selectedContact, ...savedContact };
      delete this.selectedContact.isTemporary;
    } catch (e) {
      console.error('Error saving contact', e);
    } finally {
      this.saving = false;
    }
  }

  private handleSaveEvent(e: CustomEvent) {
    this.handleSave(e.detail);
  }

  private async handleToggleStarEvent() {
    const pathsToUpdate = this.selectedContacts.size > 1 ? Array.from(this.selectedContacts) : [this.selectedContact?.path].filter(Boolean);
    if (pathsToUpdate.length === 0) return;

    const isStarred = pathsToUpdate.length > 1 
      ? this.allSelectedStarred 
      : (this.contacts.find((c: any) => c.path === pathsToUpdate[0])?.categories?.includes(CATEGORY_FAVORITES) || false);

    this.saving = true;
    try {
      const contactsToModify = pathsToUpdate.map((path) => {
        const contactIndex = this.contacts.findIndex((c: any) => c.path === path);
        if (contactIndex === -1) return;

        const contact = this.contacts[contactIndex];
        let categories = contact.categories ? [...contact.categories] : [];
        if (isStarred) {
          categories = categories.filter((c: string) => c !== CATEGORY_FAVORITES);
        } else {
          if (!categories.includes(CATEGORY_FAVORITES)) categories.push(CATEGORY_FAVORITES);
        }

        // Optimistic UI update
        this.contacts[contactIndex] = { ...contact, categories };
        if (this.selectedContact?.path === path) {
          this.selectedContact = { ...this.selectedContact, categories };
        }

        const payload = { ...contact, categories };
        return payload;
      }).filter(Boolean);

      this.contacts = [...this.contacts]; // Trigger re-render immediately

      await contactsService.bulkUpdateContacts(contactsToModify);
    } catch (e) {
      console.error('Error toggling star', e);
    } finally {
      this.saving = false;
    }
  }

  private handleDelete() {
    this.showDeleteConfirm = true;
  }

  private async confirmDelete() {
    this.showDeleteConfirm = false;
    this.saving = true;
    try {
      const pathsToDelete = this.selectedContacts.size > 1 ? Array.from(this.selectedContacts) as string[] : [this.selectedContact?.path].filter(Boolean) as string[];
      await contactsService.bulkDeleteContacts(pathsToDelete);

      this.selectedContact = null;
      if (this.selectedContacts.size > 1) {
        this.selectedContacts = new Set();
      }
      this.isEditing = false;
      this.fetchContacts();
    } catch (e) {
      console.error('Error deleting contacts', e);
      alert('Failed to delete one or more contacts');
    } finally {
      this.saving = false;
    }
  }

  private async handleUpdateCategories(e: CustomEvent) {
    let cat = e.detail.category;
    if (typeof cat === 'string') {
      cat = cat.trim();
    }
    if (cat && !this.addedCategories.includes(cat)) {
      this.addedCategories = [...this.addedCategories, cat];
      localStorage.setItem('contacts_categories_cache', JSON.stringify(this.addedCategories));
    }

    const pathsToUpdate = this.selectedContacts.size > 1 ? Array.from(this.selectedContacts) : [this.selectedContact?.path].filter(Boolean);
    if (pathsToUpdate.length === 0) return;

    this.saving = true;
    try {
      const contactsToModify = pathsToUpdate.map((path) => {
        const contactIndex = this.contacts.findIndex((c: any) => c.path === path);
        if (contactIndex === -1) return;

        const contact = this.contacts[contactIndex];
        let categories = contact.categories ? [...contact.categories] : [];

        if (cat === '') {
          categories = [];
        } else if (categories.includes(cat)) {
          categories = categories.filter((c: string) => c !== cat);
        } else {
          categories.push(cat);
        }

        // Optimistic UI update
        this.contacts[contactIndex] = { ...contact, categories };
        if (this.selectedContact?.path === path) {
          this.selectedContact = { ...this.selectedContact, categories };
        }

        const payload = { ...contact, categories };
        return payload;
      }).filter(Boolean);

      await contactsService.bulkUpdateContacts(contactsToModify);
      this.contacts = [...this.contacts]; // Trigger re-render

      if (this.selectedContact && this.selectedContacts.size <= 1 && this.selectedCategory !== '') {
        const hasCategory = this.selectedContact.categories?.includes(this.selectedCategory);
        if (!hasCategory) {
          const uid = this.selectedContact.uid?.replace(/^urn:uuid:/, '') || this.selectedContact.path;
          if (uid) {
            window.location.hash = `#/contacts/all/${encodeURIComponent(uid)}`;
          }
        }
      }

      if (this.selectedCategory !== '' && this.selectedCategory !== CATEGORY_ALL_CONTACTS) {
        this.fetchContacts();
      }
    } catch (e) {
      console.error('Error updating categories', e);
    } finally {
      this.saving = false;
    }
  }

  private startResize = (e: MouseEvent) => {
    e.preventDefault();
    this.isPaneDragging = true;

    const startX = e.clientX;
    const startWidth = this.listWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      this.listWidth = Math.max(250, Math.min(800, startWidth + delta));
    };

    const onMouseUp = () => {
      this.isPaneDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  render() {
    return html`
      ${this.showDeleteConfirm ? html`
        <ui-confirm
          title="${this.i18nStore?.t('contacts.deleteContact')}"
          message="${this.i18nStore?.t('contacts.deleteContactConfirm')}"
          confirmText="${this.i18nStore?.t('contacts.delete')}"
          isDanger
          @confirm=${this.confirmDelete}
          @cancel=${() => this.showDeleteConfirm = false}
        ></ui-confirm>
      ` : ''}
      <alps-initial-loader ?hidden=${!this.showInitialLoader}></alps-initial-loader>
      <app-header 
        currentTab="contacts"
        .username=${this.username}
        .isMobile=${this.isMobile}
        .searchQuery=${this.filterQuery}
        .scrolled=${this.listScrolled}
        @toggle-sidebar=${() => this.mobileSidebarOpen = !this.mobileSidebarOpen}
        @search-submit=${(e: CustomEvent) => {
        this.filterQuery = e.detail.value;
        this.fetchContacts();
      }}
      ></app-header>
      <div class="app-container layout-vertical ${this.sidebarCollapsed && !this.isMobile ? 'collapsed' : ''} ${this.isPaneDragging || this.isSidebarDragging ? 'dragging' : ''} ${this.isMobile ? 'mobile-view' : ''} ${this.suppressSidebarHover ? 'suppress-sidebar-hover' : ''} ${this.isMobile && this.selectedContact ? 'reading' : ''}" style="${!this.sidebarCollapsed && !this.isMobile ? `--sidebar-width: ${this.sidebarWidth}px;` : ''}">
        <alps-sidebar 
          class="${this.isMobile ? 'mobile-sidebar' : 'desktop-sidebar'} ${this.mobileSidebarOpen ? 'open' : ''}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          .isHovered=${this.isSidebarHovered}
          .suppressHover=${this.suppressSidebarHover}
          .width=${this.sidebarWidth}
          .collapsed=${this.sidebarCollapsed && !this.isMobile}
          @sidebar-resize=${(e: CustomEvent) => {
        const newWidth = e.detail.newWidth;
        if (newWidth < 120) {
          if (!this.sidebarCollapsed) this.settingsStore?.updateSettings({ sidebarCollapsed: true });
          this.sidebarWidth = 250;
        } else {
          if (this.sidebarCollapsed) this.settingsStore?.updateSettings({ sidebarCollapsed: false });
          this.sidebarWidth = Math.min(Math.max(newWidth, 150), 500);
        }
      }}
          @drag-start=${() => this.isSidebarDragging = true}
          @drag-end=${() => this.isSidebarDragging = false}
          @toggle-collapse=${() => this.settingsStore?.updateSettings({ sidebarCollapsed: !this.sidebarCollapsed })}
          @close-sidebar=${() => this.mobileSidebarOpen = false}
          @mouseenter=${() => {
        if (this.hoverTimeout) {
          clearTimeout(this.hoverTimeout);
          this.hoverTimeout = null;
        }
        this.isSidebarHovered = true;
        this.suppressSidebarHover = false;
      }}
          @mouseleave=${() => {
        this.hoverTimeout = setTimeout(() => {
          this.isSidebarHovered = false;
        }, 300); // 300ms delay before collapsing
      }}
        >
          <alps-contacts-categories
            .contacts=${this.contacts}
            .uniqueCategories=${this.uniqueCategories}
            .selectedCategory=${this.selectedCategory}
            .filterQuery=${this.filterQuery}
            .sidebarCollapsed=${this.sidebarCollapsed}
            .isSidebarHovered=${this.isSidebarHovered}
            .suppressSidebarHover=${this.suppressSidebarHover}
            .isMobile=${this.isMobile}
            @create-contact=${this.handleCreateNew}
            @select-category=${(e: CustomEvent) => {
        this.filterQuery = '';
        const cat = e.detail.category;
        if (cat === CATEGORY_ALL_CONTACTS) {
          window.location.hash = `/contacts/all`;
        } else {
          window.location.hash = `/contacts/${encodeURIComponent(cat)}`;
        }
      }}
            @drag-start=${() => {
        this.isSidebarDragging = true;
        this.suppressSidebarHover = true;
      }}
            @drag-end=${() => {
        this.isSidebarDragging = false;
        if (this.isMobile) {
          this.mobileSidebarOpen = false;
        } else {
          if (!this.sidebarCollapsed) {
            this.settingsStore?.updateSettings({ sidebarCollapsed: true });
          }
          this.suppressSidebarHover = true;
        }
      }}
            @rename-category=${(e: CustomEvent) => {
        this.categoryToRename = e.detail.category;
      }}
            @delete-category=${(e: CustomEvent) => {
        this.categoryToDelete = e.detail.category;
      }}
          ></alps-contacts-categories>
          
          <alps-icon-btn 
            slot="footer-actions"
            class="new-folder-btn"
            icon="folderPlus"
            title="${this.i18nStore?.t('contacts.createCategory')}"
            @click=${() => this.showCreatePrompt = true}
            style="--btn-padding: 8px; --icon-size: 20px;"
          ></alps-icon-btn>
        </alps-sidebar>
        <div class="main-view">
          <div class="contact-list-pane" style="width: ${this.isMobile ? '100%' : this.listWidth + 'px'}; display: flex; flex-direction: column; flex-shrink: 0;">
            <alps-contacts-list
              .contacts=${this.contacts}
              .selectedCategory=${this.selectedCategory}
              .filterQuery=${this.filterQuery}
              .sortOrder=${this.sortOrder}
              .showOnlyStarred=${this.showOnlyStarred}
              .isMobile=${this.isMobile}
              .densityMode=${this.densityMode}
              .selectedContacts=${this.selectedContacts}
              .selectedContact=${this.selectedContact}
              .isSpinning=${this.isSpinning}
              .loading=${this.loading}
              .listScrolled=${this.listScrolled}
              @select-contact=${(e: CustomEvent) => this.selectContact(e.detail.contact)}
              @toggle-star=${(e: CustomEvent) => this.handleToggleStar(new Event(''), e.detail.contact)}
              @select-all=${this.handleSelectAll}
              @toggle-selection=${(e: CustomEvent) => this.handleSelectContact(e.detail.event, e.detail.path)}
              @refresh=${() => this.fetchContacts()}
              @spin-iteration=${this.handleSpinIteration}
              @sort-toggle=${() => this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'}
              @filter-star-toggle=${() => this.showOnlyStarred = !this.showOnlyStarred}
              @clear-search=${() => {
        this.filterQuery = '';
        this.fetchContacts();
        const appHeader = document.querySelector('app-header');
        if (appHeader) appHeader.shadowRoot?.querySelector('alps-input')?.shadowRoot?.querySelector('input')?.setAttribute('value', '');
      }}
              @list-scrolled=${(e: CustomEvent) => this.listScrolled = e.detail.scrolled}
            ></alps-contacts-list>
          </div>
          ${!this.isMobile ? html`<div class="resizer ${this.isPaneDragging ? 'dragging' : ''}" @mousedown=${this.startResize}></div>` : ''}
          <div class="contact-reader-pane" style="padding: 0; flex: 1;">
            <alps-contact-view
              .contact=${this.selectedContact}
              .selectedCount=${this.selectedContacts.size}
              .allSelectedStarred=${this.allSelectedStarred}
              .isEditing=${this.isEditing}
              .saving=${this.saving}
              .uniqueCategories=${this.uniqueCategories}
              .isMobile=${this.isMobile}
              @save=${this.handleSaveEvent}
              @delete=${this.handleDelete}
              @cancel-edit=${this.handleCancelEdit}
              @edit=${this.handleEdit}
              @toggle-star=${this.handleToggleStarEvent}
              @update-categories=${this.handleUpdateCategories}
              @list-scrolled=${(e: CustomEvent) => this.listScrolled = e.detail.scrolled}
              @close=${() => {
                this.selectedContact = null;
                this.isEditing = false;
                window.location.hash = `/contacts/${encodeURIComponent(this.selectedCategory || 'all')}`;
              }}
            ></alps-contact-view>
          </div>
        </div>
      </div>
      
      ${this.showCreatePrompt ? html`
        <ui-prompt
          title="${this.i18nStore?.t('contacts.createCategory')}"
          confirmText="${this.i18nStore?.t('contacts.create')}"
          .fields=${[{ id: 'name', label: this.i18nStore?.t('contacts.categoryName'), autofocus: true }]}
          @submit=${this.handleCreateCategorySubmit}
          @cancel=${() => this.showCreatePrompt = false}
        ></ui-prompt>
      ` : ''}

      ${this.categoryToRename !== null ? html`
        <ui-prompt
          title="${this.i18nStore?.t('contacts.renameCategory')}"
          confirmText="${this.i18nStore?.t('contacts.rename')}"
          .fields=${[{ id: 'name', label: this.i18nStore?.t('contacts.categoryName'), value: this.categoryToRename, autofocus: true }]}
          @submit=${this.handleRenameCategorySubmit}
          @cancel=${() => this.categoryToRename = null}
        ></ui-prompt>
      ` : ''}

      ${this.categoryToDelete !== null ? html`
        <ui-confirm
          title="${this.i18nStore?.t('contacts.deleteCategory')}"
          message="${this.i18nStore?.t('contacts.deleteCategoryConfirm', { category: this.categoryToDelete })}"
          confirmText="${this.i18nStore?.t('contacts.delete')}"
          isDanger
          @confirm=${this.handleDeleteCategorySubmit}
          @cancel=${() => this.categoryToDelete = null}
        ></ui-confirm>
      ` : ''}
    `;
  }
}
