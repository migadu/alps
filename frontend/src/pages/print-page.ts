import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { live } from 'lit/directives/live.js';
import { fetchWithTimeout } from '../utils/fetch-utils';
import { encodeMailboxPath } from '../utils/folders';
import { MessageCache, type CachedMessage } from '../utils/message-cache';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { formatFullDate, renderIcon } from '../utils/ui';
import { sanitizeMessageHTML } from '../utils/html-sanitizer';
import { isolatedCaption, isolatedEmail, isolatedMailboxes } from '../utils/bidi';
import '../components/alps-banner';
import '../components/alps-button';

@customElement('print-page')
export class PrintPage extends LitElement {
  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @state() private loading = true;
  @state() private error = '';
  @state() private mailbox = '';
  @state() private uid = '';
  @state() private message: any = null;
  @state() private content: string = '';
  @state() private rawMessageHtml: string = '';
  @state() private mimeType: string = 'text/plain';
  @state() private hasRemoteResources = false;
  @state() private allowRemoteResources = false;
  private printTriggered = false;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: #fff;
      color: #000;
      font-family: Arial, sans-serif;
    }
    .print-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }
    .print-header {
      margin-bottom: 24px;
      text-align: left;
    }
    .print-header h2 {
      font-size: 20px;
      font-weight: normal;
      margin: 0 0 12px 0;
      color: #222;
    }
    .print-divider {
      border-bottom: 1px solid #ddd;
      margin-bottom: 12px;
    }
    .print-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .print-date {
      color: #666;
      margin-left: 16px;
      text-align: right;
      min-width: 150px;
    }
    .print-to-row {
      font-size: 13px;
      color: #444;
    }
    .print-cc {
      margin-top: 4px;
    }
    .print-divider-thick {
      border-bottom: 1px solid #eee;
      margin-top: 24px;
      margin-bottom: 24px;
    }
    .print-body {
      font-size: 14px;
    }
    .print-iframe {
      width: 100%;
      border: none;
      overflow: visible;
      display: block;
    }
    .loading-state, .error-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: var(--text-muted, #6b7280);
      font-size: 14px;
      gap: 12px;
    }
    .error-state {
      color: #dc2626;
      flex-direction: column;
    }
    .spinner {
      animation: spin 3s linear infinite;
      display: flex;
    }
    .spinner svg {
      width: 32px;
      height: 32px;
      fill: currentColor;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @media print {
      body { padding: 0 !important; margin: 0 !important; }
      .print-container { padding: 0; max-width: none; }
      alps-banner { display: none !important; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.allowRemoteResources = this.settingsStore.getState().showRemoteContent === 'always';
    this.extractParams();
    if (this.mailbox && this.uid) {
      this.fetchMessage();
    } else {
      this.error = 'Missing mailbox or uid parameters';
      this.loading = false;
    }
  }

  private extractParams() {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const params = new URLSearchParams(hash.substring(qIndex + 1));
      this.mailbox = params.get('mailbox') || '';
      this.uid = params.get('uid') || '';
      if (params.get('remote') === '1') {
        this.allowRemoteResources = true;
      }
    }
  }

  private async fetchMessage() {
    try {
      this.loading = true;

      // The reader caches the view it showed, so a message read in plain
      // text has a text entry and no HTML one. An entry counts only if it
      // holds a body: the reader caches a read whose body request failed as
      // well, and that one, taken as a hit, printed the header over nothing.
      const holdsBody = (entry: CachedMessage | null) =>
        !!entry && !!entry.Part && (entry.RawHtml !== undefined || entry.RawText !== undefined);
      const cached = [MessageCache.get(this.mailbox, this.uid, 'html'), MessageCache.get(this.mailbox, this.uid, 'text')].find(holdsBody);
      if (cached) {
        this.message = cached.Message;
        this.mimeType = cached.Part.MIMEType || cached.Part.MimeType || 'text/plain';
        if (cached.RawHtml !== undefined) {
          this.rawMessageHtml = cached.RawHtml;
          this.hasRemoteResources = false;

          this.content = sanitizeMessageHTML(this.rawMessageHtml, {
            mailbox: this.mailbox,
            messageUid: this.uid,
            allowRemoteResources: this.allowRemoteResources,
            messageStructure: this.message.BodyStructure,
            onRemoteResourceBlocked: () => { this.hasRemoteResources = true; }
          });
        } else if (cached.RawText !== undefined) {
          this.content = cached.RawText;
        }
        this.loading = false;
        return;
      }

      // The answer wraps the message, and names in `Part` the part the server
      // picked to show, the HTML one first as asked. Read as the message
      // itself, it left the page without an envelope or a structure, and it
      // printed "(No Subject)", "Unknown Sender" and no body.
      const res = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(this.mailbox)}/messages/${this.uid}?view=html`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.hash = '#/login';
          return;
        }
        throw new Error('Failed to fetch message metadata');
      }
      const data = await res.json();
      this.message = data.Message;

      await this.fetchMessageBody(data.Part);
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }

  // The part comes from the server rather than from a walk of the structure
  // here: the structure is go-imap's, with a Type and a Subtype and no
  // MIMEType, so a walk looking for MIMEType found no part in any message.
  private async fetchMessageBody(part: any) {
    if (!part) {
      // No part of the message is text the page can print.
      this.mimeType = 'multipart/mixed';
      this.content = '';
      return;
    }
    this.mimeType = part.MIMEType || part.MimeType || 'text/plain';
    // A single-part message whose one part is text the server does not take
    // for the plain or HTML body (a bare calendar invitation, or text sent as
    // an attachment) comes back as the whole message, with no path. Its body
    // is part 1, which is what the page asked for before; the path written
    // out as "null" is refused.
    const partPath = Array.isArray(part.Path) && part.Path.length ? part.Path.join('.') : '1';

    const rawRes = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(this.mailbox)}/messages/${this.uid}/raw?part=${partPath}`);
    if (!rawRes.ok) throw new Error('Failed to fetch message body');

    if (this.mimeType.toLowerCase() === 'text/html') {
      this.rawMessageHtml = await rawRes.text();
      this.hasRemoteResources = false;

      this.content = sanitizeMessageHTML(this.rawMessageHtml, {
        mailbox: this.mailbox,
        messageUid: this.uid,
        allowRemoteResources: this.allowRemoteResources,
        messageStructure: this.message.BodyStructure,
        onRemoteResourceBlocked: () => { this.hasRemoteResources = true; }
      });
    } else {
      this.content = await rawRes.text();
    }
  }

  private loadRemoteResources() {
    this.allowRemoteResources = true;
    // Allow the re-rendered iframe to re-trigger printing once remote content loads.
    this.printTriggered = false;
    if (this.rawMessageHtml) {
      this.content = sanitizeMessageHTML(this.rawMessageHtml, {
        mailbox: this.mailbox,
        messageUid: this.uid,
        allowRemoteResources: this.allowRemoteResources,
        messageStructure: this.message?.BodyStructure,
        onRemoteResourceBlocked: () => { this.hasRemoteResources = true; }
      });
    }
  }

  updated(_changedProperties: PropertyValues) {
    // HTML bodies are rendered inside a sandboxed iframe and print is triggered
    // from its load handler (once it is laid out). Only auto-print non-HTML
    // content from here.
    //
    // Gated on the page being READY, not on a non-empty body. A message with no
    // readable text part keeps `content` at '' (never truthy, and never changing
    // either), so its page rendered its headers and the print dialog simply never
    // opened, with nothing on screen to say why.
    if (this.loading || this.error || !this.message) return;
    if (this.mimeType?.toLowerCase() === 'text/html') return;
    if (this.printTriggered) return;
    this.printTriggered = true;
    // A print tab closed inside the delay has nothing left to print.
    setTimeout(() => { if (this.isConnected) window.print(); }, 500);
  }

  // Renders untrusted message HTML inside a sandboxed iframe (no allow-scripts),
  // mirroring the message reader, so active content in mail HTML cannot execute
  // in the app origin. Sizes the frame to its content and prints once laid out.
  private onPrintIframeLoad(e: Event) {
    const iframe = e.target as HTMLIFrameElement;
    try {
      const doc = iframe.contentDocument;
      if (doc && doc.body) {
        iframe.style.height = `${doc.body.scrollHeight}px`;
      }
    } catch {
      // cross-origin access should not happen for srcdoc; ignore defensively
    }
    if (!this.printTriggered) {
      this.printTriggered = true;
      setTimeout(() => { if (this.isConnected) window.print(); }, 300);
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t('print.loading')}</span>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error-state">
          <div>${renderIcon('warning')}</div>
          <span>${this.error}</span>
        </div>
      `;
    }

    const msg = this.message;
    if (!msg) return html``;

    const subject = msg.Envelope?.Subject || (this.i18nStore?.t('messageList.noSubject'));
    const sender = msg.Envelope?.From?.[0] || {};
    const senderAddress = sender.Mailbox && sender.Host ? `${sender.Mailbox}@${sender.Host}` : '';
    // The address is printed after the name only when there is one: without
    // a name the caption IS the address, and was printed twice.
    const senderCaption = sender.Name || senderAddress
      ? isolatedCaption(sender.Name, senderAddress)
      : this.i18nStore?.t('messageList.unknownSender');

    const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
    const hourFormat = String(this.settingsStore?.getState()?.hourFormat || '12');
    const dateStr = msg.Envelope?.Date ? formatFullDate(msg.Envelope.Date, dateFormat, hourFormat) : '';

    // Each name and each address in an isolate of its own (see utils/bidi),
    // with the angle brackets written as template text: these used to be
    // `&lt;` inside one interpolated string, which a text binding escapes,
    // so the page printed "Name &lt;a@b&gt;".
    const mailboxes = (list: any[]) => isolatedMailboxes(list.map((t: any) => ({ name: t.Name, email: `${t.Mailbox}@${t.Host}` })));
    const toList = msg.Envelope?.To && msg.Envelope.To.length > 0
      ? mailboxes(msg.Envelope.To)
      : (this.i18nStore?.t('messageReader.undisclosed'));

    let ccHtml = html``;
    if (msg.Envelope?.Cc && msg.Envelope.Cc.length > 0) {
      const ccList = mailboxes(msg.Envelope.Cc);
      ccHtml = html`<div class="print-cc"><strong>${this.i18nStore?.t('messageReader.cc')}</strong> ${ccList}</div>`;
    }

    let bodyTemplate;
    if (this.mimeType?.toLowerCase() === 'text/html') {
      bodyTemplate = html`<iframe
        class="print-iframe"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        .srcdoc=${live(this.content)}
        @load=${this.onPrintIframeLoad}
      ></iframe>`;
    } else if (this.mimeType?.toLowerCase().startsWith('multipart/')) {
      bodyTemplate = html`<div style="font-style: italic; color: #666;">${this.i18nStore?.t('messageReader.noReadableText')}</div>`;
    } else {
      bodyTemplate = html`<pre dir="auto" style="unicode-bidi: plaintext; white-space: pre-wrap; font-family: inherit; margin: 0;">${this.content}</pre>`;
    }

    return html`
      ${this.hasRemoteResources && !this.allowRemoteResources ? html`
        <alps-banner>
          <span>${this.i18nStore.t('messageReader.remoteContentWarning')}</span>
          <alps-button slot="action" variant="normal" @click=${this.loadRemoteResources}>
            ${this.i18nStore.t('messageReader.loadRemoteContent')}
          </alps-button>
        </alps-banner>
      ` : ''}
      <div class="print-container">
        <div class="print-header">
          <h2><bdi>${subject}</bdi></h2>
          <div class="print-divider"></div>
          <div class="print-meta-row">
            <div><strong>${senderCaption}</strong> ${sender.Name && senderAddress ? html`&lt;${isolatedEmail(senderAddress)}&gt;` : ''}</div>
            <div class="print-date">${dateStr}</div>
          </div>
          <div class="print-to-row">
            <strong>${this.i18nStore?.t('messageReader.to')}</strong> ${toList}
            ${ccHtml}
          </div>
          <div class="print-divider-thick"></div>
        </div>
        <div class="print-body">
          ${bodyTemplate}
        </div>
      </div>
    `;
  }
}
