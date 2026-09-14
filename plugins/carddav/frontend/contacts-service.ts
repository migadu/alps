import { fetchWithTimeout, encodePathParam, HttpStatusError } from '../../../frontend/src/utils/fetch-utils';

export interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  note?: string;
  title?: string;
  organization?: string;
  url?: string;
  nickname?: string;
  categories?: string[];
  path?: string;
  /** The version the card was opened at; see ContactsService.updateContact. */
  etag?: string;
  [key: string]: any;
}

/** What a write answers: where the card is, and the version now stored. */
export interface SavedContact {
  ok: string;
  path: string;
  etag?: string;
}

/** The split of a bulk gesture: how many items it was asked for, and how many
 * of them the server refused. */
export interface BulkOutcome {
  total: number;
  /** How many were written; with `failed`, tells a refusal of every card from a partial run. */
  done: number;
  failed: number;
  /** The version each card that took the change is now at, by path. */
  etags?: Record<string, string>;
}

function summarize(settled: PromiseSettledResult<unknown>[]): BulkOutcome {
  let failed = 0;
  for (const outcome of settled) {
    if (outcome.status === 'rejected') {
      failed += 1;
      console.error('Bulk contact operation failed for one item', outcome.reason);
    }
  }
  return { total: settled.length, done: settled.length - failed, failed };
}

class ContactsService {
  async fetchContacts(query: string = '') {
    const url = query ? `/contacts?query=${encodeURIComponent(query)}` : '/contacts';
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch contacts: ${res.statusText}`);
    }
    return res.json();
  }

  async fetchContact(path: string) {
    const res = await fetchWithTimeout(`/contacts/${encodePathParam(path)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch contact: ${res.statusText}`);
    }
    return res.json();
  }

  async createContact(payload: ContactPayload) {
    const res = await fetchWithTimeout('/contacts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new HttpStatusError(res.status, `Failed to create contact: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Saves the whole card from the form. `payload.etag` names the version the
   * form was opened at, and the server refuses the save with 412 when the card
   * has been saved elsewhere since: see isVersionConflict.
   */
  async updateContact(path: string, payload: ContactPayload): Promise<SavedContact> {
    const res = await fetchWithTimeout(`/contacts/${encodePathParam(path)}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new HttpStatusError(res.status, `Failed to update contact: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Sets a card's categories and nothing else.
   *
   * For a star or a category change, which says nothing about the rest of the
   * card. Those used to save the whole card as the list row had it, writing
   * every other field back from the version the list was loaded at, so a phone
   * number changed on another device since was put back by a star. The server
   * applies this to the card as stored, and re-reads once if it moved between
   * that read and the write.
   */
  async updateCategories(path: string, categories: string[]): Promise<SavedContact> {
    const res = await fetchWithTimeout(`/contacts/${encodePathParam(path)}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories })
    });
    if (!res.ok) {
      throw new HttpStatusError(res.status, `Failed to update contact: ${res.statusText}`);
    }
    return res.json();
  }

  async deleteContact(path: string) {
    const res = await fetchWithTimeout(`/contacts/${encodePathParam(path)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      throw new Error(`Failed to delete contact: ${res.statusText}`);
    }
  }

  /**
   * What a bulk gesture actually did, per item rather than as one throw.
   *
   * These were `Promise.all`, which rejects on the FIRST failure while every
   * other request is already in flight and still completes. So a bulk delete of
   * ten contacts where one fails leaves nine gone on the server and hands the
   * caller a single rejection that says nothing about which — and the callers
   * treated that rejection as "nothing happened", skipping the re-fetch in the
   * success path and leaving nine deleted contacts on screen.
   *
   * allSettled reports the split instead, so a caller can say how many failed
   * and always re-read the list.
   */
  async bulkUpdateCategories(contacts: ContactPayload[]): Promise<BulkOutcome> {
    const targets = contacts.filter(contact => contact.path);
    const settled = await Promise.allSettled(
      targets.map(contact => this.updateCategories(contact.path!, contact.categories ?? []))
    );
    const etags: Record<string, string> = {};
    settled.forEach((outcome, i) => {
      if (outcome.status === 'fulfilled' && outcome.value?.etag) etags[targets[i].path!] = outcome.value.etag;
    });
    return { ...summarize(settled), etags };
  }

  async bulkDeleteContacts(paths: string[]): Promise<BulkOutcome> {
    const settled = await Promise.allSettled(paths.map(path => this.deleteContact(path)));
    return summarize(settled);
  }
}

export const contactsService = new ContactsService();
