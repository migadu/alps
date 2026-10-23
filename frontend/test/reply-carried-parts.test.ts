/**
 * The original's parts a reply and a forward carry.
 *
 * A reply carries the parts its quote shows by Content-ID, so that its
 * `cid:` images still show, and the composer leaves them out of its chips.
 * Every part with a Content-ID was carried that way, whatever its
 * disposition. Exchange gives an ordinary attachment a Content-ID too: the
 * reader lists such a file as an attachment, and Reply took it along unseen,
 * the composer showing no attachment and the recipients getting the file
 * again. A forward carries the attachments as chips.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import { cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, waitFor } from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

// The chart is the body's own image; the logo is one too, filed as an
// attachment, as Outlook and Apple Mail file theirs; the report is a file
// that names itself by Content-ID, as Exchange's do.
const html = '<p>Figures below.</p><img src="cid:chart@remote.test"><img src="cid:logo@remote.test">';
const part = (name: string, type: string, disposition: string, extra: Record<string, unknown> = {}) => ({
  Type: type.split('/')[0], Subtype: type.split('/')[1], ID: `<${name.split('.')[0]}@remote.test>`, Encoding: 'base64', Size: 400,
  Params: { name }, Extended: { Disposition: { Value: disposition, Params: { filename: name } } }, ...extra,
});
const structure = {
  Type: 'multipart', Subtype: 'mixed',
  Children: [
    { Type: 'multipart', Subtype: 'related', Children: [{ Type: 'text', Subtype: 'html' }, part('chart.png', 'image/png', 'inline')] },
    part('logo.png', 'image/png', 'attachment'),
    part('report.pdf', 'application/pdf', 'attachment'),
  ],
};
// What the server lists as the message's attachments: every part filed as one.
const listed = [
  { Filename: 'logo.png', MIMEType: 'image/png', Size: 291, Path: [2] },
  { Filename: 'report.pdf', MIMEType: 'application/pdf', Size: 291, Path: [3] },
];

const message = {
  UID: '5',
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  BodyStructure: structure,
  Envelope: {
    Subject: 'Figures',
    Date: '2026-09-01T10:00:00Z',
    From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'remote.test' }],
    To: [{ Name: '', Mailbox: 'me', Host: 'example.test' }],
    Cc: [],
    MessageID: '5@remote.test',
  },
};

function settingsStore() {
  const state = { enableThreading: true, preferredView: 'html', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
  MessageCache.set('INBOX', '5', 'html', {
    Message: message, Part: { Path: [1, 1], MIMEType: 'text/html' }, Attachments: listed,
    RawHtml: html, HasHTML: true, HasText: false,
  });
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** What the composer is opened with for `action` on the message. */
async function answer(action: string): Promise<{ name: string; partPath: string; inline?: boolean }[]> {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  const openComposer = vi.fn();
  const el = await mount<El>('alps-message-reader', {
    settingsStore: settingsStore(),
    i18nStore,
    composeStore: { openComposer },
    mailbox: 'INBOX',
    mailboxes: [{ Name: 'INBOX', Attrs: [] }],
    messages: [message],
    message,
  });
  await waitFor(() => el.rawMessageHtml === html, 'the HTML body');
  void el._handleAction(action);
  await waitFor(() => openComposer.mock.calls.length > 0, 'the composer to open');
  return openComposer.mock.calls[0][0].attachments.map((a: any) => ({
    name: a.name, partPath: a.partPath, ...(a.inline && { inline: true }),
  }));
}

describe('the parts an answer carries', () => {
  for (const action of ['reply', 'replyAll']) {
    it(`${action} carries the images its quote shows, and no file`, async () => {
      expect(await answer(action)).toEqual([
        { name: 'chart.png', partPath: '1.2', inline: true },
        { name: 'logo.png', partPath: '2', inline: true },
      ]);
    });
  }

  it('forward carries the files as files, and the images its quote shows', async () => {
    expect(await answer('forward')).toEqual([
      { name: 'logo.png', partPath: '2' },
      { name: 'report.pdf', partPath: '3' },
      { name: 'chart.png', partPath: '1.2', inline: true },
    ]);
  });
});
