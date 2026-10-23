/**
 * The GPG settings' "import failed" dialog, in the user's language.
 *
 * Its one button, which closes it, was written in the template as "OK", in
 * English whatever the interface language. It now reads Close from the
 * dictionaries, as the attachment preview's close button does.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/gpg/frontend/gpg-settings';
import { I18nStore } from '../src/store/i18n-store';
import { cleanup, mount, shadow, shadowAll, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('the GPG import-failed dialog', () => {
  it('closes with a button in the reader\'s language', async () => {
    const i18nStore = new I18nStore();
    await i18nStore.setLanguage('de');
    const el = await mount<El>('alps-gpg-settings', { i18nStore });
    await waitFor(() => !el.loading, 'the keys to be read');

    // An import with no key pasted in fails before it starts.
    await el.importKeys();
    await el.updateComplete;
    const dialog = shadow<El>(el, 'ui-modal');
    expect(dialog.textContent).toContain(i18nStore.t('gpg.importMissing'));

    const buttons = shadowAll<HTMLElement>(el, 'ui-modal alps-button');
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Schließen']);
    buttons[0].click();
    await el.updateComplete;
    expect(shadowAll(el, 'ui-modal')).toHaveLength(0);
  });
});
