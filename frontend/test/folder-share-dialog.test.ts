/**
 * The dialog that shares one folder: who has access, adding a colleague at a
 * level, changing a level and taking access away.
 *
 * What the server says is what is shown. A grant is never drawn before the
 * server took it, so a refused one leaves no row, and every change is
 * followed by reading the list again rather than by patching it.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/folder-share-dialog';
import { mailboxOperations, type FolderShare, type SharingOutcome, type SharingRead } from '../src/services/mailbox-operations';
import { cleanup, click, flush, mount, shadow, shadowAll, text, waitFor } from './helpers/dom';

type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string, params?: Record<string, string>) => (params ? `${key}(${Object.values(params).join(',')})` : key),
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

const bob: FolderShare = { identifier: 'bob@example.test', rights: 'lrs', level: 'read_only' };
const zoe: FolderShare = { identifier: 'Zoe@example.test', rights: 'lr', level: '' };

/**
 * A server holding `entries` as the folder's list, which grants and revokes
 * change as the answers given say: a grant that is answered ok adds or
 * changes its row, and one refused changes nothing.
 */
function server(entries: FolderShare[], answers: { share?: SharingOutcome; unshare?: SharingOutcome; read?: SharingRead } = {}) {
  let held = [...entries];
  const read = vi.spyOn(mailboxOperations, 'readSharing').mockImplementation(async () => answers.read ?? { ok: true, rights: 'lrswipkxtea', entries: [...held] });
  const share = vi.spyOn(mailboxOperations, 'shareMailbox').mockImplementation(async (_mailbox, identifier, level) => {
    const outcome = answers.share ?? { ok: true };
    if (outcome.ok) {
      const rights = { read_only: 'lrs', read_write: 'lrswite', full: 'lrswipkxte' }[level];
      held = [...held.filter(e => e.identifier !== identifier), { identifier, rights, level }];
    }
    return outcome;
  });
  const unshare = vi.spyOn(mailboxOperations, 'unshareMailbox').mockImplementation(async (_mailbox, identifier) => {
    const outcome = answers.unshare ?? { ok: true };
    if (outcome.ok) held = held.filter(e => e.identifier !== identifier);
    return outcome;
  });
  return { read, share, unshare };
}

async function dialog(): Promise<El> {
  const el = await mount<El>('alps-folder-share-dialog', { i18nStore, mailbox: 'Shared/Team', folderName: 'Team' });
  await waitFor(() => !text(el).includes('folderShare.loading'), 'the list read');
  await el.updateComplete;
  return el;
}

const rows = (el: El) => shadowAll(el, '.share-row').map(row => row.querySelector('.share-who')!.textContent!.trim());
const rowOf = (el: El, who: string) => shadowAll(el, '.share-row').find(row => row.querySelector('.share-who')!.textContent!.trim() === who)!;

async function type(el: El, address: string) {
  const input = shadow<El>(el, 'alps-input');
  input.value = address;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await el.updateComplete;
}

async function pressShare(el: El) {
  await click(shadow(el, 'alps-button.grant'), el);
  await waitFor(() => !el.busy, 'the grant to settle');
  await el.updateComplete;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('the folder share dialog', () => {
  it('lists who has access with their level, a level no one of these is said to be custom', async () => {
    server([bob, zoe]);
    const el = await dialog();
    expect(rows(el)).toEqual(['bob@example.test', 'Zoe@example.test']);
    const level = (who: string) => rowOf(el, who).querySelector<El>('alps-select')!;
    expect(level('bob@example.test').value).toBe('read_only');
    expect(level('Zoe@example.test').value).toBe('');
    expect(level('Zoe@example.test').options[0]).toMatchObject({ value: '', label: 'folderShare.levelCustom', disabled: true });
    // Each row's controls say whose they are.
    expect(level('bob@example.test').label).toBe('folderShare.levelFor(bob@example.test)');
    expect(rowOf(el, 'bob@example.test').querySelector('alps-icon-btn')!.getAttribute('title')).toBe('folderShare.revokeFor(bob@example.test)');
  });

  it('says a folder is shared with no one only when the list said so, and that it could not be read otherwise', async () => {
    server([]);
    let el = await dialog();
    expect(text(el)).toContain('folderShare.noneYet');
    expect(text(el)).not.toContain('folderShare.listFailed');
    cleanup();

    server([], { read: { ok: false, reason: 'failed' } });
    el = await dialog();
    expect(text(el)).toContain('folderShare.listFailed');
    expect(text(el)).not.toContain('folderShare.noneYet');
  });

  it('shares at the level chosen, and shows the person once the server has them', async () => {
    const { share, read } = server([bob]);
    const el = await dialog();
    await type(el, 'carol@example.test');
    const level = shadow<El>(el, '.add alps-select');
    level.value = 'read_write';
    level.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await pressShare(el);
    expect(share).toHaveBeenCalledWith('Shared/Team', 'carol@example.test', 'read_write');
    expect(read).toHaveBeenCalledTimes(2);
    expect(rows(el)).toEqual(['bob@example.test', 'carol@example.test']);
    expect(shadow<El>(el, 'alps-input').value).toBe('');
  });

  it('does not present stale access as current when the refresh after a change fails', async () => {
    const { read } = server([bob]);
    const el = await dialog();
    read.mockResolvedValue({ ok: false, reason: 'failed' });
    await type(el, 'carol@example.test');
    await pressShare(el);
    expect(text(el)).toContain('folderShare.listFailed');
    expect(rows(el)).toEqual([]);
    expect(text(el)).not.toContain('folderShare.noneYet');
  });

  it('waits for an access change and its refresh before another change or closing', async () => {
    server([bob]);
    const el = await dialog();
    let finish!: (result: SharingOutcome) => void;
    const change = vi.mocked(mailboxOperations.shareMailbox).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const closed = vi.fn();
    el.addEventListener('close', closed);
    const select = rowOf(el, bob.identifier).querySelector<El>('alps-select')!;
    select.value = 'full';
    select.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(select.disabled).toBe(true);
    expect(shadow<El>(el, 'ui-modal').dismissible).toBe(false);
    await type(el, 'carol@example.test');
    await el.grant();
    el.close();
    expect(change).toHaveBeenCalledTimes(1);
    expect(closed).not.toHaveBeenCalled();
    finish({ ok: true });
    await waitFor(() => el.changing === null, 'the access change and refresh');
    await el.updateComplete;
    expect(select.disabled).toBe(false);
    expect(shadow<El>(el, 'ui-modal').dismissible).toBe(true);
  });

  it('leaves a refused grant off the list, and says why', async () => {
    const { share } = server([bob], { share: { ok: false, reason: 'unknown_identifier' } });
    const el = await dialog();
    await type(el, 'nobody@example.test');
    await pressShare(el);
    expect(share).toHaveBeenCalledOnce();
    expect(rows(el)).toEqual(['bob@example.test']);
    expect(shadow(el, '.error[role="alert"]').textContent).toBe('folderShare.errorUnknown');
    // What was typed stays, to be corrected.
    expect(shadow<El>(el, 'alps-input').value).toBe('nobody@example.test');
  });

  it('words each refusal the server can give', async () => {
    for (const [reason, key] of [
      ['self', 'folderShare.errorSelf'],
      ['invalid_identifier', 'folderShare.errorInvalidAddress'],
      ['forbidden', 'folderShare.errorForbidden'],
      ['not_found', 'folderShare.errorGone'],
      ['refused', 'folderShare.errorRefused'],
      ['failed', 'folderShare.errorGeneric'],
    ] as const) {
      server([], { share: { ok: false, reason } });
      const el = await dialog();
      await type(el, 'carol@example.test');
      await pressShare(el);
      expect(shadow(el, '.error').textContent, reason).toBe(key);
      cleanup();
      vi.restoreAllMocks();
    }
  });

  it('asks nothing of the server for what is not one address', async () => {
    const { share } = server([]);
    const el = await dialog();
    for (const typed of ['anyone', 'Bob <bob@example.test>', 'bob@example.test, carol@example.test', 'bob @example.test']) {
      await type(el, typed);
      await pressShare(el);
      expect(shadow(el, '.error').textContent, typed).toBe('folderShare.errorInvalidAddress');
    }
    expect(share).not.toHaveBeenCalled();
  });

  it('changes the level of someone already on the list, whatever case their address is typed in', async () => {
    const { share } = server([bob, zoe]);
    const el = await dialog();
    await type(el, 'zoe@EXAMPLE.test');
    await pressShare(el);
    expect(share).toHaveBeenCalledWith('Shared/Team', 'Zoe@example.test', 'read_only');
    expect(rows(el)).toEqual(['bob@example.test', 'Zoe@example.test']);
  });

  it('changes a level from the list, and shows what the server kept when it refuses', async () => {
    const { share } = server([bob]);
    let el = await dialog();
    let select = rowOf(el, 'bob@example.test').querySelector<El>('alps-select')!;
    select.value = 'full';
    select.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await waitFor(() => share.mock.calls.length === 1 && el.changing === null, 'the change');
    await el.updateComplete;
    expect(share).toHaveBeenCalledWith('Shared/Team', 'bob@example.test', 'full');
    expect(rowOf(el, 'bob@example.test').querySelector<El>('alps-select')!.value).toBe('full');
    cleanup();
    vi.restoreAllMocks();

    server([bob], { share: { ok: false, reason: 'refused' } });
    el = await dialog();
    select = rowOf(el, 'bob@example.test').querySelector<El>('alps-select')!;
    select.value = 'full';
    select.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await waitFor(() => el.changing === null && text(el).includes('folderShare.errorRefused'), 'the refusal');
    await el.updateComplete;
    expect(rowOf(el, 'bob@example.test').querySelector<El>('alps-select')!.value).toBe('read_only');
  });

  it('takes access away once confirmed, and keeps the person when the server refuses', async () => {
    const { unshare } = server([bob, zoe]);
    let el = await dialog();
    await click(rowOf(el, 'bob@example.test').querySelector('alps-icon-btn')!, el);
    const confirm = shadow<El>(el, 'ui-confirm');
    expect(confirm.message).toBe('folderShare.revokeMessage(bob@example.test,Team)');
    expect(unshare).not.toHaveBeenCalled();
    confirm.dispatchEvent(new CustomEvent('confirm'));
    await waitFor(() => unshare.mock.calls.length === 1 && el.changing === null, 'the revoke');
    await el.updateComplete;
    expect(unshare).toHaveBeenCalledWith('Shared/Team', 'bob@example.test');
    expect(rows(el)).toEqual(['Zoe@example.test']);
    expect(el.shadowRoot!.querySelector('ui-confirm')).toBeNull();
    cleanup();
    vi.restoreAllMocks();

    server([bob], { unshare: { ok: false, reason: 'failed' } });
    el = await dialog();
    await click(rowOf(el, 'bob@example.test').querySelector('alps-icon-btn')!, el);
    shadow<El>(el, 'ui-confirm').dispatchEvent(new CustomEvent('confirm'));
    await waitFor(() => el.changing === null && text(el).includes('folderShare.errorGeneric'), 'the refusal');
    expect(rows(el)).toEqual(['bob@example.test']);
  });

  it('asks before taking access away, and a cancel keeps it', async () => {
    const { unshare } = server([bob]);
    const el = await dialog();
    await click(rowOf(el, 'bob@example.test').querySelector('alps-icon-btn')!, el);
    shadow<El>(el, 'ui-confirm').dispatchEvent(new CustomEvent('cancel'));
    await el.updateComplete;
    await flush();
    expect(el.shadowRoot!.querySelector('ui-confirm')).toBeNull();
    expect(unshare).not.toHaveBeenCalled();
    expect(rows(el)).toEqual(['bob@example.test']);
  });

  it('is named by the folder, its fields by their labels, and closes on Done', async () => {
    server([]);
    const el = await dialog();
    expect(shadow<El>(el, 'ui-modal').heading).toBe('folderShare.title(Team)');
    expect(shadow<El>(el, 'alps-input').label).toBe('folderShare.address');
    expect(shadow<El>(el, '.add alps-select').label).toBe('folderShare.level');
    const closed: Event[] = [];
    el.addEventListener('close', e => closed.push(e));
    await click(shadow(el, 'alps-button[slot="actions"]'), el);
    expect(closed).toHaveLength(1);
  });
});
