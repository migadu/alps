import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon, formatSize } from '../utils/ui';
import { fetchWithTimeout } from '../utils/fetch-utils';
import { attachmentPartUrl } from '../utils/attachment-url';
import { getAttachmentTypeInfo, type AttachmentTypeInfo } from '../utils/attachment-type';

/** Text past this size is offered as a download instead of being fetched whole
 * and drawn line by line. */
export const MAX_TEXT_PREVIEW_BYTES = 2 * 1024 * 1024;

/** The focused element, looking inside shadow roots. */
function deepActiveElement(): Element | null {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

/**
 * A full-window preview of a message's attachments: images with zoom and
 * rotation, PDFs in the browser's viewer, text and code as numbered lines,
 * audio and video in players, and a download card for everything else. The
 * arrows step through the message's attachments.
 *
 * Mounted by app-root, which opens it for the `open-attachment-preview` window
 * event an attachment list dispatches.
 */
@customElement('alps-attachment-preview')
export class AttachmentPreview extends LitElement {
  @consume({ context: i18nContext, subscribe: true })
  i18nStore!: I18nStore;

  @property({ type: Array }) attachments: any[] = [];
  @property({ type: String }) mailbox = '';
  @property({ type: String }) messageUid = '';
  @property({ type: Number }) activeIndex = 0;

  @state() private zoom = 1;
  @state() private rotation = 0;
  @state() private loadedText: string | null = null;
  @state() private textLoading = false;
  @state() private textError: string | null = null;
  @state() private copied = false;
  @state() private pdfUrl: string | null = null;
  @state() private pdfLoading = false;
  @state() private pdfError: string | null = null;

  /** Bumped per load, so a slow answer cannot land on the attachment the user moved to. */
  private loadToken = 0;
  private previouslyFocused: Element | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.previouslyFocused = deepActiveElement();
    // Capture on window, so the keys the preview uses are taken before a
    // handler in the page underneath acts on them too.
    window.addEventListener('keydown', this.handleKeyDown, true);
  }

  firstUpdated(): void {
    this.shadowRoot?.querySelector<HTMLButtonElement>('.close-btn')?.focus();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.handleKeyDown, true);
    this.replacePdfUrl(null);
    const target = this.previouslyFocused as HTMLElement | null;
    this.previouslyFocused = null;
    if (target?.isConnected) target.focus?.();
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('activeIndex') || changed.has('attachments')) {
      this.zoom = 1;
      this.rotation = 0;
      this.copied = false;
      this.loadContent();
    }
  }

  private get current(): any {
    if (!this.attachments || this.attachments.length === 0) return null;
    const idx = Math.max(0, Math.min(this.activeIndex, this.attachments.length - 1));
    return this.attachments[idx];
  }

  private nameOf(att: any): string {
    return att?.Filename || att?.filename || att?.name || this.i18nStore?.t('messageReader.unknownAttachment') || '';
  }

  private sizeOf(att: any): number {
    return att?.Size || att?.size || 0;
  }

  private infoOf(att: any): AttachmentTypeInfo {
    return getAttachmentTypeInfo(att?.MIMEType || att?.contentType, this.nameOf(att));
  }

  private urlOf(att: any): string {
    return attachmentPartUrl(this.mailbox, this.messageUid, att);
  }

  private replacePdfUrl(url: string | null) {
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
    this.pdfUrl = url;
  }

  private async loadContent() {
    const att = this.current;
    if (!att) return;
    const token = ++this.loadToken;
    this.replacePdfUrl(null);
    this.pdfLoading = false;
    this.pdfError = null;
    this.textLoading = false;
    this.textError = null;
    this.loadedText = null;

    const info = this.infoOf(att);
    const url = this.urlOf(att);
    if (!url) return;

    if (info.previewKind === 'text') {
      if (this.sizeOf(att) > MAX_TEXT_PREVIEW_BYTES) return;
      this.textLoading = true;
      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) throw new Error(String(response.status));
        const text = await response.text();
        if (token !== this.loadToken) return;
        this.loadedText = text;
      } catch (err: any) {
        if (token !== this.loadToken) return;
        this.textError = err?.message || 'error';
      } finally {
        if (token === this.loadToken) this.textLoading = false;
      }
      return;
    }

    if (info.previewKind === 'pdf') {
      // The part is served as a download, which a frame pointed at its URL
      // would save instead of showing. The bytes are fetched here and framed
      // from a blob: URL, which carries no such header.
      this.pdfLoading = true;
      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) throw new Error(String(response.status));
        let blob = await response.blob();
        if (blob.type !== 'application/pdf') blob = new Blob([blob], { type: 'application/pdf' });
        if (token !== this.loadToken) return;
        this.replacePdfUrl(URL.createObjectURL(blob));
      } catch (err: any) {
        if (token !== this.loadToken) return;
        this.pdfError = err?.message || 'error';
      } finally {
        if (token === this.loadToken) this.pdfLoading = false;
      }
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Taken even with one attachment: the arrows must not move the message
      // list underneath.
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'ArrowLeft') this.prev();
      else this.next();
    }
  };

  private close() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  private prev() {
    if (this.attachments.length <= 1) return;
    this.activeIndex = (this.activeIndex - 1 + this.attachments.length) % this.attachments.length;
  }

  private next() {
    if (this.attachments.length <= 1) return;
    this.activeIndex = (this.activeIndex + 1) % this.attachments.length;
  }

  private zoomIn() {
    this.zoom = Math.min(4, Math.round((this.zoom + 0.25) * 100) / 100);
  }

  private zoomOut() {
    this.zoom = Math.max(0.25, Math.round((this.zoom - 0.25) * 100) / 100);
  }

  private resetZoom() {
    this.zoom = 1;
    this.rotation = 0;
  }

  private rotate() {
    this.rotation = (this.rotation + 90) % 360;
  }

  private async copyContent() {
    if (!this.loadedText) return;
    try {
      await navigator.clipboard.writeText(this.loadedText);
      this.copied = true;
      setTimeout(() => { this.copied = false; }, 2000);
    } catch {
      // Clipboard refused; the text is still there to select.
    }
  }

  private download() {
    const att = this.current;
    const url = this.urlOf(att);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = this.nameOf(att) || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  private openPdfInNewTab() {
    if (this.pdfUrl) window.open(this.pdfUrl, '_blank', 'noopener,noreferrer');
  }

  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 30000;
      user-select: none;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      background: var(--modal-backdrop, rgba(255, 255, 255, 0.85));
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
      flex-shrink: 0;
      gap: 16px;
    }
    .meta-info {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }
    .type-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: var(--bg-secondary);
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .icon {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .file-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .file-title {
      font-size: 14px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .file-sub {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      gap: 8px;
    }
    .actions-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .action-btn, .close-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 32px;
      min-width: 32px;
      padding: 0 10px;
      border-radius: 6px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 12px;
      cursor: pointer;
      box-sizing: border-box;
    }
    .action-btn.icon-only, .close-btn {
      padding: 0;
      width: 32px;
    }
    .action-btn:hover, .close-btn:hover {
      background: var(--hover-color, var(--bg-secondary));
    }
    .action-btn .icon {
      width: 16px;
      height: 16px;
    }
    .preview-body {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 24px;
      box-sizing: border-box;
    }
    .image-viewport {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .preview-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.2s ease;
      border-radius: 4px;
    }
    .pdf-container, .text-container {
      width: 100%;
      height: 100%;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }
    .pdf-container {
      max-width: 1000px;
      overflow: hidden;
    }
    .pdf-frame {
      width: 100%;
      height: 100%;
      border: none;
    }
    .text-container {
      max-width: 900px;
      overflow: auto;
      padding: 16px;
      box-sizing: border-box;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-primary);
      user-select: text;
    }
    .code-line {
      display: flex;
      gap: 16px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .line-num {
      color: var(--text-muted);
      width: 36px;
      text-align: right;
      flex-shrink: 0;
      user-select: none;
    }
    .line-text {
      flex: 1;
    }
    .audio-card, .fallback-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      padding: 32px 40px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      color: var(--text-primary);
      max-width: 480px;
      width: 100%;
      box-sizing: border-box;
    }
    .card-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      color: var(--text-muted);
    }
    .card-icon .icon {
      width: 32px;
      height: 32px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      word-break: break-word;
    }
    .card-desc {
      font-size: 13px;
      color: var(--text-muted);
    }
    audio {
      width: 100%;
    }
    .video-container {
      max-width: 1000px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.9);
    }
    video {
      max-width: 100%;
      max-height: 80vh;
    }
    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2;
    }
    .nav-arrow.prev { left: 24px; }
    .nav-arrow.next { right: 24px; }
    .loading-state, .error-state {
      color: var(--text-muted);
      font-size: 14px;
    }
    .error-state {
      color: var(--error);
    }
  `;

  render() {
    const att = this.current;
    if (!att) return html``;
    const t = (key: string) => this.i18nStore?.t(key) ?? key;
    const name = this.nameOf(att);
    const size = this.sizeOf(att);
    const info = this.infoOf(att);
    const url = this.urlOf(att);
    const total = this.attachments.length;
    const closeOnSelf = (e: Event) => { if (e.target === e.currentTarget) this.close(); };

    return html`
      <div class="backdrop" @click=${closeOnSelf}>
        <div class="preview-header">
          <div class="meta-info">
            <div
              class="type-badge ${info.themeClass}"
              style="${info.color ? `color: ${info.color}; background: color-mix(in srgb, ${info.color} 12%, transparent)` : ''}"
            >${renderIcon(info.icon)}</div>
            <div class="file-details">
              <span class="file-title" title="${name}">${name}</span>
              <span class="file-sub">
                <span>${formatSize(size)}</span>
                ${total > 1 ? html`<span>•</span><span>${this.activeIndex + 1} / ${total}</span>` : ''}
              </span>
            </div>
          </div>
          <div class="actions-bar">
            ${info.isImage ? html`
              <button class="action-btn icon-only zoom-out" @click=${this.zoomOut} title="${t('attachment.zoomOut')}">${renderIcon('magnifyingGlassMinus')}</button>
              <button class="action-btn icon-only fit" @click=${this.resetZoom} title="${t('attachment.fitToScreen')}">${renderIcon('arrowsInSimple')}</button>
              <button class="action-btn icon-only zoom-in" @click=${this.zoomIn} title="${t('attachment.zoomIn')}">${renderIcon('magnifyingGlassPlus')}</button>
              <button class="action-btn icon-only rotate" @click=${this.rotate} title="${t('attachment.rotate')}">${renderIcon('arrowCounterClockwise')}</button>
            ` : ''}
            ${info.previewKind === 'text' && this.loadedText ? html`
              <button class="action-btn copy" @click=${this.copyContent} title="${t('attachment.copyContent')}">
                ${renderIcon('copy')}
                <span>${this.copied ? t('attachment.copied') : t('attachment.copyContent')}</span>
              </button>
            ` : ''}
            ${info.isPdf && this.pdfUrl ? html`
              <button class="action-btn icon-only new-tab" @click=${this.openPdfInNewTab} title="${t('attachment.openInNewTab')}">${renderIcon('arrowsOutSimple')}</button>
            ` : ''}
            ${url ? html`
              <button class="action-btn icon-only download" @click=${this.download} title="${t('attachment.download')}">${renderIcon('downloadSimple')}</button>
            ` : ''}
            <button class="close-btn" @click=${this.close} title="${t('attachment.close')}">${renderIcon('x')}</button>
          </div>
        </div>

        <div class="preview-body" @click=${closeOnSelf}>
          ${total > 1 ? html`
            <button class="nav-arrow prev" @click=${this.prev} title="${t('attachment.previous')}">${renderIcon('caretLeft')}</button>
            <button class="nav-arrow next" @click=${this.next} title="${t('attachment.next')}">${renderIcon('caretRight')}</button>
          ` : ''}
          ${this.renderContent(info, url, name, size)}
        </div>
      </div>
    `;
  }

  private renderContent(info: AttachmentTypeInfo, url: string, name: string, size: number) {
    const t = (key: string) => this.i18nStore?.t(key) ?? key;
    if (!url) return this.renderFallback(info, url, name, size);

    if (info.isImage) {
      return html`
        <div class="image-viewport" @click=${(e: Event) => { if (e.target === e.currentTarget) this.close(); }}>
          <img
            src="${url}"
            alt="${name}"
            class="preview-image"
            style="transform: scale(${this.zoom}) rotate(${this.rotation}deg);"
            @dblclick=${() => { this.zoom = this.zoom === 1 ? 2 : 1; }}
          />
        </div>
      `;
    }

    if (info.isPdf) {
      if (this.pdfLoading) return html`<div class="loading-state">${t('attachment.loadingPreview')}</div>`;
      if (this.pdfError) return html`<div class="error-state">${t('attachment.errorLoading')}</div>`;
      if (!this.pdfUrl) return this.renderFallback(info, url, name, size);
      return html`
        <div class="pdf-container">
          <iframe src="${this.pdfUrl}#toolbar=1" class="pdf-frame" title="${name}"></iframe>
        </div>
      `;
    }

    if (info.previewKind === 'text') {
      if (size > MAX_TEXT_PREVIEW_BYTES) return this.renderFallback(info, url, name, size);
      if (this.textLoading) return html`<div class="loading-state">${t('attachment.loadingPreview')}</div>`;
      if (this.textError) return html`<div class="error-state">${t('attachment.errorLoading')}</div>`;
      if (this.loadedText === null) return html``;
      // Drawn as text nodes, never as markup: an HTML or SVG attachment shows
      // its source.
      const lines = this.loadedText.split('\n');
      return html`
        <div class="text-container">
          ${lines.map((line, idx) => html`
            <div class="code-line"><span class="line-num">${idx + 1}</span><span class="line-text">${line || ' '}</span></div>
          `)}
        </div>
      `;
    }

    if (info.isAudio) {
      return html`
        <div class="audio-card">
          <div class="card-icon" style="${info.color ? `color: ${info.color}; background: color-mix(in srgb, ${info.color} 12%, transparent)` : ''}">
            ${renderIcon('fileAudio')}
          </div>
          <div class="card-title">${name}</div>
          <audio controls src="${url}"></audio>
        </div>
      `;
    }

    if (info.isVideo) {
      return html`
        <div class="video-container">
          <video controls playsinline src="${url}"></video>
        </div>
      `;
    }

    return this.renderFallback(info, url, name, size);
  }

  private renderFallback(info: AttachmentTypeInfo, url: string, name: string, size: number) {
    const t = (key: string) => this.i18nStore?.t(key) ?? key;
    return html`
      <div class="fallback-card">
        <div class="card-icon">${renderIcon(info.icon)}</div>
        <div class="card-title">${name}</div>
        <div class="card-desc">${t('attachment.cannotPreview')} (${formatSize(size)})</div>
        ${url ? html`
          <button class="action-btn download" @click=${this.download}>
            ${renderIcon('downloadSimple')}
            <span>${t('attachment.download')}</span>
          </button>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'alps-attachment-preview': AttachmentPreview;
  }
}
