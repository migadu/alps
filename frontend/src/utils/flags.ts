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
    FLAG_FORWARDED, FLAG_MDNSENT, FLAG_JUNK, FLAG_NONJUNK, FLAG_SUBMITPENDING, FLAG_SUBMITTED
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
