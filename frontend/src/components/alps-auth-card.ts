import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { iconHref, renderIcon } from '../utils/ui';
import { BUILTIN_LOGOS } from '../utils/branding';

@customElement('alps-auth-card')
export class AlpsAuthCard extends LitElement {
  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      background: var(--bg-secondary, #f9fafb);
      position: relative;
    }

    .card {
      position: relative;
      z-index: 1;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      padding: 32px;
      border-radius: var(--radius-lg, 8px);
      box-shadow: rgba(95, 95, 95, 0.15) 0 4px 12px 0px;
      width: 100%;
      max-width: 360px;
      color: var(--text-primary, #111827);
    }

    .logo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }

    .logo-container svg {
      width: var(--auth-card-icon-size, 40px);
      height: var(--auth-card-icon-size, 40px);
      fill: var(--auth-card-icon-color, currentColor);
    }

    /* A deployment's own logo: any shape, kept within the card. With one for
       each mode, the page's mode picks it: index.css sets the two displays. */
    .logo-container img {
      display: block;
      max-width: 100%;
      max-height: 56px;
    }

    .logo-container img.light-only {
      display: var(--light-only-display, block);
    }

    .logo-container img.dark-only {
      display: var(--dark-only-display, none);
    }

    /* A logo alps ships: as wide as its viewBox makes it at this height. */
    .logo-container svg.builtin-logo {
      width: auto;
      height: 32px;
    }

    h1 {
      margin-top: 0;
      margin-bottom: 4px;
      text-align: center;
      font-family: var(--font-heading, 'Inter', sans-serif);
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary, #111827);
    }

    p.subtitle {
      text-align: center;
      color: var(--text-secondary, #4b5563);
      margin-bottom: 24px;
      font-size: 14px;
      line-height: 1.5;
    }

    @media (max-width: 640px) {
      :host {
        background: var(--bg-primary, #ffffff);
      }
      
      .card {
        border: none;
        box-shadow: none;
      }
    }
  `;

  @property({ type: String }) icon = '';
  /** An image shown in place of the icon. Unlabelled: the title names the page. */
  @property({ type: String }) logo = '';
  /** The logo's stand-in in the dark modes, if it has one. */
  @property({ type: String }) logoDark = '';
  /** A logo alps ships (BUILTIN_LOGOS), shown in place of the icon. */
  @property({ type: String }) builtinLogo = '';
  @property({ type: String }) title = '';
  @property({ type: String }) subtitle = '';

  render() {
    const builtinViewBox = BUILTIN_LOGOS[this.builtinLogo];
    return html`
      <div class="card">
        ${this.logo ? html`
          <div class="logo-container">
            <img class=${this.logoDark ? 'light-only' : ''} src=${this.logo} alt="">
            ${this.logoDark ? html`<img class="dark-only" src=${this.logoDark} alt="">` : ''}
          </div>
        ` : builtinViewBox ? html`
          <div class="logo-container">
            <svg class="builtin-logo" viewBox=${builtinViewBox} aria-hidden="true">
              <use href=${iconHref(this.builtinLogo)}></use>
            </svg>
          </div>
        ` : this.icon ? html`
          <div class="logo-container">
            ${renderIcon(this.icon)}
          </div>
        ` : ''}
        ${this.title ? html`<h1>${this.title}</h1>` : ''}
        ${this.subtitle ? html`<p class="subtitle">${this.subtitle}</p>` : ''}
        
        <slot></slot>
      </div>
    `;
  }
}
