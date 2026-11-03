/**
 * Which address a message is sent from.
 *
 * The composer offers the account and the other addresses the user sends
 * from (Settings › Identity) in a From row, and has no row while there are
 * none. A new message starts from the account; a reply or a forward from the
 * identity the original was sent from or addressed to, else the account; an
 * edited draft from the identity it was saved from. A send names its sender
 * by address, the server writes the From, and a From the server refuses is
 * said as such, with the window open again on it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appendSenderFields, ComposeStore, draftContentKey, type ComposerInstance } from '../src/store/compose-store';
import { messageOperations, SenderNotAllowedError } from '../src/services/message-operations';
import { senderForMessage, senderLabel, type Identity } from '../src/utils/identities';
import { MessageCache } from '../src/utils/message-cache';
import '../src/components/alps-floating-composer';
import '../src/components/message-reader';
import {
  cleanup, click, installMatchMedia, installResizeObserver, installScrollIntoView, mount, record, shadow, waitFor,
} from './helpers/dom';

type El = HTMLElement & Record<string, any>;

// The emoji picker builds its whole grid as it connects; nothing here opens it.
vi.mock('unicode-emoji-picker', () => ({}));

const OWN = 'ada@example.com';
const IDENTITIES: Identity[] = [
  { name: 'Analytical Engines', address: 'engines@work.example' },
  { name: '', address: 'ada@xn--bcher-kva.example' },
];

const at = (address: string, Name = '') => {
  const [Mailbox, Host] = address.split('@');
  return { Name, Mailbox, Host };
};

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  MessageCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the identity an answer starts from', () => {
  it('is the one the original was addressed to, in To and then in Cc', () => {
    expect(senderForMessage({ From: [at('charles@remote.test')], To: [at('engines@work.example')] }, OWN, IDENTITIES)).toBe('engines@work.example');
    expect(senderForMessage({ From: [at('charles@remote.test')], To: [at('bob@remote.test')], Cc: [at('Engines@WORK.example')] }, OWN, IDENTITIES)).toBe('engines@work.example');
  });

  it('is the one a message the user sent was sent from', () => {
    expect(senderForMessage({ From: [at('engines@work.example')], To: [at('charles@remote.test')] }, OWN, IDENTITIES)).toBe('engines@work.example');
  });

  it('is the account where the account comes first, or no identity is named', () => {
    expect(senderForMessage({ From: [at('charles@remote.test')], To: [at(OWN)], Cc: [at('engines@work.example')] }, OWN, IDENTITIES)).toBeUndefined();
    expect(senderForMessage({ From: [at(OWN)], To: [at('engines@work.example')] }, OWN, IDENTITIES)).toBeUndefined();
    expect(senderForMessage({ From: [at('charles@remote.test')], To: [at('bob@remote.test')] }, OWN, IDENTITIES)).toBeUndefined();
    expect(senderForMessage({ From: [at('charles@remote.test')], To: [at('engines@work.example')] }, OWN, [])).toBeUndefined();
  });

  it('knows an identity whose domain the message writes in Unicode', () => {
    expect(senderForMessage({ From: [at('charles@remote.test')], To: [at('ada@bücher.example')] }, OWN, IDENTITIES)).toBe('ada@xn--bcher-kva.example');
  });
});

describe('what a send or a save posts of its sender', () => {
  const posted = (composer: Partial<ComposerInstance>, settings: Record<string, unknown>) => {
    const form = new FormData();
    appendSenderFields(form, { id: 'c', ...composer }, settings);
    return Object.fromEntries(form.entries());
  };

  it('names an identity by its address, without the account\'s Reply-To', () => {
    expect(posted({ from: 'ENGINES@work.example' }, { identities: IDENTITIES, replyTo: 'replies@example.com' })).toEqual({ from: 'engines@work.example' });
  });

  it('names nothing for the account, which goes with its Reply-To', () => {
    expect(posted({}, { identities: IDENTITIES, replyTo: 'replies@example.com' })).toEqual({ reply_to: 'replies@example.com' });
  });

  it('names nothing for an identity removed since it was chosen', () => {
    expect(posted({ from: 'gone@work.example' }, { identities: IDENTITIES })).toEqual({});
  });
});

describe('a sender\'s label', () => {
  it('isolates the name and the address, and drops the name\'s own direction controls', () => {
    expect(senderLabel('Ada‮', 'ada@example.com')).toBe('⁨Ada⁩ <⁦ada@example.com⁩>');
    expect(senderLabel('  ', 'ada@example.com')).toBe('⁦ada@example.com⁩');
  });
});

describe('the From row', () => {
  function settingsStore(identities: Identity[]) {
    const state = { loginUsername: OWN, name: 'Ada Lovelace', identities, maxAttachmentMiB: 32 };
    return Object.assign(new EventTarget(), { getState: () => state, state });
  }

  function storeFor(instance: ComposerInstance) {
    return {
      getState: () => ({ activeComposers: [instance] }),
      getComposer: (id: string) => (id === instance.id ? instance : undefined),
      updateComposer: vi.fn((_id: string, updates: Partial<ComposerInstance>) => Object.assign(instance, updates)),
      bringComposerToFront: vi.fn(),
      closeComposer: vi.fn(),
    };
  }

  async function composer(instance: ComposerInstance, identities = IDENTITIES) {
    const composeStore = storeFor(instance);
    const el = await mount<El>('alps-floating-composer', { instance, composeStore, i18nStore, settingsStore: settingsStore(identities) });
    return { el, composeStore };
  }

  it('is not there while there are no other addresses', async () => {
    const { el } = await composer({ id: 'c1', to: [], text: '' }, []);
    expect(el.shadowRoot!.querySelector('select.sender-select')).toBeNull();
  });

  it('offers the account and each identity, under the name each goes out under, on the account', async () => {
    const { el } = await composer({ id: 'c1', to: [], text: '' });
    const select = shadow<HTMLSelectElement>(el, 'select.sender-select');
    expect(select.getAttribute('aria-label')).toBe('floatingComposer.from');
    expect([...select.options].map((o) => [o.value, o.textContent])).toEqual([
      [OWN, senderLabel('Ada Lovelace', OWN)],
      ['engines@work.example', senderLabel('Analytical Engines', 'engines@work.example')],
      ['ada@xn--bcher-kva.example', senderLabel('Ada Lovelace', 'ada@xn--bcher-kva.example')],
    ]);
    expect(select.value).toBe(OWN);
  });

  it('shows the identity the composer sends from, and the account for one that is gone', async () => {
    const { el } = await composer({ id: 'c1', to: [], text: '', from: 'engines@work.example' });
    expect(shadow<HTMLSelectElement>(el, 'select.sender-select').value).toBe('engines@work.example');
    const gone = await composer({ id: 'c2', to: [], text: '', from: 'gone@work.example' });
    expect(shadow<HTMLSelectElement>(gone.el, 'select.sender-select').value).toBe(OWN);
  });

  it('records a pick, the account as no identity at all', async () => {
    const { el, composeStore } = await composer({ id: 'c1', to: [], text: '' });
    const select = shadow<HTMLSelectElement>(el, 'select.sender-select');
    select.value = 'engines@work.example';
    select.dispatchEvent(new Event('change'));
    expect(composeStore.updateComposer).toHaveBeenLastCalledWith('c1', { from: 'engines@work.example' });
    select.value = OWN;
    select.dispatchEvent(new Event('change'));
    expect(composeStore.updateComposer).toHaveBeenLastCalledWith('c1', { from: undefined });
  });

  it('comes and goes with the identities, as Settings changes them', async () => {
    const store = settingsStore([]);
    const instance: ComposerInstance = { id: 'c1', to: [], text: '' };
    const el = await mount<El>('alps-floating-composer', { instance, composeStore: storeFor(instance), i18nStore, settingsStore: store });
    expect(el.shadowRoot!.querySelector('select.sender-select')).toBeNull();
    store.state.identities = IDENTITIES;
    store.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('select.sender-select')).not.toBeNull();
  });

  async function send(el: El) {
    const toasts = record<CustomEvent>(window, 'show-toast');
    await click(shadow(el, '.send-actions alps-button[variant="primary"]'), el);
    await waitFor(() => toasts.length > 0, 'the undo toast');
    toasts[0].detail.dismissFn();
    return toasts;
  }

  it('sends from the identity it shows', async () => {
    localStorage.setItem('alps_active_user', OWN);
    localStorage.setItem(`alps_settings_${OWN}`, JSON.stringify({ loginUsername: OWN, identities: IDENTITIES, replyTo: 'replies@example.com' }));
    const sendDraft = vi.spyOn(messageOperations, 'sendDraft').mockResolvedValue(true);
    const { el, composeStore } = await composer({ id: 'c1', to: ['charles@remote.test'], text: 'Hello', format: 'text', from: 'engines@work.example' });
    await send(el);
    await waitFor(() => composeStore.closeComposer.mock.calls.length > 0, 'the window to close');
    const form = sendDraft.mock.calls[0][0] as FormData;
    expect(form.get('from')).toBe('engines@work.example');
    expect(form.has('reply_to')).toBe(false);
  });

  it('says a refused From as such, and opens the window again on its row', async () => {
    vi.spyOn(messageOperations, 'sendDraft').mockRejectedValue(new SenderNotAllowedError('the mail server refused the sender'));
    const { el, composeStore } = await composer({ id: 'c1', to: ['charles@remote.test'], text: 'Hello', format: 'text', from: 'engines@work.example' });
    const toasts = await send(el);
    await waitFor(() => toasts.length > 1, 'the failure');
    expect(toasts[1].detail).toMatchObject({ message: 'composer.senderNotAllowed', type: 'error' });
    expect(composeStore.closeComposer).not.toHaveBeenCalled();
    expect(composeStore.updateComposer).toHaveBeenCalledWith('c1', { isSending: false, minimized: false, expanded: false });
    await waitFor(() => el.shadowRoot!.activeElement === el.shadowRoot!.querySelector('select.sender-select'), 'the focus on From');
  });
});

describe('the server\'s refusal of a sender', () => {
  it('is a SenderNotAllowedError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'nope', code: 'sender_not_allowed' }), { status: 403 })));
    await expect(messageOperations.sendDraft(new FormData())).rejects.toBeInstanceOf(SenderNotAllowedError);
  });
});

describe('a change of sender', () => {
  it('is an edit, and a draft saved before it is not the draft after it', () => {
    localStorage.setItem('alps_active_user', OWN);
    const store = new ComposeStore();
    store.openComposer({});
    const [composer] = store.getState().activeComposers;
    const before = draftContentKey(composer);
    store.updateComposer(composer.id, { from: 'engines@work.example' });
    const after = store.getComposer(composer.id)!;
    expect(after.dirty).toBe(true);
    expect(draftContentKey(after)).not.toBe(before);
  });
});

describe('what the reader opens the composer from', () => {
  const message = (envelope: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
    UID: '5',
    Mailbox: 'INBOX',
    Flags: ['\\Seen'],
    BodyStructure: { Type: 'text', Subtype: 'plain' },
    Envelope: { Subject: 'Engines', Date: '2026-09-01T10:00:00Z', Cc: [], MessageID: '5@remote.test', ...envelope },
    ...extra,
  });

  function settingsStore() {
    const state = {
      enableThreading: true, preferredView: 'text', showRemoteContent: 'never', showSenderAvatars: true,
      loginUsername: OWN, identities: IDENTITIES,
    };
    return Object.assign(new EventTarget(), { getState: () => state });
  }

  async function reader(msg: any) {
    installResizeObserver();
    installScrollIntoView();
    installMatchMedia();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
    MessageCache.set(msg.Mailbox, msg.UID, 'text', {
      Message: msg, Part: { Path: [1], MIMEType: 'text/plain' }, Attachments: [], RawText: 'The engines.', HasText: true,
    });
    const openComposer = vi.fn();
    const el = await mount<El>('alps-message-reader', {
      settingsStore: settingsStore(),
      i18nStore,
      composeStore: { openComposer },
      mailbox: msg.Mailbox,
      mailboxes: [{ Name: 'INBOX', Attrs: [] }, { Name: 'Drafts', Attrs: ['\\Drafts'] }],
      messages: [msg],
      message: msg,
    });
    await waitFor(() => !el.loading && el.threadItems.length > 0, 'the message');
    return { el, openComposer };
  }

  const toEngines = message({ From: [at('charles@remote.test', 'Charles')], To: [at('engines@work.example')] });

  for (const action of ['reply', 'replyAll', 'forward']) {
    it(`${action} starts from the identity the message was addressed to`, async () => {
      const { el, openComposer } = await reader(toEngines);
      void el._handleAction(action);
      await waitFor(() => openComposer.mock.calls.length > 0, 'the composer');
      expect(openComposer.mock.calls[0][0].from).toBe('engines@work.example');
    });
  }

  it('a reply from a card does too, and never goes back to the identity', async () => {
    const { el, openComposer } = await reader(message({ From: [at('charles@remote.test')], To: [at('engines@work.example'), at('bob@remote.test')] }));
    void el._handleActionForItem('replyAll', el.threadItems[0]);
    await waitFor(() => openComposer.mock.calls.length > 0, 'the composer');
    const opened = openComposer.mock.calls[0][0];
    expect(opened.from).toBe('engines@work.example');
    expect([...opened.to, ...opened.cc]).not.toContain('engines@work.example');
  });

  it('a reply to mail for the account starts from the account', async () => {
    const { el, openComposer } = await reader(message({ From: [at('charles@remote.test')], To: [at(OWN)] }));
    void el._handleAction('reply');
    await waitFor(() => openComposer.mock.calls.length > 0, 'the composer');
    expect(openComposer.mock.calls[0][0].from).toBeUndefined();
  });

  it('an edited draft keeps the identity it was saved from, not the one it is addressed to', async () => {
    const draft = message({ From: [at('engines@work.example')], To: [at('ada@xn--bcher-kva.example')] }, { UID: '7', Mailbox: 'Drafts', Flags: ['\\Seen', '\\Draft'] });
    const { el, openComposer } = await reader(draft);
    void el._handleEditDraft();
    await waitFor(() => openComposer.mock.calls.length > 0, 'the composer');
    expect(openComposer.mock.calls[0][0]).toMatchObject({ draftUid: '7', from: 'engines@work.example' });
  });

  it('an edited draft saved from the account opens on the account', async () => {
    const draft = message({ From: [at(OWN)], To: [at('engines@work.example')] }, { UID: '8', Mailbox: 'Drafts', Flags: ['\\Seen', '\\Draft'] });
    const { el, openComposer } = await reader(draft);
    void el._handleEditDraft();
    await waitFor(() => openComposer.mock.calls.length > 0, 'the composer');
    expect(openComposer.mock.calls[0][0].from).toBeUndefined();
  });
});
