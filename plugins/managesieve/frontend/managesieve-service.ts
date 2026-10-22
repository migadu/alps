import { fetchWithTimeout } from '../../../frontend/src/utils/fetch-utils';
import { compileAutoReply, hasVacation, mergeAutoReply, splitAutoReply, type AutoReply } from './auto-reply';

/**
 * A save refused because the script would then run two vacation actions: the
 * auto-reply's and one the filters send themselves. RFC 5230 makes that an
 * error (§4.7), and go-sieve's check, which validates the script here, does not
 * catch it, so it is caught before the upload. At delivery it fails one way or
 * another: a server that enforces it stops running the script, so the filters
 * stop filing too, and sora answers with the later reply only.
 */
export class TwoVacationsError extends Error {
  constructor() {
    super('The script would send two vacation replies');
    this.name = 'TwoVacationsError';
  }
}

class ManageSieveService {
  /** The active script as the server holds it, and the Sieve extensions the server runs. */
  private async fetchStored(): Promise<{ content: string; extensions: string[] }> {
    const res = await fetchWithTimeout('/managesieve/script');
    if (!res.ok) {
      throw new Error(`Failed to fetch script: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      content: typeof data.content === 'string' ? data.content : '',
      extensions: Array.isArray(data.extensions) ? data.extensions : [],
    };
  }

  /** The filters: the active script without the auto-reply, which has a page of its own. */
  async fetchScript() {
    const { content } = await this.fetchStored();
    return { content: splitAutoReply(content).filters };
  }

  /**
   * Saves the filters around the auto-reply the server holds NOW. It is read
   * again rather than kept from when the page opened, so a filter save made
   * after the reply was switched on or off, in another tab, keeps it. (Each
   * save is a read and then a write: of two at the same moment, the later
   * write wins.)
   *
   * Filters that send a vacation of their own are refused while the reply is
   * on; switched off, its block holds no vacation and they go through.
   *
   * Resolves to whether the reply is on in the script saved. Filters emptied
   * around a reply that is on are not a script switched off: the reply stays
   * in it and goes on answering.
   */
  async saveScript(script: string, method: 'PUT' | 'POST' = 'PUT'): Promise<{ autoReplyOn: boolean }> {
    const { content } = await this.fetchStored();
    const { block } = splitAutoReply(content);
    const autoReplyOn = hasVacation(block);
    if (autoReplyOn && hasVacation(script)) throw new TwoVacationsError();
    await this.putScript(mergeAutoReply(block, script), method);
    return { autoReplyOn };
  }

  /**
   * The stored auto-reply, if there is one, with what the page needs to decide
   * what to offer: the server's extensions, and whether the filters already
   * send a vacation reply of their own.
   */
  async fetchAutoReply(): Promise<{ reply: AutoReply | null; extensions: string[]; ownVacation: boolean }> {
    const { content, extensions } = await this.fetchStored();
    const { reply, filters } = splitAutoReply(content);
    return { reply, extensions, ownVacation: hasVacation(filters) };
  }

  /**
   * Saves the auto-reply around the filters the server holds now, as they were
   * written. Switching it on is refused when those filters send a vacation of
   * their own, which they may have gained since the page opened.
   */
  async saveAutoReply(reply: AutoReply, address?: string) {
    const { content } = await this.fetchStored();
    const { filters } = splitAutoReply(content);
    if (reply.enabled && hasVacation(filters)) throw new TwoVacationsError();
    return this.putScript(mergeAutoReply(compileAutoReply(reply, { address }), filters));
  }

  private async putScript(script: string, method: 'PUT' | 'POST' = 'PUT') {
    const res = await fetchWithTimeout('/managesieve/script', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: script })
    });
    // The body is read only once the status says it is ours to read. This parsed
    // it first, so a proxy's HTML 502 threw a SyntaxError and the user was shown
    // "Unexpected token '<'" in place of the failure — the defect sendDraft in
    // message-operations already guards against. Success parses as before.
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to save script');
    }
    return res.json();
  }

  async validateScript(script: string) {
    const res = await fetchWithTimeout('/managesieve/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: script })
    });
    // As putScript above: the body is read only once the status says it is
    // ours. A 400 with a JSON body is an ordinary "this script is invalid"
    // answer and its `error` is still what the user sees; only a body that is
    // not JSON — a proxy's HTML 502 — now falls back to 'Validation failed'
    // instead of surfacing a SyntaxError.
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Validation failed');
    }
    return res.json();
  }

  async fetchFolders() {
    const res = await fetchWithTimeout('/mailboxes/INBOX');
    if (!res.ok) {
      throw new Error(`Failed to fetch mailboxes: ${res.statusText}`);
    }
    return res.json();
  }
}

export const managesieveService = new ManageSieveService();
