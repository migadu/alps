

import type { ReactiveController } from 'lit';

/**
 * The hash router: which page the URL names, and a call to the shell on every
 * navigation.
 *
 * A ReactiveController, added by the shell that renders it, because the
 * `hashchange` listener has to live exactly as long as that shell is in the
 * document. Added at construction and never removed, it kept a removed shell
 * re-rendering on every hash change for the rest of the page's life. Lit
 * connects and disconnects a controller with its host, including a host that
 * is put back.
 */
export class Router implements ReactiveController {
  private routes: Record<string, () => unknown>;
  private fallback: () => unknown;
  /** Kept so that the listener removed is the one that was added. */
  private readonly onHashChange: () => void;

  /**
   * The path the browser is on RIGHT NOW.
   *
   * Read from the hash on every access rather than cached at construction and
   * refreshed on `hashchange`, because a cache loses a race the app actually
   * runs. Assigning `location.hash` changes the URL synchronously but the
   * event is a TASK, while a Lit update is a MICROTASK — so the logged-out
   * redirect issued in `app-root`'s `connectedCallback` was invisible to the
   * very next render, which then mounted the mailbox the redirect existed to
   * avoid (and fired every authenticated read on it against no session).
   */
  get currentPath(): string {
    return this.getHashPath();
  }

  constructor(
    routes: Record<string, () => unknown>,
    fallback: () => unknown,
    onChange: () => void
  ) {
    this.routes = routes;
    this.fallback = fallback;
    this.onHashChange = () => onChange();
  }

  /**
   * Starts listening when the shell is connected, and again each time it is
   * put back. Not at construction, so a shell built and never attached routes
   * nothing. Adding the same listener twice adds it once.
   *
   * It also asks for a render: the hash may have moved while the shell was
   * out of the document, and a shell put back must show what the URL names
   * now. On the first connection that is the render Lit has already queued.
   */
  hostConnected(): void {
    window.addEventListener('hashchange', this.onHashChange);
    this.onHashChange();
  }

  /** Stops listening when the shell leaves the document. */
  hostDisconnected(): void {
    window.removeEventListener('hashchange', this.onHashChange);
  }

  private getHashPath() {
    const hash = window.location.hash;
    if (!hash || hash === '#') return '/';
    const path = hash.substring(1); // Remove the '#'
    return path.split('?')[0];
  }

  navigate(path: string) {
    window.location.hash = path;
  }

  /**
   * Replaces the route table. The shell builds it before /session says which
   * plugins are on, and builds it again when that answer comes: a route left
   * in the table is a page the address bar still reaches.
   */
  setRoutes(routes: Record<string, () => unknown>) {
    this.routes = routes;
  }

  render() {
    // Exact match
    if (this.routes[this.currentPath]) {
      return this.routes[this.currentPath]();
    }
    
    // Prefix match
    for (const route in this.routes) {
      if (route.endsWith('/*') && this.currentPath.startsWith(route.replace('/*', ''))) {
         return this.routes[route]();
      }
    }

    return this.fallback();
  }
}
