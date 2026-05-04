

export class Router {
  private routes: Record<string, () => unknown>;
  private fallback: () => unknown;
  currentPath: string;

  constructor(
    routes: Record<string, () => unknown>,
    fallback: () => unknown,
    onChange: () => void
  ) {
    this.routes = routes;
    this.fallback = fallback;
    this.currentPath = this.getHashPath();

    window.addEventListener('hashchange', () => {
      this.currentPath = this.getHashPath();
      onChange();
    });
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
