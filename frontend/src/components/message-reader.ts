import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { FLAG_SEEN, FLAG_FLAGGED, FLAG_DRAFT } from '../utils/flags';
import { FOLDER_INBOX, FOLDER_DRAFTS, FOLDER_SENT, FOLDER_TRASH, FOLDER_JUNK, FOLDER_SPAM, FOLDER_ARCHIVE, FOLDER_ARCHIVES } from '../utils/folders';
import { fetchWithTimeout } from '../utils/fetch-utils';
import { consume } from '@lit/context';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon, formatFullDate, formatSize } from '../utils/ui';
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
import './alps-banner';
import { MessageCache } from '../utils/message-cache';
import { sanitizeMessageHTML } from '../utils/html-sanitizer';
import { generateQuote } from '../utils/email-quote';
import { composeContext, ComposeStore } from '../store/compose-store';
import { Logger } from '../utils/logger';

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
    const popup = this.shadowRoot?.querySelector('.more-menu-popup') as any;
    if (popup) popup.close();
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
          const textRes = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.message.UID}?view=text`);
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
          const temp = document.createElement('div');
          temp.innerHTML = this.rawMessageHtml;
          textBody = temp.innerText || '';
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

      const inReplyTo = (action === 'reply' || action === 'replyAll') ? this.message.Envelope?.MessageId : undefined;

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

  @state()
  private localPreferredView: 'html' | 'text' | null = null;

  @state()
  private hasHtml: boolean = false;

  @state()
  private hasText: boolean = false;

  @property({ type: String }) mailbox = FOLDER_INBOX;
  @property({ type: Object }) message: any = null;
  @property({ type: Object }) selectedUids = new Set<string>();
  @property({ type: Boolean }) allSelectedStarred = false;
  @property({ type: Boolean }) allSelectedUnread = false;
  @property({ type: Boolean }) bulkProcessing = false;
  @property({ type: String }) layoutMode = 'vertical';
  @property({ type: Array }) mailboxes: any[] = [];

  @state() private content = '';
  @state() private mimeType = '';
  @state() private loading = false;
  @state() private hasRemoteResources = false;
  @state() private allowRemoteResources = false;
  @state() private attachments: any[] = [];
  @state() private rawMessageHtml = '';
  @state() private isScrolled = false;

  static styles = [
    popupStyles,
    css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
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
        align-items: flex-end;
        float: right;
        margin-left: 12px;
        margin-top: 5px;
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
  `];

  /**
   * Lifecycle method called by Lit before the component updates.
   * Intercepts changes to the 'message' or 'mailbox' properties to determine if the local state
   * (like view preferences) should be reset and the message body re-fetched from the backend.
   * 
   * @param changedProperties Map of properties that changed and their previous values.
   */
  willUpdate(changedProperties: Map<string, any>) {
    const messageChanged = changedProperties.has('message');
    const mailboxChanged = changedProperties.has('mailbox');

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
      } else {
        const isNewMessage = !oldMessage || oldMessage.UID !== this.message.UID || oldMailbox !== this.mailbox;

        if (isNewMessage) {
          this.localPreferredView = null;
          this.fetchMessageBody(this.message, this.message._isAutosaveUpdate);
        } else if (this.message._isAutosaveUpdate && oldMessage && this.message !== oldMessage) {
          this.fetchMessageBody(this.message, true);
        }
      }
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

  /**
   * Fetches the full message body (both metadata and raw content) from the backend API.
   * Utilizes an in-memory cache to prevent redundant requests. Sanitizes HTML content 
   * to prevent XSS before storing it in the component state for rendering.
   * 
   * @param msg The message object containing the UID to fetch.
   * @param silent If true, skips showing the loading indicator and clearing the current content.
   */
  private async fetchMessageBody(msg: any, silent = false) {
    if (!silent) {
      this.content = '';
      this.mimeType = '';
      this.rawMessageHtml = '';
      this.loading = true;
      this.allowRemoteResources = this.settingsStore?.getState().showRemoteContent === 'always';
      this.hasRemoteResources = false;
    }

    const preferredView = this.localPreferredView || this.settingsStore?.getState()?.preferredView || 'html';

    try {
      const cached = MessageCache.get(this.mailbox, msg.UID.toString(), preferredView);
      if (cached) {
        this.attachments = cached.Attachments || [];
        this.hasHtml = cached.HasHTML || false;
        this.hasText = cached.HasText || false;
        if (cached.Message) {
          // Merge cached message with the passed msg to preserve fresh flags from the list
          this.message = { ...this.message, ...cached.Message, ...msg };
        }
        if (cached.Part) {
          this.mimeType = cached.Part.MIMEType || cached.Part.MimeType || 'text/plain';
          if (cached.RawHtml !== undefined) {
            this.rawMessageHtml = cached.RawHtml;
            this.content = sanitizeMessageHTML(this.rawMessageHtml, {
              mailbox: this.mailbox,
              messageUid: this.message?.UID,
              allowRemoteResources: this.allowRemoteResources,
              messageStructure: this.message?.BodyStructure,
              onRemoteResourceBlocked: () => { this.hasRemoteResources = true; }
            });
          } else if (cached.RawText !== undefined) {
            this.content = cached.RawText;
          }
        }
        this.loading = false;
        return;
      }

      const metadataRes = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${msg.UID}?view=${preferredView}`);
      if (metadataRes.status === 401) {
        window.location.hash = '/login';
        return;
      }
      if (!metadataRes.ok) throw new Error('Failed to fetch metadata');
      const data = await metadataRes.json();

      this.attachments = data.Attachments || [];
      this.hasHtml = !!data.HasHTML;
      this.hasText = !!data.HasText;
      if (data.Message) {
        this.message = { ...this.message, ...data.Message };
      }

      let rawHtml: string | undefined;
      let rawText: string | undefined;

      const part = data.Part;
      if (part) {
        this.mimeType = part.MIMEType || part.MimeType || 'text/plain';
        const partPathStr = Array.isArray(part.Path) ? part.Path.join('.') : part.Path;
        const rawRes = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${msg.UID}/raw?part=${partPathStr}`);
        if (rawRes.status === 401) {
          window.location.hash = '/login';
          return;
        }
        if (rawRes.ok) {
          if (this.mimeType.toLowerCase() === 'text/html') {
            rawHtml = await rawRes.text();
            this.rawMessageHtml = rawHtml;
            this.content = sanitizeMessageHTML(this.rawMessageHtml, {
              mailbox: this.mailbox,
              messageUid: this.message?.UID,
              allowRemoteResources: this.allowRemoteResources,
              messageStructure: this.message?.BodyStructure,
              onRemoteResourceBlocked: () => { this.hasRemoteResources = true; }
            });
          } else {
            rawText = await rawRes.text();
            this.content = rawText;
          }
        }
      }

      MessageCache.set(this.mailbox, msg.UID.toString(), preferredView, {
        Message: data.Message,
        Part: data.Part,
        Attachments: data.Attachments,
        RawHtml: rawHtml,
        RawText: rawText,
        HasHTML: this.hasHtml,
        HasText: this.hasText
      });
    } catch (e) {
      Logger.error('Failed to fetch message:', e);
      this.content = 'Error loading message.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Handles the load event of the message content iframe.
   * Injects a ResizeObserver into the iframe's document body to dynamically adjust
   * the iframe's height to match its content, avoiding nested scrollbars.
   * 
   * @param e The load event from the iframe.
   */
  private onIframeLoad(e: Event) {
    const iframe = e.target as HTMLIFrameElement;
    if (!iframe.contentDocument || !iframe.contentDocument.body) return;

    iframe.style.height = '0px';
    iframe.style.width = '100%';

    // Prevent dropping files inside the iframe from navigating away
    iframe.contentDocument.addEventListener('dragover', (ev) => ev.preventDefault());
    iframe.contentDocument.addEventListener('drop', (ev) => ev.preventDefault());

    if ((iframe as any)._ro) {
      (iframe as any)._ro.disconnect();
    }

    let parentWidth = 0;
    const ro = new ResizeObserver((entries) => {
      let newHeight = 0;
      let newWidth = 0;

      for (const entry of entries) {
        if (entry.target === iframe.parentElement) {
          parentWidth = entry.contentRect.width;
        } else if (iframe.contentDocument && entry.target === iframe.contentDocument.body) {
          if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
            newHeight = entry.borderBoxSize[0].blockSize;
            newWidth = entry.borderBoxSize[0].inlineSize;
          } else {
            newHeight = entry.contentRect.height + 48;
            newWidth = entry.contentRect.width + 48;
          }
        }
      }

      if (newHeight > 0) {
        const currentHeight = parseFloat(iframe.style.height) || 0;
        if (Math.abs(currentHeight - newHeight) > 2) {
          iframe.style.height = `${Math.ceil(newHeight)}px`;
        }
      }

      if (parentWidth > 0 && newWidth > parentWidth) {
        const currentWidth = parseFloat(iframe.style.width) || 0;
        if (Math.abs(currentWidth - newWidth) > 2) {
          iframe.style.width = `${Math.ceil(newWidth)}px`;
        }
      }
    });

    ro.observe(iframe.contentDocument.body);
    if (iframe.parentElement) {
      ro.observe(iframe.parentElement);
    }
    (iframe as any)._ro = ro;
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
  private async _handleEditDraft() {
    if (!this.message) return;

    let textBody = '';
    if (this.mimeType === 'text/plain') {
      textBody = this.content;
    } else {
      try {
        const textRes = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.message.UID}?view=text`);
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
        const temp = document.createElement('div');
        temp.innerHTML = this.rawMessageHtml;
        textBody = temp.innerText || '';
      }
    }

    const attachments = this.attachments.map(a => ({
      name: a.Filename || 'attachment',
      size: a.Size || 0,
      type: a.MIMEType || 'application/octet-stream',
      partPath: a.Path ? a.Path.join('.') : undefined
    }));

    const formatAddrs = (addrs: any[]) => addrs ? addrs.map(a => a.Name ? `${a.Name} <${a.Mailbox}@${a.Host}>` : `${a.Mailbox}@${a.Host}`) : [];

    this.composeStore.openComposer({
      draftUid: this.message.UID.toString(),
      draftMailbox: this.mailbox,
      subject: this.message.Envelope?.Subject || '',
      to: formatAddrs(this.message.Envelope?.To),
      cc: formatAddrs(this.message.Envelope?.Cc),
      bcc: formatAddrs(this.message.Envelope?.Bcc),
      text: textBody,
      html: this.rawMessageHtml,
      format: this.settingsStore?.getState()?.composeFormat || 'html',
      attachments: attachments
    });
  }

  render() {
    const isBulk = this.selectedUids && this.selectedUids.size > 0;

    if (!this.message && !isBulk) {
      return html`
        <div class="empty-reader-state">
          ${this.i18nStore?.t('messageReader.selectMessage')}
        </div>
      `;
    }

    const currentView = this.localPreferredView || this.settingsStore?.getState()?.preferredView || 'html';

    const msg = this.message || {};
    const sender = msg.Envelope?.From?.[0] || {};
    const senderAddress = sender.Mailbox && sender.Host ? `${sender.Mailbox}@${sender.Host}` : '';
    const senderName = sender.Name || senderAddress || (this.i18nStore?.t('messageList.unknownSender'));
    const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
    const hourFormat = String(this.settingsStore?.getState()?.hourFormat || '12');
    const dateStr = msg.Envelope?.Date ? formatFullDate(msg.Envelope.Date, dateFormat, hourFormat) : '';

    const domain = sender.Host ? sender.Host.toLowerCase() : '';
    const freemailDomains = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'live.com', 'msn.com', 'pm.me', 'yandex.ru', 'mail.ru', 'gmx.de', 'web.de', 't-online.de', 'orange.fr', 'free.fr']);
    const bimiUrl = (domain && !freemailDomains.has(domain)) ? `/bimi/avatar?domain=${encodeURIComponent(domain)}` : '';

    const mbxLower = (this.mailbox || '').toLowerCase();
    const isArchive = mbxLower === FOLDER_ARCHIVE.toLowerCase() || mbxLower === FOLDER_ARCHIVES.toLowerCase();
    const isJunk = mbxLower === FOLDER_SPAM.toLowerCase() || mbxLower === FOLDER_JUNK.toLowerCase();
    const isTrash = mbxLower === FOLDER_TRASH.toLowerCase();
    const isDrafts = mbxLower === FOLDER_DRAFTS.toLowerCase();
    const isSent = mbxLower === FOLDER_SENT.toLowerCase();

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
              ${renderIcon('trash')} <span class="item-text">${this.message?.Flags?.includes(FLAG_DRAFT) || this.mailbox === FOLDER_DRAFTS ? (this.i18nStore?.t('messageReader.discardDraft')) : (this.i18nStore?.t('messageReader.delete'))}</span>
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
      ` : html`
        <div class="reader-body" @scroll=${this.handleScroll}>
          <div class="reader-header">
          <div class="reader-subject">
            <div class="mobile-date-container">
              <div class="reader-date mobile-date">${dateStr}</div>
              ${msg.RFC822Size ? html`<div class="reader-size mobile-size">${formatSize(msg.RFC822Size)}</div>` : ''}
            </div>
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
                .srcdoc=${this.content}
                @load=${this.onIframeLoad}
              ></iframe>
            ` : this.mimeType?.toLowerCase().startsWith('multipart/') ? html`
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
