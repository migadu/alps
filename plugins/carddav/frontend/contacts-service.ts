import { fetchWithTimeout, encodePathParam, HttpStatusError, isGone, outcomeUnknown } from '../../../frontend/src/utils/fetch-utils';

export interface ContactProperty {
  value: string;
  type?: string;
  /** Local editor identity, retained across queued saves and reordering. */
  id?: string;
  /** Position in the last successfully saved list; -1 creates a new copy. */
  source_index?: number;
}

/**
 * A postal address part by part, as a vCard ADR holds it (RFC 6350, 6.3.1),
 * its escapes undone. A part left out is empty.
 */
export interface AddressParts {
  po_box?: string;
  /** The apartment, suite or floor. */
  extended?: string;
  street?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

/** The parts in the order the editor and the card show them. */
export const ADDRESS_PARTS = ['street', 'extended', 'po_box', 'locality', 'region', 'postal_code', 'country'] as const;

/** Whether two addresses have the same parts, as the server compares them: trimmed. */
export function sameAddressParts(a: AddressParts | undefined, b: AddressParts | undefined): boolean {
  return ADDRESS_PARTS.every(part => (a?.[part] || '').trim() === (b?.[part] || '').trim());
}

export interface ContactPayload {
  /** Stable UUID for all retries of one new card; the server uses create-only PUT. */
  creation_id?: string;
  name?: string;
  email?: string;
  emails?: ContactProperty[];
  phone?: string;
  phones?: ContactProperty[];
  /** The preferred address on one line, including its post office box. */
  address?: string;
  /** The same address part by part, which the editor edits. */
  address_parts?: AddressParts;
  /** What the page last held of address_parts, sent with them: the server
   * leaves a preferred address the page did not show alone. */
  address_parts_from?: AddressParts;
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
  /** Single-copy fields changed since the last successful form save. */
  changed_fields?: string[];
  /** What the page held for each of those before the change. */
  changed_from?: Record<string, string>;
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
  /** How many of `failed` may have been written anyway (a timeout, a lost
   * connection, a 5xx). A rollback is the truth only for the rest. */
  uncertain: number;
  /** The version each card that took the change is now at, by path. */
  etags?: Record<string, string>;
  /** The cards among `failed` that were not there to write: deleted on
   * another device since the page read them. Refused, and nothing to retry. */
  gonePaths?: string[];
  /** The cards a delete removed. The counts say how many, and a caller that
   * acts on one card (the open one) needs to know whether it was that one. */
  deletedPaths?: string[];
}

function summarize(settled: PromiseSettledResult<unknown>[]): BulkOutcome {
  let failed = 0;
  let uncertain = 0;
  for (const outcome of settled) {
    if (outcome.status === 'rejected') {
      failed += 1;
      if (outcomeUnknown(outcome.reason)) uncertain += 1;
      // A card deleted elsewhere is not a failure to log: see isGone.
      if (!isGone(outcome.reason)) console.error('Bulk contact operation failed for one item', outcome.reason);
    }
  }
  return { total: settled.length, done: settled.length - failed, failed, uncertain };
}

class ContactsService {
  async fetchContacts(query: string = '') {
    const url = query ? `/contacts?query=${encodeURIComponent(query)}` : '/contacts';
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new HttpStatusError(res.status, data.error || 'contacts_unavailable');
    }
    return res.json();
  }

  async fetchContact(path: string) {
    const res = await fetchWithTimeout(`/contacts/${encodePathParam(path)}`);
    if (!res.ok) {
      throw new HttpStatusError(res.status, `Failed to fetch contact: ${res.statusText}`);
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
      // With its status, so a refusal is told from a failure that may have
      // deleted the card anyway (see outcomeUnknown).
      throw new HttpStatusError(res.status, `Failed to delete contact: ${res.statusText}`);
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
    const gonePaths = targets.filter((_, i) => settled[i].status === 'rejected' && isGone((settled[i] as PromiseRejectedResult).reason)).map(contact => contact.path!);
    return { ...summarize(settled), etags, ...(gonePaths.length > 0 && { gonePaths }) };
  }

  async bulkDeleteContacts(paths: string[]): Promise<BulkOutcome> {
    const settled = await Promise.allSettled(paths.map(path => this.deleteContact(path)));
    const deletedPaths = paths.filter((_, i) => settled[i].status === 'fulfilled');
    return { ...summarize(settled), deletedPaths };
  }
}

export const contactsService = new ContactsService();

/** Whether a fresh card confirms the fields an unacknowledged form tried to save. */
export function confirmsContactSave(card: any, payload: ContactPayload): boolean {
  const text = (value: unknown) => String(value ?? '').trim();
  for (const key of ['name', 'email', 'phone', 'organization', 'title', 'birthday', 'note', 'url', 'nickname', 'public_key']) {
    if ((key === 'email' && Array.isArray(payload.emails)) || (key === 'phone' && Array.isArray(payload.phones))) continue;
    if (Object.hasOwn(payload, key) && text(card[key]) !== text(payload[key])) return false;
  }
  if (payload.address_parts) {
    if (!sameAddressParts(card.address_parts, payload.address_parts)) return false;
  } else if (Object.hasOwn(payload, 'address') && text(card.address) !== text(payload.address)) return false;
  for (const key of ['emails', 'phones']) {
    if (!Array.isArray(payload[key])) continue;
    const normalized = (items: any[]) => items.filter(item => text(item.value)).map(item => [text(item.value), text(item.type).toLowerCase()]);
    if (JSON.stringify(normalized(card[key] || [])) !== JSON.stringify(normalized(payload[key]))) return false;
  }
  return true;
}
