import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchWithTimeout } from '../utils/fetch-utils';
import '../components/folder-list';
import '../components/message-list';
import '../components/message-reader';
import '../components/ui-confirm.js';
import '../components/app-header';
import '../components/alps-sidebar';
import { consume } from '@lit/context';
import { composeContext, ComposeStore } from '../store/compose-store';
import { messageSync } from '../services/message-sync';
import { messageOperations } from '../services/message-operations';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { FLAG_SEEN, FLAG_FLAGGED, FLAG_DRAFT } from '../utils/flags';
import { FOLDER_INBOX, FOLDER_ARCHIVE, FOLDER_JUNK, FOLDER_SPAM, FOLDER_TRASH, FOLDER_DRAFTS } from '../utils/folders';
import type { LayoutMode, DensityMode } from '../store/settings-store';
import '../components/alps-initial-loader';
import { Logger } from '../utils/logger';

const UNDO_TOAST_TIMEOUT_MS = 10000;

const SIDEBAR_WIDTH_DEFAULT = 250;
const SIDEBAR_WIDTH_MIN = 150;
const SIDEBAR_WIDTH_MAX = 500;
const SIDEBAR_WIDTH_COLLAPSED = 64;
const SIDEBAR_COLLAPSE_THRESHOLD = 120;
const MESSAGE_LIST_WIDTH_MIN = 380;
const MESSAGE_READER_WIDTH_MIN = 300;
const HEADER_HEIGHT = 57;
const HORIZONTAL_LIST_HEIGHT_MIN = 150;
const HORIZONTAL_LIST_HEIGHT_DEFAULT = 250;

@customElement('mailbox-page')
export class MailboxPage extends LitElement {
  @consume({ context: composeContext })
  composeStore!: ComposeStore;

  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @state() private showDeleteConfirm = false;
  @state() private pendingDeleteDetails: any = null;

  private markReadTimer: ReturnType<typeof setTimeout> | null = null;
  private notificationSound = new Audio('/assets/notify.wav');
  private audioUnlocked = false;

  private unlockAudio = () => {
    if (this.audioUnlocked) return;
    this.notificationSound.volume = 0;
    this.notificationSound.play().then(() => {
      this.notificationSound.pause();
      this.notificationSound.currentTime = 0;
      this.notificationSound.volume = 1;
      this.audioUnlocked = true;
    }).catch(() => {});
    
    document.removeEventListener('click', this.unlockAudio);
    document.removeEventListener('keydown', this.unlockAudio);
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
      font-size: 14px;
    }
    
    svg {
      width: 1em;
      height: 1em;
      fill: currentColor;
    }
    
    /* Layout Configurations */
    .app-container {
      display: flex;
      flex: 1;
      min-height: 0;
      width: 100%;
      position: relative;
    }

    /* Vertical: Sidebar (250px) | Message List (min 300px) | Reader (flex) */
    .layout-vertical alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${SIDEBAR_WIDTH_DEFAULT}px); flex-shrink: 0; }
    .layout-vertical .main-view { flex: 1; display: flex; flex-direction: row; min-width: 0; }
    .layout-vertical .message-list-pane { width: ${MESSAGE_LIST_WIDTH_MIN}px; flex-shrink: 0; border-right: 1px solid var(--border-color); }
    .layout-vertical .message-reader-pane { flex: 1; min-width: 0; }

    /* Horizontal: Sidebar (250px) | [ Message List (50%) / Reader (50%) ] */
    .layout-horizontal alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${SIDEBAR_WIDTH_DEFAULT}px); flex-shrink: 0; }
    .layout-horizontal .main-view { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .layout-horizontal .message-list-pane { flex-shrink: 0; border-bottom: 1px solid var(--border-color); }
    .layout-horizontal .message-reader-pane { flex: 1; min-height: 0; }

    /* Full: Sidebar (250px) | Message List OR Reader */
    .layout-full alps-sidebar.desktop-sidebar { width: var(--sidebar-width, ${SIDEBAR_WIDTH_DEFAULT}px); flex-shrink: 0; }
    .layout-full .main-view { flex: 1; display: flex; min-width: 0; }
    .layout-full .message-list-pane { flex: 1; min-width: 0; }
    .layout-full .message-reader-pane { flex: 1; min-width: 0; }
    .layout-full.reading .message-list-pane { display: none; }
    .layout-full:not(.reading) .message-reader-pane { display: none; }

    .pane {
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      padding: 0;
    }
    
    .resizer {
      background: transparent;
      position: relative;
      z-index: 25;
      flex-shrink: 0;
    }

    .resizer::after {
      content: '';
      position: absolute;
      background: transparent;
      transition: background 0.2s;
    }

    .layout-vertical .resizer {
      width: 4px;
      margin: 0 -2px;
      cursor: col-resize;
    }

    .layout-vertical .resizer::after {
      width: 3px;
      top: 0;
      bottom: 0;
      left: 1px;
    }

    .layout-horizontal .resizer {
      height: 4px;
      margin: -2px 0;
      cursor: row-resize;
    }

    .layout-horizontal .resizer::after {
      height: 3px;
      left: 0;
      right: 0;
      top: 1px;
    }

    .resizer:hover, .resizer.dragging {
      z-index: 9999;
    }

    .resizer:hover::after, .resizer.dragging::after {
      background: var(--accent-color, #005A9E);
    }



    .app-container.dragging {
      user-select: none;
      pointer-events: none;
    }
    

    alps-sidebar.desktop-sidebar {
      transition: width 0.2s, z-index 0s 0.2s;
      position: relative;
      z-index: 20;
    }

    alps-sidebar.desktop-sidebar[collapsed]:hover {
      transition: width 0.2s, z-index 0s 0s;
    }

    .app-container.dragging alps-sidebar.desktop-sidebar {
      transition: none;
    }



    .app-container.collapsed {
      --sidebar-width: ${SIDEBAR_WIDTH_COLLAPSED}px;
    }

    .app-container.collapsed .message-list-pane {
      box-shadow: rgba(95, 95, 95, 0.1) -4px 0 4px -2px;
      z-index: 25;
      border-left: 1px solid var(--border-color);
    }



    `;

  @state() private mailboxes: any[] = [];
  @state() private messages: any[] = [];
  @state() private currentMailbox = FOLDER_INBOX;
  @state() private loadingMessages = true;
  @state() private showInitialLoader = !(window as any).alpsAppLoaded;
  @state() private selectedMessage: any = null;
  @state() private selectedUids = new Set<string>();

  @state() private layoutMode: LayoutMode = 'vertical';
  @state() private filterQuery = '';
  @state() private expandedFolders = new Set<string>([FOLDER_INBOX]);
  @state() private username = '';
  @state() private currentPage = 0;
  @state() private totalMessages = 0;
  @state() private messagesPerPage = 50;
  @state() private resizerPositionX = SIDEBAR_WIDTH_DEFAULT + Math.max(MESSAGE_LIST_WIDTH_MIN, (window.innerWidth - SIDEBAR_WIDTH_DEFAULT) * 0.4);
  @state() private listHeight = Math.max(HORIZONTAL_LIST_HEIGHT_DEFAULT, (window.innerHeight - HEADER_HEIGHT) * 0.4);
  @state() private isSidebarDragging = false;
  @state() private isPaneDragging = false;
  @state() private sidebarWidth = SIDEBAR_WIDTH_DEFAULT;
  @state() private isSidebarHovered = false;
  private hoverTimeout: any = null;
  @state() private densityMode: DensityMode = 'compact';
  @state() private isSyncing = false;
  @state() private sidebarCollapsed = false;
  @state() private suppressSidebarHover = false;
  @state() private sortOrder: 'asc' | 'desc' = 'desc';
  @state() private listScrolled = false;
  @state() private targetUid: string | null = null;

  @state() private isMobile = window.innerWidth <= 768;
  @state() private mobileSidebarOpen = false;

  @state() private bulkProcessing = false;

  private _mql = window.matchMedia('(max-width: 768px)');

  private showGlobalToast(message: string, actionLabel = '', actionFn?: () => void, duration = 3000) {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message, actionLabel, actionFn, duration }
    }));
  }

  private get effectiveListWidth() {
    const sidebarW = (this.sidebarCollapsed && !this.isMobile) ? SIDEBAR_WIDTH_COLLAPSED : this.sidebarWidth;
    return Math.max(MESSAGE_LIST_WIDTH_MIN, this.resizerPositionX - sidebarW);
  }

  private get allSelectedStarred() {
    if (this.selectedUids.size === 0) return false;
    for (const uid of this.selectedUids) {
      const msg = this.messages.find(m => String(m.UID) === uid);
      if (!msg || !msg.Flags?.includes(FLAG_FLAGGED)) {
        return false;
      }
    }
    return true;
  }

  private get commonSelectedTags() {
    if (this.selectedUids.size === 0) return [];
    const allLabels = ['$label1', '$label2', '$label3', '$label4', '$label5'];
    return allLabels.filter(label => {
      for (const uid of this.selectedUids) {
        const msg = this.messages.find(m => String(m.UID) === uid);
        if (!msg || !msg.Flags?.some((f: string) => f.toLowerCase() === label.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }

  private get allSelectedUnread() {
    if (this.selectedUids.size === 0) return false;
    for (const uid of this.selectedUids) {
      const msg = this.messages.find(m => String(m.UID) === uid);
      if (msg && msg.Flags?.includes(FLAG_SEEN)) {
        return false;
      }
    }
    return true;
  }

  private _handleMediaQuery = (e: MediaQueryListEvent | MediaQueryList) => {
    this.isMobile = e.matches;
    if (!this.isMobile) {
      this.mobileSidebarOpen = false;
    }
  };

  connectedCallback() {
    super.connectedCallback();
    this.extractMailboxFromHash();
    window.addEventListener('hashchange', this.handleHashChange);

    document.addEventListener('click', this.unlockAudio);
    document.addEventListener('keydown', this.unlockAudio);

    this._mql.addEventListener('change', this._handleMediaQuery);
    this._handleMediaQuery(this._mql);

    this.settingsStore.addEventListener('change', this._handleSettingsChange);
    this._syncSettings();

    messageSync.addEventListener('sync-start', this.handleSyncStart);
    messageSync.addEventListener('sync-success', this.handleSyncSuccess);
    messageSync.addEventListener('sync-error', this.handleSyncError);
    messageSync.addEventListener('mailbox-not-found', this.handleMailboxNotFound as EventListener);

    window.addEventListener('draft-autosaved', this.handleDraftAutosaved as EventListener);

    messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this.handleHashChange);
    this._mql.removeEventListener('change', this._handleMediaQuery);
    
    document.removeEventListener('click', this.unlockAudio);
    document.removeEventListener('keydown', this.unlockAudio);

    this.settingsStore.removeEventListener('change', this._handleSettingsChange);
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);

    messageSync.removeEventListener('sync-start', this.handleSyncStart);
    messageSync.removeEventListener('sync-success', this.handleSyncSuccess);
    messageSync.removeEventListener('sync-error', this.handleSyncError);
    messageSync.removeEventListener('mailbox-not-found', this.handleMailboxNotFound as EventListener);
    window.removeEventListener('draft-autosaved', this.handleDraftAutosaved as EventListener);
    messageSync.stop();
  }

  private handleDraftAutosaved = (e: CustomEvent) => {
    const { oldUid, newUid, mailbox, subject, hasAttachments, size } = e.detail;
    if (this.currentMailbox === mailbox && this.messages) {
      const parsedNewUid = Number(newUid);
      let found = false;

      if (oldUid) {
        const idx = this.messages.findIndex(m => String(m.UID) === String(oldUid));
        if (idx !== -1) {
          const updated = [...this.messages];
          updated[idx] = {
            ...updated[idx],
            UID: parsedNewUid,
            Size: size || updated[idx].Size,
            RFC822Size: size || updated[idx].RFC822Size,
            HasAttachments: hasAttachments,
            _isAutosaveUpdate: true,
            Envelope: {
              ...updated[idx].Envelope,
              Subject: subject || updated[idx].Envelope?.Subject || '(No subject)'
            }
          };
          this.messages = updated;
          found = true;

          // Preserve active message selection
          if (this.selectedMessage && String(this.selectedMessage.UID) === String(oldUid)) {
            this.selectedMessage = updated[idx];
            this.targetUid = String(parsedNewUid);

            // Silently update the hash so a page reload opens the new draft, without triggering a re-render
            let currentHash = window.location.hash;
            if (currentHash.includes(`/${oldUid}`)) {
              currentHash = currentHash.replace(`/${oldUid}`, `/${parsedNewUid}`);
            } else if (currentHash.includes(`uid=${oldUid}`)) {
              currentHash = currentHash.replace(`uid=${oldUid}`, `uid=${parsedNewUid}`);
            }
            window.history.replaceState(null, '', currentHash);
          }
        }
      }

      if (!found) {
        const draftName = this.settingsStore?.getState().name || this.username;
        const draftEmailParts = (this.username || '').split('@');
        const draftMailboxStr = draftEmailParts[0] || '';
        const draftHostStr = draftEmailParts[1] || '';

        // If the draft was completely new or the old UID was out of sync, insert it at the top
        const newDraft = {
          UID: parsedNewUid,
          Size: size || 0,
          RFC822Size: size || 0,
          HasAttachments: hasAttachments,
          Flags: [FLAG_SEEN, FLAG_DRAFT],
          _isAutosaveUpdate: true,
          Envelope: {
            Subject: subject || '(No subject)',
            Date: new Date().toISOString(),
            From: [{ Name: draftName, Mailbox: draftMailboxStr, Host: draftHostStr }]
          }
        };
        // Also remove any existing draft with the same oldUid if it exists but wasn't caught
        const filtered = this.messages.filter(m => String(m.UID) !== String(oldUid) && String(m.UID) !== String(newUid));
        this.messages = [newDraft, ...filtered];
      }
    }
  };

  private _handleSettingsChange = () => {
    this._syncSettings();
  };

  private _handleI18nChange = () => {
    this.requestUpdate();
  };

  private _syncSettings() {
    const state = this.settingsStore.getState();
    this.layoutMode = state.layoutMode;
    this.densityMode = state.densityMode;
    this.sortOrder = state.sortOrder || 'desc';

    if (this.sidebarCollapsed !== state.sidebarCollapsed) {
      this.sidebarCollapsed = state.sidebarCollapsed;
    }

    if (state.messagesPerPage && state.messagesPerPage > 0) {
      this.messagesPerPage = state.messagesPerPage;
    }

    // Restart background polling with the configured interval
    if (state.checkMailInterval !== undefined) {
      messageSync.start(state.checkMailInterval);
    }
  }

  private handleSyncStart = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    this.isSyncing = true;
    if (!detail.background) {
      this.loadingMessages = true;
    }
  };

  private handleSyncSuccess = (e: Event) => {
    this.isSyncing = false;
    const { data, background } = (e as CustomEvent).detail;

    if (data.Username) {
      this.username = data.Username;
      if (this.settingsStore.getState().loginUsername !== data.Username) {
        this.settingsStore.updateSettings({ loginUsername: data.Username });
      }
    }

    let isInitialLoad = this.mailboxes.length === 0;
    let soundTriggered = false;
    let notificationTriggered = false;
    let totalNewInboxMessages = 0;

    if (data.Mailboxes) {
      for (const mb of data.Mailboxes) {
        const mbName = mb.Name || mb.Mailbox;
        const oldMb = this.mailboxes.find((m: any) => (m.Name || m.Mailbox) === mbName);
        const prevTotal = oldMb ? oldMb.Total : undefined;
        
        if (prevTotal !== undefined && mb.Total !== undefined && mb.Total > prevTotal) {
          if (!isInitialLoad && background) {
            soundTriggered = true;
            if (mbName.toUpperCase() === 'INBOX') {
              notificationTriggered = true;
              totalNewInboxMessages += (mb.Total - prevTotal);
            }
          }
        }
      }
      this.mailboxes = data.Mailboxes;
    }

    if (soundTriggered && this.settingsStore.getState().soundNotifications) {
      this.notificationSound.currentTime = 0;
      this.notificationSound.play().catch(e => {
        if (e.name !== 'NotAllowedError') {
          Logger.error('Failed to play sound notification:', e);
        }
      });
    }

    if (notificationTriggered && this.settingsStore.getState().desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
      const title = this.i18nStore?.t('mailboxPage.newMessages');
      let body = totalNewInboxMessages === 1
        ? (this.i18nStore?.t('mailboxPage.newMessagesSingleBody'))
        : ((this.i18nStore?.t('mailboxPage.newMessagesMultiBody')).replace('{count}', String(totalNewInboxMessages)));

      try {
        const notification = new Notification(title, {
          body: body,
          icon: '/apple-touch-icon.png',
          tag: 'alps-new-message'
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
          if (this.currentMailbox !== 'INBOX') {
            this.updateUrl('INBOX', 0, null);
          } else {
            this.currentPage = 0;
            messageSync.fetch(this.currentMailbox, 0, this.filterQuery, false);
          }
        };
      } catch (e) {
        Logger.error('Failed to show desktop notification:', e);
      }
    }

    if (notificationTriggered && this.currentMailbox !== 'INBOX') {
      this.showGlobalToast(
        this.i18nStore?.t('mailboxPage.newMessagesInInbox'), 
        this.i18nStore?.t('mailboxPage.open'), 
        () => {
          this.updateUrl('INBOX', 0, null);
        }, 
        5000
      );
    }

    if (background && this.currentPage > 0) {
      if (data.Total !== undefined && data.Total !== this.totalMessages) {
        this.showGlobalToast(
          this.i18nStore?.t('mailboxPage.newMessagesAvailable'), 
          this.i18nStore?.t('mailboxPage.refresh'), 
          () => {
            this.currentPage = 0;
            messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, false);
          }
        );
      }
      // Do NOT update this.messages, this.totalMessages, or this.currentPage
    } else {
      if (data.Page !== undefined) this.currentPage = data.Page;
      if (data.Total !== undefined) this.totalMessages = data.Total;
      if (data.MessagesPerPage !== undefined) this.messagesPerPage = data.MessagesPerPage;
      if (data.Messages) {
        this.messages = data.Messages;
        if (this.selectedMessage) {
          const updatedMsg = this.messages.find((m: any) => String(m.UID) === String(this.selectedMessage.UID));
          if (updatedMsg && updatedMsg.Flags) {
            this.selectedMessage = { ...this.selectedMessage, Flags: updatedMsg.Flags };
          }
        }
      } else {
        this.messages = [];
      }

    }

    if (!background) {
      this.loadingMessages = false;
      this.applyTargetUid();
      
      if (this.showInitialLoader) {
        setTimeout(() => {
          this.showInitialLoader = false;
          (window as any).alpsAppLoaded = true;
        }, 100);
      }
    }
  };

  private handleSyncError = (e: Event) => {
    this.isSyncing = false;
    const { background } = (e as CustomEvent).detail;
    if (!background) {
      this.loadingMessages = false;
    }
  };

  private handleMailboxNotFound = () => {
    this.showGlobalToast(this.i18nStore.t('mailboxPage.mailboxNotFound'), '', undefined, 3000);
    this.updateUrl(FOLDER_INBOX, 0, null, null);
  };

  private handleHashChange = () => {
    const oldMailbox = this.currentMailbox;
    const oldPage = this.currentPage;
    const oldUid = this.targetUid;
    const oldFilter = this.filterQuery;

    this.extractMailboxFromHash();

    if (oldMailbox !== this.currentMailbox || oldPage !== this.currentPage || oldFilter !== this.filterQuery) {
      if (oldMailbox !== this.currentMailbox) {
        this.selectedMessage = null; // Reset selection on mailbox change
        this.currentPage = 0; // Reset pagination on mailbox change
        this.selectedUids = new Set(); // Reset selection on mailbox change

        // Do not clear this.messages to prevent UI flash, let it be replaced when network returns
        this.loadingMessages = true; // Show loading immediately
      } else if (oldFilter !== this.filterQuery) {
        // Do not clear this.messages
        this.loadingMessages = true;
        this.currentPage = 0;
      }
      messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, false);
    } else if (oldUid !== this.targetUid) {
      this.applyTargetUid();
    }
  };

  private startResize = (e: MouseEvent) => {
    e.preventDefault();
    this.isPaneDragging = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (this.layoutMode === 'vertical') {
        const sidebarW = this.sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : this.sidebarWidth;
        const newX = Math.max(sidebarW + MESSAGE_LIST_WIDTH_MIN, Math.min(moveEvent.clientX, window.innerWidth - MESSAGE_READER_WIDTH_MIN));
        this.resizerPositionX = newX;
      } else if (this.layoutMode === 'horizontal') {
        this.listHeight = Math.max(HORIZONTAL_LIST_HEIGHT_MIN, Math.min(moveEvent.clientY - HEADER_HEIGHT, window.innerHeight - HORIZONTAL_LIST_HEIGHT_MIN));
      }
    };

    const onMouseUp = () => {
      this.isPaneDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  private openFolderPrompt() {
    const folderList = this.shadowRoot?.querySelector('alps-folder-list') as any;
    if (folderList && typeof folderList.triggerCreateFolder === 'function') {
      folderList.triggerCreateFolder();
    }
  }

  private updateUrl(mailbox: string, page: number, uid: string | null, filterQuery: string | null = this.filterQuery) {
    let hash = `#/mailbox/${encodeURIComponent(mailbox)}`;
    const params = new URLSearchParams();
    if (page > 0) {
      params.set('p', page.toString());
    }
    if (uid) {
      params.set('uid', uid);
    }
    if (filterQuery) {
      params.set('q', filterQuery);
    }
    const qs = params.toString();
    if (qs) {
      hash += '?' + qs;
    }
    window.location.hash = hash;
  }

  private extractMailboxFromHash() {
    let hash = window.location.hash;
    if (hash.startsWith('#/mailbox/')) {
      let pathPart = hash.substring(10);
      const qIndex = pathPart.indexOf('?');
      let queryString = '';
      if (qIndex !== -1) {
        queryString = pathPart.substring(qIndex + 1);
        pathPart = pathPart.substring(0, qIndex);
      }

      const parts = pathPart.split('/');
      this.currentMailbox = decodeURIComponent(parts[0]);

      const params = new URLSearchParams(queryString);

      if (parts.length > 1 && parts[1]) {
        this.targetUid = parts[1];
      } else {
        this.targetUid = params.get('uid') || null;
      }

      const pageParam = params.get('p');
      if (pageParam) {
        this.currentPage = parseInt(pageParam, 10) || 0;
      } else {
        this.currentPage = 0;
      }
      this.filterQuery = params.get('q') || '';
    } else {
      this.currentMailbox = FOLDER_INBOX;
      this.targetUid = null;
      this.currentPage = 0;
    }
  }

  private async applyTargetUid() {
    if (!this.targetUid) {
      if (this.markReadTimer) {
        clearTimeout(this.markReadTimer);
        this.markReadTimer = null;
      }
      this.selectedMessage = null;
      return;
    }

    const currentTargetUid = this.targetUid;
    let msg = this.messages.find(m => String(m.UID) === currentTargetUid);

    // If the message is not on the current page (e.g. it shifted or we changed pages),
    // fetch its metadata directly from the backend so the reader can still display it.
    if (!msg && this.messages.length > 0) {
      try {
        const metadataRes = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(this.currentMailbox)}/messages/${currentTargetUid}`);
        if (metadataRes.ok) {
          const data = await metadataRes.json();
          if (data.Message) {
            msg = data.Message;
          }
        }
      } catch (err) {
        Logger.error('Failed to fetch shifted message:', err);
      }
    }

    // Prevent race conditions if the user clicked another message while we were fetching
    if (this.targetUid !== currentTargetUid) return;

    if (msg) {
      if (this.selectedMessage?.UID !== msg.UID) {
        this.selectedMessage = msg;
        if (this.layoutMode === 'full') {
          this.expandedFolders.clear();
        }
        this._scheduleMarkAsRead(msg);
      }
    } else {
      if (this.messages.length > 0) {
        this.selectedMessage = null;
        this.updateUrl(this.currentMailbox, this.currentPage, null);
      }
    }
  }



  private async selectMessage(msg: any) {
    this.updateUrl(this.currentMailbox, this.currentPage, msg.UID);
  }

  private _scheduleMarkAsRead(msg: any) {
    if (this.markReadTimer) {
      clearTimeout(this.markReadTimer);
      this.markReadTimer = null;
    }

    if (msg.Flags?.includes(FLAG_SEEN)) return;

    const timeoutSec = this.settingsStore?.getState().markReadTimeout ?? 0;
    if (timeoutSec < 0) return; // Never mark as read automatically

    if (timeoutSec === 0) {
      this._doMarkAsRead(msg);
    } else {
      this.markReadTimer = setTimeout(() => {
        this._doMarkAsRead(msg);
      }, timeoutSec * 1000);
    }
  }

  private updateLocalMessageFlags(uids: string[], flag: string, action: 'add' | 'remove') {
    let updated = false;
    const newMessages = [...this.messages];
    for (let i = 0; i < newMessages.length; i++) {
      const msg = newMessages[i];
      if (uids.includes(String(msg.UID))) {
        const hasFlag = msg.Flags && msg.Flags.includes(flag);
        if (action === 'add' && !hasFlag) {
          newMessages[i] = { ...msg, Flags: [...(msg.Flags || []), flag] };
          updated = true;
        } else if (action === 'remove' && hasFlag) {
          newMessages[i] = { ...msg, Flags: msg.Flags.filter((f: string) => f !== flag) };
          updated = true;
        }
      }
    }
    if (updated) {
      this.messages = newMessages;
      if (this.selectedMessage && uids.includes(String(this.selectedMessage.UID))) {
        const hasFlag = this.selectedMessage.Flags && this.selectedMessage.Flags.includes(flag);
        if (action === 'add' && !hasFlag) {
          this.selectedMessage.Flags = [...(this.selectedMessage.Flags || []), flag];
        } else if (action === 'remove' && hasFlag) {
          this.selectedMessage.Flags = this.selectedMessage.Flags.filter((f: string) => f !== flag);
        }
        this.selectedMessage = { ...this.selectedMessage };
      }
    }
  }

  private async _handleListToggleStar(e: CustomEvent) {
    const msg = e.detail.message;
    const isStarred = msg.Flags && msg.Flags.includes(FLAG_FLAGGED);
    const action = isStarred ? 'remove' : 'add';

    // Optimistic UI update
    this.updateLocalMessageFlags([String(msg.UID)], FLAG_FLAGGED, action);

    try {
      const success = await messageOperations.setFlag(this.currentMailbox, [String(msg.UID)], [FLAG_FLAGGED], action);
      if (!success) {
        // Revert on failure
        this.updateLocalMessageFlags([String(msg.UID)], FLAG_FLAGGED, isStarred ? 'add' : 'remove');
      }
    } catch (err) {
      // Revert on failure
      this.updateLocalMessageFlags([String(msg.UID)], FLAG_FLAGGED, isStarred ? 'add' : 'remove');
    }
  }

  private async _doMarkAsRead(msg: any) {
    if (this.selectedMessage?.UID === msg.UID) {
      this.selectedMessage = await messageOperations.markAsRead(this.currentMailbox, msg);
      this.updateLocalMessageFlags([String(this.selectedMessage.UID)], FLAG_SEEN, 'add');
    } else {
      const newMsg = await messageOperations.markAsRead(this.currentMailbox, msg);
      if (newMsg && newMsg.UID) {
        this.updateLocalMessageFlags([String(newMsg.UID)], FLAG_SEEN, 'add');
      }
    }
  }

  private async _handleReaderAction(e: CustomEvent) {
    const action = e.detail.action;
    const isBulk = this.selectedUids && this.selectedUids.size > 0;
    const uidsArray = isBulk ? Array.from(this.selectedUids) : [];

    if (!isBulk && !this.selectedMessage?.UID) return;

    if (isBulk) this.bulkProcessing = true;

    try {
      const currentMsg = this.selectedMessage;
      const originalMailbox = this.currentMailbox;

      if (action === 'star') {
        if (isBulk) {
          const op = this.allSelectedStarred ? 'remove' : 'add';
          await messageOperations.setFlag(this.currentMailbox, uidsArray, [FLAG_FLAGGED], op);
          this.updateLocalMessageFlags(uidsArray, FLAG_FLAGGED, op);
        } else {
          this.selectedMessage = await messageOperations.toggleStar(this.currentMailbox, this.selectedMessage);
          this.updateLocalMessageFlags([String(this.selectedMessage.UID)], FLAG_FLAGGED, this.selectedMessage.Flags?.includes(FLAG_FLAGGED) ? 'add' : 'remove');
        }
      } else if (action === 'addTag' || action === 'removeTag') {
        const tags = e.detail.tags || (e.detail.folder ? [e.detail.folder] : []);
        if (!tags || tags.length === 0) return;
        const op = action === 'addTag' ? 'add' : 'remove';
        if (isBulk) {
          await messageOperations.setFlag(this.currentMailbox, uidsArray, tags, op);
          for (const t of tags) this.updateLocalMessageFlags(uidsArray, t, op);
        } else {
          await messageOperations.setFlag(this.currentMailbox, [String(currentMsg.UID)], tags, op);
          for (const t of tags) this.updateLocalMessageFlags([String(currentMsg.UID)], t, op);
        }
        this.requestUpdate();
      } else if (action === 'markUnread') {
        if (isBulk) {
          const op = this.allSelectedUnread ? 'add' : 'remove';
          await messageOperations.setFlag(this.currentMailbox, uidsArray, [FLAG_SEEN], op);
          this.updateLocalMessageFlags(uidsArray, FLAG_SEEN, op);
        } else {
          const isUnread = !currentMsg?.Flags || !currentMsg.Flags.includes(FLAG_SEEN);
          if (isUnread) {
            this.selectedMessage = await messageOperations.markAsRead(this.currentMailbox, currentMsg);
            this.updateLocalMessageFlags([String(this.selectedMessage.UID)], FLAG_SEEN, 'add');
          } else {
            const success = await messageOperations.markAsUnread(this.currentMailbox, currentMsg);
            if (success) {
              this.updateLocalMessageFlags([String(currentMsg.UID)], FLAG_SEEN, 'remove');
              this.selectedMessage = null;
              this.updateUrl(this.currentMailbox, this.currentPage, null);
            }
          }
        }
      } else if (action === 'delete' || action === 'archive' || action === 'reportSpam' || action === 'notSpam') {
        const isTrash = this.currentMailbox.toLowerCase() === FOLDER_TRASH.toLowerCase();
        const isDrafts = this.currentMailbox.toLowerCase() === FOLDER_DRAFTS.toLowerCase();
        const isSpam = this.currentMailbox.toLowerCase() === FOLDER_JUNK.toLowerCase() || this.currentMailbox.toLowerCase() === FOLDER_SPAM.toLowerCase();
        let moveResult: { success: boolean, uidMapping?: Record<string, string> } = { success: false };
        let destinationFolder = FOLDER_TRASH;
        if (action === 'archive') destinationFolder = FOLDER_ARCHIVE;
        if (action === 'reportSpam') destinationFolder = FOLDER_JUNK;
        if (action === 'notSpam') destinationFolder = FOLDER_INBOX;

        if (action === 'delete' && (isTrash || isDrafts || isSpam)) {
          this.pendingDeleteDetails = {
            isBulk,
            uidsArray,
            currentMsgUid: currentMsg?.UID,
            isTrash,
            isDrafts,
            isSpam
          };
          this.showDeleteConfirm = true;
          return;
        } else {
          if (isBulk) {
            moveResult = await messageOperations.moveMessages(this.currentMailbox, uidsArray, destinationFolder);
          } else {
            moveResult = await messageOperations.moveMessages(this.currentMailbox, [String(currentMsg.UID)], destinationFolder);
          }
        }

        if (moveResult.success) {
          if (isBulk) {
            this.selectedUids = new Set();
            this.selectedMessage = null;
            this.updateUrl(this.currentMailbox, this.currentPage, null);
            this.requestUpdate();
          } else {
            this.selectedMessage = null;
            this.updateUrl(this.currentMailbox, this.currentPage, null);
          }

          let toastMessage = '';
          let undoFn: (() => void) | undefined;

          if (action === 'archive') {
            toastMessage = isBulk 
              ? this.i18nStore?.t('toast.messagesMovedToArchive', { count: uidsArray.length }) 
              : this.i18nStore?.t('toast.messageMovedToArchive');
          } else if (action === 'reportSpam') {
            toastMessage = isBulk 
              ? this.i18nStore?.t('toast.messagesMovedToSpam', { count: uidsArray.length }) 
              : this.i18nStore?.t('toast.messageMovedToSpam');
          } else if (action === 'notSpam') {
            toastMessage = isBulk 
              ? this.i18nStore?.t('toast.messagesMovedToInbox', { count: uidsArray.length }) 
              : this.i18nStore?.t('toast.messageMovedToInbox');
          } else {
            toastMessage = isBulk 
              ? this.i18nStore?.t('toast.messagesMovedToTrash', { count: uidsArray.length }) 
              : this.i18nStore?.t('toast.messageMovedToTrash');
          }

          if (isBulk && moveResult.uidMapping) {
            const mappedUids = Object.values(moveResult.uidMapping);
            undoFn = async () => {
              try {
                const revertResult = await messageOperations.moveMessages(destinationFolder, mappedUids, originalMailbox);
                if (revertResult.success) {
                  if (this.currentMailbox === originalMailbox && revertResult.uidMapping) {
                    const newUids = new Set(this.selectedUids);
                    Object.values(revertResult.uidMapping).forEach(uid => newUids.add(uid));
                    this.selectedUids = newUids;
                    this.requestUpdate();
                  }
                }
              } catch (err) {
                Logger.error("Undo failed", err);
              }
            };
          } else if (!isBulk && moveResult.uidMapping?.[String(currentMsg.UID)]) {
            const movedMsgMock = { UID: moveResult.uidMapping[String(currentMsg.UID)] };
            undoFn = async () => {
              try {
                const revertResult = await messageOperations.moveMessages(destinationFolder, [String(movedMsgMock.UID)], originalMailbox);
                if (revertResult.success) {
                  const page = this.currentMailbox === originalMailbox ? this.currentPage : 0;
                  if (revertResult.uidMapping?.[String(movedMsgMock.UID)]) {
                    this.updateUrl(originalMailbox, page, revertResult.uidMapping[String(movedMsgMock.UID)]);
                  } else {
                    this.updateUrl(originalMailbox, page, null);
                  }
                }
              } catch (err) {
                Logger.error("Undo failed", err);
              }
            };
          }
          this.showGlobalToast(toastMessage, undoFn ? this.i18nStore?.t('mailboxPage.undo') : '', undoFn, UNDO_TOAST_TIMEOUT_MS);
        }
      } else if (action === 'moveTo' || action === 'copyTo') {
        const destinationFolder = e.detail.folder;
        if (!destinationFolder) return;

        const isMove = action === 'moveTo';

        let result: { success: boolean, uidMapping?: Record<string, string> } = { success: false };
        if (isMove) {
          if (isBulk) result = await messageOperations.moveMessages(this.currentMailbox, uidsArray, destinationFolder);
          else result = await messageOperations.moveMessages(this.currentMailbox, [String(currentMsg.UID)], destinationFolder);
        } else {
          if (isBulk) result = await messageOperations.copyMessages(this.currentMailbox, uidsArray, destinationFolder);
          else result = await messageOperations.copyMessages(this.currentMailbox, [String(currentMsg.UID)], destinationFolder);
        }

        if (result.success) {
          if (isMove) {
            if (isBulk) {
              this.selectedUids = new Set();
              this.selectedMessage = null;
              this.updateUrl(this.currentMailbox, this.currentPage, null);
              this.requestUpdate();
            } else {
              this.selectedMessage = null;
              this.updateUrl(this.currentMailbox, this.currentPage, null);
            }
          }
          let toastMessage = isMove 
            ? (isBulk ? this.i18nStore?.t('toast.messagesMovedToFolder', { count: uidsArray.length, folder: destinationFolder }) : this.i18nStore?.t('toast.messageMovedToFolder', { folder: destinationFolder }))
            : (isBulk ? this.i18nStore?.t('toast.messagesCopiedToFolder', { count: uidsArray.length, folder: destinationFolder }) : this.i18nStore?.t('toast.messageCopiedToFolder', { folder: destinationFolder }));
          let undoFn: (() => void) | undefined;

          if (isBulk && isMove && result.uidMapping) {
            const mappedUids = Object.values(result.uidMapping);
            undoFn = async () => {
              try {
                const revertResult = await messageOperations.moveMessages(destinationFolder, mappedUids, originalMailbox);
                if (revertResult.success) {
                  if (this.currentMailbox === originalMailbox && revertResult.uidMapping) {
                    const newUids = new Set(this.selectedUids);
                    Object.values(revertResult.uidMapping).forEach(uid => newUids.add(uid));
                    this.selectedUids = newUids;
                    this.requestUpdate();
                  }
                }
              } catch (err) {
                Logger.error("Undo failed", err);
              }
            };
          } else if (!isBulk && isMove && result.uidMapping?.[String(currentMsg.UID)]) {
            const movedMsgMock = { UID: result.uidMapping[String(currentMsg.UID)] };
            undoFn = async () => {
              try {
                const revertResult = await messageOperations.moveMessages(destinationFolder, [String(movedMsgMock.UID)], originalMailbox);
                if (revertResult.success) {
                  const page = this.currentMailbox === originalMailbox ? this.currentPage : 0;
                  if (revertResult.uidMapping?.[String(movedMsgMock.UID)]) {
                    this.updateUrl(originalMailbox, page, revertResult.uidMapping[String(movedMsgMock.UID)]);
                  } else {
                    this.updateUrl(originalMailbox, page, null);
                  }
                }
              } catch (err) {
                Logger.error("Undo failed", err);
              }
            };
          }
          this.showGlobalToast(toastMessage, undoFn ? this.i18nStore?.t('mailboxPage.undo') : '', undoFn, UNDO_TOAST_TIMEOUT_MS);
        }
      } else if (action === 'downloadMessage' && !isBulk) {
        const uid = currentMsg.UID;
        const url = `/mailboxes/${encodeURIComponent(this.currentMailbox)}/messages/${uid}/raw`;

        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (action === 'showOriginal' && !isBulk) {
        const url = `#/original?mailbox=${encodeURIComponent(this.currentMailbox)}&uid=${currentMsg.UID}`;
        window.open(url, '_blank');
      }
    } finally {
      if (isBulk) this.bulkProcessing = false;
    }
  }

  private async _confirmDelete() {
    this.showDeleteConfirm = false;
    const details = this.pendingDeleteDetails;
    this.pendingDeleteDetails = null;
    if (!details) return;

    const { isBulk, uidsArray, currentMsgUid, isDrafts } = details;
    if (isBulk) this.bulkProcessing = true;
    try {
      let success = false;
      if (isBulk) {
        success = await messageOperations.deleteMessages(this.currentMailbox, uidsArray);
      } else {
        success = await messageOperations.deleteMessages(this.currentMailbox, [String(currentMsgUid)]);
      }

      if (success) {
        if (isBulk) {
          this.selectedUids = new Set();
          this.selectedMessage = null;
          this.updateUrl(this.currentMailbox, this.currentPage, null);
          this.requestUpdate();
        } else {
          this.selectedMessage = null;
          this.updateUrl(this.currentMailbox, this.currentPage, null);
        }

        let toastMessage = '';
        if (isDrafts) {
          toastMessage = isBulk ? this.i18nStore?.t('toast.draftsDiscarded', { count: uidsArray.length }) : (this.i18nStore?.t('toast.draftDiscarded'));
        } else {
          toastMessage = isBulk ? this.i18nStore?.t('toast.messagesPermanentlyDeleted', { count: uidsArray.length }) : (this.i18nStore?.t('toast.messagePermanentlyDeleted'));
        }
        this.showGlobalToast(toastMessage, '', undefined, UNDO_TOAST_TIMEOUT_MS);
      }
    } finally {
      if (isBulk) this.bulkProcessing = false;
    }
  }

  private _cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteDetails = null;
  }

  private toggleFolder(folderPath: string, e: Event | null) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const newSet = new Set(this.expandedFolders);
    if (newSet.has(folderPath)) {
      newSet.delete(folderPath);
    } else {
      newSet.add(folderPath);
    }
    this.expandedFolders = newSet;
  }

  render() {
    const effectiveLayoutMode = this.isMobile ? 'full' : this.layoutMode;
    const isReadingFull = effectiveLayoutMode === 'full' && this.selectedMessage !== null;
    return html`
      <alps-initial-loader ?hidden=${!this.showInitialLoader}></alps-initial-loader>
      <app-header 
        .username=${this.username}
        .isMobile=${this.isMobile}
        .currentMailbox=${this.currentMailbox}
        .searchQuery=${this.filterQuery}
        .scrolled=${this.listScrolled}
        @toggle-sidebar=${() => this.mobileSidebarOpen = !this.mobileSidebarOpen}
        @compose=${() => this.composeStore.openComposer()}
        @search-submit=${(e: CustomEvent) => {
        const newFilter = e.detail.value;
        this.updateUrl(this.currentMailbox, 0, null, newFilter);
      }}
      ></app-header>
      <div class="app-container layout-${effectiveLayoutMode} ${isReadingFull ? 'reading' : ''} ${this.isPaneDragging || this.isSidebarDragging ? 'dragging' : ''} ${this.sidebarCollapsed && !this.isMobile ? 'collapsed' : ''} ${this.isMobile ? 'mobile-view' : ''} ${this.suppressSidebarHover ? 'suppress-sidebar-hover' : ''}" style="${!this.sidebarCollapsed && !this.isMobile ? `--sidebar-width: ${this.sidebarWidth}px;` : ''}">
        <alps-sidebar 
          class="${this.isMobile ? 'mobile-sidebar' : 'desktop-sidebar'} ${this.mobileSidebarOpen ? 'open' : ''}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
          .isHovered=${this.isSidebarHovered}
          .suppressHover=${this.suppressSidebarHover}
          .collapsed=${this.sidebarCollapsed && !this.isMobile}
          .width=${this.sidebarWidth}
          @sidebar-resize=${(e: CustomEvent) => {
            const newWidth = e.detail.newWidth;
            if (newWidth < SIDEBAR_COLLAPSE_THRESHOLD) {
              if (!this.sidebarCollapsed) this.settingsStore.updateSettings({ sidebarCollapsed: true });
              this.sidebarWidth = SIDEBAR_WIDTH_DEFAULT;
            } else {
              if (this.sidebarCollapsed) this.settingsStore.updateSettings({ sidebarCollapsed: false });
              this.sidebarWidth = Math.min(Math.max(newWidth, SIDEBAR_WIDTH_MIN), SIDEBAR_WIDTH_MAX);
              this.resizerPositionX = Math.max(this.resizerPositionX, this.sidebarWidth + MESSAGE_LIST_WIDTH_MIN);
            }
          }}
          @drag-start=${() => this.isSidebarDragging = true}
          @drag-end=${() => this.isSidebarDragging = false}
          @toggle-collapse=${() => this.settingsStore.updateSettings({ sidebarCollapsed: !this.sidebarCollapsed })}
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
            }, 300);
          }}
        >
          <alps-folder-list
            .mailboxes=${this.mailboxes}
            .currentMailbox=${this.currentMailbox}
            .expandedFolders=${this.expandedFolders}
            .layoutMode=${effectiveLayoutMode}
            .syncing=${this.isSyncing}
            ?collapsed=${this.sidebarCollapsed && !this.isMobile && !this.isSidebarHovered}
            @select-mailbox=${(e: CustomEvent) => {
        if (this.currentMailbox === e.detail.name) {
          this.currentPage = 0;
          this.selectedMessage = null;
          this.filterQuery = '';
          this.loadingMessages = true;
          this.updateUrl(e.detail.name, 0, null);
          messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, false);
        } else {
          // Do not clear this.messages to prevent UI flash
          this.loadingMessages = true; // Show loading immediately
          this.filterQuery = '';
          this.selectedUids = new Set();
          this.updateUrl(e.detail.name, 0, null);
        }
        if (!this.isMobile && !this.sidebarCollapsed) {
          this.settingsStore.updateSettings({ sidebarCollapsed: true });
        }
        if (this.sidebarCollapsed && !this.isMobile) {
          this.suppressSidebarHover = true;
        }
        if (this.isMobile) {
          this.mobileSidebarOpen = false;
        }
      }}
            @toggle-folder=${(e: CustomEvent) => this.toggleFolder(e.detail.folderName, null)}
            @expand-folder=${(e: CustomEvent) => {
        const newSet = new Set(this.expandedFolders);
        newSet.add(e.detail.folderName);
        this.expandedFolders = newSet;
      }}
            @compose=${() => {
        this.composeStore.openComposer();
        if (this.isMobile) {
          this.mobileSidebarOpen = false;
        }
      }}
            @toast=${(e: CustomEvent) => this.showGlobalToast(e.detail.message, e.detail.actionLabel, e.detail.actionFn, e.detail.duration)}
          ></alps-folder-list>
          <alps-icon-btn 
            slot="footer-actions"
            class="new-folder-btn"
            icon="folderPlus"
            title="${this.i18nStore?.t('folderList.createFolder')}"
            @click=${this.openFolderPrompt}
            style="--btn-padding: 8px; --icon-size: 20px;"
          ></alps-icon-btn>
        </alps-sidebar>
        <div class="main-view">
          <div class="pane message-list-pane" style="position: relative; ${effectiveLayoutMode === 'vertical' ? `width: ${this.effectiveListWidth}px; flex: none; ${this.isPaneDragging || this.isSidebarDragging ? '' : 'transition: width 0.2s;'}` : effectiveLayoutMode === 'horizontal' ? `height: ${this.listHeight}px; flex: none;` : ''}">

            <alps-message-list
              .messages=${this.messages}
              .currentMailbox=${this.currentMailbox}
              .sidebarCollapsed=${this.sidebarCollapsed && !this.isMobile}
              .loading=${this.loadingMessages}
              .selectedMessage=${this.selectedMessage}
              .selectedMessages=${this.selectedUids}
              .layoutMode=${effectiveLayoutMode}
              .isMobile=${this.isMobile}
              .currentPage=${this.currentPage}
              .totalMessages=${this.totalMessages}
              .messagesPerPage=${this.messagesPerPage}
              .densityMode=${this.densityMode}
              .filterQuery=${this.filterQuery}
              .sortOrder=${this.sortOrder}
              .syncing=${this.isSyncing}
              @refresh=${() => {
        this.currentPage = 0;

        messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, true);
      }}
              @toggle-sidebar=${() => this.mobileSidebarOpen = !this.mobileSidebarOpen}
              @compose=${() => this.composeStore.openComposer()}
              @select-message=${(e: CustomEvent) => this.selectMessage(e.detail.message)}
              @change-page=${(e: CustomEvent) => this.updateUrl(this.currentMailbox, e.detail.page, this.targetUid)}
              @list-scrolled=${(e: CustomEvent) => this.listScrolled = e.detail.scrolled}
              @toggle-sort=${async () => {
        const newOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        this.messages = [];
        this.loadingMessages = true;
        await this.settingsStore.updateSettings({ sortOrder: newOrder });
        this.currentPage = 0;
        messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, false);
      }}
              @toggle-filter-starred=${() => {
        const newFilter = this.filterQuery === 'is:starred' ? '' : 'is:starred';
        this.updateUrl(this.currentMailbox, 0, null, newFilter);
      }}
              @toggle-filter-unread=${() => {
        const newFilter = this.filterQuery === 'is:unread' ? '' : 'is:unread';
        this.updateUrl(this.currentMailbox, 0, null, newFilter);
      }}
              @clear-search=${() => this.updateUrl(this.currentMailbox, 0, null, '')}
              @selection-changed=${(e: CustomEvent) => this.selectedUids = e.detail.selectedUids}
              @toggle-star-message=${this._handleListToggleStar}
            ></alps-message-list>
          </div>
          ${effectiveLayoutMode !== 'full' ? html`
            <div class="resizer ${this.isPaneDragging ? 'dragging' : ''}" @mousedown=${this.startResize}></div>
          ` : ''}
          <div class="pane message-reader-pane">
            <alps-message-reader
              .mailboxes=${this.mailboxes}
              .mailbox=${this.currentMailbox}
              .message=${this.selectedMessage}
              .layoutMode=${effectiveLayoutMode}
              .selectedUids=${this.selectedUids}
              .allSelectedStarred=${this.allSelectedStarred}
              .allSelectedUnread=${this.allSelectedUnread}
              .commonTags=${this.commonSelectedTags}
              .bulkProcessing=${this.bulkProcessing}
              @close=${() => { this.updateUrl(this.currentMailbox, this.currentPage, null); }}
              @action=${this._handleReaderAction}
              @message-flags-changed=${(e: CustomEvent) => this.updateLocalMessageFlags([e.detail.uid], e.detail.flag, e.detail.action)}
            ></alps-message-reader>
          </div>
        </div>
      </div>
      ${this.showDeleteConfirm ? html`
        <ui-confirm
          title="${this.i18nStore?.t('mailboxPage.permanentlyDelete')}"
          message=${this.pendingDeleteDetails?.isBulk ? (this.i18nStore?.t('messageReader.deleteConfirmMultiple')) : (this.i18nStore?.t('messageReader.deleteConfirmSingle'))}
          confirmText=${this.i18nStore?.t('mailboxPage.deletePermanently')}
          cancelText=${this.i18nStore?.t('general.cancel')}
          .isDanger=${true}
          @confirm=${this._confirmDelete}
          @cancel=${this._cancelDelete}
        ></ui-confirm>
      ` : ''}
    `;
  }
}
