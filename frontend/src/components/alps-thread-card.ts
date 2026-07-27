import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { consume } from '@lit/context';
import { settingsContext, SettingsStore } from '../store/settings-store';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { composeContext, ComposeStore } from '../store/compose-store';
import { FLAG_SEEN, FLAG_FLAGGED, FLAG_DRAFT } from '../utils/flags';
import { renderIcon, formatFullDate, getBimiAvatarUrl } from '../utils/ui';
import { extractSnippet, setupIframeSizing } from '../utils/reader-utils';

import './alps-recipient-pill';
import './alps-attachment-list';
import './alps-icon-btn';
import './alps-button';
import './alps-avatar';
import './alps-popup';
import './alps-banner';
import './alps-loader';

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

@customElement('alps-thread-card')
export class AlpsThreadCard extends LitElement {
  @consume({ context: settingsContext })
  settingsStore!: SettingsStore;

  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @consume({ context: composeContext })
  composeStore!: ComposeStore;

  @property({ type: Object }) item!: ThreadMessageItem;
  @property({ type: String }) mailbox!: string;

  static styles = css`
    :host {
      display: block;
      scroll-margin-top: 32px;
    }

    .thread-card {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-primary, #fff);
      overflow: hidden;
      transition: box-shadow 0.2s ease;
    }

    .thread-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .thread-card.expanded {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .thread-card-header {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      background: var(--bg-primary, #fff);
      transition: background-color 0.2s ease;
    }

    .thread-card-header:hover {
      background: var(--bg-secondary, #fafafa);
    }

    .thread-card.expanded .thread-card-header {
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-primary, #fff);
    }

    .thread-card-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .thread-card-sender {
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
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
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 1px var(--bg-primary, #ffffff);
    }

    .bimi-badge.bimi-failed-badge {
      color: var(--error, #ef4444);
    }

    .bimi-badge svg {
      width: 12px;
      height: 12px;
      fill: currentColor;
    }

    .thread-card-snippet {
      font-size: 13px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .thread-card-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .thread-card-date {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .thread-card-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--bg-secondary, #e5e7eb);
      color: var(--text-color, #374151);
      font-weight: 500;
      border: 1px solid var(--border-color);
    }

    .thread-card-body {
      padding: 0;
    }

    .thread-card .reader-meta {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-primary, #fff);
    }

    .thread-card alps-attachment-list {
      width: auto !important;
      display: block;
      margin: 0;
    }

    .thread-card alps-banner {
      width: auto !important;
      display: block;
    }

    .thread-card.unread {
      border-color: rgba(234, 179, 8, 0.4) !important;
      background: var(--bg-unread, rgba(234, 179, 8, 0.08));
    }

    .thread-card.unread .thread-card-header {
      background: var(--bg-unread, rgba(234, 179, 8, 0.08)) !important;
    }

    .thread-card.unread .thread-card-header:hover {
      background: var(--bg-unread-hover, rgba(234, 179, 8, 0.12)) !important;
    }

    .thread-card-sender.unread {
      font-weight: 700;
    }

    .reader-recipients-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .reader-recipients {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .reader-recipients-label {
      color: var(--text-muted);
      width: 48px;
      flex-shrink: 0;
    }

    .reader-recipients-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .undisclosed-recipients {
      color: var(--text-muted);
      font-style: italic;
    }

    .message-content {
      position: relative;
    }

    .reader-content-wrapper {
      position: relative;
    }

    .reader-iframe {
      width: 100%;
      border: none;
      display: block;
      transition: height 0.1s ease;
      background: transparent;
    }

    .reader-empty-body {
      padding: 32px;
      text-align: center;
      color: var(--text-muted);
      font-style: italic;
      border: 1px dashed var(--border-color);
      border-radius: 8px;
    }

    .reader-text-wrapper {
      border: none;
      border-radius: 0;
      padding: 16px;
      background: transparent;
      overflow-x: auto;
    }

    .reader-preformatted {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-primary);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 8px 16px;
      border: none;
      background: transparent;
      font-size: 14px;
      text-align: left;
      cursor: pointer;
      color: var(--text-primary);
      transition: background-color 0.15s ease;
      box-sizing: border-box;
      gap: 12px;
    }

    .dropdown-item:hover {
      background-color: var(--bg-secondary);
    }

    .dropdown-item .icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: var(--text-muted);
    }

    .dropdown-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 4px 0;
    }

    .mobile-only {
      display: none;
    }

    @media (max-width: 768px) {
      .thread-card.expanded .thread-card-date {
        display: none;
      }
      .mobile-only {
        display: flex;
      }
    }
  `;

  private onIframeLoad(e: Event) {
    const iframe = e.target as HTMLIFrameElement;
    const themeIframeContent = this.settingsStore?.getState()?.themeIframeContent ?? false;
    setupIframeSizing(iframe, themeIframeContent);
  }

  private handleCardHeaderClick() {
    this.dispatchEvent(new CustomEvent('toggle-expansion', {
      detail: { item: this.item },
      bubbles: true,
      composed: true
    }));
  }

  private _closePopup() {
    const popups = this.shadowRoot?.querySelectorAll('alps-popup');
    if (popups) {
      popups.forEach(p => (p as any).close());
    }
  }

  private handleStarClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('toggle-star', {
      detail: { item: this.item },
      bubbles: true,
      composed: true
    }));
  }

  private handleActionForItem(action: string) {
    this._closePopup();
    this.dispatchEvent(new CustomEvent('action-for-item', {
      detail: { action, item: this.item },
      bubbles: true,
      composed: true
    }));
  }

  private handleDeleteItem() {
    this._closePopup();
    this.dispatchEvent(new CustomEvent('delete-item', {
      detail: { item: this.item },
      bubbles: true,
      composed: true
    }));
  }

  private handleLoadRemoteResources() {
    this.dispatchEvent(new CustomEvent('load-remote-resources', {
      detail: { item: this.item },
      bubbles: true,
      composed: true
    }));
  }

  private handleEditDraftClick() {
    this.dispatchEvent(new CustomEvent('edit-draft-for-item', {
      detail: { item: this.item },
      bubbles: true,
      composed: true
    }));
  }

  private renderItemContent() {
    if (this.item.loading) {
      return html`
        <div style="padding: 16px; display: flex; justify-content: center; align-items: center;">
          <alps-loader></alps-loader>
        </div>
      `;
    }

    const msg = this.item.message || {};
    const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
    const hourFormat = String(this.settingsStore?.getState()?.hourFormat || '12');
    const dateStr = msg.Envelope?.Date ? formatFullDate(msg.Envelope.Date, dateFormat, hourFormat) : '';

    return html`
      <div class="reader-meta">
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
          
          <div class="reader-recipients mobile-only" style="margin-top: 4px;">
            <span class="reader-recipients-label">${this.i18nStore?.t('messageReader.date') || 'Date:'}</span>
            <div class="reader-recipients-list">
              <span style="color: var(--text-primary);">${dateStr}</span>
            </div>
          </div>
        </div>
      </div>

      ${this.item.attachments && this.item.attachments.length > 0 ? html`
        <alps-attachment-list
          .attachments=${this.item.attachments}
          .mailbox=${this.item.mailbox}
          .messageUid=${msg.UID}
        ></alps-attachment-list>
      ` : ''}

      <div class="message-content">
        ${this.item.activeBanners && this.item.activeBanners.length > 0 ? html`
          ${this.item.activeBanners.map((banner: any) => banner)}
        ` : ''}
        ${this.item.hasRemoteResources && !this.item.allowRemoteResources ? html`
          <alps-banner style="margin-bottom: 12px;">
            <span>${this.i18nStore?.t('messageReader.remoteContentWarning')}</span>
            <alps-button slot="action" variant="normal" @click=${this.handleLoadRemoteResources}>${this.i18nStore?.t('messageReader.loadRemoteContent')}</alps-button>
          </alps-banner>
        ` : ''}
        ${msg.Flags?.includes(FLAG_DRAFT) ? html`
          <alps-banner style="margin-bottom: 12px;">
            <span>${this.i18nStore?.t('messageReader.isDraft')}</span>
            <alps-button slot="action" variant="normal" @click=${this.handleEditDraftClick}>${this.i18nStore?.t('messageReader.editDraft')}</alps-button>
          </alps-banner>
        ` : ''}
        
        <div class="reader-content-wrapper">
          ${this.item.mimeType?.toLowerCase() === 'text/html' ? html`
            <iframe 
              class="reader-iframe"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              .srcdoc=${live(this.item.content)}
              @load=${this.onIframeLoad}
            ></iframe>
          ` : this.item.mimeType?.toLowerCase().startsWith('multipart/') || !this.item.content ? html`
            <div class="reader-empty-body">
              ${this.i18nStore?.t('messageReader.noReadableText')}
            </div>
          ` : html`
            <div class="reader-text-wrapper">
              <pre class="reader-preformatted">${this.item.content}</pre>
            </div>
          `}
        </div>
      </div>
    `;
  }

  render() {
    const msg = this.item.message || {};
    const sender = msg.Envelope?.From?.[0] || {};
    const senderAddress = sender.Mailbox && sender.Host ? `${sender.Mailbox}@${sender.Host}` : '';
    const senderName = sender.Name || senderAddress || (this.i18nStore?.t('messageList.unknownSender'));

    const dateFormat = this.settingsStore?.getState()?.dateFormat || 'YYYY-MM-DD';
    const hourFormat = String(this.settingsStore?.getState()?.hourFormat || '12');
    const dateStr = msg.Envelope?.Date ? formatFullDate(msg.Envelope.Date, dateFormat, hourFormat) : '';

    const domain = sender.Host ? sender.Host.toLowerCase() : '';
    const bimiUrl = getBimiAvatarUrl(domain);

    const isStarred = msg.Flags?.includes(FLAG_FLAGGED);
    const isUnread = !msg.Flags?.includes(FLAG_SEEN);

    const fallbackSnippet = msg.Snippet || '';
    const clickToExpandText = window.innerWidth <= 768 ? '' : (this.i18nStore?.t('messageReader.clickToExpand') || 'Click to expand message content');
    const snippet = this.item.expanded ? '' : extractSnippet(this.item.content, this.item.mimeType, fallbackSnippet, clickToExpandText);

    return html`
      <div class="thread-card ${this.item.expanded ? 'expanded' : ''} ${isUnread ? 'unread' : ''}">
        <div class="thread-card-header" @click=${this.handleCardHeaderClick}>
          <div class="thread-card-summary">
            <div class="avatar-container">
              <alps-avatar .name=${senderName} .email=${senderAddress} .size=${28} .src=${bimiUrl}></alps-avatar>
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
            <div class="thread-card-sender ${isUnread ? 'unread' : ''}">${senderName}</div>
            ${!this.item.expanded ? html`<div class="thread-card-snippet">${snippet}</div>` : ''}
          </div>
          <div class="thread-card-meta">
            ${this.item.isSent ? html`<span class="thread-card-badge">${this.i18nStore?.t('folderList.sent') || 'Sent'}</span>` : ''}
            ${this.item.mailbox !== this.mailbox && !this.item.isSent ? html`<span class="thread-card-badge">${this.item.mailbox}</span>` : ''}
            <div class="thread-card-date">${dateStr}</div>
            
            <alps-icon-btn
              style="--icon-size: 16px; --btn-padding: 4px;"
              title=${this.i18nStore?.t('messageReader.star') || 'Star'}
              ?active=${isStarred}
              @click=${this.handleStarClick}
              icon=${isStarred ? 'starFourFill' : 'starFour'}
            ></alps-icon-btn>
            
            ${this.item.expanded ? html`
              <alps-icon-btn
                style="--icon-size: 16px; --btn-padding: 4px;"
                title=${this.i18nStore?.t('messageReader.reply') || 'Reply'}
                @click=${(e: Event) => { e.stopPropagation(); this.handleActionForItem('reply'); }}
                icon="arrowBendUpLeft"
              ></alps-icon-btn>
              
              <alps-popup align="right" class="card-more-menu" @click=${(e: Event) => e.stopPropagation()}>
                <alps-icon-btn
                  slot="trigger"
                  style="--icon-size: 16px; --btn-padding: 4px;"
                  title=${this.i18nStore?.t('messageReader.moreOptions')}
                  icon="dotsThreeVertical"
                ></alps-icon-btn>
                <button class="dropdown-item" @click=${() => this.handleActionForItem('reply')}>
                  ${renderIcon('arrowBendUpLeft')} <span class="item-text">${this.i18nStore?.t('messageReader.reply')}</span>
                </button>
                <button class="dropdown-item" @click=${() => this.handleActionForItem('replyAll')}>
                  ${renderIcon('arrowBendDoubleUpLeft')} <span class="item-text">${this.i18nStore?.t('messageReader.replyAll')}</span>
                </button>
                <button class="dropdown-item" @click=${() => this.handleActionForItem('forward')}>
                  ${renderIcon('arrowBendUpRight')} <span class="item-text">${this.i18nStore?.t('messageReader.forward')}</span>
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" @click=${() => this.handleActionForItem('print')}>
                  ${renderIcon('printer')} <span class="item-text">${this.i18nStore?.t('messageReader.print')}</span>
                </button>
                <button class="dropdown-item" @click=${() => this.handleDeleteItem()}>
                  ${renderIcon('trash')} <span class="item-text">${this.i18nStore?.t('messageReader.delete')}</span>
                </button>
              </alps-popup>
            ` : ''}
            
            <alps-icon-btn
              style="--icon-size: 16px; --btn-padding: 4px;"
              icon=${this.item.expanded ? 'caretUp' : 'caretDown'}
              title=${this.item.expanded ? 'Collapse' : 'Expand'}
            ></alps-icon-btn>
          </div>
        </div>
        
        ${this.item.expanded ? html`
          <div class="thread-card-body">
            ${this.renderItemContent()}
          </div>
        ` : ''}
      </div>
    `;
  }
}
