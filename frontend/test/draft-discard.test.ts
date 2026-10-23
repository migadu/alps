/**
 * A draft discarded from its composer, while the reader is showing it.
 *
 * Open a draft, Edit Draft, Discard: the composer deletes the draft and the
 * list re-syncs. The re-sync takes the row away and never closes the reader,
 * so the deleted draft stayed open beside a list that no longer held it.
 *
 * Every save of a draft stores a new message and deletes the one before, so
 * "the draft on screen" and "the draft the composer discards" are the same
 * message only if the page followed each save. It did that only while Drafts
 * was the folder on screen, and a search of all mailboxes lists drafts too.
 * A UID means something only in its mailbox, so every match here is on both.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextProvider } from '@lit/context';
import {
  cleanup, flush, installMatchMedia, installResizeObserver, installScrollIntoView, mount, record, shadowAll, update, waitFor,
} from './helpers/dom';
import { ComposeStore } from '../src/store/compose-store';
import type { ComposerInstance } from '../src/store/compose-store';
import { i18nContext } from '../src/store/i18n-store';
import { messageOperations } from '../src/services/message-operations';
import { MessageCache } from '../src/utils/message-cache';
import '../src/components/message-reader';
import '../src/components/alps-floating-composer';
import '../src/pages/mailbox-page';

// See floating-composer-send.test.ts: the picker builds its grid on connect.
vi.mock('unicode-emoji-picker', () => ({}));

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

const envelope = (subject: string, date: string) => ({
  Subject: subject,
  Date: date,
  From: [{ Name: '', Mailbox: 'ada', Host: 'example.com' }],
  To: [],
  Cc: [],
});

const draft = (uid: string, mailbox = 'Drafts') => ({
  UID: uid,
  Mailbox: mailbox,
  Flags: ['\\Seen', '\\Draft'],
  Envelope: envelope('Engines', '2026-09-02T10:00:00Z'),
});

/** An Inbox message under the same UID as the draft: never the same message. */
const inboxNamesake = (uid: string) => ({
  UID: uid,
  Mailbox: 'INBOX',
  Flags: ['\\Seen'],
  Envelope: envelope('Engines', '2026-09-01T10:00:00Z'),
});

const discarded = (mailbox: string, uid: string) =>
  window.dispatchEvent(new CustomEvent('draft-discarded', { detail: { mailbox, uid } }));

/**
 * The real store, for a test about what changes while a save is out: it
 * replaces a composer on each update, where a stub that edits it in place
 * makes the save's snapshot and the window the same object.
 */
const stores: ComposeStore[] = [];
function realStore(): ComposeStore {
  const store = new ComposeStore();
  stores.push(store);
  return store;
}

beforeEach(() => {
  installResizeObserver();
  installScrollIntoView();
  installMatchMedia();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
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
  MessageCache.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the composer', () => {
  function storeFor(instance: ComposerInstance) {
    return {
      getState: () => ({ activeComposers: [instance] }),
      getComposer: (id: string) => (id === instance.id ? instance : undefined),
      updateComposer: vi.fn(),
      bringComposerToFront: vi.fn(),
      closeComposer: vi.fn(),
    };
  }

  async function discardFrom(instance: ComposerInstance) {
    const composeStore = storeFor(instance);
    const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });
    await el._performDiscard('delete');
    return composeStore;
  }

  it('says which draft it deleted', async () => {
    const del = vi.spyOn(messageOperations, 'deleteMessagesResult').mockResolvedValue({ ok: true });
    const seen = record<CustomEvent>(window, 'draft-discarded');

    const store = await discardFrom({ id: 'c1', draftUid: '7', draftMailbox: 'Drafts', subject: 'Engines' });

    expect(del).toHaveBeenCalledWith('Drafts', ['7']);
    expect(seen.map(e => e.detail)).toEqual([{ mailbox: 'Drafts', uid: '7' }]);
    expect(store.closeComposer).toHaveBeenCalledWith('c1');
  });

  it('closes, and says the draft is still there when the server keeps it', async () => {
    vi.spyOn(messageOperations, 'deleteMessagesResult').mockResolvedValue({ ok: false, reason: 'failed' });
    const seen = record<CustomEvent>(window, 'draft-discarded');
    const toasts = record<CustomEvent>(window, 'show-toast');

    const store = await discardFrom({ id: 'c1', draftUid: '7', draftMailbox: 'Drafts', subject: 'Engines' });

    expect(seen).toEqual([]);
    expect(toasts.map(e => e.detail.message)).toEqual(['composer.discardFailed']);
    expect(store.closeComposer).toHaveBeenCalledWith('c1');
  });

  it('stays quiet on an expired session: the login screen is already the answer', async () => {
    vi.spyOn(messageOperations, 'deleteMessagesResult').mockResolvedValue({ ok: false, reason: 'auth' });
    const toasts = record<CustomEvent>(window, 'show-toast');

    const store = await discardFrom({ id: 'c1', draftUid: '7', draftMailbox: 'Drafts', subject: 'Engines' });

    expect(toasts).toEqual([]);
    expect(store.closeComposer).toHaveBeenCalledWith('c1');
  });

  it('deletes nothing for a draft that was never saved', async () => {
    const del = vi.spyOn(messageOperations, 'deleteMessagesResult');
    const seen = record<CustomEvent>(window, 'draft-discarded');

    const store = await discardFrom({ id: 'c1', subject: 'Engines' });

    expect(del).not.toHaveBeenCalled();
    expect(seen).toEqual([]);
    expect(store.closeComposer).toHaveBeenCalledWith('c1');
  });

  it('names the mailbox it is saving over, along with the UID', async () => {
    // A save stores a new draft and deletes this one; the page follows it
    // only if it can tell which listed message this was.
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts', size: 10 } as any);
    const seen = record<CustomEvent>(window, 'draft-autosaved');
    const instance: ComposerInstance = {
      id: 'c1', draftUid: '7', draftMailbox: 'Drafts', subject: 'Engines', text: 'Notes', format: 'text',
    };
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: storeFor(instance), i18nStore });

    await el._saveDraft();

    expect(seen[0].detail).toMatchObject({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8', mailbox: 'Drafts' });
  });

  it('describes the draft the save stored, not the window as it is when the save lands', async () => {
    // The Drafts row is drawn from the event. Taken from the window after the
    // save, it showed a subject typed, or an attachment picked, while the
    // save was out, which the stored draft did not have, until a later save
    // or a reload. The recipients come from the same snapshot.
    const land = heldSave();
    const seen = record<CustomEvent>(window, 'draft-autosaved');
    const composeStore = realStore();
    composeStore.openComposer({
      to: ['ada@example.com'], subject: 'Engines', text: 'Notes', format: 'text', draftUid: '7', draftMailbox: 'Drafts',
    });
    const [instance] = composeStore.getState().activeComposers;
    const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });

    const saving = el._saveDraft();
    composeStore.updateComposer(instance.id, {
      subject: 'Looms',
      to: ['ada@example.com', 'mary@example.com'],
      cc: ['charles@example.com'],
      bcc: ['babbage@example.com'],
      attachments: [{ _tempId: 't1', filename: 'ledger.txt', size: 12, uploading: true, progress: 0 }],
    });
    land({ uid: '8', mailbox: 'Drafts' });
    await saving;

    expect(seen[0].detail).toMatchObject({
      newUid: '8', subject: 'Engines', to: ['ada@example.com'], cc: [], bcc: [], hasAttachments: false,
    });
    // What changed meanwhile is still to be saved, and that save brings the
    // row up to date.
    expect(composeStore.getComposer(instance.id)).toMatchObject({ draftUid: '8', dirty: true });
  });

  it('marks the row as having attachments only for a file the save carried', async () => {
    // An upload still in flight is not posted, and the quote's own images
    // are not files, so the stored draft has neither as an attachment.
    vi.spyOn(messageOperations, 'saveDraft').mockResolvedValue({ uid: '8', mailbox: 'Drafts' });
    const seen = record<CustomEvent>(window, 'draft-autosaved');
    const composeStore = realStore();
    composeStore.openComposer({
      to: ['ada@example.com'], subject: ' Engines ', text: 'Notes', format: 'html', draftUid: '7', draftMailbox: 'Drafts',
      attachments: [
        { _tempId: 't1', filename: 'ledger.txt', size: 12, uploading: true, progress: 40 },
        { name: 'chart.png', size: 9, type: 'image/png', partPath: '1.2', inline: true },
      ],
    });
    const [instance] = composeStore.getState().activeComposers;
    const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore });

    await el._saveDraft();
    // The subject as it was posted, trimmed.
    expect(seen[0].detail).toMatchObject({ subject: 'Engines', hasAttachments: false });

    const [, chart] = composeStore.getComposer(instance.id)!.attachments!;
    composeStore.updateComposer(instance.id, { attachments: [{ filename: 'ledger.txt', size: 12, uuid: 'u1' }, chart] });
    await el._saveDraft();
    expect(seen[1].detail).toMatchObject({ hasAttachments: true });
  });

  /** A store that keeps what it is told, as the real one does. */
  function liveStoreFor(instance: ComposerInstance) {
    return {
      ...storeFor(instance),
      updateComposer: vi.fn((_id: string, updates: Partial<ComposerInstance>) => Object.assign(instance, updates)),
    };
  }

  /** A save that answers when the test says so. */
  function heldSave() {
    let land!: (answer: unknown) => void;
    vi.spyOn(messageOperations, 'saveDraft').mockImplementationOnce(() => new Promise(resolve => { land = resolve; }) as any);
    return (answer: unknown) => land(answer);
  }

  it('waits for a save in flight, and discards the draft that save stored', async () => {
    // The save stores draft 8 and deletes 7. Deleting 7 before it landed
    // left 8 in Drafts, after the user had discarded it.
    const land = heldSave();
    const del = vi.spyOn(messageOperations, 'deleteMessagesResult').mockResolvedValue({ ok: true });
    const instance: ComposerInstance = {
      id: 'c1', draftUid: '7', draftMailbox: 'Drafts', subject: 'Engines', text: 'Notes', format: 'text', dirty: true,
    };
    const store = liveStoreFor(instance);
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const saving = el._saveDraft();
    const discarding = el._performDiscard('delete');
    await flush();
    expect(del).not.toHaveBeenCalled();
    expect(store.closeComposer).not.toHaveBeenCalled();

    land({ uid: '8', mailbox: 'Drafts' });
    await saving;
    await discarding;

    expect(del.mock.calls).toEqual([['Drafts', ['8']]]);
    expect(store.closeComposer).toHaveBeenCalledWith('c1');
  });

  it('keeps what was typed during a save unsaved, and saves it on close', async () => {
    // Marked clean when the earlier save landed, the newer text was not saved
    // by the close, which saves only a dirty composer, and went with the window.
    const land = heldSave();
    const instance: ComposerInstance = {
      id: 'c1', to: ['ada@example.com'], subject: 'Engines', text: 'Notes', initialText: '', format: 'text', dirty: true,
    };
    const store = liveStoreFor(instance);
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const saving = el._saveDraft();
    Object.assign(instance, { text: 'Notes, and more' });
    land({ uid: '8', mailbox: 'Drafts' });
    await saving;
    expect(instance).toMatchObject({ draftUid: '8', dirty: true });

    const save = vi.mocked(messageOperations.saveDraft).mockResolvedValue({ uid: '9', mailbox: 'Drafts' });
    await el._handleCloseClick();
    expect(save).toHaveBeenCalledTimes(2);
    expect((save.mock.calls[1][0] as FormData).get('text')).toBe('Notes, and more');
    expect((save.mock.calls[1][0] as FormData).get('draft_uid')).toBe('8');
    expect(store.closeComposer).toHaveBeenCalledWith('c1');
  });

  it('closes after a save in flight rather than calling it a failure', async () => {
    const land = heldSave();
    const toasts = record<CustomEvent>(window, 'show-toast');
    const instance: ComposerInstance = {
      id: 'c1', to: ['ada@example.com'], subject: 'Engines', text: 'Notes', initialText: '', format: 'text', dirty: true,
    };
    const store = liveStoreFor(instance);
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: store, i18nStore });

    const saving = el._saveDraft();
    const closing = el._handleCloseClick();
    land({ uid: '8', mailbox: 'Drafts' });
    await saving;
    await closing;

    expect(toasts).toEqual([]);
    expect(messageOperations.saveDraft).toHaveBeenCalledTimes(1);
    expect(store.closeComposer).toHaveBeenCalledWith('c1');
  });
});

describe('the reader', () => {
  function settingsStore() {
    const state = { enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true };
    return Object.assign(new EventTarget(), { getState: () => state });
  }

  async function open(message: any, mailbox: string, messages: any[] = [message]): Promise<El> {
    return mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore: { openComposer: vi.fn() },
      mailbox,
      mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Drafts', Attrs: ['\\Drafts'] }],
      messages,
      message,
    });
  }

  it('closes when the draft it shows is discarded', async () => {
    const el = await open(draft('7'), 'Drafts');
    const closed = record(el, 'close');

    discarded('Drafts', '7');

    expect(closed).toHaveLength(1);
  });

  it('closes for a draft found by a search of all mailboxes', async () => {
    const el = await open(draft('7'), '*');
    const closed = record(el, 'close');

    discarded('Drafts', '7');

    expect(closed).toHaveLength(1);
  });

  it('stays open for a message that only shares the UID', async () => {
    const el = await open(inboxNamesake('7'), 'INBOX');
    const closed = record(el, 'close');

    discarded('Drafts', '7');

    expect(closed).toHaveLength(0);
  });

  it('takes the card of a discarded draft out of the conversation on screen', async () => {
    // A thread of three in Drafts: the open message and two drafts under it.
    // Three, so what is left is still a conversation and still drawn as cards.
    const root = draft('7');
    const second = { ...draft('9'), Envelope: envelope('Re: Engines', '2026-09-03T10:00:00Z') };
    const third = { ...draft('11'), Envelope: envelope('Re: Engines', '2026-09-04T10:00:00Z') };
    const el = await open(root, 'Drafts', [{ ...root, SubMessages: [second, third] }]);
    await waitFor(() => shadowAll(el, 'alps-thread-card').length === 3, 'the conversation cards');
    const closed = record(el, 'close');

    discarded('Drafts', '9');
    await update(el, {});

    expect(shadowAll<El>(el, 'alps-thread-card').map(c => c.item.message.UID)).toEqual(['7', '11']);
    expect(closed).toHaveLength(0);
  });

  it('edits a draft found by a search of all mailboxes in its own mailbox', async () => {
    // `*` is the view, not a mailbox: saving over it, or discarding from it,
    // asked the server to delete from a mailbox that does not exist.
    const composeStore = { openComposer: vi.fn() };
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore,
      mailbox: '*',
      mailboxes: [],
      messages: [draft('7')],
      message: draft('7'),
    });

    await el._handleEditDraft();

    expect(composeStore.openComposer).toHaveBeenCalledWith(expect.objectContaining({
      draftUid: '7',
      draftMailbox: 'Drafts',
      quoteSource: expect.objectContaining({ mailbox: 'Drafts', uid: '7' }),
    }));
  });
});

describe('the mail page, when a draft is saved', () => {
  function settingsStore() {
    const state: Record<string, unknown> = {
      layoutMode: 'vertical',
      densityMode: 'compact',
      sortOrder: 'desc',
      messagesPerPage: 50,
      checkMailInterval: 0,
      loginUsername: 'ada@example.com',
    };
    return Object.assign(new EventTarget(), {
      getState: () => state,
      updateSettings: async (updates: Record<string, unknown>) => { Object.assign(state, updates); },
    });
  }

  async function page(currentMailbox: string, messages: any[], selectedMessage: any): Promise<El> {
    const el = await mount<El>('mailbox-page', { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
    await flush();
    await update(el, { currentMailbox, messages, selectedMessage });
    return el;
  }

  const saved = (detail: Record<string, unknown>) =>
    window.dispatchEvent(new CustomEvent('draft-autosaved', {
      detail: { mailbox: 'Drafts', subject: 'Engines', hasAttachments: false, size: 10, ...detail },
    }));

  it('follows the open draft in a search of all mailboxes', async () => {
    const found = draft('7');
    const el = await page('*', [inboxNamesake('7'), found], found);

    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8' });

    expect(el.selectedMessage).toMatchObject({ UID: '8', Mailbox: 'Drafts' });
    // The row moved with it, and its namesake in the Inbox did not.
    expect(el.messages.map((m: any) => [m.Mailbox, String(m.UID)])).toEqual([['INBOX', '7'], ['Drafts', '8']]);
    // And a reload opens the saved copy, in its own folder.
    expect(window.location.hash).toBe('#/mailbox/*?uid=8&in=Drafts');
  });

  it('follows a draft filed outside Drafts into Drafts, where the save put it', async () => {
    // The save stores the new copy in Drafts and deletes the old one from its
    // own folder, so the link has to name the new folder, not the old one.
    const found = draft('7', 'Archive');
    const el = await page('*', [found], found);
    window.history.replaceState(null, '', '#/mailbox/*?uid=7&in=Archive');

    saved({ oldUid: '7', oldMailbox: 'Archive', newUid: '8' });

    expect(el.selectedMessage).toMatchObject({ UID: '8', Mailbox: 'Drafts' });
    expect(window.location.hash).toBe('#/mailbox/*?uid=8&in=Drafts');
  });

  it('leaves a message that only shares the UID alone, and inserts nothing outside Drafts', async () => {
    const namesake = inboxNamesake('7');
    const el = await page('INBOX', [namesake], namesake);

    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8' });

    expect(el.selectedMessage).toBe(namesake);
    expect(el.messages).toEqual([namesake]);
  });

  it('still follows the draft in Drafts', async () => {
    const row = { ...draft('7'), Mailbox: undefined };
    const el = await page('Drafts', [row], row);

    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8' });

    expect(el.selectedMessage).toMatchObject({ UID: '8' });
    expect(el.messages.map((m: any) => String(m.UID))).toEqual(['8']);
    expect(window.location.hash).toBe('#/mailbox/Drafts?uid=8');
  });

  /**
   * The page inside the i18n context, as the app provides it: the list takes
   * its words from the context, and without one its placeholder for a
   * message without a subject is empty.
   */
  async function translatedPage(currentMailbox: string, messages: any[], selectedMessage: any): Promise<El> {
    const host = document.createElement('div');
    new ContextProvider(host, { context: i18nContext, initialValue: i18nStore as any });
    document.body.appendChild(host);
    const el = document.createElement('mailbox-page') as El;
    Object.assign(el, { i18nStore, settingsStore: settingsStore(), composeStore: new EventTarget() });
    host.appendChild(el);
    await el.updateComplete;
    await flush();
    await update(el, { currentMailbox, messages, selectedMessage });
    return el;
  }

  /** The subjects the list shows, as the user reads them. */
  async function listed(el: El): Promise<(string | undefined)[]> {
    await el.updateComplete;
    const list = el.shadowRoot!.querySelector<El>('alps-message-list')!;
    await list.updateComplete;
    return shadowAll(list, '.message-item .message-subject').map(node => node.textContent?.trim());
  }

  it('gives the row the subject the draft now has, and none once it is cleared', async () => {
    // An empty subject fell back to the row's own, so a draft whose subject
    // was cleared went on showing it, in the list and in the reader, until
    // the list was read again.
    const row = { ...draft('7'), Mailbox: undefined };
    const el = await translatedPage('Drafts', [row], row);

    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8', subject: 'Plans' });
    expect(await listed(el)).toEqual(['Plans']);

    saved({ oldUid: '8', oldMailbox: 'Drafts', newUid: '9', subject: '' });
    expect(el.messages[0].Envelope.Subject).toBe('');
    expect(el.selectedMessage.Envelope.Subject).toBe('');
    expect(await listed(el)).toEqual(['messageList.noSubject']);
  });

  it('puts in a new draft without a subject with none, so the list shows its own placeholder', async () => {
    // It was given the English "(No subject)" as its subject, which the list
    // then showed in every language.
    const el = await translatedPage('Drafts', [], null);

    saved({ oldUid: null, oldMailbox: null, newUid: '31', subject: '' });

    expect(el.messages.map((m: any) => [String(m.UID), m.Envelope.Subject])).toEqual([['31', '']]);
    expect(await listed(el)).toEqual(['messageList.noSubject']);
  });

  it('leaves a cleared subject cleared when the draft is edited again from the reader', async () => {
    // The reader edits the draft as the row has it, so Edit Draft brought the
    // cleared subject back into the composer, and its next save stored it
    // again.
    const row = { ...draft('7'), Mailbox: undefined };
    const el = await page('Drafts', [row], row);
    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8', subject: '' });

    const composeStore = { openComposer: vi.fn() };
    const reader = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore,
      mailbox: 'Drafts',
      mailboxes: [{ Name: 'Drafts', Attrs: ['\\Drafts'] }],
      messages: el.messages,
      message: el.selectedMessage,
    });
    await reader._handleEditDraft();

    expect(composeStore.openComposer).toHaveBeenCalledWith(expect.objectContaining({ draftUid: '8', subject: '' }));
  });

  /** The recipients the save stored, as the composer holds them. */
  const recipients = {
    to: ['"Babbage, Charles" <charles@example.com>'],
    cc: ['dora@bücher.example'],
    bcc: ['eve@example.com'],
  };

  /** Those recipients as a listing of Drafts names them: a draft keeps no Bcc. */
  const listedRecipients = {
    To: [{ Name: 'Babbage, Charles', Mailbox: 'charles', Host: 'example.com' }],
    Cc: [{ Name: '', Mailbox: 'dora', Host: 'xn--bcher-kva.example' }],
  };

  /** A draft addressed to Bob, as Drafts listed it. */
  const toBob = () => {
    const row: any = { ...draft('7'), Mailbox: undefined };
    row.Envelope = { ...row.Envelope, To: [{ Name: 'Bob', Mailbox: 'bob', Host: 'example.com' }] };
    return row;
  };

  /** Who each row is shown as being to, as the user reads it. */
  async function addressees(el: El): Promise<(string | undefined)[]> {
    await el.updateComplete;
    const list = el.shadowRoot!.querySelector<El>('alps-message-list')!;
    await list.updateComplete;
    return shadowAll(list, '.message-item .message-sender').map(node => node.textContent?.replace(/\s+/g, ' ').trim());
  }

  it('gives the row the recipients the draft now has, as a listing names them', async () => {
    // The save's event carries them, and the row kept the ones it was listed
    // with, in the list and in the reader, until the list was read again.
    const row = toBob();
    const el = await translatedPage('Drafts', [row], row);
    expect(await addressees(el)).toEqual(['Bob']);

    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8', ...recipients });

    expect(el.messages[0].Envelope).toMatchObject(listedRecipients);
    expect(el.messages[0].Envelope.Bcc).toBeUndefined();
    expect(el.selectedMessage.Envelope).toMatchObject(listedRecipients);
    expect(await addressees(el)).toEqual(['Babbage, Charles, dora@bücher.example']);
  });

  it('puts in a new draft under the recipients it was saved for, not under the sender', async () => {
    // Put in with no To at all, the row fell back to the sender, and showed
    // the user's own name.
    const el = await translatedPage('Drafts', [], null);

    saved({ oldUid: null, oldMailbox: null, newUid: '31', ...recipients });

    expect(el.messages[0].Envelope).toMatchObject(listedRecipients);
    expect(await addressees(el)).toEqual(['Babbage, Charles, dora@bücher.example']);
  });

  it('edits the draft again from the reader with the recipients it now has', async () => {
    // The reader edits the draft as the row has it: Edit Draft brought the
    // old recipients back into the composer, and its next save stored them.
    const row = toBob();
    const el = await page('Drafts', [row], row);
    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8', ...recipients });

    const composeStore = { openComposer: vi.fn() };
    const reader = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore,
      mailbox: 'Drafts',
      mailboxes: [{ Name: 'Drafts', Attrs: ['\\Drafts'] }],
      messages: el.messages,
      message: el.selectedMessage,
    });
    await reader._handleEditDraft();

    expect(composeStore.openComposer).toHaveBeenCalledWith(expect.objectContaining({
      draftUid: '8',
      to: ['"Babbage, Charles" <charles@example.com>'],
      cc: ['dora@xn--bcher-kva.example'],
    }));
  });

  it('gives a reply draft in a conversation its recipients, and leaves the message it answers as it was', async () => {
    const answered = {
      UID: '5',
      Mailbox: 'INBOX',
      Flags: ['\\Seen'],
      Envelope: { ...envelope('Engines', '2026-09-01T10:00:00Z'), From: [{ Name: 'Bob', Mailbox: 'bob', Host: 'example.com' }] },
    };
    const reply = { ...toBob(), Mailbox: 'Drafts' };
    const thread = { ...answered, SubMessages: [reply] };
    const el = await page('*', [thread], reply);

    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8', ...recipients });

    expect(el.messages[0].Envelope).toBe(answered.Envelope);
    expect(el.messages[0].SubMessages[0]).toMatchObject({ UID: '8', Envelope: listedRecipients });
    expect(el.selectedMessage).toMatchObject({ UID: '8', Envelope: listedRecipients });
  });
  it('keeps literal apostrophes in saved recipient names when the row is edited again', async () => {
    const row = toBob();
    const el = await translatedPage('Drafts', [row], row);
    saved({ oldUid: '7', oldMailbox: 'Drafts', newUid: '8',
      to: ["'t Hooft <gerard@example.com>"], cc: ["Miles' <miles@example.com>"] });
    expect(el.messages[0].Envelope).toMatchObject({
      To: [{ Name: "'t Hooft", Mailbox: 'gerard', Host: 'example.com' }],
      Cc: [{ Name: "Miles'", Mailbox: 'miles', Host: 'example.com' }],
    });
    expect(await addressees(el)).toEqual(["'t Hooft, Miles'"]);
    const composeStore = { openComposer: vi.fn() };
    const reader = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(), i18nStore, composeStore,
      mailbox: 'Drafts', mailboxes: [{ Name: 'Drafts', Attrs: ['\\Drafts'] }],
      messages: el.messages, message: el.selectedMessage,
    });
    await reader._handleEditDraft();
    expect(composeStore.openComposer).toHaveBeenCalledWith(expect.objectContaining({
      to: ["'t Hooft <gerard@example.com>"], cc: ["Miles' <miles@example.com>"],
    }));
  });

});
