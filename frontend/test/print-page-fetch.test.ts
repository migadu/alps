/**
 * The print page prints the message it is opened for, cached or not.
 *
 * It looked for the reader's cached copy of the HTML view only, and on a miss
 * read `GET /mailboxes/{mbox}/messages/{uid}` as if it answered a bare
 * message. That answer wraps the message (`{ Message, Part, … }`), so the
 * page found no envelope and no structure: it printed "(No Subject)",
 * "Unknown Sender" and an empty body. A miss is common: reading in plain
 * text caches the text view only, and a large message or an expired entry
 * is not cached at all.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/pages/print-page';
import { cleanup, mount, shadow, text, waitFor } from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });
const settingsStore = Object.assign(new EventTarget(), {
  getState: () => ({ showRemoteContent: 'never', preferredView: 'html', dateFormat: 'YYYY-MM-DD', hourFormat: '24' }),
});

// As the server sends it: the structure is go-imap's (Type and Subtype, no
// MIMEType), and the part to show is the server's choice in `Part`.
const message = {
  UID: '7',
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: {
    Subject: 'Quarterly report',
    Date: '2026-09-01T10:00:00Z',
    From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.test' }],
    To: [{ Name: '', Mailbox: 'me', Host: 'example.test' }],
    Cc: [],
  },
  BodyStructure: {
    Subtype: 'alternative',
    Children: [
      { Type: 'text', Subtype: 'plain', Params: { charset: 'utf-8' }, Encoding: '7bit', Size: 20 },
      { Type: 'text', Subtype: 'html', Params: { charset: 'utf-8' }, Encoding: '7bit', Size: 40 },
    ],
  },
};

const answer = {
  Message: message,
  Part: { Path: [2], MIMEType: 'text/html', Params: { charset: 'utf-8' } },
  Attachments: [],
  HasHTML: true,
  HasText: true,
};

let requests: string[] = [];

beforeEach(() => {
  requests = [];
  window.location.hash = '#/print?mailbox=INBOX&uid=7';
  // The page opens the print dialog once it has rendered; jsdom has none.
  vi.spyOn(window, 'print').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  MessageCache.clear();
  window.location.hash = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function serve(routes: Record<string, () => Response>) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    requests.push(url);
    const route = Object.keys(routes).find((path) => url === path);
    return route ? routes[route]() : new Response('not found', { status: 404 });
  }));
}

async function open(): Promise<El> {
  const el = await mount<El>('print-page', { settingsStore, i18nStore });
  await waitFor(() => !el.loading, 'the print page to finish loading');
  await el.updateComplete;
  return el;
}

describe('the print page, for a message the cache does not hold', () => {
  it('prints its subject, sender and the HTML part the server picked', async () => {
    serve({
      '/mailboxes/INBOX/messages/7?view=html': () => Response.json(answer),
      '/mailboxes/INBOX/messages/7': () => Response.json(answer),
      '/mailboxes/INBOX/messages/7/raw?part=1': () => new Response('the plain alternative'),
      '/mailboxes/INBOX/messages/7/raw?part=2': () => new Response('<p>The HTML body</p>'),
    });
    const el = await open();

    expect(text(el, '.print-header h2')).toBe('Quarterly report');
    expect(text(el, '.print-meta-row')).toContain('Ada');
    expect(text(el, '.print-meta-row')).toContain('ada@example.test');
    expect(text(el, '.print-to-row')).toContain('me@example.test');
    const frame = shadow<HTMLIFrameElement>(el, '.print-body iframe');
    expect(frame.srcdoc).toContain('The HTML body');
    expect(requests).toContain('/mailboxes/INBOX/messages/7?view=html');
    expect(requests).toContain('/mailboxes/INBOX/messages/7/raw?part=2');
  });

  it('prints the text part when the message has no HTML', async () => {
    const textOnly = {
      ...answer,
      Message: { ...message, BodyStructure: { Type: 'text', Subtype: 'plain', Params: { charset: 'utf-8' }, Encoding: '7bit', Size: 20 } },
      Part: { Path: [1], MIMEType: 'text/plain', Params: { charset: 'utf-8' } },
      HasHTML: false,
    };
    serve({
      '/mailboxes/INBOX/messages/7?view=html': () => Response.json(textOnly),
      '/mailboxes/INBOX/messages/7': () => Response.json(textOnly),
      '/mailboxes/INBOX/messages/7/raw?part=1': () => new Response('Just text'),
    });
    const el = await open();

    expect(text(el, '.print-header h2')).toBe('Quarterly report');
    expect(text(el, '.print-body pre')).toBe('Just text');
    expect(requests).toContain('/mailboxes/INBOX/messages/7?view=html');
  });

  it('says there is no readable text when the message has no text part', async () => {
    const noText = {
      ...answer,
      Message: { ...message, BodyStructure: { Type: 'image', Subtype: 'png', Encoding: 'base64', Size: 2000 } },
      Part: null,
      HasHTML: false,
      HasText: false,
    };
    serve({
      '/mailboxes/INBOX/messages/7?view=html': () => Response.json(noText),
      '/mailboxes/INBOX/messages/7': () => Response.json(noText),
    });
    const el = await open();

    expect(text(el, '.print-header h2')).toBe('Quarterly report');
    expect(text(el, '.print-body')).toBe('messageReader.noReadableText');
    expect(requests).toContain('/mailboxes/INBOX/messages/7?view=html');
    expect(requests.some((url) => url.includes('/raw'))).toBe(false);
  });

  // A single-part message whose one part is text, but neither the plain nor
  // the HTML body the server looks for (a bare calendar invitation, or text
  // sent as an attachment), is answered with the whole message as its part,
  // and that has no path. Its body is part 1.
  it('prints a single-part message whose part has no path as part 1', async () => {
    const invitation = {
      ...answer,
      Message: { ...message, BodyStructure: { Type: 'text', Subtype: 'calendar', Params: { charset: 'utf-8', method: 'REQUEST' }, Encoding: '7bit', Size: 60 } },
      Part: { Path: null, MIMEType: 'text/calendar', Params: { charset: 'utf-8', method: 'REQUEST' } },
      HasHTML: false,
      HasText: false,
    };
    serve({
      '/mailboxes/INBOX/messages/7?view=html': () => Response.json(invitation),
      '/mailboxes/INBOX/messages/7/raw?part=1': () => new Response('BEGIN:VCALENDAR\nMETHOD:REQUEST\nEND:VCALENDAR'),
    });
    const el = await open();

    expect(el.error).toBe('');
    expect(text(el, '.print-header h2')).toBe('Quarterly report');
    expect(text(el, '.print-body pre')).toContain('BEGIN:VCALENDAR');
    expect(requests).toContain('/mailboxes/INBOX/messages/7/raw?part=1');
  });
});

describe('the print page, for a message whose body the reader could not read', () => {
  // The reader caches a read whose body request failed, with the message and
  // its part and no body. Taken as a hit, it printed the header over nothing.
  it('asks the server for the body the cached entry lacks', async () => {
    serve({
      '/mailboxes/INBOX/messages/7?view=html': () => Response.json(answer),
      '/mailboxes/INBOX/messages/7/raw?part=2': () => new Response('<p>The HTML body</p>'),
    });
    MessageCache.set('INBOX', '7', 'html', {
      Message: message,
      Part: answer.Part,
      Attachments: [],
      HasHTML: true,
      HasText: true,
    });
    const el = await open();

    expect(el.error).toBe('');
    expect(text(el, '.print-header h2')).toBe('Quarterly report');
    const frame = shadow<HTMLIFrameElement>(el, '.print-body iframe');
    expect(frame.srcdoc).toContain('The HTML body');
    expect(requests).toContain('/mailboxes/INBOX/messages/7/raw?part=2');
  });
});

describe('the print page, for a message read in plain text', () => {
  it('prints the text view the reader cached, without asking the server', async () => {
    serve({});
    MessageCache.set('INBOX', '7', 'text', {
      Message: message,
      Part: { Path: [1], MIMEType: 'text/plain' },
      Attachments: [],
      RawText: 'the plain alternative',
      HasHTML: true,
      HasText: true,
    });
    const el = await open();

    expect(el.error).toBe('');
    expect(text(el, '.print-header h2')).toBe('Quarterly report');
    expect(text(el, '.print-body pre')).toBe('the plain alternative');
    expect(requests).toEqual([]);
  });
});
