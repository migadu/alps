import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getTagTextColor } from '../utils/flags';

@customElement('alps-tag')
export class AlpsTag extends LitElement {
  @property({ type: String }) name = '';
  @property({ type: String }) color = '';

  static styles = css`
    :host {
      display: inline-flex;
    }

    .tag-pill {
      display: inline-flex;
      align-items: center;
      padding-block: 0;
      padding-inline: 6px 10px;
      height: 18px;
      border-radius: 0;
      border-start-start-radius: 4px;
      border-end-start-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: 80px;
      line-height: 1;
      clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%);
    }

    /* The tag's point is on its inline end. */
    :host(:dir(rtl)) .tag-pill {
      clip-path: polygon(6px 0, 100% 0, 100% 100%, 6px 100%, 0 50%);
    }
  `;

  render() {
    // The name is written in black or white, whichever reads on the colour;
    // the pill is opaque, as faded it took on the page behind it.
    return html`
      <div class="tag-pill" style="background-color: ${this.color}; color: ${getTagTextColor(this.color)}" title=${this.name}>
        ${this.name}
      </div>
    `;
  }
}
