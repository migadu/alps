/**
 * A message's identity across folders, and the separator that holds it.
 *
 * The key joins a mailbox and a UID with a NUL, a character no mailbox name
 * holds. Written into the source as the raw byte, it was invisible in a diff
 * and in most editors, and an editor or a paste that dropped it would have
 * broken every key without a visible change; so the source spells it as an
 * escape, and no source file holds a raw control character at all.
 */
import { describe, expect, it } from 'vitest';
import { messageKey, parseMessageKey, uidsByMailbox } from '../src/utils/message-key';
import { readSources } from './helpers/sources';

describe('message keys', () => {
  it('join the mailbox and the UID with a NUL, and split back into both', () => {
    expect(messageKey('INBOX', 42)).toBe('INBOX\u000042');
    expect(parseMessageKey(messageKey('[Gmail]/All Mail', '7'))).toEqual({ mailbox: '[Gmail]/All Mail', uid: '7' });
  });

  it('read a bare UID as one with no mailbox', () => {
    expect(parseMessageKey('42')).toEqual({ mailbox: '', uid: '42' });
  });

  it('group UIDs by mailbox', () => {
    const keys = [messageKey('INBOX', 1), messageKey('Sent', 2), messageKey('INBOX', 3)];
    expect([...uidsByMailbox(keys)]).toEqual([['INBOX', ['1', '3']], ['Sent', ['2']]]);
  });
});

describe('the source', () => {
  it('writes control characters as escapes, never as raw bytes', () => {
    const sources = readSources();
    const raw = Object.keys(sources).filter((path) => /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(sources[path]));
    expect(raw).toEqual([]);
  });
});
