export const FLAG_SEEN = '\\Seen';
export const FLAG_FLAGGED = '\\Flagged';
export const FLAG_ANSWERED = '\\Answered';
export const FLAG_DELETED = '\\Deleted';
export const FLAG_DRAFT = '\\Draft';
export const FLAG_FORWARDED = '$Forwarded';

// Common non-label extensions to ignore
export const FLAG_MDNSENT = '$MDNSent';
export const FLAG_JUNK = 'Junk';
export const FLAG_NONJUNK = 'NonJunk';
export const FLAG_NOTJUNK = 'NotJunk';
export const FLAG_JUNK_STD = '$Junk';
export const FLAG_NOTJUNK_STD = '$NotJunk';
export const FLAG_PHISHING = '$Phishing';
export const FLAG_SUBMITPENDING = '$SubmitPending';
export const FLAG_SUBMITTED = '$Submitted';

// Mailbox Attributes
export const ATTR_INBOX = '\\Inbox';
export const ATTR_SENT = '\\Sent';
export const ATTR_DRAFTS = '\\Drafts';
export const ATTR_TRASH = '\\Trash';
export const ATTR_JUNK = '\\Junk';
export const ATTR_ARCHIVE = '\\Archive';
export const ATTR_SPAM = '\\Spam';

export interface MessageTag {
  id: string;
  name: string;
  color: string;
}

export function getMessageTags(flags: string[] | undefined, i18nStore?: any): MessageTag[] {
  if (!flags) return [];
  
  const ignoredFlags = new Set([
    FLAG_SEEN, FLAG_FLAGGED, FLAG_ANSWERED, FLAG_DELETED, FLAG_DRAFT, 
    FLAG_FORWARDED, FLAG_MDNSENT, FLAG_JUNK, FLAG_NONJUNK, FLAG_NOTJUNK,
    FLAG_JUNK_STD, FLAG_NOTJUNK_STD, FLAG_PHISHING, FLAG_SUBMITPENDING, FLAG_SUBMITTED
  ].map(f => f.toLowerCase()));

  const tags: MessageTag[] = [];
  
  for (const flag of flags) {
    if (flag.startsWith('\\')) continue;
    if (ignoredFlags.has(flag.toLowerCase())) continue;
    
    tags.push({
      id: flag,
      name: getTagName(flag, i18nStore),
      color: getTagColor(flag)
    });
  }
  
  // Sort predefined tags first, then alphabetically
  return tags.sort((a, b) => {
    const aIsPredef = a.id.toLowerCase().startsWith('$label');
    const bIsPredef = b.id.toLowerCase().startsWith('$label');
    if (aIsPredef && !bIsPredef) return -1;
    if (!aIsPredef && bIsPredef) return 1;
    return a.id.localeCompare(b.id);
  });
}

// Functional keywords that carry protocol meaning and must survive a
// "remove all tags" action (their removal has invisible side effects, e.g.
// re-prompting for read receipts or losing forwarded/submit state).
//
// $Phishing is the server's or filter's warning that a message impersonates
// someone. It is not a label the user chose, and a bulk "remove all tags" that
// looks like tidying must not silently erase the one marker saying a message
// is dangerous.
const PROTECTED_KEYWORDS = new Set(
  [FLAG_FORWARDED, FLAG_MDNSENT, FLAG_PHISHING, FLAG_SUBMITPENDING, FLAG_SUBMITTED].map(f => f.toLowerCase())
);

// Returns every keyword on a message that "remove all tags" should clear:
// anything that isn't an IMAP system flag (\-prefixed) and isn't a protected
// functional keyword. This covers user labels ($label1-5) as well as stray
// keywords other clients/spam filters leave behind (Junk, NotJunk, $NotJunk, ...).
export function getRemovableTags(flags: string[] | undefined): string[] {
  if (!flags) return [];
  return flags.filter(f => !f.startsWith('\\') && !PROTECTED_KEYWORDS.has(f.toLowerCase()));
}

export function getTagName(flag: string, i18nStore?: any): string {
  const normalized = flag.toLowerCase();
  switch (normalized) {
    case '$label1': return i18nStore?.t('tags.important') || 'Important';
    case '$label2': return i18nStore?.t('tags.work') || 'Work';
    case '$label3': return i18nStore?.t('tags.personal') || 'Personal';
    case '$label4': return i18nStore?.t('tags.todo') || 'To Do';
    case '$label5': return i18nStore?.t('tags.later') || 'Later';
    default: return flag;
  }
}

export function getTagColor(flag: string): string {
  const normalized = flag.toLowerCase();
  switch (normalized) {
    case '$label1': return '#ef4444'; // Red (Important)
    case '$label2': return '#f97316'; // Orange (Work)
    case '$label3': return '#22c55e'; // Green (Personal)
    case '$label4': return '#3b82f6'; // Blue (To Do)
    case '$label5': return '#a855f7'; // Purple (Later)
    default: return getStringColor(flag);
  }
}

/**
 * The colour a tag's name is written in on its colour: black or white,
 * whichever contrasts more, by WCAG relative luminance. White alone was below
 * the 4.5:1 that the pill's 10px text needs on every predefined colour (2.3:1
 * on green) and on many custom hues. The better of the two always reaches it:
 * they contrast equally, at about 4.58:1, with a luminance of 0.179.
 */
export function getTagTextColor(color: string): string {
  const rgb = parseTagColor(color);
  if (!rgb) return '#fff';
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Black wins when (L + 0.05) / 0.05 exceeds 1.05 / (L + 0.05).
  return (luminance + 0.05) ** 2 > 0.05 * 1.05 ? '#000' : '#fff';
}

/** The sRGB channels, 0–255, of a colour getTagColor returns: hex or hsl(). */
function parseTagColor(color: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const hsl = /^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i.exec(color.trim());
  if (!hsl) return null;
  const [h, s, l] = [Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100];
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [channel(0), channel(8), channel(4)];
}

// Deterministic color generation for custom tags
function getStringColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use HSL for vibrant, readable colors
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
}
