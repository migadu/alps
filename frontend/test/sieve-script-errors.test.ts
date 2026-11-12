import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../plugins/managesieve/frontend/raw-editor';
import { managesieveService, scriptFailureMessage } from '../../plugins/managesieve/frontend/managesieve-service';
import { cleanup, mount, record } from './helpers/dom';
type El = HTMLElement & Record<string, any>;
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('raw filter failures', () => {
  it('translates an unavailable validation response', async () => {
    vi.spyOn(managesieveService, 'validateScript').mockRejectedValueOnce(new Error('sieve_unavailable'));
    const el = await mount<El>('alps-raw-editor', { i18nStore: { t: (key: string) => key } });
    const toasts = record<CustomEvent>(window, 'show-toast');
    await el.validate();
    expect(toasts[0].detail.message).toBe('managesieve.toast.validateError');
  });
  it('translates a failed pre-save read but preserves script diagnostics', () => {
    expect(scriptFailureMessage(new Error('Failed to fetch script: '), 'translated')).toBe('translated');
    expect(scriptFailureMessage(new Error('Invalid Sieve script: line 2'), 'translated')).toBe('Invalid Sieve script: line 2');
  });
});
