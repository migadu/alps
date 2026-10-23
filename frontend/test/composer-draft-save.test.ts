/**
 * Saving a draft from the floating composer.
 *
 * Every save is a full rewrite on the server: the parts the draft already
 * holds are read back from it, the whole message is appended to Drafts, and
 * the draft before it is deleted. So a save is worth sending only when it
 * stores something the last one did not.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount } from './helpers/dom';
import { ComposeStore } from '../src/store/compose-store';
import { DraftFlushError } from '../src/utils/draft-flush-error';
import { messageOperations } from '../src/services/message-operations';
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
