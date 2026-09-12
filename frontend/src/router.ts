

export class Router {
  private routes: Record<string, () => unknown>;
  private fallback: () => unknown;

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

    window.addEventListener('hashchange', () => onChange());
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
