import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchWithTimeout } from '../utils/fetch-utils';
import '../components/folder-list';
import '../components/message-list';
import '../components/message-reader';
import type { MessageReader, ReaderActionDetail } from '../components/message-reader';
import '../components/ui-confirm.js';
import '../components/app-header';
import '../components/alps-sidebar';
import { consume } from '@lit/context';
import { composeContext, ComposeStore } from '../store/compose-store';
import { messageSync } from '../services/message-sync';
import { messageOperations, type FlagResult, type MoveResult } from '../services/message-operations';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { FLAG_SEEN, FLAG_FLAGGED, FLAG_DRAFT } from '../utils/flags';
import { FOLDER_INBOX, FOLDER_ARCHIVE, FOLDER_JUNK, FOLDER_TRASH, encodeMailboxPath, mailboxRoleByName, findMailboxNameByRole, mailboxDelimiter } from '../utils/folders';
import type { LayoutMode, DensityMode } from '../store/settings-store';
import '../components/alps-initial-loader';
import { Logger } from '../utils/logger';
import { getFlexContainerMinWidth } from '../utils/ui';
import { mailboxOf, messageKey, parseMessageKey, uidsByMailbox } from '../utils/message-key';

const UNDO_TOAST_TIMEOUT_MS = 10000;

/** Whether a listed message carries a star. */
const isFlagged = (msg: any): boolean => !!msg?.Flags?.includes(FLAG_FLAGGED);

/** The same flags, in the order the server lists them. */
const sameFlags = (a: string[] | undefined, b: string[] | undefined): boolean =>
  (a?.length ?? 0) === (b?.length ?? 0) && (a ?? []).every((flag, i) => flag === b![i]);

/**
 * Is this listing the one already on screen?
 *
 * Compared as JSON, rather than by the fields a row happens to draw today: an
 * answer that serialises the same is one the rows cannot tell apart, whatever
 * they read — subject, flags, attachment, thread members, the lot. The two
 * directions are not alike. Reading a difference that is only key order costs
 * a repaint, which is what happened anyway; missing a real one leaves the
 * folder painted wrong until the next change, so nothing here may guess.
 */
function sameListing(shown: any[], answer: any[]): boolean {
  if (shown === answer) return true;
  if (!shown || shown.length !== answer.length) return false;
  return JSON.stringify(shown) === JSON.stringify(answer);
}

/** A Delete waiting on the question whether to delete for good. */
interface PendingDelete {
  isBulk: boolean;
  /** Deleted for good, by key: in folders where a move to Trash changes nothing. */
  doomed: string[];
  /** Moved to Trash, by key: the rest of the same Delete. */
  toTrash: string[];
  isDrafts: boolean;
  /** A card's own Delete, of the message it names. */
  named?: { isOpen: boolean; nextUid?: string; done?: (ok: boolean) => void };
}

/** What one folder's move or copy answered, as {@link MailboxPage.eachFolder} reads it. */
type MoveOutcome = { ok: boolean; reason?: string; uidMapping: Record<string, string> };

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
  /** The last foreground listing failed; cleared when the next one starts. */
  @state() private listLoadFailed = false;
  @state() private pendingDeleteDetails: PendingDelete | null = null;

  private markReadTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Built on first use, never at construction. `new Audio(src)` starts fetching
   * at once, and this chime is ~400 kB of uncompressed WAV, downloaded on every
   * mailbox load for a sound that only plays when mail arrives. The autoplay
   * policy already wants the first play() inside a user gesture, which is where
   * unlockAudio builds it.
   */
  private notificationSound: HTMLAudioElement | null = null;

  private chime(): HTMLAudioElement {
    return (this.notificationSound ??= new Audio('/assets/notify.wav'));
  }
  private audioUnlocked = false;

  private unlockAudio = () => {
    if (this.audioUnlocked) return;
    // Nothing is played, not even muted, while the chime is switched off. This
    // ran on the first click whatever the setting said, and muting does not
    // silence it in every browser. The listeners stay, so switching the sound
    // on later unlocks it on the next gesture.
    if (!this.settingsStore.getState().soundNotifications) return;
    // Mute rather than zero the volume: iOS ignores assignments to
    // HTMLMediaElement.volume, so the unlock play() was audible there.
    const sound = this.chime();
    sound.muted = true;
    sound.play().then(() => {
      sound.pause();
      sound.currentTime = 0;
      this.audioUnlocked = true;
    }).catch(() => {}).finally(() => {
      // Restore even when play() rejects, so a failed unlock doesn't
      // leave real notifications silenced.
      sound.muted = false;
    });

    document.removeEventListener('click', this.unlockAudio);
    document.removeEventListener('keydown', this.unlockAudio);
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      width: 100vw;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
      font-size: 14px;
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

    .desktop-sidebar.open {
      display: flex;
    }

    .mobile-bulk-actions-container {
      display: flex;
      gap: 8px;
      align-items: center;
      width: 100%;
    }

    .header-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 4px;
    }

    .mobile-bulk-actions-count {
      font-weight: 600;
      margin-left: 8px;
      margin-right: auto;
    }

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
  /** The checked messages, by {@link messageKey}: a search across every folder
   * lists several folders' messages, and a UID means nothing outside its own. */
  @state() private selectedKeys = new Set<string>();

  @state() private layoutMode: LayoutMode = 'vertical';
  @state() private filterQuery = '';
  @state() private expandedFolders = new Set<string>([FOLDER_INBOX]);
  @state() private username = '';
  @state() private currentPage = 0;
  /**
   * The page the rows on screen came from.
   *
   * Not `currentPage`, which moves when the hash does — at the click, before
   * anything has been fetched. The rows are deliberately left in place while
   * the next page loads (see handleHashChange), so between the two the pager
   * would be naming the new page's first row over the old page's last one, and
   * correcting itself when the answer landed. This moves with the rows.
   */
  @state() private listedPage = 0;
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
  @state() private showSenderAvatars = true;
  @state() private isSyncing = false;
  @state() private sidebarCollapsed = false;
  @state() private suppressSidebarHover = false;
  @state() private sortOrder: 'asc' | 'desc' = 'desc';
  @state() private listScrolled = false;
  @state() private targetUid: string | null = null;
  /** The folder of the message the URL opens, when the list spans several:
   * `in`, beside `uid`. Otherwise the folder being viewed. */
  @state() private targetMailbox: string | null = null;

  @state() private isMobile = window.innerWidth <= 768;
  @state() private mobileSidebarOpen = false;

  @state() private bulkProcessing = false;
  @state() private computedMinListWidth = MESSAGE_LIST_WIDTH_MIN;

  private _mql = window.matchMedia('(max-width: 768px)');

  private updateComputedMinWidth() {
    let minW = MESSAGE_LIST_WIDTH_MIN;
    const msgList = this.shadowRoot?.querySelector('.message-list-pane alps-message-list') as any;
    
    if (msgList) {
      const header = msgList.shadowRoot?.querySelector('.list-header') as HTMLElement;
      if (header) {
        const scrollW = getFlexContainerMinWidth(header);
        
        // Use the calculated generic minimum width (with a small 2px safety buffer)
        minW = Math.max(MESSAGE_LIST_WIDTH_MIN, scrollW + 2);
      }
    }
    
    if (minW !== this.computedMinListWidth) {
      this.computedMinListWidth = minW;
      const sidebarW = (this.sidebarCollapsed && !this.isMobile) ? SIDEBAR_WIDTH_COLLAPSED : this.sidebarWidth;
      // Adjust resizer position to respect the new min width if it currently violates it
      if (this.resizerPositionX - sidebarW < minW) {
        this.resizerPositionX = sidebarW + minW;
      }
    }
  }

  private showGlobalToast(message: string, actionLabel = '', actionFn?: () => void, duration = 3000) {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message, actionLabel, actionFn, duration }
    }));
  }

  /** Shows a child's `toast` event. Both lists report through it; only the
   * folder list's were shown, so emptying Trash or Junk said nothing at all. */
  private _relayToast = (e: CustomEvent) => {
    this.showGlobalToast(e.detail.message, e.detail.actionLabel, e.detail.actionFn, e.detail.duration);
  };

  /**
   * Says why a flag write did not happen.
   *
   * `unsupported` is the server declining the keyword itself — retrying cannot
   * help, so it gets its own message rather than the generic "try again". A 401
   * is already announced through `auth-error` and needs no toast of its own.
   */
  /**
   * Says a message action did not happen. Archive, move, copy, undo and permanent
   * delete all branched on success with NO else — and their services catch
   * internally and never throw, so the catches beside them were unreachable for a
   * refusal. The user clicked, the server said no, and nothing on screen said so.
   * Callers stay quiet on `auth`, which the shell answers with the login screen.
   */
  private reportActionFailed(key: string, fallback: string) {
    this.showGlobalToast(this.i18nStore?.t(key) || fallback, '', undefined, 4000);
  }

  private reportFlagFailure(result: FlagResult) {
    if (result.reason === 'auth') return;
    const key = result.reason === 'unsupported' ? 'toast.tagNotSupported' : 'toast.flagChangeFailed';
    const fallback = result.reason === 'unsupported'
      ? 'That tag is not supported by this mail server'
      : 'Could not update the messages';
    this.showGlobalToast(this.i18nStore?.t(key) || fallback, '', undefined, 4000);
  }

  /**
   * Does an Archive action make sense in the folder on screen?
   *
   * By ROLE. This was `!['trash','drafts','archive'].includes(name.toLowerCase())`,
   * an English-name test for the mobile bulk-actions bar — while message-reader
   * gates the SAME button with `mailboxRoleByName` and a comment citing issue
   * #4. Two renderings of one button in one app, disagreeing about what folder
   * they are in.
   *
   * On Gmail or a localized server the name test failed open: the Archive
   * button appeared inside the Archive folder (archiving into itself) and in
   * Trash and Drafts. It also failed closed for a user's own folder that
   * happens to be called "Archive".
   */
  private get canArchiveHere(): boolean {
    // mailboxRoleByName is the one name fallback, and only for roles the server has
    // not assigned. The unconditional name list that followed here would have
    // undone that for any folder called "Archive", "Drafts" or "Trash".
    const role = mailboxRoleByName(this.currentMailbox, this.mailboxes);
    return role !== 'trash' && role !== 'drafts' && role !== 'archive';
  }

  private get effectiveListWidth() {
    const sidebarW = (this.sidebarCollapsed && !this.isMobile) ? SIDEBAR_WIDTH_COLLAPSED : this.sidebarWidth;
    return Math.max(this.computedMinListWidth, this.resizerPositionX - sidebarW);
  }

  /**
   * The checked messages, wherever the list holds them. A thread's older
   * messages sit under its row as `SubMessages`, and a checked thread row is all
   * of them — so looking through the top-level rows alone missed most of a
   * checked conversation, and the selection bar then offered "Mark as unread"
   * over a thread that still had unread mail in it.
   */
  private get selectedListed(): any[] {
    if (this.selectedKeys.size === 0) return [];
    const found: any[] = [];
    for (const msg of this.messages) {
      if (this.selectedKeys.has(this.keyOf(msg))) found.push(msg);
      for (const sub of msg.SubMessages || []) {
        if (this.selectedKeys.has(this.keyOf(sub))) found.push(sub);
      }
    }
    return found;
  }

  /**
   * The checked messages as the rows a star is judged by. A thread checked
   * WHOLE is one row — that is what checking its collapsed row does — and any
   * other checked message is a row of its own, which is what it is in an
   * expanded thread.
   */
  private get selectedStarRows(): { face: any; messages: any[] }[] {
    const rows: { face: any; messages: any[] }[] = [];
    for (const msg of this.messages) {
      const members = [msg, ...(msg.SubMessages || [])];
      const checked = members.filter((m: any) => this.selectedKeys.has(this.keyOf(m)));
      if (members.length > 1 && checked.length === members.length) rows.push({ face: msg, messages: members });
      else for (const m of checked) rows.push({ face: m, messages: [m] });
    }
    return rows;
  }

  /**
   * Whether the star over the checked rows is lit, and so whether pressing it
   * clears. A conversation is starred while ANY message in it is, as its row is
   * drawn; judged message by message, a starred conversation with one star in
   * three read as unstarred, and pressing the star put two more on it.
   */
  private get allSelectedStarred() {
    const rows = this.selectedStarRows;
    return rows.length > 0 && rows.every(row => row.messages.some(isFlagged));
  }

  /**
   * What a star gesture over these rows writes. CLEARING takes the star off
   * every message that carries one: the row's star is the conversation's, so it
   * has to go out wherever in the thread it is, or the row stays lit and the
   * gesture looks refused. SETTING stars one message per row that has none —
   * the row's own, the newest — because one star lights the row, and a star on
   * every message of a thread is a dozen to take back off one at a time from the
   * open conversation. A row already starred is left as it is.
   */
  private starWrite(rows: { face: any; messages: any[] }[]): { keys: string[]; op: 'add' | 'remove' } {
    const lit = rows.length > 0 && rows.every(row => row.messages.some(isFlagged));
    const chosen = lit
      ? rows.flatMap(row => row.messages.filter(isFlagged))
      : rows.filter(row => !row.messages.some(isFlagged)).map(row => row.face);
    return { keys: chosen.map((m: any) => this.keyOf(m)), op: lit ? 'remove' : 'add' };
  }

  private get commonSelectedTags() {
    const selected = this.selectedListed;
    if (selected.length === 0) return [];
    const allLabels = ['$label1', '$label2', '$label3', '$label4', '$label5'];
    return allLabels.filter(label =>
      selected.every(msg => msg.Flags?.some((f: string) => f.toLowerCase() === label.toLowerCase())));
  }

  /**
   * Whether the read toggle over the checked rows says "Mark as read". Judged
   * thread by thread, as the list draws them: a thread's row is bold while any
   * of it is unread, so a checked thread counts as unread while any checked
   * message in it is. Judged message by message, a bold thread with one unread
   * message in three was offered "Mark as unread", and no gesture on the
   * selection bar could make it read.
   */
  private get allSelectedUnread() {
    let any = false;
    for (const msg of this.messages) {
      const checked = [msg, ...(msg.SubMessages || [])].filter((m: any) => this.selectedKeys.has(this.keyOf(m)));
      if (checked.length === 0) continue;
      any = true;
      if (checked.every((m: any) => m.Flags?.includes(FLAG_SEEN))) return false;
    }
    return any;
  }

  /** The mailbox a listed message is in: its own, since a search across mailboxes lists several. */
  private mailboxOf(msg: any): string {
    return mailboxOf(msg, this.currentMailbox);
  }

  private keyOf(msg: any): string {
    return messageKey(this.mailboxOf(msg), msg?.UID);
  }

  /** Whether msg is the open message: the same UID in the same folder. */
  private isOpen(msg: any): boolean {
    return !!this.selectedMessage && !!msg && this.keyOf(this.selectedMessage) === this.keyOf(msg);
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

  protected updated(changedProperties: Map<string | number | symbol, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('sidebarCollapsed') || changedProperties.has('layoutMode') || changedProperties.has('currentMailbox') || changedProperties.has('isMobile') || changedProperties.has('mailboxes')) {
      setTimeout(() => this.updateComputedMinWidth(), 0);
    }
  }

  /** Moves the open message, the link target and the URL onto a draft's new
   * UID — the selection half of an autosave. */
  private followAutosavedSelection(next: any) {
    this.selectedMessage = next;
    this.targetUid = String(next.UID);
    const mailbox = this.mailboxOf(next);
    this.targetMailbox = mailbox !== this.currentMailbox ? mailbox : null;

    // Rewritten without a hashchange, so a reload opens the new draft and
    // nothing is fetched again now.
    window.history.replaceState(null, '', this.hashFor(this.currentMailbox, this.currentPage, this.targetUid, this.filterQuery, this.targetMailbox));
  }

  private handleDraftAutosaved = (e: CustomEvent) => {
    const { oldUid, oldMailbox, newUid, mailbox, subject, hasAttachments, size } = e.detail;
    if (!this.messages) return;
    // A string, as the listing sends every UID. A number here made the reader,
    // which compares UIDs as they are, take the same draft for a different
    // message on the next sync: it reloaded it in full, and asked the server
    // for the conversation of a draft the next save or a discard had deleted.
    const nextUid = String(newUid);
    let found = false;

    // The draft this save replaced, wherever it is on screen — in any view.
    //
    // This half sat behind the Drafts test below along with the insert, and the
    // two are different questions. A search of all mailboxes lists drafts too,
    // and opens them; the save deletes the UID those rows and the reader hold,
    // so the reader went on showing a draft that no longer existed, and a
    // Discard from the composer named one it had never heard of.
    //
    // Matched on mailbox AND UID: a UID is unique only within its mailbox, and
    // a search of all mailboxes lists several.
    const oldKey = oldUid ? messageKey(oldMailbox || mailbox, oldUid) : null;
    const replaced = (m: any) => ({
      ...m,
      UID: nextUid,
      // Only a row that names its mailbox has one to move; the rest are the
      // view's own, and the view is where the draft went.
      ...(m.Mailbox ? { Mailbox: mailbox } : {}),
      Size: size || m.Size,
      RFC822Size: size || m.RFC822Size,
      HasAttachments: hasAttachments,
      _isAutosaveUpdate: true,
      Envelope: {
        ...m.Envelope,
        Subject: subject || m.Envelope?.Subject || '(No subject)'
      }
    });

    if (oldKey) {
      // Search top-level messages first
      const idx = this.messages.findIndex(m => this.keyOf(m) === oldKey);
      if (idx !== -1) {
        const updated = [...this.messages];
        updated[idx] = replaced(updated[idx]);
        this.messages = updated;
        found = true;

        // Preserve active message selection
        if (this.selectedMessage && this.keyOf(this.selectedMessage) === oldKey) {
          this.followAutosavedSelection(updated[idx]);
        }
      } else {
        // Search in SubMessages of all messages (threads)
        for (let i = 0; i < this.messages.length; i++) {
          const parent = this.messages[i];
          if (parent.SubMessages) {
            const subIdx = parent.SubMessages.findIndex((sm: any) => this.keyOf(sm) === oldKey);
            if (subIdx !== -1) {
              const updatedSubMessages = [...parent.SubMessages];
              updatedSubMessages[subIdx] = replaced(updatedSubMessages[subIdx]);

              const updatedMessages = [...this.messages];
              updatedMessages[i] = {
                ...parent,
                SubMessages: updatedSubMessages
              };
              this.messages = updatedMessages;
              found = true;

              // Preserve active message selection if we were viewing this sub-message draft
              if (this.selectedMessage && this.keyOf(this.selectedMessage) === oldKey) {
                this.followAutosavedSelection(updatedSubMessages[subIdx]);
              }
              break;
            }
          }
        }
      }

      // The open draft with no row under it: opened from a page the list has
      // since moved past.
      if (!found && this.selectedMessage && this.keyOf(this.selectedMessage) === oldKey) {
        this.followAutosavedSelection(replaced(this.selectedMessage));
      }
    }

    // A save that matched no row is a new row only where drafts are listed.
    if (!found && this.currentMailbox === mailbox) {
      const draftName = this.settingsStore?.getState().name || this.username;
      const draftEmailParts = (this.username || '').split('@');
      const draftMailboxStr = draftEmailParts[0] || '';
      const draftHostStr = draftEmailParts[1] || '';

      // If the draft was completely new or the old UID was out of sync, insert it at the top
      const newDraft = {
        UID: nextUid,
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
    this.showSenderAvatars = state.showSenderAvatars ?? true;
    this.sortOrder = state.sortOrder || 'desc';

    // The header draws the user menu only once it has a username, and the
    // folder listing used to be this page's only source for one. A listing that
    // failed left the mail page without the menu, and so without Sign Out, while
    // Calendar and Contacts showed it: they read the user the session names,
    // which the store holds as soon as the session has answered.
    if (state.loginUsername) {
      this.username = state.loginUsername;
    }

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
    // A quiet read is a foreground one in every way but the dim: its answer
    // lands on the page being viewed, and it is not new mail. It follows
    // something the user just did (see messageSync.sync), so the rows change
    // for a reason they already know, and fading them first only hides it.
    if (!detail.background && !detail.quiet) {
      this.loadingMessages = true;
      this.listLoadFailed = false;
    }
  };

  private handleSyncSuccess = (e: Event) => {
    this.isSyncing = false;
    this.listLoadFailed = false;
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
        // New mail is BOTH counts rising: the total and the unseen. Either alone is a
        // false positive. The total alone rang for the user's own moves and copies —
        // archive fifty messages and the next background sync chimed, because
        // Archive's total went up — and for another client appending read mail. The
        // unseen alone would ring for the user marking a message unread. The smaller
        // rise is the count, so a copy of 200 messages carrying 3 unread says 3. Still
        // a heuristic: an arrival offset by a delete between polls is missed.
        if (oldMb && !isInitialLoad && background
          && mb.Total !== undefined && oldMb.Total !== undefined
          && mb.Unseen !== undefined && oldMb.Unseen !== undefined) {
          const arrived = Math.min(mb.Total - oldMb.Total, mb.Unseen - oldMb.Unseen);
          if (arrived > 0) {
            soundTriggered = true;
            if (mbName.toUpperCase() === 'INBOX') {
              notificationTriggered = true;
              totalNewInboxMessages += arrived;
            }
          }
        }
      }
      this.mailboxes = data.Mailboxes;
    }

    if (soundTriggered && this.settingsStore.getState().soundNotifications) {
      const sound = this.chime();
      sound.currentTime = 0;
      sound.play().catch(e => {
        if (e.name !== 'NotAllowedError') {
          Logger.error('Failed to play sound notification:', e);
        }
      });
    }

    if (notificationTriggered && this.settingsStore.getState().desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
      const title = this.i18nStore?.t('mailboxPage.newMessages');
      let body = totalNewInboxMessages === 1
        ? (this.i18nStore?.t('mailboxPage.newMessagesSingleBody'))
        : (this.i18nStore?.t('mailboxPage.newMessagesMultiBody', { count: totalNewInboxMessages }));

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
            // Explicitly no search. updateUrl carries the current one forward by
            // default, which is right within a folder and wrong on a switch to the
            // Inbox: a search typed elsewhere would hide the mail being announced.
            this.updateUrl('INBOX', 0, null, '');
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
          // No search carried over, as in the notification's click above.
          this.updateUrl('INBOX', 0, null, '');
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
      this.listedPage = data.Page !== undefined ? data.Page : this.currentPage;
      if (data.Total !== undefined) this.totalMessages = data.Total;
      if (data.MessagesPerPage !== undefined) this.messagesPerPage = data.MessagesPerPage;
      if (data.Messages) {
        // Only when the answer differs from what is shown. Every read parses
        // its own objects, so assigning one re-ran every row template and every
        // sender lookup for a folder where nothing had moved — which is what a
        // check, and a sync after a write elsewhere, usually finds.
        if (!sameListing(this.messages, data.Messages)) {
          this.messages = data.Messages;
        }
        if (this.selectedMessage) {
          const updatedMsg = this.messages.find((m: any) => this.isOpen(m));
          // Same rule for the open message: a fresh copy of it rebuilds the
          // reader's cards and re-runs the list's "another message was opened"
          // path, for flags that are the ones already held.
          if (updatedMsg && updatedMsg.Flags && !sameFlags(this.selectedMessage.Flags, updatedMsg.Flags)) {
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
      // Said, rather than left to the list's empty branch: with no messages and
      // no spinner it painted "No messages", a claim about a folder this client
      // had just failed to read, with nothing offered to try again.
      this.listLoadFailed = true;
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
    const oldUidMailbox = this.targetMailbox;
    const oldFilter = this.filterQuery;

    this.extractMailboxFromHash();

    if (oldMailbox !== this.currentMailbox || oldPage !== this.currentPage || oldFilter !== this.filterQuery) {
      if (oldMailbox !== this.currentMailbox) {
        this.selectedMessage = null; // Reset selection on mailbox change
        this.currentPage = 0; // Reset pagination on mailbox change
        this.selectedKeys = new Set(); // Reset selection on mailbox change

        // Do not clear this.messages to prevent UI flash, let it be replaced when network returns
        this.loadingMessages = true; // Show loading immediately
      } else if (oldFilter !== this.filterQuery) {
        // Do not clear this.messages
        this.loadingMessages = true;
        this.currentPage = 0;
      }
      messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, false);
    } else if (oldUid !== this.targetUid || oldUidMailbox !== this.targetMailbox) {
      this.applyTargetUid();
    }
  };

  private startResize = (e: MouseEvent) => {
    e.preventDefault();
    this.isPaneDragging = true;
    
    // Ensure we have the latest width before drag
    this.updateComputedMinWidth();

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (this.layoutMode === 'vertical') {
        const sidebarW = this.sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : this.sidebarWidth;
        const newX = Math.max(sidebarW + this.computedMinListWidth, Math.min(moveEvent.clientX, window.innerWidth - MESSAGE_READER_WIDTH_MIN));
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

  /**
   * `uidMailbox` is the folder the opened message is in, written only where it
   * is not the folder being viewed: a search across every folder lists several,
   * and the same UID can be in each of them.
   */
  private updateUrl(mailbox: string, page: number, uid: string | null, filterQuery: string | null = this.filterQuery, uidMailbox: string | null = null) {
    window.location.hash = this.hashFor(mailbox, page, uid, filterQuery, uidMailbox);
  }

  private hashFor(mailbox: string, page: number, uid: string | null, filterQuery: string | null, uidMailbox: string | null): string {
    let hash = `#/mailbox/${encodeURIComponent(mailbox)}`;
    const params = new URLSearchParams();
    if (page > 0) {
      params.set('p', page.toString());
    }
    if (uid) {
      params.set('uid', uid);
      if (uidMailbox && uidMailbox !== mailbox) params.set('in', uidMailbox);
    }
    if (filterQuery) {
      params.set('q', filterQuery);
    }
    const qs = params.toString();
    if (qs) {
      hash += '?' + qs;
    }
    return hash;
  }

  /** Opens the message a key names, in the view given, or closes the reader. */
  private openKeyInUrl(view: string, page: number, key: string | null) {
    if (!key) {
      this.updateUrl(view, page, null);
      return;
    }
    const { mailbox, uid } = parseMessageKey(key);
    this.updateUrl(view, page, uid, undefined, mailbox);
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
        this.targetMailbox = null;
      } else {
        this.targetUid = params.get('uid') || null;
        this.targetMailbox = this.targetUid ? params.get('in') || null : null;
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
      this.targetMailbox = null;
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
    const currentTargetMailbox = this.targetMailbox;
    const mailbox = currentTargetMailbox || this.currentMailbox;
    const targetKey = messageKey(mailbox, currentTargetUid);
    let msg = this.messages.find(m => this.keyOf(m) === targetKey);

    // If the message is not on the current page (e.g. it shifted or we changed pages),
    // fetch its metadata directly from the backend so the reader can still display it.
    if (!msg && this.messages.length > 0) {
      try {
        const metadataRes = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/messages/${currentTargetUid}`);
        if (metadataRes.ok) {
          const data = await metadataRes.json();
          if (data.Message) {
            msg = { ...data.Message, Mailbox: data.Message.Mailbox || mailbox };
          }
        }
      } catch (err) {
        Logger.error('Failed to fetch shifted message:', err);
      }
    }

    // Prevent race conditions if the user clicked another message while we were fetching
    if (this.targetUid !== currentTargetUid || this.targetMailbox !== currentTargetMailbox) return;

    if (msg) {
      if (!this.isOpen(msg)) {
        this.selectedMessage = msg;
        if (this.layoutMode === 'full') {
          // A new Set, not clear(): this is @state and bound to the folder list,
          // and Lit compares by identity, so clearing in place re-rendered
          // nothing and the folders stayed drawn open over an empty set.
          this.expandedFolders = new Set();
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
    this.openKeyInUrl(this.currentMailbox, this.currentPage, this.keyOf(msg));
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

  /**
   * Paints a flag on the listed messages the keys name, and tells the reader.
   *
   * Answers the keys it CHANGED, which is not the keys it was given: the paint
   * is idempotent — adding a flag a message already carries does nothing — and
   * a caller reverting a failed write has to put back only what it moved.
   * Reverting the whole set with the opposite operation marks messages that
   * were already read unread, on a write that never touched them.
   */
  private updateLocalMessageFlags(keys: string[], flag: string, action: 'add' | 'remove'): string[] {
    const named = new Set(keys);
    const changed: string[] = [];
    const newMessages = [...this.messages];
    const withFlag = (msg: any) => {
      const hasFlag = !!msg.Flags?.includes(flag);
      if (action === 'add' && !hasFlag) return { ...msg, Flags: [...(msg.Flags || []), flag] };
      if (action === 'remove' && hasFlag) return { ...msg, Flags: msg.Flags.filter((f: string) => f !== flag) };
      return msg;
    };
    for (let i = 0; i < newMessages.length; i++) {
      let msg = newMessages[i];
      if (named.has(this.keyOf(msg))) {
        const next = withFlag(msg);
        if (next !== msg) {
          newMessages[i] = msg = next;
          changed.push(this.keyOf(msg));
        }
      }
      // A thread's other messages are rows too — the list draws each with its
      // own unread and star once the thread is expanded — and the open
      // conversation marks them read. Left alone, they stayed bold until the
      // next sync, and the reader, which rebuilds its cards from these rows,
      // went back to showing them unread.
      if (msg.SubMessages?.some((sub: any) => named.has(this.keyOf(sub)))) {
        const subs = msg.SubMessages.map((sub: any) => (named.has(this.keyOf(sub)) ? withFlag(sub) : sub));
        const moved = subs.filter((sub: any, j: number) => sub !== msg.SubMessages[j]);
        if (moved.length > 0) {
          newMessages[i] = { ...msg, SubMessages: subs };
          for (const sub of moved) changed.push(this.keyOf(sub));
        }
      }
    }
    if (changed.length > 0) {
      this.messages = newMessages;
      if (this.selectedMessage && named.has(this.keyOf(this.selectedMessage))) {
        const hasFlag = this.selectedMessage.Flags && this.selectedMessage.Flags.includes(flag);
        if (action === 'add' && !hasFlag) {
          this.selectedMessage.Flags = [...(this.selectedMessage.Flags || []), flag];
        } else if (action === 'remove' && hasFlag) {
          this.selectedMessage.Flags = this.selectedMessage.Flags.filter((f: string) => f !== flag);
        }
        this.selectedMessage = { ...this.selectedMessage };
      }

      // Tell the reader, which keeps its OWN copy of each message in
      // `threadItems` and cannot see this one.
      //
      // message-reader has carried a complete handler for this event since
      // before the fork — it patches every thread item's flags and the open
      // message with it — and nothing has ever dispatched it. So the
      // reader→list direction worked (the reader bubbles
      // `message-flags-changed` to its parent) while list→reader did not:
      // starring or marking read from the message list left the open
      // conversation's cards showing the previous state until something forced
      // a re-fetch. The detail shape below is exactly this method's parameters,
      // which is how the handler was written to be called.
      window.dispatchEvent(new CustomEvent('external-message-flags-changed', {
        detail: { keys, flag, action }
      }));
    }
    return changed;
  }

  /**
   * The star on a list row. The row is the list's to describe: `messages` is
   * what it stands for, the whole thread when it is collapsed. See
   * {@link starWrite} for what is written.
   */
  private async _handleListToggleStar(e: CustomEvent) {
    const msg = e.detail.message;
    const { keys, op } = this.starWrite([{ face: msg, messages: e.detail.messages ?? [msg] }]);
    const undo = op === 'add' ? 'remove' : 'add';

    // Optimistic UI update
    this.updateLocalMessageFlags(keys, FLAG_FLAGGED, op);

    // A thread's messages can sit in several folders (a search across them), so
    // the write goes folder by folder, and only what a folder REFUSED is put
    // back — what the others took is done.
    const written = new Set<string>();
    let refused: FlagResult | undefined;
    try {
      const outcome = await this.eachFolder(keys, async (mailbox, uids) => {
        const result = await messageOperations.setFlag(mailbox, uids, [FLAG_FLAGGED], op);
        // Noted as each folder answers, so a later folder that throws does not
        // take back the paint of one that already took the write.
        if (result.ok) for (const uid of uids) written.add(messageKey(mailbox, uid));
        return result;
      });
      refused = outcome.refused;
    } catch (err) {
      // Revert below: nothing is known to have been written past `written`.
    }
    const unwritten = keys.filter(key => !written.has(key));
    if (unwritten.length > 0) {
      // Revert, and say so: a star that flicks back on its own reads as a
      // misclick, and the toolbar's star reports the same refusal.
      this.updateLocalMessageFlags(unwritten, FLAG_FLAGGED, undo);
      if (refused) this.reportFlagFailure(refused);
    }
  }

  private async _doMarkAsRead(msg: any) {
    // markAsRead returns the message UNCHANGED when the write fails, and both
    // branches here painted the row as read regardless — so any open whose flag
    // write failed showed a message as read that the server still held unread,
    // until the next sync quietly flipped it back. The answer is in the flags.
    //
    // Not reported: this runs on OPEN, and in a folder the user cannot write to
    // every open would fail and toast. It just must not paint.
    //
    // Selection is checked AFTER the await. It was checked before, so a user who
    // moved to another message while this was in flight had the old message
    // written back over their new selection.
    const updated = await messageOperations.markAsRead(this.mailboxOf(msg), msg);
    if (!updated?.Flags?.includes(FLAG_SEEN)) return;
    if (this.isOpen(msg)) this.selectedMessage = updated;
    this.updateLocalMessageFlags([this.keyOf(msg)], FLAG_SEEN, 'add');
  }

  /**
   * A card's own verb, on the message the card NAMES.
   *
   * Handled before anything reads the selection, because the card is about its
   * message whatever is checked or open — and in a folder of its own: a
   * conversation shows your replies from Sent, and a UID means nothing outside
   * its folder.
   */
  private async handleNamedMessageAction(detail: ReaderActionDetail) {
    const uid = String(detail.uid);
    const mailbox = detail.mailbox!;
    const key = messageKey(mailbox, uid);
    const isOpen = !!this.selectedMessage && this.keyOf(this.selectedMessage) === key;

    if (detail.action === 'downloadMessage') {
      const a = document.createElement('a');
      a.href = `/mailboxes/${encodeMailboxPath(mailbox)}/messages/${uid}/raw`;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (detail.action === 'showOriginal') {
      window.open(`#/original?mailbox=${encodeURIComponent(mailbox)}&uid=${uid}`, '_blank');
      return;
    }
    if (detail.action === 'markUnread') {
      // Never a toggle: the card offers "Mark as unread" only on a message that
      // is read, and marks read by itself. It ends where the toolbar's does —
      // back on the list, where the row is bold again.
      const seen = await messageOperations.setFlag(mailbox, [uid], [FLAG_SEEN], 'remove');
      if (!seen.ok) {
        this.reportFlagFailure(seen);
        return;
      }
      this.updateLocalMessageFlags([key], FLAG_SEEN, 'remove');
      this.selectedMessage = null;
      this.updateUrl(this.currentMailbox, this.currentPage, null);
      return;
    }
    if (detail.action !== 'delete') return;

    // As the toolbar's Delete does it for a single message, decided by the
    // folder the MESSAGE is in: where a move to Trash would change nothing, the
    // delete is permanent, and asks first.
    if (this.deletesForGood(mailbox)) {
      this.pendingDeleteDetails = {
        isBulk: false,
        doomed: [key],
        toTrash: [],
        isDrafts: mailboxRoleByName(mailbox, this.mailboxes) === 'drafts',
        named: { isOpen, nextUid: detail.nextUid, done: detail.done },
      };
      this.showDeleteConfirm = true;
      return;
    }

    const trash = findMailboxNameByRole('trash', this.mailboxes, FOLDER_TRASH);
    const view = this.currentMailbox;
    const moved = await messageOperations.moveMessages(mailbox, [uid], trash);
    if (!moved.success) {
      detail.done?.(false);
      if (moved.reason !== 'auth') this.reportActionFailed('toast.moveFailed', 'Could not move that');
      return;
    }
    detail.done?.(true);
    if (isOpen) this.leaveDeletedMessage(detail.nextUid);

    const inTrash = moved.uidMapping?.[uid];
    const undoFn = inTrash ? async () => {
      try {
        const back = await messageOperations.moveMessages(trash, [inTrash], mailbox);
        if (!back.success) {
          if (back.reason !== 'auth') this.reportActionFailed('toast.undoFailed', 'Could not undo that');
          return;
        }
        const restored = back.uidMapping?.[inTrash];
        if (isOpen) {
          // Back to the message that was being read, as the toolbar's undo does.
          const page = this.currentMailbox === view ? this.currentPage : 0;
          this.openKeyInUrl(view, page, restored ? messageKey(mailbox, restored) : null);
        } else {
          // Another card: it is back under a new UID, and the conversation on
          // screen has to be read again to show it.
          (this.renderRoot.querySelector('alps-message-reader') as MessageReader | null)?.reloadConversation();
        }
      } catch (err) {
        Logger.error('Undo failed', err);
        this.reportActionFailed('toast.undoFailed', 'Could not undo that');
      }
    } : undefined;
    this.showGlobalToast(
      this.i18nStore?.t('toast.messageMovedToTrash'),
      undoFn ? this.i18nStore?.t('mailboxPage.undo') : '',
      undoFn,
      UNDO_TOAST_TIMEOUT_MS,
    );
  }

  /** The open message is gone and its conversation is not: stay on what is
   * left of it, or go back to the list when nothing is. */
  private leaveDeletedMessage(nextUid: string | undefined) {
    if (nextUid) {
      this.updateUrl(this.currentMailbox, this.currentPage, nextUid);
      return;
    }
    this.selectedMessage = null;
    this.updateUrl(this.currentMailbox, this.currentPage, null);
  }

  /**
   * Runs a write once per folder over the messages the keys name: a UID means
   * nothing outside its own folder, and a search across every folder checks
   * rows from several. One folder at a time, as the chunks of one write go, and
   * every folder is tried, so a refusal in one does not leave the rest undone —
   * except an expired session, which every folder would answer the same way.
   * Answers what each folder's write took, and the first refusal.
   */
  private async eachFolder<R extends { ok: boolean; reason?: string }>(
    keys: string[],
    write: (mailbox: string, uids: string[]) => Promise<R>,
  ): Promise<{ done: { mailbox: string; uids: string[]; result: R }[]; refused?: R }> {
    const done: { mailbox: string; uids: string[]; result: R }[] = [];
    let refused: R | undefined;
    for (const [mailbox, uids] of uidsByMailbox(keys)) {
      const result = await write(mailbox, uids);
      if (result.ok) {
        done.push({ mailbox, uids, result });
        continue;
      }
      refused ??= result;
      if (result.reason === 'auth') break;
    }
    return { done, refused };
  }

  /** The keys of what {@link eachFolder} wrote. */
  private writtenKeys(done: { mailbox: string; uids: string[] }[]): string[] {
    return done.flatMap(({ mailbox, uids }) => uids.map(uid => messageKey(mailbox, uid)));
  }

  /**
   * Sets or clears flags on the messages the keys name.
   *
   * Painted BEFORE the write, and put back only where the write was refused.
   *
   * It used to be the other way round — paint each folder as it answered —
   * which is correct and reads as nothing happening: the server takes a
   * session's requests one at a time, so marking a few hundred rows read left
   * every one of them looking unread for as long as the write took, with no
   * sign that anything was underway. The rows the user acted on are the report
   * that the gesture landed, and they have to change with the gesture.
   *
   * The revert is exact: {@link updateLocalMessageFlags} answers the keys it
   * moved, so a refusal puts back those and not a message that already carried
   * the flag.
   */
  private async flagEach(keys: string[], flags: string[], op: 'add' | 'remove'): Promise<FlagResult> {
    const painted = flags.map(flag => ({ flag, keys: this.updateLocalMessageFlags(keys, flag, op) }));

    const written = new Set<string>();
    const { refused } = await this.eachFolder(keys, async (mailbox, uids) => {
      const result = await messageOperations.setFlag(mailbox, uids, flags, op);
      if (result.ok) for (const uid of uids) written.add(messageKey(mailbox, uid));
      return result;
    });

    if (written.size < keys.length) {
      const undo = op === 'add' ? 'remove' : 'add';
      for (const { flag, keys: moved } of painted) {
        const back = moved.filter(key => !written.has(key));
        if (back.length > 0) this.updateLocalMessageFlags(back, flag, undo);
      }
    }
    return refused ?? { ok: true };
  }

  /**
   * Takes the rows a write is about off the list, at once, before it runs.
   *
   * A bulk move or delete is one request per folder over as many messages as
   * are checked, and the server answers a session one request at a time. Until
   * it came back, nothing on screen moved: the rows stayed, the checkboxes
   * stayed checked, and the only sign of work was a spinner in the reading
   * pane, which a narrow layout does not show. Pressing again was the sensible
   * reading of that, and it queued a second write behind the first.
   *
   * The rows are the report. They leave when the gesture is made, the way they
   * do everywhere else, and the SELECTION GOES WITH THEM at no cost: the list
   * keeps only checked keys it still lists (see message-list's willUpdate), so
   * removing the rows empties the selection and folds the bulk bar away.
   *
   * Answers a PUT-BACK, for the write that is refused: given the keys that did
   * go, it restores the rest exactly where they were. A folder refusing does
   * not stop the others (see {@link eachFolder}), and what it refused has to
   * come back checked, so the user can try that part again — the one thing a
   * bare re-read of the folder cannot do. It answers whether it could: a
   * listing that has landed meanwhile is newer than anything held here, and
   * then the caller re-reads instead.
   */
  private takeRowsOut(keys: string[]): (written: string[]) => boolean {
    const before = this.messages;
    const beforeTotal = this.totalMessages;
    const putBack = (written: string[]) => {
      if (this.messages !== this.rowsAfterTakeOut) return false;
      this.messages = before;
      this.totalMessages = beforeTotal;
      this.takeRowsOut(written);
      return true;
    };
    if (keys.length === 0) return putBack;
    const gone = new Set(keys);
    let removed = 0;
    const kept: any[] = [];
    for (const msg of this.messages) {
      const subs: any[] = msg.SubMessages ?? [];
      const staying = subs.filter(sub => !gone.has(this.keyOf(sub)));
      // A row goes only when EVERY message it stands for goes. A collapsed
      // thread is checked whole, so that is the ordinary case; half of an
      // expanded one leaves the row standing, because dropping it would take
      // the messages the user did not check off the screen along with it.
      if (gone.has(this.keyOf(msg)) && staying.length === 0) {
        // ROWS, not the messages under them. A threaded listing is paged and
        // counted in conversations — the server answers len(groups) as its
        // total — so taking a thread of five out of the folder takes ONE off
        // that count. Unthreaded, a message is its own row and the two agree.
        // Counting messages here made the number fall by five and the next
        // listing put four of them back.
        removed += 1;
        continue;
      }
      // A thread the gesture only emptied in part is still a conversation in
      // the folder, so the count does not move for it.
      kept.push(staying.length === subs.length ? msg : { ...msg, SubMessages: staying });
    }
    this.messages = kept;
    this.rowsAfterTakeOut = kept;
    // The count the pagination and the discard banner read. The next listing
    // carries the server's own; this keeps the two from disagreeing by the
    // width of the write.
    if (removed > 0) this.totalMessages = Math.max(0, this.totalMessages - removed);
    return putBack;
  }

  /** The rows {@link takeRowsOut} left behind, so its put-back can tell them
   * from a listing that has arrived since. */
  private rowsAfterTakeOut: any[] | null = null;

  /**
   * Files the messages the keys name in `to` — Trash, Archive, Junk, the Inbox
   * or a folder the user picked — says so, and offers to put each back in the
   * folder it came from. A message already in `to` is left where it is: a move
   * into its own folder changes nothing.
   */
  private async fileAway(keys: string[], to: string, isBulk: boolean, say: (count: number) => string) {
    const view = this.currentMailbox;
    const open = this.selectedMessage ? this.keyOf(this.selectedMessage) : undefined;
    // Checked rows leave now, not when the server has finished with them — see
    // {@link takeRowsOut}. Only the ones that are actually going: a message
    // already in `to` is left where it is, and so is its row. The single-message
    // paths say so their own way, by closing the reader on the message.
    const leaving = isBulk ? keys.filter(key => parseMessageKey(key).mailbox !== to) : [];
    const putBack = isBulk ? this.takeRowsOut(leaving) : undefined;
    const { done, refused } = await this.eachFolder(keys, async (from, uids): Promise<MoveOutcome> => {
      if (from === to) return { ok: true, uidMapping: {} };
      const result = await messageOperations.moveMessages(from, uids, to);
      return { ok: result.success, reason: result.reason, uidMapping: result.uidMapping ?? {} };
    });

    const filed = this.writtenKeys(done);
    if (filed.length > 0) {
      if (isBulk) this.selectedKeys = new Set([...this.selectedKeys].filter(key => !filed.includes(key)));
      this.selectedMessage = null;
      this.updateUrl(this.currentMailbox, this.currentPage, null);

      const moved = done
        .filter(({ mailbox }) => mailbox !== to)
        .map(({ mailbox, result }) => ({ from: mailbox, mapping: result.uidMapping }));
      const undoFn = this.undoMoves(moved, to, view, isBulk ? undefined : open);
      this.showGlobalToast(say(filed.length), undoFn ? this.i18nStore?.t('mailboxPage.undo') : '', undoFn, UNDO_TOAST_TIMEOUT_MS);
    }
    if (refused && refused.reason !== 'auth') {
      this.reportActionFailed('toast.moveFailed', 'Could not move that');
      if (putBack) {
        // What the refusing folder held is still in it: its rows come back, and
        // come back CHECKED, which is the state the user needs to try again.
        const went = new Set(filed);
        const stayed = keys.filter(key => !went.has(key));
        if (putBack(leaving.filter(key => went.has(key)))) this.selectedKeys = new Set(stayed);
        else messageSync.sync();
      }
    }
  }

  /**
   * The undo of a move: each folder's messages go back to that folder. After
   * the open message, alone or with the rest of its conversation, the reader
   * reopens on the message that was being read (`reopen`, its key before the
   * move); after checked rows, they are checked again where they are listed.
   */
  private undoMoves(
    moved: { from: string; mapping: Record<string, string> }[],
    to: string,
    view: string,
    reopen: string | undefined,
  ): (() => Promise<void>) | undefined {
    const back = moved.filter(({ mapping }) => Object.keys(mapping).length > 0);
    if (back.length === 0) return undefined;
    return async () => {
      try {
        const restored: string[] = [];
        let reopened: string | null = null;
        let refused: MoveResult | undefined;
        for (const { from, mapping } of back) {
          const result = await messageOperations.moveMessages(to, Object.values(mapping), from);
          if (!result.success) {
            refused ??= result;
            if (result.reason === 'auth') break;
            continue;
          }
          for (const [was, now] of Object.entries(mapping)) {
            const again = result.uidMapping?.[now];
            if (!again) continue;
            restored.push(messageKey(from, again));
            if (reopen === messageKey(from, was)) reopened = messageKey(from, again);
          }
        }
        if (refused && refused.reason !== 'auth') this.reportActionFailed('toast.undoFailed', 'Could not undo that');
        if (restored.length === 0) return;
        if (reopen !== undefined) {
          const page = this.currentMailbox === view ? this.currentPage : 0;
          this.openKeyInUrl(view, page, reopened);
        } else if (this.currentMailbox === view) {
          this.selectedKeys = new Set([...this.selectedKeys, ...restored]);
        }
      } catch (err) {
        Logger.error("Undo failed", err);
        this.reportActionFailed('toast.undoFailed', 'Could not undo that');
      }
    };
  }

  /**
   * Whether a Delete in this folder is for good: where a move to Trash would
   * change nothing. By IMAP special-use attribute, falling back to well-known
   * names, so Gmail's "[Gmail]/Trash" etc. are recognized.
   */
  private deletesForGood(mailbox: string): boolean {
    const role = mailboxRoleByName(mailbox, this.mailboxes);
    return role === 'trash' || role === 'drafts' || role === 'junk';
  }

  /** What a toast says of messages filed away by `action`. */
  private movedMessage(action: string, many: boolean, count: number, folder = ''): string {
    const [several, one] = ({
      archive: ['toast.messagesMovedToArchive', 'toast.messageMovedToArchive'],
      reportSpam: ['toast.messagesMovedToSpam', 'toast.messageMovedToSpam'],
      notSpam: ['toast.messagesMovedToInbox', 'toast.messageMovedToInbox'],
      moveTo: ['toast.messagesMovedToFolder', 'toast.messageMovedToFolder'],
    } as Record<string, [string, string]>)[action] ?? ['toast.messagesMovedToTrash', 'toast.messageMovedToTrash'];
    return many ? this.i18nStore?.t(several, { count, folder }) : this.i18nStore?.t(one, { folder });
  }

  private async _handleReaderAction(e: CustomEvent<ReaderActionDetail>) {
    const action = e.detail.action;
    if (e.detail.uid && e.detail.mailbox) return this.handleNamedMessageAction(e.detail);
    const isBulk = this.selectedKeys.size > 0;
    const currentMsg = this.selectedMessage;

    if (!isBulk && !currentMsg?.UID) return;

    /** The open message, by key. */
    const open = isBulk ? [] : [this.keyOf(currentMsg)];
    /**
     * What a gesture acts on, by key: the checked rows; else the open
     * conversation's messages in this folder when the reader names them — its
     * toolbar is about the whole conversation — or else the open message.
     */
    const targets: string[] = isBulk
      ? [...this.selectedKeys]
      : e.detail.uids?.length
        ? e.detail.uids.map(uid => messageKey(this.currentMailbox, uid))
        : open;
    /** Whether to say "N messages" — a conversation of several is several. */
    const many = isBulk || targets.length > 1;

    if (isBulk) this.bulkProcessing = true;

    try {
      if (action === 'star') {
        // setFlag, not toggleStar: that returned the message unchanged on a
        // refusal, so the star stayed as it was and nothing said why.
        // Over checked rows the star is each conversation's — see `starWrite`.
        // In the reader it is the open message's own: every card there has a
        // star of its own, and the toolbar's is the open one's.
        const write = isBulk
          ? this.starWrite(this.selectedStarRows)
          : { keys: open, op: (currentMsg.Flags?.includes(FLAG_FLAGGED) ? 'remove' : 'add') as 'add' | 'remove' };
        const result = await this.flagEach(write.keys, [FLAG_FLAGGED], write.op);
        if (!result.ok) this.reportFlagFailure(result);
      } else if (action === 'addTag' || action === 'removeTag') {
        const tags = e.detail.tags || (e.detail.folder ? [e.detail.folder] : []);
        if (!tags || tags.length === 0) return;
        const op = action === 'addTag' ? 'add' : 'remove';
        // Tags are the path this matters most on: the backend stores only
        // `$label1`..`$label5` and used to answer 200 OK for anything else, so a
        // tag it would never keep was painted here and quietly erased later.
        const result = await this.flagEach(targets, tags, op);
        if (!result.ok) this.reportFlagFailure(result);
        this.requestUpdate();
      } else if (action === 'markUnread') {
        if (isBulk) {
          const result = await this.flagEach(targets, [FLAG_SEEN], this.allSelectedUnread ? 'add' : 'remove');
          if (!result.ok) this.reportFlagFailure(result);
        } else {
          // setFlag, not markAsRead/markAsUnread: those hid the FlagResult, so the read
          // branch painted the row read even when the write failed, and the unread
          // branch said nothing when it did. The bulk branch above already did this.
          const isUnread = !currentMsg.Flags || !currentMsg.Flags.includes(FLAG_SEEN);
          const seen = await messageOperations.setFlag(this.mailboxOf(currentMsg), [String(currentMsg.UID)], [FLAG_SEEN], isUnread ? 'add' : 'remove');
          if (!seen.ok) {
            this.reportFlagFailure(seen);
          } else if (isUnread) {
            this.selectedMessage = { ...currentMsg, Flags: [...(currentMsg.Flags || []), FLAG_SEEN] };
            this.updateLocalMessageFlags(open, FLAG_SEEN, 'add');
          } else {
            this.updateLocalMessageFlags(open, FLAG_SEEN, 'remove');
            this.selectedMessage = null;
            this.updateUrl(this.currentMailbox, this.currentPage, null);
          }
        }
      } else if (action === 'delete' || action === 'archive' || action === 'reportSpam' || action === 'notSpam') {
        // Resolve move destinations to the actual special-use mailbox (e.g. Gmail's
        // "[Gmail]/Trash") rather than a hardcoded English name. See issue #4.
        let destinationFolder = findMailboxNameByRole('trash', this.mailboxes, FOLDER_TRASH);
        if (action === 'archive') destinationFolder = findMailboxNameByRole('archive', this.mailboxes, FOLDER_ARCHIVE);
        if (action === 'reportSpam') destinationFolder = findMailboxNameByRole('junk', this.mailboxes, FOLDER_JUNK);
        if (action === 'notSpam') destinationFolder = FOLDER_INBOX;

        if (action === 'delete') {
          // Decided by the folder each message is in, as a card's Delete is. A
          // folder's own list is all one kind; a search across every folder can
          // check both, and then one question covers the part that is for good.
          const doomed = targets.filter(key => this.deletesForGood(parseMessageKey(key).mailbox));
          if (doomed.length > 0) {
            this.pendingDeleteDetails = {
              isBulk,
              doomed,
              toTrash: targets.filter(key => !doomed.includes(key)),
              isDrafts: doomed.every(key => mailboxRoleByName(parseMessageKey(key).mailbox, this.mailboxes) === 'drafts'),
            };
            this.showDeleteConfirm = true;
            return;
          }
        }

        await this.fileAway(targets, destinationFolder, isBulk, count => this.movedMessage(action, many, count));
      } else if (action === 'moveTo' || action === 'copyTo') {
        const destinationFolder = e.detail.folder;
        if (!destinationFolder) return;

        if (action === 'moveTo') {
          await this.fileAway(targets, destinationFolder, isBulk, count => this.movedMessage(action, many, count, destinationFolder));
        } else {
          const { done, refused } = await this.eachFolder(targets, async (from, uids): Promise<MoveOutcome> => {
            const result = await messageOperations.copyMessages(from, uids, destinationFolder);
            return { ok: result.success, reason: result.reason, uidMapping: {} };
          });
          const copied = this.writtenKeys(done).length;
          if (copied > 0) {
            const toastMessage = many
              ? this.i18nStore?.t('toast.messagesCopiedToFolder', { count: copied, folder: destinationFolder })
              : this.i18nStore?.t('toast.messageCopiedToFolder', { folder: destinationFolder });
            this.showGlobalToast(toastMessage, '', undefined, UNDO_TOAST_TIMEOUT_MS);
          }
          if (refused && refused.reason !== 'auth') this.reportActionFailed('toast.copyFailed', 'Could not copy that');
        }
      } else if (action === 'downloadMessage' && !isBulk) {
        const url = `/mailboxes/${encodeMailboxPath(this.mailboxOf(currentMsg))}/messages/${currentMsg.UID}/raw`;

        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (action === 'showOriginal' && !isBulk) {
        const url = `#/original?mailbox=${encodeURIComponent(this.mailboxOf(currentMsg))}&uid=${currentMsg.UID}`;
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

    const { isBulk, doomed, toTrash, isDrafts, named } = details;
    const many = doomed.length > 1;
    if (isBulk) this.bulkProcessing = true;
    try {
      // Checked rows leave with the gesture. Not a card's Delete, which is
      // about one message inside a conversation the reader is showing and has
      // its own way of leaving it (`leaveDeletedMessage`).
      const putBack = isBulk && !named ? this.takeRowsOut(doomed) : undefined;
      const { done, refused } = await this.eachFolder(doomed, (mailbox, uids) =>
        messageOperations.deleteMessagesResult(mailbox, uids));
      named?.done?.(!refused);

      const deleted = this.writtenKeys(done);
      if (deleted.length > 0) {
        if (named) {
          // A card's Delete: the rest of the conversation stays on screen.
          if (named.isOpen) this.leaveDeletedMessage(named.nextUid);
        } else {
          if (isBulk) this.selectedKeys = new Set([...this.selectedKeys].filter(key => !deleted.includes(key)));
          this.selectedMessage = null;
          this.updateUrl(this.currentMailbox, this.currentPage, null);
        }

        let toastMessage = '';
        if (isDrafts) {
          toastMessage = many ? this.i18nStore?.t('toast.draftsDiscarded', { count: deleted.length }) : (this.i18nStore?.t('toast.draftDiscarded'));
        } else {
          toastMessage = many ? this.i18nStore?.t('toast.messagesPermanentlyDeleted', { count: deleted.length }) : (this.i18nStore?.t('toast.messagePermanentlyDeleted'));
        }
        this.showGlobalToast(toastMessage, '', undefined, UNDO_TOAST_TIMEOUT_MS);
      }
      if (refused && refused.reason !== 'auth') {
        this.reportActionFailed('toast.messageDeleteFailed', 'The message could not be deleted');
        if (putBack) {
          // As in fileAway: back where they were, and checked.
          const went = new Set(deleted);
          if (putBack(deleted)) this.selectedKeys = new Set(doomed.filter(key => !went.has(key)));
          else messageSync.sync();
        }
      }

      // The rest of the same Delete, in folders where it is a move to Trash.
      if (toTrash.length > 0) {
        const trash = findMailboxNameByRole('trash', this.mailboxes, FOLDER_TRASH);
        await this.fileAway(toTrash, trash, isBulk, count => this.movedMessage('delete', isBulk || toTrash.length > 1, count));
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
        .currentMailboxDelimiter=${mailboxDelimiter(this.currentMailbox, this.mailboxes)}
        .searchQuery=${this.filterQuery}
        .scrolled=${this.listScrolled}
        @toggle-sidebar=${() => this.mobileSidebarOpen = !this.mobileSidebarOpen}
        @compose=${() => this.composeStore.openComposer()}
        @search-submit=${(e: CustomEvent) => {
        const newFilter = e.detail.value;
        const mailbox = e.detail.global ? '*' : this.currentMailbox;
        this.updateUrl(mailbox, 0, null, newFilter);
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
          this.selectedKeys = new Set();
          this.updateUrl(e.detail.name, 0, null);
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
            @toast=${this._relayToast}
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
              .currentMailboxRole=${mailboxRoleByName(this.currentMailbox, this.mailboxes) || ''}
              .currentMailboxDelimiter=${mailboxDelimiter(this.currentMailbox, this.mailboxes)}
              .sidebarCollapsed=${this.sidebarCollapsed && !this.isMobile}
              .loading=${this.loadingMessages}
              .selectedMessage=${this.selectedMessage}
              .selectedMessages=${this.selectedKeys}
              .layoutMode=${effectiveLayoutMode}
              .isMobile=${this.isMobile}
              .currentPage=${this.currentPage}
              .listedPage=${this.listedPage}
              .totalMessages=${this.totalMessages}
              .messagesPerPage=${this.messagesPerPage}
              .densityMode=${this.densityMode}
              .showSenderAvatars=${this.showSenderAvatars}
              .filterQuery=${this.filterQuery}
              .sortOrder=${this.sortOrder}
              .syncing=${this.isSyncing}
              .loadFailed=${this.listLoadFailed}
              @refresh=${() => {
        this.currentPage = 0;

        // A check, not a fetch: over a list that is already current the rows
        // neither dim nor re-list (see messageSync.check).
        messageSync.check(this.currentMailbox, this.currentPage, this.filterQuery);
      }}
              @toggle-sidebar=${() => this.mobileSidebarOpen = !this.mobileSidebarOpen}
              @compose=${() => this.composeStore.openComposer()}
              @toast=${this._relayToast}
              @select-message=${(e: CustomEvent) => this.selectMessage(e.detail.message)}
              @change-page=${(e: CustomEvent) => this.updateUrl(this.currentMailbox, e.detail.page, this.targetUid, undefined, this.targetMailbox)}
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
              @clear-search=${() => {
                const targetMailbox = this.currentMailbox === '*' ? FOLDER_INBOX : this.currentMailbox;
                this.updateUrl(targetMailbox, 0, null, '');
              }}
              @search-submit=${(e: CustomEvent) => {
                const newFilter = e.detail.value;
                const mailbox = e.detail.global ? '*' : this.currentMailbox;
                this.updateUrl(mailbox, 0, null, newFilter);
              }}
              @selection-changed=${(e: CustomEvent) => this.selectedKeys = e.detail.selectedKeys}
              @toggle-star-message=${this._handleListToggleStar}
            >
              <div slot="mobile-bulk-actions" class="mobile-bulk-actions-container">
                <alps-icon-btn title=${this.i18nStore?.t('general.cancel') || 'Cancel'} @click=${() => { this.selectedKeys = new Set(); }} icon="arrowLeft"></alps-icon-btn>
                <span class="mobile-bulk-actions-count">${this.selectedKeys.size}</span>
                ${this.canArchiveHere ? html`
                  <alps-icon-btn title=${this.i18nStore?.t('messageReader.archive')} @click=${() => this._handleReaderAction(new CustomEvent('action', {detail: {action: 'archive'}}))} icon="archiveBox"></alps-icon-btn>
                ` : ''}
                <alps-icon-btn title=${this.i18nStore?.t('messageReader.delete')} @click=${() => this._handleReaderAction(new CustomEvent('action', {detail: {action: 'delete'}}))} icon="trash"></alps-icon-btn>
                <div class="header-divider"></div>
                <alps-icon-btn title=${this.allSelectedUnread ? this.i18nStore?.t('messageReader.markRead') : this.i18nStore?.t('messageReader.markUnread')} @click=${() => this._handleReaderAction(new CustomEvent('action', {detail: {action: 'markUnread'}}))} icon=${this.allSelectedUnread ? 'envelopeOpen' : 'envelopeUnread'}></alps-icon-btn>
                <alps-icon-btn title=${this.i18nStore?.t('messageReader.star')} @click=${() => this._handleReaderAction(new CustomEvent('action', {detail: {action: 'star'}}))} icon=${this.allSelectedStarred ? 'starFourFill' : 'starFour'}></alps-icon-btn>
                <div class="header-divider"></div>
                <alps-folder-selector-popup
                  .mailboxes=${this.mailboxes}
                  .currentMailbox=${this.currentMailbox}
                  @folder-selected=${(e: CustomEvent) => this._handleReaderAction(new CustomEvent('action', {detail: {action: e.detail.isMove ? 'moveTo' : 'copyTo', folder: e.detail.folderName}}))}
                >
                  <alps-icon-btn slot="trigger" title=${this.i18nStore?.t('messageReader.moveTo')} icon="folderOpen"></alps-icon-btn>
                </alps-folder-selector-popup>
              </div>
            </alps-message-list>
          </div>
          ${effectiveLayoutMode !== 'full' ? html`
            <div class="resizer ${this.isPaneDragging ? 'dragging' : ''}" @mousedown=${this.startResize}></div>
          ` : ''}
          <div class="pane message-reader-pane">
            <alps-message-reader
              .mailboxes=${this.mailboxes}
              .mailbox=${this.currentMailbox}
              .message=${this.selectedMessage}
              .messages=${this.messages}
              .layoutMode=${effectiveLayoutMode}
              .selectedKeys=${this.selectedKeys}
              .allSelectedStarred=${this.allSelectedStarred}
              .allSelectedUnread=${this.allSelectedUnread}
              .commonTags=${this.commonSelectedTags}
              .bulkProcessing=${this.bulkProcessing}
              @close=${() => { this.updateUrl(this.currentMailbox, this.currentPage, null); }}
              @action=${this._handleReaderAction}
              @message-flags-changed=${(e: CustomEvent) => this.updateLocalMessageFlags([messageKey(e.detail.mailbox ?? this.currentMailbox, e.detail.uid)], e.detail.flag, e.detail.action)}
            ></alps-message-reader>
          </div>
        </div>
      </div>
      ${this.showDeleteConfirm ? html`
        <ui-confirm
          title="${this.i18nStore?.t('mailboxPage.permanentlyDelete')}"
          message=${(this.pendingDeleteDetails?.doomed.length ?? 0) > 1 ? (this.i18nStore?.t('messageReader.deleteConfirmMultiple')) : (this.i18nStore?.t('messageReader.deleteConfirmSingle'))}
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
