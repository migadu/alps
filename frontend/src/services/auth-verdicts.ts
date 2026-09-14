import { fetchWithTimeout } from '../utils/fetch-utils';
import { encodeMailboxPath } from '../utils/folders';

export interface AuthVerdict {
  HasBimiPotential: boolean;
  HasBimiFailed: boolean;
}

export interface AuthVerdictAnswer {
  verdicts: Map<string, AuthVerdict>;
  /** What the UIDs referred to when answered: the same UID under another scope is another message. */
  scope: string;
}

/** The most UIDs one request asks about; the backend refuses more. */
export const VERDICT_CHUNK = 200;

/**
 * How many UIDs the message list asks about per request. A mail server may
 * read each message's header from storage one at a time, about a third of a
 * second each for older mail, and a request holds the session's connection to
 * the mail server while it runs: opening a folder waits for the batch already
 * asked. Three keeps that wait near a second.
 */
export const VERDICT_BATCH = 3;

/**
 * The receiving server's authentication verdicts for messages, keyed by UID.
 * Listings carry none, because a server reads the header from each stored
 * message.
 *
 * A UID the server gave no answer for is absent, and a provider that cannot
 * read verdicts answers none. Throws when a request fails, or when chunks were
 * answered under different scopes.
 */
export async function fetchAuthVerdicts(mailbox: string, uids: string[]): Promise<AuthVerdictAnswer> {
  const verdicts = new Map<string, AuthVerdict>();
  let scope: string | null = null;
  for (let i = 0; i < uids.length; i += VERDICT_CHUNK) {
    const chunk = uids.slice(i, i + VERDICT_CHUNK).map(encodeURIComponent).join(',');
    const response = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/verdicts?uids=${chunk}`);
    if (!response.ok) throw new Error(`verdicts request failed: ${response.status}`);
    const data = await response.json();
    const chunkScope = typeof data?.Scope === 'string' ? data.Scope : '';
    if (scope !== null && chunkScope !== scope) throw new Error('verdicts were answered under different scopes');
    scope = chunkScope;
    for (const [uid, value] of Object.entries(data?.Verdicts ?? {})) {
      const v = (value ?? {}) as Partial<AuthVerdict>;
      verdicts.set(uid, { HasBimiPotential: v.HasBimiPotential === true, HasBimiFailed: v.HasBimiFailed === true });
    }
  }
  return { verdicts, scope: scope ?? '' };
}
