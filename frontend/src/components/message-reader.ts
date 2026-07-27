import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { FLAG_SEEN, FLAG_FLAGGED, FLAG_DRAFT, getMessageTags, getTagColor, getTagName, getRemovableTags } from '../utils/flags';
import { FOLDER_INBOX, FOLDER_DRAFTS, FOLDER_SENT, encodeMailboxPath, mailboxRoleByName } from '../utils/folders';
import { fetchWithTimeout } from '../utils/fetch-utils';
import { consume } from '@lit/context';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon, formatFullDate, formatSize, getBimiAvatarUrl } from '../utils/ui';
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
import './alps-tag';
import './alps-banner';
import { MessageCache } from '../utils/message-cache';
import { sanitizeMessageHTML } from '../utils/html-sanitizer';
import { generateQuote } from '../utils/email-quote';
import { composeContext, ComposeStore } from '../store/compose-store';
import { Logger } from '../utils/logger';
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

@customElement('alps-message-reader')
export class MessageReader extends LitElement {
  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @consume({ context: composeContext })
  composeStore!: ComposeStore;

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
          const textRes = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(this.mailbox)}/messages/${this.message.UID}?view=text`);
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
        hourFormat
      );

      const attachments = action === 'forward' ? this.attachments.map(a => ({
        name: a.Filename || 'attachment',
        size: a.Size || 0,
        type: a.MIMEType || 'application/octet-stream',
        partPath: a.Path ? a.Path.join('.') : undefined
      })) : [];

      const inReplyTo = (action === 'reply' || action === 'replyAll') ? (this.message.Envelope?.MessageID || this.message.Envelope?.MessageId) : undefined;

      this.composeStore.openComposer({
        subject,
        to,
        cc,
        text: quotedText,
        html: quotedHtml,
        format: this.settingsStore?.getState()?.composeFormat || 'html',
        attachments: attachments,
        inReplyTo
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
      window.open('#/print?mailbox=' + encodeURIComponent(this.mailbox) + '&uid=' + this.message.UID + remoteParam, '_blank');
      this._closePopup();
      return;
    }
    this._closePopup();
    this.dispatchEvent(new CustomEvent('action', { detail: { action, folder } }));
  }

  private _handleTag(tag: string) {
    this._closePopup();
    const isBulk = this.selectedUids.size > 1 && !this.message;
    const hasTag = isBulk
      ? this.commonTags?.some(f => f.toLowerCase() === tag.toLowerCase())
      : this.message?.Flags?.some((f: string) => f.toLowerCase() === tag.toLowerCase());

    this.dispatchEvent(new CustomEvent('action', { detail: { action: hasTag ? 'removeTag' : 'addTag', folder: tag } }));
  }

  private _handleRemoveAllTags() {
    this._closePopup();
    const isBulk = this.selectedUids.size > 1 && !this.message;

    let tags: string[];
    if (isBulk) {
      // Union of removable keywords across all selected messages.
      const set = new Set<string>();
      for (const m of this.messages) {
        if (this.selectedUids.has(String(m.UID))) {
          for (const t of getRemovableTags(m.Flags)) set.add(t);
        }
      }
      tags = [...set];
    } else {
      tags = getRemovableTags(this.message?.Flags);
    }

    if (tags.length === 0) return;
    this.dispatchEvent(new CustomEvent('action', { detail: { action: 'removeTag', tags } }));
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
  @property({ type: Object }) selectedUids = new Set<string>();
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

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('external-message-flags-changed', this._handleExternalFlagsChanged);
    this.updateComplete.then(() => {
      this.settingsStore?.addEventListener('change', this._handleSettingsChange);
    });
  }

  disconnectedCallback() {
    this.settingsStore?.removeEventListener('change', this._handleSettingsChange);
    window.removeEventListener('external-message-flags-changed', this._handleExternalFlagsChanged);
    super.disconnectedCallback();
  }

  private _handleExternalFlagsChanged = (e: Event) => {
    const customE = e as CustomEvent;
    if (!customE.detail) return;
    const { uids, flag, action } = customE.detail;
    if (!this.threadItems || this.threadItems.length === 0) return;

    let updated = false;
    for (let i = 0; i < this.threadItems.length; i++) {
      const item = this.threadItems[i];
      if (item.message && uids.includes(String(item.message.UID))) {
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
      if (this.message && uids.includes(String(this.message.UID))) {
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
      position: relative;
      display: inline-flex;
    }

    .bimi-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      color: var(--success, #10b981);
      background: var(--bg-primary, #ffffff);
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 1px var(--bg-primary, #ffffff);
    }

    .bimi-badge.bimi-failed-badge {
      color: var(--error, #ef4444);
    }

    .bimi-badge svg {
      width: 16px;
      height: 16px;
    }

    .reader-sender-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
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
  `];

  /**
   * Lifecycle method called by Lit before the component updates.
   * Intercepts changes to the 'message' or 'mailbox' properties to determine if the local state
   * (like view preferences) should be reset and the message body re-fetched from the backend.
   * 
   * @param changedProperties Map of properties that changed and their previous values.
   */
  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('message') && this.message) {
      setTimeout(() => {
        const cardId = `thread-card-${this.message?.UID}`;
        const el = this.shadowRoot?.getElementById(cardId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
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
        const isNewMessage = !oldMessage || oldMessage.UID !== this.message.UID || oldMailbox !== this.mailbox;

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
  }



  /**
   * Allows the loading of remote resources (such as tracking pixels or external images)
   * for the currently viewed message. Re-sanitizes the raw HTML with the restriction lifted.
   */
  private loadRemoteResources() {
    this.allowRemoteResources = true;
    if (this.rawMessageHtml) {
      this.content = sanitizeMessageHTML(this.rawMessageHtml, {
        mailbox: this.mailbox,
        messageUid: this.message?.UID,
        allowRemoteResources: this.allowRemoteResources,
        messageStructure: this.message?.BodyStructure,
        onRemoteResourceBlocked: () => { this.hasRemoteResources = true; }
      });
    }
  }

  private resolveThread(msg: any) {
    if (!msg) return;

    const enableThreading = this.settingsStore?.getState()?.enableThreading ?? true;
    let threadMessages: any[] = [];
    let rootMsg: any = null;

    if (enableThreading && this.messages && this.messages.length > 0) {
      // Find the thread root message that contains msg (either directly or in SubMessages)
      const found = this.messages.find(m => String(m.UID) === String(msg.UID));
      if (found) {
        rootMsg = found;
      } else {
        for (const m of this.messages) {
          if (m.SubMessages && m.SubMessages.find((s: any) => String(s.UID) === String(msg.UID))) {
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
      threadMessages = [msg];
    }

    this._isThread = enableThreading && threadMessages.length > 1;

    const sentMailbox = this.getSentMailboxName();
    const oldItems = this.threadItems || [];

    this.threadItems = threadMessages.map(m => {
      const isCurrent = String(m.UID) === String(msg.UID);
      const existing = oldItems.find(item => String(item.message?.UID) === String(m.UID));

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
    }

    this.resolveThread(msg);

    const primaryItem = this.threadItems.find(item => String(item.message?.UID) === String(msg.UID)) || this.threadItems[0];
    if (primaryItem) {
      primaryItem.loading = !silent;
      primaryItem.expanded = true;
      this._deferPropertySync = false;

      this.fetchItemBody(primaryItem).then(() => {
        if (this.message?.UID !== msg.UID || this.mailbox !== msg.Mailbox) {
          return;
        }
        this.requestUpdate();
      });
    }
  }

  private updateThreadItemReference(item: ThreadMessageItem) {
    if (!item.message) return;
    const idx = this.threadItems.findIndex(i => String(i.message?.UID) === String(item.message?.UID));
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
              const payload: any = { content: item.content, isHtml: false, message: item.message, banners: [], i18nStore: this.i18nStore };
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
                  onRemoteResourceBlocked: () => { item.hasRemoteResources = true; if (String(item.message.UID) === String(this.message?.UID)) this.hasRemoteResources = true; }
                });
              }
            }
          } else {
            item.rawMessageHtml = cached.RawHtml;
            const payload: any = { content: item.rawMessageHtml, isHtml: true, message: item.message, banners: [], i18nStore: this.i18nStore };
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
              onRemoteResourceBlocked: () => { item.hasRemoteResources = true; if (String(item.message.UID) === String(this.message?.UID)) this.hasRemoteResources = true; }
            });
          }
        }
        item.loading = false;
        if (!this._deferPropertySync && String(item.message.UID) === String(this.message?.UID)) {
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
            const payload: any = { content: item.rawMessageHtml, isHtml: true, message: item.message, banners: [], i18nStore: this.i18nStore };
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
              onRemoteResourceBlocked: () => { item.hasRemoteResources = true; if (String(item.message.UID) === String(this.message?.UID)) this.hasRemoteResources = true; }
            });
          } else {
            rawText = await rawRes.text();
            item.content = rawText;
            const payload: any = { content: item.content, isHtml: false, message: item.message, banners: [], i18nStore: this.i18nStore };
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
                onRemoteResourceBlocked: () => { item.hasRemoteResources = true; if (String(item.message.UID) === String(this.message?.UID)) this.hasRemoteResources = true; }
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
      if (!this._deferPropertySync && String(item.message.UID) === String(this.message?.UID)) {
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
    if (item.rawMessageHtml) {
      item.content = sanitizeMessageHTML(item.rawMessageHtml, {
        mailbox: item.mailbox,
        messageUid: item.message?.UID,
        allowRemoteResources: item.allowRemoteResources,
        messageStructure: item.message?.BodyStructure,
        onRemoteResourceBlocked: () => { item.hasRemoteResources = true; }
      });
      if (item === this.threadItems[0]) {
        this.content = item.content;
        this.allowRemoteResources = true;
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

    // Optimistically notify parent page to update flags in list view
    this.dispatchEvent(new CustomEvent('message-flags-changed', {
      detail: {
        uid: String(item.message.UID),
        flag: FLAG_FLAGGED,
        action: op
      },
      bubbles: true,
      composed: true
    }));

    try {
      const success = await messageOperations.setFlag(item.mailbox, [String(item.message.UID)], [FLAG_FLAGGED], op);
      if (!success) {
        if (isStarred) {
          item.message.Flags = [...(item.message.Flags || []), FLAG_FLAGGED];
        } else {
          item.message.Flags = item.message.Flags.filter((f: string) => f !== FLAG_FLAGGED);
        }
        this.updateThreadItemReference(item);

        // Revert parent view on failure
        this.dispatchEvent(new CustomEvent('message-flags-changed', {
          detail: {
            uid: String(item.message.UID),
            flag: FLAG_FLAGGED,
            action: isStarred ? 'add' : 'remove'
          },
          bubbles: true,
          composed: true
        }));
      } else {
        if (String(item.message.UID) === String(this.message?.UID)) {
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
      this.dispatchEvent(new CustomEvent('message-flags-changed', {
        detail: {
          uid: String(item.message.UID),
          flag: FLAG_FLAGGED,
          action: isStarred ? 'add' : 'remove'
        },
        bubbles: true,
        composed: true
      }));
    }
  }

  private async deleteItem(item: ThreadMessageItem) {
    if (!item.message) return;
    const confirmed = confirm(this.i18nStore?.t('messageReader.deleteConfirmSingle') || 'Are you sure you want to permanently delete this message?');
    if (!confirmed) return;

    try {
      const success = await messageOperations.deleteMessages(item.mailbox, [String(item.message.UID)]);
      if (success) {
        const uidStr = String(item.message.UID);
        const isFirst = this.threadItems.length > 0 && String(this.threadItems[0].message?.UID) === uidStr;
        this.threadItems = this.threadItems.filter(i => String(i.message?.UID) !== uidStr);
        this.requestUpdate();

        if (isFirst) {
          this.dispatchEvent(new CustomEvent('action', { detail: { action: 'delete' } }));
        }
      }
    } catch (err) {
      Logger.error('Failed to delete thread item', err);
    }
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
        hourFormat
      );

      const attachments = action === 'forward' ? item.attachments.map(a => ({
        name: a.Filename || 'attachment',
        size: a.Size || 0,
        type: a.MIMEType || 'application/octet-stream',
        partPath: a.Path ? a.Path.join('.') : undefined
      })) : [];

      const inReplyTo = (action === 'reply' || action === 'replyAll') ? (item.message.Envelope?.MessageID || item.message.Envelope?.MessageId) : undefined;

      this.composeStore.openComposer({
        subject,
        to,
        cc,
        text: quotedText,
        html: quotedHtml,
        format: this.settingsStore?.getState()?.composeFormat || 'html',
        attachments: attachments,
        inReplyTo
      });
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
    const mailbox = isItem ? item.mailbox : this.mailbox;
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
      attachments: attachments
    });
  }

  private renderThreadCard(item: ThreadMessageItem) {
    return html`
      <alps-thread-card
        id="thread-card-${item.message?.UID}"
        .item=${item}
        .mailbox=${this.mailbox}
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

    const isBulk = this.selectedUids && this.selectedUids.size > 0;
    const enableThreading = this.settingsStore?.getState()?.enableThreading ?? true;

    if (!this.message && !isBulk) {
      return html`
        <div class="empty-reader-state">
          ${this.i18nStore?.t('messageReader.selectMessage')}
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

    const domain = sender.Host ? sender.Host.toLowerCase() : '';
    const bimiUrl = getBimiAvatarUrl(domain);

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
        <alps-icon-btn title=${(this.message?.Flags?.includes(FLAG_DRAFT) || isDrafts) ? (this.i18nStore?.t('messageReader.discardDraft')) : (this.i18nStore?.t('messageReader.delete'))} @click=${() => this._handleAction('delete')} icon="trash"></alps-icon-btn>
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
        <alps-icon-btn title=${(isBulk && this.allSelectedUnread) || (!isBulk && !this.message?.Flags?.includes(FLAG_SEEN)) ? (this.i18nStore?.t('messageReader.markRead')) : (this.i18nStore?.t('messageReader.markUnread'))} @click=${() => this._handleAction('markUnread')} icon=${(isBulk && this.allSelectedUnread) || (!isBulk && !this.message?.Flags?.includes(FLAG_SEEN)) ? 'envelopeOpen' : 'envelopeUnread'}></alps-icon-btn>
        ` : ''}
        <alps-icon-btn class="desktop-only" ?active=${(isBulk && this.allSelectedStarred) || (!isBulk && this.message?.Flags?.includes(FLAG_FLAGGED))} title=${this.i18nStore?.t('messageReader.star')} @click=${() => this._handleAction('star')} icon=${(isBulk && this.allSelectedStarred) || (!isBulk && this.message?.Flags?.includes(FLAG_FLAGGED)) ? 'starFourFill' : 'starFour'}></alps-icon-btn>
        
        <alps-popup align="left" class="tags-popup">
          <alps-icon-btn slot="trigger" class="desktop-only" title=${this.i18nStore?.t('messageReader.tags')} icon="tag"></alps-icon-btn>
          ${['$label1', '$label2', '$label3', '$label4', '$label5'].map(tag => {
      const isActive = isBulk
        ? this.commonTags?.some(f => f.toLowerCase() === tag.toLowerCase())
        : this.message?.Flags?.some((f: string) => f.toLowerCase() === tag.toLowerCase());

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
            ` : html`
              <alps-icon-btn title=${this.i18nStore?.t('messageReader.reply')} @click=${() => this._handleAction('reply')} icon="arrowBendUpLeft"></alps-icon-btn>
            `}
            
            <alps-popup align="right" class="more-menu-popup">
              <alps-icon-btn slot="trigger" class="more-btn" title=${this.i18nStore?.t('messageReader.moreOptions')} icon="dotsThreeVertical"></alps-icon-btn>
            
            ${!(this.message?.Flags?.includes(FLAG_DRAFT) || isDrafts) ? html`
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
              ${renderIcon('trash')} <span class="item-text">${this.message?.Flags?.includes(FLAG_DRAFT) || this.mailbox === FOLDER_DRAFTS || mailboxRoleByName(this.mailbox || '', this.mailboxes) === 'drafts' ? (this.i18nStore?.t('messageReader.discardDraft')) : (this.i18nStore?.t('messageReader.delete'))}</span>
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
            <div class="dropdown-divider"></div>
            ${!isTrash && !isSent ? html`
            <button class="dropdown-item" @click=${() => this._handleAction('markUnread')}>
              ${!this.message?.Flags?.includes(FLAG_SEEN) ? renderIcon('envelopeOpen') : renderIcon('envelopeUnread')} <span class="item-text">${!this.message?.Flags?.includes(FLAG_SEEN) ? (this.i18nStore?.t('messageReader.markRead')) : (this.i18nStore?.t('messageReader.markUnread'))}</span>
            </button>
            ` : ''}
            <button class="dropdown-item" @click=${() => this._handleAction('star')}>
              ${this.message?.Flags?.includes(FLAG_FLAGGED) ? renderIcon('starFourFill') : renderIcon('starFour')} <span class="item-text">${this.i18nStore?.t('messageReader.star')}</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${() => this._handleAction('print')}>
              ${renderIcon('printer')} <span class="item-text">${this.i18nStore?.t('messageReader.print')}</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item ${currentView === 'text' ? 'active' : ''}" ?disabled=${!this.hasText} @click=${() => this.hasText && this._handleAction('showPlaintext')}>
              ${renderIcon('textAlignLeft')}
              <span class="item-text">${this.i18nStore?.t('messageReader.showPlaintext')}</span>
            </button>
            <button class="dropdown-item ${currentView === 'html' ? 'active' : ''}" ?disabled=${!this.hasHtml} @click=${() => this.hasHtml && this._handleAction('showHtml')}>
              ${renderIcon('code')}
              <span class="item-text">${this.i18nStore?.t('messageReader.showHtml')}</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click=${() => this._handleAction('downloadMessage')}>
              ${renderIcon('downloadSimple')} <span class="item-text">${this.i18nStore?.t('messageReader.downloadMessage')}</span>
            </button>
            <button class="dropdown-item" @click=${() => this._handleAction('showOriginal')}>
              ${renderIcon('codeBlock')} <span class="item-text">${this.i18nStore?.t('messageReader.showOriginal')}</span>
            </button>
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
            <span>${this.selectedUids.size} ${this.i18nStore?.t('messageReader.messagesSelected')}</span>
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
                <div class="avatar-container">
                  <alps-avatar .name=${senderName} .email=${senderAddress} .size=${40} .src=${bimiUrl}></alps-avatar>
                  ${msg.HasBimiPotential ? html`
                    <div class="bimi-badge" title="${this.i18nStore?.t('messageReader.verifiedSender')}">
                      ${renderIcon('verifiedBadge')}
                    </div>
                  ` : msg.HasBimiFailed ? html`
                    <div class="bimi-badge bimi-failed-badge" title="${this.i18nStore?.t('messageReader.unverifiedSender')}">
                      ${renderIcon('authFailedBadge')}
                    </div>
                  ` : ''}
                </div>
                <div class="reader-sender-info">
                  ${sender.Name && sender.Name !== senderAddress ? html`<span class="reader-sender-name">${sender.Name}</span>` : ''}
                  ${senderAddress ? html`<alps-recipient-pill address="${senderAddress}"></alps-recipient-pill>` : html`<span class="reader-sender-name">${senderName}</span>`}
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
            .mailbox=${this.mailbox}
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
          .mailbox=${this.mailbox}
          .messageUid=${msg.UID}
        ></alps-attachment-list>
      ` : ''}
      `}
    `;
  }
}
