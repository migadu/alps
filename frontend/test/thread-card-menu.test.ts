/**
 * A thread card's own menu: the verbs about ONE message.
 *
 * Over a conversation the reader's toolbar acts on all of it, so everything
 * about a single message — its read state, printing it, downloading it, its
 * source, deleting it — is asked of that message's card.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, installResizeObserver, mount, record, shadow, shadowAll } from './helpers/dom';
import '../src/components/alps-thread-card';

const TAG = 'alps-thread-card';
type El = HTMLElement & Record<string, any>;

const i18nStore = Object.assign(new EventTarget(), { t: (key: string) => key });

const item = (flags: string[]) => ({
  message: {
    UID: '7',
    Flags: flags,
    Envelope: { From: [{ Name: 'Ada', Mailbox: 'ada', Host: 'example.com' }], To: [], Cc: [], Subject: 'Engines', Date: '2026-09-01T10:00:00Z' },
  },
  content: 'hello',
  mimeType: 'text/plain',
  loading: false,
  attachments: [],
  rawMessageHtml: '',
  hasHtml: false,
  hasText: true,
  activeBanners: [],
  allowRemoteResources: false,
  hasRemoteResources: false,
  isSent: false,
  mailbox: 'INBOX',
  expanded: true,
});

async function card(flags: string[] = ['\\Seen'], props: Record<string, unknown> = {}): Promise<El> {
  return mount<El>(TAG, { i18nStore, item: item(flags), mailbox: 'INBOX', ...props });
}

/** Every menu entry, by its label; an entry with no label reads as ''. */
const entries = (el: El) =>
  shadowAll<HTMLButtonElement>(el, '.card-more-menu .dropdown-item')
    .map(b => (b.querySelector('.item-text')?.textContent ?? '').trim());

function entry(el: El, label: string): HTMLButtonElement {
  const found = shadowAll<HTMLButtonElement>(el, '.card-more-menu .dropdown-item')
    .find(b => (b.querySelector('.item-text')?.textContent ?? '').trim() === label);
  expect(found, `no menu entry "${label}"`).toBeTruthy();
  return found!;
}

beforeEach(() => installResizeObserver());
afterEach(() => cleanup());

describe('a thread card\'s menu', () => {
  it('labels every entry, with its icon', async () => {
    const el = await card(['\\Seen'], { canToggleRead: true });

    expect(entries(el)).toEqual([
      'messageReader.reply', 'messageReader.replyAll', 'messageReader.forward',
      'messageReader.markUnread', 'messageReader.print', 'messageReader.downloadMessage', 'messageReader.showOriginal',
      'messageReader.delete',
    ]);
    for (const button of shadowAll(el, '.card-more-menu .dropdown-item')) {
      expect(button.querySelector('svg'), 'every entry has its icon').not.toBeNull();
    }
  });

  it('asks for what it offers, on this card', async () => {
    const el = await card();
    const asked = record<CustomEvent>(el, 'action-for-item');

    entry(el, 'messageReader.print').click();
    entry(el, 'messageReader.downloadMessage').click();
    entry(el, 'messageReader.showOriginal').click();

    expect(asked.map(e => e.detail.action)).toEqual(['print', 'downloadMessage', 'showOriginal']);
    expect(asked.every(e => e.detail.item === el.item)).toBe(true);
  });

  it('keeps Delete on its own event', async () => {
    const el = await card();
    const deletes = record<CustomEvent>(el, 'delete-item');
    const asked = record(el, 'action-for-item');

    entry(el, 'messageReader.delete').click();

    expect(deletes.map(e => e.detail.item)).toEqual([el.item]);
    expect(asked).toHaveLength(0);
  });

  it('calls its Delete what it does to a draft', async () => {
    const draft = await card(['\\Seen', '\\Draft']);
    expect(entries(draft)).toContain('messageReader.discardDraft');
    expect(entries(draft)).not.toContain('messageReader.delete');

    const deletes = record<CustomEvent>(draft, 'delete-item');
    entry(draft, 'messageReader.discardDraft').click();
    expect(deletes.map(e => e.detail.item)).toEqual([draft.item]);
  });

  it('offers the read toggle only where the reader allows it, pointing the way the flag says', async () => {
    expect(entries(await card(['\\Seen']))).not.toContain('messageReader.markUnread');

    const read = await card(['\\Seen'], { canToggleRead: true });
    const fromRead = record<CustomEvent>(read, 'action-for-item');
    entry(read, 'messageReader.markUnread').click();
    expect(fromRead.map(e => e.detail.action)).toEqual(['markUnread']);

    const unread = await card([], { canToggleRead: true });
    const fromUnread = record<CustomEvent>(unread, 'action-for-item');
    expect(entries(unread)).not.toContain('messageReader.markUnread');
    entry(unread, 'messageReader.markRead').click();
    expect(fromUnread.map(e => e.detail.action)).toEqual(['markRead']);
  });

  it('never stacks or strands a divider', async () => {
    for (const props of [{}, { canToggleRead: true }]) {
      const el = await card(['\\Seen'], props);
      const children = Array.from(shadow(el, '.card-more-menu').children).filter(c => c.getAttribute('slot') !== 'trigger');
      const isDivider = (c: Element) => c.classList.contains('dropdown-divider');
      expect(isDivider(children[0])).toBe(false);
      expect(isDivider(children[children.length - 1])).toBe(false);
      for (let i = 0; i < children.length - 1; i++) {
        expect(isDivider(children[i]) && isDivider(children[i + 1]), `consecutive dividers at ${i}`).toBe(false);
      }
    }
  });
});

describe('a draft\'s card', () => {
  it('offers to discard the draft beside resuming it', async () => {
    // Edit Draft alone left the menu's Delete as the only way to drop a draft
    // being looked at, under a caption that did not say what it does to one.
    const el = await card(['\\Seen', '\\Draft']);
    const deletes = record<CustomEvent>(el, 'delete-item');
    const edits = record<CustomEvent>(el, 'edit-draft-for-item');
    const buttons = shadowAll<HTMLElement>(el, 'alps-banner alps-button');

    expect(buttons.map(b => (b.textContent ?? '').trim()))
      .toEqual(['messageReader.editDraft', 'messageReader.discardDraft']);
    buttons[1].click();

    expect(deletes.map(e => e.detail.item)).toEqual([el.item]);
    expect(edits).toHaveLength(0);
  });

  it('is not offered on an ordinary message', async () => {
    const el = await card();
    expect(shadowAll(el, 'alps-banner alps-button')).toHaveLength(0);
  });
});
