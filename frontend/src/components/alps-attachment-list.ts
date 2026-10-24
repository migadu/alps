import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { formatSize, renderIcon } from '../utils/ui';
import { FOLDER_INBOX } from '../utils/folders';
import { attachmentPartUrl } from '../utils/attachment-url';
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
  /** The composer's attachment total and its budget, shown as "total / budget".
   * A received message's list totals its own parts instead. */
  @property({ type: Number }) totalBytes = 0;
  @property({ type: Number }) maxBytes = 0;

  @state() private attachmentsExpanded = true;

  private trayObserver: ResizeObserver | null = null;
  private observedWrapper: Element | null = null;
  private reportedHeight = -1;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._reportTrayHeight);
    this.updateComplete.then(() => {
      if (!this.isConnected) return;
      this.i18nStore?.addEventListener('change', this._handleStoreChange);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._reportTrayHeight);
    this.i18nStore?.removeEventListener('change', this._handleStoreChange);
    this.trayObserver?.disconnect();
    this.trayObserver = null;
    this.observedWrapper = null;
  }

  protected updated() {
    if (!this.composerMode) return;
    // The wrapper is made again when the list empties and fills again.
    const wrapper = this.shadowRoot?.querySelector('.attachments-wrapper') ?? null;
    if (wrapper !== this.observedWrapper && typeof ResizeObserver !== 'undefined') {
      this.trayObserver ??= new ResizeObserver(() => this._reportTrayHeight());
      if (this.observedWrapper) this.trayObserver.unobserve(this.observedWrapper);
      if (wrapper) this.trayObserver.observe(wrapper);
      this.observedWrapper = wrapper;
    }
    this._reportTrayHeight();
  }

  /**
   * Tells the composer how tall the tray WANTS to be, its content up to its
   * own cap, as `tray-height`, so the window can grow by that much instead of
   * taking the room from the message body.
   *
   * The natural height, not the drawn one: where the window cannot grow far
   * enough the tray is squeezed and scrolls, and reporting the squeezed height
   * would shrink the window, which would squeeze the tray again. The header and
   * the pills never shrink in composer mode, so `scrollHeight` is the content
   * whatever the container's own height. Observed on the wrapper, whose height
   * follows the pills, the window's width and the collapse animation.
   */
  private _reportTrayHeight = () => {
    if (!this.composerMode) return;
    const container = this.shadowRoot?.querySelector<HTMLElement>('.attachments-container');
    let height = 0;
    if (container) {
      const cs = getComputedStyle(container);
      const borders = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
      const padding = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      const natural = container.scrollHeight + borders;
      const max = parseFloat(cs.maxHeight);
      height = Number.isFinite(max)
        ? Math.min(natural, max + (cs.boxSizing === 'border-box' ? 0 : padding + borders))
        : natural;
    }
    height = Math.ceil(height);
    if (height === this.reportedHeight) return;
    this.reportedHeight = height;
    this.dispatchEvent(new CustomEvent('tray-height', { detail: { height } }));
  };

  /** The header's size figure: the composer's total against its budget, or a
   * received message's parts added up. Empty where there is nothing to say. */
  private _sizeFigure(): string {
    const size = (bytes: number) => formatSize(bytes, this.i18nStore);
    if (this.composerMode) {
      return this.maxBytes > 0 ? `${size(this.totalBytes)} / ${size(this.maxBytes)}` : '';
    }
    const total = this.attachments.reduce((sum, att) => sum + (att.Size || att.size || 0), 0);
    return total > 0 ? size(total) : '';
  }

  private _handleStoreChange = () => {
    this.requestUpdate();
  };

  /** The mailbox the message is in, read from the URL when none was passed. */
  private get resolvedMailbox(): string {
    if (this.mailbox) return this.mailbox;
    const hashMatch = window.location.hash.match(/^#\/mailbox\/([^/]+)/);
    return hashMatch ? decodeURIComponent(hashMatch[1]) : FOLDER_INBOX;
  }

  /**
   * Asks the app to open the preview. It is mounted by app-root rather than
   * here, so the overlay is not clipped by the reader pane it would sit in.
   */
  private _openPreview(index: number) {
    window.dispatchEvent(new CustomEvent('open-attachment-preview', {
      detail: { attachments: this.attachments, mailbox: this.resolvedMailbox, messageUid: this.messageUid, index },
    }));
  }

  private toggleAttachments() {
    this.attachmentsExpanded = !this.attachmentsExpanded;
  }

  private _downloadAll(e: Event) {
    e.stopPropagation();
    if (!this.attachments || this.attachments.length === 0 || !this.messageUid) return;

    const mbox = this.resolvedMailbox;
    this.attachments.forEach((att, index) => {
      const downloadUrl = attachmentPartUrl(mbox, this.messageUid, att);
      if (!downloadUrl) return;

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
      gap: 8px;
    }

    /* The composer's tray stops at four rows of pills and half of a fifth, so
       one that scrolls shows it does. Uncapped, it took the message body's
       room row by row, down to nothing. */
    :host([composermode]) .attachments-container {
      border-bottom: none;
      border-top: 1px solid var(--border-color);
      padding: 8px 16px;
      max-height: min(30vh, 186px);
    }

    :host([composermode]) .attachments-list {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 8px;
    }

    :host([composermode]) .attachments-header {
      font-size: 11px;
    }

    /* In the composer the tray gives way before the message body does: where
       the window cannot grow by the tray's height, the host shrinks and the
       container scrolls, rather than squeezing the body out of sight. */
    :host([composermode]) {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    :host([composermode]) .attachments-container {
      min-height: 0;
      flex-shrink: 1;
    }

    :host([composermode]) .attachments-header,
    :host([composermode]) .attachments-wrapper {
      flex-shrink: 0;
    }

    /* The header stays put while the pills scroll under it, so the size figure
       and the caret stay in reach. The pills lift their contents with z-index,
       which would paint them over the header as they pass under it. */
    :host([composermode]) .attachments-wrapper {
      isolation: isolate;
    }

    :host([composermode]) .attachments-header {
      position: sticky;
      top: -8px;
      z-index: 1;
      margin: -8px 0 0;
      padding: 8px 0 0;
      background: var(--bg-secondary);
    }

    .attachments-size {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .attachments-size.over {
      color: var(--error, #ef4444);
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
    const figure = this._sizeFigure();

    return html`
      <div class="attachments-container ${this.attachmentsExpanded ? 'is-expanded' : 'is-closed'}">
        <div class="attachments-header" @click=${this.toggleAttachments}>
          <div class="attachments-title">
            <span>${this.i18nStore?.t('messageReader.attachments')} (${this.attachments.length})</span>
          </div>
          <div class="attachments-actions">
            ${figure ? html`
              <span class="attachments-size ${this.composerMode && this.totalBytes > this.maxBytes ? 'over' : ''}"
                >${figure}</span>
            ` : ''}
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
            ${this.attachments.map((att, index) => {
      const downloadUrl = this.messageUid ? attachmentPartUrl(this.resolvedMailbox, this.messageUid, att) : '';

      return html`
                <alps-attachment-pill
                  .attachment=${att}
                  .downloadUrl=${downloadUrl}
                  .fallbackName=${this.i18nStore?.t('messageReader.unknownAttachment')}
                  .removable=${this.removable}
                  .compact=${this.composerMode}
                  @preview-attachment=${(e: CustomEvent) => {
        e.stopPropagation();
        this._openPreview(index);
      }}
                ></alps-attachment-pill>
              `;
    })}
          </div>
        </div>
      </div>
    `;
  }
}
