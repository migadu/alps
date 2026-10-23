import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A SIDEBAR SECTION'S HEADING.
 *
 * The one heading for every sidebar: mail's FOLDERS, Calendar's MY CALENDARS,
 * Tasks' LISTS. Each had its own markup and CSS and they had drifted: mail's
 * 14px side padding, 0.5px tracking and theme label font; calendar's and
 * tasks' bare h3 with no side padding and a 12px margin below.
 *
 * Rendered into the host's own root, not a shadow root, so `.section-heading`
 * sits beside the host's rows: one stylesheet, one set of selectors. The host
 * includes {@link sectionHeadingStyles} for that reason.
 */
@customElement('alps-sidebar-heading')
export class AlpsSidebarHeading extends LitElement {
  /** The section's name, as shown (the CSS uppercases it). */
  @property({ type: String }) heading = '';

  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  render() {
    return html`<h3 class="section-heading">${this.heading}</h3>`;
  }
}

/** The heading's styles; every host that renders an `<alps-sidebar-heading>` includes them. */
export const sectionHeadingStyles = css`
  alps-sidebar-heading {
    display: block;
  }
  /* 32px, the text centred, and 8px in, as the rows below pad theirs. */
  .section-heading {
    display: flex;
    align-items: center;
    min-height: 32px;
    margin: 0;
    padding: 0 8px;
    font-family: var(--font-label);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted, #6b7280);
  }
`;

declare global {
  interface HTMLElementTagNameMap {
    'alps-sidebar-heading': AlpsSidebarHeading;
  }
}
