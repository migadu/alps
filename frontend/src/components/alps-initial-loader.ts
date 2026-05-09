import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './alps-loader';

@customElement('alps-initial-loader')
export class AlpsInitialLoader extends LitElement {
  @property({ type: Boolean, reflect: true }) hidden = false;

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      background: var(--bg-primary, #ffffff);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s ease-in-out, visibility 0.5s;
    }

    :host([hidden]) {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
  `;

  render() {
    return html`<alps-loader></alps-loader>`;
  }
}
