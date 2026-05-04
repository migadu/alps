import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../store/i18n-store';
import './alps-icon-btn';
import './alps-button';

@customElement('alps-toast')
export class AlpsToast extends LitElement {
  @consume({ context: i18nContext })
  i18nStore!: I18nStore;
  @property({ type: Boolean, reflect: true }) show = false;
  @property({ type: String }) message = '';
  @property({ type: String }) actionLabel = '';
  @property({ type: Object }) onAction?: () => void;
  @property({ type: Number }) timeout = 0;

  private _timer: ReturnType<typeof setTimeout> | null = null;

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('show')) {
      if (this.show && this.timeout > 0) {
        if (this._timer) clearTimeout(this._timer);
        this._timer = setTimeout(() => {
          this.dismiss();
        }, this.timeout);
      } else if (!this.show && this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
    }
  }

  private dismiss() {
    this.show = false;
    this.dispatchEvent(new CustomEvent('dismiss'));
    this.onAction = undefined;
  }

  private handleAction() {
    if (this.onAction) {
      this.onAction();
    } else {
      this.dispatchEvent(new CustomEvent('action'));
    }
    this.dismiss();
  }

  static styles = css`
    :host {
      display: block;
      transform: translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host([show]) {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .toast-container {
      background: var(--toast-bg, rgba(0, 0, 0, 0.85));
      color: #fff;
      border: 1px solid var(--toast-border, rgba(255, 255, 255, 0.1));
      border-radius: 6px;
      padding: 0 4px 0 16px;
      height: 36px;
      box-sizing: border-box;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    /* Action button is now an alps-button and styled via custom properties inline */
  `;

  render() {
    return html`
      <div class="toast-container">
        <span>${this.message}</span>
        ${this.actionLabel ? html`
          <alps-button 
            variant="normal" 
            @click=${this.handleAction}
            style="--text-primary: inherit; --border-color: currentColor; --bg-tertiary: rgba(255, 255, 255, 0.15); --btn-padding: 4px 10px; --btn-font-size: 12px;"
          >
            ${this.actionLabel}
          </alps-button>
        ` : ''}
        <alps-icon-btn 
          class="dismiss-btn" 
          icon="x" 
          aria-label="${this.i18nStore?.t('toast.dismiss')}" 
          @click=${this.dismiss}
          style="--btn-color: rgba(255, 255, 255, 0.7); --btn-hover-bg: rgba(255, 255, 255, 0.15); --text-primary: #fff; --btn-icon-size: 16px;"
        ></alps-icon-btn>
      </div>
    `;
  }
}
