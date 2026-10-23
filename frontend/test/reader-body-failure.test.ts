/**
 * A message whose body could not be read.
 *
 * The reader reads a message in two requests, the metadata and then the body
 * part. A body request that answered an error (a 500, a 502 from a proxy) was
 * skipped without a word: the reader showed the message as having no readable
 * text, and the empty result went into the session's message cache. For the
 * next 30 minutes every reopen was served from there, empty, and never asked
 * the server again, even once it had recovered; the print page printed it
 * empty too.
 *
 * A failed body read now says so and offers to try again, and only a body
 * that was read (or a message with no text part to read) is cached.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/message-reader';
import {
  cleanup, click, flush, installMatchMedia, installResizeObserver, installScrollIntoView, mount, record, shadow, shadowAll, text, waitFor,
} from './helpers/dom';
import { MessageCache } from '../src/utils/message-cache';

type El = HTMLElement & Record<string, any>;

const envelope = (subject: string, date: string, from: string) => ({
  Subject: subject,
  Date: date,
  From: [{ Name: '', Mailbox: from, Host: 'example.com' }],
  To: [],
  Cc: [],
});

const message = {
  UID: '7',
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: { ...envelope('Engines', '2026-09-01T10:00:00Z', 'charles'), MessageID: 'engines@example.com' },
};

// A reply in Sent, so the message opens as a conversation of two cards.
const reply = {
  UID: '9',
  Mailbox: 'Sent',
  Flags: ['\\Seen'],
  Envelope: { ...envelope('Re: Engines', '2026-09-02T10:00:00Z', 'ada'), MessageID: 'reply@example.com', InReplyTo: 'engines@example.com' },
};

// A draft, saved with its text and a file.
const draft = {
  UID: '5',
  Mailbox: 'Drafts',
  Flags: ['\\Seen', '\\Draft'],
  Envelope: { ...envelope('Figures', '2026-09-03T10:00:00Z', 'ada'), To: [{ Name: '', Mailbox: 'charles', Host: 'example.com' }] },
};

function settingsStore() {
  const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
  return Object.assign(new EventTarget(), { getState: () => state });
}

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

/** What the server answers a body request with, by mailbox: a status, or 200 with the body. */
let bodyStatus: Record<string, number>;
let conversation: boolean;
let textPart: boolean;
let bodyReads: string[];
/** A mailbox whose next body request is held until the test answers it. */
let holdNext: string | null;
let release: ((response: Response) => void) | null;
const attachments = [{ Filename: 'figures.csv', MIMEType: 'text/csv', Size: 120, Path: [2] }];

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  bodyStatus = { INBOX: 500, Sent: 200 };
  conversation = false;
  textPart = true;
  bodyReads = [];
  holdNext = null;
  release = null;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = String(url);
    if (u.startsWith('/mailboxes/INBOX/messages/7/thread')) {
      return conversation ? json({ Messages: [message, reply] }) : new Response('{}', { status: 404 });
    }
    const raw = /^\/mailboxes\/(\w+)\/messages\/\d+\/raw/.exec(u);
    if (raw) {
      bodyReads.push(raw[1]);
      if (holdNext === raw[1]) {
        holdNext = null;
        return new Promise<Response>((resolve) => { release = resolve; });
      }
      const status = bodyStatus[raw[1]];
      return status === 200 ? new Response(`the ${raw[1]} body`, { status }) : new Response('Bad Gateway', { status });
    }
    const metadata = /^\/mailboxes\/(\w+)\/messages\/(\d+)\?/.exec(u);
    if (metadata) {
      const msg = { Sent: reply, Drafts: draft }[metadata[1]] ?? message;
      return json({ Message: msg, Part: textPart ? { Path: [1], MIMEType: 'text/plain' } : null, HasText: textPart, Attachments: attachments });
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

async function open(msg = message, composeStore: unknown = new EventTarget()): Promise<El> {
  const el = await mount<El>('alps-message-reader', {
    settingsStore: settingsStore(),
    i18nStore,
    composeStore,
    mailbox: msg.Mailbox,
    mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Sent', Attrs: ['\\Sent'] }, { Name: 'Drafts', Attrs: ['\\Drafts'] }],
    messages: [msg],
    message: msg,
  });
  // Set as the read starts, which the first render does.
  await waitFor(() => !el.loading, 'the read');
  await el.updateComplete;
  return el;
}

describe('a body the server failed to send', () => {
  it('is not cached, so the message opened again asks the server again', async () => {
    await open();
    cleanup();

    bodyStatus.INBOX = 200;
    const el = await open();

    expect(bodyReads).toEqual(['INBOX', 'INBOX']);
    expect(text(el, 'pre.reader-preformatted')).toBe('the INBOX body');
    expect(MessageCache.get('INBOX', '7', 'text')?.RawText).toBe('the INBOX body');
  });

  it('says it could not be read, and reads it again on Try again', async () => {
    const el = await open();

    expect(text(el, '.reader-load-error')).toContain('messageReader.loadError');
    expect(shadowAll(el, '.reader-empty-body'), 'shown as a message with no text').toHaveLength(0);
    expect(MessageCache.get('INBOX', '7', 'text')).toBeNull();

    bodyStatus.INBOX = 200;
    await click(shadow(el, '.reader-load-error alps-button'), el);
    await waitFor(() => !el.loading && !!el.shadowRoot!.querySelector('pre.reader-preformatted'), 'the body');

    expect(text(el, 'pre.reader-preformatted')).toBe('the INBOX body');
    expect(shadowAll(el, '.reader-load-error')).toHaveLength(0);
  });

  it('keeps what the metadata said: the attachments are still listed', async () => {
    const el = await open();

    expect(shadowAll(el, '.reader-load-error')).toHaveLength(1);
    expect(el.attachments).toEqual(attachments);
    expect(shadowAll(el, 'alps-attachment-list.desktop-attachments')).toHaveLength(1);
    expect(el.hasText).toBe(true);
  });

  it('is read again when the view is switched', async () => {
    const el = await open();
    bodyStatus.INBOX = 200;

    await el._handleAction('showHtml');
    await el.updateComplete;

    expect(bodyReads).toEqual(['INBOX', 'INBOX']);
    expect(text(el, 'pre.reader-preformatted')).toBe('the INBOX body');
  });

  it('on a conversation card, is offered again on that card', async () => {
    conversation = true;
    bodyStatus = { INBOX: 200, Sent: 502 };
    const el = await open();
    await waitFor(() => shadowAll(el, 'alps-thread-card').length === 2, 'the conversation cards');
    const card = () => shadowAll<El>(el, 'alps-thread-card')[1];
    // The cards take their strings from the app's context, which this test has none of.
    card().i18nStore = i18nStore;

    await el.toggleItemExpansion(card().item);
    await el.updateComplete;
    await card().updateComplete;
    expect(text(card(), '.reader-load-error')).toContain('messageReader.loadError');
    expect(MessageCache.get('Sent', '9', 'text')).toBeNull();

    bodyStatus.Sent = 200;
    await click(shadow(card(), '.reader-load-error alps-button'), card());
    await waitFor(() => !!card().shadowRoot!.querySelector('pre.reader-preformatted'), "the card's body");
    expect(text(card(), 'pre.reader-preformatted')).toBe('the Sent body');
  });
});

describe('a message with no text part', () => {
  it('is cached, as there is nothing more to read', async () => {
    textPart = false;
    const el = await open();
    expect(bodyReads).toEqual([]);
    expect(MessageCache.get('INBOX', '7', 'text')).not.toBeNull();
    expect(shadowAll(el, '.reader-load-error')).toHaveLength(0);
  });
});

// The draft banner's Edit draft, and the toolbar's, stay above the load
// error. Edit draft opened the composer with the body the reader held, none,
// under the stored draft's UID, and the composer's first save replaced the
// draft, its text and its file, with what had been typed since.
describe('Edit draft on a draft whose body failed to load', () => {
  const editDraftFrom = {
    'the banner': (el: El) => el._handleEditDraft(),
    'its card': (el: El) => el._handleEditDraft(el.threadItems[0]),
  };

  for (const [from, editDraft] of Object.entries(editDraftFrom)) {
    it(`from ${from}, reads the body again and opens the draft as it is stored`, async () => {
      bodyStatus.Drafts = 500;
      const composeStore = { openComposer: vi.fn() };
      const el = await open(draft, composeStore);
      expect(shadowAll(el, '.reader-load-error')).toHaveLength(1);

      bodyStatus.Drafts = 200;
      await editDraft(el);

      expect(composeStore.openComposer).toHaveBeenCalledTimes(1);
      expect(composeStore.openComposer.mock.calls[0][0]).toMatchObject({
        draftUid: '5', text: 'the Drafts body', attachments: [expect.objectContaining({ name: 'figures.csv', partPath: '2' })],
      });
      expect(bodyReads).toEqual(['Drafts', 'Drafts']);
    });

    it(`from ${from}, says so and opens no composer when the body still cannot be read`, async () => {
      bodyStatus.Drafts = 500;
      const composeStore = { openComposer: vi.fn() };
      const el = await open(draft, composeStore);
      const toasts = record<CustomEvent>(window, 'show-toast');

      await editDraft(el);

      expect(composeStore.openComposer).not.toHaveBeenCalled();
      expect(bodyReads).toEqual(['Drafts', 'Drafts']);
      expect(toasts.map(e => e.detail.message)).toEqual(['messageReader.loadError']);
      await el.updateComplete;
      expect(shadowAll(el, '.reader-load-error')).toHaveLength(1);
    });
  }
});

// Reply, Reply All and Forward stay on screen above the load error too, and
// took the body the reader held, none: a reply quoted nothing, and a forward
// went out without the original's text.
describe('an answer to a message whose body failed to load', () => {
  const answerFrom = {
    'the toolbar': (el: El, action: string) => el._handleAction(action),
    'its card': (el: El, action: string) => el._handleActionForItem(action, el.threadItems[0]),
  };

  for (const [from, answer] of Object.entries(answerFrom)) {
    for (const action of ['reply', 'replyAll', 'forward']) {
      it(`${action} from ${from} reads the body again and quotes it`, async () => {
        const composeStore = { openComposer: vi.fn() };
        const el = await open(message, composeStore);
        expect(shadowAll(el, '.reader-load-error')).toHaveLength(1);

        bodyStatus.INBOX = 200;
        await answer(el, action);

        expect(composeStore.openComposer).toHaveBeenCalledTimes(1);
        const opened = composeStore.openComposer.mock.calls[0][0];
        expect(opened.text).toContain('the INBOX body');
        if (action === 'forward') expect(opened.attachments).toEqual([expect.objectContaining({ name: 'figures.csv', partPath: '2' })]);
        expect(bodyReads).toEqual(['INBOX', 'INBOX']);
      });
    }

    it(`from ${from}, says so and opens no composer when the body still cannot be read`, async () => {
      const composeStore = { openComposer: vi.fn() };
      const el = await open(message, composeStore);
      const toasts = record<CustomEvent>(window, 'show-toast');

      await answer(el, 'reply');

      expect(composeStore.openComposer).not.toHaveBeenCalled();
      expect(bodyReads).toEqual(['INBOX', 'INBOX']);
      expect(toasts.map(e => e.detail.message)).toEqual(['messageReader.loadError']);
    });
  }
});

// An answer or Edit draft waits for the body it reads again. The reader it
// was asked of could leave the page meanwhile, the account could change, or
// the message be closed and opened again: the body read for the old intent
// then opened a composer for it all the same, with the old message's text,
// source and files.
describe('an answer or a draft waiting for its body to be read again', () => {
  const actions = {
    'Forward from the toolbar': { msg: () => message, run: (el: El) => el._handleAction('forward') },
    'Forward from its card': { msg: () => message, run: (el: El) => el._handleActionForItem('forward', el.threadItems[0]) },
    'Edit draft from the banner': { msg: () => draft, run: (el: El) => el._handleEditDraft() },
    'Edit draft from its card': { msg: () => draft, run: (el: El) => el._handleEditDraft(el.threadItems[0]) },
  };
  const transitions = {
    'the reader leaves the page': async (el: El) => { el.remove(); },
    'the account changes': async () => { MessageCache.clear(); },
    'the message is closed and opened again': async (el: El, msg: any) => {
      el.message = null;
      await el.updateComplete;
      el.message = msg;
      await el.updateComplete;
    },
  };

  for (const [name, action] of Object.entries(actions)) {
    for (const [transition, happen] of Object.entries(transitions)) {
      it(`${name} opens nothing once ${transition}`, async () => {
        const msg = action.msg();
        bodyStatus[msg.Mailbox] = 500;
        const composeStore = { openComposer: vi.fn() };
        const el = await open(msg, composeStore);
        const toasts = record<CustomEvent>(window, 'show-toast');

        holdNext = msg.Mailbox;
        const waiting = action.run(el);
        await waitFor(() => release !== null, 'the body read again');
        bodyStatus[msg.Mailbox] = 200;
        await happen(el, msg);
        release!(new Response(`the old ${msg.Mailbox} body`, { status: 200 }));
        await waiting;
        await flush();

        expect(composeStore.openComposer).not.toHaveBeenCalled();
        expect(toasts).toEqual([]);
        if (transition === 'the account changes') expect(el.content).not.toBe(`the old ${msg.Mailbox} body`);
      });
    }
  }
});
