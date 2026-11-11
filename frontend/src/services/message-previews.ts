import { fetchWithTimeout } from '../utils/fetch-utils';
import { encodeMailboxPath } from '../utils/folders';

export interface PreviewAnswer {
  /** The previews the server answered, keyed by UID. */
  previews: Map<string, string>;
  /** What the UIDs referred to when answered: the same UID under another scope is another message. */
  scope: string;
  /** False when the mail server offers no previews: there is nothing more to ask. */
  supported: boolean;
}

/**
 * How many UIDs the message list asks about per request; the backend refuses
 * more than ten. A preview the mail server has not got to hand costs it a
 * download from storage, one message after another, on the session's
 * background connection or, without one, its own. A few at a time keeps each
 * request short, so a folder opened meanwhile does not wait behind it.
 */
export const PREVIEW_BATCH = 5;

/**
 * The previews of messages a listing marked PreviewPending, keyed by UID. A
 * message the server gave no preview for is absent. Throws when the request
 * fails.
 */
export async function fetchPreviews(mailbox: string, uids: string[]): Promise<PreviewAnswer> {
  const query = uids.map(encodeURIComponent).join(',');
  // Nobody waits on a preview: the list is already on screen.
  const response = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/previews?uids=${query}`, {}, undefined, { background: true });
  if (!response.ok) throw new Error(`previews request failed: ${response.status}`);
  const data = await response.json();
  const previews = new Map<string, string>();
  for (const [uid, text] of Object.entries(data?.Previews ?? {})) {
    if (typeof text === 'string') previews.set(uid, text);
  }
  return { previews, scope: typeof data?.Scope === 'string' ? data.Scope : '', supported: data?.Supported === true };
}
