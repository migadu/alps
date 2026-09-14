/**
 * Attachment pills show what kind of file they hold and open the preview for
 * the kinds it can draw; the list turns that into a request to the app.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, record, shadow, shadowAll, update } from './helpers/dom';
import '../src/components/alps-attachment-list';
import { attachmentPartUrl } from '../src/utils/attachment-url';

afterEach(cleanup);

const stored = (over: Record<string, unknown> = {}) => ({ Filename: 'invoice.pdf', Size: 1024, MIMEType: 'application/pdf', Path: [2], ...over });
const URL_2 = '/mailboxes/INBOX/messages/7/raw?part=2';

describe('attachmentPartUrl', () => {
  it('addresses the part by its path in the message', () => {
    expect(attachmentPartUrl('INBOX', '7', { Path: [1, 2] })).toBe('/mailboxes/INBOX/messages/7/raw?part=1.2');
  });

  it('is empty without a message or a path, rather than naming the whole message', () => {
    expect(attachmentPartUrl('INBOX', '', { Path: [2] })).toBe('');
    expect(attachmentPartUrl('INBOX', '7', { Path: [] })).toBe('');
    expect(attachmentPartUrl('INBOX', '7', {})).toBe('');
  });
});

describe('alps-attachment-pill', () => {
  const pill = (props: Record<string, unknown>) => mount('alps-attachment-pill', props);

  it('marks the file type on its icon', async () => {
    const pdf = await pill({ attachment: stored() });
    expect(shadow(pdf, '.attachment-icon').className).toContain('type-pdf');
    const zip = await pill({ attachment: { filename: 'bundle.zip', size: 10 } });
    expect(shadow(zip, '.attachment-icon').className).toContain('type-archive');
  });

  it('shows a stored image as a thumbnail, and its icon if the image fails', async () => {
    const el = await pill({ attachment: stored({ Filename: 'photo.jpg', MIMEType: 'image/jpeg' }), downloadUrl: URL_2 });
    const img = shadow<HTMLImageElement>(el, '.attachment-thumb img');
    expect(img.getAttribute('src')).toBe(URL_2);

    img.dispatchEvent(new Event('error'));
    await (el as any).updateComplete;
    expect(shadowAll(el, '.attachment-thumb')).toHaveLength(0);
    expect(shadow(el, '.attachment-icon').className).toContain('type-image');
  });

  it('tries the thumbnail again for the next image it is given', async () => {
    const el = await pill({ attachment: stored({ Filename: 'a.jpg', MIMEType: 'image/jpeg' }), downloadUrl: URL_2 });
    shadow(el, '.attachment-thumb img').dispatchEvent(new Event('error'));
    await (el as any).updateComplete;
    await update(el, { attachment: stored({ Filename: 'b.jpg', MIMEType: 'image/jpeg', Path: [3] }) });
    expect(shadowAll(el, '.attachment-thumb img')).toHaveLength(1);
  });

  it('opens the preview instead of downloading a file it can show', async () => {
    const attachment = stored();
    const el = await pill({ attachment, downloadUrl: URL_2 });
    const previews = record<CustomEvent>(el, 'preview-attachment');

    const click = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });
    shadow(el, 'a.attachment-chip').dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(previews).toHaveLength(1);
    expect(previews[0].detail.attachment).toBe(attachment);
  });

  it('opens it once from the preview button inside the link', async () => {
    const el = await pill({ attachment: stored(), downloadUrl: URL_2 });
    const previews = record<CustomEvent>(el, 'preview-attachment');
    shadow<HTMLButtonElement>(el, '.preview-btn').click();
    expect(previews).toHaveLength(1);
  });

  it('keeps the download for a file it cannot show', async () => {
    const el = await pill({ attachment: stored({ Filename: 'report.docx', MIMEType: '' }), downloadUrl: URL_2 });
    const previews = record<CustomEvent>(el, 'preview-attachment');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });
    shadow(el, 'a.attachment-chip').dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    expect(previews).toHaveLength(0);
    expect(shadowAll(el, '.preview-btn')).toHaveLength(0);
  });

  it('offers no preview for a file still in the composer', async () => {
    const el = await pill({ attachment: { filename: 'draft.pdf', size: 10 }, removable: true });
    const previews = record<CustomEvent>(el, 'preview-attachment');
    shadow<HTMLElement>(el, '.attachment-chip').click();
    expect(previews).toHaveLength(0);
    expect(shadowAll(el, '.preview-btn, .attachment-thumb')).toHaveLength(0);
  });
});

describe('alps-attachment-list', () => {
  it('asks the app to open the preview at the attachment clicked, with its message', async () => {
    const attachments = [stored({ Filename: 'a.pdf' }), stored({ Filename: 'b.png', MIMEType: 'image/png', Path: [3] })];
    const el = await mount('alps-attachment-list', { attachments, mailbox: 'Archive', messageUid: '9' });
    const opened = record<CustomEvent>(window, 'open-attachment-preview');

    const pills = shadowAll(el, 'alps-attachment-pill');
    shadow<HTMLButtonElement>(pills[1], '.preview-btn').click();

    expect(opened).toHaveLength(1);
    expect(opened[0].detail).toEqual({ attachments, mailbox: 'Archive', messageUid: '9', index: 1 });
  });

  it('builds each download from the message and the part path', async () => {
    const el = await mount('alps-attachment-list', { attachments: [stored({ Path: [1, 2] })], mailbox: 'INBOX', messageUid: '7' });
    const pillEl = shadow(el, 'alps-attachment-pill') as unknown as { downloadUrl: string };
    expect(pillEl.downloadUrl).toBe('/mailboxes/INBOX/messages/7/raw?part=1.2');
  });
});
