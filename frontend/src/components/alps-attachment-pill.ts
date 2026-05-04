import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { renderIcon, formatSize } from '../utils/ui';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';

@customElement('alps-attachment-pill')
export class AttachmentPill extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;
  @property({ type: Object }) attachment: any = null;
  @property({ type: String }) downloadUrl = '';
  @property({ type: String }) fallbackName = 'Unknown attachment';

  @property({ type: Boolean }) removable = false;
  @property({ type: Boolean, reflect: true }) compact = false;

  static styles = css`
    .attachment-chip {
      display: inline-flex;
      align-items: center;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      gap: 8px;
      padding: 6px 10px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-primary);
      color: var(--text-color);
      text-decoration: none;
      font-size: 13px;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .progress-bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: var(--bg-selected);
      opacity: 0.3;
      transition: width 0.1s linear;
      pointer-events: none;
      z-index: 0;
    }

    .attachment-icon, .attachment-name, .attachment-size, .remove-btn {
      position: relative;
      z-index: 1;
    }

    :host([compact]) .attachment-chip {
      padding: 2px 4px;
      border-radius: 4px;
      gap: 6px;
    }

    .attachment-icon {
      color: var(--text-muted);
      flex-shrink: 0;
      display: flex;
    }

    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    :host([compact]) .icon {
      width: 16px;
      height: 16px;
    }

    .attachment-name {
      font-weight: 500;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :host([compact]) .attachment-name {
      flex: 1 auto;
      font-size: 12px;
    }

    .attachment-size {
      font-size: 12px;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    :host([compact]) .attachment-size {
      font-size: 11px;
    }

    .remove-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
      border-radius: 4px;
      margin-right: -4px;
    }

    .remove-btn:hover {
      color: var(--text-color);
    }

    .remove-btn .icon {
      width: 14px;
      height: 14px;
    }
  `;

  private _handleRemove(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('remove-attachment', {
      bubbles: true,
      composed: true,
      detail: { attachment: this.attachment }
    }));
  }

  render() {
    if (!this.attachment) return html``;
    const name = this.attachment.Filename || this.attachment.filename || this.attachment.name || this.fallbackName;
    const size = this.attachment.Size || this.attachment.size || 0;
    const uploading = this.attachment.uploading;
    const progress = this.attachment.progress || 0;

    const content = html`
      ${uploading ? html`<div class="progress-bar" style="width: ${progress}%"></div>` : ''}
      <div class="attachment-icon">${renderIcon('paperclipHorizontal')}</div>
      <span class="attachment-name">${name}</span>
      <span class="attachment-size">${uploading ? `${progress}% of ${formatSize(size)}` : formatSize(size)}</span>
      ${this.removable ? html`
        <button class="remove-btn" @click=${this._handleRemove} title="${this.i18nStore?.t('attachment.remove')}">
          ${renderIcon('x')}
        </button>
      ` : ''}
    `;

    if (this.downloadUrl) {
      return html`
        <a href="${this.downloadUrl}" download="${name}" class="attachment-chip" title="${name}">
          ${content}
        </a>
      `;
    } else {
      return html`
        <div class="attachment-chip" title="${name}">
          ${content}
        </div>
      `;
    }
  }
}
