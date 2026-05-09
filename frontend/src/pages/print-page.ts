import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { fetchWithTimeout } from '../utils/fetch-utils';
import { MessageCache } from '../utils/message-cache';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { formatFullDate, renderIcon } from '../utils/ui';
import { sanitizeMessageHTML } from '../utils/html-sanitizer';
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

      const cached = MessageCache.get(this.mailbox, this.uid);
      if (cached && cached.Part) {
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

      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.hash = '#/login';
          return;
        }
        throw new Error('Failed to fetch message metadata');
      }
      this.message = await res.json();

      await this.fetchMessageBody();
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }

  private findDisplayPart(structure: any, preferredView: 'html' | 'text'): any {
    if (!structure) return null;

    if (structure.MIMEType && structure.MIMEType.toLowerCase().startsWith('multipart/')) {
      if (structure.MIMEType.toLowerCase() === 'multipart/alternative') {
        let textPart = null;
        let htmlPart = null;

        for (const child of (structure.Children || [])) {
          if (child.MIMEType?.toLowerCase() === 'text/plain') textPart = child;
          if (child.MIMEType?.toLowerCase() === 'text/html') htmlPart = child;
        }

        if (preferredView === 'html') {
          return htmlPart || textPart || structure.Children[0];
        } else {
          return textPart || htmlPart || structure.Children[0];
        }
      }

      for (const child of (structure.Children || [])) {
        const found = this.findDisplayPart(child, preferredView);
        if (found) return found;
      }
    }

    if (structure.MIMEType?.toLowerCase() === 'text/html' || structure.MIMEType?.toLowerCase() === 'text/plain') {
      return structure;
    }

    return null;
  }

  private findPartPath(structure: any, targetPart: any, currentPath: string = ''): string | null {
    if (!structure) return null;
    if (structure === targetPart) return currentPath || '1';

    if (structure.Children && Array.isArray(structure.Children)) {
      for (let i = 0; i < structure.Children.length; i++) {
        const nextPath = currentPath ? `${currentPath}.${i + 1}` : `${i + 1}`;
        const found = this.findPartPath(structure.Children[i], targetPart, nextPath);
        if (found) return found;
      }
    }
    return null;
  }

  private async fetchMessageBody() {
    if (!this.message || !this.message.BodyStructure) return;

    let partPath = '1';
    let targetPart = this.findDisplayPart(this.message.BodyStructure, 'html');

    if (targetPart) {
      partPath = this.findPartPath(this.message.BodyStructure, targetPart) || '1';
      this.mimeType = targetPart.MIMEType || 'text/plain';
    } else {
      this.mimeType = this.message.BodyStructure.MIMEType || 'text/plain';
      if (this.mimeType.toLowerCase() === 'text/plain' || this.mimeType.toLowerCase() === 'text/html') {
        partPath = '1';
      } else {
        this.mimeType = 'multipart/mixed';
      }
    }

    if (this.mimeType.toLowerCase().startsWith('multipart/')) {
      this.content = '';
      return;
    }

    const rawRes = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}/raw?part=${partPath}`);
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

  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('content') && this.content) {
      setTimeout(() => {
        window.print();
      }, 500);
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
    const senderName = sender.Name || senderAddress || (this.i18nStore?.t('messageList.unknownSender'));

    const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
    const hourFormat = String(this.settingsStore?.getState()?.hourFormat || '12');
    const dateStr = msg.Envelope?.Date ? formatFullDate(msg.Envelope.Date, dateFormat, hourFormat) : '';

    const toList = msg.Envelope?.To && msg.Envelope.To.length > 0
      ? msg.Envelope.To.map((t: any) => t.Name ? `${t.Name} &lt;${t.Mailbox}@${t.Host}&gt;` : `${t.Mailbox}@${t.Host}`).join(', ')
      : (this.i18nStore?.t('messageReader.undisclosed'));

    let ccHtml = html``;
    if (msg.Envelope?.Cc && msg.Envelope.Cc.length > 0) {
      const ccList = msg.Envelope.Cc.map((t: any) => t.Name ? `${t.Name} &lt;${t.Mailbox}@${t.Host}&gt;` : `${t.Mailbox}@${t.Host}`).join(', ');
      ccHtml = html`<div class="print-cc"><strong>${this.i18nStore?.t('messageReader.cc')}</strong> ${ccList}</div>`;
    }

    let bodyTemplate;
    if (this.mimeType?.toLowerCase() === 'text/html') {
      bodyTemplate = html`<div .innerHTML=${this.content}></div>`;
    } else if (this.mimeType?.toLowerCase().startsWith('multipart/')) {
      bodyTemplate = html`<div style="font-style: italic; color: #666;">${this.i18nStore?.t('messageReader.noReadableText')}</div>`;
    } else {
      bodyTemplate = html`<pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${this.content}</pre>`;
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
          <h2>${subject}</h2>
          <div class="print-divider"></div>
          <div class="print-meta-row">
            <div><strong>${senderName}</strong> ${senderAddress ? `<${senderAddress}>` : ''}</div>
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
