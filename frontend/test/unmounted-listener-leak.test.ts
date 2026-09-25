import { describe, expect, it, vi } from 'vitest';
import '../src/components/folder-list';
import '../src/components/alps-floating-composer';

describe('unmounted component listener leak prevention', () => {
  it('does not register store listeners if alps-folder-list is disconnected before updateComplete resolves', async () => {
    const composeStore = Object.assign(new EventTarget(), {
      getState: () => ({ activeComposers: [] }),
    });
    const addListenerSpy = vi.spyOn(composeStore, 'addEventListener');

    const el = document.createElement('alps-folder-list') as any;
    el.composeStore = composeStore;

    // Connect and immediately disconnect before updateComplete resolves
    document.body.appendChild(el);
    el.remove();

    await el.updateComplete;

    // Listener should not be added to an already disconnected element
    expect(addListenerSpy).not.toHaveBeenCalled();
  });

  it('does not register store listeners if alps-floating-composer is disconnected before updateComplete resolves', async () => {
    const i18nStore = Object.assign(new EventTarget(), {
      t: (k: string) => k,
    });
    const addListenerSpy = vi.spyOn(i18nStore, 'addEventListener');

    const el = document.createElement('alps-floating-composer') as any;
    el.instance = { id: 'test-composer' };
    el.i18nStore = i18nStore;

    document.body.appendChild(el);
    el.remove();

    await el.updateComplete;

    expect(addListenerSpy).not.toHaveBeenCalled();
  });
});
