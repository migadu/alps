import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/gpg/frontend/gpg-settings';
import { cleanup, mount, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('a failed keyring read', () => {
  it.each(['http', 'network'])('offers recovery instead of key creation after a %s failure', async failure => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let reads = 0;
    vi.stubGlobal('fetch', vi.fn(async () => {
      reads++;
      if (reads === 1) {
        if (failure === 'network') throw new Error('offline');
        return new Response('{}', { status: 503 });
      }
      return new Response('{}');
    }));
    const el = await mount<El>('alps-gpg-settings', { i18nStore: { t: (key: string) => key } });
    await waitFor(() => !el.loading, 'failed keyring read');
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).toContain('gpg.loadError');
    expect(el.shadowRoot!.textContent).not.toContain('gpg.noKeyPresent');
    expect(el.shadowRoot!.textContent).not.toContain('gpg.generateNewKeypair');
    el.shadowRoot!.querySelector<HTMLElement>('alps-button')!.click();
    await waitFor(() => reads === 2 && !el.loading, 'retry');
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).toContain('gpg.noKeyPresent');
  });
});
