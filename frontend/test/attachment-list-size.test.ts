/**
 * The attachment list's header says how much it holds, beside the caret: the
 * composer's files against the budget an upload is refused past, and a
 * received message's parts added up.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, shadow, text, update } from './helpers/dom';
import '../src/components/alps-attachment-list';

afterEach(cleanup);

const KiB = 1024;
const MiB = 1024 * KiB;

/** A stored part, the shape a message's structure reports. */
const stored = (over: Record<string, unknown> = {}) => ({ Filename: 'invoice.pdf', Size: 12 * KiB, MIMEType: 'application/pdf', Path: [2], ...over });

/** The header's controls, in order, by what each one is. */
const actions = (el: HTMLElement) =>
  [...shadow(el, '.attachments-header .attachments-actions').children].map((child) =>
    child.classList.contains('attachments-size') ? 'size'
      : child.classList.contains('download-all-btn') ? 'download'
        : child.classList.contains('caret') ? 'caret' : child.className);

describe("the composer's size figure", () => {
  const tray = (props: Record<string, unknown> = {}) =>
    mount('alps-attachment-list', {
      attachments: [{ filename: 'a.pdf', size: 4 * MiB }],
      composerMode: true,
      totalBytes: 4 * MiB,
      maxBytes: 32 * MiB,
      ...props,
    });

  it('shows the total against the budget, left of the caret', async () => {
    const el = await tray();
    expect(text(el, '.attachments-size').trim()).toBe('4 MB / 32 MB');
    expect(shadow(el, '.attachments-size').classList.contains('over')).toBe(false);
    expect(actions(el)).toEqual(['size', 'caret']);
  });

  it('turns to an error past the budget', async () => {
    const el = await tray({ totalBytes: 40 * MiB });
    expect(text(el, '.attachments-size').trim()).toBe('40 MB / 32 MB');
    expect(shadow(el, '.attachments-size').classList.contains('over')).toBe(true);
  });

  it('follows the files as they come and go', async () => {
    const el = await tray();
    await update(el, { totalBytes: 6 * MiB });
    expect(text(el, '.attachments-size').trim()).toBe('6 MB / 32 MB');
  });
});

describe("a received message's size figure", () => {
  it('adds up the parts, left of download-all and the caret', async () => {
    const el = await mount('alps-attachment-list', {
      attachments: [stored(), stored({ Filename: 'scan.pdf', Size: 20 * KiB, Path: [3] })],
      messageUid: '7',
    });
    expect(text(el, '.attachments-size').trim()).toBe('32 KB');
    expect(shadow(el, '.attachments-size').classList.contains('over')).toBe(false);
    expect(actions(el)).toEqual(['size', 'download', 'caret']);
  });

  it('says nothing where no part reports a size', async () => {
    const el = await mount('alps-attachment-list', { attachments: [stored({ Size: 0 })], messageUid: '7' });
    expect(el.shadowRoot!.querySelector('.attachments-size')).toBeNull();
  });
});
