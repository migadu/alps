import { afterEach, expect, it, vi } from 'vitest';
import { abortUpload, uploadFiles } from '../src/utils/attachment-utils';

afterEach(() => vi.unstubAllGlobals());
it('refuses an attachment when the advertised budget is zero', () => {
  class Upload { upload = {}; open() {} send() {} abort() {} }
  vi.stubGlobal('XMLHttpRequest', Upload);
  const added = vi.fn();
  const messages: string[] = [];
  const notice = (event: Event) => messages.push((event as CustomEvent).detail.message);
  window.addEventListener('show-toast', notice);
  try {
    uploadFiles([new File(['x'], 'x.txt')], 'zero', 0, 0, added, vi.fn(), vi.fn(), vi.fn(), 'No attachments fit.');
    expect(added).not.toHaveBeenCalled();
    expect(messages).toContain('No attachments fit.');
  } finally {
    window.removeEventListener('show-toast', notice);
    for (const [id] of added.mock.calls) abortUpload(id);
  }
});
