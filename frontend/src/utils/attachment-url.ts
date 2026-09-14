import { encodeMailboxPath } from './folders';

/** The loose shape of a stored attachment: the part's position in the message. */
export interface StoredPartLike {
  Path?: number[] | string | null;
}

/**
 * Where a stored attachment's decoded bytes are served.
 *
 * Empty when there is nothing to fetch: no message, or a part with no path. An
 * empty path would name the whole message, so a pill built from it would
 * download the .eml instead of the attachment.
 */
export function attachmentPartUrl(mailbox: string, messageUid: string | number | undefined, attachment: StoredPartLike | null | undefined): string {
  if (!mailbox || messageUid === undefined || messageUid === '' || !attachment) return '';
  const path = Array.isArray(attachment.Path) ? attachment.Path.join('.') : String(attachment.Path ?? '');
  if (!path) return '';
  return `/mailboxes/${encodeMailboxPath(mailbox)}/messages/${messageUid}/raw?part=${path}`;
}
