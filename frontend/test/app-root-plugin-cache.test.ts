import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../src/components/app-root';
import { registry } from '../src/plugin-registry';
import { cleanup, mount } from './helpers/dom';

type AppRootEl = HTMLElement & {
  getRoutes: () => Record<string, () => any>;
  pluginPages?: Map<string, HTMLElement>;
};

describe('app-root plugin page caching and session clearing', () => {
  const testRoute = '/test-plugin';
  const testComponent = 'div';

  beforeEach(() => {
    registry.registerRoute({
      path: testRoute,
      component: testComponent,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('drops cached plugin page instances when session is cleared', async () => {
    const el = await mount<AppRootEl>('app-root');
    const routes = (el as any).getRoutes();
    expect(routes[testRoute]).toBeDefined();

    const firstInstance = routes[testRoute]();
    const secondInstance = routes[testRoute]();
    expect(firstInstance).toBe(secondInstance);

    // Simulate user logout
    window.dispatchEvent(new CustomEvent('session-cleared'));

    const thirdInstance = routes[testRoute]();
    expect(thirdInstance).not.toBe(firstInstance);
  });
});
