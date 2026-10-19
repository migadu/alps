/**
 * The rows kept on screen while another folder loads.
 *
 * A folder switch leaves the previous folder's rows up, dimmed, until the new
 * listing replaces them, rather than flashing an empty list. Those rows are
 * still the previous folder's, and are drawn by its rules: Sent and Drafts
 * name a row's recipients where every other folder names its sender, and a
 * search across every folder badges each row with the folder it is in.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, mount, shadowAll, update } from './helpers/dom';
import '../src/components/message-list';

const TAG = 'alps-message-list';
type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), {
  t: (key: string) => key,
  getLanguage: () => 'en',
  getIntlLanguage: () => 'en',
});

const ada = { Name: 'Ada Lovelace', Mailbox: 'ada', Host: 'example.test' };
const grace = { Name: 'Grace Hopper', Mailbox: 'grace', Host: 'example.test' };

/** Ada wrote to Grace: a row names both in the Inbox, and only Grace in Sent. */
const row = (uid: string, Mailbox: string) => ({
  UID: uid,
  Mailbox,
  Flags: ['\\Seen'],
  Envelope: { From: [ada], To: [grace], Cc: [], Subject: `message ${uid}`, Date: '2026-09-01T10:00:00Z' },
});

const senders = (el: El) => shadowAll(el, '.message-sender').map(s => s.textContent?.trim());

afterEach(() => cleanup());

describe('rows kept on screen during a folder switch', () => {
  it('are drawn by the folder they were read from, going into Sent', async () => {
    const el = await mount<El>(TAG, {
      i18nStore,
      messages: [row('1', 'INBOX')],
      currentMailbox: 'INBOX',
      currentMailboxRole: 'inbox',
      listedMailbox: 'INBOX',
      listedMailboxRole: 'inbox',
      showSenderAvatars: false,
    });
    expect(senders(el)).toEqual(['Ada Lovelace, Grace Hopper']);

    // Sent clicked; its listing has not landed.
    await update(el, { currentMailbox: 'Sent', currentMailboxRole: 'sent', loading: true });
    expect(senders(el)).toEqual(['Ada Lovelace, Grace Hopper']);

    // It has: Sent's own rows, drawn as Sent rows.
    await update(el, { messages: [row('7', 'Sent')], listedMailbox: 'Sent', listedMailboxRole: 'sent', loading: false });
    expect(senders(el)).toEqual(['Grace Hopper']);
  });

  it('are drawn by the folder they were read from, coming out of Sent', async () => {
    const el = await mount<El>(TAG, {
      i18nStore,
      messages: [row('7', 'Sent')],
      currentMailbox: 'Sent',
      currentMailboxRole: 'sent',
      listedMailbox: 'Sent',
      listedMailboxRole: 'sent',
      showSenderAvatars: false,
    });
    await update(el, { currentMailbox: 'INBOX', currentMailboxRole: 'inbox', loading: true });
    expect(senders(el)).toEqual(['Grace Hopper']);
  });

  it('keep the folder badges of a search across every folder', async () => {
    const el = await mount<El>(TAG, {
      i18nStore,
      messages: [row('1', 'Work')],
      currentMailbox: '*',
      listedMailbox: '*',
      filterQuery: 'ada',
      showSenderAvatars: false,
    });
    expect(shadowAll(el, '.mailbox-badge').map(b => b.textContent?.trim())).toEqual(['Work']);

    await update(el, { currentMailbox: 'INBOX', currentMailboxRole: 'inbox', filterQuery: '', loading: true });
    expect(shadowAll(el, '.mailbox-badge').map(b => b.textContent?.trim())).toEqual(['Work']);
  });
});
