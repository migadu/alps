import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { CATEGORY_ALL_CONTACTS, CATEGORY_FAVORITES } from './constants';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { activeUsername, settingsContext, SettingsStore } from '../../../frontend/src/store/settings-store';
import '../../../frontend/src/components/app-header';
import '../../../frontend/src/components/alps-input';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-avatar';
import { closeSidebarPeek } from '../../../frontend/src/components/alps-sidebar';
import '../../../frontend/src/components/alps-icon-btn';
import '../../../frontend/src/components/ui-prompt';
import '../../../frontend/src/components/alps-initial-loader';
import '../../../frontend/src/components/alps-popup';
import '../../../frontend/src/components/alps-create-button';
import './contacts-categories';
import './contacts-list';
import './contact-view';
import { popupStyles } from '../../../frontend/src/components/alps-popup';
import { MailboxPage } from '../../../frontend/src/pages/mailbox-page';
import { MessageList } from '../../../frontend/src/components/message-list';
import { contactsService } from './contacts-service';
import { isVersionConflict, outcomeUnknown } from '../../../frontend/src/utils/fetch-utils';
import { isSettingsHash } from '../../../frontend/src/utils/routes';
import { pageHash, updateSettingsBackground } from '../../../frontend/src/utils/settings-history';

/** Where the categories this user created, with no one filed into them yet, are kept. */
const categoriesKeyFor = (username: string) => `alps_contacts_categories_${username}`;
/** The pre-scoping, browser-wide key: read by no one now, only deleted. */
const LEGACY_CATEGORIES_KEY = 'contacts_categories_cache';

/** `#/contacts/<category>/<card>`, both optional and both encoded. */
const CONTACTS_ROUTE = /^#\/contacts\/?([^\/]*)\/?(.*)$/;

/** How an address write lands in the session history; see writeHash. */
type HashEntry = 'push' | 'replace';

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
  @state() private isMobile = window.innerWidth <= 768;
  @state() private mobileSidebarOpen = false;
  @state() private isSidebarDragging = false;
  @state() private isPaneDragging = false;
  @state() private densityMode: 'loose' | 'normal' | 'compact' | 'ultra-compact' = 'compact';
  @state() private selectedContacts = new Set<string>();
  @state() private listScrolled = false;
  @state() private categoryToRename: string | null = null;
  @state() private categoryToDelete: string | null = null;
  
  private syncIntervalTimer: ReturnType<typeof setInterval> | null = null;
  /** Bumped by every read of the list; only the newest read's answer is painted. */
  private readEpoch = 0;
  /** The search `contacts` answers: '' when it holds the whole book. */
  private loadedQuery = '';
  /** The whole book as last read, beside a search or without one; see allContacts. */
  private wholeBook: any[] = [];
  /**
   * The open card's path once the whole card is held: read, or just written
   * from the editor. Until then the page shows the list's copy, which holds
   * only what the listing returned; see handleEdit.
   */
  private wholeCardPath: string | null = null;
  /** The read of the open card on its way, which Edit waits for. */
  private cardRead: { path: string; generation: number; done: Promise<boolean> } | null = null;
  private cardGeneration = 0;
  private mergedBook: { contacts: any[]; wholeBook: any[]; open: any; merged: any[] } | null = null;

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
      /* Not a scroll container: see the mailbox page's host. */
      overflow: clip;
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
  }

  /**
   * In willUpdate, not updated: a property set in updated() lands after the
   * render that saw `loading` turn on, so every fetch, the mount's own
   * included, rendered the whole page a second time. Here the spinner starts
   * in the same render.
   */
  willUpdate(changedProperties: Map<string, any>) {
    super.willUpdate(changedProperties);
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

  /** The first book read restores the page's address even beneath Settings. */
  private restoringHash = true;

  connectedCallback() {
    super.connectedCallback();
    this.restoringHash = true;
    this.showInitialLoader = !(window as any).alpsAppLoaded;
    this.classList.add('density-compact');
    this.loadAddedCategories();
    window.addEventListener('alps-active-user-changed', this.loadAddedCategories);
    this.fetchContacts();
    window.addEventListener('resize', this._handleWindowResize);
    window.addEventListener('hashchange', this._handleHashChange);
    if (this.settingsStore) {
      this.settingsStore.addEventListener('change', this._handleSettingsChange);
      this._handleSettingsChange();
    }

    // Initial hash check
    setTimeout(() => {
      if (this.restoringHash) this.readHash(pageHash() ?? '');
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopResize?.();
    window.removeEventListener('resize', this._handleWindowResize);
    window.removeEventListener('hashchange', this._handleHashChange);
    window.removeEventListener('alps-active-user-changed', this.loadAddedCategories);
    if (this.settingsStore) {
      this.settingsStore.removeEventListener('change', this._handleSettingsChange);
    }
    if (this.syncIntervalTimer) {
      clearInterval(this.syncIntervalTimer);
      this.syncIntervalTimer = null;
    }
  }

  /**
   * A category created with no one filed into it exists nowhere on the server, so
   * the page remembers it, per user. These were kept under one browser-wide key,
   * written by every account on the browser and cleared by nothing, so one user's
   * category names appeared in the next user's sidebar.
   *
   * Re-read when the signed-in user becomes known or changes: the identity is
   * recorded only once /settings answers, which can be after this page mounts.
   */
  private loadAddedCategories = () => {
    try {
      // The unscoped key cannot be attributed to anyone, so it is deleted rather
      // than migrated, as compose-store does with the unscoped drafts.
      localStorage.removeItem(LEGACY_CATEGORIES_KEY);
      const username = activeUsername();
      const saved = username ? JSON.parse(localStorage.getItem(categoriesKeyFor(username)) || '[]') : [];
      this.addedCategories = Array.isArray(saved) ? saved : [];
    } catch {
      this.addedCategories = [];
    }
  };

  private saveAddedCategories() {
    const username = activeUsername();
    if (!username) return;
    try {
      localStorage.setItem(categoriesKeyFor(username), JSON.stringify(this.addedCategories));
    } catch {
      // Storage unavailable: the categories last as long as this page.
    }
  }

  private _handleHashChange = () => {
    // The Settings window, opened over this page: the URL is the window's.
    // Read as an address naming no card, it closed the card being read, and
    // an edit with it.
    if (isSettingsHash(window.location.hash)) return;
    this.readHash(window.location.hash);
  };

  private readHash(hash: string) {
    // Remove any existing temporary contacts
    this.contacts = this.contacts.filter((c: any) => !c.isTemporary);

    const match = hash.match(CONTACTS_ROUTE);
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

  /**
   * Puts `hash` in the address bar, and nothing when it is already there.
   * Every address this page writes goes through here, saying which of the two
   * it is.
   *
   * `push` is the user going somewhere, an entry Back returns from: a card or
   * a category clicked, the pane closed. `replace` is the page correcting the
   * address the user is already on after a gesture changed what it names: the
   * open category renamed or deleted, the open card deleted or filed out of
   * the open category. Assigned, each of those left an entry naming something
   * no longer there, and Back onto it showed an empty list under a category
   * the sidebar no longer had, or an empty pane for a card that is gone.
   *
   * The page renders from the address, in _handleHashChange, and replaceState
   * fires no `hashchange`, so a rewrite reads its own address back, as the
   * event did after the assignment it replaces.
   */
  private writeHash(hash: string, entry: HashEntry) {
    // Keep Settings open, but retain the page's new address and state for
    // Close/Back; a completed write can rename or remove its open category.
    if (updateSettingsBackground(hash)) {
      this.readHash(hash);
      return;
    }
    if (window.location.hash === hash) return;
    if (entry === 'push') {
      window.location.hash = hash;
      return;
    }
    history.replaceState(history.state, '', hash);
    this._handleHashChange();
  }

  /** The open category's list with no card open: where the pane's close goes,
   * and what a deleted card's address becomes. */
  private listHash(): string {
    return `#/contacts/${encodeURIComponent(this.selectedCategory || 'all')}`;
  }

  /**
   * The open card is gone and the address may still name it, so it is
   * rewritten in place to the card's list. Left alone, a reload or Back onto
   * it asked for a card that no longer exists and showed an empty pane.
   */
  private leaveDeletedCard() {
    if (!pageHash()?.match(CONTACTS_ROUTE)?.[2]) return;
    this.writeHash(this.listHash(), 'replace');
  }

  /**
   * Every card in the book, whatever the search: what the sidebar and the
   * category picker describe.
   *
   * Under a search `contacts` is only the server's matches, and the sidebar
   * was built from it: a category carried only by cards the search did not
   * match left the sidebar, so it could not be clicked, and every count was
   * counted over the matches. Under one, this is the whole book read beside
   * the search, with each card the list also holds taken from the list, and
   * the open card taken as it is open, since those carry the page's own edits
   * since that read.
   */
  get allContacts(): any[] {
    if (!this.loadedQuery) return this.contacts;
    const open = this.selectedContact;
    const cached = this.mergedBook;
    if (cached && cached.contacts === this.contacts && cached.wholeBook === this.wholeBook && cached.open === open) {
      return cached.merged;
    }
    const listed = new Map(this.contacts.filter(c => c.path).map(c => [c.path, c]));
    if (open?.path && !listed.has(open.path)) listed.set(open.path, open);
    const inBook = new Set(this.wholeBook.map(c => c.path));
    const merged = [
      // A card created during the search is in the list and not yet in the book.
      ...this.contacts.filter(c => !c.path || !inBook.has(c.path)),
      ...this.wholeBook.map(c => listed.get(c.path) ?? c),
    ];
    this.mergedBook = { contacts: this.contacts, wholeBook: this.wholeBook, open, merged };
    return merged;
  }

  get uniqueCategories() {
    const cats = new Set<string>(this.addedCategories);
    for (const c of this.allContacts) {
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

  /**
   * Reads the list, with the search when there is one.
   *
   * Only the newest read is painted. The list is read from a search, a search
   * ended, a refresh, the sync timer and the reconciles after writes, with no
   * ordering between their answers, so the slowest one won: a search's
   * matches landing after the read that ended it left them on screen under
   * an empty search box.
   */
  async fetchContacts() {
    const epoch = ++this.readEpoch;
    this.loading = true;
    try {
      const query = this.filterQuery;
      const [data, whole] = await Promise.all([
        contactsService.fetchContacts(query),
        // The whole book beside a search, for the sidebar (see allContacts).
        // Never fatal to the search: on failure the sidebar keeps the book it
        // last had.
        query
          ? contactsService.fetchContacts().catch((e: unknown) => {
            console.error('Failed to read the whole address book beside a search', e);
            return null;
          })
          : null,
      ]);
      if (epoch !== this.readEpoch) return;

      this.contacts = data.contacts || [];
      this.loadedQuery = query;
      if (!query) this.wholeBook = this.contacts;
      else if (whole) this.wholeBook = whole.contacts || [];
      if (this.restoringHash) {
        this.restoringHash = false;
        this.readHash(pageHash() ?? '');
      } else {
        this._handleHashChange(); // Keep live Settings edits untouched.
      }
    } catch (e) {
      if (epoch !== this.readEpoch) return;
      console.error('Failed to fetch contacts', e);
    } finally {
      if (epoch === this.readEpoch) this.loading = false;
      if (this.showInitialLoader) {
        setTimeout(() => {
          this.showInitialLoader = false;
          (window as any).alpsAppLoaded = true;
        }, 100);
      }
    }
  }

  /**
   * Ends the search, for the banner's "clear search" and for a category
   * clicked in the sidebar alike.
   *
   * Clearing `filterQuery` is not enough on its own: under a search
   * `this.contacts` is the server's answer to the query. The sidebar cleared
   * it and read nothing, so the box and the banner said there was no search
   * while the list went on showing the old query's matches, and of the
   * category clicked only the cards that matched it.
   *
   * With no search active there is nothing to read: `contacts` is already the
   * whole book. The search box needs nothing either; it shows the header's
   * `searchQuery`, which is bound to `filterQuery`.
   */
  private clearSearch() {
    if (!this.filterQuery) return;
    this.filterQuery = '';
    void this.fetchContacts();
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
      this.writeHash(`#/contacts/${catUrl}/${encodeURIComponent(cleanUid)}`, 'push');
      return;
    }
    if (this.selectedContacts.size > 0) {
      this.selectedContacts = new Set();
    }
    if (this.selectedContact?.path === contact.path) return;

    // Set immediately for instant UI feedback (prevents flashing)
    this.cardGeneration++;
    this.selectedContact = { ...contact };
    this.wholeCardPath = null;
    this.isEditing = false;
    this.conflictedPath = null;
    await this.readOpenCard(contact.path!);
  }

  /**
   * Reads the whole of the open card, at `path`, and shows it; true once it
   * is held. A read already on its way is waited for rather than repeated.
   */
  private readOpenCard(path: string): Promise<boolean> {
    const generation = this.cardGeneration;
    if (this.cardRead?.path === path && this.cardRead.generation === generation) return this.cardRead.done;
    const done = (async () => {
      try {
        const data = await contactsService.fetchContact(path);
        // A reopened path is a new selection: an older read must not replace
        // its current card or enable editing with an obsolete snapshot.
        if (this.cardGeneration === generation && this.selectedContact?.path === data.path) {
          this.selectedContact = data;
          this.wholeCardPath = data.path;
          return true;
        }
      } catch (e) {
        console.error('Failed to fetch contact details', e);
      }
      return false;
    })();
    const read = { path, generation, done };
    this.cardRead = read;
    void done.finally(() => {
      if (this.cardRead === read) this.cardRead = null;
    });
    return done;
  }

  /**
   * What a toolbar gesture (delete, star, category) acts on: the ticked contacts
   * whenever any are ticked, and the open contact only when none are. This used to
   * switch at MORE than one, while contact-view replaces the open card with "1
   * contacts selected" as soon as one box is ticked, and ticking does not close the
   * open contact. So with a single box ticked, Delete removed the contact that had
   * just left the screen, not the one the banner said was selected.
   */
  private get gestureTargets(): string[] {
    return this.selectedContacts.size > 0
      ? Array.from(this.selectedContacts)
      : [this.selectedContact?.path].filter(Boolean) as string[];
  }

  /**
   * The card a gesture acts on, wherever the page holds it.
   *
   * A search narrows `contacts` to the server's matches but keeps the open
   * card and the ticked ones, which need not be among them. Star and category
   * gestures looked only in `contacts`, so on such a card they did nothing:
   * no write, and no word that nothing was written.
   */
  private findContact(path: string): any {
    return this.contacts.find((c: any) => c.path === path)
      ?? this.allContacts.find((c: any) => c.path === path)
      ?? (this.selectedContact?.path === path ? this.selectedContact : undefined);
  }

  private get allSelectedStarred() {
    if (this.selectedContacts.size === 0) return false;
    for (const path of this.selectedContacts) {
      const contact = this.findContact(path);
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
      const saved = await contactsService.updateCategories(contact.path, categories);
      this.applyETags(saved.etag ? { [contact.path]: saved.etag } : undefined);

      // Update selected contact if it's the one we're viewing
      if (this.selectedContact?.path === contact.path) {
        this.selectedContact = { ...this.selectedContact, categories };
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
      this.reportFailure('contacts.starOneFailed');
      // Revert by putting the card's own categories back into the list. This
      // used to edit `contact`, the object the optimistic update had already
      // replaced in `this.contacts`, so the refused star stayed painted; and for
      // a contact with no categories the revert itself threw.
      const original = contact.categories;
      this.contacts = this.contacts.map((c: any) => c.path === contact.path ? { ...c, categories: original } : c);
      // The rollback is the truth only for a refusal. A lost response may hide
      // a star that was written, which would otherwise show off until the next
      // read of the list.
      if (outcomeUnknown(err)) void this.rereadCategories(contact.path);
    }
  }

  /**
   * One card's stored categories and version, after a write whose outcome is
   * unknown. Dropped if anything repainted the card meanwhile: a newer
   * gesture or read is the newer truth.
   */
  private async rereadCategories(path: string) {
    const row = this.contacts.find((c: any) => c.path === path);
    try {
      const card = await contactsService.fetchContact(path);
      if (!row || this.contacts.find((c: any) => c.path === path) !== row) return;
      const stored = { categories: card.categories ?? [], ...(card.etag ? { etag: card.etag } : {}) };
      this.contacts = this.contacts.map((c: any) => c.path === path ? { ...c, ...stored } : c);
      if (this.selectedContact?.path === path) {
        this.selectedContact = { ...this.selectedContact, ...stored };
      }
    } catch (e) {
      console.error('Failed to re-read a contact after a write that may have landed', e);
    }
  }

  private handleSelectAll(e: Event) {
    const customEvent = e as CustomEvent;
    const checked = customEvent.detail ? customEvent.detail.checked : (e.target as HTMLInputElement).checked;
    if (checked) {
      // The rows the list shows, when it says which.
      if (Array.isArray(customEvent.detail?.paths)) {
        this.selectedContacts = new Set(customEvent.detail.paths);
        return;
      }
      const filteredContacts = this.contacts.filter(c => {
        if (this.selectedCategory) {
          if (!c.categories || !c.categories.includes(this.selectedCategory)) return false;
        }
        if (this.showOnlyStarred) {
          if (!c.categories || !c.categories.includes(CATEGORY_FAVORITES)) return false;
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
        this.saveAddedCategories();
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

  /**
   * Every card carrying `category`, across the whole address book. During a
   * search `this.contacts` holds only the results, so renaming or deleting a
   * category from a search rewrote those cards and left every other card on the
   * old name, with both names then listed in the sidebar.
   *
   * A new card not yet saved is in `this.contacts` too, filed under the open
   * category, but it is in no book and has nothing to write. Now that the
   * page waits for the writes, it must not count as carrying the category:
   * counted, it would be the one card to write, the service would write
   * nothing, and with New contact open a rename or removal of a category no
   * saved card carries would stop there with nothing said.
   */
  private async cardsCarrying(category: string): Promise<any[]> {
    const cards = this.filterQuery ? ((await contactsService.fetchContacts()).contacts || []) : this.contacts;
    return cards.filter((c: any) => c.path && c.categories?.includes(category));
  }

  /**
   * The address of `category`'s list (All Contacts for none), with the card
   * the address names now still open in it. For the rewrite after a rename or
   * removal of the open category, which waits for the cards to be written:
   * the user may have opened a card meanwhile, or begun editing one, and a
   * rewrite to the bare list would close it and throw the edit away.
   */
  private categoryHash(category: string): string {
    const card = pageHash()?.match(CONTACTS_ROUTE)?.[2];
    return `#/contacts/${encodeURIComponent(category || 'all')}${card ? `/${card}` : ''}`;
  }

  /**
   * The open card with the categories a rename or removal wrote for it, once
   * the write took (its new version is in `etags`).
   *
   * The card is shown as the page read it when it was opened, and applyETags
   * moves only its version. Now that the card stays open through a rename or
   * removal of its category, it would go on showing the old name, and Edit
   * would save that name back onto the card, with no refusal, since the page
   * holds the version the write left. A card open under All Contacts was
   * left on the old name this way already.
   */
  private showWrittenCategories(written: any[], etags?: Record<string, string>) {
    const open = this.selectedContact?.path;
    if (!open || !etags?.[open]) return;
    const card = written.find((c: any) => c.path === open);
    if (card) this.selectedContact = { ...this.selectedContact, categories: card.categories };
  }

  private async handleRenameCategorySubmit(e: CustomEvent) {
    const newName = e.detail.name?.trim();
    if (!newName || !this.categoryToRename || newName === this.categoryToRename) {
      this.categoryToRename = null;
      return;
    }

    const oldName = this.categoryToRename;
    this.categoryToRename = null;

    // The page takes the new name only once a card carries it, or when no
    // card has to. Taken before the cards were read and written, a rename
    // whose read of the book failed, or that every card refused, left the
    // address, the open category and the stored list on a name no card had,
    // over an empty list.
    let contactsToUpdate: any[];
    try {
      contactsToUpdate = await this.cardsCarrying(oldName);
    } catch (e) {
      console.error('Could not read the address book for a category change', e);
      // No card was read, so there is nothing to count.
      this.reportFailure('contacts.categoryRenameOneFailed');
      return;
    }
    if (contactsToUpdate.length > 0) {
      this.saving = true;
      try {
        const contactsToModify = contactsToUpdate.map((contact) => {
          const categories = contact.categories.map((c: string) => c === oldName ? newName : c);
          return { ...contact, categories };
        });
        const { total, done, failed, etags } = await contactsService.bulkUpdateCategories(contactsToModify);
        this.applyETags(etags);
        this.showWrittenCategories(contactsToModify, etags);
        this.fetchContacts();
        if (failed > 0) this.reportRefusals('contacts.categoryRenameFailed', 'contacts.categoryRenameOneFailed', { count: failed, total });
        if (done === 0) return;
      } catch (e) {
        console.error('Error renaming category', e);
        this.fetchContacts();
        // Thrown before any outcome came back, so none of the cards counts as done.
        const tried = contactsToUpdate.length;
        this.reportRefusals('contacts.categoryRenameFailed', 'contacts.categoryRenameOneFailed', { count: tried, total: tried });
        return;
      } finally {
        this.saving = false;
      }
    }

    if (this.addedCategories.includes(oldName)) {
      this.addedCategories = this.addedCategories.map(c => c === oldName ? newName : c);
      this.saveAddedCategories();
    }

    // Read after the writes: the user may have opened another category since.
    if (this.selectedCategory === oldName) {
      this.selectedCategory = newName;
      // In place: the old name is a category that no longer exists, and Back
      // onto it showed an empty list the sidebar did not have.
      this.writeHash(this.categoryHash(newName), 'replace');
    }
  }

  private async handleDeleteCategorySubmit() {
    if (!this.categoryToDelete) return;
    const oldName = this.categoryToDelete;
    this.categoryToDelete = null;

    // As for a rename, the category leaves the page only once a card has let
    // go of it, or when no card has to. Taken before, a removal that failed
    // went to All Contacts, and dropped the category from the stored list,
    // while every card still carried it.
    let contactsToUpdate: any[];
    try {
      contactsToUpdate = await this.cardsCarrying(oldName);
    } catch (e) {
      console.error('Could not read the address book for a category change', e);
      // No card was read, so there is nothing to count.
      this.reportFailure('contacts.categoryDeleteOneFailed');
      return;
    }
    if (contactsToUpdate.length > 0) {
      this.saving = true;
      try {
        const contactsToModify = contactsToUpdate.map((contact) => {
          const categories = contact.categories.filter((c: string) => c !== oldName);
          return { ...contact, categories };
        });
        const { total, done, failed, etags } = await contactsService.bulkUpdateCategories(contactsToModify);
        this.applyETags(etags);
        this.showWrittenCategories(contactsToModify, etags);
        this.fetchContacts();
        if (failed > 0) this.reportRefusals('contacts.categoryDeleteFailed', 'contacts.categoryDeleteOneFailed', { count: failed, total });
        if (done === 0) return;
      } catch (e) {
        console.error('Error deleting category', e);
        this.fetchContacts();
        // Thrown before any outcome came back, so none of the cards counts as done.
        const tried = contactsToUpdate.length;
        this.reportRefusals('contacts.categoryDeleteFailed', 'contacts.categoryDeleteOneFailed', { count: tried, total: tried });
        return;
      } finally {
        this.saving = false;
      }
    }

    if (this.addedCategories.includes(oldName)) {
      this.addedCategories = this.addedCategories.filter(c => c !== oldName);
      this.saveAddedCategories();
    }

    // Read after the writes, as for a rename.
    if (this.selectedCategory === oldName) {
      this.selectedCategory = '';
      // In place, as for a rename: the category is gone.
      this.writeHash(this.categoryHash(''), 'replace');
    }
  }

  /**
   * Starts editing the open card, once the whole of it is held.
   *
   * The list's copy, shown while the card is read, holds only what the
   * listing returned, and a server may answer that with just the properties
   * asked for. Edit pressed before the read answered filled the form from
   * that copy, and the first save wrote the card back without its note,
   * address, birthday or URL. So editing waits for the read, or reads the
   * card again when its read failed, and does not start without it.
   */
  private async handleEdit() {
    const open = this.selectedContact;
    const generation = this.cardGeneration;
    if (open && !open.isTemporary && this.wholeCardPath !== open.path) {
      const held = await this.readOpenCard(open.path);
      if (this.cardGeneration !== generation || this.selectedContact?.path !== open.path) return;
      if (!held) {
        this.reportFailure('contacts.loadFailed');
        return;
      }
    }
    this.isEditing = true;
  }

  private handleCancelEdit() {
    this.isEditing = false;
    if (this.selectedContact?.isTemporary) {
      this.selectedContact = null;
      this.contacts = this.contacts.filter((c: any) => !c.isTemporary);

      if (!this.selectedCategory) {
        this.writeHash('#/contacts/all', 'push');
      }
    } else if (this.selectedContact?.path && this.selectedContact.path === this.conflictedPath) {
      this.conflictedPath = null;
      void this.rereadOpenContact();
    }
  }

  /** Shows the open card as it is stored now: after a refused save, what the
   * other device wrote. */
  private async rereadOpenContact() {
    const path = this.selectedContact?.path;
    if (!path) return;
    try {
      const data = await contactsService.fetchContact(path);
      if (this.selectedContact?.path === path && !this.isEditing) {
        this.selectedContact = data;
      }
    } catch (e) {
      console.error('Failed to re-read the contact', e);
    }
    this.fetchContacts();
  }

  /**
   * Records the version each written card is now at, in the list and in the
   * open card.
   *
   * Every write moves a card's version, so one left behind turns the NEXT save
   * of that card into a refusal against a version this page wrote itself: star
   * a contact, then edit it, and the edit would report a change made "on
   * another device".
   */
  private applyETags(etags?: Record<string, string>) {
    if (!etags || Object.keys(etags).length === 0) return;
    this.contacts = this.contacts.map((c: any) => etags[c.path] ? { ...c, etag: etags[c.path] } : c);
    const open = this.selectedContact?.path;
    if (open && etags[open]) {
      this.selectedContact = { ...this.selectedContact, etag: etags[open] };
    }
  }

  /** The newest form state waiting for the save in flight; see handleSave. */
  private queuedSave: any = null;
  private saveRunning = false;
  /** The card whose save was refused as changed elsewhere, until the edit is cancelled. */
  private conflictedPath: string | null = null;

  /**
   * Saves the form, one request at a time.
   *
   * The form saves itself half a second after each change, and those saves
   * used to overlap. Once versions are checked, an overlap is a refusal: the
   * second save carries the version the first is about to replace. (For a new
   * contact, an overlap made two contacts.) So a save now waits for the one in
   * flight, and only the newest form state queued behind it is sent.
   */
  private async handleSave(payload: any) {
    this.queuedSave = payload;
    if (this.saveRunning) return;
    this.saveRunning = true;
    try {
      while (this.queuedSave) {
        const next = this.queuedSave;
        this.queuedSave = null;
        await this.saveOnce(next);
      }
    } finally {
      this.saveRunning = false;
    }
  }

  private async saveOnce(payload: any) {
    // Keep the successful form snapshot independent of edits made while the
    // request is in flight. The queued form is compared to this snapshot next.
    payload = { ...payload };
    for (const field of ['emails', 'phones']) {
      if (Array.isArray(payload[field])) payload[field] = payload[field].map((p: any) => ({ ...p }));
    }
    const editing = !!this.selectedContact && !this.selectedContact.isTemporary;
    // After a refusal every autosave would be refused the same way, one error
    // per keystroke. Nothing is sent until the edit is cancelled, which shows
    // the stored card (handleCancelEdit).
    if (editing && this.conflictedPath === this.selectedContact.path) return;
    this.saving = true;
    try {
      // The editor has no field for the categories: the toolbar's star and
      // category picker write them on their own, through updateCategories.
      // Sent from the form's copy, taken when editing began and joined into
      // one string, an edit put back what a star made while editing had
      // changed, and split a category whose name held a comma in two. So an
      // edit leaves them out, and the open card keeps its own; a new
      // contact is created in the category it was opened in.
      if (editing) {
        delete payload.categories;
      } else {
        payload.categories = Array.isArray(payload.categories) ? payload.categories : [];
      }

      let data;
      if (editing) {
        // The page's version, not the form's: the form copied the card when
        // editing began, and each save since has moved it on.
        // Clearing one displayed copy must not clear the next hidden copy on
        // every later autosave. Only fields changed since our last successful
        // form save express a new editing gesture.
        const changed_fields = ['organization', 'title', 'note', 'url', 'nickname', 'public_key', 'address']
          .filter(field => String(payload[field] || '').trim() !== String(this.selectedContact[field] || '').trim());
        // And what the page held for each: after a clear, the server's next
        // copy is one the page never showed, and a value typed into the
        // emptied field is added beside it rather than put in its place.
        const changed_from = Object.fromEntries(changed_fields.map(field => [field, String(this.selectedContact[field] || '')]));
        const request = { ...payload, changed_fields, changed_from, etag: this.selectedContact.etag };
        for (const field of ['emails', 'phones']) {
          const props = payload[field];
          if (!Array.isArray(props) || props.some((p: any) => !p.id)) continue;
          const fallback = field === 'emails' ? 'email' : 'phone';
          const before = (this.selectedContact[field] || (this.selectedContact[fallback] ? [{ value: this.selectedContact[fallback] }] : []))
            .filter((p: any) => String(p.value || '').trim());
          request[field] = props.map((p: any) => ({
            value: p.value, type: p.type,
            source_index: before.findIndex((old: any, i: number) => (old.id || `${field}:${i}`) === p.id),
          }));
        }
        data = await contactsService.updateContact(this.selectedContact.path!, request);
      } else {
        data = await contactsService.createContact(payload);
      }

      const savedContact = { ...payload, path: data.path || (editing ? this.selectedContact.path : ''), etag: data.etag };

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
      // Written whole from the editor's form, so held whole.
      this.wholeCardPath = this.selectedContact.path;
    } catch (e) {
      console.error('Error saving contact', e);
      if (editing && isVersionConflict(e)) {
        this.conflictedPath = this.selectedContact.path;
        this.reportFailure('contacts.saveConflict');
      } else {
        this.reportFailure('contacts.saveFailed');
      }
    } finally {
      this.saving = false;
    }
  }

  private handleSaveEvent(e: CustomEvent) {
    this.handleSave(e.detail);
  }

  private async handleToggleStarEvent() {
    const pathsToUpdate = this.gestureTargets;
    if (pathsToUpdate.length === 0) return;

    const isStarred = pathsToUpdate.length > 1 
      ? this.allSelectedStarred 
      : (this.findContact(pathsToUpdate[0])?.categories?.includes(CATEGORY_FAVORITES) || false);

    this.saving = true;
    // Taken before the optimistic paint, so a refusal of every card has
    // something true to go back to without asking the server, which may be
    // exactly what cannot be reached.
    const previousContacts = this.contacts.map((c: any) => ({ ...c }));
    const previousSelected = this.selectedContact ? { ...this.selectedContact } : null;
    try {
      const contactsToModify = pathsToUpdate.map((path) => {
        const contact = this.findContact(path);
        if (!contact) return;

        let categories = contact.categories ? [...contact.categories] : [];
        if (isStarred) {
          categories = categories.filter((c: string) => c !== CATEGORY_FAVORITES);
        } else {
          if (!categories.includes(CATEGORY_FAVORITES)) categories.push(CATEGORY_FAVORITES);
        }

        // Optimistic UI update
        const contactIndex = this.contacts.findIndex((c: any) => c.path === path);
        if (contactIndex !== -1) this.contacts[contactIndex] = { ...contact, categories };
        if (this.selectedContact?.path === path) {
          this.selectedContact = { ...this.selectedContact, categories };
        }

        const payload = { ...contact, categories };
        return payload;
      }).filter(Boolean);

      this.contacts = [...this.contacts]; // Trigger re-render immediately

      const { total, done, failed, uncertain, etags } = await contactsService.bulkUpdateCategories(contactsToModify);
      this.applyETags(etags);
      if (failed > 0) {
        if (done === 0) {
          // Nothing is known to have been written, so both panes go back at
          // once. A re-read alone would leave the star lit until it answered,
          // and for good when it failed too, as it does offline.
          this.contacts = previousContacts;
          this.selectedContact = previousSelected;
          // But a timeout or a lost response may hide a star that was written,
          // and only a read can tell.
          if (uncertain > 0) this.fetchContacts();
        } else {
          // Some cards took the change, and the snapshot would un-star them.
          this.fetchContacts();
        }
        this.reportRefusals('contacts.starFailed', 'contacts.starOneFailed', { count: failed, total });
      }
    } catch (e) {
      console.error('Error toggling star', e);
      // As for a category update: nothing reported an outcome, so every card
      // tried counts as failed.
      this.reportRefusals('contacts.starFailed', 'contacts.starOneFailed', { count: pathsToUpdate.length, total: pathsToUpdate.length });
    } finally {
      this.saving = false;
    }
  }

  /**
   * Says a write failed. Every failure in this page was a console.error the
   * user never saw — a starred contact that did not star, a category rename
   * that did not happen — so the UI simply showed the state it had hoped for.
   */
  private reportFailure(key: string, params?: Record<string, any>) {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: this.i18nStore?.t(key, params), duration: 5000 }
    }));
  }

  /**
   * Says that `count` of the `total` cards a write was aimed at refused it.
   *
   * The counted sentence agrees with `count`, since the cards that failed are
   * its subject. Picked by the total, the German toast for one card of five
   * put its verb in the plural ("konnten"). A write aimed at a single card is
   * told in a sentence of its own, where the counted one read "1 of 1 contact
   * could not be deleted."
   */
  private reportRefusals(counted: string, single: string, params: { count: number; total: number }) {
    if (params.total === 1) this.reportFailure(single);
    else this.reportFailure(counted, params);
  }

  private handleDelete() {
    this.showDeleteConfirm = true;
  }

  private async confirmDelete() {
    this.showDeleteConfirm = false;
    this.saving = true;
    // What the confirmed delete was aimed at, taken before the request: the
    // user can open another card, or tick others, while it is on its way, and
    // the answer must not clear those.
    const open = this.selectedContact?.path;
    const openedHash = pageHash();
    const selection = this.selectedContacts;
    const pathsToDelete = this.gestureTargets;
    try {
      const { total, done, failed, uncertain, deletedPaths = [] } = await contactsService.bulkDeleteContacts(pathsToDelete);

      // Only when something went, and the list is re-read. A delete that
      // removed nothing (offline, say) leaves every card there, and the
      // selection the user built stays too.
      if (done > 0) {
        // The open card closes only if it is still the one that was open and
        // it is gone: a card the batch failed to delete is still there, and
        // one opened meanwhile was never a target.
        if (open && this.selectedContact?.path === open && deletedPaths.includes(open)) {
          this.selectedContact = null;
          this.isEditing = false;
          // Before the re-read, whose hash handler would open a card the
          // address still names; and only the address the delete was made
          // from, not one the user has since moved to.
          if (pageHash() === openedHash) this.leaveDeletedCard();
        }
        // The ticked batch was the target. A selection built since is not.
        if (this.selectedContacts === selection && selection.size > 0) {
          this.selectedContacts = new Set();
        }
        this.fetchContacts();
      } else if (uncertain > 0) {
        // Nothing is known to have gone, but a lost response may hide a delete
        // that was made. Read again, then let go of only the targets the book
        // no longer has: offline the read fails too, and everything stays.
        await this.fetchContacts();
        const book = new Set(this.allContacts.map((c: any) => c.path));
        const gone = (path?: string) => !!path && pathsToDelete.includes(path) && !book.has(path);
        if (open && this.selectedContact?.path === open && gone(open)) {
          this.selectedContact = null;
          this.isEditing = false;
          if (pageHash() === openedHash) this.leaveDeletedCard();
        }
        if (this.selectedContacts === selection && [...selection].some(gone)) {
          this.selectedContacts = new Set([...selection].filter(path => !gone(path)));
        }
      }
      if (failed > 0) {
        this.reportRefusals('contacts.deleteFailed', 'contacts.deleteOneFailed', { count: failed, total });
      }
    } catch (e) {
      console.error('Error deleting contacts', e);
      this.fetchContacts();
      // Thrown before any outcome came back, so none of the cards counts as deleted.
      this.reportRefusals('contacts.deleteFailed', 'contacts.deleteOneFailed', { count: pathsToDelete.length, total: pathsToDelete.length });
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
      this.saveAddedCategories();
    }

    const pathsToUpdate = this.gestureTargets;
    if (pathsToUpdate.length === 0) return;

    this.saving = true;
    try {
      const contactsToModify = pathsToUpdate.map((path) => {
        const contact = this.findContact(path);
        if (!contact) return;

        let categories = contact.categories ? [...contact.categories] : [];

        if (cat === '') {
          categories = [];
        } else if (categories.includes(cat)) {
          categories = categories.filter((c: string) => c !== cat);
        } else {
          categories.push(cat);
        }

        // Optimistic UI update
        const contactIndex = this.contacts.findIndex((c: any) => c.path === path);
        if (contactIndex !== -1) this.contacts[contactIndex] = { ...contact, categories };
        if (this.selectedContact?.path === path) {
          this.selectedContact = { ...this.selectedContact, categories };
        }

        const payload = { ...contact, categories };
        return payload;
      }).filter(Boolean);

      const { total, failed, etags } = await contactsService.bulkUpdateCategories(contactsToModify);
      this.contacts = [...this.contacts]; // Trigger re-render
      this.applyETags(etags);
      if (failed > 0) {
        this.fetchContacts();
        this.reportRefusals('contacts.categoryUpdateFailed', 'contacts.categoryUpdateOneFailed', { count: failed, total });
      }

      if (this.selectedContact && this.selectedContacts.size <= 1 && this.selectedCategory !== '') {
        const hasCategory = this.selectedContact.categories?.includes(this.selectedCategory);
        if (!hasCategory) {
          const uid = this.selectedContact.uid?.replace(/^urn:uuid:/, '') || this.selectedContact.path;
          if (uid) {
            // In place: the page follows the card to a list that still holds
            // it, which is not a place the user asked to go, and the old
            // address named it under a category it no longer carries.
            this.writeHash(`#/contacts/all/${encodeURIComponent(uid)}`, 'replace');
          }
        }
      }

      if (this.selectedCategory !== '' && this.selectedCategory !== CATEGORY_ALL_CONTACTS) {
        this.fetchContacts();
      }
    } catch (e) {
      console.error('Error updating categories', e);
      // The bulk update threw before reporting any outcome, so none of the
      // cards can be counted as done. Without numbers the toast showed its
      // own "{failed} of {total}" placeholders.
      this.reportRefusals('contacts.categoryUpdateFailed', 'contacts.categoryUpdateOneFailed', { count: pathsToUpdate.length, total: pathsToUpdate.length });
    } finally {
      this.saving = false;
    }
  }

  /** Ends the pane drag in progress, if any; null when there is none. A page
   * that leaves the screen mid-drag calls it, or its window listeners would
   * keep running against it until the next mouseup. */
  private stopResize: (() => void) | null = null;

  private startResize = (e: MouseEvent) => {
    e.preventDefault();
    this.stopResize?.();
    this.isPaneDragging = true;

    const startX = e.clientX;
    const startWidth = this.listWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      this.listWidth = Math.max(250, Math.min(800, startWidth + delta));
    };

    const onMouseUp = () => {
      this.stopResize = null;
      this.isPaneDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    this.stopResize = onMouseUp;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  render() {
    return html`
      ${this.showDeleteConfirm ? html`
        <ui-confirm
          heading="${this.i18nStore?.t('contacts.deleteContact')}"
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
      <div class="app-container layout-vertical ${this.sidebarCollapsed && !this.isMobile ? 'collapsed' : ''} ${this.isPaneDragging || this.isSidebarDragging ? 'dragging' : ''} ${this.isMobile ? 'mobile-view' : ''} ${this.isMobile && this.selectedContact ? 'reading' : ''}" style="${!this.sidebarCollapsed && !this.isMobile ? `--sidebar-width: ${this.sidebarWidth}px;` : ''}">
        <alps-sidebar 
          class="${this.isMobile ? 'mobile-sidebar' : 'desktop-sidebar'} ${this.mobileSidebarOpen ? 'open' : ''}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
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
        >
          <alps-contacts-categories
            .contacts=${this.allContacts}
            .uniqueCategories=${this.uniqueCategories}
            .selectedCategory=${this.selectedCategory}
            .filterQuery=${this.filterQuery}
            @create-contact=${this.handleCreateNew}
            @select-category=${(e: CustomEvent) => {
        this.clearSearch();
        const cat = e.detail.category;
        if (cat === CATEGORY_ALL_CONTACTS) {
          this.writeHash('#/contacts/all', 'push');
        } else {
          this.writeHash(`#/contacts/${encodeURIComponent(cat)}`, 'push');
        }
        closeSidebarPeek(this.renderRoot);
      }}
            @drag-start=${() => {
        this.isSidebarDragging = true;
        closeSidebarPeek(this.renderRoot);
      }}
            @drag-end=${() => {
        this.isSidebarDragging = false;
        if (this.isMobile) {
          this.mobileSidebarOpen = false;
        } else {
          closeSidebarPeek(this.renderRoot);
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
              @clear-search=${() => this.clearSearch()}
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
                this.writeHash(this.listHash(), 'push');
              }}
            ></alps-contact-view>
          </div>
        </div>
      </div>
      
      ${this.showCreatePrompt ? html`
        <ui-prompt
          heading="${this.i18nStore?.t('contacts.createCategory')}"
          confirmText="${this.i18nStore?.t('contacts.create')}"
          .fields=${[{ id: 'name', label: this.i18nStore?.t('contacts.categoryName'), autofocus: true }]}
          @submit=${this.handleCreateCategorySubmit}
          @cancel=${() => this.showCreatePrompt = false}
        ></ui-prompt>
      ` : ''}

      ${this.categoryToRename !== null ? html`
        <ui-prompt
          heading="${this.i18nStore?.t('contacts.renameCategory')}"
          confirmText="${this.i18nStore?.t('contacts.rename')}"
          .fields=${[{ id: 'name', label: this.i18nStore?.t('contacts.categoryName'), value: this.categoryToRename, autofocus: true }]}
          @submit=${this.handleRenameCategorySubmit}
          @cancel=${() => this.categoryToRename = null}
        ></ui-prompt>
      ` : ''}

      ${this.categoryToDelete !== null ? html`
        <ui-confirm
          heading="${this.i18nStore?.t('contacts.deleteCategory')}"
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
