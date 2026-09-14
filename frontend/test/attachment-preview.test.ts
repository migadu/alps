/**
 * The attachment preview: what each kind of file is drawn as, where its bytes
 * come from, and the keys it takes from the page underneath.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, click, flush, mount, record, shadow, shadowAll, text, waitFor } from './helpers/dom';
import '../src/components/alps-attachment-preview';

afterEach(cleanup);
afterEach(() => vi.unstubAllGlobals());

const part = (over: Record<string, unknown> = {}) => ({ Filename: 'invoice.pdf', Size: 50 * 1024, MIMEType: 'application/pdf', Path: [2], ...over });

const preview = (props: Record<string, unknown> = {}) =>
  mount('alps-attachment-preview', { attachments: [part()], mailbox: 'INBOX', messageUid: '7', activeIndex: 0, ...props });

/** Stands in for URL's blob methods, which jsdom lacks. */
function stubBlobUrls() {
  const created: Blob[] = [];
  const revoked: string[] = [];
  const origCreate = URL.createObjectURL;
  const origRevoke = URL.revokeObjectURL;
  (URL as any).createObjectURL = (b: Blob) => { created.push(b); return `blob:pdf-${created.length}`; };
  (URL as any).revokeObjectURL = (u: string) => { revoked.push(u); };
  return { created, revoked, restore: () => { (URL as any).createObjectURL = origCreate; (URL as any).revokeObjectURL = origRevoke; } };
}

describe('alps-attachment-preview', () => {
  it('renders nothing without attachments', async () => {
    const el = await mount('alps-attachment-preview', { attachments: [] });
    expect(shadowAll(el, '.backdrop')).toHaveLength(0);
  });

  it('shows the name, size and type', async () => {
    const el = await preview({ attachments: [part({ Filename: 'document.pdf', Size: 2048 })] });
    expect(text(el, '.file-title')).toBe('document.pdf');
    expect(text(el, '.file-sub')).toContain('2 KB');
    expect(shadow(el, '.type-badge').className).toContain('type-pdf');
  });

  it('frames a PDF from a blob: URL it fetched, not from the part URL', async () => {
    // The part is served as a download; a frame pointed at it would save it.
    const fetched: string[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      fetched.push(String(input));
      return new Response(new Blob(['%PDF-1.4'], { type: 'application/octet-stream' }), { status: 200 });
    });
    const blobs = stubBlobUrls();
    try {
      const el = await preview({ mailbox: 'Lists/Work', messageUid: '42', attachments: [part({ Path: [1, 2] })] });
      await waitFor(() => shadowAll(el, 'iframe.pdf-frame').length > 0, 'the PDF frame');
      expect(shadow(el, 'iframe.pdf-frame').getAttribute('src')).toBe('blob:pdf-1#toolbar=1');
      expect(fetched).toHaveLength(1);
      expect(fetched[0]).toContain('/messages/42/raw?part=1.2');
      expect(fetched[0]).toContain(encodeURIComponent('Work'));
      // Relabelled, so the viewer opens it whatever the part claimed to be.
      expect(blobs.created[0].type).toBe('application/pdf');
    } finally {
      blobs.restore();
    }
  });

  it('gives the blob: URL back when the preview closes', async () => {
    vi.stubGlobal('fetch', async () => new Response(new Blob(['%PDF-1.4']), { status: 200 }));
    const blobs = stubBlobUrls();
    try {
      const el = await preview();
      await waitFor(() => shadowAll(el, 'iframe.pdf-frame').length > 0, 'the PDF frame');
      el.remove();
      expect(blobs.revoked).toEqual(['blob:pdf-1']);
    } finally {
      blobs.restore();
    }
  });

  it('says so when the PDF cannot be fetched', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 500 }));
    const el = await preview();
    await waitFor(() => shadowAll(el, '.error-state').length > 0, 'the error');
    expect(shadowAll(el, 'iframe')).toHaveLength(0);
  });

  it('draws an image from the part URL', async () => {
    const el = await preview({ attachments: [part({ Filename: 'photo.jpg', MIMEType: 'image/jpeg', Path: [3] })] });
    expect(shadow(el, 'img.preview-image').getAttribute('src')).toBe('/mailboxes/INBOX/messages/7/raw?part=3');
  });

  it('zooms and rotates an image, and starts over on the next attachment', async () => {
    const el = await preview({
      attachments: [part({ Filename: 'a.png', MIMEType: 'image/png', Path: [2] }), part({ Filename: 'b.png', MIMEType: 'image/png', Path: [3] })],
    });
    await click(shadow(el, '.zoom-in'), el);
    await click(shadow(el, '.rotate'), el);
    expect(shadow<HTMLElement>(el, 'img.preview-image').style.transform).toBe('scale(1.25) rotate(90deg)');

    await click(shadow(el, 'button.nav-arrow.next'), el);
    await flush();
    expect(shadow<HTMLElement>(el, 'img.preview-image').style.transform).toBe('scale(1) rotate(0deg)');
  });

  it('plays audio and video from the part URL', async () => {
    const audio = await preview({ attachments: [part({ Filename: 'voice.mp3', MIMEType: 'audio/mpeg', Path: [4] })] });
    expect(shadow(audio, 'audio').getAttribute('src')).toBe('/mailboxes/INBOX/messages/7/raw?part=4');
    const video = await preview({ attachments: [part({ Filename: 'clip.mp4', MIMEType: 'video/mp4', Path: [5] })] });
    expect(shadow(video, 'video').getAttribute('src')).toBe('/mailboxes/INBOX/messages/7/raw?part=5');
  });

  it('shows a text file as numbered lines of text, never as markup', async () => {
    vi.stubGlobal('fetch', async () => new Response('<script>alert(1)</script>\n<b>bold</b>', { status: 200 }));
    const el = await preview({ attachments: [part({ Filename: 'page.html', MIMEType: 'text/html', Size: 40, Path: [2] })] });
    await waitFor(() => shadowAll(el, '.code-line').length === 2, 'two lines');
    expect(shadowAll(el, '.line-text').map((l) => l.textContent)).toEqual(['<script>alert(1)</script>', '<b>bold</b>']);
    expect(shadowAll(el, '.text-container script, .text-container b')).toHaveLength(0);
  });

  it('offers a download instead of fetching a very large text file', async () => {
    const fetched: string[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => { fetched.push(String(input)); return new Response('x'); });
    const el = await preview({ attachments: [part({ Filename: 'huge.log', MIMEType: 'text/plain', Size: 5 * 1024 * 1024 })] });
    await flush();
    expect(fetched).toEqual([]);
    expect(shadowAll(el, '.text-container')).toHaveLength(0);
    expect(shadowAll(el, '.fallback-card .download')).toHaveLength(1);
  });

  it('keeps a slow answer off the attachment the user moved to', async () => {
    let answerFirst!: (r: Response) => void;
    vi.stubGlobal('fetch', (input: RequestInfo | URL) => String(input).endsWith('part=2')
      ? new Promise<Response>((r) => { answerFirst = r; })
      : Promise.resolve(new Response('second file', { status: 200 })));
    const el = await preview({
      attachments: [part({ Filename: 'a.txt', MIMEType: 'text/plain', Size: 10, Path: [2] }), part({ Filename: 'b.txt', MIMEType: 'text/plain', Size: 10, Path: [3] })],
    });
    await click(shadow(el, 'button.nav-arrow.next'), el);
    await waitFor(() => text(el, '.line-text') === 'second file', "the second file's text");

    answerFirst(new Response('first file', { status: 200 }));
    await flush();
    await flush();
    expect(text(el, '.file-title')).toBe('b.txt');
    expect(text(el, '.line-text')).toBe('second file');
  });

  it('offers a download card for a type it cannot draw', async () => {
    const el = await preview({ attachments: [part({ Filename: 'report.docx', MIMEType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] });
    expect(shadowAll(el, '.fallback-card')).toHaveLength(1);
    expect(shadowAll(el, 'iframe, img.preview-image, audio, video, .text-container')).toHaveLength(0);
  });

  it('steps through attachments with the arrows, wrapping around', async () => {
    const el = await preview({
      attachments: [part({ Filename: 'first.docx', MIMEType: '' }), part({ Filename: 'second.zip', MIMEType: '', Path: [3] })],
    });
    expect(text(el, '.file-sub')).toContain('1 / 2');
    await click(shadow(el, 'button.nav-arrow.next'), el);
    expect(text(el, '.file-title')).toBe('second.zip');
    await click(shadow(el, 'button.nav-arrow.next'), el);
    expect(text(el, '.file-title')).toBe('first.docx');
  });

  it('closes from the close button, from Escape and from the backdrop', async () => {
    const el = await preview({ attachments: [part({ Filename: 'a.docx', MIMEType: '' })] });
    const closes = record<CustomEvent>(el, 'close');
    await click(shadow(el, 'button.close-btn'), el);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await click(shadow(el, '.preview-body'), el);
    expect(closes).toHaveLength(3);
  });

  it('keeps Escape and the arrows from the page underneath', async () => {
    const el = await preview({ attachments: [part({ Filename: 'a.docx', MIMEType: '' })] });
    const reached: string[] = [];
    const listener = (e: KeyboardEvent) => reached.push(e.key);
    document.addEventListener('keydown', listener);
    try {
      for (const key of ['Escape', 'ArrowLeft', 'ArrowRight', 'e']) {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      }
      expect(reached).toEqual(['e']);
    } finally {
      document.removeEventListener('keydown', listener);
      el.remove();
    }
  });

  it('stops listening for keys once it is closed', async () => {
    const el = await preview({ attachments: [part({ Filename: 'a.docx', MIMEType: '' })] });
    el.remove();
    const reached: string[] = [];
    const listener = (e: KeyboardEvent) => reached.push(e.key);
    document.addEventListener('keydown', listener);
    try {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(reached).toEqual(['Escape']);
    } finally {
      document.removeEventListener('keydown', listener);
    }
  });
});
