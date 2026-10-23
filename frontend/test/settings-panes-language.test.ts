/**
 * Two settings panes in the user's language.
 *
 * When the security keys' settings could not be read, the pane's error
 * dialog showed the error's own message: the code's "Failed to fetch
 * settings", or the browser's ("Failed to fetch"), in English whatever the
 * interface language. The GPG pane's loader read "Loading..." and "Generating
 * keypair..." in English too.
 *
 * The security-key pane now says in the user's language that its settings
 * could not be loaded, and leaves the error itself to the console; the GPG
 * loader's texts come from the dictionaries.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/alps-webauthn-settings';
import '../../plugins/gpg/frontend/gpg-settings';
import { I18nStore } from '../src/store/i18n-store';
import { cleanup, mount, shadow, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

async function german(): Promise<I18nStore> {
  const store = new I18nStore();
  await store.setLanguage('de');
  return store;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the security-key pane', () => {
  it.each([
    ['refuses', async () => new Response('{}', { status: 500 })],
    ['cannot be reached', async () => { throw new TypeError('Failed to fetch'); }],
  ])('says in the user\'s language that its settings could not be loaded when the server %s', async (_, answer) => {
    const i18nStore = await german();
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(answer));
    const el = await mount<El>('alps-webauthn-settings', { i18nStore });
    await waitFor(() => !!el.shadowRoot?.querySelector('ui-modal'), 'the error');

    const shown = shadow(el, 'ui-modal').textContent ?? '';
    expect(shown).toContain(i18nStore.t('webauthn.errors.load_failed'));
    expect(i18nStore.t('webauthn.errors.load_failed')).not.toBe('webauthn.errors.load_failed');
    expect(shown).not.toMatch(/Failed to fetch/);
    // The error itself is for whoever reads the console.
    expect(logged).toHaveBeenCalled();
  });
});

describe('the GPG pane', () => {
  it('says it is loading, and generating a keypair, in the user\'s language', async () => {
    const i18nStore = await german();
    // The keys' read held open, so that the pane stays on its loader.
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    const el = await mount<El>('alps-gpg-settings', { i18nStore });
    const loader = () => shadow<El>(el, 'alps-loader').text;
    expect(loader()).toBe(i18nStore.t('settings.loading'));
    expect(loader()).toBe('Laden...');

    el.generating = true;
    await el.updateComplete;
    expect(loader()).toBe(i18nStore.t('gpg.generating'));
    expect(loader()).not.toBe('gpg.generating');
  });
});
