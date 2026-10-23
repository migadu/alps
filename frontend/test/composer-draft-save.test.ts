/**
 * Saving a draft from the floating composer.
 *
 * Every save is a full rewrite on the server: the parts the draft already
 * holds are read back from it, the whole message is appended to Drafts, and
 * the draft before it is deleted. So a save is worth sending only when it
 * stores something the last one did not.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, text, waitFor } from './helpers/dom';
import { ComposeStore } from '../src/store/compose-store';
import { DraftFlushError } from '../src/utils/draft-flush-error';
import { messageOperations } from '../src/services/message-operations';
import { generateQuote } from '../src/utils/email-quote';
import '../src/components/alps-floating-composer';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

/**
 * The real store: it replaces a composer on each update and marks it dirty
 * as the app does, which is what decides when the window saves.
 */
const stores: ComposeStore[] = [];
function composerIn(initial: Record<string, unknown>) {
  const store = new ComposeStore();
  stores.push(store);
  store.openComposer({ to: ['ada@example.com'], subject: 'Engines', text: 'Notes', format: 'text', ...initial });
  const [instance] = store.getState().activeComposers;
  return { store, instance, id: instance.id };
}

/** An upload the test finishes when it says so, in place of the browser's XHR. */
class HeldUpload {
  static all: HeldUpload[] = [];
  upload: { onprogress?: (e: Partial<ProgressEvent>) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  status = 0;
  responseText = '';
  open() {}
  send() { HeldUpload.all.push(this); }
  abort() { this.onabort?.(); }
  progress(percent: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded: percent, total: 100 });
  }
  finish(uuid: string) {
    this.status = 200;
    this.responseText = JSON.stringify([uuid]);
    this.onload?.();
  }
  fail() {
    this.status = 500;
    this.responseText = JSON.stringify({ error: 'failed to store attachment' });
    this.onload?.();
  }
}

const file = (name: string) => new File(['x'.repeat(16)], name, { type: 'application/octet-stream' });
const sentForm = (call: number) => vi.mocked(messageOperations.saveDraft).mock.calls[call][0] as FormData;

beforeEach(() => {
  HeldUpload.all = [];
  vi.stubGlobal('XMLHttpRequest', HeldUpload);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  for (const store of stores.splice(0)) {
    const s = store as any;
    window.removeEventListener('session-cleared', s.handleSessionCleared);
    window.removeEventListener('user-logged-in', s.adoptSession);
    window.removeEventListener('alps-active-user-changed', s.adoptSession);
    if (s.saveTimeout !== null) window.clearTimeout(s.saveTimeout);
  }
  localStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('files picked together', () => {
  it('are saved once, when the last of them has uploaded', async () => {
    // A save per finished upload stored the draft once per file, each time
    // larger, reading every file stored before back from the server.
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts' });
    const { store, instance } = composerIn({});
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
    vi.useFakeTimers();

    el._startUpload([file('a.bin'), file('b.bin'), file('c.bin')]);
    const [a, b, c] = HeldUpload.all;
    a.finish('u1');
    await vi.advanceTimersByTimeAsync(0);
    b.finish('u2');
    await vi.advanceTimersByTimeAsync(0);
    expect(saveDraft).not.toHaveBeenCalled();

    c.finish('u3');
    await vi.advanceTimersByTimeAsync(0);
    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(sentForm(0).get('attachment-uuids')).toBe('u1,u2,u3');

    // And only once: the timer the earlier uploads armed finds it stored.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(saveDraft).toHaveBeenCalledTimes(1);
  });
});

describe('a save with nothing new to store', () => {
  it('is not sent', async () => {
    // The timer an upload's progress armed fired after the upload's own save
    // had stored everything, and rewrote the same draft again.
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({
      uid: '8', mailbox: 'Drafts',
      attachments: [{ name: 'a.bin', size: 16, type: 'application/octet-stream', partPath: '2', source: { uuid: 'u1' } }],
    });
    const { store, instance, id } = composerIn({});
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
    vi.useFakeTimers();

    el._startUpload([file('a.bin')]);
    HeldUpload.all[0].progress(50);
    await vi.advanceTimersByTimeAsync(100);
    HeldUpload.all[0].finish('u1');
    await vi.advanceTimersByTimeAsync(10_000);

    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(store.getComposer(id)).toMatchObject({ draftUid: '8', dirty: false });

    // Nor when an edit has been undone: the draft holds the text again.
    store.updateComposer(id, { subject: 'Engines!' });
    store.updateComposer(id, { subject: 'Engines' });
    expect(await el._saveDraft()).toBe(true);
    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(store.getComposer(id)).toMatchObject({ dirty: false });

    // An edit is saved.
    store.updateComposer(id, { subject: 'Looms' });
    expect(await el._saveDraft()).toBe(true);
    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(sentForm(1).get('subject')).toBe('Looms');
    expect(sentForm(1).get('prev_attachments')).toBe('2');
  });

  it('is still sent after a save that failed, though the composer holds what the one before stored', async () => {
    // A save that timed out may still have been stored by the server, under
    // a new UID, replacing the draft the composer names. Compared with the
    // save before it, an edit undone was taken for stored: the composer was
    // marked saved, and a close dropped it.
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValueOnce({ uid: '8', mailbox: 'Drafts' });
    const { store, instance, id } = composerIn({});
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    expect(await el._saveDraft()).toBe(true);
    store.updateComposer(id, { subject: 'Looms' });
    saveDraft.mockResolvedValueOnce(null);
    expect(await el._saveDraft()).toBe(false);

    store.updateComposer(id, { subject: 'Engines' });
    saveDraft.mockResolvedValueOnce({ uid: '9', mailbox: 'Drafts' });
    expect(await el._saveDraft()).toBe(true);
    expect(saveDraft).toHaveBeenCalledTimes(3);
    expect(store.getComposer(id)).toMatchObject({ draftUid: '9', dirty: false });
  });

  it('is still sent after the sign-out flush saved the composer and failed', async () => {
    // The flush sends a save of its own, which the window hears nothing of
    // when it fails. One that timed out may still have been stored under a
    // new UID; then the user, signed in still, undoes the edit.
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValueOnce({ uid: '8', mailbox: 'Drafts' });
    const { store, instance, id } = composerIn({});
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    expect(await el._saveDraft()).toBe(true);
    store.updateComposer(id, { subject: 'Looms' });
    saveDraft.mockResolvedValueOnce(null);
    await expect(store.saveAllDirtyDrafts()).rejects.toBeInstanceOf(DraftFlushError);

    store.updateComposer(id, { subject: 'Engines' });
    saveDraft.mockResolvedValueOnce({ uid: '9', mailbox: 'Drafts' });
    expect(await el._saveDraft()).toBe(true);
    expect(saveDraft).toHaveBeenCalledTimes(3);
    expect(store.getComposer(id)).toMatchObject({ draftUid: '9', dirty: false });
  });
});

/** A save that answers when the test says so. */
function heldSave() {
  let land!: (answer: unknown) => void;
  vi.spyOn(messageOperations, 'saveDraft').mockImplementationOnce(() => new Promise(resolve => { land = resolve; }) as any);
  return (answer: unknown) => land(answer);
}

/** The part a save answers with, and the upload or earlier part it came from. */
const storedPart = (name: string, partPath: string, source: { uuid: string } | { partPath: string }) =>
  ({ name, size: 16, type: 'application/octet-stream', partPath, source });

describe('the answer to a save', () => {
  it('turns each entry the save carried into its stored part, where the composer lists it', async () => {
    // The answer lists the new draft's parts in its own order, and the draft
    // numbers them afresh: the earlier part 2 is now part 3.
    const land = heldSave();
    const { store, instance, id } = composerIn({
      draftUid: '7', draftMailbox: 'Drafts',
      attachments: [
        { filename: 'notes.txt', size: 16, uuid: 'u1' },
        { name: 'ledger.txt', size: 16, type: 'text/plain', partPath: '2' },
      ],
    });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const saving = el._saveDraft();
    land({
      uid: '8', mailbox: 'Drafts',
      attachments: [storedPart('ledger.txt', '3', { partPath: '2' }), storedPart('notes.txt', '2', { uuid: 'u1' })],
    });
    await saving;

    expect(store.getComposer(id)?.attachments?.map(a => a.name)).toEqual(['notes.txt', 'ledger.txt']);
    expect(store.getComposer(id)?.attachments).toEqual([
      { name: 'notes.txt', size: 16, type: 'application/octet-stream', partPath: '2' },
      { name: 'ledger.txt', size: 16, type: 'application/octet-stream', partPath: '3' },
    ]);
    expect(store.getComposer(id)).toMatchObject({ draftUid: '8', dirty: false });
  });

  it('keeps out an attachment removed while the save was out, and the next save stores the draft without it', async () => {
    // The saved draft holds it, and rebuilt from the answer the list had it
    // back: the next save carried it again, and so did the send.
    const land = heldSave();
    const { store, instance, id } = composerIn({
      draftUid: '7', draftMailbox: 'Drafts', dirty: true,
      attachments: [
        { name: 'ledger.txt', size: 16, type: 'text/plain', partPath: '2' },
        { filename: 'notes.txt', size: 16, uuid: 'u1' },
      ],
    });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const saving = el._saveDraft();
    await el.updateComplete;
    el._removeAttachment(0);
    land({
      uid: '8', mailbox: 'Drafts',
      attachments: [storedPart('notes.txt', '2', { uuid: 'u1' }), storedPart('ledger.txt', '3', { partPath: '2' })],
    });
    await saving;

    expect(store.getComposer(id)?.attachments?.map(a => a.name)).toEqual(['notes.txt']);
    expect(store.getComposer(id)?.attachments).toEqual([
      { name: 'notes.txt', size: 16, type: 'application/octet-stream', partPath: '2' },
    ]);
    expect(store.getComposer(id)).toMatchObject({ draftUid: '8', dirty: true });

    const saveDraft = vi.mocked(messageOperations.saveDraft).mockResolvedValue({
      uid: '9', mailbox: 'Drafts', attachments: [storedPart('notes.txt', '2', { partPath: '2' })],
    });
    expect(await el._saveDraft()).toBe(true);
    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(sentForm(1).get('prev_attachments')).toBe('2');
    expect(sentForm(1).get('draft_uid')).toBe('8');
    expect(sentForm(1).has('attachment-uuids')).toBe(false);
    expect(store.getComposer(id)).toMatchObject({ draftUid: '9', dirty: false });
  });
});

describe('a close', () => {
  it('keeps the window open with what was typed while its save was out, and the autosave stores it', async () => {
    // The window stays on screen while Close saves it. Close then took it
    // away once that save landed, with what was typed meanwhile: gone from
    // the screen and from localStorage, and never stored on the server.
    localStorage.setItem('alps_active_user', 'ada@example.com');
    const land = heldSave();
    const { store, instance, id } = composerIn({ text: 'Before Close', dirty: true });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
    vi.useFakeTimers();

    const closing = el._handleCloseClick();
    await vi.advanceTimersByTimeAsync(0);
    expect(sentForm(0).get('text')).toBe('Before Close');
    store.updateComposer(id, { text: 'Written after Close' });
    land({ uid: '8', mailbox: 'Drafts' });
    await closing;

    expect(store.getComposer(id)).toMatchObject({ text: 'Written after Close', draftUid: '8', dirty: true });
    await vi.advanceTimersByTimeAsync(500);
    expect(JSON.parse(localStorage.getItem('alps_compose_drafts_ada@example.com')!)).toEqual([
      expect.objectContaining({ id, text: 'Written after Close' }),
    ]);

    const saveDraft = vi.mocked(messageOperations.saveDraft).mockResolvedValue({ uid: '9', mailbox: 'Drafts' });
    await vi.advanceTimersByTimeAsync(3000);
    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(sentForm(1).get('text')).toBe('Written after Close');
    expect(sentForm(1).get('draft_uid')).toBe('8');
    expect(store.getComposer(id)).toMatchObject({ draftUid: '9', dirty: false });
  });

  it('pressed again while its save is out, closes once what was typed meanwhile is stored', async () => {
    const land = heldSave();
    const toasts = record<CustomEvent>(window, 'show-toast');
    const { store, instance, id } = composerIn({ text: 'Before Close', dirty: true });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const first = el._handleCloseClick();
    await waitFor(() => vi.mocked(messageOperations.saveDraft).mock.calls.length === 1, 'the close to save');
    store.updateComposer(id, { text: 'Written after Close' });
    const saveDraft = vi.mocked(messageOperations.saveDraft).mockResolvedValue({ uid: '9', mailbox: 'Drafts' });
    const second = el._handleCloseClick();
    land({ uid: '8', mailbox: 'Drafts' });
    await Promise.all([first, second]);

    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(sentForm(1).get('text')).toBe('Written after Close');
    expect(sentForm(1).get('draft_uid')).toBe('8');
    expect(store.getComposer(id)).toBeUndefined();
    expect(toasts).toEqual([]);
  });

  it('still closes a window emptied again, which has nothing to save and stays marked edited', async () => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft');
    const { store, instance, id } = composerIn({ to: [], subject: '', text: '' });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
    store.updateComposer(id, { text: 'Dear' });
    store.updateComposer(id, { text: '' });
    expect(store.getComposer(id)?.dirty).toBe(true);

    await el._handleCloseClick();

    expect(saveDraft).not.toHaveBeenCalled();
    expect(store.getComposer(id)).toBeUndefined();
  });

  it('saves a stored draft emptied to blank, so Drafts no longer holds what was taken out', async () => {
    // Blank was taken for nothing to lose, whether or not a draft was
    // stored: the window closed without a save, and Drafts kept the
    // recipients, the subject and the text the user had removed.
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValueOnce({ uid: '8', mailbox: 'Drafts' });
    const { store, instance, id } = composerIn({ text: '' });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
    store.updateComposer(id, { text: 'Notes' });
    expect(await el._saveDraft()).toBe(true);

    store.updateComposer(id, { to: [], subject: '', text: '' });
    saveDraft.mockResolvedValueOnce({ uid: '9', mailbox: 'Drafts' });
    await el._handleCloseClick();

    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(sentForm(1).get('draft_uid')).toBe('8');
    expect(['to', 'subject', 'text'].map(field => sentForm(1).get(field))).toEqual(['', '', '']);
    expect(store.getComposer(id)).toBeUndefined();
  });
});

describe('a stored draft emptied to blank', () => {
  it('is autosaved as it is, and what is written next replaces it', async () => {
    // Emptying the text before writing it again is an edit like any other:
    // the draft is stored empty, not deleted, and the next save replaces it.
    // The autosave took blank for nothing to lose, and the draft in Drafts
    // kept what had been taken out, the composer marked unsaved for good.
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValueOnce({ uid: '8', mailbox: 'Drafts' });
    const { store, instance, id } = composerIn({ text: '' });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
    store.updateComposer(id, { text: 'Notes' });
    expect(await el._saveDraft()).toBe(true);
    vi.useFakeTimers();

    store.updateComposer(id, { to: [], subject: '', text: '' });
    saveDraft.mockResolvedValueOnce({ uid: '9', mailbox: 'Drafts' });
    await vi.advanceTimersByTimeAsync(3000);
    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(sentForm(1).get('draft_uid')).toBe('8');
    expect(['to', 'subject', 'text'].map(field => sentForm(1).get(field))).toEqual(['', '', '']);
    expect(store.getComposer(id)).toMatchObject({ draftUid: '9', dirty: false });

    store.updateComposer(id, { text: 'Fresh notes' });
    saveDraft.mockResolvedValueOnce({ uid: '10', mailbox: 'Drafts' });
    await vi.advanceTimersByTimeAsync(3000);
    expect(saveDraft).toHaveBeenCalledTimes(3);
    expect(sentForm(2).get('draft_uid')).toBe('9');
    expect(sentForm(2).get('text')).toBe('Fresh notes');
    expect(store.getComposer(id)).toMatchObject({ draftUid: '10', dirty: false });
  });
});

describe('a plain-text draft opened in HTML', () => {
  // A draft saved as plain text has no HTML part, and the composer makes one
  // of its text as it opens in HTML. Until an edit nothing did, and a save or
  // a send carried the text/plain part alone. The part made is no edit of the
  // user's: counted as one, opening the draft stored it again, under a new
  // UID, with nothing changed.

  /** The window, once its composer has opened and made the HTML part. */
  async function open() {
    const { store, instance, id } = composerIn({ draftUid: '7', draftMailbox: 'Drafts', text: 'Hi Ada', html: '', format: 'html' });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
    const body = el.shadowRoot!.querySelector('alps-message-composer') as El;
    await body.updateComplete;
    return { store, id, el, body };
  }

  it('has its HTML part, and is not saved again for being opened', async () => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft');
    vi.useFakeTimers();
    const { store, id } = await open();

    expect(store.getComposer(id)?.html).toContain('>Hi Ada</p>');
    expect(store.getComposer(id)?.dirty).toBe(false);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('is sent with its HTML part straight away', async () => {
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');
    const { el } = await open();

    const sending = el._handleSend();
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await sending;

    const form = sendDraft.mock.calls[0][0] as FormData;
    expect(form.get('html')).toEqual(expect.stringContaining('>Hi Ada</p>'));
    expect(form.get('text')).toBe('Hi Ada');
  });

  it('is saved with its HTML part once it is edited', async () => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts' });
    const { store, id, el, body } = await open();

    body.editor.chain().insertContentAt(body.editor.state.doc.content.size, '<p>See you</p>').run();
    expect(store.getComposer(id)?.dirty).toBe(true);
    expect(await el._saveDraft()).toBe(true);

    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(sentForm(0).get('html')).toContain('>Hi Ada</p>');
    expect(sentForm(0).get('html')).toContain('>See you</p>');
  });

  it('closes without a save', async () => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft');
    const { store, id, el } = await open();

    await el._handleCloseClick();

    expect(saveDraft).not.toHaveBeenCalled();
    expect(store.getComposer(id)).toBeUndefined();
  });

  it('is not saved by the sign-out flush', async () => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft');
    const { store, id } = await open();

    await store.saveAllDirtyDrafts();

    expect(saveDraft).not.toHaveBeenCalled();
    expect(store.getComposer(id)).toBeUndefined();
  });
});

describe('a reply or a forward left untouched', () => {
  // The editor takes the keyboard as the window opens, and on that first
  // transaction adds an empty paragraph after a quote that ends the message,
  // for the user to write below it. That reached the store as a change of
  // the HTML, which marks a composer unsaved, and the autosave filed an
  // answer the user had not touched as a draft.
  const original = {
    UID: 4,
    Envelope: { Subject: 'Engines', Date: '2026-09-02T10:00:00Z', From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [] },
  };
  function answer(type: 'reply' | 'forward', html: string | null) {
    const quote = generateQuote(type, original, 'The figures.', html, !!html);
    return { subject: quote.subject, to: quote.to, text: quote.quotedText, html: quote.quotedHtml, format: 'html' as const };
  }
  const untouched = [
    ['a reply to an HTML message', () => answer('reply', '<p>The <b>figures</b>.</p>')],
    ['a reply to a plain-text message', () => answer('reply', null)],
    ['a forward', () => answer('forward', '<p>The <b>figures</b>.</p>')],
    ['a reply reopened from Drafts', () => ({ ...answer('reply', '<p>The <b>figures</b>.</p>'), draftUid: '7', draftMailbox: 'Drafts' })],
  ] as const;

  /** The window, once its editor has opened and taken the keyboard. */
  async function open(initial: Record<string, unknown>) {
    const { store, instance, id } = composerIn(initial);
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
    const body = el.shadowRoot!.querySelector('alps-message-composer') as El;
    await body.updateComplete;
    await vi.advanceTimersByTimeAsync(0);
    return { store, id, el, body };
  }

  it.each(untouched)('%s is not saved, and closes without a save', async (_, make) => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft');
    vi.useFakeTimers();
    const { store, id, el } = await open(make());

    // The editor's paragraph is in the HTML, which the store holds as it is
    // without counting it as an edit.
    expect(store.getComposer(id)?.html).toMatch(/<p dir="auto"><\/p>$/);
    expect(store.getComposer(id)?.dirty).toBe(false);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(saveDraft).not.toHaveBeenCalled();

    await el._handleCloseClick();
    expect(saveDraft).not.toHaveBeenCalled();
    expect(store.getComposer(id)).toBeUndefined();
  });

  it.each(untouched)('%s keeps, as its opening text, the text its editor holds', async (_, make) => {
    // The window opens an answer with its text as the quote's `> ` lines,
    // and the editor's own text has none. Taken from the editor as no edit,
    // the text no longer matched the opening text, and every test of an
    // answer still as it opened, whitespace typed and taken away included,
    // found it changed.
    vi.useFakeTimers();
    const { store, id } = await open(make());

    const composer = store.getComposer(id)!;
    expect(composer.initialText).toBe(composer.text);
    expect(composer.initialHtml).toBe(composer.html);
  });

  it('is saved once something is typed', async () => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts' });
    vi.useFakeTimers();
    const { store, id, body } = await open(answer('reply', '<p>The <b>figures</b>.</p>'));

    body.editor.chain().insertContentAt(1, 'Sounds good.').run();
    expect(store.getComposer(id)?.dirty).toBe(true);
    await vi.advanceTimersByTimeAsync(3000);

    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(sentForm(0).get('html')).toContain('Sounds good.');
  });

  it('nor is a new message with a signature saved for being opened', async () => {
    localStorage.setItem('alps_active_user', 'ada@example.com');
    localStorage.setItem('alps_settings_ada@example.com', JSON.stringify({ signature: 'Grace' }));
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft');
    vi.useFakeTimers();
    const { store, id } = await open({ to: [], subject: '', text: '', format: 'html' });

    expect(store.getComposer(id)?.html).toContain('alps-signature');
    expect(store.getComposer(id)?.dirty).toBe(false);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(saveDraft).not.toHaveBeenCalled();
  });
});

describe('a draft reopened and saved again', () => {
  // A composer editing a draft shows the quote's images from that draft, and
  // each save replaces the draft with a new one. The composer went on naming
  // the draft it had replaced, which is gone: drawn again, after a reload, its
  // quote showed none of its images.
  const before = { Children: [{ Type: 'text', Subtype: 'html' }, { ID: '<chart@remote.test>' }] };
  const after = { Children: [{ Children: [{ Type: 'text', Subtype: 'html' }, { ID: '<chart@remote.test>' }] }, { Type: 'text' }] };
  const reopened = (quoteSource: Record<string, unknown>) => composerIn({
    draftUid: '7', draftMailbox: 'Drafts', dirty: true, format: 'html', html: '<p>See below.</p>', quoteSource,
    attachments: [{ name: 'chart.png', size: 9, type: 'image/png', partPath: '2', inline: true }],
  });

  it('shows its quote from the draft that replaced it', async () => {
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts', structure: after } as any);
    const { store, instance, id } = reopened({ mailbox: 'Drafts', uid: '7', structure: before });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    expect(await el._saveDraft()).toBe(true);

    expect(sentForm(0).get('prev_attachments')).toBe('2');
    expect(store.getComposer(id)?.quoteSource).toEqual({ mailbox: 'Drafts', uid: '8', structure: after });
  });

  it('leaves the quote of a reply with the message it answers', async () => {
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts', structure: after } as any);
    const answered = { mailbox: 'INBOX', uid: '5', structure: before };
    const { store, instance, id } = reopened(answered);
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    expect(await el._saveDraft()).toBe(true);

    expect(store.getComposer(id)?.quoteSource).toEqual(answered);
  });
});

describe('an answer in plain text', () => {
  // A reply or a forward carries the quote's images as inline parts, which
  // the composer shows no chip for. Nothing in a text/plain message shows
  // them, and the server, with no HTML to embed them in, wrote them as files:
  // the recipients got an attachment nobody attached, and a saved draft
  // stored one. A forward's own files are chips, and go.
  const file = { name: 'ledger.txt', size: 16, type: 'text/plain', partPath: '3' };
  const image = { name: 'chart.png', size: 9, type: 'image/png', partPath: '2', inline: true };
  const answer = (extra: Record<string, unknown> = {}) =>
    composerIn({ subject: 'Fwd: Engines', text: 'See below.', format: 'text', dirty: true, attachments: [file, image], ...extra });

  it('is saved without the quote\'s images, and the composer lets go of them', async () => {
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({
      uid: '8', mailbox: 'Drafts', attachments: [storedPart('ledger.txt', '2', { partPath: '3' })],
    });
    const { store, instance, id } = answer();
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    expect(await el._saveDraft()).toBe(true);

    expect(sentForm(0).get('prev_attachments')).toBe('3');
    // From the stored draft on, the server reads the composer's parts from
    // it, and it holds no image: the path the composer had names a part of
    // the quoted message, which a later save would read from the draft.
    expect(store.getComposer(id)?.attachments).toEqual([
      { name: 'ledger.txt', size: 16, type: 'application/octet-stream', partPath: '2' },
    ]);
  });

  it('is sent without them', async () => {
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');
    const { store, instance } = answer();
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const sending = el._handleSend();
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await sending;

    const form = sendDraft.mock.calls[0][0] as FormData;
    expect(form.get('prev_attachments')).toBe('3');
    expect(form.has('html')).toBe(false);
  });

  it('is not saved with them by the sign-out flush', async () => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts' });
    const { store } = answer();

    await store.saveAllDirtyDrafts();

    expect(saveDraft).toHaveBeenCalledTimes(1);
    expect(sentForm(0).get('prev_attachments')).toBe('3');
  });

  it('switched back to HTML before it is saved, carries them again', async () => {
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');
    const { store, instance, id } = answer();
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
    store.updateComposer(id, { format: 'html', html: '<p>See below.</p><img src="cid:chart@remote.test">' });

    const sending = el._handleSend();
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await sending;

    expect((sendDraft.mock.calls[0][0] as FormData).get('prev_attachments')).toBe('3,2');
  });
});

describe('an upload the server no longer holds', () => {
  const answer = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const gone = (uuid: string) => answer(409, { error: `unable to retrieve message attachment ${uuid}`, missing_attachments: [uuid] });

  /** The server, answering each POST /messages in turn; the forms it was sent. */
  function server(...answers: Response[]) {
    const posted: FormData[] = [];
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url !== '/messages') return answer(404, {});
      posted.push(init!.body as FormData);
      return answers.shift() ?? answer(500, {});
    });
    vi.stubGlobal('fetch', fetch);
    return { posted, fetch };
  }

  it('is listed as a file to add again, and the rest of the draft is saved without it', async () => {
    // As after the session it was uploaded in expired. The composer kept
    // the id, and every autosave, and the send, failed on it until the user
    // found the file and removed it.
    const { posted } = server(gone('u1'), answer(200, {
      draft_uid: '8', draft_mailbox: 'Drafts',
      attachments: [{ name: 'ledger.txt', size: 16, type: 'text/plain', partPath: '2', source: { uuid: 'u2' } }],
    }));
    const toasts = record<CustomEvent>(window, 'show-toast');
    const { store, instance, id } = composerIn({
      attachments: [{ filename: 'notes.txt', size: 16, uuid: 'u1' }, { filename: 'ledger.txt', size: 16, uuid: 'u2' }],
    });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    expect(await el._saveDraft()).toBe(true);

    expect(posted.map(form => form.get('attachment-uuids'))).toEqual(['u1,u2', 'u2']);
    expect(store.getComposer(id)?.attachments).toEqual([
      { filename: 'notes.txt', size: 16, missing: true },
      { name: 'ledger.txt', size: 16, type: 'text/plain', partPath: '2' },
    ]);
    expect(store.getComposer(id)).toMatchObject({ draftUid: '8' });
    expect(toasts.map(e => e.detail.message)).toEqual(['composer.attachmentsGone']);
  });

  it('reads so on its pill', async () => {
    const pill = await mount('alps-attachment-pill', {
      attachment: { filename: 'notes.txt', size: 16, missing: true }, removable: true, i18nStore,
    });
    expect(text(pill, '.attachment-size')).toBe('attachment.addAgain');
  });

  it('keeps a close open when its save discovers a missing upload, including its persisted reminder', async () => {
    localStorage.setItem('alps_active_user', 'ada@example.com');
    const { posted } = server(gone('u1'), answer(200, { draft_uid: '8', draft_mailbox: 'Drafts', attachments: [] }));
    const { store, instance, id } = composerIn({ dirty: true, attachments: [{ filename: 'notes.txt', size: 16, uuid: 'u1' }] });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });
    vi.useFakeTimers();

    await el._handleCloseClick();
    await vi.advanceTimersByTimeAsync(500);

    expect(posted).toHaveLength(2);
    expect(store.getComposer(id)).toMatchObject({
      draftUid: '8', dirty: false, closing: false,
      attachments: [{ filename: 'notes.txt', size: 16, missing: true }],
    });
    expect(JSON.parse(localStorage.getItem('alps_compose_drafts_ada@example.com')!)).toEqual([
      expect.objectContaining({ id, attachments: [{ filename: 'notes.txt', size: 16, missing: true }] }),
    ]);
  });

  it('keeps a close open when the autosave it awaited discovers a missing upload', async () => {
    let finish!: (response: Response) => void;
    const fetch = vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve; }))
      .mockResolvedValueOnce(answer(200, { draft_uid: '8', draft_mailbox: 'Drafts', attachments: [] }));
    vi.stubGlobal('fetch', fetch);
    const { store, instance, id } = composerIn({ dirty: true, attachments: [{ filename: 'notes.txt', size: 16, uuid: 'u1' }] });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const saving = el._saveDraft();
    const closing = el._handleCloseClick();
    finish(gone('u1'));
    await saving;
    await closing;

    expect(store.getComposer(id)).toMatchObject({ dirty: false, closing: false, attachments: [{ missing: true }] });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps a deferred close open when its save discovers a missing upload', async () => {
    const { posted } = server(gone('u1'), answer(200, {
      draft_uid: '8', draft_mailbox: 'Drafts', attachments: [storedPart('ledger.txt', '2', { uuid: 'u2' })],
    }));
    const { store, instance, id } = composerIn({ dirty: true, attachments: [{ filename: 'notes.txt', size: 16, uuid: 'u1' }] });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    el._startUpload([file('ledger.txt')]);
    await el._handleCloseClick();
    expect(store.getComposer(id)?.closing).toBe(true);
    HeldUpload.all[0].finish('u2');
    await waitFor(() => store.getComposer(id)?.closing === false, 'the missing-file reminder to reopen the window');

    expect(posted).toHaveLength(2);
    expect(store.getComposer(id)).toMatchObject({ dirty: false, attachments: [{ missing: true }, { partPath: '2' }] });
  });

  it('keeps a deferred close open when adding a missing file again fails', async () => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts', attachments: [] });
    const { store, instance, id } = composerIn({ attachments: [{ filename: 'notes.txt', size: 16, missing: true }] });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    el._startUpload([file('notes.txt')]);
    await el._handleCloseClick();
    HeldUpload.all[0].fail();
    await waitFor(() => store.getComposer(id)?.closing === false, 'the failed replacement to reopen the window');

    expect(store.getComposer(id)?.attachments).toEqual([{ filename: 'notes.txt', size: 16, missing: true }]);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('keeps a clean autosaved missing-file reminder open, until the user explicitly removes the file', async () => {
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts', attachments: [] });
    const { store, instance, id } = composerIn({ dirty: true, attachments: [{ filename: 'notes.txt', size: 16, missing: true }] });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    expect(await el._saveDraft()).toBe(true);
    expect(store.getComposer(id)?.dirty).toBe(false);
    await el._handleCloseClick();
    expect(store.getComposer(id)?.attachments).toMatchObject([{ missing: true }]);
    expect(saveDraft).toHaveBeenCalledTimes(1);

    await el.updateComplete;
    el._removeAttachment(0);
    await el._handleCloseClick();
    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(store.getComposer(id)).toBeUndefined();
  });

  it('finishes a deferred close after the missing file is successfully added again', async () => {
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({
      uid: '8', mailbox: 'Drafts', attachments: [storedPart('notes.txt', '2', { uuid: 'u9' })],
    });
    const { store, instance, id } = composerIn({ attachments: [{ filename: 'notes.txt', size: 16, missing: true }] });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    el._startUpload([file('notes.txt')]);
    await el._handleCloseClick();
    HeldUpload.all[0].finish('u9');
    await waitFor(() => !store.getComposer(id), 'the replaced attachment to be saved before closing');
    expect(sentForm(0).get('attachment-uuids')).toBe('u9');
  });

  it('stops a send, which brings the window back with the file to add again, and sends nothing without it', async () => {
    const { fetch } = server(gone('u1'));
    const toasts = record<CustomEvent>(window, 'show-toast');
    const { store, instance, id } = composerIn({
      text: 'See the file.', attachments: [{ filename: 'notes.txt', size: 16, uuid: 'u1' }],
    });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const send = el._handleSend();
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await send;

    expect(store.getComposer(id)).toMatchObject({
      isSending: false, minimized: false, attachments: [{ filename: 'notes.txt', size: 16, missing: true }],
    });
    expect(toasts.map(e => e.detail.message)).toEqual(['composer.sending', 'composer.attachmentsGone']);

    // Send again: nothing goes until the file is added again, or removed.
    await el.updateComplete;
    await el._handleSend();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(toasts.map(e => e.detail.message)).toEqual(['composer.sending', 'composer.attachmentsGone', 'composer.attachmentsGone']);
  });

  it('stops a send when the save it waited for listed a file as one to add again', async () => {
    // The autosave out when Send was pressed came back refused during the
    // countdown. The file it listed had no id left to send, and the message
    // went out without it.
    let answerSave!: (res: Response) => void;
    const posted: string[] = [];
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url !== '/messages') return Promise.resolve(answer(404, {}));
      const form = init!.body as FormData;
      posted.push(form.has('save_as_draft') ? 'save' : 'send');
      if (posted.length === 1) return new Promise<Response>(resolve => { answerSave = resolve; });
      return Promise.resolve(answer(200, {}));
    }));
    const toasts = record<CustomEvent>(window, 'show-toast');
    const { store, instance, id } = composerIn({
      text: 'See the file.', attachments: [{ filename: 'notes.txt', size: 16, uuid: 'u1' }],
    });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const saving = el._saveDraft();
    const send = el._handleSend();
    await waitFor(() => toasts.length > 0, 'the undo toast');
    answerSave(gone('u1'));
    await saving;
    toasts[0].detail.dismissFn();
    await send;

    expect(posted).toEqual(['save']);
    expect(store.getComposer(id)).toMatchObject({
      isSending: false, minimized: false, attachments: [{ filename: 'notes.txt', size: 16, missing: true }],
    });
    expect(toasts.at(-1)?.detail.message).toBe('composer.attachmentsGone');
  });

  it('is no longer listed once the file is added again, and the message goes with it', async () => {
    // The pill and the notice ask for the file again. Added again, it stayed
    // listed beside the new upload, and Send kept refusing.
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({
      uid: '8', mailbox: 'Drafts', attachments: [storedPart('notes.txt', '2', { uuid: 'u9' })],
    });
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const toasts = record<CustomEvent>(window, 'show-toast');
    const { store, instance, id } = composerIn({
      text: 'See the file.', attachments: [{ filename: 'notes.txt', size: 16, missing: true }],
    });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    el._startUpload([file('notes.txt')]);
    expect(store.getComposer(id)?.attachments).toHaveLength(1);
    HeldUpload.all[0].finish('u9');
    await waitFor(() => vi.mocked(messageOperations.saveDraft).mock.calls.length > 0, 'the save');
    await el.updateComplete;

    const send = el._handleSend();
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    await send;
    expect(sendDraft).toHaveBeenCalledTimes(1);
    expect((sendDraft.mock.calls[0][0] as FormData).get('prev_attachments')).toBe('2');
  });

  it('is listed again when adding it again fails', async () => {
    // The failed upload took the entry it replaced with it, and with that
    // the reminder, and the refusal of Send.
    const toasts = record<CustomEvent>(window, 'show-toast');
    const { store, instance, id } = composerIn({
      text: 'See the file.', attachments: [{ filename: 'notes.txt', size: 16, missing: true }],
    });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    el._startUpload([file('notes.txt')]);
    HeldUpload.all[0].fail();
    expect(store.getComposer(id)?.attachments).toEqual([{ filename: 'notes.txt', size: 16, missing: true }]);

    await el.updateComplete;
    await el._handleSend();
    expect(toasts.at(-1)?.detail.message).toBe('composer.attachmentsGone');
  });

  it('takes no room in the budget, so a large file can be added again', async () => {
    // Still counted, a 20 MiB file to add again and the same 20 MiB file
    // added again came to more than the 32 MiB a composer may carry.
    const toasts = record<CustomEvent>(window, 'show-toast');
    const size = 20 << 20;
    const { store, instance, id } = composerIn({ attachments: [{ filename: 'big.bin', size, missing: true }] });
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const big = file('big.bin');
    Object.defineProperty(big, 'size', { value: size });
    el._startUpload([big]);

    expect(toasts.map(e => e.detail.message)).toEqual([]);
    expect(HeldUpload.all).toHaveLength(1);
    expect(store.getComposer(id)?.attachments).toMatchObject([{ filename: 'big.bin', size, uploading: true }]);
  });
});
