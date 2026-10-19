import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon } from '../utils/ui';
import './alps-icon-btn';

export const sidebarLayoutStyles = css`
  .app-container {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  .app-container.collapsed {
    --sidebar-width: 64px;
  }
  alps-sidebar.desktop-sidebar {
    width: var(--sidebar-width, 250px);
    flex-shrink: 0;
    transition: width 0.2s, z-index 0s 0.2s;
    position: relative;
    z-index: 20;
  }
  alps-sidebar.desktop-sidebar[collapsed][peeking] {
    transition: width 0.2s, z-index 0s 0s;
  }
  .app-container.dragging alps-sidebar.desktop-sidebar {
    transition: none;
  }
  .sidebar-wrapper {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: transparent;
  }
  .sidebar-wrapper.collapsed .sidebar-content {
    opacity: 0.5;
    overflow-y: hidden;
    pointer-events: none;
  }
  .sidebar-header {
    padding: 0 12px;
    gap: 8px;
    background-color: transparent;
    z-index: 10;
  }
  .sidebar-wrapper.collapsed .sidebar-header,
  :host([collapsed]) .sidebar-header {
    padding: 0 14px !important;
    justify-content: flex-start;
  }
  .sidebar-scroll-content {
    width: calc(max(100%, 215px));
    margin-left: calc(min(0px, (100% - 215px) * 50 / 167));
  }
`;

/** How long the pointer rests on the collapsed strip before the overlay opens.
 *  Passing along the window's left edge on the way elsewhere opens nothing. */
export const PEEK_OPEN_DELAY_MS = 300;
/** How long after the pointer leaves the overlay closes. Coming back within it
 *  keeps the overlay open. */
export const PEEK_CLOSE_DELAY_MS = 300;

/** Shuts the sidebar's hover overlay from the page that renders it, after a
 *  choice made in the overlay, so it does not stay open over what was chosen. */
export function closeSidebarPeek(root: ParentNode | null | undefined): void {
  root?.querySelector<AlpsSidebar>('alps-sidebar')?.closePeek();
}

/**
 * The sidebar: a docked column, or, collapsed, a narrow strip that opens as an
 * overlay ("peeks") while the pointer rests on it.
 *
 * The peek is decided here and nowhere else. Each page used to keep its own
 * copy of the hover handling, and the copies had drifted: some opened the
 * overlay the instant the pointer crossed the strip, some waited; some closed
 * it after a choice, some never did. Clicking the footer's collapse button left
 * the pointer inside a sidebar that the copies still counted as hovered, so it
 * collapsed straight into its full-width overlay. Now only a fresh pointer
 * entry, held for PEEK_OPEN_DELAY_MS, opens the overlay; collapsing never does.
 * Pages pass `collapsed` in, listen for `peek-change` (`detail.peeking`) to
 * render their content expanded or as the strip, and call closePeek() when a
 * choice made in the overlay should shut it.
 */
@customElement('alps-sidebar')
export class AlpsSidebar extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: Boolean }) isMobile = false;
  @property({ type: Boolean }) isOpen = false;
  @property({ type: Boolean, reflect: true }) collapsed = false;
  /** Whether the collapsed sidebar is open as its hover overlay. The sidebar
   *  owns this: read it, or listen for `peek-change`, but do not set it. */
  @property({ type: Boolean, reflect: true }) peeking = false;
  @property({ type: Number }) width = 250;
  @property({ type: Boolean }) hideFooterDivider = false;

  @property({ type: Boolean }) showMobileBack = false;

  @state() private isDragging = false;

  static styles = css`
    :host {
      display: block;
      position: relative;
      height: 100%;
      z-index: 10;
      transition: z-index 0s 0.2s;
    }

    :host([collapsed][peeking]) {
      z-index: 30 !important;
      transition: z-index 0s 0s;
    }

    .sidebar {
      background-color: var(--bg-secondary, #f3f4f6);
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      position: relative;
      z-index: 10;
      box-sizing: border-box;
      border-right: 1px solid var(--border-color, #e5e7eb);
      box-shadow: rgba(95, 95, 95, 0) 4px 0 4px -2px;
      transition: width 0.2s, box-shadow 0.2s, z-index 0s 0.2s;
    }

    .sidebar.dragging {
      transition: none !important;
    }

    :host(:not([collapsed])) .sidebar {
      width: var(--sidebar-width-expanded, 250px);
    }

    :host([collapsed]:not([peeking])) .sidebar {
      border-right: none;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      box-shadow: rgba(95, 95, 95, 0) 4px 0 4px -2px;
    }

    :host([collapsed][peeking]) .sidebar {
      width: var(--sidebar-width-expanded, 250px);
      box-shadow: rgba(95, 95, 95, 0.1) 4px 0 4px -2px;
      z-index: 30;
      transition: width 0.2s, box-shadow 0.2s, z-index 0s 0s;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
    }

    .sidebar-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    /* Mobile overrides */
    :host(.mobile-sidebar) {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 100;
    }
    
    :host(.mobile-sidebar) .sidebar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 280px;
      z-index: 100;
      pointer-events: auto;
      transform: translateX(-100%);
      transition: transform 0.25s cubic-bezier(0, 0, 0.2, 1);
      box-shadow: rgba(95, 95, 95, 0.1) 4px 0 4px -2px;
    }

    :host(.mobile-sidebar.open) .sidebar {
      transform: translateX(0);
    }

    .mobile-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: transparent;
      z-index: 99;
      pointer-events: none;
    }

    :host(.mobile-sidebar.open) .mobile-backdrop {
      pointer-events: auto;
    }

    .sidebar-resizer {
      position: absolute;
      top: 0;
      right: -3px;
      bottom: 0;
      width: 6px;
      cursor: col-resize;
      z-index: 50;
    }
    .sidebar-resizer::after {
      content: '';
      position: absolute;
      background: transparent;
      transition: background 0.2s;
      width: 3px;
      top: 0;
      bottom: 0;
      left: 1px;
    }
    .sidebar-resizer:hover::after, .sidebar-resizer.dragging::after {
      background: var(--accent-color, #005A9E);
    }

    /* Do not show resizer on mobile or when collapsed */
    :host([collapsed]) .sidebar-resizer,
    :host(.mobile-sidebar) .sidebar-resizer {
      display: none;
    }

    .sidebar-footer {
      padding: 0 16px;
      height: 57px;
      box-sizing: border-box;
      flex-shrink: 0;
      border-top: 1px solid var(--border-color, #e5e7eb);
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      background: var(--bg-secondary, #f9fafb);
    }
    .footer-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color, #e5e7eb);
      margin: 0 4px;
      flex-shrink: 0;
    }

    :host([collapsed]:not([peeking])) .footer-divider,
    :host([collapsed]:not([peeking])) ::slotted([slot="footer-actions"]) {
      display: none;
    }

    .mobile-return-btn {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border-radius: 6px;
      font-family: inherit;
    }
    .mobile-return-btn:hover {
      background: var(--hover-color, #e5e7eb);
    }
    .mobile-return-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
  `;

  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  /** Ends the resize drag in progress, if any; null when there is none. */
  private stopResize: (() => void) | null = null;

  constructor() {
    super();
    this.addEventListener('mouseenter', this.onPointerEnter);
    this.addEventListener('mouseleave', this.onPointerLeave);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearPeekTimers();
    // A sidebar that leaves the page in the middle of a drag (a sign-out, a
    // route change) would otherwise keep its window listeners, resizing a
    // detached sidebar, until the next mouseup.
    this.stopResize?.();
  }

  /** Shuts the overlay, because a choice was made in it, and keeps it shut
   *  until the pointer leaves and enters again. */
  closePeek() {
    this.clearPeekTimers();
    this.peeking = false;
  }

  protected willUpdate(changed: PropertyValues<this>) {
    // Collapsing or expanding is never a peek, wherever the pointer is: the
    // overlay takes a fresh entry.
    if (changed.has('collapsed') || changed.has('isMobile')) {
      this.clearPeekTimers();
      this.peeking = false;
    }
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has('peeking') && changed.get('peeking') !== undefined) {
      this.dispatchEvent(new CustomEvent('peek-change', { detail: { peeking: this.peeking } }));
    }
  }

  private onPointerEnter = () => {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    if (this.peeking || !this.collapsed || this.isMobile || this.isDragging) return;
    this.openTimer ??= setTimeout(() => {
      this.openTimer = null;
      this.peeking = true;
    }, PEEK_OPEN_DELAY_MS);
  };

  private onPointerLeave = () => {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    if (!this.peeking) return;
    this.closeTimer ??= setTimeout(() => {
      this.closeTimer = null;
      this.peeking = false;
    }, PEEK_CLOSE_DELAY_MS);
  };

  private clearPeekTimers() {
    if (this.openTimer !== null) clearTimeout(this.openTimer);
    if (this.closeTimer !== null) clearTimeout(this.closeTimer);
    this.openTimer = null;
    this.closeTimer = null;
  }

  private startResize(e: MouseEvent) {
    if (this.isMobile || this.collapsed) return;
    e.preventDefault();
    this.stopResize?.();
    this.isDragging = true;
    this.dispatchEvent(new CustomEvent('drag-start'));

    const startX = e.clientX;
    const startWidth = this.width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      let newWidth = startWidth + delta;

      this.dispatchEvent(new CustomEvent('sidebar-resize', {
        detail: { newWidth, clientX: moveEvent.clientX }
      }));
    };

    const onMouseUp = () => {
      this.stopResize = null;
      this.isDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      // Sent when a disconnect ends the drag too: the page keeps its own
      // dragging flag, and a cached page would come back with it still set.
      this.dispatchEvent(new CustomEvent('drag-end'));
    };

    this.stopResize = onMouseUp;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  render() {
    return html`
      <div class="mobile-backdrop" @click=${() => this.dispatchEvent(new CustomEvent('close-sidebar'))}></div>
      <aside class="sidebar ${this.isDragging ? 'dragging' : ''}" part="sidebar" style="--sidebar-width-expanded: ${this.width}px">
        <div class="sidebar-content">
          <slot></slot>
        </div>
        <div class="sidebar-footer">
          ${this.isMobile && this.showMobileBack ? html`
            <button class="mobile-return-btn" @click=${() => window.location.hash = ''}>
              ${renderIcon('arrowLeft')} <span class="return-text">${this.i18nStore?.t('messageReader.back') || 'Back'}</span>
            </button>
          ` : (!this.isMobile ? html`
            <alps-icon-btn 
              class="collapse-btn"
              icon="sidebar"
              title=${this.collapsed ? this.i18nStore?.t('folderList.expandSidebar') : this.i18nStore?.t('folderList.collapseSidebar')}
              @click=${() => this.dispatchEvent(new CustomEvent('toggle-collapse'))}
              style="--btn-padding: 8px; --icon-size: 20px;"
            ></alps-icon-btn>
          ` : '')}
          ${(!this.hideFooterDivider && (!this.isMobile || this.showMobileBack)) ? html`<div class="footer-divider"></div>` : ''}
          <div style="display: flex; flex: 1; justify-content: flex-start;">
            <slot name="footer-actions"></slot>
          </div>
        </div>
      </aside>
      <div class="sidebar-resizer ${this.isDragging ? 'dragging' : ''}" @mousedown=${this.startResize}></div>
    `;
  }
}
