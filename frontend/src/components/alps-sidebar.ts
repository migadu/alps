import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import { renderIcon } from '../utils/ui';
import './alps-icon-btn';
import { AlpsSidebarContent, sidebarStripContext } from './alps-sidebar-strip';
import { motionStyles } from '../utils/motion';
import { deepActiveElement } from '../utils/active-element';

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
  /* The content follows the strip state alps-sidebar provides
     (alps-sidebar-strip.ts): in the strip it stays exactly as it is, dimmed,
     behind the main view and inert. */
  alps-sidebar-content {
    display: block;
    transition: opacity 0.2s ease;
  }
  alps-sidebar-content[strip] {
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
  .sidebar-wrapper.collapsed .sidebar-header {
    padding: 0 14px !important;
    justify-content: flex-start;
  }
  /* Docked, the content is as wide as the sidebar, however narrow it is
     dragged: names shorten, and each row's count and menu stay in view at
     its inline end. It used to keep 215px there too, so a sidebar dragged
     narrower cut them off instead.

     In the strip the content keeps at least 215px, so that it is clipped
     rather than reflowed, and slides behind the main view: what the 64px
     strip should show is each row's ICON. Every sidebar sets --strip-slide,
     how far its content moves to bring its icons 8px inside the strip, the
     same place on every page. The default suits rows padded 8px inside 16px
     of content padding (Calendar, Tasks). Mail's rows lead with the expander
     column and slide 38px, Contacts' 14px, Settings' 20px. One slide for all
     of them put mail's icons half out of the strip and everyone else's under
     the main view.

     The slide starts only below 120px of content, narrower than any docked
     sidebar's (a drag below 120px snaps to the strip, and the narrowest
     docked sidebar, SIDEBAR_WIDTH_MIN, keeps 163px inside its border and
     padding, 148px beside a scrollbar that takes room), so a sidebar dragged
     narrow keeps every column in view, the expander carets included. On the
     way into the strip the content moves with the edge until it has slid
     --strip-slide.

     Out of the strip, expanding or opening as the overlay, the 215px stay
     while the sidebar widens (its 0.2s) and go once it has: let go at once,
     the rows reflowed through every width from the strip's up, and each
     count set off from beside its icon. Into the strip they come at once. */
  .sidebar-scroll-content {
    width: 100%;
    min-width: 0;
    margin-inline-start: max(0px - var(--strip-slide, 16px), min(0px, 100% - 120px));
    transition: min-width 0s 0.2s;
  }
  alps-sidebar-content[strip] .sidebar-scroll-content {
    min-width: 215px;
    transition: none;
  }
  /* The sidebar jumps to its width instead of widening: so does the content. */
  @media (prefers-reduced-motion: reduce) {
    .sidebar-scroll-content {
      transition-delay: 0s;
    }
  }
`;

/**
 * The narrowest docked sidebar, on every page: a drag that ends between the
 * strip's snap (120px) and this stops here. The content follows a docked
 * sidebar's width, so this decides what is left of a name beside a row's
 * icon and count. At 150px that was the first letters ("In…" for the Inbox
 * beside its count, "All Co…" and "Favori…" in Contacts), the mini
 * calendar's seven columns were 15px each, and beside a scrollbar that takes
 * room mail's content was narrower than the 120px at which the strip's
 * slide begins, so a docked sidebar slid under its own edge.
 */
export const SIDEBAR_WIDTH_MIN = 180;

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
 * overlay ("peeks") while the pointer rests on it or the keyboard is in it.
 *
 * The peek is decided here and nowhere else. Each page used to keep its own
 * copy of the hover handling, and the copies had drifted: some opened the
 * overlay the instant the pointer crossed the strip, some waited; some closed
 * it after a choice, some never did. Clicking the footer's collapse button left
 * the pointer inside a sidebar that the copies still counted as hovered, so it
 * collapsed straight into its full-width overlay. Now only a fresh pointer
 * entry, held for PEEK_OPEN_DELAY_MS, opens the overlay; collapsing never does.
 * Pages pass `collapsed` in and call closePeek() when a choice made in the
 * overlay should shut it. What the content needs to know about the strip it
 * reads from `sidebarStripContext`, so no page tracks the peek.
 *
 * The keyboard has its own entry. The strip's content is inert (see
 * alps-sidebar-strip.ts), so Tab passed from Create to the expand button and
 * on, and a folder, a contacts category, a calendar or a task list could only
 * be reached by expanding the sidebar for good. Now keyboard focus coming into
 * the collapsed sidebar opens the overlay at once, the content goes live, and
 * Tab walks its rows; the focus leaving it, or Escape, closes it. A click
 * that focuses Create or the expand button is no keyboard focus
 * (:focus-visible says which it is) and opens nothing. The rows are never
 * live in the strip itself, so a screen reader meets them once, in the
 * overlay.
 */
@customElement('alps-sidebar')
export class AlpsSidebar extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;

  @property({ type: Boolean }) isMobile = false;
  @property({ type: Boolean }) isOpen = false;
  @property({ type: Boolean, reflect: true }) collapsed = false;
  /** Whether the collapsed sidebar is open as its hover overlay. The sidebar
   *  owns this: read it (or `strip`, which is what the contents read), but do
   *  not set it. */
  @property({ type: Boolean, reflect: true }) peeking = false;

  /** Whether this is the collapsed strip right now, for everything beneath
   *  it: collapsed, not peeking, not mobile. Worked out here and nowhere
   *  else; see alps-sidebar-strip.ts for who reads it. */
  @provide({ context: sidebarStripContext })
  strip = false;
  @property({ type: Number }) width = 250;
  @property({ type: Boolean }) hideFooterDivider = false;

  @property({ type: Boolean }) showMobileBack = false;

  @state() private isDragging = false;

  static styles = [motionStyles, css`
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

    :host {
      /* The shadow falls past the sidebar's inline end, and a closed mobile
         sidebar waits beyond its inline start: both mirror in a
         right-to-left interface. */
      --sidebar-edge-offset: 4px;
      --sidebar-closed-offset: -100%;
    }

    :host(:dir(rtl)) {
      --sidebar-edge-offset: -4px;
      --sidebar-closed-offset: 100%;
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
      border-inline-end: 1px solid var(--border-color, #e5e7eb);
      box-shadow: rgba(95, 95, 95, 0) var(--sidebar-edge-offset) 0 4px -2px;
      transition: width 0.2s, box-shadow 0.2s, z-index 0s 0.2s;
    }

    .sidebar.dragging {
      transition: none !important;
    }

    :host(:not([collapsed])) .sidebar {
      width: var(--sidebar-width-expanded, 250px);
    }

    :host([collapsed]:not([peeking])) .sidebar {
      border-inline-end: none;
      width: 100%;
      position: absolute;
      top: 0;
      inset-inline-start: 0;
      bottom: 0;
      box-shadow: rgba(95, 95, 95, 0) var(--sidebar-edge-offset) 0 4px -2px;
    }

    :host([collapsed][peeking]) .sidebar {
      width: var(--sidebar-width-expanded, 250px);
      box-shadow: rgba(95, 95, 95, 0.1) var(--sidebar-edge-offset) 0 4px -2px;
      z-index: 30;
      transition: width 0.2s, box-shadow 0.2s, z-index 0s 0s;
      position: absolute;
      top: 0;
      inset-inline-start: 0;
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
      inset-inline-start: 0;
      bottom: 0;
      width: 280px;
      z-index: 100;
      pointer-events: auto;
      transform: translateX(var(--sidebar-closed-offset));
      transition: transform 0.25s cubic-bezier(0, 0, 0.2, 1);
      box-shadow: rgba(95, 95, 95, 0.1) var(--sidebar-edge-offset) 0 4px -2px;
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
      inset-inline-end: -3px;
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
      inset-inline-start: 1px;
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
  `];

  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  /** Ends the resize drag in progress, if any; null when there is none. */
  private stopResize: (() => void) | null = null;
  /** Whether the pointer is over the sidebar, the overlay included. */
  private pointerInside = false;
  /** Whether keyboard focus opened the overlay, or came into it, and is still
   *  in it. It holds the overlay open: the pointer leaving does not close it,
   *  which would make the row that has the focus inert under it. */
  private focusHeld = false;

  constructor() {
    super();
    this.addEventListener('mouseenter', this.onPointerEnter);
    this.addEventListener('mouseleave', this.onPointerLeave);
    this.addEventListener('focusin', this.onFocusIn);
    this.addEventListener('focusout', this.onFocusOut);
    this.addEventListener('keydown', this.onKeyDown);
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
   *  until the pointer leaves and enters again, or the focus does. */
  closePeek() {
    this.shutPeek(this.focusHeld);
  }

  /**
   * Shuts the overlay. With `keepFocus`, a focus on something the strip takes
   * away moves to the expand button first: left on a row, it would be on an
   * inert element, which the browser takes the focus from, and the keyboard
   * would start again from the top of the page. The expand button is where
   * Tab from the rows went next, so the next Tab goes on as it would have.
   * A pointer choice leaves the focus alone: the arrow keys reach the message
   * list from where a click left it.
   */
  private shutPeek(keepFocus: boolean) {
    this.clearPeekTimers();
    if (keepFocus && this.peeking && this.focusPlace() === 'hidden') {
      this.renderRoot.querySelector('.collapse-btn')?.shadowRoot?.querySelector('button')?.focus();
    }
    this.focusHeld = false;
    this.peeking = false;
  }

  protected willUpdate(changed: PropertyValues<this>) {
    // Collapsing or expanding is never a peek, wherever the pointer or the
    // focus is: the overlay takes a fresh entry.
    if (changed.has('collapsed') || changed.has('isMobile')) {
      this.clearPeekTimers();
      this.focusHeld = false;
      this.peeking = false;
    }
    this.strip = this.collapsed && !this.peeking && !this.isMobile;
  }

  private onPointerEnter = () => {
    this.pointerInside = true;
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
    this.pointerInside = false;
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    if (!this.peeking || this.focusHeld) return;
    this.closeTimer ??= setTimeout(() => {
      this.closeTimer = null;
      this.peeking = false;
    }, PEEK_CLOSE_DELAY_MS);
  };

  /**
   * Keyboard focus coming into the collapsed sidebar opens the overlay, with
   * no delay: Tab is a choice to go there, not a pointer passing by. Only an
   * entry opens it, from outside the sidebar; the focus moving between its
   * own controls does not, so after Escape, a choice or a collapse made from
   * the keyboard it takes a fresh entry, as the pointer's peek does.
   */
  private onFocusIn = (e: FocusEvent) => {
    if (!this.collapsed || this.isMobile) return;
    const from = e.relatedTarget;
    if (from instanceof Node && this.contains(from)) return;
    const target = e.composedPath()[0];
    if (!(target instanceof Element) || !target.matches(':focus-visible')) return;
    this.clearPeekTimers();
    this.focusHeld = true;
    this.peeking = true;
  };

  /** The focus leaving the sidebar lets go of the overlay. It closes, unless
   *  the pointer rests on it; then the pointer leaving closes it. */
  private onFocusOut = (e: FocusEvent) => {
    if (!this.focusHeld) return;
    // A related target is where the focus is going, seen from here. With
    // none, the focus went to the page itself (a menu that blurs its button
    // on closing), or the window lost it and keeps it where it was.
    const to = e.relatedTarget;
    if (to instanceof Node ? this.contains(to) : this.focusPlace() !== 'outside') return;
    this.focusHeld = false;
    if (this.pointerInside) return;
    this.clearPeekTimers();
    this.peeking = false;
  };

  /** Escape shuts the overlay, unless it was meant for a menu or a dialog
   *  opened from it, which close on their own Escape. */
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.defaultPrevented || !this.peeking) return;
    if (e.composedPath().some((node) => node instanceof HTMLDialogElement)) return;
    e.preventDefault();
    this.shutPeek(true);
  };

  /**
   * Where the focus is: outside this sidebar; on a control the strip keeps
   * (Create, the expand button); or on one it takes away, in the content,
   * which is inert in the strip, or a footer action, which it hides.
   */
  private focusPlace(): 'outside' | 'kept' | 'hidden' {
    let hidden = false;
    for (let node: Node | null = deepActiveElement(); node; node = node.parentNode ?? (node instanceof ShadowRoot ? node.host : null)) {
      if (node === this) return hidden ? 'hidden' : 'kept';
      if (node instanceof AlpsSidebarContent || (node instanceof Element && node.parentNode === this && node.slot === 'footer-actions')) {
        hidden = true;
      }
    }
    return 'outside';
  }

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
    // The handle is on the inline end: in a right-to-left interface that is
    // the left edge, and dragging it left widens the sidebar.
    const inlineDirection = getComputedStyle(this).direction === 'rtl' ? -1 : 1;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = (moveEvent.clientX - startX) * inlineDirection;
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
