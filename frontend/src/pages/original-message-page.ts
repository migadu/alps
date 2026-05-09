import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/alps-icon-btn';
import '../components/alps-loader';
import { fetchWithTimeout } from '../utils/fetch-utils';
import { parseEmailHeaders, type ParsedHeaders } from '../utils/email-parser';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import '../components/alps-button';
import '../components/alps-banner';

@customElement('original-message-page')
export class OriginalMessagePage extends LitElement {
  @state() private rawText = '';
  @state() private parsedHeaders: ParsedHeaders | null = null;
  @state() private loading = true;
  @state() private error = '';
  @state() private mailbox = '';
  @state() private uid = '';
  @state() private isTruncated = false;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  // Maximum size to display (64KB)
  private readonly MAX_DISPLAY_SIZE = 65536;

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      overflow: auto;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #000);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 24px;
      font-weight: 600;
    }
    .metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      background: var(--bg-secondary, #f9fafb);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      overflow: hidden;
    }
    .metadata-table th,
    .metadata-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      font-size: 14px;
    }
    .metadata-table th {
      width: 150px;
      font-weight: 600;
      color: var(--text-secondary, #4b5563);
      background: var(--bg-tertiary, #f3f4f6);
    }
    .metadata-table tr:last-child th,
    .metadata-table tr:last-child td {
      border-bottom: none;
    }
    .auth-pass { color: #059669; font-weight: 600; }
    .auth-fail { color: #dc2626; font-weight: 600; }
    .auth-none { color: var(--text-muted, #9ca3af); }

    .actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .raw-content {
      background: var(--bg-secondary, #f9fafb);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }
    alps-banner {
      position: static;
      margin-bottom: 24px;
      border-radius: 4px;
      overflow: hidden;
    }
    .auth-status-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .auth-status-detail {
      color: var(--text-muted, #6b7280);
      font-size: 13px;
    }
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 12px;
      color: var(--text-muted, #6b7280);
      font-size: 14px;
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
  `;

  connectedCallback() {
    super.connectedCallback();
    this.extractParams();
    if (this.mailbox && this.uid) {
      this.fetchOriginal();
    } else {
      this.error = this.i18nStore?.t('originalMessage.errorMissingParams');
      this.loading = false;
    }

    this.updateComplete.then(() => {
      this.i18nStore?.addEventListener('change', this._handleStoreChange);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleStoreChange);
  }

  private extractParams() {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const params = new URLSearchParams(hash.substring(qIndex + 1));
      this.mailbox = params.get('mailbox') || '';
      this.uid = params.get('uid') || '';
    }
  }

  private async fetchOriginal() {
    try {
      this.loading = true;
      const res = await fetchWithTimeout(`/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}/raw?limit=${this.MAX_DISPLAY_SIZE}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.hash = '#/login';
          return;
        }
        throw new Error(this.i18nStore?.t('originalMessage.errorFailedToFetch'));
      }
      this.rawText = await res.text();

      // If the fetched text is exactly MAX_DISPLAY_SIZE, it was likely truncated by the backend
      if (this.rawText.length >= this.MAX_DISPLAY_SIZE) {
        this.isTruncated = true;
      }

      this.parsedHeaders = await parseEmailHeaders(this.rawText);
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }

  private copyToClipboard() {
    navigator.clipboard.writeText(this.rawText).then(() => {
      alert(this.isTruncated ? (this.i18nStore?.t('originalMessage.copiedTruncated')) : (this.i18nStore?.t('originalMessage.copied')));
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert(this.i18nStore?.t('originalMessage.copyFailed'));
    });
  }

  private renderAuthStatus(status: string, detail?: string) {
    status = status.toLowerCase();
    let statusSpan = html`<span class="auth-none">${this.i18nStore?.t('originalMessage.none')}</span>`;

    if (status === 'pass') statusSpan = html`<span class="auth-pass">${this.i18nStore?.t('originalMessage.pass')}</span>`;
    else if (status === 'fail') statusSpan = html`<span class="auth-fail">${this.i18nStore?.t('originalMessage.fail')}</span>`;

    return html`
      <div class="auth-status-container">
        ${statusSpan}
        ${detail ? html`<span class="auth-status-detail">${detail}</span>` : ''}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-state">
          <alps-loader></alps-loader>
          <span>${this.i18nStore?.t('originalMessage.loading')}</span>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="container">
          <alps-banner>
            ${this.error}
          </alps-banner>
        </div>
      `;
    }

    const downloadUrl = `/mailboxes/${encodeURIComponent(this.mailbox)}/messages/${this.uid}/raw`;

    return html`
      <div class="container">
        <h1>${this.i18nStore?.t('originalMessage.title')}</h1>
        
        ${this.parsedHeaders ? html`
          <table class="metadata-table">
            <tbody>
              <tr>
                <th>${this.i18nStore?.t('originalMessage.messageId')}</th>
                <td>${this.parsedHeaders.messageId}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t('originalMessage.createdAt')}</th>
                <td>${this.parsedHeaders.date}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t('originalMessage.from')}</th>
                <td>${this.parsedHeaders.from}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t('originalMessage.to')}</th>
                <td>${this.parsedHeaders.to}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t('originalMessage.subject')}</th>
                <td>${this.parsedHeaders.subject}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t('originalMessage.spf')}</th>
                <td>${this.renderAuthStatus(this.parsedHeaders.spf, this.parsedHeaders.spfDetail)}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t('originalMessage.dkim')}</th>
                <td>${this.renderAuthStatus(this.parsedHeaders.dkim, this.parsedHeaders.dkimDetail)}</td>
              </tr>
              <tr>
                <th>${this.i18nStore?.t('originalMessage.dmarc')}</th>
                <td>${this.renderAuthStatus(this.parsedHeaders.dmarc, this.parsedHeaders.dmarcDetail)}</td>
              </tr>
            </tbody>
          </table>
        ` : ''}

        ${this.isTruncated ? html`
          <alps-banner>
            ${this.i18nStore?.t('originalMessage.truncatedInfo')}
          </alps-banner>
        ` : ''}

        <div class="actions">
          <alps-button variant="primary" icon="downloadSimple" @click=${() => {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'original_message.eml';
        a.click();
      }}>
            ${this.i18nStore?.t('originalMessage.downloadOriginal')}
          </alps-button>
          ${!this.isTruncated ? html`
            <alps-button variant="normal" icon="copy" @click=${this.copyToClipboard}>
              ${this.i18nStore?.t('originalMessage.copyClipboard')}
            </alps-button>
          ` : ''}
        </div>

        <pre class="raw-content">${this.rawText}</pre>
      </div>
    `;
  }
}
