import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fetchWithTimeout } from '../utils/fetch-utils';
import '../components/folder-list';
import '../components/message-list';
import '../components/message-reader';
import type { MessageReader, ReaderActionDetail } from '../components/message-reader';
import type { MessageList } from '../components/message-list';
import '../components/ui-confirm.js';
import '../components/app-header';
import { closeSidebarPeek } from '../components/alps-sidebar';
import { consume } from '@lit/context';
import { composeContext, ComposeStore } from '../store/compose-store';
import { messageSync, type MailboxData } from '../services/message-sync';
import { mailPush } from '../services/mail-push';
import { messageOperations, type FlagResult, type MatchingScope, type MoveResult } from '../services/message-operations';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { FLAG_SEEN, FLAG_FLAGGED, FLAG_DRAFT } from '../utils/flags';
import { FOLDER_INBOX, FOLDER_ARCHIVE, FOLDER_JUNK, FOLDER_TRASH, encodeMailboxPath, mailboxRoleByName, findMailboxNameByRole, acceptsDroppedMessages } from '../utils/folders';
import type { LayoutMode, DensityMode } from '../store/settings-store';
import '../components/alps-initial-loader';
import { Logger } from '../utils/logger';
import { MessageCache } from '../utils/message-cache';
import { getDestinationLabel, getFlexContainerMinWidth } from '../utils/ui';
import { mailboxOf, messageKey, parseMessageKey, uidsByMailbox } from '../utils/message-key';
import { canonicalRecipient, parseWrittenAddress } from '../utils/address-display';
import { isSettingsHash } from '../utils/routes';
import { pageHash, updateSettingsBackground } from '../utils/settings-history';

const UNDO_TOAST_TIMEOUT_MS = 10000;

/** The settings a listing is read under: its order, its page size, and
 * whether it is threaded. */
const LISTING_SETTINGS = ['sortOrder', 'messageSortCriteria', 'messagesPerPage', 'enableThreading'] as const;

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

/**
 * A field's recipient pills as a listing names the addresses a draft save
 * stored: the name as it reads, and the address split at its last `@`, its
 * domain in the A-label form the save posts (see canonicalRecipient).
 */
function listedAddresses(pills: string[] | undefined): { Name: string; Mailbox: string; Host: string }[] {
  return (pills || []).map(pill => {
    const { name, email } = parseWrittenAddress(canonicalRecipient(pill));
    const at = email.lastIndexOf('@');
    return { Name: name, Mailbox: at === -1 ? email : email.slice(0, at), Host: at === -1 ? '' : email.slice(at + 1) };
  });
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
  /** The whole folder, asked for by the list's banner: `doomed` cannot name it. */
  matching?: { count: number };
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
      /* Clip, where the browser knows it: a hidden host is still a scroll
         container, so a scrollIntoView() or focus() on anything at its clipped
         edge scrolled the whole page by what overflowed, cutting off the top
         of the header until the next navigation. Clip cuts the same and
         cannot be scrolled at all. */
      overflow: clip;
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

    alps-sidebar.desktop-sidebar[collapsed][peeking] {
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
   * lists several folders' messages, and a UID means nothing outside its own.
   * Under {@link selectAllMatching} these are the rows of this page that the
   * whole-folder selection still covers — what the list draws checked. */
  @state() private selectedKeys = new Set<string>();
  /**
   * The gesture is about every message the folder holds that the listing's
   * query matches, not the rows on screen: the list's "select all in this
   * folder". The server resolves that against the mailbox, so it holds for the
   * pages the user never looked at.
   */
  @state() private selectAllMatching = false;
  /** Under it, the rows unchecked afterwards, by key: the write's exceptions. */
  @state() private excludedKeys = new Set<string>();

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
  /**
   * The folder the rows were read from, which trails `currentMailbox` the same
   * way and for the same reason: a folder switch leaves the previous folder's
   * rows up until the new ones land, and the list draws a row by the folder it
   * came from. '' until anything has been listed.
   */
  @state() private listedMailbox = '';
  /** The search the rows were read under, trailing `filterQuery` the same way. */
  private listedQuery = '';
  @state() private totalMessages = 0;
  @state() private messagesPerPage = 50;
  @state() private resizerPositionX = SIDEBAR_WIDTH_DEFAULT + Math.max(MESSAGE_LIST_WIDTH_MIN, (window.innerWidth - SIDEBAR_WIDTH_DEFAULT) * 0.4);
  @state() private listHeight = Math.max(HORIZONTAL_LIST_HEIGHT_DEFAULT, (window.innerHeight - HEADER_HEIGHT) * 0.4);
  @state() private isSidebarDragging = false;
  @state() private isPaneDragging = false;
  @state() private sidebarWidth = SIDEBAR_WIDTH_DEFAULT;
  @state() private densityMode: DensityMode = 'compact';
  @state() private showSenderAvatars = true;
  @state() private isSyncing = false;
  @state() private sidebarCollapsed = false;
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

  /** How many messages a gesture is about. */
  private get selectionCount(): number {
    if (!this.selectAllMatching) return this.selectedKeys.size;
    return Math.max(0, this.totalMessages - this.excludedKeys.size);
  }

  /** What a whole-folder write names: the listing's query, and the exceptions. */
  private get matchingScope(): MatchingScope {
    return { query: this.filterQuery, except: [...this.excludedKeys].map(key => parseMessageKey(key).uid) };
  }

  /** Every message the list shows, by key, a thread's own members included. */
  private listedKeys(): string[] {
    const keys: string[] = [];
    for (const msg of this.messages || []) {
      keys.push(this.keyOf(msg));
      for (const sub of msg.SubMessages || []) keys.push(this.keyOf(sub));
    }
    return keys;
  }

  /**
   * Takes what the list checked. Under a whole-folder selection the checked
   * rows are the ones NOT excluded, so a row unchecked here becomes an
   * exception the write carries — and one unchecked on a page the user has
   * since left stays one.
   */
  private takeSelection(keys: Set<string>) {
    this.selectedKeys = keys;
    if (!this.selectAllMatching) return;
    const excluded = new Set(this.excludedKeys);
    for (const key of this.listedKeys()) {
      if (keys.has(key)) excluded.delete(key);
      else excluded.add(key);
    }
    this.excludedKeys = excluded;
    // Unchecking the last of them is no longer a selection of anything.
    if (this.selectionCount <= 0) this.clearSelection();
  }

  /** The list's "select all in this folder". */
  private selectAllInFolder() {
    this.selectAllMatching = true;
    this.excludedKeys = new Set();
    this.selectedKeys = new Set(this.listedKeys());
  }

  private clearSelection() {
    this.selectAllMatching = false;
    this.excludedKeys = new Set();
    this.selectedKeys = new Set();
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

  /**
   * Whether this element has been on the page before.
   *
   * app-root keeps one mailbox page for the whole session and re-attaches it
   * when the user comes back from Calendar, Contacts or Settings, so a return
   * is not a first load: the folders, the rows and the open message are all
   * still here, and are shown at once while a quiet read brings them up to date.
   * Built afresh on every return, the page sat on its spinner for a full
   * listing of a folder it had just been showing.
   */
  private hasConnected = false;

  connectedCallback() {
    super.connectedCallback();
    const returning = this.hasConnected;
    this.hasConnected = true;

    // The Messages tab sends a return to `#/`, which names the Inbox. Coming
    // back, that means "the mail", not "the Inbox": put the URL back on the
    // folder, page, search and message that were on screen. A link naming a
    // mailbox of its own is followed as it stands. Not under the Settings
    // window, whose URL this is not: see `updateUrl`.
    const hash = window.location.hash;
    if (returning && !hash.startsWith('#/mailbox/') && !isSettingsHash(hash)) {
      window.history.replaceState(history.state, '', this.hashFor(this.currentMailbox, this.currentPage, this.targetUid, this.filterQuery, this.targetMailbox));
    }
    const heldView = [this.currentMailbox, this.currentPage, this.filterQuery].join('\n');
    if (returning) {
      // The same comparison a hash change makes, against the view still held:
      // another folder or search dims and reads as any switch does, another
      // message opens it, and neither fetches for nothing.
      this.readMailboxHash(pageHash() ?? '', isSettingsHash(hash));
    } else {
      this.extractMailboxFromHash(pageHash() ?? '');
    }
    window.addEventListener('hashchange', this.handleHashChange);

    document.addEventListener('click', this.unlockAudio);
    document.addEventListener('keydown', this.unlockAudio);
    document.addEventListener('keydown', this.handleStrayArrow);

    this._mql.addEventListener('change', this._handleMediaQuery);
    this._handleMediaQuery(this._mql);

    this.settingsStore.addEventListener('change', this._handleSettingsChange);
    this.settingsStore.addEventListener('saved', this.handleSettingsSaved);
    this.i18nStore?.addEventListener('change', this._handleI18nChange);
    this._syncSettings();

    messageSync.addEventListener('sync-start', this.handleSyncStart);
    messageSync.addEventListener('sync-success', this.handleSyncSuccess);
    messageSync.addEventListener('sync-error', this.handleSyncError);
    messageSync.addEventListener('sync-unchanged', this.handleSyncUnchanged);
    messageSync.addEventListener('inbox-counts', this.handleInboxCounts);
    messageSync.addEventListener('labels-success', this.handleLabelsSuccess);
    messageSync.addEventListener('mailbox-not-found', this.handleMailboxNotFound as EventListener);

    window.addEventListener('draft-autosaved', this.handleDraftAutosaved as EventListener);

    if (!returning) {
      messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, true);
    } else if (heldView === [this.currentMailbox, this.currentPage, this.filterQuery].join('\n')) {
      // The rows on screen are this view's, only older: refreshed QUIETLY, so
      // they stay readable instead of dimming under a spinner while it runs.
      messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, true, true);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopResize?.();
    window.removeEventListener('hashchange', this.handleHashChange);
    this._mql.removeEventListener('change', this._handleMediaQuery);
    
    document.removeEventListener('click', this.unlockAudio);
    document.removeEventListener('keydown', this.unlockAudio);
    document.removeEventListener('keydown', this.handleStrayArrow);

    this.settingsStore.removeEventListener('change', this._handleSettingsChange);
    this.settingsStore.removeEventListener('saved', this.handleSettingsSaved);
    this.i18nStore?.removeEventListener('change', this._handleI18nChange);

    messageSync.removeEventListener('sync-start', this.handleSyncStart);
    messageSync.removeEventListener('sync-success', this.handleSyncSuccess);
    messageSync.removeEventListener('sync-error', this.handleSyncError);
    messageSync.removeEventListener('sync-unchanged', this.handleSyncUnchanged);
    messageSync.removeEventListener('inbox-counts', this.handleInboxCounts);
    messageSync.removeEventListener('labels-success', this.handleLabelsSuccess);
    messageSync.removeEventListener('mailbox-not-found', this.handleMailboxNotFound as EventListener);
    window.removeEventListener('draft-autosaved', this.handleDraftAutosaved as EventListener);
    messageSync.stop();
    mailPush.stop();
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
    // nothing is fetched again now. Under Settings only its recorded
    // background changes; the window keeps its own URL.
    const hash = this.hashFor(this.currentMailbox, this.currentPage, this.targetUid, this.filterQuery, this.targetMailbox);
    if (updateSettingsBackground(hash)) return;
    window.history.replaceState(history.state, '', hash);
  }

  private handleDraftAutosaved = (e: CustomEvent) => {
    const { oldUid, oldMailbox, newUid, mailbox, subject, to, cc, bcc, hasAttachments, size } = e.detail;
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
    // The recipients the save stored, which a row in Drafts shows in place of
    // its sender, and Edit Draft opens the composer with. Left out, a row kept
    // the ones it was listed with, and a new one fell back to the sender, the
    // user's own name. A draft keeps Bcc too: its row and selected message
    // must carry the stored recipients so Edit Draft reopens them unchanged.
    const To = listedAddresses(to);
    const Cc = listedAddresses(cc);
    const Bcc = listedAddresses(bcc);
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
      // The subject the save stored, empty when it has none, which the list
      // and the reader show as their own translated placeholder. Falling back
      // to the row's subject kept one the user had cleared, and the English
      // "(No subject)" was written in as if it were the subject.
      Envelope: {
        ...m.Envelope,
        Subject: subject,
        To,
        Cc,
        Bcc
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

    // A save that matched no row is a new row only where drafts are listed,
    // and only over rows that were read: put in where Drafts could not be
    // read, it took the error's place, and the folder looked as if it held
    // that one draft.
    if (!found && this.currentMailbox === mailbox && !(this.listLoadFailed && this.messages.length === 0)) {
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
          Subject: subject,
          Date: new Date().toISOString(),
          From: [{ Name: draftName, Mailbox: draftMailboxStr, Host: draftHostStr }],
          To,
          Cc,
          Bcc
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

  /**
   * Settings the server has taken. A listing is threaded, ordered and paged by
   * the account's record on the server, not by anything the request says, so
   * the rows on screen were read under the old values until a save of new
   * ones has landed, and are read again then, quietly.
   *
   * The page used to be torn down while Settings was open, and read its view
   * again on the way back. It now stays beneath the Settings window, and
   * nothing else would.
   */
  private handleSettingsSaved = (e: Event) => {
    const keys: string[] = (e as CustomEvent).detail?.keys ?? [];
    if (!keys.some((key) => (LISTING_SETTINGS as readonly string[]).includes(key))) return;
    messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, true, true);
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

    // What a listing is read under: the listings kept in memory are dropped
    // when it changes.
    messageSync.setListingSettings(LISTING_SETTINGS.map((key) => state[key]).join(' '));

    // Restart background polling with the configured interval
    if (state.checkMailInterval !== undefined) {
      messageSync.start(state.checkMailInterval);
    }
    // And listen for the news the server pushes, when it does: the poll
    // goes on beside it.
    if (state.pushNewMail) {
      mailPush.start();
    } else {
      mailPush.stop();
    }
  }

  /**
   * A folder list arrived on its own, after a create, a rename or a
   * (un)subscribe (see `messageSync.syncLabels`).
   *
   * The sidebar is all that changes. Deliberately none of what
   * {@link handleSyncSuccess} does besides this: no row moved, so there is no
   * arrival to chime, no listing to call loaded or failed, and no open message
   * whose flags this answer could speak for.
   */
  private handleLabelsSuccess = (e: Event) => {
    const { mailboxes } = (e as CustomEvent).detail;
    this.mailboxes = mailboxes;
  };

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

  /**
   * The folder list an answer carries, with the counts it brings, and an
   * arrival in them announced: the chime, the notification, and the toast
   * that offers the Inbox from elsewhere.
   */
  private takeMailboxes(mailboxes: any[] | undefined, background: boolean, announce: boolean) {
    let isInitialLoad = this.mailboxes.length === 0;
    let soundTriggered = false;
    let notificationTriggered = false;
    let totalNewInboxMessages = 0;

    if (mailboxes) {
      for (const mb of mailboxes) {
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
      this.mailboxes = mailboxes;
    }

    if (announce && soundTriggered && this.settingsStore.getState().soundNotifications) {
      const sound = this.chime();
      sound.currentTime = 0;
      sound.play().catch(e => {
        if (e.name !== 'NotAllowedError') {
          Logger.error('Failed to play sound notification:', e);
        }
      });
    }

    if (announce && notificationTriggered && this.settingsStore.getState().desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
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
  }

  /**
   * The Inbox's counts alone, read on news of it pushed while another folder
   * or a search is on screen (see messageSync.inboxChanged): the sidebar
   * shows them, and an arrival is announced as a poll's would be.
   */
  private handleInboxCounts = (e: Event) => {
    const { counts, announce } = (e as CustomEvent).detail;
    const isInbox = (mb: any) => String(mb.Name || mb.Mailbox).toUpperCase() === 'INBOX';
    if (!this.mailboxes.some(isInbox)) return;
    const mailboxes = this.mailboxes.map((mb: any) => (isInbox(mb) ? { ...mb, Total: counts.total, Unseen: counts.unseen } : mb));
    this.takeMailboxes(mailboxes, true, announce !== false);
  };

  private handleSyncSuccess = (e: Event) => {
    this.isSyncing = false;
    this.listLoadFailed = false;
    const { data, background } = (e as CustomEvent).detail;
    // A check made in a tab that does not poll: the tab that polls has chimed,
    // or will chime, for the same arrival.
    const announce = (e as CustomEvent).detail.announce !== false;

    if (data.Username) {
      this.username = data.Username;
      const state = this.settingsStore.getState();
      // The address too: a bare login is not the address it stands for.
      const address = data.Address || undefined;
      if (state.loginUsername !== data.Username || state.loginAddress !== address) {
        this.settingsStore.updateSettings({ loginUsername: data.Username, loginAddress: address });
      }
    }

    this.takeMailboxes(data.Mailboxes, background, announce);

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
    } else if (this.pastTheLastPage(data)) {
      // A later page that has emptied, which the server answers as asked: no
      // rows. Moving or deleting every row on the last page re-read that page,
      // and the list said "No messages" with only Previous offered while the
      // folder still held mail. The last page that exists is read instead,
      // quietly and without a refresh as the re-read was, and the address says
      // so without adding a step to go back to.
      const perPage = data.MessagesPerPage || this.messagesPerPage;
      const last = Math.max(0, Math.ceil(data.Total / perPage) - 1);
      this.currentPage = last;
      // Keep the window URL, and record the corrected page beneath it.
      const hash = this.hashFor(this.currentMailbox, last, this.targetUid, this.filterQuery, this.targetMailbox);
      if (!updateSettingsBackground(hash)) window.history.replaceState(history.state, '', hash);
      messageSync.fetch(this.currentMailbox, last, this.filterQuery, false, true);
      return;
    } else {
      if (data.Page !== undefined) this.currentPage = data.Page;
      this.listedPage = data.Page !== undefined ? data.Page : this.currentPage;
      this.listedMailbox = data.ListedMailbox || this.currentMailbox;
      this.listedQuery = this.filterQuery;
      if (data.Total !== undefined) this.totalMessages = data.Total;
      if (data.MessagesPerPage !== undefined) this.messagesPerPage = data.MessagesPerPage;
      if (data.Messages) {
        // Only when the answer differs from what is shown. Every read parses
        // its own objects, so assigning one re-ran every row template and every
        // sender lookup for a folder where nothing had moved — which is what a
        // check, and a sync after a write elsewhere, usually finds.
        if (!sameListing(this.messages, data.Messages)) {
          this.messages = data.Messages;
          // A whole-folder selection covers the page that just arrived, less
          // whatever the user unchecked before paging here. Inside the guard on
          // purpose: an answer identical to what is on screen brought no new
          // rows to cover, and a fresh Set would repaint the list for nothing.
          if (this.selectAllMatching) {
            this.selectedKeys = new Set(this.listedKeys().filter(key => !this.excludedKeys.has(key)));
          }
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

  /** Whether a listing is of a page beyond the folder's last. */
  private pastTheLastPage(data: MailboxData): data is MailboxData & { Total: number } {
    const page = data.Page ?? this.currentPage;
    const perPage = data.MessagesPerPage || this.messagesPerPage;
    if (page <= 0 || (data.Messages?.length ?? 0) > 0) return false;
    if (data.Total === undefined || data.Total <= 0 || perPage <= 0) return false;
    return Math.ceil(data.Total / perPage) - 1 < page;
  }

  /** A check that found the folder as it was listed: nothing to show. */
  private handleSyncUnchanged = () => {
    this.isSyncing = false;
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
      // The rows still up are another view's when the read was of a folder,
      // a page or a search they were not read from: left up, dimmed, while it
      // loaded, and then undimmed, they passed for its contents under its
      // name, and the list, which says a load failed only when it has no
      // rows, said nothing. They go, and the list says so and offers a retry.
      if (this.listedMailbox !== this.currentMailbox || this.listedPage !== this.currentPage || this.listedQuery !== this.filterQuery) {
        this.messages = [];
      }
    }
  };

  /**
   * ArrowDown or ArrowUp pressed where nothing else takes it: the list's.
   *
   * The list moves its cursor only on keys pressed inside it, and opening a
   * folder from the sidebar leaves the focus on the page or on the folder's
   * name, neither of which the list hears, so the arrows did nothing until
   * the list had been clicked. Only a key from the page body, a link or a
   * folder's name in the sidebar is passed on: a folder's name is a button
   * that takes no arrows. A field, another button, a menu or a dialog keeps
   * its own arrows, and so does the list.
   */
  private handleStrayArrow = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (this.showDeleteConfirm) return;
    // The Settings window is over this page. A click on its dimmed backdrop
    // leaves focus on the body, and an arrow from there moved the message
    // list nobody could see.
    if (isSettingsHash(window.location.hash)) return;
    // The composed path, because the list, the sidebar and every popup are
    // shadow roots that `closest()` cannot see out of.
    const path = e.composedPath().filter((n): n is HTMLElement => n instanceof HTMLElement);
    const origin = path[0];
    const folderName = origin?.classList.contains('folder-name') && path.some(n => n.tagName === 'ALPS-FOLDER-LIST');
    if (!origin || (origin !== document.body && origin.tagName !== 'A' && !folderName)) return;
    if (path.some(n => n.tagName === 'ALPS-MESSAGE-LIST' || n.tagName === 'DIALOG'
      || ['dialog', 'menu', 'listbox'].includes(n.getAttribute('role') ?? ''))) return;
    const list = this.renderRoot.querySelector('alps-message-list') as MessageList | null;
    if (!list) return;
    e.preventDefault();
    list.step(e.key === 'ArrowDown' ? 1 : -1);
  };

  private handleMailboxNotFound = () => {
    this.showGlobalToast(this.i18nStore.t('mailboxPage.mailboxNotFound'), '', undefined, 3000);
    this.updateUrl(FOLDER_INBOX, 0, null, null);
  };

  private handleHashChange = () => {
    // The Settings window, opened over this page: the URL is the window's, and
    // this page is still the one beneath it. Read as a URL naming no folder it
    // was the Inbox, which dropped the open message and the search the window
    // closes back onto.
    if (isSettingsHash(window.location.hash)) return;
    this.readMailboxHash(window.location.hash);
  };

  /** Initializes a reattached page from the address recorded beneath Settings. */
  private readMailboxHash(hash: string, restoring = false) {
    const oldMailbox = this.currentMailbox;
    const oldPage = this.currentPage;
    const oldUid = this.targetUid;
    const oldUidMailbox = this.targetMailbox;
    const oldFilter = this.filterQuery;

    this.extractMailboxFromHash(hash);

    if (oldMailbox !== this.currentMailbox || oldPage !== this.currentPage || oldFilter !== this.filterQuery) {
      if (oldMailbox !== this.currentMailbox) {
        this.selectedMessage = null; // Reset selection on mailbox change
        if (!restoring) this.currentPage = 0; // A restored address names its page.
        this.clearSelection(); // Another folder is not what was selected

        // Do not clear this.messages to prevent UI flash, let it be replaced when network returns
        this.loadingMessages = true; // Show loading immediately
      } else if (oldFilter !== this.filterQuery) {
        // Do not clear this.messages
        this.loadingMessages = true;
        if (!restoring) this.currentPage = 0;
        // The query is what a whole-folder selection is made of, so another
        // query is another selection.
        this.clearSelection();
      }
      messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, false);
    } else if (oldUid !== this.targetUid || oldUidMailbox !== this.targetMailbox) {
      this.applyTargetUid();
    }
  };

  /** Ends the pane drag in progress, if any; null when there is none. A page
   * that leaves the screen mid-drag calls it, or its window listeners would
   * keep running against it until the next mouseup. */
  private stopResize: (() => void) | null = null;

  private startResize = (e: MouseEvent) => {
    e.preventDefault();
    this.stopResize?.();
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
      this.stopResize = null;
      this.isPaneDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    this.stopResize = onMouseUp;
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
    // A live update beneath Settings changes its canonical background and
    // the page's state, while the browser keeps the window's URL. Back/Close
    // then restores this effective route rather than a deleted folder or UID.
    const hash = this.hashFor(mailbox, page, uid, filterQuery, uidMailbox);
    if (updateSettingsBackground(hash)) {
      this.readMailboxHash(hash, true);
      return;
    }
    window.location.hash = hash;
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

  private extractMailboxFromHash(hash: string = window.location.hash) {
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
    //
    // Asked for the view the reader shows, and kept where the reader looks
    // first: the answer carries what the reader's own read of it would have,
    // the part's text included, so the reader does not read the message
    // again. Asked without the view and kept nowhere, the reader asked for
    // the same message again the moment it was given it.
    if (!msg && this.messages.length > 0) {
      try {
        const view = this.settingsStore?.getState()?.preferredView || 'html';
        // Taken before asking, as the reader takes it: an answer that lands
        // after its user signed out is not kept for the next one.
        const cacheGeneration = MessageCache.generation();
        const metadataRes = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/messages/${currentTargetUid}?view=${view}`);
        if (metadataRes.ok) {
          const data = await metadataRes.json();
          if (data.Message) {
            msg = { ...data.Message, Mailbox: data.Message.Mailbox || mailbox };
            // Kept as the reader keeps its own read, in the entry
            // fetchItemBody in message-reader.ts writes; a change to the one
            // belongs in the other. An answer whose part comes without its
            // text, which the server leaves out when it cannot decode it, is
            // not kept: the reader reads that message as it reads any other.
            // A message with no text part has no text to wait for, and is.
            const part = data.Part;
            if ((!part || typeof data.Body === 'string') && MessageCache.generation() === cacheGeneration) {
              const isHtml = !!part && (part.MIMEType || part.MimeType || 'text/plain').toLowerCase() === 'text/html';
              MessageCache.set(msg.Mailbox, String(msg.UID), view, {
                Message: data.Message,
                Part: part,
                Attachments: data.Attachments,
                RawHtml: part && isHtml ? data.Body : undefined,
                RawText: part && !isHtml ? data.Body : undefined,
                HasHTML: !!data.HasHTML,
                HasText: !!data.HasText,
              });
            }
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
      this.movedMessage(false, 1, trash),
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
    // One re-read of the list for the whole gesture, not one per folder.
    await messageSync.afterWrites(async () => {
      for (const [mailbox, uids] of uidsByMailbox(keys)) {
        const result = await write(mailbox, uids);
        if (result.ok) {
          done.push({ mailbox, uids, result });
          continue;
        }
        refused ??= result;
        if (result.reason === 'auth') break;
      }
    });
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
   * Sets flags on what the gesture is about: every message the folder holds
   * that matches, or the keys. Either way the rows on screen are painted.
   */
  private async flagTargets(targets: string[], flags: string[], op: 'add' | 'remove'): Promise<FlagResult> {
    if (!this.selectAllMatching) return this.flagEach(targets, flags, op);
    const result = await messageOperations.setFlagMatching(this.currentMailbox, this.matchingScope, flags, op);
    if (result.ok) {
      for (const flag of flags) this.updateLocalMessageFlags(targets, flag, op);
    }
    return result;
  }

  /**
   * Files every message the folder holds that matches, and says how many. One
   * request: the folder is the operand, and the server searches it.
   */
  private async fileWholeFolder(to: string, say: (count: number) => string) {
    const view = this.currentMailbox;
    const scope = this.matchingScope;
    const result = await messageOperations.moveMatching(view, scope, to);
    if (!result.success) {
      if (result.reason !== 'auth') this.reportActionFailed('toast.moveFailed', 'Could not move that');
      return;
    }

    this.clearSelection();
    this.selectedMessage = null;
    this.updateUrl(view, this.currentPage, null);

    const undoFn = this.undoMoves([{ from: view, mapping: result.uidMapping ?? {} }], to, view, undefined);
    this.showGlobalToast(say(result.count ?? 0), undoFn ? this.i18nStore?.t('mailboxPage.undo') : '', undoFn, UNDO_TOAST_TIMEOUT_MS);
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
    // A listing out now was read with the rows, and is answered without them.
    const keepOut = keys.length > 0 ? messageSync.rowsTakenOut(keys) : () => {};
    const putBack = (written: string[]) => {
      if (this.messages !== this.rowsAfterTakeOut) return false;
      keepOut();
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
    if (this.selectAllMatching) return this.fileWholeFolder(to, say);
    const view = this.currentMailbox;
    const open = this.selectedMessage ? this.keyOf(this.selectedMessage) : undefined;
    // Checked rows leave now, not when the server has finished with them — see
    // {@link takeRowsOut}. Only the ones that are actually going: a message
    // already in `to` is left where it is, and so is its row. The single-message
    // paths say so their own way, by closing the reader on the message.
    const leaving = isBulk ? keys.filter(key => parseMessageKey(key).mailbox !== to) : [];
    const putBack = isBulk ? this.takeRowsOut(leaving) : undefined;
    // One re-read for the gesture, the one rows that could not be put back
    // ask for included (see messageSync.afterWrites).
    await messageSync.afterWrites(async () => {
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
          // What the refusing folder held is still in it: its rows come back,
          // and come back CHECKED, which is the state the user needs to try
          // again.
          const went = new Set(filed);
          const stayed = keys.filter(key => !went.has(key));
          if (putBack(leaving.filter(key => went.has(key)))) this.selectedKeys = new Set(stayed);
          else messageSync.sync();
        }
      }
    });
  }

  /**
   * The undo of a move: each folder's messages go back to that folder. After
   * the open message, alone or with the rest of its conversation, the reader
   * reopens on the message that was being read (`reopen`, its key before the
   * move); after checked rows, they are checked again where they are listed,
   * unless `recheck` is off because they were never checked — a row dragged
   * away by itself comes back as it left.
   */
  private undoMoves(
    moved: { from: string; mapping: Record<string, string> }[],
    to: string,
    view: string,
    reopen: string | undefined,
    recheck = true,
  ): (() => Promise<void>) | undefined {
    const back = moved.filter(({ mapping }) => Object.keys(mapping).length > 0);
    if (back.length === 0) return undefined;
    return async () => {
      try {
        const restored: string[] = [];
        let reopened: string | null = null;
        let refused: MoveResult | undefined;
        // One re-read for the undo, however many folders it puts messages
        // back into.
        await messageSync.afterWrites(async () => {
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
        });
        if (refused && refused.reason !== 'auth') this.reportActionFailed('toast.undoFailed', 'Could not undo that');
        if (restored.length === 0) return;
        if (reopen !== undefined) {
          const page = this.currentMailbox === view ? this.currentPage : 0;
          this.openKeyInUrl(view, page, reopened);
        } else if (recheck && this.currentMailbox === view) {
          this.selectedKeys = new Set([...this.selectedKeys, ...restored]);
        }
      } catch (err) {
        Logger.error("Undo failed", err);
        this.reportActionFailed('toast.undoFailed', 'Could not undo that');
      }
    };
  }

  /** Copies the messages the keys name into `to`, each from its own folder, and says so. */
  private async copyKeys(keys: string[], to: string, many: boolean) {
    const { done, refused } = await this.eachFolder(keys, async (from, uids): Promise<MoveOutcome> => {
      const result = await messageOperations.copyMessages(from, uids, to);
      return { ok: result.success, reason: result.reason, uidMapping: {} };
    });
    const copied = this.writtenKeys(done).length;
    if (copied > 0) {
      const toastMessage = many
        ? this.i18nStore?.t('toast.messagesCopiedToFolder', { count: copied, folder: this.folderCaption(to) })
        : this.i18nStore?.t('toast.messageCopiedToFolder', { folder: this.folderCaption(to) });
      this.showGlobalToast(toastMessage, '', undefined, UNDO_TOAST_TIMEOUT_MS);
    }
    if (refused && refused.reason !== 'auth') this.reportActionFailed('toast.copyFailed', 'Could not copy that');
  }

  /**
   * Messages dropped on a folder in the sidebar: moved there, or copied with
   * Alt (Option) held.
   *
   * Checked rows are acted on as the selection bar's Move to acts on them, a
   * selection of the whole folder included, so a drop and the picker cannot
   * disagree about what was filed. Any other row is its own operand — a
   * collapsed conversation all of its messages, each from the folder it is in
   * — and only those of them not already in the folder go: copying a message
   * into its own folder would make a second one.
   */
  private handleDroppedMessages = (e: CustomEvent<{ folder: string; copy: boolean; keys: string[]; selection: boolean }>) => {
    const { folder, copy, keys, selection } = e.detail;
    // The folder list refuses these already; this is the page's own word on
    // it, for a drop that arrives some other way.
    const target = this.mailboxes.find(m => (m.Name || m.Mailbox) === folder);
    if (!acceptsDroppedMessages(target, this.mailboxes, this.currentMailbox)) return;
    if (selection && this.selectionCount > 0) {
      void this._handleReaderAction(new CustomEvent('action', { detail: { action: copy ? 'copyTo' : 'moveTo', folder } }));
      return;
    }
    const away = keys.filter(key => parseMessageKey(key).mailbox !== folder);
    if (away.length === 0) return;
    void (copy ? this.copyKeys(away, folder, away.length > 1) : this.fileDropped(away, folder));
  };

  /**
   * Files dragged rows that were not the checked ones in `to`, says so, and
   * offers to put each back where it came from.
   *
   * fileAway's work, with two differences that follow from the rows not being
   * the selection. The reader stays on the message it shows unless that
   * message was among them, since dragging one row away while reading another
   * is not a gesture about the one being read. And an undo brings the rows
   * back unchecked, as they left.
   */
  private async fileDropped(keys: string[], to: string) {
    const view = this.currentMailbox;
    const open = this.selectedMessage ? this.keyOf(this.selectedMessage) : undefined;
    // The rows leave with the gesture, as checked ones do: see takeRowsOut.
    const putBack = this.takeRowsOut(keys);
    // One re-read for the gesture, as in fileAway.
    await messageSync.afterWrites(async () => {
      const { done, refused } = await this.eachFolder(keys, async (from, uids): Promise<MoveOutcome> => {
        const result = await messageOperations.moveMessages(from, uids, to);
        return { ok: result.success, reason: result.reason, uidMapping: result.uidMapping ?? {} };
      });

      const filed = this.writtenKeys(done);
      if (filed.length > 0) {
        const wasOpen = open !== undefined && filed.includes(open);
        if (wasOpen) {
          this.selectedMessage = null;
          this.updateUrl(this.currentMailbox, this.currentPage, null);
        }
        const moved = done.map(({ mailbox, result }) => ({ from: mailbox, mapping: result.uidMapping }));
        const undoFn = this.undoMoves(moved, to, view, wasOpen ? open : undefined, false);
        this.showGlobalToast(this.movedMessage(filed.length > 1, filed.length, to), undoFn ? this.i18nStore?.t('mailboxPage.undo') : '', undoFn, UNDO_TOAST_TIMEOUT_MS);
      }
      if (refused && refused.reason !== 'auth') {
        this.reportActionFailed('toast.moveFailed', 'Could not move that');
        // What the refusing folder held is still in it, and its rows come back.
        const went = new Set(filed);
        if (!putBack(keys.filter(key => went.has(key)))) messageSync.sync();
      }
    });
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

  /**
   * What a folder is called in a toast: a special folder as the sidebar and
   * the header call it, any other as the Move-to row the user picked it from.
   *
   * The toasts had words of their own for the special folders, and they were
   * not the sidebar's. Report as spam said "moved to Spam" beside a sidebar
   * saying "Junk" (in Spanish "No deseado", in Italian "Indesiderata"), and
   * Not spam said "Recibidos" where the sidebar says "Entrada". A move or copy
   * into a special folder picked from the list printed its IMAP name,
   * "[Gmail]/Trash" or "INBOX".
   */
  private folderCaption(folder: string): string {
    return getDestinationLabel(folder, this.i18nStore, this.mailboxes);
  }

  /** What a toast says of messages filed away into `folder`. */
  private movedMessage(many: boolean, count: number, folder: string): string {
    const name = this.folderCaption(folder);
    return many
      ? this.i18nStore?.t('toast.messagesMovedToFolder', { count, folder: name })
      : this.i18nStore?.t('toast.messageMovedToFolder', { folder: name });
  }

  private async _handleReaderAction(e: CustomEvent<ReaderActionDetail>) {
    const action = e.detail.action;
    if (e.detail.uid && e.detail.mailbox) return this.handleNamedMessageAction(e.detail);
    const isBulk = this.selectionCount > 0;
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
        const result = await this.flagTargets(write.keys, [FLAG_FLAGGED], write.op);
        if (!result.ok) this.reportFlagFailure(result);
      } else if (action === 'addTag' || action === 'removeTag') {
        const tags = e.detail.tags || (e.detail.folder ? [e.detail.folder] : []);
        if (!tags || tags.length === 0) return;
        const op = action === 'addTag' ? 'add' : 'remove';
        // Tags are the path this matters most on: the backend stores only
        // `$label1`..`$label5` and used to answer 200 OK for anything else, so a
        // tag it would never keep was painted here and quietly erased later.
        // Which tags those are is read from the rows on screen — see the
        // reader's own gathering — so a whole-folder "remove all tags" takes
        // off what this page carries.
        const result = await this.flagTargets(targets, tags, op);
        if (!result.ok) this.reportFlagFailure(result);
        this.requestUpdate();
      } else if (action === 'markUnread') {
        if (isBulk) {
          const result = await this.flagTargets(targets, [FLAG_SEEN], this.allSelectedUnread ? 'add' : 'remove');
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

        if (action === 'delete' && this.selectAllMatching) {
          // A whole folder is one folder, so its Delete is one kind: for good
          // where a move to Trash would change nothing, and a move otherwise.
          if (this.deletesForGood(this.currentMailbox)) {
            this.pendingDeleteDetails = {
              isBulk,
              doomed: [],
              toTrash: [],
              isDrafts: mailboxRoleByName(this.currentMailbox, this.mailboxes) === 'drafts',
              matching: { count: this.selectionCount },
            };
            this.showDeleteConfirm = true;
            return;
          }
        } else if (action === 'delete') {
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

        await this.fileAway(targets, destinationFolder, isBulk, count => this.movedMessage(many, count, destinationFolder));
      } else if (action === 'moveTo' || action === 'copyTo') {
        const destinationFolder = e.detail.folder;
        if (!destinationFolder) return;

        if (action === 'moveTo') {
          await this.fileAway(targets, destinationFolder, isBulk, count => this.movedMessage(many, count, destinationFolder));
        } else if (this.selectAllMatching) {
          const result = await messageOperations.copyMatching(this.currentMailbox, this.matchingScope, destinationFolder);
          if (result.success) {
            const count = result.count ?? 0;
            this.showGlobalToast(
              many
                ? this.i18nStore?.t('toast.messagesCopiedToFolder', { count, folder: this.folderCaption(destinationFolder) })
                : this.i18nStore?.t('toast.messageCopiedToFolder', { folder: this.folderCaption(destinationFolder) }),
              '', undefined, UNDO_TOAST_TIMEOUT_MS);
          } else if (result.reason !== 'auth') {
            this.reportActionFailed('toast.copyFailed', 'Could not copy that');
          }
        } else {
          await this.copyKeys(targets, destinationFolder, many);
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

    const { isBulk, doomed, toTrash, isDrafts, named, matching } = details;
    const many = matching ? matching.count > 1 : doomed.length > 1;
    if (isBulk) this.bulkProcessing = true;
    try {
      if (matching) {
        // The whole folder, deleted for good: one request, and the server
        // searches the folder rather than taking a page of UIDs on trust.
        const result = await messageOperations.deleteMatchingResult(this.currentMailbox, this.matchingScope);
        if (result.ok) {
          const count = result.count ?? 0;
          this.clearSelection();
          this.selectedMessage = null;
          this.updateUrl(this.currentMailbox, this.currentPage, null);
          const toastMessage = isDrafts
            ? (many ? this.i18nStore?.t('toast.draftsDiscarded', { count }) : this.i18nStore?.t('toast.draftDiscarded'))
            : (many ? this.i18nStore?.t('toast.messagesPermanentlyDeleted', { count }) : this.i18nStore?.t('toast.messagePermanentlyDeleted'));
          this.showGlobalToast(toastMessage, '', undefined, UNDO_TOAST_TIMEOUT_MS);
        } else if (result.reason !== 'auth') {
          this.reportActionFailed('toast.messageDeleteFailed', 'The message could not be deleted');
        }
        return;
      }

      // One re-read for the whole Delete: the folders where it is for good, and
      // those where it is a move to Trash (see messageSync.afterWrites).
      await messageSync.afterWrites(async () => {
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
          await this.fileAway(toTrash, trash, isBulk, count => this.movedMessage(isBulk || toTrash.length > 1, count, trash));
        }
      });
    } finally {
      if (isBulk) this.bulkProcessing = false;
    }
  }

  /**
   * What the delete dialog says, by what confirming it does.
   *
   * Drafts are deleted for good like Trash, but a draft is discarded, not a
   * message received, and the toast that follows already says so. The dialog
   * asked "Permanently Delete?" over a single draft whose own Discard, in the
   * composer, asks "Discard Draft?" for the same deletion.
   */
  private get deleteDialogWords(): { title?: string; message?: string; confirm?: string } {
    const t = (key: string) => this.i18nStore?.t(key);
    const details = this.pendingDeleteDetails;
    const many = ((details?.matching?.count ?? details?.doomed.length) ?? 0) > 1;
    if (details?.isDrafts) {
      return {
        title: t(many ? 'mailboxPage.discardDraftsTitle' : 'floatingComposer.discardDraftTitle'),
        message: t(many ? 'mailboxPage.discardDraftsMessage' : 'floatingComposer.discardDraftMessage'),
        confirm: t('floatingComposer.discard'),
      };
    }
    return {
      title: t('mailboxPage.permanentlyDelete'),
      message: t(many ? 'messageReader.deleteConfirmMultiple' : 'messageReader.deleteConfirmSingle'),
      confirm: t('mailboxPage.deletePermanently'),
    };
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
        .mailboxes=${this.mailboxes}
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
      <div class="app-container layout-${effectiveLayoutMode} ${isReadingFull ? 'reading' : ''} ${this.isPaneDragging || this.isSidebarDragging ? 'dragging' : ''} ${this.sidebarCollapsed && !this.isMobile ? 'collapsed' : ''} ${this.isMobile ? 'mobile-view' : ''}" style="${!this.sidebarCollapsed && !this.isMobile ? `--sidebar-width: ${this.sidebarWidth}px;` : ''}">
        <alps-sidebar 
          class="${this.isMobile ? 'mobile-sidebar' : 'desktop-sidebar'} ${this.mobileSidebarOpen ? 'open' : ''}"
          .isMobile=${this.isMobile}
          .isOpen=${this.mobileSidebarOpen}
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
        >
          <alps-folder-list
            .mailboxes=${this.mailboxes}
            .currentMailbox=${this.currentMailbox}
            .expandedFolders=${this.expandedFolders}
            .layoutMode=${effectiveLayoutMode}
            .syncing=${this.isSyncing}
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
          this.clearSelection();
          this.updateUrl(e.detail.name, 0, null);
        }

        closeSidebarPeek(this.renderRoot);
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
            @drop-messages=${this.handleDroppedMessages}
          ></alps-folder-list>
          <alps-icon-btn 
            slot="footer-actions"
            class="new-folder-btn"
            icon="folderPlus"
            title="${this.i18nStore?.t('folderList.createFolder')}"
            @click=${this.openFolderPrompt}
          ></alps-icon-btn>
        </alps-sidebar>
        <div class="main-view">
          <div class="pane message-list-pane" style="position: relative; ${effectiveLayoutMode === 'vertical' ? `width: ${this.effectiveListWidth}px; flex: none; ${this.isPaneDragging || this.isSidebarDragging ? '' : 'transition: width 0.2s;'}` : effectiveLayoutMode === 'horizontal' ? `height: ${this.listHeight}px; flex: none;` : ''}">

            <alps-message-list
              .messages=${this.messages}
              .currentMailbox=${this.currentMailbox}
              .currentMailboxRole=${mailboxRoleByName(this.currentMailbox, this.mailboxes) || ''}
              .listedMailbox=${this.listedMailbox}
              .listedMailboxRole=${mailboxRoleByName(this.listedMailbox, this.mailboxes) || ''}
              .mailboxes=${this.mailboxes}
              .sidebarCollapsed=${this.sidebarCollapsed && !this.isMobile}
              .loading=${this.loadingMessages}
              .selectedMessage=${this.selectedMessage}
              .selectedMessages=${this.selectedKeys}
              .selectAllMatching=${this.selectAllMatching}
              .matchingCount=${this.selectionCount}
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
        // Try again, over a view that could not be read: that view is read
        // again, as asked. Turned back to the first page as a check for new
        // mail is, a retry after a failed page change listed page 0 under the
        // address of the page that failed, and Next, which asks for that same
        // address, then changed nothing.
        if (this.listLoadFailed && this.messages.length === 0) {
          messageSync.fetch(this.currentMailbox, this.currentPage, this.filterQuery, true);
          return;
        }
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
              @selection-changed=${(e: CustomEvent) => this.takeSelection(e.detail.selectedKeys)}
              @select-all-matching=${() => this.selectAllInFolder()}
              @clear-selection=${() => this.clearSelection()}
              @toggle-star-message=${this._handleListToggleStar}
            >
              <div slot="mobile-bulk-actions" class="mobile-bulk-actions-container">
                <alps-icon-btn title=${this.i18nStore?.t('general.cancel') || 'Cancel'} @click=${() => this.clearSelection()} icon="arrowLeft"></alps-icon-btn>
                <span class="mobile-bulk-actions-count">${this.selectionCount}</span>
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
              .selectedCount=${this.selectionCount}
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
          heading=${this.deleteDialogWords.title}
          message=${this.deleteDialogWords.message}
          confirmText=${this.deleteDialogWords.confirm}
          cancelText=${this.i18nStore?.t('general.cancel')}
          .isDanger=${true}
          @confirm=${this._confirmDelete}
          @cancel=${this._cancelDelete}
        ></ui-confirm>
      ` : ''}
    `;
  }
}
