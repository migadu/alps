/**
 * Which keywords are the user's tags, and which belong to the protocol.
 *
 * Both directions fail silently on screen: a machine keyword leaking through
 * renders "$MDNSent" as a coloured tag, and a user keyword filtered out hides a
 * label the user applied.
 */
import { describe, expect, it } from 'vitest';
import { getMessageTags, getRemovableTags, getTagColor, getTagName } from '../src/utils/flags';

const ids = (flags: string[]) => getMessageTags(flags).map((t) => t.id);

describe('visible tags', () => {
  it('shows the predefined labels and keywords the user invented', () => {
    expect(ids(['$label1'])).toEqual(['$label1']);
    expect(ids(['receipts'])).toEqual(['receipts']);
  });

  it('hides system flags', () => {
    expect(ids(['\\Seen', '\\Flagged', '\\Answered', '\\Draft', '\\Deleted'])).toEqual([]);
  });

  it('hides keywords that carry protocol meaning, in any case', () => {
    const machine = [
      '$Forwarded', '$MDNSent', 'Junk', 'NonJunk', 'NotJunk',
      '$Junk', '$NotJunk', '$Phishing', '$SubmitPending', '$Submitted',
    ];
    expect(ids(machine)).toEqual([]);
    expect(ids(machine.map((k) => k.toLowerCase()))).toEqual([]);
    expect(ids([...machine, '$label2'])).toEqual(['$label2']);
  });

  it('puts the predefined labels first, then the rest alphabetically', () => {
    expect(ids(['zebra', '$label3', 'apple', '$label1'])).toEqual(['$label1', '$label3', 'apple', 'zebra']);
  });

  it('answers empty for no flags', () => {
    expect(getMessageTags(undefined)).toEqual([]);
    expect(getMessageTags([])).toEqual([]);
  });

  it('names and colours each tag', () => {
    expect(getMessageTags(['$label2'])[0]).toEqual({ id: '$label2', name: 'Work', color: '#f97316' });
  });
});

describe('what "remove all tags" clears', () => {
  it('clears user labels and leaves system flags alone', () => {
    expect(getRemovableTags(['$label1', '\\Seen', 'receipts'])).toEqual(['$label1', 'receipts']);
  });

  it('clears markers other clients and spam filters leave behind', () => {
    expect(getRemovableTags(['NotJunk', '$Junk', 'Junk'])).toEqual(['NotJunk', '$Junk', 'Junk']);
  });

  it('keeps the keywords whose removal has side effects, in any case', () => {
    // Dropping $MDNSent re-arms a read receipt; dropping $Submitted loses the
    // record that the message went out.
    expect(getRemovableTags(['$Forwarded', '$MDNSent', '$SubmitPending', '$Submitted'])).toEqual([]);
    expect(getRemovableTags(['$mdnsent', '$FORWARDED'])).toEqual([]);
  });

  it('keeps the phishing warning, in any case', () => {
    expect(getRemovableTags(['$Phishing', '$label1'])).toEqual(['$label1']);
    expect(getRemovableTags(['$phishing', '$PHISHING', 'receipts'])).toEqual(['receipts']);
  });

  it('answers empty for no flags', () => {
    expect(getRemovableTags(undefined)).toEqual([]);
  });
});

describe('tag names and colours', () => {
  it('names the five predefined labels, in any case', () => {
    expect(['$label1', '$label2', '$label3', '$label4', '$label5'].map((f) => getTagName(f))).toEqual([
      'Important', 'Work', 'Personal', 'To Do', 'Later',
    ]);
    expect(getTagName('$LABEL1')).toBe('Important');
  });

  it('translates them when a dictionary is given', () => {
    const i18n = { t: (key: string) => `<${key}>` };
    expect(getTagName('$label4', i18n)).toBe('<tags.todo>');
  });

  it('shows any other keyword as written', () => {
    expect(getTagName('Receipts')).toBe('Receipts');
  });

  it('colours a custom keyword the same way every time', () => {
    expect(getTagColor('receipts')).toBe(getTagColor('receipts'));
    expect(getTagColor('receipts')).toMatch(/^hsl\(\d+, 70%, 45%\)$/);
    expect(getTagColor('$label1')).toBe('#ef4444');
  });
});
