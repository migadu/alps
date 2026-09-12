import { fetchWithTimeout, encodePathParam } from '../../../frontend/src/utils/fetch-utils';

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
  [key: string]: any;
}

/** The split of a bulk gesture: how many items it was asked for, and how many
 * of them the server refused. */
export interface BulkOutcome {
  total: number;
  failed: number;
}

function summarize(settled: PromiseSettledResult<unknown>[]): BulkOutcome {
  let failed = 0;
  for (const outcome of settled) {
    if (outcome.status === 'rejected') {
      failed += 1;
      console.error('Bulk contact operation failed for one item', outcome.reason);
    }
  }
  return { total: settled.length, failed };
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
      throw new Error(`Failed to create contact: ${res.statusText}`);
    }
    return res.json();
  }

  async updateContact(path: string, payload: ContactPayload) {
    const res = await fetchWithTimeout(`/contacts/${encodePathParam(path)}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Failed to update contact: ${res.statusText}`);
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
  async bulkUpdateContacts(contacts: ContactPayload[]): Promise<BulkOutcome> {
    const targets = contacts.filter(contact => contact.path);
    const settled = await Promise.allSettled(
      targets.map(contact => this.updateContact(contact.path!, contact))
    );
    return summarize(settled);
  }

  async bulkDeleteContacts(paths: string[]): Promise<BulkOutcome> {
    const settled = await Promise.allSettled(paths.map(path => this.deleteContact(path)));
    return summarize(settled);
  }
}

export const contactsService = new ContactsService();
