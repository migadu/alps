import { confirmsContactSave } from './contacts-service';
import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { CATEGORY_ALL_CONTACTS, CATEGORY_FAVORITES } from './constants';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { activeUsername, settingsContext, SettingsStore } from '../../../frontend/src/store/settings-store';
import '../../../frontend/src/components/app-header';
import '../../../frontend/src/components/alps-input';
import '../../../frontend/src/components/alps-button';
import '../../../frontend/src/components/alps-banner';
import '../../../frontend/src/components/alps-avatar';
import { closeSidebarPeek, SIDEBAR_WIDTH_MIN } from '../../../frontend/src/components/alps-sidebar';
import '../../../frontend/src/components/alps-icon-btn';
import '../../../frontend/src/components/ui-prompt';
import '../../../frontend/src/components/alps-initial-loader';
import { endBoot, isBooting } from '../../../frontend/src/utils/boot-splash';
import '../../../frontend/src/components/alps-popup';
import '../../../frontend/src/components/alps-create-button';
import './contacts-categories';
import './contacts-list';
import './contact-view';
import { popupStyles } from '../../../frontend/src/components/alps-popup';
import { MailboxPage } from '../../../frontend/src/pages/mailbox-page';
import { MessageList } from '../../../frontend/src/components/message-list';
import { contactsService, sameAddressParts } from './contacts-service';
import { HttpStatusError, isGone, isVersionConflict, outcomeUnknown } from '../../../frontend/src/utils/fetch-utils';
import { isSettingsHash } from '../../../frontend/src/utils/routes';
import { pageHash, updateSettingsBackground } from '../../../frontend/src/utils/settings-history';
import { motionStyles } from '../../../frontend/src/utils/motion';

/** Where the categories this user created, with no one filed into them yet, are kept. */
const categoriesKeyFor = (username: string) => `alps_contacts_categories_${username}`;
/** The pre-scoping, browser-wide key: read by no one now, only deleted. */
const LEGACY_CATEGORIES_KEY = 'contacts_categories_cache';

/** `#/contacts/<category>/<card>`, both optional and both encoded. */
const CONTACTS_ROUTE = /^#\/contacts\/?([^\/]*)\/?(.*)$/;

/** How an address write lands in the session history; see writeHash. */
type HashEntry = 'push' | 'replace';

/** The counted and the one-card sentence for cards a write's answer never
 * came back from, by what the write was; see reportRefusals. */
const UNCONFIRMED = {
  delete: ['contacts.deleteUnconfirmed', 'contacts.deleteOneUnconfirmed'],
  update: ['contacts.updateUnconfirmed', 'contacts.updateOneUnconfirmed'],
} as const;

type ContactSaveTarget = {
  contact: any;
  original: any;
  generation: number;
  lifetime: number;
  username: string;
  conflicted: boolean;
  /** Its card was deleted elsewhere: nothing more is sent for it. */
  gone?: boolean;
  toolbarVersion?: { etag: string };
  creationId?: string;
  unconfirmed?: { before: any; payload: any };
};

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
  @state() private showInitialLoader = isBooting();
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
  private cardRead: { path: string; generation: number; lifetime: number; username: string; done: Promise<boolean> } | null = null;
  private cardGeneration = 0;
  private mergedBook: { contacts: any[]; wholeBook: any[]; open: any; merged: any[] } | null = null;

  static styles = [
    motionStyles,
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
      border-inline-end: 1px solid var(--border-color, #e5e7eb);
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
      inset-inline-start: 1px;
    }
    .resizer:hover, .resizer.dragging {
      z-index: 9999;
    }
    .resizer:hover::after, .resizer.dragging::after {
      background: var(--accent-color, #005A9E);
      width: 3px;
      inset-inline-start: 0;
    }
    .app-container.collapsed .contact-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) calc(-4px * var(--ui-inline-direction, 1)) 0 4px -2px;
      z-index: 25;
      border-inline-start: 1px solid var(--border-color, #e5e7eb);
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
    this.saveActive = true;
    this.showInitialLoader = isBooting();
    this.classList.add('density-compact');
    this.loadAddedCategories();
    window.addEventListener('alps-active-user-changed', this.handleSaveOwnerChange);
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
    window.removeEventListener('alps-active-user-changed', this.handleSaveOwnerChange);
    this.saveActive = false;
    this.saveLifetime++;
    this.readEpoch++;
    this.goneCards.clear();
    this.queuedSaves = [];
    this.saveTargets = new WeakMap();
    this.toolbarVersions.clear();
    this.pendingCategoryChanges.clear();
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
      const pending = username ? JSON.parse(localStorage.getItem(categoriesKeyFor(username) + '_pending') || '[]') : [];
      this.pendingCategoryChanges = new Map(Array.isArray(pending) ? pending.filter(entry => Array.isArray(entry) && typeof entry[0] === 'string' && (typeof entry[1] === 'string' || entry[1] === null)).map(([oldName, newName]) => [oldName, newName ?? undefined]) : []);
    } catch {
      this.addedCategories = [];
      this.pendingCategoryChanges.clear();
    }
  };

  private saveAddedCategories() {
    const username = activeUsername();
    if (!username) return;
    try {
      localStorage.setItem(categoriesKeyFor(username), JSON.stringify(this.addedCategories));
      localStorage.setItem(categoriesKeyFor(username) + '_pending', JSON.stringify([...this.pendingCategoryChanges]));
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
  @state() private listError = '';

  async fetchContacts() {
    const epoch = ++this.readEpoch;
    this.listError = '';
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

      // A list read does not navigate away from a form opened while it waited.
      const keepEditor = this.isEditing && this.selectedContact;
      const temporary = keepEditor?.isTemporary ? keepEditor : null;
      this.contacts = temporary ? [temporary, ...(data.contacts || [])] : data.contacts || [];
      this.loadedQuery = query;
      if (!query) this.wholeBook = this.contacts;
      else if (whole) this.wholeBook = whole.contacts || [];
      if (!query || whole) this.reconcileCategoryNames(this.wholeBook);
      if (this.restoringHash) {
        this.restoringHash = false;
        if (!keepEditor) this.readHash(pageHash() ?? '');
      } else if (!keepEditor) {
        this._handleHashChange(); // Keep live Settings edits untouched.
      }
    } catch (e) {
      if (epoch !== this.readEpoch) return;
      this.listError = e instanceof HttpStatusError && e.message === 'carddav_not_configured' ? 'contacts.notConfigured' : 'contacts.loadFailed';
      if (this.listError !== 'contacts.notConfigured') console.error('Failed to fetch contacts', e);
    } finally {
      if (epoch === this.readEpoch) this.loading = false;
      if (this.showInitialLoader) {
        setTimeout(() => {
          this.showInitialLoader = false;
          endBoot();
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
    this.saving = false;
    this.selectedContact = { ...contact };
    this.wholeCardPath = null;
    this.isEditing = false;
    this.conflictedPath = null;
    this.gonePath = null;
    await this.readOpenCard(contact.path!);
  }

  /**
   * Reads the whole of the open card, at `path`, and shows it; true once it
   * is held. A read already on its way is waited for rather than repeated.
   */
  private readOpenCard(path: string): Promise<boolean> {
    const generation = this.cardGeneration;
    const lifetime = this.saveLifetime;
    const username = activeUsername() ?? this.username;
    // A late read belongs to the page and account that sent it, as a save
    // does. It must not announce an old card or start a new account's listing.
    const ownsRead = () => this.saveActive && lifetime === this.saveLifetime && username === (activeUsername() ?? this.username);
    if (this.cardRead?.path === path && this.cardRead.generation === generation && this.cardRead.lifetime === lifetime && this.cardRead.username === username) return this.cardRead.done;
    const done = (async () => {
      try {
        const data = await contactsService.fetchContact(path);
        if (!ownsRead()) return false;
        // A reopened path is a new selection: an older read must not replace
        // its current card or enable editing with an obsolete snapshot.
        if (this.cardGeneration === generation && this.selectedContact?.path === data.path) {
          this.goneCards.delete(data.path);
          this.selectedContact = data;
          this.wholeCardPath = data.path;
          return true;
        }
      } catch (e) {
        if (!ownsRead()) return false;
        if (e instanceof HttpStatusError && e.status === 404) {
          this.cardGone(path, generation);
        } else {
          console.error('Failed to fetch contact details', e);
        }
      }
      return false;
    })();
    const read = { path, generation, lifetime, username, done };
    this.cardRead = read;
    void done.finally(() => {
      if (this.cardRead === read) this.cardRead = null;
    });
    return done;
  }

  /**
   * The card at `path` was not there to read: deleted on another device since
   * the list was read. Its row goes with a fresh read of the list, and if it
   * is still the card open, it closes and the user is told why. A card opened
   * since is left alone.
   */
  private cardGone(path: string, generation: number) {
    if (this.cardGeneration === generation && this.selectedContact?.path === path) {
      this.selectedContact = null;
      this.isEditing = false;
      this.leaveDeletedCard();
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: this.i18nStore?.t('contacts.deletedElsewhere'), type: 'info', duration: 5000 }
      }));
    }
    void this.fetchContacts();
  }

  /**
   * The cards at `paths` were not there to write: deleted on another device
   * since the page read them. Their rows go at once, and with a fresh read of
   * the list. The open card closes, as after a read that found it gone,
   * unless its form is open: that stays as typed, with nothing more sent for
   * it, until the edit is cancelled (see handleCancelEdit). Closing it here
   * would throw away what the user typed, with no word of where it went.
   */
  private dropGone(paths: string[] = []) {
    if (paths.length === 0) return;
    for (const path of paths) this.goneCards.add(path);
    for (const job of this.queuedSaves) {
      if (paths.includes(job.target.contact.path)) job.target.gone = true;
    }
    const gone = (c: any) => !!c.path && paths.includes(c.path);
    const whole = this.wholeBook === this.contacts;
    this.contacts = this.contacts.filter(c => !gone(c));
    this.wholeBook = whole ? this.contacts : this.wholeBook.filter(c => !gone(c));
    if (paths.some(path => this.selectedContacts.has(path))) {
      this.selectedContacts = new Set([...this.selectedContacts].filter(path => !paths.includes(path)));
    }
    const open = this.selectedContact;
    if (open && gone(open)) {
      if (this.isEditing) {
        this.gonePath = open.path;
      } else {
        this.cardGeneration++;
        this.selectedContact = null;
        this.leaveDeletedCard();
      }
    }
    void this.fetchContacts();
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
    const ownsWork = this.contactWorkOwner();

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
      if (!ownsWork()) return;
      this.applyETags(saved.etag ? { [contact.path]: saved.etag } : undefined);

      // Update selected contact if it's the one we're viewing
      if (this.selectedContact?.path === contact.path) {
        this.selectedContact = { ...this.selectedContact, categories };
      }
    } catch (err) {
      if (!ownsWork()) return;
      if (isGone(err)) {
        this.reportFailure('contacts.deletedElsewhere');
        this.dropGone([contact.path]);
        return;
      }
      console.error('Failed to toggle star:', err);
      // Told apart as across a selection: see reportRefusals.
      this.reportFailure(outcomeUnknown(err) ? UNCONFIRMED.update[1] : 'contacts.starOneFailed');
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
    this.cardGeneration++;
    this.saving = false;
    this.selectedContacts = new Set();
    const newContact = {
      name: this.i18nStore?.t('contacts.unnamedContact'),
      categories: this.selectedCategory ? [this.selectedCategory] : [],
      isTemporary: true,
      creation_id: crypto.randomUUID()
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

  private reconcileCategoryNames(book: any[]) {
    for (const [oldName, newName] of this.pendingCategoryChanges) {
      if (book.some(c => c.categories?.includes(oldName))) continue;
      const next = newName && book.some(c => c.categories?.includes(newName)) ? newName : '';
      this.pendingCategoryChanges.delete(oldName);
      this.addedCategories = [...new Set(this.addedCategories.flatMap(c => c === oldName ? (next ? [next] : []) : [c]))];
      this.saveAddedCategories();
      const byPath = new Map(book.map(c => [c.path, c]));
      this.contacts = this.contacts.map(c => byPath.has(c.path) ? { ...c, categories: byPath.get(c.path).categories } : c);
      const open = byPath.get(this.selectedContact?.path);
      if (open) this.selectedContact = { ...this.selectedContact, categories: open.categories };
      if (this.selectedCategory === oldName) {
        this.selectedCategory = next;
        this.writeHash(this.categoryHash(next), 'replace');
      }
    }
  }

  private async handleRenameCategorySubmit(e: CustomEvent) {
    const ownsWork = this.contactWorkOwner();
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
      if (!ownsWork()) return;
    } catch (e) {
      if (!ownsWork()) return;
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
        const { total, done, failed, uncertain = 0, etags, gonePaths = [] } = await contactsService.bulkUpdateCategories(contactsToModify);
        if (!ownsWork()) return;
        this.applyETags(etags);
        this.showWrittenCategories(contactsToModify, etags);
        if (failed > 0) this.reportRefusals('contacts.categoryRenameFailed', 'contacts.categoryRenameOneFailed', { count: failed - uncertain, total, uncertain, gone: gonePaths.length });
        this.dropGone(gonePaths);
        if (done === 0 && uncertain > 0) {
          this.pendingCategoryChanges.set(oldName, newName);
          this.saveAddedCategories();
          await this.fetchContacts();
          return;
        }
        this.fetchContacts();
        if (done === 0) return;
        this.pendingCategoryChanges.delete(oldName);
        this.saveAddedCategories();
      } catch (e) {
        if (!ownsWork()) return;
        console.error('Error renaming category', e);
        this.fetchContacts();
        // Thrown before any outcome came back, so none of the cards counts as done.
        const tried = contactsToUpdate.length;
        this.reportRefusals('contacts.categoryRenameFailed', 'contacts.categoryRenameOneFailed', { count: tried, total: tried });
        return;
      } finally {
        if (ownsWork()) this.saving = false;
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
    const ownsWork = this.contactWorkOwner();
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
      if (!ownsWork()) return;
    } catch (e) {
      if (!ownsWork()) return;
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
        const { total, done, failed, uncertain = 0, etags, gonePaths = [] } = await contactsService.bulkUpdateCategories(contactsToModify);
        if (!ownsWork()) return;
        this.applyETags(etags);
        this.showWrittenCategories(contactsToModify, etags);
        if (failed > 0) this.reportRefusals('contacts.categoryDeleteFailed', 'contacts.categoryDeleteOneFailed', { count: failed - uncertain, total, uncertain, gone: gonePaths.length });
        this.dropGone(gonePaths);
        if (done === 0 && uncertain > 0) {
          this.pendingCategoryChanges.set(oldName, undefined);
          this.saveAddedCategories();
          await this.fetchContacts();
          return;
        }
        this.fetchContacts();
        if (done === 0) return;
        this.pendingCategoryChanges.delete(oldName);
        this.saveAddedCategories();
      } catch (e) {
        if (!ownsWork()) return;
        console.error('Error deleting category', e);
        this.fetchContacts();
        // Thrown before any outcome came back, so none of the cards counts as done.
        const tried = contactsToUpdate.length;
        this.reportRefusals('contacts.categoryDeleteFailed', 'contacts.categoryDeleteOneFailed', { count: tried, total: tried });
        return;
      } finally {
        if (ownsWork()) this.saving = false;
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
      this.cardGeneration++;
      this.selectedContact = null;
      this.contacts = this.contacts.filter((c: any) => !c.isTemporary);

      if (!this.selectedCategory) {
        this.writeHash('#/contacts/all', 'push');
      }
    } else if (this.selectedContact?.path && this.selectedContact.path === this.gonePath) {
      // The form was all that was left of a card deleted elsewhere.
      this.gonePath = null;
      this.cardGeneration++;
      this.selectedContact = null;
      this.leaveDeletedCard();
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
    const generation = this.cardGeneration;
    const ownsWork = this.contactWorkOwner();
    try {
      const data = await contactsService.fetchContact(path);
      if (!ownsWork()) return;
      if (this.cardGeneration === generation && this.selectedContact?.path === path && !this.isEditing) {
        this.selectedContact = data;
      }
    } catch (e) {
      if (!ownsWork()) return;
      if (isGone(e)) {
        if (this.cardGeneration === generation && this.selectedContact?.path === path && this.isEditing) {
          this.reportFailure('contacts.editDeletedElsewhere');
          this.dropGone([path]);
        } else {
          this.cardGone(path, generation);
        }
        return;
      }
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
  private toolbarVersions = new Map<string, { etag: string }>();

  private applyETags(etags?: Record<string, string>) {
    if (!etags || Object.keys(etags).length === 0) return;
    for (const [path, etag] of Object.entries(etags)) this.toolbarVersions.set(path, { etag });
    this.contacts = this.contacts.map((c: any) => etags[c.path] ? { ...c, etag: etags[c.path] } : c);
    const open = this.selectedContact?.path;
    if (open && etags[open]) {
      this.selectedContact = { ...this.selectedContact, etag: etags[open] };
    }
  }

  /** Coalesced per card, so a second card cannot replace the first card's queued edits. */
  private pendingCategoryChanges = new Map<string, string | undefined>();

  private queuedSaves: { payload: any; target: ContactSaveTarget }[] = [];
  private saveTargets = new WeakMap<object, ContactSaveTarget>();
  private saveActive = true;
  private saveLifetime = 0;
  private handleSaveOwnerChange = () => {
    this.saveLifetime++;
    this.readEpoch++;
    this.goneCards.clear();
    this.queuedSaves = [];
    this.saveTargets = new WeakMap();
    this.toolbarVersions.clear();
    this.pendingCategoryChanges.clear();
    this.loadAddedCategories();
  };

  private ownsSave(target: ContactSaveTarget): boolean {
    return target.lifetime === this.saveLifetime && target.username === (activeUsername() ?? this.username);
  }

  /** Late toolbar and re-read results belong to the page and account that sent them. */
  private contactWorkOwner(): () => boolean {
    const lifetime = this.saveLifetime;
    const username = activeUsername() ?? this.username;
    return () => this.saveActive && lifetime === this.saveLifetime && username === (activeUsername() ?? this.username);
  }

  private showingSave(target: ContactSaveTarget): boolean {
    return this.ownsSave(target) && target.generation === this.cardGeneration && !!this.selectedContact
      && (this.selectedContact === target.original || this.selectedContact.path === target.contact.path);
  }
  private saveRunning = false;
  /** The card whose save was refused as changed elsewhere, until the edit is cancelled. */
  private conflictedPath: string | null = null;
  /** The card whose save found it deleted elsewhere, until the edit is cancelled. */
  private gonePath: string | null = null;
  /** Old forms can flush after navigation. A fresh full-card read permits a recreated path again. */
  private goneCards = new Set<string>();

  /**
   * A form's save found its card deleted on another device.
   *
   * Every later autosave would be answered the same way, so nothing more is
   * sent for it. While the form is still open it stays, holding what the user
   * typed, and the message says so; the card leaves the list either way.
   */
  private saveFoundGone(target: ContactSaveTarget, path: string) {
    target.gone = true;
    const typing = this.showingSave(target) && this.isEditing;
    this.reportFailure(typing ? 'contacts.editDeletedElsewhere' : 'contacts.deletedElsewhere');
    this.dropGone([path]);
  }

  /**
   * Saves the form, one request at a time.
   *
   * The form saves itself half a second after each change, and those saves
   * used to overlap. Once versions are checked, an overlap is a refusal: the
   * second save carries the version the first is about to replace. (For a new
   * contact, an overlap made two contacts.) So a save now waits for the one in
   * flight, and only the newest form state queued for each card is sent.
   */
  private async handleSave(payload: any, source = this.selectedContact) {
    if (!source || !this.saveActive) return;
    if (source.path && this.goneCards.has(source.path)) return;
    let target = this.saveTargets.get(source);
    if (!target || !this.ownsSave(target)) {
      const showing = this.selectedContact && (this.selectedContact === source || (source.path && source.path === this.selectedContact.path));
      target = {
        contact: { ...(showing ? this.selectedContact : source) }, original: source,
        generation: showing ? this.cardGeneration : -1, lifetime: this.saveLifetime,
        username: activeUsername() ?? this.username, conflicted: false,
        toolbarVersion: this.toolbarVersions.get(source.path),
        creationId: source.isTemporary ? (source.creation_id || crypto.randomUUID()) : undefined,
      };
      this.saveTargets.set(source, target);
    }
    if (!this.saveRunning && this.showingSave(target)) {
      target.contact = { ...this.selectedContact };
      target.toolbarVersion = this.toolbarVersions.get(target.contact.path);
    }
    // Capture the form when it was submitted, including when it has to wait.
    payload = { ...payload };
    for (const field of ['emails', 'phones']) {
      if (Array.isArray(payload[field])) payload[field] = payload[field].map((p: any) => ({ ...p }));
    }
    if (payload.address_parts) payload.address_parts = { ...payload.address_parts };
    const waiting = this.queuedSaves.find(job => job.target === target);
    if (waiting) waiting.payload = payload;
    else this.queuedSaves.push({ payload, target });
    if (this.saveRunning) return;
    this.saveRunning = true;
    try {
      while (this.queuedSaves.length) {
        const next = this.queuedSaves.shift()!;
        if (this.ownsSave(next.target)) await this.saveOnce(next.payload, next.target);
      }
    } finally {
      this.saveRunning = false;
    }
  }

  private async saveOnce(payload: any, target: ContactSaveTarget) {
    if (target.gone || this.goneCards.has(target.contact.path)) return;
    if (target.unconfirmed && !await this.reconcileSave(target)) return;
    // Another card can hold the queue while this card's toolbar completes a
    // write. Advance to that acknowledged version before sending its form.
    const latest = this.toolbarVersions.get(target.contact.path);
    if (latest && latest !== target.toolbarVersion) {
      target.contact = { ...target.contact, etag: latest.etag };
      target.toolbarVersion = latest;
    }
    const before = target.contact;
    const toolbarVersion = target.toolbarVersion;
    const editing = !before.isTemporary;
    // After a refusal every autosave would be refused the same way, one error
    // per keystroke. Nothing is sent until the edit is cancelled, which shows
    // the stored card (handleCancelEdit).
    // Nor after its card was found deleted elsewhere (saveFoundGone).
    if (target.conflicted || target.gone || (editing && (this.conflictedPath === before.path || this.gonePath === before.path))) return;
    if (this.showingSave(target)) this.saving = true;
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
        // The address by its parts, once the editor has them: it edits them
        // and not the line.
        const changed_fields = ['organization', 'title', 'note', 'url', 'nickname', 'public_key', 'address']
          .filter(field => field === 'address' && payload.address_parts
            ? !sameAddressParts(payload.address_parts, before.address_parts)
            : String(payload[field] || '').trim() !== String(before[field] || '').trim());
        // And what the page held for each: after a clear, the server's next
        // copy is one the page never showed, and a value typed into the
        // emptied field is added beside it rather than put in its place.
        const changed_from = Object.fromEntries(changed_fields.map(field => [field, String(before[field] || '')]));
        const request = {
          ...payload, changed_fields, changed_from, etag: before.etag,
          ...(payload.address_parts && { address_parts_from: before.address_parts ?? {} }),
        };
        for (const field of ['emails', 'phones']) {
          const props = payload[field];
          if (!Array.isArray(props) || props.some((p: any) => !p.id)) continue;
          const fallback = field === 'emails' ? 'email' : 'phone';
          const propertiesBefore = (before[field] || (before[fallback] ? [{ value: before[fallback] }] : []))
            .filter((p: any) => String(p.value || '').trim());
          request[field] = props.map((p: any) => ({
            value: p.value, type: p.type,
            source_index: propertiesBefore.findIndex((old: any, i: number) => (old.id || `${field}:${i}`) === p.id),
          }));
        }
        data = await contactsService.updateContact(before.path!, request);
      } else {
        // The contact the user is typing in, even when another card has
        // its address: answered with that card's path, the editor went on to
        // edit the other card, without its version or fields.
        data = await contactsService.createContact({
          ...payload, allow_duplicate: true, creation_id: target.creationId,
          ...(payload.address_parts && { address_parts_from: {} }),
        });
      }

      // A toolbar response may have found this card deleted while its older
      // save's successful answer waited. Do not put that old copy back.
      if (editing && this.goneCards.has(before.path)) return;

      const savedContact = { ...before, ...payload, path: data.path || (editing ? before.path : ''), etag: data.etag };
      delete savedContact.isTemporary;
      if (editing) {
        // The form says nothing about toolbar categories. A toolbar write
        // acknowledged while this response waited is newer than this edit:
        // both succeeded with If-Match, so the edit committed first.
        const current = this.findContact(before.path);
        savedContact.categories = current?.categories ?? before.categories;
        const written = this.toolbarVersions.get(before.path);
        if (written && written !== toolbarVersion) savedContact.etag = written.etag;
      }
      // Advance only this card's successful snapshot. A queued form uses its
      // new ETag and property positions even when another card is open now.
      const showing = this.showingSave(target);
      target.contact = savedContact;
      target.toolbarVersion = this.toolbarVersions.get(savedContact.path);
      if (!this.ownsSave(target)) return;
      const contactIndex = this.contacts.findIndex((c: any) => editing ? c.path === before.path : c === target.original);
      if (contactIndex > -1) {
        this.contacts = this.contacts.map((c, i) => i === contactIndex ? savedContact : c);
      } else {
        this.contacts = [savedContact, ...this.contacts];
      }
      if (showing) {
        this.selectedContact = savedContact;
        this.wholeCardPath = savedContact.path;
      }
    } catch (e) {
      if (!(editing && isGone(e))) console.error('Error saving contact', e);
      if (!this.ownsSave(target)) return;
      if (editing && isGone(e)) {
        this.saveFoundGone(target, before.path);
      } else if (outcomeUnknown(e) || (!editing && isVersionConflict(e))) {
        target.unconfirmed = { before, payload };
        this.reportFailure(UNCONFIRMED.update[1]);
        await this.reconcileSave(target);
      } else if (editing && isVersionConflict(e)) {
        target.conflicted = true;
        if (this.showingSave(target)) this.conflictedPath = before.path;
        this.reportFailure('contacts.saveConflict');
      } else {
        this.reportFailure('contacts.saveFailed');
      }
    } finally {
      if (this.showingSave(target)) this.saving = false;
    }
  }

  /** No further write is safe until the previous attempt can be observed. */
  private async reconcileSave(target: ContactSaveTarget): Promise<boolean> {
    const pending = target.unconfirmed;
    if (!pending) return true;
    try {
      const { contacts = [] } = await contactsService.fetchContacts();
      if (!this.ownsSave(target)) return false;
      const fresh = contacts.find((card: any) => pending.before.isTemporary
        ? String(card.uid || '').replace(/^urn:uuid:/i, '').toLowerCase() === target.creationId?.toLowerCase()
        : card.path === pending.before.path);
      // A new card absent from a successful read can be created again at its
      // same UUID path. If the first write arrives late, If-None-Match protects it.
      if (!fresh && pending.before.isTemporary) { target.unconfirmed = undefined; return true; }
      // An existing card absent from it was deleted elsewhere; there is no
      // newer version to show, which is what a conflict would promise.
      if (!fresh) {
        target.unconfirmed = undefined;
        this.saveFoundGone(target, pending.before.path);
        return false;
      }
      if (fresh && ((!pending.before.isTemporary && pending.before.etag && fresh.etag === pending.before.etag) || confirmsContactSave(fresh, pending.payload))) {
        const showing = this.showingSave(target);
        target.contact = { ...fresh };
        target.unconfirmed = undefined;
        const index = this.contacts.findIndex(c => c === target.original || c.path === fresh.path);
        this.contacts = index < 0 ? [fresh, ...this.contacts] : this.contacts.map((c, i) => i === index ? fresh : c);
        if (showing) { this.selectedContact = target.contact; this.wholeCardPath = fresh.path; }
        this.saveTargets.set(target.contact, target);
        return true;
      }
      // Another version has appeared: do not apply an old form over it.
      target.unconfirmed = undefined;
      target.conflicted = true;
      if (this.showingSave(target)) this.conflictedPath = pending.before.path;
      this.reportFailure('contacts.saveConflict');
    } catch (error) {
      console.error('Could not confirm the contact save', error);
    }
    return false;
  }

  private handleSaveEvent(e: CustomEvent & { sourceContact?: any; sourceUsername?: string }) {
    if (e.sourceUsername !== undefined && e.sourceUsername !== (activeUsername() ?? this.username)) return;
    this.handleSave(e.detail, e.sourceContact);
  }

  private async handleToggleStarEvent() {
    const ownsWork = this.contactWorkOwner();
    const pathsToUpdate = this.gestureTargets;
    if (pathsToUpdate.length === 0) return;

    const isStarred = pathsToUpdate.length > 1 
      ? this.allSelectedStarred 
      : (this.findContact(pathsToUpdate[0])?.categories?.includes(CATEGORY_FAVORITES) || false);

    this.saving = true;
    // Taken before the optimistic paint, so a refusal of every card has
    // something true to go back to without asking the server, which may be
    // exactly what cannot be reached.
    const previousCategories = new Map<string, any>();
    const optimisticCategories = new Map<string, string[]>();
    try {
      const contactsToModify = pathsToUpdate.map((path) => {
        const contact = this.findContact(path);
        if (!contact) return;
        previousCategories.set(path, contact.categories);

        let categories = contact.categories ? [...contact.categories] : [];
        if (isStarred) {
          categories = categories.filter((c: string) => c !== CATEGORY_FAVORITES);
        } else {
          if (!categories.includes(CATEGORY_FAVORITES)) categories.push(CATEGORY_FAVORITES);
        }
        optimisticCategories.set(path, categories);

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

      const { total, done, failed, uncertain = 0, etags, gonePaths = [] } = await contactsService.bulkUpdateCategories(contactsToModify);
      if (!ownsWork()) return;
      this.applyETags(etags);
      if (failed > 0) {
        if (done === 0) {
          // Nothing is known to have been written, so both panes go back at
          // once. A re-read alone would leave the star lit until it answered,
          // and for good when it failed too, as it does offline.
          // Only this gesture's still-painted categories go back. A different
          // card opened meanwhile, or a newer edit to either card, stays.
          const rollback = (card: any) => card && optimisticCategories.has(card.path) && card.categories === optimisticCategories.get(card.path)
            ? { ...card, categories: previousCategories.get(card.path) } : card;
          this.contacts = this.contacts.map(rollback);
          this.selectedContact = rollback(this.selectedContact);
          // But a timeout or a lost response may hide a star that was written,
          // and only a read can tell.
          if (uncertain > 0) this.fetchContacts();
        } else {
          // Some cards took the change, and the snapshot would un-star them.
          this.fetchContacts();
        }
        this.reportRefusals('contacts.starFailed', 'contacts.starOneFailed', { count: failed - uncertain, total, uncertain, gone: gonePaths.length });
        // After the rollback above, which would put a deleted card's row back.
        this.dropGone(gonePaths);
      }
    } catch (e) {
      if (!ownsWork()) return;
      console.error('Error toggling star', e);
      // As for a category update: nothing reported an outcome, so every card
      // tried counts as failed.
      this.reportRefusals('contacts.starFailed', 'contacts.starOneFailed', { count: pathsToUpdate.length, total: pathsToUpdate.length });
    } finally {
      if (ownsWork()) this.saving = false;
    }
  }

  /**
   * Says a write failed. Every failure in this page was a console.error the
   * user never saw — a starred contact that did not star, a category rename
   * that did not happen — so the UI simply showed the state it had hoped for.
   */
  private reportFailure(key: string, params?: Record<string, any>) {
    this.showFailure(this.i18nStore?.t(key, params));
  }

  private showFailure(message: string | undefined) {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message, type: 'error', duration: 5000 }
    }));
  }

  /**
   * Says that `count` of the `total` cards a write was aimed at refused it,
   * and that `uncertain` more of them never answered.
   *
   * Each counted sentence agrees with its own number, since those cards are
   * its subject. Picked by the total, the German toast for one card of five
   * put its verb in the plural ("konnten"). A write aimed at a single card is
   * told in a sentence of its own, where the counted one read "1 of 1 contact
   * could not be deleted."
   *
   * A bulk outcome's `failed` holds both kinds. A timeout or a lost
   * connection says nothing of what the server did (see outcomeUnknown), but
   * the toast called those cards refused as well: a delete that had been made
   * behind a lost answer was reported as not made, and trying again was the
   * wrong answer to it. So they are counted apart, and the user is told to
   * refresh before trying again: the page reads the list again itself, but
   * that read can fail as the write did. One toast holds both, as a screen
   * reader reads out only the newest.
   *
   * `gone` of the cards counted in `count` were not there to write, deleted
   * on another device (see dropGone). They are told apart too: "could not be
   * updated" invites another try, and there is nothing left to try it on.
   */
  private reportRefusals(counted: string, single: string, params: { count: number; total: number; uncertain?: number; gone?: number }, write: keyof typeof UNCONFIRMED = 'update') {
    const { total, uncertain = 0, gone = 0 } = params;
    const count = params.count - gone;
    const sentence = ([countedKey, singleKey]: readonly [string, string], n: number) =>
      (total === 1 ? this.i18nStore?.t(singleKey) : this.i18nStore?.t(countedKey, { count: n, total })) ?? '';
    const said: string[] = [];
    if (count > 0) said.push(sentence([counted, single], count));
    if (gone > 0) said.push(sentence(['contacts.deletedElsewhereCount', 'contacts.deletedElsewhere'], gone));
    if (uncertain > 0) said.push(sentence(UNCONFIRMED[write], uncertain));
    // A Japanese or Chinese sentence ends in a full-width stop, with no space after it.
    this.showFailure(said.reduce((text, next) => text + (text && !/[。！？]$/.test(text) ? ' ' : '') + next, ''));
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
      const { total, done, failed, uncertain = 0, deletedPaths = [] } = await contactsService.bulkDeleteContacts(pathsToDelete);

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
        this.reportRefusals('contacts.deleteFailed', 'contacts.deleteOneFailed', { count: failed - uncertain, total, uncertain }, 'delete');
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
    const ownsWork = this.contactWorkOwner();
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

      const { total, failed, uncertain = 0, etags, gonePaths = [] } = await contactsService.bulkUpdateCategories(contactsToModify);
      if (!ownsWork()) return;
      this.contacts = [...this.contacts]; // Trigger re-render
      this.applyETags(etags);
      if (failed > 0) {
        this.fetchContacts();
        this.reportRefusals('contacts.categoryUpdateFailed', 'contacts.categoryUpdateOneFailed', { count: failed - uncertain, total, uncertain, gone: gonePaths.length });
        this.dropGone(gonePaths);
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
      if (!ownsWork()) return;
      console.error('Error updating categories', e);
      // The bulk update threw before reporting any outcome, so none of the
      // cards can be counted as done. Without numbers the toast showed its
      // own "{failed} of {total}" placeholders.
      this.reportRefusals('contacts.categoryUpdateFailed', 'contacts.categoryUpdateOneFailed', { count: pathsToUpdate.length, total: pathsToUpdate.length });
    } finally {
      if (ownsWork()) this.saving = false;
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
    // The handle is on the list's inline end: dragging it left widens the
    // list in a right-to-left interface.
    const inlineDirection = getComputedStyle(this).direction === 'rtl' ? -1 : 1;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = (moveEvent.clientX - startX) * inlineDirection;
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
          this.sidebarWidth = Math.min(Math.max(newWidth, SIDEBAR_WIDTH_MIN), 500);
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
            ${this.listError ? html`<alps-banner variant="error">${this.i18nStore?.t(this.listError)}</alps-banner>` : ''}
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
