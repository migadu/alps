/**
 * Edit Draft opens a draft in the format it was saved in.
 *
 * It opened every draft in the compose format of the settings, and with the
 * HTML the reader held: an HTML draft opened in plain text, and one read in
 * the text view, as "Prefer plain text" reads mail, came with no HTML at all,
 * so its first save stored it without its formatting. A plain-text draft
 * opened in HTML was given an HTML part it never had.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import { cleanup, installMatchMedia, installResizeObserver, installScrollIntoView, mount, record, waitFor } from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const html = '<p>Hi <b>Ada</b>,</p><p>the figures are in.</p>';
const text = 'Hi Ada,\n\nthe figures are in.';

const draft = {
  UID: '7',
  Mailbox: 'Drafts',
  Flags: ['\\Seen', '\\Draft'],
  Envelope: {
    Subject: 'Figures',
    Date: '2026-09-01T10:00:00Z',
    From: [{ Name: '', Mailbox: 'me', Host: 'example.test' }],
    To: [{ Name: 'Ada', Mailbox: 'ada', Host: 'remote.test' }],
    Cc: [],
  },
};

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

/** Whether the server answers the draft's HTML view. */
let htmlAnswers: boolean;
let asked: string[];

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  htmlAnswers = true;
  asked = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    asked.push(String(url));
    if (htmlAnswers && String(url).startsWith('/mailboxes/Drafts/messages/7?view=html')) {
      return new Response(JSON.stringify({
        Message: draft, Part: { Path: [2], MIMEType: 'text/html' }, Body: html, HasHTML: true, HasText: true,
      }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  }));
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** The composer Edit Draft opens, with the settings and the read the reader has. */
async function draftReader(settings: Record<string, unknown>, read: 'html' | 'text' | 'plain draft') {
  const view = read === 'html' ? 'html' : 'text';
  MessageCache.set('Drafts', '7', view, read === 'html'
    ? { Message: draft, Part: { Path: [2], MIMEType: 'text/html' }, Attachments: [], RawHtml: html, HasHTML: true, HasText: true }
    : { Message: draft, Part: { Path: [1], MIMEType: 'text/plain' }, Attachments: [], RawText: text, HasHTML: read === 'text', HasText: true });
  const state = { enableThreading: true, preferredView: view, showRemoteContent: 'never', showSenderAvatars: true, ...settings };
  const openComposer = vi.fn();
  const el = await mount<El>('alps-message-reader', {
    settingsStore: Object.assign(new EventTarget(), { getState: () => state }),
    i18nStore,
    composeStore: { openComposer },
    mailbox: 'Drafts',
    mailboxes: [{ Name: 'Drafts', Attrs: ['\\Drafts'] }],
    messages: [draft],
    message: draft,
  });
  await waitFor(() => !el.loading && el.threadItems.length > 0, 'the draft');
  return { el, openComposer };
}

async function editDraft(settings: Record<string, unknown>, read: 'html' | 'text' | 'plain draft') {
  const { el, openComposer } = await draftReader(settings, read);
  await el._handleEditDraft();
  return openComposer;
}

describe('Edit Draft', () => {
  it('opens an HTML draft in HTML, whatever the compose format', async () => {
    const openComposer = await editDraft({ composeFormat: 'text' }, 'html');
    expect(openComposer.mock.calls[0][0]).toMatchObject({ format: 'html', html });
  });

  it('opens a plain-text draft in plain text, whatever the compose format', async () => {
    const openComposer = await editDraft({ composeFormat: 'html' }, 'plain draft');
    expect(openComposer.mock.calls[0][0]).toMatchObject({ format: 'text', text, html: '' });
  });

  it('reads the HTML of a draft the reader shows as text, and opens it in HTML', async () => {
    const openComposer = await editDraft({ composeFormat: 'html' }, 'text');
    expect(openComposer.mock.calls[0][0]).toMatchObject({ format: 'html', html, text });
    expect(asked.filter(url => url.includes('?view=html'))).toHaveLength(1);
  });

  it('opens nothing, and says so, when that HTML cannot be read', async () => {
    htmlAnswers = false;
    const toasts = record<CustomEvent>(window, 'show-toast');
    const openComposer = await editDraft({ composeFormat: 'html' }, 'text');
    expect(openComposer).not.toHaveBeenCalled();
    expect(toasts.map(e => e.detail.message)).toEqual(['messageReader.loadError']);
  });
});


describe('an HTML draft read only for Edit Draft', () => {
  it.each(['disconnect', 'account change', 'another message', 'deleted card'])('does not reopen a draft after %s', async (departure) => {
    const { el, openComposer } = await draftReader({ composeFormat: 'html' }, 'text');
    let finish!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
    const editing = el._handleEditDraft();
    await waitFor(() => !!finish, 'the pending HTML read');

    if (departure === 'disconnect') el.remove();
    if (departure === 'account change') MessageCache.clear();
    if (departure === 'another message') {
      const next = { ...draft, UID: '8' };
      MessageCache.set('Drafts', '8', 'text', { Message: next, Part: { Path: [1], MIMEType: 'text/plain' }, Attachments: [], RawText: 'another draft', HasHTML: false, HasText: true });
      el.message = next;
      await el.updateComplete;
    }
    if (departure === 'deleted card') el.dropCard(el.itemKey(el.threadItems[0]));
    finish(new Response(JSON.stringify({ Part: { Path: [2], MIMEType: 'text/html' }, Body: html }), { status: 200 }));
    await editing;

    expect(openComposer).not.toHaveBeenCalled();
  });

  it('does not announce a stale HTML failure after leaving the reader', async () => {
    const { el, openComposer } = await draftReader({ composeFormat: 'html' }, 'text');
    let finish!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
    const toasts = record<CustomEvent>(window, 'show-toast');
    const editing = el._handleEditDraft();
    await waitFor(() => !!finish, 'the pending HTML read');
    el.remove();
    finish(new Response('{}', { status: 404 }));
    await editing;

    expect(openComposer).not.toHaveBeenCalled();
    expect(toasts).toHaveLength(0);
  });
});
