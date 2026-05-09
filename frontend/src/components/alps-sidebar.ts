import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './alps-icon-btn';

@customElement('alps-sidebar')
export class AlpsSidebar extends LitElement {
  @property({ type: Boolean }) isMobile = false;
  @property({ type: Boolean }) isOpen = false;
  @property({ type: Boolean, reflect: true }) collapsed = false;
  @property({ type: Boolean, reflect: true }) suppressHover = false;
  @property({ type: Boolean, reflect: true }) isHovered = false;
  @property({ type: Number }) width = 250;

  @state() private isDragging = false;

  static styles = css`
    :host {
      display: block;
      position: relative;
      height: 100%;
      z-index: 10;
      transition: z-index 0s 0.2s;
    }

    :host([collapsed][ishovered]:not([suppresshover])) {
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

    :host([collapsed]:not([ishovered])) .sidebar,
    :host([collapsed][suppresshover]) .sidebar {
      border-right: none;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      box-shadow: rgba(95, 95, 95, 0) 4px 0 4px -2px;
    }

    :host([collapsed][ishovered]:not([suppresshover])) .sidebar {
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

    :host([collapsed]:not([ishovered])) .footer-divider,
    :host([collapsed]:not([ishovered])) ::slotted([slot="footer-actions"]) {
      display: none;
    }
  `;

  private startResize(e: MouseEvent) {
    if (this.isMobile || this.collapsed) return;
    e.preventDefault();
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
      this.isDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      this.dispatchEvent(new CustomEvent('drag-end'));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  render() {
    return html`
      <div class="mobile-backdrop" @click=${() => this.dispatchEvent(new CustomEvent('close-sidebar'))}></div>
      <aside class="sidebar" part="sidebar">
        <div class="sidebar-content">
          <slot></slot>
        </div>
        <div class="sidebar-footer">
          <alps-icon-btn 
            class="collapse-btn"
            icon="sidebar"
            title=${this.collapsed ? "Expand sidebar" : "Collapse sidebar"}
            @click=${() => this.dispatchEvent(new CustomEvent('toggle-collapse'))}
            style="--btn-padding: 8px; --icon-size: 20px;"
          ></alps-icon-btn>
          <div class="footer-divider"></div>
          <slot name="footer-actions"></slot>
        </div>
      </aside>
      <div class="sidebar-resizer ${this.isDragging ? 'dragging' : ''}" @mousedown=${this.startResize}></div>
    `;
  }
}
