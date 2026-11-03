/**
 * A contact's postal address, part by part.
 *
 * The editor gave the preferred address one line, and the server split an
 * edited line back into its parts only while it kept its shape: a part added
 * or emptied made the whole line the street, the city, region, postal code
 * and country with it, and the post office box, which the line leaves out,
 * was lost. The card is now given the parts, the editor has a field for
 * each, and the save sends them with what the page last held of them.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, mount, record, shadowAll, waitFor } from './helpers/dom';
import '../../plugins/carddav/frontend/contact-view';
import '../../plugins/carddav/frontend/contacts-page';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';

type El = HTMLElement & Record<string, any>;

const parts = {
  po_box: 'PO Box 7', street: '20 Market Sq, Unit 2', locality: 'Chicago', region: 'IL', postal_code: '60601', country: 'USA',
};

const LABELS = {
  street: 'contacts.addressStreet',
  extended: 'contacts.addressExtended',
  po_box: 'contacts.addressPoBox',
  locality: 'contacts.addressCity',
  region: 'contacts.addressRegion',
  postal_code: 'contacts.addressPostcode',
  country: 'contacts.addressCountry',
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function card(contact: Record<string, unknown>, isEditing: boolean): Promise<El> {
  const el = await mount<El>('alps-contact-view', {
    i18nStore: {
      t: (key: string) => key,
      getLanguage: () => 'en',
      getIntlLanguage: () => 'en',
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    settingsStore: { getState: () => ({ dateFormat: 'YYYY-MM-DD' }) },
    contact: { name: 'Grace Hopper', path: '/card/grace.vcf', ...contact },
    isEditing,
  });
  await el.updateComplete;
  return el;
}

/** The address's fields, by the names they are announced by, in their order. */
function addressFields(el: El): El[] {
  const labels = Object.values(LABELS);
  return shadowAll<El>(el, 'alps-input').filter(f => labels.includes(f.label));
}

async function type(el: El, label: string, value: string): Promise<void> {
  const host = addressFields(el).find(f => f.label === label)!;
  await host.updateComplete;
  const input = host.shadowRoot!.querySelector('input') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await el.updateComplete;
}

describe('the address on the card', () => {
  it('shows its parts one to a line, the post office box among them', async () => {
    const el = await card({ address: '20 Market Sq, Unit 2, Chicago, IL, 60601, USA', address_parts: parts }, false);
    const value = shadowAll<El>(el, '.detail-group')
      .find(group => group.querySelector('.group-label')?.textContent === 'contacts.address')
      ?.querySelector('.group-value')?.textContent;
    expect(value).toBe('20 Market Sq, Unit 2\nPO Box 7\nChicago\nIL\n60601\nUSA');
  });
});

describe('the address in the editor', () => {
  it('has a field for each part, holding it', async () => {
    const el = await card({ address_parts: parts }, true);
    const fields = addressFields(el);
    expect(fields.map(f => f.label)).toEqual(Object.values(LABELS));
    expect(fields.map(f => f.value)).toEqual(['20 Market Sq, Unit 2', '', 'PO Box 7', 'Chicago', 'IL', '60601', 'USA']);
  });

  it('saves the part typed, and the others as they were', async () => {
    const el = await card({ address_parts: parts }, true);
    const saves = record<CustomEvent>(el, 'save');
    await type(el, LABELS.region, '');
    await type(el, LABELS.locality, 'Evanston');
    await waitFor(() => saves.length > 0, 'the autosave', 2000);
    expect(saves[0].detail.address_parts).toEqual({ ...parts, region: '', locality: 'Evanston' });
    // The open card is not edited in place.
    expect(el.contact.address_parts).toEqual(parts);
  });

  it('gives a card without an address its parts', async () => {
    const el = await card({}, true);
    const saves = record<CustomEvent>(el, 'save');
    await type(el, LABELS.street, '1 Main St');
    await waitFor(() => saves.length > 0, 'the autosave', 2000);
    expect(saves[0].detail.address_parts).toEqual({ street: '1 Main St' });
  });
});

describe('the save', () => {
  const opened = {
    path: '/book/grace.vcf', etag: 'v1', name: 'Grace Hopper',
    address: '20 Market Sq, Unit 2, Chicago, IL, 60601, USA', address_parts: parts,
  };
  function page(): El {
    const el = document.createElement('contacts-page') as El;
    el.contacts = [{ ...opened }];
    el.selectedContact = { ...opened };
    return el;
  }

  it('sends the parts with what the page held of them, and says the address changed', async () => {
    const el = page();
    const write = vi.spyOn(contactsService, 'updateContact').mockResolvedValue({ ok: 'true', path: opened.path, etag: 'v2' });
    const moved = { ...parts, locality: 'Evanston' };
    await el.handleSave({ ...opened, address_parts: moved });
    expect(write.mock.calls[0][1]).toMatchObject({
      changed_fields: ['address'], address_parts: moved, address_parts_from: parts, etag: 'v1',
    });

    // Then from the parts that save stored, and no change while they stay.
    await el.handleSave({ ...opened, address_parts: { ...moved, region: 'Illinois' } });
    expect(write.mock.calls[1][1]).toMatchObject({ changed_fields: ['address'], address_parts_from: moved, etag: 'v2' });
    await el.handleSave({ ...opened, address_parts: { ...moved, region: 'Illinois' }, note: 'Navy' });
    expect(write.mock.calls[2][1].changed_fields).toEqual(['note']);
    expect(el.selectedContact.address_parts).toEqual({ ...moved, region: 'Illinois' });
  });

  it('creates a contact with the parts typed', async () => {
    const el = document.createElement('contacts-page') as El;
    const temporary = { isTemporary: true, name: '' };
    el.contacts = [temporary];
    el.selectedContact = temporary;
    const create = vi.spyOn(contactsService, 'createContact').mockResolvedValue({ ok: 'true', path: '/book/new.vcf', etag: 'v1' });
    await el.handleSave({ ...temporary, name: 'Ada', address_parts: { street: '1 Main St' } });
    expect(create.mock.calls[0][0]).toMatchObject({ address_parts: { street: '1 Main St' }, address_parts_from: {} });
  });
});
