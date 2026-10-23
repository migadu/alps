import { ReactiveElement, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createContext, consume } from '@lit/context';

/**
 * WHETHER THE SIDEBAR IS THE COLLAPSED STRIP RIGHT NOW: collapsed, not
 * peeking, not mobile.
 *
 * `alps-sidebar` provides it and is the only thing that knows it. It used to
 * be rebuilt in five sidebars from three props (collapsed, not mobile, not
 * peeking, in every order), with each page listening to the sidebar's peek
 * event only to hand the peek back down, and it drove the same three things
 * in all of them. Those three now read it from here:
 *
 *  - `<alps-sidebar-frame>`: the sidebar's wrapper; carries the `collapsed`
 *    class the pages' own row styles key on.
 *  - `<alps-sidebar-content>`: the scrolling content; dimmed by
 *    `sidebarLayoutStyles` and `inert` in the strip, so the keyboard cannot
 *    walk rows the pointer cannot use.
 *  - `alps-create-button`: its small form.
 *
 * Collapsing changes nothing else about what a sidebar contains.
 */
export const sidebarStripContext = createContext<boolean>('sidebar-strip');

/**
 * A light-DOM element that follows the strip state.
 *
 * No shadow root and no template: its children are the page's own markup,
 * rendered by the page and styled by the page's stylesheet, exactly as the
 * plain `<div>` it replaces was. A `ReactiveElement` rather than a
 * `LitElement` for that reason: there is nothing of its own to render.
 */
abstract class StripFollower extends ReactiveElement {
  @consume({ context: sidebarStripContext, subscribe: true })
  @property({ attribute: false })
  strip = false;

  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  protected override update(changed: PropertyValues<this>): void {
    super.update(changed);
    this.follow(this.strip);
  }

  protected abstract follow(strip: boolean): void;
}

/** The sidebar's wrapper: `<alps-sidebar-frame class="sidebar-wrapper">`. */
@customElement('alps-sidebar-frame')
export class AlpsSidebarFrame extends StripFollower {
  protected follow(strip: boolean): void {
    this.classList.toggle('collapsed', strip);
  }
}

/** The sidebar's content: `<alps-sidebar-content class="sidebar-content">`. */
@customElement('alps-sidebar-content')
export class AlpsSidebarContent extends StripFollower {
  protected follow(strip: boolean): void {
    this.toggleAttribute('strip', strip);
    // The attribute, not the `inert` property: the attribute is what the
    // platform (and every test DOM) honours.
    this.toggleAttribute('inert', strip);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'alps-sidebar-frame': AlpsSidebarFrame;
    'alps-sidebar-content': AlpsSidebarContent;
  }
}
