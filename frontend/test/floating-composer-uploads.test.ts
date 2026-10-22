/**
 * Uploads that overlap a draft save.
 *
 * Selecting several files starts every upload at once. The first to finish
 * saves the draft, and the others finish while that save is in flight: within
 * milliseconds for small files, since the save waits on an IMAP append. The
 * save used to rebuild the attachment list from a snapshot taken before it
 * began, in which those uploads were still at 0% — so once it returned, the
 * finished uploads were put back to "uploading, 0%", their UUIDs lost, and no
 * event would ever move them again. Adding files one at a time never showed
 * it, because a human picks the next file long after the save has returned.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, click, mount, shadow, waitFor } from './helpers/dom';
import type { ComposerInstance } from '../src/store/compose-store';
import { messageOperations } from '../src/services/message-operations';
import { handleAttachClick } from '../src/utils/attachment-utils';
import '../src/components/alps-floating-composer';

vi.mock('unicode-emoji-picker', () => ({}));

// The file picker is the browser's; the test plays its part by calling the
// callbacks the composer hands it, in the order the uploads would.
vi.mock('../src/utils/attachment-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/utils/attachment-utils')>();
  return { ...actual, handleAttachClick: vi.fn() };
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  // restoreAllMocks leaves a vi.fn from a mock factory alone, and this one
  // would otherwise hand the next test the callbacks of the composer before.
  vi.mocked(handleAttachClick).mockClear();
});

const i18nStore = {
  t: (key: string) => key,
  addEventListener: () => {},
  removeEventListener: () => {},
};

/** A store whose updates land, since the composer reads back what it wrote. */
function liveStoreFor(initial: ComposerInstance) {
  let current = initial;
  return {
    getState: () => ({ activeComposers: [current] }),
    getComposer: (id: string) => (id === current.id ? current : undefined),
    updateComposer: vi.fn((id: string, updates: Partial<ComposerInstance>) => {
      if (id === current.id) current = { ...current, ...updates };
    }),
    bringComposerToFront: vi.fn(),
    closeComposer: vi.fn(),
  };
}

type Callbacks = {
  added: (tempId: string, file: File) => void;
  progress: (tempId: string, progress: number) => void;
  complete: (tempId: string, uuids: string[]) => void;
};

async function openComposerAndPickFiles() {
  const instance: ComposerInstance = { id: 'c1', to: ['ada@example.com'], subject: 'Files', text: '', format: 'text', attachments: [] };
  const composeStore = liveStoreFor(instance);
  const el = await mount('alps-floating-composer', { instance, composeStore, i18nStore });
  await click(shadow(el, 'alps-icon-btn[icon="paperclip"]'), el);

  const call = vi.mocked(handleAttachClick).mock.calls[0];
  expect(call, 'the attach button to open the file picker').toBeDefined();
  const callbacks: Callbacks = { added: call[3], progress: call[4], complete: call[5] };
  return { composeStore, callbacks };
}

const attachmentsOf = (store: ReturnType<typeof liveStoreFor>) => store.getComposer('c1')?.attachments || [];

describe('uploads that finish during a draft save', () => {
  it('keeps the finished upload and the live progress of the one still going', async () => {
    const { composeStore, callbacks } = await openComposerAndPickFiles();
    let finishSave!: (value: unknown) => void;
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft')
      .mockImplementationOnce(() => new Promise((resolve) => { finishSave = resolve; }))
      .mockResolvedValue(null);

    const file = (name: string) => new File(['x'], name, { type: 'text/plain' });
    callbacks.added('t1', file('a.txt'));
    callbacks.added('t2', file('b.txt'));
    callbacks.added('t3', file('c.txt'));

    // a.txt is done first; its completion saves the draft.
    callbacks.complete('t1', ['uuid-a']);
    await waitFor(() => saveDraft.mock.calls.length === 1, 'the save a.txt triggers');
    expect((saveDraft.mock.calls[0][0] as FormData).get('attachment-uuids')).toBe('uuid-a');

    // While the save waits on the server, b.txt finishes and c.txt advances.
    callbacks.complete('t2', ['uuid-b']);
    callbacks.progress('t3', 60);

    finishSave({ uid: '7', mailbox: 'Drafts', attachments: [{ name: 'a.txt', size: 1, type: 'text/plain', partPath: '2' }] });
    await waitFor(() => attachmentsOf(composeStore).some((a) => a.partPath === '2'), 'the save to land');

    const atts = attachmentsOf(composeStore);
    expect(atts).toHaveLength(3);
    expect(atts).toEqual(expect.arrayContaining([
      expect.objectContaining({ partPath: '2' }),
      expect.objectContaining({ uuid: 'uuid-b' }),
      expect.objectContaining({ _tempId: 't3', uploading: true, progress: 60 }),
    ]));
    expect(atts.filter((a) => a.uploading)).toHaveLength(1);
  });

  it('saves again afterwards, carrying the upload the first save missed', async () => {
    const { composeStore, callbacks } = await openComposerAndPickFiles();
    let finishSave!: (value: unknown) => void;
    const saveDraft = vi.spyOn(messageOperations, 'saveDraft')
      .mockImplementationOnce(() => new Promise((resolve) => { finishSave = resolve; }))
      .mockResolvedValue({ uid: '8', mailbox: 'Drafts', attachments: [] });

    const file = (name: string) => new File(['x'], name, { type: 'text/plain' });
    callbacks.added('t1', file('a.txt'));
    callbacks.added('t2', file('b.txt'));
    callbacks.complete('t1', ['uuid-a']);
    await waitFor(() => saveDraft.mock.calls.length === 1, 'the save a.txt triggers');
    callbacks.complete('t2', ['uuid-b']);

    // The auto-save is a 3 s timer; from here on the clock is ours.
    vi.useFakeTimers();
    finishSave({ uid: '7', mailbox: 'Drafts', attachments: [{ name: 'a.txt', size: 1, type: 'text/plain', partPath: '2' }] });
    await vi.advanceTimersByTimeAsync(0);
    expect(attachmentsOf(composeStore)).toEqual(expect.arrayContaining([expect.objectContaining({ uuid: 'uuid-b' })]));

    await vi.advanceTimersByTimeAsync(3000);
    expect(saveDraft).toHaveBeenCalledTimes(2);
    const second = saveDraft.mock.calls[1][0] as FormData;
    expect(second.get('attachment-uuids')).toBe('uuid-b');
    // And the part a.txt became in the draft the first save stored.
    expect(second.get('prev_attachments')).toBe('2');
  });
});
