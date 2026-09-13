import { fetchWithTimeout } from '../utils/fetch-utils';
import { encodeMailboxPath } from '../utils/folders';

export interface AuthVerdict {
  HasBimiPotential: boolean;
  HasBimiFailed: boolean;
}

/** The most UIDs one request asks about; the backend refuses more. */
export const VERDICT_CHUNK = 200;

/**
 * The receiving server's authentication verdicts for messages a listing
 * carried none for, keyed by UID: the earlier messages of a thread, which the
 * list leaves out because a server reads the header from each stored message.
 *
 * A UID the server gave no answer for is absent, and a provider that cannot
 * read verdicts answers none. Throws when a request fails.
 */
export async function fetchAuthVerdicts(mailbox: string, uids: string[]): Promise<Map<string, AuthVerdict>> {
  const verdicts = new Map<string, AuthVerdict>();
  for (let i = 0; i < uids.length; i += VERDICT_CHUNK) {
    const chunk = uids.slice(i, i + VERDICT_CHUNK).map(encodeURIComponent).join(',');
    const response = await fetchWithTimeout(`/mailboxes/${encodeMailboxPath(mailbox)}/verdicts?uids=${chunk}`);
    if (!response.ok) throw new Error(`verdicts request failed: ${response.status}`);
    const data = await response.json();
    for (const [uid, value] of Object.entries(data?.Verdicts ?? {})) {
      const v = (value ?? {}) as Partial<AuthVerdict>;
      verdicts.set(uid, { HasBimiPotential: v.HasBimiPotential === true, HasBimiFailed: v.HasBimiFailed === true });
    }
  }
  return verdicts;
}
