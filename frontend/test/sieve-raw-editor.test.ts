/**
 * The raw Sieve editor offers Save while its text differs from what the server
 * holds.
 *
 * It took the first text it was handed to be the stored script, which is true
 * when a stored script is opened and false when unsaved rules are switched to
 * the raw editor: those arrived first, read as saved, and Save stayed disabled
 * over text the server had never seen.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadow, update, waitFor } from './helpers/dom';
import { managesieveService } from '../../plugins/managesieve/frontend/managesieve-service';
import '../../plugins/managesieve/frontend/raw-editor';

type El = HTMLElement & Record<string, any>;

const i18nStore = { t: (key: string) => key, addEventListener: () => {}, removeEventListener: () => {} };

const saveButton = (el: El) => shadow(el, 'alps-button[variant="primary"]');

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('the raw Sieve editor', () => {
  it('offers Save for text the server does not hold, even the first text it is given', async () => {
    const el = await mount<El>('alps-raw-editor', { i18nStore, stored: '', script: 'require "fileinto";\n' });
    expect(saveButton(el).hasAttribute('disabled')).toBe(false);
  });

  it('offers nothing to save for the stored script, until it is edited', async () => {
    const stored = 'keep;\n';
    const el = await mount<El>('alps-raw-editor', { i18nStore, stored, script: stored });
    expect(saveButton(el).hasAttribute('disabled')).toBe(true);

    await update(el, { script: 'discard;\n' });
    expect(saveButton(el).hasAttribute('disabled')).toBe(false);
  });

  it('takes what it saved as stored, and says so', async () => {
    vi.spyOn(managesieveService, 'saveScript').mockResolvedValue(undefined as never);
    const el = await mount<El>('alps-raw-editor', { i18nStore, stored: '', script: 'discard;\n' });
    const saved = record<CustomEvent>(el, 'script-saved');

    (saveButton(el) as HTMLElement).click();
    await waitFor(() => saved.length > 0, 'the save');
    await el.updateComplete;

    expect(saved[0].detail.script).toBe('discard;\n');
    expect(saveButton(el).hasAttribute('disabled')).toBe(true);
  });
});
