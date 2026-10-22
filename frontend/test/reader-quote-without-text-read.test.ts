/**
 * Reply, Reply all, Forward and Edit draft on an HTML message open the
 * composer from the body the reader already holds.
 *
 * Each of them first asked the server for the message again in its text view
 * (`?view=text`), to quote a `RawText` that answer never carries, and only
 * then fell back to the HTML on screen. The composer waited for that answer,
 * which comes behind everything else the session's one IMAP connection is
 * doing, and the quote was the HTML's text all the same.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import { cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, waitFor } from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const html = '<p>The <b>engine</b> runs on cards.</p>';

const message = (uid: string, flags: string[] = ['\\Seen']) => ({
  UID: uid,
  Mailbox: 'INBOX',
  Flags: flags,
  Envelope: {
    Subject: 'Engines',
    Date: '2026-09-01T10:00:00Z',
    From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'remote.test' }],
    To: [{ Name: '', Mailbox: 'me', Host: 'example.test' }],
    Cc: [],
    MessageID: `${uid}@remote.test`,
  },
});

function settingsStore() {
  const state = { enableThreading: true, preferredView: 'html', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

let asked: string[];
/** Answers held open for good: a request the reader waits on never comes back. */
let held: (() => void)[];

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  asked = [];
  held = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url);
    asked.push(u);
    if (u.includes('?view=text')) {
      await new Promise<void>(resolve => held.push(resolve));
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  }));
  // The body as the reader read it on opening: HTML, with a text alternative.
  for (const uid of ['5', '6']) {
    MessageCache.set('INBOX', uid, 'html', {
      Message: message(uid), Part: { Path: [2], MIMEType: 'text/html' }, Attachments: [],
      RawHtml: html, HasHTML: true, HasText: true,
    });
  }
});

afterEach(() => {
  for (const resolve of held) resolve();
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function open(msg: any, mailbox = 'INBOX'): Promise<{ el: El; openComposer: ReturnType<typeof vi.fn> }> {
  const openComposer = vi.fn();
  const el = await mount<El>('alps-message-reader', {
    settingsStore: settingsStore(),
    i18nStore,
    composeStore: { openComposer },
    mailbox,
    mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Drafts', Attrs: ['\\Drafts'] }],
    messages: [msg],
    message: msg,
  });
  await waitFor(() => el.mimeType === 'text/html' && el.rawMessageHtml === html, 'the HTML body');
  return { el, openComposer };
}

const textReads = () => asked.filter(url => url.includes('?view=text'));

describe('answering an HTML message', () => {
  for (const action of ['reply', 'replyAll', 'forward']) {
    it(`${action} from the toolbar opens the composer with the body on screen`, async () => {
      const { el, openComposer } = await open(message('5'));

      void el._handleAction(action);
      await waitFor(() => openComposer.mock.calls.length > 0, 'the composer to open');

      expect(textReads()).toEqual([]);
      const opened = openComposer.mock.calls[0][0];
      expect(opened.text).toContain('The engine runs on cards.');
      expect(opened.html).toContain('<b>engine</b>');
    });
  }

  it('reply to a plain-text message quotes its text', async () => {
    MessageCache.set('INBOX', '5', 'html', {
      Message: message('5'), Part: { Path: [1], MIMEType: 'text/plain' }, Attachments: [],
      RawText: 'The engine runs on cards.', HasHTML: false, HasText: true,
    });
    const openComposer = vi.fn();
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore: { openComposer },
      mailbox: 'INBOX',
      mailboxes: [{ Name: 'INBOX', Attrs: [] }],
      messages: [message('5')],
      message: message('5'),
    });
    await waitFor(() => el.mimeType === 'text/plain' && !el.loading, 'the text body');

    void el._handleAction('reply');
    await waitFor(() => openComposer.mock.calls.length > 0, 'the composer to open');

    expect(textReads()).toEqual([]);
    expect(openComposer.mock.calls[0][0].text).toContain('The engine runs on cards.');
  });

  it("reply from a card opens the composer with the card's body", async () => {
    const { el, openComposer } = await open(message('5'));
    const item = el.threadItems[0];

    void el._handleActionForItem('reply', item);
    await waitFor(() => openComposer.mock.calls.length > 0, 'the composer to open');

    expect(textReads()).toEqual([]);
    expect(openComposer.mock.calls[0][0].text).toContain('The engine runs on cards.');
  });
});

describe('editing an HTML draft', () => {
  it('opens the composer with the draft on screen', async () => {
    const draft = { ...message('6', ['\\Seen', '\\Draft']), Mailbox: 'Drafts' };
    MessageCache.set('Drafts', '6', 'html', {
      Message: draft, Part: { Path: [2], MIMEType: 'text/html' }, Attachments: [],
      RawHtml: html, HasHTML: true, HasText: true,
    });
    const { el, openComposer } = await open(draft, 'Drafts');

    void el._handleEditDraft();
    await waitFor(() => openComposer.mock.calls.length > 0, 'the composer to open');

    expect(textReads()).toEqual([]);
    const opened = openComposer.mock.calls[0][0];
    expect(opened.draftUid).toBe('6');
    expect(opened.text).toContain('The engine runs on cards.');
    expect(opened.html).toBe(html);
  });
});

// The actions are on screen while the body is still being read, and they
// take their text from the body the reader holds. Taken at once, a click
// before the body landed quoted nothing, a forward lost the original's
// attachments, and an edited draft opened empty, to be saved over the draft.
describe('clicked while the body is still being read', () => {
  const attachment = { Filename: 'minutes.pdf', Size: 3, MIMEType: 'application/pdf', Path: [3] };
  /** The messages the server answers for, by UID. */
  let stored: Record<string, any>;
  let releaseBodies: () => void;

  beforeEach(() => {
    // Nothing read yet: the bodies are asked for, and held behind a busy
    // connection until the test lets them go.
    MessageCache.clear();
    stored = {};
    const bodies = new Promise<void>(resolve => { releaseBodies = resolve; });
    held.push(() => releaseBodies());
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const u = String(url);
      asked.push(u);
      const read = u.match(/\/messages\/(\d+)\?view=html$/);
      if (read && stored[read[1]]) {
        await bodies;
        return new Response(JSON.stringify({
          Message: stored[read[1]], Part: { Path: [2], MIMEType: 'text/html' }, Attachments: [attachment],
          HasHTML: true, HasText: true,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (u.includes('/raw?part=2')) return new Response(html, { status: 200 });
      return new Response('{}', { status: 404 });
    }));
  });

  async function openLoading(open: any, messages: any[], mailbox = 'INBOX') {
    for (const m of [open, ...messages, ...messages.flatMap(m => m.SubMessages || [])]) stored[m.UID] = m;
    const openComposer = vi.fn();
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore: { openComposer },
      mailbox,
      mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Drafts', Attrs: ['\\Drafts'] }],
      messages,
      message: open,
    });
    await waitFor(() => asked.some(url => url.endsWith(`/messages/${open.UID}?view=html`)), 'the body to be asked for');
    expect(el.loading).toBe(true);
    return { el, openComposer };
  }

  async function opened(openComposer: ReturnType<typeof vi.fn>) {
    releaseBodies();
    await waitFor(() => openComposer.mock.calls.length > 0, 'the composer to open');
    return openComposer.mock.calls[0][0];
  }

  it('reply from the toolbar quotes the body', async () => {
    const { el, openComposer } = await openLoading(message('5'), [message('5')]);

    void el._handleAction('reply');
    const composed = await opened(openComposer);

    expect(composed.text).toContain('The engine runs on cards.');
    expect(composed.html).toContain('<b>engine</b>');
  });

  it("forward from the toolbar quotes the body and carries the original's attachments", async () => {
    const { el, openComposer } = await openLoading(message('5'), [message('5')]);

    void el._handleAction('forward');
    const composed = await opened(openComposer);

    expect(composed.text).toContain('The engine runs on cards.');
    expect(composed.attachments.map((a: any) => a.name)).toContain('minutes.pdf');
  });

  it("forward from the message's card carries its attachments", async () => {
    const { el, openComposer } = await openLoading(message('5'), [message('5')]);

    void el._handleActionForItem('forward', el.threadItems[0]);
    const composed = await opened(openComposer);

    expect(composed.text).toContain('The engine runs on cards.');
    expect(composed.attachments.map((a: any) => a.name)).toContain('minutes.pdf');
  });

  it('reply under the conversation quotes the newest message', async () => {
    const newest = { ...message('6'), Envelope: { ...message('6').Envelope, Date: '2026-09-02T10:00:00Z' } };
    const conversation = { ...message('5'), SubMessages: [newest] };
    const { el, openComposer } = await openLoading(newest, [conversation]);
    expect(el.threadItems).toHaveLength(2);

    void el.answerNewest('reply');
    const composed = await opened(openComposer);

    expect(composed.text).toContain('The engine runs on cards.');
  });

  it('edit draft opens the draft, not an empty composer', async () => {
    const draft = { ...message('6', ['\\Seen', '\\Draft']), Mailbox: 'Drafts' };
    const { el, openComposer } = await openLoading(draft, [draft], 'Drafts');

    void el._handleEditDraft();
    const composed = await opened(openComposer);

    expect(composed.draftUid).toBe('6');
    expect(composed.html).toBe(html);
    expect(composed.text).toContain('The engine runs on cards.');
  });

  // The list's row has no References: only the read of the message brings
  // them. A reply's draft edited from the row as it was before its read
  // landed lost them, and was saved and sent without them.
  const editDraftFrom = {
    toolbar: (el: El) => el._handleEditDraft(),
    'its card': (el: El) => el._handleEditDraft(el.threadItems[0]),
  };
  for (const [from, editDraft] of Object.entries(editDraftFrom)) {
    it(`edit draft from ${from} keeps the References its read brings`, async () => {
      const references = ['<4@remote.test>', '<5@remote.test>'];
      const draft = { ...message('6', ['\\Seen', '\\Draft']), Mailbox: 'Drafts' };
      const { el, openComposer } = await openLoading(draft, [draft], 'Drafts');
      // The server's copy, answered once the read is let go.
      stored['6'] = { ...draft, References: references };

      void editDraft(el);
      const composed = await opened(openComposer);

      expect(composed.draftUid).toBe('6');
      expect(composed.references).toEqual(references);
    });
  }
});
