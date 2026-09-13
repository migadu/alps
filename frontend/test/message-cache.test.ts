import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageCache } from '../src/utils/message-cache';

const body = (overrides: Record<string, unknown> = {}) => ({
  Message: { Uid: 5, Envelope: { Subject: 'Engines' } },
  Part: { MIMEType: 'text', MIMESubType: 'html' },
  RawHtml: '<p>hi</p>',
  HasHTML: true,
  HasText: false,
  ...overrides,
});

beforeEach(() => {
  sessionStorage.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('round trip', () => {
  it('returns what was stored, with the time it was stored', () => {
    MessageCache.set('INBOX', '5', 'html', body());
    const hit = MessageCache.get('INBOX', '5', 'html');
    expect(hit).toMatchObject(body());
    expect(typeof hit?.timestamp).toBe('number');
  });

  it('keys by mailbox, UID and view', () => {
    // UIDs repeat across mailboxes, and the two views hold different bodies.
    MessageCache.set('INBOX', '5', 'html', body());
    expect(MessageCache.get('Archive', '5', 'html')).toBeNull();
    expect(MessageCache.get('INBOX', '6', 'html')).toBeNull();
    expect(MessageCache.get('INBOX', '5', 'text')).toBeNull();
  });

  it('defaults to the HTML view', () => {
    MessageCache.set('INBOX', '5', 'html', body());
    expect(MessageCache.get('INBOX', '5')).not.toBeNull();
  });
});

describe('expiry and eviction', () => {
  it('treats an entry older than thirty minutes as a miss and removes it', () => {
    MessageCache.set('INBOX', '5', 'html', body());
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now + 31 * 60 * 1000);
    expect(MessageCache.get('INBOX', '5', 'html')).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it('keeps an entry younger than that', () => {
    MessageCache.set('INBOX', '5', 'html', body());
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now + 29 * 60 * 1000);
    expect(MessageCache.get('INBOX', '5', 'html')).not.toBeNull();
  });

  it('clears only its own keys', () => {
    sessionStorage.setItem('unrelated', 'keep me');
    MessageCache.set('INBOX', '5', 'html', body());
    MessageCache.set('Archive', '9', 'text', body());
    MessageCache.clear();
    expect(MessageCache.get('INBOX', '5', 'html')).toBeNull();
    expect(MessageCache.get('Archive', '9', 'text')).toBeNull();
    expect(sessionStorage.getItem('unrelated')).toBe('keep me');
  });
});

describe('failure is never the caller\'s problem', () => {
  it('declines an oversized message without evicting the rest', () => {
    MessageCache.set('INBOX', '1', 'html', body());
    MessageCache.set('INBOX', '2', 'html', body({ RawHtml: 'x'.repeat(3 * 1024 * 1024) }));
    expect(MessageCache.get('INBOX', '2', 'html')).toBeNull();
    expect(MessageCache.get('INBOX', '1', 'html')).not.toBeNull();
  });

  it('answers a corrupted entry with a miss', () => {
    sessionStorage.setItem('alps_msg_INBOX_5_html', '{not json');
    expect(MessageCache.get('INBOX', '5', 'html')).toBeNull();
  });

  it('clears and retries once when storage is full', () => {
    MessageCache.set('INBOX', '1', 'html', body());
    const original = Storage.prototype.setItem;
    let calls = 0;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (++calls === 1) throw new DOMException('full', 'QuotaExceededError');
      return original.call(this, key, value);
    });
    expect(() => MessageCache.set('INBOX', '2', 'html', body())).not.toThrow();
    expect(MessageCache.get('INBOX', '2', 'html')).not.toBeNull();
    expect(MessageCache.get('INBOX', '1', 'html')).toBeNull();
  });

  it('gives up quietly when storage stays full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => MessageCache.set('INBOX', '2', 'html', body())).not.toThrow();
  });
});
