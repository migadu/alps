import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon } from '../utils/ui';
import { FOLDER_INBOX, encodeMailboxPath } from '../utils/folders';
import './alps-attachment-pill';

@customElement('alps-attachment-list')
export class AttachmentList extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: Array }) attachments: any[] = [];
  @property({ type: String }) mailbox = FOLDER_INBOX;
  @property({ type: String }) messageUid = '';
  @property({ type: Boolean }) removable = false;
  @property({ type: Boolean, reflect: true }) composerMode = false;

  @state() private attachmentsExpanded = true;

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this.i18nStore?.addEventListener('change', this._handleStoreChange);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.i18nStore?.removeEventListener('change', this._handleStoreChange);
  }

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  private toggleAttachments() {
    this.attachmentsExpanded = !this.attachmentsExpanded;
  }

  private _downloadAll(e: Event) {
    e.stopPropagation();
    if (!this.attachments || this.attachments.length === 0 || !this.messageUid) return;

    let mbox = this.mailbox || FOLDER_INBOX;
    if (!this.mailbox) {
      const hashMatch = window.location.hash.match(/^#\/mailbox\/([^/]+)/);
      if (hashMatch) {
        mbox = decodeURIComponent(hashMatch[1]);
      }
    }

    this.attachments.forEach((att, index) => {
      const partPathStr = Array.isArray(att.Path) ? att.Path.join('.') : att.Path;
      const downloadUrl = `/mailboxes/${encodeMailboxPath(mbox)}/messages/${this.messageUid}/raw?part=${partPathStr}`;

      setTimeout(() => {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = att.Filename || this.i18nStore?.t('messageReader.unknownAttachment') || 'attachment';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 200); // 200ms delay between downloads
    });
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .attachments-container {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
      flex-shrink: 0;
      max-height: 30vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .attachments-header {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
    }

    .attachments-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .attachments-header:hover {
      color: var(--text-color);
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .attachments-header .icon {
      width: 16px;
      height: 16px;
      transition: transform 0.3s ease;
    }

    .attachments-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .download-all-btn {
      width: 16px;
      height: 16px;
      fill: currentColor;
      transition: transform 0.2s ease, color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .download-all-btn:hover {
      color: var(--text-color);
      transform: translateY(-1px);
    }

    .attachments-wrapper {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.3s ease-out, margin 0.3s ease-out;
      margin: 0;
    }

    .attachments-wrapper.expanded {
      grid-template-rows: 1fr;
      margin-top: 12px;
    }

    .caret {
      transition: transform 0.3s ease;
    }

    .attachments-container.is-expanded .caret {
      transform: rotate(180deg);
    }

    .attachments-container.is-closed .caret {
      transform: rotate(0deg);
    }

    :host([composermode]) .attachments-container.is-expanded .caret {
      transform: rotate(0deg);
    }

    :host([composermode]) .attachments-container.is-closed .caret {
      transform: rotate(180deg);
    }

    .attachments-list {
      min-height: 0;
      overflow: hidden;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }

    :host([composermode]) .attachments-container {
      border-bottom: none;
      border-top: 1px solid var(--border-color);
      padding: 8px 16px;
    }

    :host([composermode]) .attachments-list {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 8px;
    }

    :host([composermode]) .attachments-header {
      font-size: 11px;
    }

    @media (max-width: 768px) {
      .attachments-container {
        border-bottom: none;
        border-top: 1px solid var(--border-color);
      }

      .attachments-container.is-expanded .caret {
        transform: rotate(0deg);
      }

      .attachments-container.is-closed .caret {
        transform: rotate(180deg);
      }

      .attachments-list {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }
    }
  `;

  render() {
    if (!this.attachments || this.attachments.length === 0) return html``;

    return html`
      <div class="attachments-container ${this.attachmentsExpanded ? 'is-expanded' : 'is-closed'}">
        <div class="attachments-header" @click=${this.toggleAttachments}>
          <div class="attachments-title">
            <span>${this.i18nStore?.t('messageReader.attachments')} (${this.attachments.length})</span>
          </div>
          <div class="attachments-actions">
            ${!this.composerMode ? html`
              <div 
                class="download-all-btn" 
                title=${this.i18nStore?.t('messageReader.downloadAllAttachments')} 
                @click=${this._downloadAll}
              >
                ${renderIcon('downloadSimple')}
              </div>
            ` : ''}
            <div class="icon caret">
              ${renderIcon('caretDown')}
            </div>
          </div>
        </div>
        <div class="attachments-wrapper ${this.attachmentsExpanded ? 'expanded' : ''}">
          <div class="attachments-list">
            ${this.attachments.map(att => {
      let downloadUrl = '';
      if (this.messageUid) {
        const partPathStr = Array.isArray(att.Path) ? att.Path.join('.') : att.Path;
        let mbox = this.mailbox || FOLDER_INBOX;
        if (!this.mailbox) {
          const hashMatch = window.location.hash.match(/^#\/mailbox\/([^/]+)/);
          if (hashMatch) {
            mbox = decodeURIComponent(hashMatch[1]);
          }
        }
        downloadUrl = `/mailboxes/${encodeMailboxPath(mbox)}/messages/${this.messageUid}/raw?part=${partPathStr}`;
      }

      return html`
                <alps-attachment-pill
                  .attachment=${att}
                  .downloadUrl=${downloadUrl}
                  .fallbackName=${this.i18nStore?.t('messageReader.unknownAttachment')}
                  .removable=${this.removable}
                  .compact=${this.composerMode}
                ></alps-attachment-pill>
              `;
    })}
          </div>
        </div>
      </div>
    `;
  }
}
