import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { FLAG_SEEN, FLAG_FLAGGED, FLAG_DRAFT, getMessageTags, getTagColor, getTagName, getRemovableTags } from '../utils/flags';
import { FOLDER_INBOX, FOLDER_SENT, encodeMailboxPath, mailboxRoleByName } from '../utils/folders';
import { fetchWithTimeout } from '../utils/fetch-utils';
import { consume } from '@lit/context';
import { activeUsername, settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon, formatFullDate, formatSize, bimiAvatarUrlFor } from '../utils/ui';
import './alps-recipient-pill';
import './alps-attachment-list';
import './alps-toolbar';
import './alps-loader';
import { popupStyles } from './alps-popup';
import './alps-popup';
import './alps-folder-selector-popup';
import './alps-icon-btn';
import './alps-button';
import './alps-avatar';
import './alps-sender-auth-badge';
import './alps-tag';
import './alps-banner';
import { MessageCache } from '../utils/message-cache';
import { sanitizeMessageHTML } from '../utils/html-sanitizer';
import { generateQuote } from '../utils/email-quote';
import { replyContext } from '../utils/reply-context';
import { inlinePartsOf } from '../utils/attachment-utils';
import { composeContext, ComposeStore } from '../store/compose-store';
import { Logger } from '../utils/logger';
import { mailboxOf, messageKey } from '../utils/message-key';
import { registry } from '../plugin-registry';
import { messageOperations } from '../services/message-operations';
import { applyThemeToIframe as sharedApplyTheme, setupIframeSizing as sharedSetupSizing, htmlToPlainText } from '../utils/reader-utils';
import './alps-thread-card';


interface ThreadMessageItem {
  message: any;
  content: string;
  mimeType: string;
  loading: boolean;
  attachments: any[];
  rawMessageHtml: string;
  hasHtml: boolean;
  hasText: boolean;
  activeBanners: any[];
  allowRemoteResources: boolean;
  hasRemoteResources: boolean;
  isSent: boolean;
  mailbox: string;
  expanded: boolean;
}

/** A message that has not been sent: a draft. */
function isUnsent(msg: any): boolean {
  return !!msg?.Flags?.includes(FLAG_DRAFT);
}

/**
 * How many unread messages a conversation OPENS with expanded.
 *
 * Expanding a card fetches its body and, for HTML mail, builds a sandboxed
 * frame that sizes itself. A mailing-list thread seen for the first time can be
 * unread from end to end, and opening it must not be that many of each. The
 * oldest unread are the ones taken, because that is where reading starts; the
 * rest stay collapsed and bold, and expanding one marks it read like any other.
 */
const UNREAD_EXPAND_LIMIT = 10;

/**
 * What the reader asks the page to do, on its `action` event.
 *
 * One message is named by `uid` AND `mailbox`, because a conversation holds
 * replies filed in Sent and a UID means nothing without its folder. `uids` is
 * the other operand: every message of the open conversation filed in the folder
 * being viewed. Neither set means the page's own answer — the checked rows, or
 * the open message.
 */
export interface ReaderActionDetail {
  action: string;
  /** A mailbox for moveTo/copyTo; a keyword for addTag/removeTag. */
  folder?: string;
  tags?: string[];
  /** The conversation's messages in the viewed folder. */
  uids?: string[];
  /** One named message, from a card's own menu. */
  uid?: string;
  mailbox?: string;
  /** For a card's Delete of the OPEN message: a message of the conversation,
   * in the viewed folder, to stay on once it is gone. */
  nextUid?: string;
  /** Told whether a card's Delete happened, so the card goes only if it did.
   * Called once, and not at all when the user cancels a confirmation. */
  done?: (ok: boolean) => void;
}

@customElement('alps-message-reader')
export class MessageReader extends LitElement {
  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @consume({ context: composeContext })
  composeStore!: ComposeStore;

  /** The addresses a reply must not be sent back to: the account's, and the
   * Reply-To it asks answers to go to. */
  private ownAddresses(): string[] {
    const state = this.settingsStore?.getState();
    return [state?.loginUsername || activeUsername() || '', state?.replyTo || ''].filter(Boolean);
  }

  /**
   * Closes the "More" actions popup menu if it is currently open.
   */
  private _closePopup() {
    const popups = this.shadowRoot?.querySelectorAll('alps-popup');
    if (popups) {
      popups.forEach(p => (p as any).close());
    }
  }

  /**
   * Handles user actions triggered from the toolbar or menus.
   * For compose actions (reply/forward), it gathers the message body and metadata,
   * generates a quoted reply block, and opens the composer.
   * 
   * @param action The specific action to perform (e.g., 'reply', 'archive', 'showPlaintext').
   * @param folder Optional folder name, used when moving a message to a specific folder.
   */
  private async _handleAction(action: string, folder?: string) {
    if (action === 'reply' || action === 'replyAll' || action === 'forward') {
      if (!this.message) return;
      this._closePopup();

      let textBody = '';
      if (this.mimeType === 'text/plain') {
        textBody = this.content;
      } else {
        try {
          const textRes = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(this.mailboxOfMessage(this.message))}/messages/${this.message.UID}?view=text`);
          if (textRes.ok) {
            const textData = await textRes.json();
            if (textData.Part && textData.RawText) {
              textBody = textData.RawText;
            }
          }
        } catch (e) {
          Logger.error('Failed to fetch text body for quote', e);
        }
        if (!textBody && this.rawMessageHtml) {
          textBody = htmlToPlainText(this.rawMessageHtml);
        }
      }

      const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
      const hourFormat = String(this.settingsStore?.getState()?.hourFormat || '12');

      const { subject, to, cc, quotedText, quotedHtml } = generateQuote(
        action,
        this.message,
        textBody,
        this.rawMessageHtml,
        this.hasHtml,
        dateFormat,
        hourFormat,
        this.ownAddresses()
      );

      // A forward carries the original's attachments; a reply does not. Both
      // carry its inline parts, which the quote's images name: see inlinePartsOf.
      const forwarded = action === 'forward' ? this.attachments.map(a => ({
        name: a.Filename || 'attachment',
        size: a.Size || 0,
        type: a.MIMEType || 'application/octet-stream',
        partPath: a.Path ? a.Path.join('.') : undefined
      })) : [];
      const attachments = [
        ...forwarded,
        ...inlinePartsOf(this.message.BodyStructure).filter(part => !forwarded.some(a => a.partPath === part.partPath)),
      ];

      const reply = action === 'reply' || action === 'replyAll' ? replyContext(this.message, this.message.Mailbox || this.mailbox) : {};

      this.composeStore.openComposer({
        subject,
        to,
        cc,
        text: quotedText,
        html: quotedHtml,
        format: this.settingsStore?.getState()?.composeFormat || 'html',
        attachments: attachments,
        // The quote keeps the original's inline images, and the composer
        // shows them from the original's own parts.
        quoteSource: { mailbox: this.message.Mailbox || this.mailbox, uid: String(this.message.UID), structure: this.message.BodyStructure },
        ...reply
      });
      return;
    }
    if (action === 'showPlaintext') {
      this.localPreferredView = 'text';
      if (this.message) this.fetchMessageBody(this.message);
      this._closePopup();
      return;
    }
    if (action === 'showHtml') {
      this.localPreferredView = 'html';
      if (this.message) this.fetchMessageBody(this.message);
      this._closePopup();
      return;
    }
    if (action === 'print') {
      const remoteParam = this.allowRemoteResources ? '&remote=1' : '';
      window.open('#/print?mailbox=' + encodeURIComponent(this.mailboxOfMessage(this.message)) + '&uid=' + this.message.UID + remoteParam, '_blank');
      this._closePopup();
      return;
    }
    this._closePopup();
    if (this.toolbarIsConversation) {
      // Above the cards, every verb is about the conversation — see
      // `toolbarIsConversation`. Deleting ONE message is the card's own Delete.
      if (action === 'markUnread') {
        const unread = this.unreadKeys;
        if (unread.length > 0) return void this.markMembersRead(unread);
        // All of it is read, so the toggle means "mark unread", and a
        // conversation is marked unread on the message the list opened, which
        // the page closes the reader behind.
      } else {
        this.dispatchEvent(new CustomEvent<ReaderActionDetail>('action', {
          detail: { action, folder, uids: this.conversationUids },
        }));
        return;
      }
    }
    this.dispatchEvent(new CustomEvent<ReaderActionDetail>('action', { detail: { action, folder } }));
  }

  /**
   * The open message is a draft, whether by its own flag or by the folder it
   * is read in. See {@link toolbarIsConversation} for why that matters.
   */
  private get openIsUnsent(): boolean {
    if (!this.message) return false;
    return isUnsent(this.message) || mailboxRoleByName(this.mailbox || '', this.mailboxes) === 'drafts';
  }

  /**
   * Whether the toolbar is about the CONVERSATION rather than one message.
   *
   * With a conversation on screen the header above the cards is a subject, not
   * a message, and a control up there cannot say which card it means. It used to
   * mean the "open" one — the message the URL names, which nothing on screen
   * marks — so Archive filed that one message out of a conversation of five,
   * and the rest stayed in the folder. The rule is positional now: what sits
   * above the cards acts on all of them, and what acts on one message is in that
   * message's own menu.
   *
   * "All of them" is the conversation's messages in the folder being viewed —
   * the thread the list row stands for. The replies shown from Sent stay where
   * they are: archiving a conversation out of the Inbox is not a reason to file
   * away what you sent.
   *
   * Four cases keep the toolbar they had. A single message is its own
   * conversation. A bulk selection makes the toolbar about the checked rows. A
   * draft, read among the messages it answers, is what the user came for —
   * "Discard draft" must go on meaning the draft. And a view that is not one
   * folder, such as a search across all of them, has no messages "in the
   * folder being viewed" for a conversation verb to take.
   */
  get toolbarIsConversation(): boolean {
    const isBulk = this.selectedCount > 0;
    return !isBulk && this.threadItems.length > 1 && !this.openIsUnsent && this.conversationItems.length > 0;
  }

  /** The conversation's messages filed in the folder being viewed. */
  private get conversationItems(): ThreadMessageItem[] {
    return this.threadItems.filter(item => item.message && item.mailbox === this.mailbox);
  }

  /** Their UIDs — the operand of every verb on the conversation's toolbar. */
  get conversationUids(): string[] {
    return this.conversationItems.map(item => String(item.message.UID));
  }

  /** The keys of the conversation's messages nobody has read yet. */
  private get unreadKeys(): string[] {
    return this.threadItems
      .filter(item => item.message && !item.message.Flags?.includes(FLAG_SEEN) && !isUnsent(item.message))
      .map(item => this.itemKey(item));
  }

  /**
   * Which way the toolbar's read toggle points — true for "Mark as read" — by
   * what the toolbar is about: the checked rows, the conversation, or the open
   * message. Over a conversation it is "Mark as read" while ANY of it is unread,
   * because that is when the list shows the row bold.
   */
  get readToggleMarksRead(): boolean {
    if (this.selectedCount > 0) return this.allSelectedUnread;
    if (this.toolbarIsConversation) return this.unreadKeys.length > 0;
    return !this.message?.Flags?.includes(FLAG_SEEN);
  }

  /** Whether the tag is on what the toolbar is about: every checked row, every
   * message of the conversation in this folder, or the open message. */
  private hasTag(tag: string): boolean {
    const lower = tag.toLowerCase();
    const carries = (flags: string[] | undefined) => !!flags?.some((f: string) => f.toLowerCase() === lower);
    if (this.selectedCount > 0) return carries(this.commonTags);
    if (this.toolbarIsConversation) {
      const members = this.conversationItems;
      return members.length > 0 && members.every(item => carries(item.message.Flags));
    }
    return carries(this.message?.Flags);
  }

  private _handleTag(tag: string) {
    this._closePopup();
    // The operand the toolbar is drawn for. render() shows the bulk toolbar, with
    // the checked rows' common tags, as soon as any row is checked, and the page
    // applies the action to those rows; deciding from the open message until MORE
    // than one was checked meant a click on a single checked row could do nothing.
    const uids = this.toolbarIsConversation ? this.conversationUids : undefined;
    this.dispatchEvent(new CustomEvent<ReaderActionDetail>('action', {
      detail: { action: this.hasTag(tag) ? 'removeTag' : 'addTag', folder: tag, uids },
    }));
  }

  private _handleRemoveAllTags() {
    this._closePopup();
    const isBulk = this.selectedCount > 0; // the same operand as _handleTag

    let tags: string[];
    if (isBulk) {
      // Union of removable keywords across all selected messages, a checked
      // thread's older messages included.
      const set = new Set<string>();
      for (const m of this.messages) {
        for (const one of [m, ...(m.SubMessages || [])]) {
          if (!this.selectedKeys.has(this.keyOf(one))) continue;
          for (const t of getRemovableTags(one.Flags)) set.add(t);
        }
      }
      tags = [...set];
    } else if (this.toolbarIsConversation) {
      const set = new Set<string>();
      for (const item of this.conversationItems) {
        for (const t of getRemovableTags(item.message.Flags)) set.add(t);
      }
      tags = [...set];
    } else {
      tags = getRemovableTags(this.message?.Flags);
    }

    if (tags.length === 0) return;
    const uids = !isBulk && this.toolbarIsConversation ? this.conversationUids : undefined;
    this.dispatchEvent(new CustomEvent<ReaderActionDetail>('action', { detail: { action: 'removeTag', tags, uids } }));
  }

  @state()
  private localPreferredView: 'html' | 'text' | null = null;

  @state()
  private hasHtml: boolean = false;

  @state()
  private hasText: boolean = false;

  @property({ type: String }) mailbox = FOLDER_INBOX;
  @property({ type: Object }) message: any = null;
  @property({ type: Array }) messages: any[] = [];
  /** The rows checked in the list, by {@link messageKey}. Under a whole-folder
   * selection these are the ones this page of it shows. */
  @property({ type: Object }) selectedKeys = new Set<string>();
  /** How many messages the selection holds: the checked rows, or a whole
   * folder the page is one listing of. What the toolbar is drawn for. */
  @property({ type: Number }) selectedCount = 0;
  @property({ type: Boolean }) allSelectedStarred = false;
  @property({ type: Boolean }) allSelectedUnread = false;
  @property({ type: Array }) commonTags: string[] = [];
  @property({ type: Boolean }) bulkProcessing = false;
  @property({ type: String }) layoutMode = 'vertical';
  @property({ type: Array }) mailboxes: any[] = [];

  @state() private content = '';
  @state() private mimeType = '';
  @state() private loading = false;
  @state() private activeBanners: any[] = [];
  @state() private attachments: any[] = [];
  @state() private allowRemoteResources = false;
  @state() private hasRemoteResources = false;
  @state() private rawMessageHtml = '';
  @state() private isScrolled = false;
  @state() private threadItems: ThreadMessageItem[] = [];
  @state() private _isThread = false;
  private _deferPropertySync = false;
  /**
   * The open message's conversation as the server has it: the thread in this
   * mailbox, and the replies filed in Sent, which the list cannot hold.
   */
  private _conversation: { key: string; messages: any[] } | null = null;

  /** The message the reader has already scrolled to, by key. Not `@state`: it
   * records what the DOM has done, and changing it must not schedule a render. */
  private scrolledToKey: string | null = null;
  /** The one pending scroll, so the last decision wins: an open scrolls to the
   * open card, and the conversation landing a moment later may know better. */
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * When each expanded, unread card is due to be marked read, by key — see
   * {@link syncReadTimers}. One map and one timer, so the cards a conversation
   * opens with expanded, which fall due together, go out as one write per folder.
   */
  private readDueAt = new Map<string, number>();
  private readTimer: ReturnType<typeof setTimeout> | null = null;

  private keyOf(msg: any): string {
    return messageKey(this.mailboxOfMessage(msg), msg?.UID);
  }

  /** The folder a message is in: its own, since a search across every folder
   * shows messages from several, and the viewed one otherwise. */
  private mailboxOfMessage(msg: any): string {
    return mailboxOf(msg, this.mailbox);
  }

  private itemKey(item: ThreadMessageItem): string {
    return messageKey(item.mailbox, item.message?.UID);
  }

  private isOpenItem(item: ThreadMessageItem): boolean {
    return !!this.message && this.itemKey(item) === this.keyOf(this.message);
  }

  /** The messages the list shows, which its flag events and updates are about. */
  private listedKeys(): Set<string> {
    const keys = new Set<string>();
    for (const m of this.messages || []) {
      keys.add(this.keyOf(m));
      for (const sub of m.SubMessages || []) keys.add(this.keyOf(sub));
    }
    return keys;
  }

  private cardId(item: ThreadMessageItem): string {
    return `thread-card-${encodeURIComponent(item.mailbox)}-${item.message?.UID}`;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('external-message-flags-changed', this._handleExternalFlagsChanged);
    window.addEventListener('draft-discarded', this._handleDraftDiscarded);
    this.updateComplete.then(() => {
      if (!this.isConnected) return;
      this.settingsStore?.addEventListener('change', this._handleSettingsChange);
    });
  }

  disconnectedCallback() {
    this.settingsStore?.removeEventListener('change', this._handleSettingsChange);
    window.removeEventListener('external-message-flags-changed', this._handleExternalFlagsChanged);
    // A timer that outlived the element would mark mail read for a reader
    // nobody is looking at.
    this.readDueAt.clear();
    // Nor does a reader that has left the page go on reading bodies nobody
    // asked for. The queue is drained one at a time (see queueItemBody), so
    // what is left of it would keep taking the session's one connection for a
    // conversation that is no longer on screen — the same competition the
    // drop-on-open exists to prevent, for an element that cannot even show
    // what it reads.
    this.prefetchQueue = [];
    if (this.readTimer) clearTimeout(this.readTimer);
    this.readTimer = null;
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = null;
    window.removeEventListener('draft-discarded', this._handleDraftDiscarded);
    super.disconnectedCallback();
  }

  /**
   * A draft was discarded from its composer — possibly one on screen here.
   *
   * The composer deletes it and the list re-syncs, and the re-sync takes the
   * row away but never closes the reader: the page keeps the open message
   * whether or not the new list still holds it. So Edit Draft, then Discard,
   * left the deleted draft open. A card for it goes here, as a card's own
   * Delete takes it; the open message closes the reader, as Back does.
   */
  private _handleDraftDiscarded = (e: Event) => {
    const detail = (e as CustomEvent<{ mailbox?: string; uid?: string }>).detail;
    if (!detail?.mailbox || !detail.uid || !this.message) return;
    const key = messageKey(detail.mailbox, detail.uid);
    if (this.threadItems.some(item => this.itemKey(item) === key)) this.dropCard(key);
    if (this.keyOf(this.message) === key) this.dispatchEvent(new CustomEvent('close'));
  };

  private _handleExternalFlagsChanged = (e: Event) => {
    const customE = e as CustomEvent;
    if (!customE.detail) return;
    const { keys, flag, action } = customE.detail;
    if (!this.threadItems || this.threadItems.length === 0) return;

    const named = new Set<string>(keys);
    let updated = false;
    for (let i = 0; i < this.threadItems.length; i++) {
      const item = this.threadItems[i];
      if (item.message && named.has(this.itemKey(item))) {
        const oldFlags = item.message.Flags || [];
        const hasFlag = oldFlags.includes(flag);
        if (action === 'add' && !hasFlag) {
          this.threadItems[i] = {
            ...item,
            message: {
              ...item.message,
              Flags: [...oldFlags, flag]
            }
          };
          updated = true;
        } else if (action === 'remove' && hasFlag) {
          this.threadItems[i] = {
            ...item,
            message: {
              ...item.message,
              Flags: oldFlags.filter((f: string) => f !== flag)
            }
          };
          updated = true;
        }
      }
    }

    if (updated) {
      this.threadItems = [...this.threadItems];
      this.requestUpdate();
      if (this.message && named.has(this.keyOf(this.message))) {
        const hasFlag = this.message.Flags?.includes(flag);
        if (action === 'add' && !hasFlag) {
          this.message.Flags = [...(this.message.Flags || []), flag];
        } else if (action === 'remove' && hasFlag) {
          this.message.Flags = this.message.Flags.filter((f: string) => f !== flag);
        }
        this.message = { ...this.message };
      }
    }
  };

  static styles = [
    popupStyles,
    css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .tags-popup .dropdown-item.active svg {
      margin-left: auto;
      color: var(--text-secondary, #9ca3af);
    }

    .toolbar {
      padding: 0 16px;
      gap: 12px;
      background: var(--bg-primary, #fff);
    }

    .desktop-attachments {
      display: block;
    }

    .mobile-attachments {
      display: none;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .folder-selector {
      display: block;
      width: 100%;
    }

    .reader-header {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .reader-subject {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      display: flow-root;
      word-break: break-word;
    }

    .tag-pills {
      float: right;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-left: 12px;
      margin-bottom: 4px;
    }

    .reader-meta {
      display: flex;
      flex-direction: column;
    }

    .reader-meta-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .reader-sender-block {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .reader-sender-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .avatar-container {
      display: inline-flex;
      flex-shrink: 0;
    }

    .reader-sender-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .reader-sender-line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px 8px;
    }

    .reader-sender-name {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.2;
    }

    .reader-recipients-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .reader-recipients {
      display: flex;
      align-items: baseline;
    }

    .reader-recipients-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color);
      width: 40px;
      text-align: right;
      margin-right: 16px;
      line-height: 1.5;
      flex-shrink: 0;
    }

    .reader-recipients-list {
      line-height: 1.5;
      font-size: 14px;
      flex: 1;
      min-width: 0;
    }

    alps-recipient-pill:not(:last-child)::after {
      content: ", ";
      color: var(--text-color);
      white-space: pre;
    }

    .reader-date {
      font-size: 13px;
      color: var(--text-muted);
    }

    .desktop-date-container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .reader-size {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .mobile-date-container {
      display: none;
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinner {
      animation: spin 3s linear infinite;
      display: flex;
      margin-right: 8px;
    }

    .spinner .icon {
      width: 32px;
      height: 32px;
    }

    .empty-reader-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .bulk-spinner-container {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }

    .spinner.bulk-spinner {
      margin: 0;
    }

    .toolbar-separator {
      width: 1px;
      height: 20px;
      background: var(--border-color);
      margin: 0 8px;
    }

    .mobile-spacer {
      display: none;
    }

    .mobile-only {
      display: none;
    }

    .undisclosed-recipients {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 4px;
    }

    .reader-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
      min-height: 0;
    }

    .loading-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .loading-state {
      display: flex;
      align-items: center;
      color: var(--text-muted);
    }

    .reader-content-wrapper {
      flex: 1;
      min-height: 0;
    }

    .reader-iframe {
      width: 100%;
      min-height: 100%;
      border: none;
      display: block;
    }

    .reader-empty-body {
      padding: 24px;
      color: var(--text-muted);
      font-style: italic;
      text-align: center;
    }

    .reader-text-wrapper {
      padding: 24px;
    }

    .reader-preformatted {
      white-space: pre-wrap;
      font-family: inherit;
      margin: 0;
      color: inherit;
    }

    @media (max-width: 768px) {
      .desktop-only {
        display: none !important;
      }

      .desktop-spacer {
        display: none !important;
      }

      .mobile-spacer {
        flex: 1;
        display: block;
      }

      .toolbar-separator.mobile-only {
        display: block;
      }

      .reader-recipients.mobile-only {
        display: flex;
      }

      .desktop-attachments {
        display: none;
      }

      .mobile-attachments {
        display: block;
        flex-shrink: 0;
      }

      .reader-header {
        padding: 16px;
      }

      .reader-text-wrapper {
        padding: 16px;
      }

      .desktop-date {
        display: none;
      }

      .mobile-date-container {
        display: flex;
        flex-direction: column;
        margin-top: 4px;
      }

      .mobile-date {
        display: block;
        font-weight: normal;
        font-size: 13px;
        line-height: 1.2;
      }

      .mobile-size {
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.2;
        margin-top: 2px;
        font-weight: normal;
      }
    }

    .thread-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }

    .reader-header.thread-header-grouped {
      border-bottom: none;
      padding-bottom: 0;
    }

    /* Lined up with the cards above it, and wrapping rather than shrinking:
       three labels do not fit a narrow pane in German. */
    .conversation-reply {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 16px 24px;
    }
  `];

  /**
   * Lifecycle method called by Lit before the component updates.
   * Intercepts changes to the 'message' or 'mailbox' properties to determine if the local state
   * (like view preferences) should be reset and the message body re-fetched from the backend.
   * 
   * @param changedProperties Map of properties that changed and their previous values.
   */
  updated(changedProperties: Map<string, any>) {
    if (!changedProperties.has('message')) return;
    if (!this.message) {
      this.scrolledToKey = null;
      return;
    }
    // By the message's IDENTITY, not by the property having been reassigned.
    // The open message is handed down again after every flag change and every
    // body load, and scrolling each time took the pane back to the open card
    // from wherever the user was reading.
    const key = this.keyOf(this.message);
    if (key === this.scrolledToKey) return;
    this.scrolledToKey = key;
    this.scrollToCard(key);
  }

  /** Brings a card to the top of the pane after the render that put it there,
   * replacing whatever scroll was pending. */
  private scrollToCard(key: string) {
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      this.scrollTimer = null;
      const item = this.threadItems.find(entry => this.itemKey(entry) === key);
      const el = item ? this.shadowRoot?.getElementById(this.cardId(item)) : null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }

  willUpdate(changedProperties: Map<string, any>) {
    const messageChanged = changedProperties.has('message');
    const mailboxChanged = changedProperties.has('mailbox');
    const messagesListChanged = changedProperties.has('messages');

    if (messageChanged || mailboxChanged) {
      const oldMessage = changedProperties.get('message');
      const oldMailbox = changedProperties.has('mailbox') ? changedProperties.get('mailbox') : this.mailbox;

      if (!this.message) {
        this.localPreferredView = null;
        this.content = '';
        this.mimeType = '';
        this.rawMessageHtml = '';
        this.loading = false;
        this.allowRemoteResources = false;
        this.hasRemoteResources = false;
        this.hasHtml = false;
        this.hasText = false;
        this.activeBanners = [];
        this.threadItems = [];
      } else {
        // By key, not UID: a search of all mailboxes lists the same UID from
        // several folders, and moving between two of them kept the first body.
        const isNewMessage = !oldMessage || this.keyOf(oldMessage) !== this.keyOf(this.message) || oldMailbox !== this.mailbox;

        if (isNewMessage) {
          this.localPreferredView = null;
          this.fetchMessageBody(this.message, this.message._isAutosaveUpdate);
        } else {
          // Message is same, but properties updated (e.g. flags), or message list changed.
          // The parent might pass down a list-level message that lacks BIMI state, so preserve it.
          if (oldMessage) {
            if (oldMessage.HasBimiPotential && !this.message.HasBimiPotential) {
              this.message = { ...this.message, HasBimiPotential: true };
            }
            if (oldMessage.HasBimiFailed && !this.message.HasBimiFailed) {
              this.message = { ...this.message, HasBimiFailed: true };
            }
          }
          this.resolveThread(this.message);

          if (this.message._isAutosaveUpdate && oldMessage && this.message !== oldMessage) {
            this.fetchMessageBody(this.message, true);
          }
        }
      }
    } else if (messagesListChanged && this.message) {
      // Message list changed, re-resolve thread synchronously to pick up any replies or changes.
      this.resolveThread(this.message);
    }

    // Last, so it sees the cards this update settled on. Everything that can
    // change the answer is reactive — the open message, which cards are
    // expanded, their flags, the checked rows — so this one call is every call.
    this.syncReadTimers();
  }

  /**
   * Reading a card marks it read — by the same setting, and after the same
   * delay, as opening a message does.
   *
   * It did not used to, at all. The page marks the OPEN message read and
   * nothing else, so every other message of a conversation stayed unread
   * however thoroughly it was read: expand it, read it, and its row in the list
   * was still bold.
   *
   * A reconcile rather than a call wherever a card opens, because the condition
   * has several moving parts — expanded, unread, not the open message, cards on
   * screen — and any of them can change on its own: a card collapsed before its
   * delay is up, rows checked so the cards give way to the selection. Asked
   * again after every update, none of them needs its own cancel.
   *
   * The open message is left to the page, whose timer it is: two timers on one
   * message would be two writes and two owners.
   */
  private syncReadTimers() {
    const delaySec = this.settingsStore?.getState()?.markReadTimeout ?? 0;
    const isBulk = this.selectedCount > 0;
    const wanted = new Set<string>();
    // `< 0` is the setting's "never mark as read automatically".
    if (delaySec >= 0 && this.threadItems.length > 1 && !isBulk) {
      for (const item of this.threadItems) {
        if (!item.message || !item.expanded || this.isOpenItem(item)) continue;
        if (item.message.Flags?.includes(FLAG_SEEN) || isUnsent(item.message)) continue;
        wanted.add(this.itemKey(item));
      }
    }

    let changed = false;
    for (const key of [...this.readDueAt.keys()]) {
      if (!wanted.has(key)) changed = this.readDueAt.delete(key) || changed;
    }
    // Due from when the card OPENED: a card already waiting keeps its deadline,
    // or every unrelated render would push a half-read message's back.
    for (const key of wanted) {
      if (this.readDueAt.has(key)) continue;
      this.readDueAt.set(key, Date.now() + delaySec * 1000);
      changed = true;
    }
    if (changed) this.armReadTimer();
  }

  private armReadTimer() {
    if (this.readTimer) clearTimeout(this.readTimer);
    this.readTimer = null;
    if (this.readDueAt.size === 0) return;
    // Always a timer, even for "immediately": this runs inside an update, and a
    // write — with the events it sends the page — must not start mid-render.
    const wait = Math.max(0, Math.min(...this.readDueAt.values()) - Date.now());
    this.readTimer = setTimeout(() => this.flushReadDue(), wait);
  }

  private flushReadDue() {
    this.readTimer = null;
    const now = Date.now();
    const due = [...this.readDueAt].filter(([, at]) => at <= now).map(([key]) => key);
    for (const key of due) this.readDueAt.delete(key);
    // Asked of the cards as they are NOW: one may have been read elsewhere in
    // the meantime, or have left the conversation.
    const keys = due.filter((key) => {
      const item = this.threadItems.find((i) => this.itemKey(i) === key);
      return !!item && item.expanded && !item.message?.Flags?.includes(FLAG_SEEN);
    });
    if (keys.length > 0) void this.markMembersRead(keys);
    this.armReadTimer();
  }

  /**
   * Sets or clears a flag on one message of the conversation, everywhere this
   * reader keeps a copy of it: its card, the conversation the server returned,
   * and the open message.
   *
   * All three, because `resolveThread` rebuilds the cards from the list's rows
   * and from that conversation on every list change. Painted on the card alone,
   * a message from Sent or from another page of the list went back to its old
   * flags the next time the list moved — and a card marked read went back to
   * unread, due to be marked read again.
   */
  private patchMemberFlag(key: string, flag: string, action: 'add' | 'remove') {
    const apply = (msg: any) => {
      const flags: string[] = msg?.Flags || [];
      const has = flags.includes(flag);
      if ((action === 'add') === has) return msg;
      return { ...msg, Flags: action === 'add' ? [...flags, flag] : flags.filter((f: string) => f !== flag) };
    };
    const idx = this.threadItems.findIndex(item => this.itemKey(item) === key);
    if (idx !== -1) {
      const item = this.threadItems[idx];
      const message = apply(item.message);
      if (message !== item.message) {
        this.threadItems[idx] = { ...item, message };
        this.threadItems = [...this.threadItems];
      }
    }
    if (this._conversation) {
      this._conversation = {
        ...this._conversation,
        messages: this._conversation.messages.map(m => (this.keyOf(m) === key ? apply(m) : m)),
      };
    }
    // In place, as the card's star does: the page owns this object, and a new
    // one assigned here would be the open message changing under it.
    if (this.message && this.keyOf(this.message) === key) {
      this.message.Flags = apply(this.message).Flags;
      this.requestUpdate();
    }
  }

  /**
   * Marks messages of the open conversation read: all of its unread for the
   * toolbar's "Mark as read", one for a card's own, and whichever have been read
   * for long enough (see {@link syncReadTimers}). One write per folder, since a
   * UID means nothing outside its own.
   */
  private async markMembersRead(keys: string[]) {
    const named = new Set(keys);
    const byMailbox = new Map<string, string[]>();
    for (const item of this.threadItems) {
      if (!item.message || !named.has(this.itemKey(item))) continue;
      const uids = byMailbox.get(item.mailbox) ?? [];
      uids.push(String(item.message.UID));
      byMailbox.set(item.mailbox, uids);
    }
    const listed = this.listedKeys();
    const paint = (mailbox: string, uids: string[], action: 'add' | 'remove') => {
      for (const uid of uids) {
        const key = messageKey(mailbox, uid);
        // The list first, and only about a listed message — and it has to hear
        // before the patch below, which changes the open message in place: the
        // page shares that object with its row, and a row that already carries
        // the flag is one the page does not repaint.
        //
        // And only while this reader is still on the page. The write below is
        // awaited, so its revert can land after the element has gone, and an
        // event from an element with no ancestors bubbles to nobody: the paint
        // it would undo belongs to a list that stopped listening.
        if (listed.has(key) && this.isConnected) {
          this.dispatchEvent(new CustomEvent('message-flags-changed', {
            detail: { uid, mailbox, flag: FLAG_SEEN, action },
            bubbles: true,
            composed: true,
          }));
        }
        this.patchMemberFlag(key, FLAG_SEEN, action);
      }
    };

    await Promise.all([...byMailbox].map(async ([mailbox, uids]) => {
      paint(mailbox, uids, 'add');
      let ok = false;
      try {
        ok = (await messageOperations.setFlag(mailbox, uids, [FLAG_SEEN], 'add')).ok;
      } catch (err) {
        Logger.error('Failed to mark conversation messages read', err);
      }
      if (!ok) paint(mailbox, uids, 'remove');
    }));
  }

  /**
   * Expands the messages nobody has read, and says which one reading starts at.
   *
   * A conversation used to open with ONE card expanded — the open message — so
   * the mail not yet seen looked like the mail already read, apart from a bold
   * sender, and each had to be found and clicked.
   *
   * On the OPEN only, from the conversation's first answer. Mail that arrives in
   * a conversation already on screen stays collapsed: expanded, it would be
   * marked read by a reader sitting in a background tab. Nor for a draft read
   * among the messages it answers: the draft is what the user came for.
   *
   * Bounded — see {@link UNREAD_EXPAND_LIMIT}.
   */
  private expandUnreadOnOpen(): string | undefined {
    if (this.openIsUnsent) return undefined;
    const unread = this.threadItems.filter(item =>
      item.message && !item.message.Flags?.includes(FLAG_SEEN) && !isUnsent(item.message));
    let changed = false;
    for (const item of unread.slice(0, UNREAD_EXPAND_LIMIT)) {
      if (item.expanded) continue;
      item.expanded = true;
      changed = true;
      if (!item.content && !item.loading) {
        item.loading = true;
        // Queued, not fired: ten of these at once put the next thing the user
        // does behind ten answers (see queueItemBody).
        this.queueItemBody(item);
      }
    }
    if (changed) this.threadItems = [...this.threadItems];
    return unread[0] ? this.itemKey(unread[0]) : undefined;
  }

  /** The conversation has been read from the server (or could not be): open
   * the unread, and start where reading starts — which is not always the open
   * message, since a bold row can be bold for an OLD message. */
  private settleOpenedConversation() {
    if (!this.message || this.threadItems.length < 2) return;
    const firstUnread = this.expandUnreadOnOpen();
    if (firstUnread && firstUnread !== this.keyOf(this.message)) this.scrollToCard(firstUnread);
  }



  /**
   * Allows the loading of remote resources (such as tracking pixels or external images)
   * for the currently viewed message. Re-sanitizes the raw HTML with the restriction lifted.
   */
  private loadRemoteResources() {
    this.allowRemoteResources = true;
    // Guarded on `this.message`, not just the HTML. The banner this runs from
    // renders only alongside an open message, so it is true today — but that is
    // a promise about a render arm kept in another method, and the sanitizer
    // builds every `cid:` image URL out of this UID: broken, it silently mints
    // `/messages/undefined/raw?part=…` for each inline image.
    if (this.message && this.rawMessageHtml) {
      // Reset BEFORE re-sanitizing, so the count reflects this pass. Left at
      // `true` from the blocked pass, the "load remote content" banner stayed
      // on screen after the user had already loaded it.
      this.hasRemoteResources = false;
      this.content = sanitizeMessageHTML(this.rawMessageHtml, {
        mailbox: this.mailboxOfMessage(this.message),
        messageUid: this.message.UID,
        allowRemoteResources: this.allowRemoteResources,
        messageStructure: this.message.BodyStructure,
        onRemoteResourceBlocked: () => { this.hasRemoteResources = true; }
      });
      // Keep the conversation card for this message in step, or it goes on
      // showing the blocked copy behind the pane that just unblocked.
      const item = this.threadItems.find(entry => this.isOpenItem(entry));
      if (item) {
        item.allowRemoteResources = true;
        item.content = this.content;
        item.hasRemoteResources = this.hasRemoteResources;
        this.updateThreadItemReference(item);
      }
    }
  }

  private resolveThread(msg: any) {
    if (!msg) return;

    const enableThreading = this.settingsStore?.getState()?.enableThreading ?? true;
    let threadMessages: any[] = [];
    let rootMsg: any = null;

    if (enableThreading && this.messages && this.messages.length > 0) {
      // Find the thread root message that contains msg (either directly or in SubMessages)
      const found = this.messages.find(m => this.keyOf(m) === this.keyOf(msg));
      if (found) {
        rootMsg = found;
      } else {
        for (const m of this.messages) {
          if (m.SubMessages && m.SubMessages.find((s: any) => this.keyOf(s) === this.keyOf(msg))) {
            rootMsg = m;
            break;
          }
        }
      }
    }

    if (rootMsg) {
      threadMessages = [rootMsg, ...(rootMsg.SubMessages || [])];
      threadMessages.sort((a, b) => {
        const dateA = a.Envelope?.Date ? new Date(a.Envelope.Date).getTime() : 0;
        const dateB = b.Envelope?.Date ? new Date(b.Envelope.Date).getTime() : 0;
        return dateA - dateB;
      });
    } else {
      // The root is not in the list, and that is no reason to collapse a
      // conversation already on screen. This runs again on every list change —
      // a background poll, new mail sliding the thread onto the next page — and
      // rebuilding from [msg] there shrank an open, loaded conversation to its
      // one opened message while it was being read. A different message, or
      // threading switched off, still starts from [msg].
      const loaded = enableThreading && this.threadItems.length > 1 &&
        this.threadItems.some(item => this.itemKey(item) === this.keyOf(msg))
        ? this.threadItems.map(item => ({ ...item.message, Mailbox: item.mailbox }))
        : null;
      threadMessages = loaded ?? [msg];
    }

    if (enableThreading && this._conversation?.key === this.keyOf(msg)) {
      const have = new Set(threadMessages.map(m => this.keyOf(m)));
      const extra = this._conversation.messages.filter(m => !have.has(this.keyOf(m)));
      if (extra.length > 0) {
        threadMessages = [...threadMessages, ...extra];
        threadMessages.sort((a, b) => {
          const dateA = a.Envelope?.Date ? new Date(a.Envelope.Date).getTime() : 0;
          const dateB = b.Envelope?.Date ? new Date(b.Envelope.Date).getTime() : 0;
          return dateA - dateB;
        });
      }
    }

    this._isThread = enableThreading && threadMessages.length > 1;

    const sentMailbox = this.getSentMailboxName();
    const oldItems = this.threadItems || [];

    this.threadItems = threadMessages.map(m => {
      const isCurrent = this.keyOf(m) === this.keyOf(msg);
      const existing = oldItems.find(item => this.itemKey(item) === this.keyOf(m));

      if (existing) {
        const mergedMessage = { ...m, Flags: m.Flags || existing.message.Flags || [] };
        if (existing.message.HasBimiPotential) mergedMessage.HasBimiPotential = true;
        if (existing.message.HasBimiFailed) mergedMessage.HasBimiFailed = true;
        return {
          ...existing,
          message: mergedMessage
        };
      }

      return {
        message: m,
        content: '',
        mimeType: '',
        loading: false,
        attachments: [],
        rawMessageHtml: '',
        hasHtml: false,
        hasText: false,
        activeBanners: [],
        allowRemoteResources: this.allowRemoteResources,
        hasRemoteResources: false,
        isSent: (this.mailbox || '').toLowerCase() === sentMailbox.toLowerCase() || (m.Mailbox || '').toLowerCase() === sentMailbox.toLowerCase(),
        mailbox: m.Mailbox || this.mailbox,
        expanded: isCurrent
      };
    });
  }

  private async fetchMessageBody(msg: any, silent = false) {
    if (msg) {
      msg._isAutosaveUpdate = false;
    }
    if (this.message) {
      this.message._isAutosaveUpdate = false;
    }
    if (!silent) {
      this.content = '';
      this.mimeType = '';
      this.rawMessageHtml = '';
      this.loading = true;
      this.activeBanners = [];
      this.allowRemoteResources = this.settingsStore?.getState().showRemoteContent === 'always';
      this.hasRemoteResources = false;
      this.threadItems = [];
      this._conversation = null;
    }

    this.resolveThread(msg);
    // Whatever the previous conversation had left to read is not this one's.
    this.prefetchQueue = [];

    // The BODY first, and the conversation only once it has come back.
    //
    // Both were asked for here at once, the conversation first, and the server
    // answers a session's requests ONE AT A TIME: it holds a single IMAP
    // connection under a lock (see DoMailWithContext). So the message the user
    // had just opened waited on the whole conversation being read — a THREAD
    // over the mailbox, a search through Sent, an envelope for every member —
    // before its own text was fetched. The cards were on screen throughout,
    // drawn from the list's row; what the reader was waiting for was the one
    // message they clicked.
    //
    // Issuing it first is not enough — measured, it still came back second: the
    // two race for that lock, and the body's route does more before it asks for
    // one. So the conversation waits for the body, which costs it one round trip
    // and costs the reader nothing. It only ever ADDS to what the row already
    // showed (replies filed in Sent, members on other pages); nothing on screen
    // is waiting for it.
    const primaryItem = this.threadItems.find(item => this.itemKey(item) === this.keyOf(msg)) || this.threadItems[0];
    if (primaryItem) {
      primaryItem.loading = !silent;
      primaryItem.expanded = true;
      this._deferPropertySync = false;

      const read = this.fetchItemBody(primaryItem);
      read.then(() => {
        // A reader that has left the page paints nobody. The answer can land
        // after the element is gone — a body still in flight when the user
        // moved on, or one released as the page came down — and repainting for
        // it draws this conversation's cards into a document that may not be
        // there any more.
        if (!this.isConnected) return;
        if (!this.message || this.keyOf(this.message) !== this.keyOf(msg)) {
          return;
        }
        this.requestUpdate();
      });
      // Whether it arrived or failed: a body that never comes must not cost the
      // reader its conversation.
      if (!silent) read.catch(() => { }).then(() => this.loadConversation(msg));
      return;
    }

    if (!silent) this.loadConversation(msg);
  }

  /**
   * Reads the bodies this reader asked for on its own — the unread members a
   * conversation opens expanded — one at a time.
   *
   * Ten of them went out at once, and the server answers one at a time, so the
   * next thing the user did (opening another message, expanding a card) queued
   * behind all ten. One in flight leaves that reader waiting for one body, and
   * the queue itself is dropped the moment another message is opened, so a
   * conversation left behind stops competing with the one on screen.
   *
   * Only for bodies nobody asked for. A card the user expands is fetched
   * straight away, as it always was.
   */
  private prefetchQueue: ThreadMessageItem[] = [];
  private prefetching = false;

  private queueItemBody(item: ThreadMessageItem) {
    // A conversation whose answer lands after this reader has left the page
    // queues into nothing: `disconnectedCallback` empties the queue, and
    // without this a read in flight then re-filled it behind the clear.
    if (!this.isConnected) return;
    this.prefetchQueue.push(item);
    void this.drainPrefetch();
  }

  private async drainPrefetch() {
    if (this.prefetching) return;
    this.prefetching = true;
    try {
      while (this.prefetchQueue.length > 0) {
        const item = this.prefetchQueue.shift()!;
        // It may have been fetched since — by the user expanding it, or by a
        // re-resolve carrying the content over.
        if (item.content) continue;
        await this.fetchItemBody(item);
      }
    } finally {
      this.prefetching = false;
    }
  }

  /**
   * Asks the server for the open message's conversation, which holds what the
   * list cannot: the replies filed in Sent, and thread messages on other pages.
   * The cards already on screen stay as they are; the rest are added.
   */
  private async loadConversation(msg: any, opening = true) {
    const enableThreading = this.settingsStore?.getState()?.enableThreading ?? true;
    if (!enableThreading || !msg?.UID) return;
    const key = this.keyOf(msg);
    const mailbox = msg.Mailbox || this.mailbox;
    try {
      const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/messages/${msg.UID}/thread`);
      if (res.ok) {
        const data = await res.json();
        const messages = Array.isArray(data?.Messages) ? data.Messages : [];
        // Same reason as the body above: nothing on a page that has gone needs
        // its conversation resolved, and resolving it repaints.
        if (!this.isConnected) return;
        if (!this.message || this.keyOf(this.message) !== key) return;
        this._conversation = { key, messages };
        if (messages.length > 1) {
          this.resolveThread(this.message);
          this.requestUpdate();
        }
      }
    } catch (e) {
      Logger.error('Failed to load the conversation', e);
    }
    // With or without the server's answer: the cards the list gave are a
    // conversation too, and their unread should open all the same.
    if (opening && this.message && this.keyOf(this.message) === key) this.settleOpenedConversation();
  }

  private updateThreadItemReference(item: ThreadMessageItem) {
    if (!item.message) return;
    // The card list is what Lit renders from, so replacing its reference IS a
    // repaint. A reader off the page has no screen for it.
    if (!this.isConnected) return;
    const idx = this.threadItems.findIndex(i => this.itemKey(i) === this.itemKey(item));
    if (idx !== -1) {
      // Create a shallow copy to change the reference, reactively updating Lit child components
      this.threadItems[idx] = { ...item };
      this.threadItems = [...this.threadItems];
    }
  }

  private async fetchItemBody(item: ThreadMessageItem) {
    if (!item.message) return;
    const msg = item.message;
    const mailbox = item.mailbox;

    const preferredView = this.localPreferredView || this.settingsStore?.getState()?.preferredView || 'html';

    try {
      const cached = MessageCache.get(mailbox, msg.UID.toString(), preferredView);
      if (cached) {
        item.attachments = cached.Attachments || [];
        item.hasHtml = cached.HasHTML || false;
        item.hasText = cached.HasText || false;
        if (cached.Message) {
          item.message = { ...msg, ...cached.Message };
        }
        if (cached.Part) {
          item.mimeType = cached.Part.MIMEType || cached.Part.MimeType || 'text/plain';
          if (cached.RawHtml === undefined) {
            if (cached.RawText !== undefined) {
              item.content = cached.RawText;
              const payload: any = { content: item.content, isHtml: false, message: item.message, mailbox, banners: [], i18nStore: this.i18nStore };
              const hookResults = await registry.invokeHookAsync('reader:content', payload);
              for (const res of hookResults) {
                if (res && typeof res === 'string') item.content = res;
              }
              item.activeBanners = payload.banners || [];
              if (payload.isHtml) {
                item.mimeType = 'text/html';
                item.hasHtml = true;
                item.content = sanitizeMessageHTML(item.content, {
                  mailbox: mailbox,
                  messageUid: item.message?.UID,
                  allowRemoteResources: item.allowRemoteResources,
                  messageStructure: item.message?.BodyStructure,
                  onRemoteResourceBlocked: () => { item.hasRemoteResources = true; if (this.isOpenItem(item)) this.hasRemoteResources = true; }
                });
              }
            }
          } else {
            item.rawMessageHtml = cached.RawHtml;
            const payload: any = { content: item.rawMessageHtml, isHtml: true, message: item.message, mailbox, banners: [], i18nStore: this.i18nStore };
            const hookResults = await registry.invokeHookAsync('reader:content', payload);
            for (const res of hookResults) {
              if (res && typeof res === 'string') item.rawMessageHtml = res;
            }
            item.activeBanners = payload.banners || [];
            item.content = sanitizeMessageHTML(item.rawMessageHtml, {
              mailbox: mailbox,
              messageUid: item.message?.UID,
              allowRemoteResources: item.allowRemoteResources,
              messageStructure: item.message?.BodyStructure,
              onRemoteResourceBlocked: () => { item.hasRemoteResources = true; if (this.isOpenItem(item)) this.hasRemoteResources = true; }
            });
          }
        }
        item.loading = false;
        if (this.isConnected && !this._deferPropertySync && this.isOpenItem(item)) {
          this.content = item.content;
          this.mimeType = item.mimeType;
          this.rawMessageHtml = item.rawMessageHtml;
          this.attachments = item.attachments;
          this.hasHtml = item.hasHtml;
          this.hasText = item.hasText;
          this.activeBanners = item.activeBanners;
          this.allowRemoteResources = item.allowRemoteResources;
          this.hasRemoteResources = item.hasRemoteResources;
          this.loading = false;
          this.message = { ...this.message, ...item.message };
        }
        this.updateThreadItemReference(item);
        return;
      }

      const metadataRes = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/messages/${msg.UID}?view=${preferredView}`);
      if (metadataRes.status === 401) {
        window.location.hash = '/login';
        return;
      }
      if (!metadataRes.ok) throw new Error('Failed to fetch metadata');
      const data = await metadataRes.json();

      item.attachments = data.Attachments || [];
      item.hasHtml = !!data.HasHTML;
      item.hasText = !!data.HasText;
      if (data.Message) {
        item.message = { ...item.message, ...data.Message };
      }

      let rawHtml: string | undefined;
      let rawText: string | undefined;

      const part = data.Part;
      if (part) {
        item.mimeType = part.MIMEType || part.MimeType || 'text/plain';
        const partPathStr = Array.isArray(part.Path) ? part.Path.join('.') : part.Path;
        const rawRes = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/messages/${msg.UID}/raw?part=${partPathStr}`);
        if (rawRes.status === 401) {
          window.location.hash = '/login';
          return;
        }
        if (rawRes.ok) {
          if (item.mimeType.toLowerCase() === 'text/html') {
            rawHtml = await rawRes.text();
            item.rawMessageHtml = rawHtml;
            const payload: any = { content: item.rawMessageHtml, isHtml: true, message: item.message, mailbox, banners: [], i18nStore: this.i18nStore };
            const hookResults = await registry.invokeHookAsync('reader:content', payload);
            for (const res of hookResults) {
              if (res && typeof res === 'string') item.rawMessageHtml = res;
            }
            item.activeBanners = payload.banners || [];

            item.content = sanitizeMessageHTML(item.rawMessageHtml, {
              mailbox: mailbox,
              messageUid: item.message?.UID,
              allowRemoteResources: item.allowRemoteResources,
              messageStructure: item.message?.BodyStructure,
              onRemoteResourceBlocked: () => { item.hasRemoteResources = true; if (this.isOpenItem(item)) this.hasRemoteResources = true; }
            });
          } else {
            rawText = await rawRes.text();
            item.content = rawText;
            const payload: any = { content: item.content, isHtml: false, message: item.message, mailbox, banners: [], i18nStore: this.i18nStore };
            const hookResults = await registry.invokeHookAsync('reader:content', payload);
            for (const res of hookResults) {
              if (res && typeof res === 'string') item.content = res;
            }
            item.activeBanners = payload.banners || [];

            if (payload.isHtml) {
              item.mimeType = 'text/html';
              item.hasHtml = true;
              item.content = sanitizeMessageHTML(item.content, {
                mailbox: mailbox,
                messageUid: item.message?.UID,
                allowRemoteResources: item.allowRemoteResources,
                messageStructure: item.message?.BodyStructure,
                onRemoteResourceBlocked: () => { item.hasRemoteResources = true; if (this.isOpenItem(item)) this.hasRemoteResources = true; }
              });
            }
          }
        }
      }

      MessageCache.set(mailbox, msg.UID.toString(), preferredView, {
        Message: data.Message,
        Part: data.Part,
        Attachments: data.Attachments,
        RawHtml: rawHtml,
        RawText: rawText,
        HasHTML: item.hasHtml,
        HasText: item.hasText
      });
    } catch (e) {
      Logger.error('Failed to fetch message:', e);
      item.content = 'Error loading message.';
    } finally {
      item.loading = false;
      if (this.isConnected && !this._deferPropertySync && this.isOpenItem(item)) {
        this.content = item.content;
        this.mimeType = item.mimeType;
        this.rawMessageHtml = item.rawMessageHtml;
        this.attachments = item.attachments;
        this.hasHtml = item.hasHtml;
        this.hasText = item.hasText;
        this.activeBanners = item.activeBanners;
        this.allowRemoteResources = item.allowRemoteResources;
        this.hasRemoteResources = item.hasRemoteResources;
        this.loading = false;
        this.message = { ...this.message, ...item.message };
      }
      this.updateThreadItemReference(item);
    }
  }

  private getSentMailboxName(): string {
    if (this.mailboxes && Array.isArray(this.mailboxes)) {
      for (const mb of this.mailboxes) {
        const name = mb.Name || mb.Mailbox;
        if (!name) continue;
        const attrs = mb.Attrs || [];
        const hasSentAttr = attrs.some((a: any) => 
          typeof a === 'string' && (a.toLowerCase() === '\\sent' || a.toLowerCase() === '\\\\sent')
        );
        if (hasSentAttr) {
          return name;
        }
      }
      const sentNames = ['sent', 'sent messages', 'sent items', 'sent-mail'];
      for (const mb of this.mailboxes) {
        const name = mb.Name || mb.Mailbox;
        if (!name) continue;
        if (sentNames.includes(name.toLowerCase())) {
          return name;
        }
      }
    }
    return FOLDER_SENT;
  }

  private async toggleItemExpansion(item: ThreadMessageItem) {
    item.expanded = !item.expanded;
    this.updateThreadItemReference(item);

    if (item.expanded && !item.content && !item.loading) {
      item.loading = true;
      this.updateThreadItemReference(item);
      await this.fetchItemBody(item);
    }
  }

  private loadRemoteResourcesForItem(item: ThreadMessageItem) {
    item.allowRemoteResources = true;
    if (item.message && item.rawMessageHtml) {
      item.hasRemoteResources = false;
      item.content = sanitizeMessageHTML(item.rawMessageHtml, {
        mailbox: item.mailbox,
        messageUid: item.message.UID,
        allowRemoteResources: item.allowRemoteResources,
        messageStructure: item.message.BodyStructure,
        onRemoteResourceBlocked: () => { item.hasRemoteResources = true; }
      });
      // The OPEN message, not `threadItems[0]`.
      //
      // Those are the same thing only when the message being read happens to be
      // first in its conversation. Otherwise loading remote content on the open
      // card updated the card and left the reader's own copy blocked, with its
      // banner still up — and, worse, a card that was NOT open could push its
      // content into the reader by being first.
      if (this.isOpenItem(item)) {
        this.content = item.content;
        this.allowRemoteResources = true;
        this.hasRemoteResources = item.hasRemoteResources;
      }
      this.updateThreadItemReference(item);
    }
  }

  private async toggleItemStar(item: ThreadMessageItem) {
    if (!item.message) return;
    const isStarred = item.message.Flags?.includes(FLAG_FLAGGED);
    const op = isStarred ? 'remove' : 'add';

    if (isStarred) {
      item.message.Flags = item.message.Flags.filter((f: string) => f !== FLAG_FLAGGED);
    } else {
      item.message.Flags = [...(item.message.Flags || []), FLAG_FLAGGED];
    }
    this.updateThreadItemReference(item);

    // Only a listed message is news to the list: a card from Sent is not one of its rows.
    const listed = this.listedKeys().has(this.itemKey(item));
    const tellList = (action: string) => {
      if (!listed) return;
      this.dispatchEvent(new CustomEvent('message-flags-changed', {
        detail: {
          uid: String(item.message.UID),
          mailbox: item.mailbox,
          flag: FLAG_FLAGGED,
          action
        },
        bubbles: true,
        composed: true
      }));
    };

    // Optimistically notify parent page to update flags in list view
    tellList(op);

    try {
      const { ok: success } = await messageOperations.setFlag(item.mailbox, [String(item.message.UID)], [FLAG_FLAGGED], op);
      if (!success) {
        if (isStarred) {
          item.message.Flags = [...(item.message.Flags || []), FLAG_FLAGGED];
        } else {
          item.message.Flags = item.message.Flags.filter((f: string) => f !== FLAG_FLAGGED);
        }
        this.updateThreadItemReference(item);

        // Revert parent view on failure
        tellList(isStarred ? 'add' : 'remove');
      } else {
        if (this.isOpenItem(item)) {
          this.message.Flags = item.message.Flags;
          this.requestUpdate();
        }
      }
    } catch (err) {
      Logger.error('Failed to toggle star for thread item', err);
      if (isStarred) {
        item.message.Flags = [...(item.message.Flags || []), FLAG_FLAGGED];
      } else {
        item.message.Flags = item.message.Flags.filter((f: string) => f !== FLAG_FLAGGED);
      }
      this.updateThreadItemReference(item);

      // Revert parent view on failure
      tellList(isStarred ? 'add' : 'remove');
    }
  }

  /**
   * A card's own Delete: ONE message of the conversation, whichever card it is.
   *
   * Carried out by the page, exactly as the toolbar's Delete was for a single
   * message — to Trash with an undo, or, where that would be a no-op (Trash,
   * Drafts, Junk), permanently after the page's own confirmation. It used to be
   * done here, and differently: a permanent delete, from any folder, behind the
   * browser's `confirm()`. With the toolbar's Delete now about the whole
   * conversation, that made the card the only way to delete one message and the
   * only delete that skipped Trash.
   *
   * It also asked the page for a second, unnamed delete when the card was the
   * first of the conversation, which the page carried out on the OPEN message —
   * a message nobody had asked to delete.
   *
   * The card goes when the page says the delete happened, not before.
   */
  private deleteItem(item: ThreadMessageItem) {
    if (!item.message) return;
    const key = this.itemKey(item);
    const isOpen = this.isOpenItem(item);
    // Where to stay if this is the message being read: the newest other message
    // of the conversation that the page can open, i.e. one in this folder.
    const next = isOpen
      ? [...this.conversationItems].reverse().find(other => this.itemKey(other) !== key)
      : undefined;
    this.dispatchEvent(new CustomEvent<ReaderActionDetail>('action', {
      detail: {
        action: 'delete',
        uid: String(item.message.UID),
        mailbox: item.mailbox,
        nextUid: next ? String(next.message.UID) : undefined,
        done: (ok: boolean) => { if (ok) this.dropCard(key); },
      },
    }));
  }

  /** Takes a deleted message's card off the conversation. */
  private dropCard(key: string) {
    this.threadItems = this.threadItems.filter(i => this.itemKey(i) !== key);
    if (this._conversation) {
      this._conversation = {
        ...this._conversation,
        messages: this._conversation.messages.filter(m => this.keyOf(m) !== key),
      };
    }
    // One message left is no longer a conversation: collapsed, it would be a
    // lone closed card with nothing to read.
    if (this.threadItems.length === 1 && !this.threadItems[0].expanded) {
      const last = this.threadItems[0];
      last.expanded = true;
      if (!last.content && !last.loading) {
        last.loading = true;
        void this.fetchItemBody(last);
      }
    }
    this._isThread = this.threadItems.length > 1;
    this.requestUpdate();
  }

  /**
   * Reads the conversation from the server again, keeping the cards on screen.
   *
   * For the page's undo of a card's Delete: the message comes back under a new
   * UID, and nothing else would tell this reader it is part of the
   * conversation again until the conversation was reopened.
   */
  reloadConversation() {
    if (this.message) void this.loadConversation(this.message, false);
  }

  private async _handleActionForItem(action: string, item: ThreadMessageItem) {
    if (action === 'reply' || action === 'replyAll' || action === 'forward') {
      let textBody = '';
      if (item.mimeType === 'text/plain') {
        textBody = item.content;
      } else {
        try {
          const textRes = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(item.mailbox)}/messages/${item.message.UID}?view=text`);
          if (textRes.ok) {
            const textData = await textRes.json();
            if (textData.Part && textData.RawText) {
              textBody = textData.RawText;
            }
          }
        } catch (e) {
          Logger.error('Failed to fetch text body for quote', e);
        }
        if (!textBody && item.rawMessageHtml) {
          textBody = htmlToPlainText(item.rawMessageHtml);
        }
      }

      const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
      const hourFormat = String(this.settingsStore?.getState()?.hourFormat || '12');

      const { subject, to, cc, quotedText, quotedHtml } = generateQuote(
        action,
        item.message,
        textBody,
        item.rawMessageHtml,
        item.hasHtml,
        dateFormat,
        hourFormat,
        this.ownAddresses()
      );

      // A forward carries the original's attachments; a reply does not. Both
      // carry its inline parts, which the quote's images name: see inlinePartsOf.
      const forwarded = action === 'forward' ? item.attachments.map(a => ({
        name: a.Filename || 'attachment',
        size: a.Size || 0,
        type: a.MIMEType || 'application/octet-stream',
        partPath: a.Path ? a.Path.join('.') : undefined
      })) : [];
      const attachments = [
        ...forwarded,
        ...inlinePartsOf(item.message.BodyStructure).filter(part => !forwarded.some(a => a.partPath === part.partPath)),
      ];

      const reply = action === 'reply' || action === 'replyAll' ? replyContext(item.message, item.mailbox) : {};

      this.composeStore.openComposer({
        subject,
        to,
        cc,
        text: quotedText,
        html: quotedHtml,
        format: this.settingsStore?.getState()?.composeFormat || 'html',
        attachments: attachments,
        // The quote keeps the original's inline images, and the composer
        // shows them from the original's own parts.
        quoteSource: { mailbox: item.mailbox, uid: String(item.message.UID), structure: item.message.BodyStructure },
        ...reply
      });
      return;
    }
    // The card's read toggle. Marking read is this component's own write.
    // Marking UNREAD is the page's: it ends by closing the reader — back to the
    // list, where the row is bold again — and the selection is the page's.
    if (action === 'markRead') return void this.markMembersRead([this.itemKey(item)]);
    // These are the page's to carry out, and they name the card's message: the
    // page would otherwise act on the open one, which is how they worked while
    // they lived in the toolbar, and why they moved.
    if (action === 'markUnread' || action === 'downloadMessage' || action === 'showOriginal') {
      this.dispatchEvent(new CustomEvent<ReaderActionDetail>('action', {
        detail: { action, uid: String(item.message.UID), mailbox: item.mailbox },
      }));
      return;
    }
    if (action === 'showPlaintext') {
      this.localPreferredView = 'text';
      this.fetchItemBody(item);
      return;
    }
    if (action === 'showHtml') {
      this.localPreferredView = 'html';
      this.fetchItemBody(item);
      return;
    }
    if (action === 'print') {
      const remoteParam = item.allowRemoteResources ? '&remote=1' : '';
      window.open('#/print?mailbox=' + encodeURIComponent(item.mailbox) + '&uid=' + item.message.UID + remoteParam, '_blank');
      return;
    }
  }

  private applyThemeToIframe(iframe: HTMLIFrameElement) {
    const themeIframeContent = this.settingsStore?.getState()?.themeIframeContent ?? false;
    sharedApplyTheme(iframe, themeIframeContent);
  }

  private applyThemeToAllIframes() {
    const iframes = this.shadowRoot?.querySelectorAll('iframe.reader-iframe');
    if (iframes) {
      iframes.forEach(iframe => this.applyThemeToIframe(iframe as HTMLIFrameElement));
    }
  }

  private _handleSettingsChange = () => {
    this.applyThemeToAllIframes();
  };

  /**
   * Handles the load event of the message content iframe.
   * Injects a ResizeObserver into the iframe's document body to dynamically adjust
   * the iframe's height to match its content, avoiding nested scrollbars.
   * 
   * @param e The load event from the iframe.
   */
  private onIframeLoad(e: Event) {
    const iframe = e.target as HTMLIFrameElement;
    const themeIframeContent = this.settingsStore?.getState()?.themeIframeContent ?? false;
    sharedSetupSizing(iframe, themeIframeContent);
  }

  /**
   * Tracks scroll events within the message reader body.
   * Updates the 'isScrolled' state, which is used to conditionally style the toolbar (e.g., adding a shadow).
   */
  private handleScroll = (e: Event) => {
    const target = e.target as HTMLElement;
    this.isScrolled = target.scrollTop > 0;
  };

  /**
   * Prepares the current message to be edited as a draft.
   * Gathers the draft's content, recipients, and attachments, then opens the composer pre-filled with this data.
   */
  private async _handleEditDraft(item?: any) {
    const isItem = item && !(item instanceof Event);
    const msg = isItem ? item.message : this.message;
    // The message's own mailbox, as its card has it. The one being viewed is
    // `*` in a search of all mailboxes, which is no mailbox at all: every save
    // of the draft failed on deleting the one it replaced, after storing a new
    // copy, and Discard could not delete it.
    const mailbox = isItem ? item.mailbox : this.mailboxOfMessage(msg);
    if (!msg) return;

    // If we're editing a specific thread item, make sure its body has been loaded
    if (isItem && item && !item.content && !item.loading) {
      item.loading = true;
      this.updateThreadItemReference(item);
      await this.fetchItemBody(item);
    }

    const content = isItem && item ? item.content : this.content;
    const mimeType = isItem && item ? item.mimeType : this.mimeType;
    const rawMessageHtml = isItem && item ? item.rawMessageHtml : this.rawMessageHtml;
    const itemAttachments = isItem && item ? item.attachments : this.attachments;

    let textBody = '';
    if (mimeType === 'text/plain') {
      textBody = content;
    } else {
      try {
        const textRes = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/messages/${msg.UID}?view=text`);
        if (textRes.ok) {
          const textData = await textRes.json();
          if (textData.Part && textData.RawText) {
            textBody = textData.RawText;
          }
        }
      } catch (e) {
        Logger.error('Failed to fetch text body for draft', e);
      }

      if (!textBody) {
        textBody = htmlToPlainText(rawMessageHtml);
      }
    }

    const attachments = (itemAttachments || []).map((a: any) => ({
      name: a.Filename || 'attachment',
      size: a.Size || 0,
      type: a.MIMEType || 'application/octet-stream',
      partPath: a.Path ? a.Path.join('.') : undefined
    }));

    const formatAddrs = (addrs: any[]) => addrs ? addrs.map(a => a.Name ? `${a.Name} <${a.Mailbox}@${a.Host}>` : `${a.Mailbox}@${a.Host}`) : [];

    this.composeStore.openComposer({
      draftUid: msg.UID.toString(),
      draftMailbox: mailbox,
      subject: msg.Envelope?.Subject || '',
      to: formatAddrs(msg.Envelope?.To),
      cc: formatAddrs(msg.Envelope?.Cc),
      bcc: formatAddrs(msg.Envelope?.Bcc),
      text: textBody,
      html: rawMessageHtml,
      format: this.settingsStore?.getState()?.composeFormat || 'html',
      attachments: attachments,
      // A forward's inline images are the draft's own parts now.
      quoteSource: { mailbox, uid: msg.UID.toString(), structure: msg.BodyStructure },
      // A reply saved as a draft still answers its message when it is sent.
      inReplyTo: msg.Envelope?.InReplyTo || undefined,
      references: Array.isArray(msg.References) && msg.References.length ? msg.References : undefined
    });
  }

  /** Whether senders get a picture here. Their verification is drawn either way. */
  private get showSenderAvatars(): boolean {
    return this.settingsStore?.getState()?.showSenderAvatars ?? true;
  }

  /**
   * Whether a card offers its read toggle: wherever the toolbar offers one for
   * a single message (not in Trash, not in Sent), and not on a message that has
   * nothing to be unread about — your own sent copy, a draft.
   */
  private canToggleReadFor(item: ThreadMessageItem): boolean {
    if (!item.message || item.isSent || isUnsent(item.message)) return false;
    if (mailboxRoleByName(this.mailbox || '', this.mailboxes) === 'trash') return false;
    return (this.mailbox || '').toLowerCase() !== this.getSentMailboxName().toLowerCase();
  }

  /** The newest message that can be answered: a draft is not something to
   * reply TO. `threadItems` is oldest first. */
  private get newestAnswerable(): ThreadMessageItem | undefined {
    return [...this.threadItems].reverse().find(item => item.message && !isUnsent(item.message));
  }

  /**
   * Answers the newest message, from the row under the last card.
   *
   * The body first: a collapsed card has none until it is opened, and a reply
   * built without it quotes nothing. `fetchItemBody` replaces the card in
   * `threadItems` once it lands, so the card is found again before it is
   * quoted from.
   */
  private async answerNewest(action: 'reply' | 'replyAll' | 'forward') {
    const target = this.newestAnswerable;
    if (!target) return;
    const key = this.itemKey(target);
    if (!target.content && !target.loading) await this.fetchItemBody(target);
    const loaded = this.threadItems.find(item => this.itemKey(item) === key) ?? target;
    await this._handleActionForItem(action, loaded);
  }

  /**
   * Reply, Reply all and Forward, under the last card.
   *
   * What the toolbar's Reply became when the toolbar became about the
   * conversation. It could not stay up there — it answered the "open" message,
   * and nothing about a button over five cards says which that is — but
   * answering is the commonest thing anyone does with a conversation, and the
   * card headers that also offer it scroll away with a long message. Down here
   * the position is the operand: it follows the newest message, so it answers
   * the newest message.
   */
  private renderConversationReply() {
    if (!this.toolbarIsConversation || !this.newestAnswerable) return '';
    return html`
      <div class="conversation-reply">
        <alps-button variant="normal" icon="arrowBendUpLeft" @click=${() => this.answerNewest('reply')}>${this.i18nStore?.t('messageReader.reply')}</alps-button>
        <alps-button variant="normal" icon="arrowBendDoubleUpLeft" @click=${() => this.answerNewest('replyAll')}>${this.i18nStore?.t('messageReader.replyAll')}</alps-button>
        <alps-button variant="normal" icon="arrowBendUpRight" @click=${() => this.answerNewest('forward')}>${this.i18nStore?.t('messageReader.forward')}</alps-button>
      </div>
    `;
  }

  private renderThreadCard(item: ThreadMessageItem) {
    return html`
      <alps-thread-card
        id=${this.cardId(item)}
        .item=${item}
        .mailbox=${this.mailbox}
        .canToggleRead=${this.canToggleReadFor(item)}
        .showSenderAvatars=${this.showSenderAvatars}
        @toggle-expansion=${(e: CustomEvent) => this.toggleItemExpansion(e.detail.item)}
        @load-remote-resources=${(e: CustomEvent) => this.loadRemoteResourcesForItem(e.detail.item)}
        @toggle-star=${(e: CustomEvent) => this.toggleItemStar(e.detail.item)}
        @delete-item=${(e: CustomEvent) => this.deleteItem(e.detail.item)}
        @action-for-item=${(e: CustomEvent) => this._handleActionForItem(e.detail.action, e.detail.item)}
        @edit-draft-for-item=${(e: CustomEvent) => { this._handleEditDraft(e.detail.item); }}
      ></alps-thread-card>
    `;
  }

  render() {

    const isBulk = this.selectedCount > 0;
    const enableThreading = this.settingsStore?.getState()?.enableThreading ?? true;

    if (!this.message && !isBulk) {
      return html`
        <div class="empty-reader-state">
          ${this.bulkProcessing ? html`
            <!--
              A bulk write is still running, and the rows it is about have
              already left the list — so the selection is empty and this pane
              would otherwise flip back to "select a message" while the server
              is still working. The loader is the one place left that can say
              so, and it needs no words to.
            -->
            <div class="bulk-spinner-container"><alps-loader></alps-loader></div>
          ` : this.i18nStore?.t('messageReader.selectMessage')}
        </div>
      `;
    }

    const currentView = this.localPreferredView || this.settingsStore?.getState()?.preferredView || 'html';

    const msg = this.message || {};
    const customTags = getMessageTags(msg.Flags, this.i18nStore);
    // Keywords present on a single open message that aren't one of the predefined
    // labels (already toggled above) — e.g. stray $NotJunk/NotJunk left by other
    // clients. Listed in the tags popup so they can be removed individually.
    const PREDEFINED_LABELS = new Set(['$label1', '$label2', '$label3', '$label4', '$label5']);
    const otherTags = (isBulk || !this.message)
      ? []
      : getRemovableTags(msg.Flags).filter(t => !PREDEFINED_LABELS.has(t.toLowerCase()));
    const sender = msg.Envelope?.From?.[0] || {};
    const senderAddress = sender.Mailbox && sender.Host ? `${sender.Mailbox}@${sender.Host}` : '';
    const senderName = sender.Name || senderAddress || (this.i18nStore?.t('messageList.unknownSender'));
    const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
    const hourFormat = String(this.settingsStore?.getState()?.hourFormat || '12');
    const dateStr = msg.Envelope?.Date ? formatFullDate(msg.Envelope.Date, dateFormat, hourFormat) : '';

    const bimiUrl = bimiAvatarUrlFor(msg, sender);

    // Classify the current mailbox by IMAP special-use attribute (with a name
    // fallback) so Gmail's "[Gmail]/Trash", "[Gmail]/Spam", etc. show the correct
    // toolbar actions. See issue #4. (isSent keeps its own richer name matching.)
    const mbxLower = (this.mailbox || '').toLowerCase();
    const currentRole = mailboxRoleByName(this.mailbox || '', this.mailboxes);
    const isArchive = currentRole === 'archive';
    const isJunk = currentRole === 'junk';
    const isTrash = currentRole === 'trash';
    const isDrafts = currentRole === 'drafts';
    const isSent = mbxLower === this.getSentMailboxName().toLowerCase();

    // Above a conversation the toolbar keeps only what acts on all of it; what
    // acts on one message is on that message's card. See `toolbarIsConversation`.
    const isConversation = this.toolbarIsConversation;
    const offersMarkRead = this.readToggleMarksRead;
    const deleteTitle = isConversation
      ? this.i18nStore?.t('messageReader.deleteThread')
      : (this.message?.Flags?.includes(FLAG_DRAFT) || isDrafts)
        ? this.i18nStore?.t('messageReader.discardDraft')
        : this.i18nStore?.t('messageReader.delete');

    return html`
      <alps-toolbar class="toolbar" ?scrolled=${this.isScrolled}>
        ${this.layoutMode === 'full' ? html`
          <alps-icon-btn @click=${() => this.dispatchEvent(new CustomEvent('close'))} title=${this.i18nStore?.t('messageReader.back')} icon="arrowLeft"></alps-icon-btn>
          <div class="toolbar-separator desktop-only"></div>
        ` : ''}
        
        <div class="toolbar-spacer mobile-spacer"></div>
        
        ${!isArchive && !isTrash && !isDrafts ? html`
        <alps-icon-btn title=${this.i18nStore?.t('messageReader.archive')} @click=${() => this._handleAction('archive')} icon="archiveBox"></alps-icon-btn>
        ` : ''}
        ${!isJunk && !isTrash && !isDrafts && !isSent ? html`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t('messageReader.reportSpam')} @click=${() => this._handleAction('reportSpam')} icon="warningDiamond"></alps-icon-btn>
        ` : ''}
        ${isJunk ? html`
        <alps-icon-btn class="desktop-only" title=${this.i18nStore?.t('messageReader.notSpam')} @click=${() => this._handleAction('notSpam')} icon="notSpam"></alps-icon-btn>
        ` : ''}
        <alps-icon-btn title=${deleteTitle} @click=${() => this._handleAction('delete')} icon="trash"></alps-icon-btn>
        <alps-folder-selector-popup
          class="desktop-only"
          .mailboxes=${this.mailboxes}
          .currentMailbox=${this.mailbox}
          @folder-selected=${(e: CustomEvent) => this._handleAction(e.detail.isMove ? 'moveTo' : 'copyTo', e.detail.folderName)}
        >
          <alps-icon-btn slot="trigger" title=${this.i18nStore?.t('messageReader.moveTo')} icon="folderOpen"></alps-icon-btn>
        </alps-folder-selector-popup>
        
        <div class="toolbar-separator"></div>
        
        ${!isTrash && !isSent ? html`
        <alps-icon-btn title=${offersMarkRead ? (this.i18nStore?.t('messageReader.markRead')) : (this.i18nStore?.t('messageReader.markUnread'))} @click=${() => this._handleAction('markUnread')} icon=${offersMarkRead ? 'envelopeOpen' : 'envelopeUnread'}></alps-icon-btn>
        ` : ''}
        ${!isConversation ? html`
        <!-- A star is a flag on ONE message, so over a conversation it is each
             card's own star and not a button up here. -->
        <alps-icon-btn class="desktop-only" ?active=${(isBulk && this.allSelectedStarred) || (!isBulk && this.message?.Flags?.includes(FLAG_FLAGGED))} title=${this.i18nStore?.t('messageReader.star')} @click=${() => this._handleAction('star')} icon=${(isBulk && this.allSelectedStarred) || (!isBulk && this.message?.Flags?.includes(FLAG_FLAGGED)) ? 'starFourFill' : 'starFour'}></alps-icon-btn>
        ` : ''}
        
        <alps-popup align="left" class="tags-popup">
          <alps-icon-btn slot="trigger" class="desktop-only" title=${this.i18nStore?.t('messageReader.tags')} icon="tag"></alps-icon-btn>
          ${['$label1', '$label2', '$label3', '$label4', '$label5'].map(tag => {
      const isActive = this.hasTag(tag);

      return html`
              <button class="dropdown-item ${isActive ? 'active' : ''}" @click=${() => this._handleTag(tag)}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${getTagColor(tag)};margin-right:12px;opacity:0.9;"></span>
                <span class="item-text">${getTagName(tag, this.i18nStore)}</span>
              </button>
            `;
    })}
          ${otherTags.length ? html`
            <div class="dropdown-divider"></div>
            ${otherTags.map(tag => html`
              <button class="dropdown-item active" title=${this.i18nStore?.t('messageReader.removeTag')} @click=${() => this._handleTag(tag)}>
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${getTagColor(tag)};margin-right:12px;opacity:0.9;"></span>
                <span class="item-text">${getTagName(tag, this.i18nStore)}</span>
                ${renderIcon('x')}
              </button>
            `)}
          ` : ''}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item text-danger" @click=${() => this._handleRemoveAllTags()}>
            <span class="item-text">${this.i18nStore?.t('messageReader.removeAllTags')}</span>
          </button>
        </alps-popup>

        <div class="toolbar-spacer desktop-spacer"></div>
        <div class="toolbar-separator mobile-only"></div>
          
          ${!isBulk ? html`
            ${this.message?.Flags?.includes(FLAG_DRAFT) || isDrafts ? html`
              <alps-icon-btn title=${this.i18nStore?.t('messageReader.editDraft')} @click=${this._handleEditDraft} icon="pen"></alps-icon-btn>
            ` : !isConversation ? html`
              <alps-icon-btn title=${this.i18nStore?.t('messageReader.reply')} @click=${() => this._handleAction('reply')} icon="arrowBendUpLeft"></alps-icon-btn>
            ` : ''}
            
            <alps-popup align="right" class="more-menu-popup">
              <alps-icon-btn slot="trigger" class="more-btn" title=${this.i18nStore?.t('messageReader.moreOptions')} icon="dotsThreeVertical"></alps-icon-btn>
            
            ${!(this.message?.Flags?.includes(FLAG_DRAFT) || isDrafts || isConversation) ? html`
            <button class="dropdown-item" @click=${() => this._handleAction('reply')}>
              ${renderIcon('arrowBendUpLeft')} <span class="item-text">${this.i18nStore?.t('messageReader.reply')}</span>
            </button>
            <button class="dropdown-item" @click=${() => this._handleAction('replyAll')}>
              ${renderIcon('arrowBendDoubleUpLeft')} <span class="item-text">${this.i18nStore?.t('messageReader.replyAll')}</span>
            </button>
            <button class="dropdown-item" @click=${() => this._handleAction('forward')}>
              ${renderIcon('arrowBendUpRight')} <span class="item-text">${this.i18nStore?.t('messageReader.forward')}</span>
            </button>
            <div class="dropdown-divider"></div>
            ` : ''}
            ${!isArchive && !isTrash && !isDrafts ? html`
            <button class="dropdown-item" @click=${() => this._handleAction('archive')}>
              ${renderIcon('archiveBox')} <span class="item-text">${this.i18nStore?.t('messageReader.archive')}</span>
            </button>
            ` : ''}
            ${!isJunk && !isTrash && !isDrafts && !isSent ? html`
            <button class="dropdown-item" @click=${() => this._handleAction('reportSpam')}>
              ${renderIcon('warningDiamond')} <span class="item-text">${this.i18nStore?.t('messageReader.reportSpam')}</span>
            </button>
            ` : ''}
            ${isJunk ? html`
            <button class="dropdown-item" @click=${() => this._handleAction('notSpam')}>
              ${renderIcon('notSpam')} <span class="item-text">${this.i18nStore?.t('messageReader.notSpam')}</span>
            </button>
            ` : ''}
            <button class="dropdown-item" @click=${() => this._handleAction('delete')}>
              ${renderIcon('trash')} <span class="item-text">${deleteTitle}</span>
            </button>
            <alps-folder-selector-popup
              class="folder-selector"
              .mailboxes=${this.mailboxes}
              .currentMailbox=${this.mailbox}
              @folder-selected=${(e: CustomEvent) => this._handleAction(e.detail.isMove ? 'moveTo' : 'copyTo', e.detail.folderName)}
            >
              <button slot="trigger" class="dropdown-item">
                ${renderIcon('folderOpen')} <span class="item-text">${this.i18nStore?.t('messageReader.moveTo')}</span>
              </button>
            </alps-folder-selector-popup>
            ${(!isTrash && !isSent) || !isConversation ? html`
            <div class="dropdown-divider"></div>
            ${!isTrash && !isSent ? html`
            <button class="dropdown-item" @click=${() => this._handleAction('markUnread')}>
              ${offersMarkRead ? renderIcon('envelopeOpen') : renderIcon('envelopeUnread')} <span class="item-text">${offersMarkRead ? (this.i18nStore?.t('messageReader.markRead')) : (this.i18nStore?.t('messageReader.markUnread'))}</span>
            </button>
            ` : ''}
            ${!isConversation ? html`
            <button class="dropdown-item" @click=${() => this._handleAction('star')}>
              ${this.message?.Flags?.includes(FLAG_FLAGGED) ? renderIcon('starFourFill') : renderIcon('starFour')} <span class="item-text">${this.i18nStore?.t('messageReader.star')}</span>
            </button>
            ` : ''}
            ` : ''}
            ${!isConversation ? html`
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${() => this._handleAction('print')}>
              ${renderIcon('printer')} <span class="item-text">${this.i18nStore?.t('messageReader.print')}</span>
            </button>
            ` : ''}
            <!-- Stays over a conversation: it is a preference about the READER,
                 not a verb on a message. -->
            <div class="dropdown-divider"></div>
            <button class="dropdown-item ${currentView === 'text' ? 'active' : ''}" ?disabled=${!this.hasText} @click=${() => this.hasText && this._handleAction('showPlaintext')}>
              ${renderIcon('textAlignLeft')}
              <span class="item-text">${this.i18nStore?.t('messageReader.showPlaintext')}</span>
            </button>
            <button class="dropdown-item ${currentView === 'html' ? 'active' : ''}" ?disabled=${!this.hasHtml} @click=${() => this.hasHtml && this._handleAction('showHtml')}>
              ${renderIcon('code')}
              <span class="item-text">${this.i18nStore?.t('messageReader.showHtml')}</span>
            </button>
            ${!isConversation ? html`
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${() => this._handleAction('downloadMessage')}>
              ${renderIcon('downloadSimple')} <span class="item-text">${this.i18nStore?.t('messageReader.downloadMessage')}</span>
            </button>
            <button class="dropdown-item" @click=${() => this._handleAction('showOriginal')}>
              ${renderIcon('codeBlock')} <span class="item-text">${this.i18nStore?.t('messageReader.showOriginal')}</span>
            </button>
            ` : ''}
          </alps-popup>
          ` : ''}
      </alps-toolbar>
      
      ${isBulk ? html`
        <div class="reader-body">
          <div class="empty-reader-state" style="flex-direction: column; gap: 16px;">
            ${this.bulkProcessing ? html`
              <div class="bulk-spinner-container">
                <alps-loader></alps-loader>
              </div>
            ` : html`
              <alps-icon-btn icon="envelopeSimple" style="pointer-events: none;"></alps-icon-btn>
            `}
            <span>${this.selectedCount} ${this.i18nStore?.t('messageReader.messagesSelected')}</span>
          </div>
        </div>
      ` : (enableThreading && (this.threadItems.length > 1 || this._isThread)) ? html`
        <div class="reader-body" @scroll=${this.handleScroll}>
          <div class="reader-header thread-header-grouped">
            <div class="reader-subject">
              ${customTags.length > 0 ? html`
                <div class="tag-pills">
                  ${customTags.map(tag => html`
                    <alps-tag .name=${tag.name} .color=${tag.color}></alps-tag>
                  `)}
                </div>
              ` : ''}
              ${msg.Envelope?.Subject || (this.i18nStore?.t('messageList.noSubject'))}
            </div>
          </div>
          <div class="thread-container">
            ${this.threadItems.map(item => this.renderThreadCard(item))}
          </div>
          ${this.renderConversationReply()}
        </div>
      ` : html`
        <div class="reader-body" @scroll=${this.handleScroll}>
          <div class="reader-header">
          <div class="reader-subject">
            ${customTags.length > 0 ? html`
              <div class="tag-pills">
                ${customTags.map(tag => html`
                  <alps-tag .name=${tag.name} .color=${tag.color}></alps-tag>
                `)}
              </div>
            ` : ''}

            ${msg.Envelope?.Subject || (this.i18nStore?.t('messageList.noSubject'))}
          </div>
          <div class="reader-meta">
            <div class="reader-sender-block">
              <div class="reader-sender-left">
                ${this.showSenderAvatars ? html`
                  <div class="avatar-container">
                    <alps-avatar .name=${senderName} .email=${senderAddress} .size=${40} .src=${bimiUrl}></alps-avatar>
                  </div>
                ` : ''}
                <div class="reader-sender-info">
                  ${sender.Name && sender.Name !== senderAddress ? html`
                    <div class="reader-sender-line">
                      <span class="reader-sender-name">${sender.Name}</span>
                      <alps-sender-auth-badge ?verified=${!!msg.HasBimiPotential} ?failed=${!!msg.HasBimiFailed}></alps-sender-auth-badge>
                    </div>
                    ${senderAddress ? html`<alps-recipient-pill address="${senderAddress}"></alps-recipient-pill>` : html`<span class="reader-sender-name">${senderName}</span>`}
                  ` : html`
                    <div class="reader-sender-line">
                      ${senderAddress ? html`<alps-recipient-pill address="${senderAddress}"></alps-recipient-pill>` : html`<span class="reader-sender-name">${senderName}</span>`}
                      <alps-sender-auth-badge ?verified=${!!msg.HasBimiPotential} ?failed=${!!msg.HasBimiFailed}></alps-sender-auth-badge>
                    </div>
                  `}
                </div>
              </div>
              <div class="desktop-date-container">
                <div class="reader-date desktop-date">${dateStr}</div>
                ${msg.RFC822Size ? html`<div class="reader-size desktop-only">${formatSize(msg.RFC822Size)}</div>` : ''}
              </div>
            </div>
            
            <div class="reader-recipients-block">
              <div class="reader-recipients">
                <span class="reader-recipients-label">${this.i18nStore?.t('messageReader.to')}</span>
                <div class="reader-recipients-list">
                  ${msg.Envelope?.To && msg.Envelope.To.length > 0
          ? msg.Envelope.To.map((t: any) => t.Mailbox && t.Host ? html`<alps-recipient-pill name="${t.Name || ''}" address="${t.Mailbox}@${t.Host}"></alps-recipient-pill>` : '')
          : html`<span class="undisclosed-recipients">${msg.Flags?.includes(FLAG_DRAFT) ? (this.i18nStore?.t('messageReader.noRecipients')) : (this.i18nStore?.t('messageReader.undisclosed'))}</span>`
        }
                </div>
              </div>
              ${msg.Envelope?.Cc && msg.Envelope.Cc.length > 0 ? html`
                <div class="reader-recipients">
                  <span class="reader-recipients-label">${this.i18nStore?.t('messageReader.cc')}</span>
                  <div class="reader-recipients-list">
                    ${msg.Envelope.Cc.map((t: any) => t.Mailbox && t.Host ? html`<alps-recipient-pill name="${t.Name || ''}" address="${t.Mailbox}@${t.Host}"></alps-recipient-pill>` : '')}
                  </div>
                </div>
              ` : ''}
              
              <div class="reader-recipients mobile-only">
                <span class="reader-recipients-label">${this.i18nStore?.t('messageReader.date') || 'Date:'}</span>
                <div class="reader-recipients-list mobile-date-container" style="flex-direction: row; align-items: baseline; gap: 8px; margin-top: 0;">
                  <span class="reader-date mobile-date" style="color: var(--text-primary);">${dateStr}</span>
                  ${msg.RFC822Size ? html`<span class="reader-size mobile-size">(${formatSize(msg.RFC822Size)})</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        ${!this.loading && this.attachments && this.attachments.length > 0 ? html`
          <alps-attachment-list
            class="desktop-attachments"
            .attachments=${this.attachments}
            .mailbox=${this.mailboxOfMessage(msg)}
            .messageUid=${msg.UID}
          ></alps-attachment-list>
        ` : ''}

        ${this.loading ? html`
          <div class="loading-overlay">
            <div class="loading-state">
              <alps-loader full-height .text=${this.i18nStore?.t('messageReader.loadingMessage') || 'Loading message...'}></alps-loader>
            </div>
          </div>
        ` : html`
          <div class="message-content">
          ${msg.HasBimiFailed ? html`
            <alps-banner variant="warning">
              <span>${this.i18nStore?.t('messageReader.senderUnverifiedWarning')}</span>
            </alps-banner>
          ` : ''}
          ${this.activeBanners && this.activeBanners.length > 0 ? html`
            ${this.activeBanners.map((banner: any) => banner)}
          ` : ''}
          ${this.hasRemoteResources && !this.allowRemoteResources ? html`
            <alps-banner>
              <span>${this.i18nStore?.t('messageReader.remoteContentWarning')}</span>
              <alps-button slot="action" variant="normal" @click=${this.loadRemoteResources}>${this.i18nStore?.t('messageReader.loadRemoteContent')}</alps-button>
            </alps-banner>
          ` : ''}
          ${this.message?.Flags?.includes(FLAG_DRAFT) ? html`
            <alps-banner>
              <span>${this.i18nStore?.t('messageReader.isDraft')}</span>
              <alps-button slot="action" variant="normal" @click=${this._handleEditDraft}>${this.i18nStore?.t('messageReader.editDraft')}</alps-button>
            </alps-banner>
          ` : ''}
          
          <div class="reader-content-wrapper">
            ${this.mimeType?.toLowerCase() === 'text/html' ? html`
              <iframe 
                class="reader-iframe"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                .srcdoc=${live(this.content)}
                @load=${this.onIframeLoad}
              ></iframe>
            ` : this.mimeType?.toLowerCase().startsWith('multipart/') || !this.content ? html`
              <div class="reader-empty-body">
                ${this.i18nStore?.t('messageReader.noReadableText')}
              </div>
            ` : html`
              <div class="reader-text-wrapper">
                <pre class="reader-preformatted">${this.content}</pre>
              </div>
            `}
          </div>

        `}
      </div>

      ${!this.loading && this.attachments && this.attachments.length > 0 ? html`
        <alps-attachment-list
          class="mobile-attachments"
          .attachments=${this.attachments}
          .mailbox=${this.mailboxOfMessage(msg)}
          .messageUid=${msg.UID}
        ></alps-attachment-list>
      ` : ''}
      `}
    `;
  }
}
