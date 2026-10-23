import { afterEach, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contacts-page';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';

type Page = HTMLElement & Record<string, any>;
const initial = { path: '/book/a.vcf', etag: 'v1', name: 'Ada', address: 'Home', url: 'https://work.example', note: 'Before' };
function page(): Page {
  const el = document.createElement('contacts-page') as Page;
  el.contacts = [{ ...initial }];
  el.selectedContact = { ...initial };
  return el;
}
afterEach(() => vi.restoreAllMocks());

it('does not repeat a clear on later unrelated autosaves', async () => {
  const el = page();
  const write = vi.spyOn(contactsService, 'updateContact').mockResolvedValue({ ok: 'true', path: initial.path, etag: 'v2' });
  const cleared = { ...initial, address: '', url: '' };
  await el.handleSave(cleared);
  expect(write.mock.calls[0][1].changed_fields).toEqual(['url', 'address']);
  await el.handleSave({ ...cleared, note: 'After' });
  expect(write.mock.calls[1][1]).toMatchObject({ changed_fields: ['note'], etag: 'v2' });
  await el.handleSave({ ...cleared, note: 'After' });
  expect(write.mock.calls[2][1].changed_fields).toEqual([]);
});

it('compares queued edits to the successful request snapshot', async () => {
  const el = page();
  let finish!: (value: any) => void;
  const write = vi.spyOn(contactsService, 'updateContact')
    .mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockResolvedValue({ ok: 'true', path: initial.path, etag: 'v3' });
  const first = { ...initial, address: '', url: '' };
  const saving = el.handleSave(first);
  // Editing the very same object while the request is in flight cannot
  // make that newer value appear to have been saved by the first request.
  first.note = 'Queued';
  await el.handleSave(first);
  finish({ ok: 'true', path: initial.path, etag: 'v2' });
  await saving;
  expect(write).toHaveBeenCalledTimes(2);
  expect(write.mock.calls[1][1]).toMatchObject({ changed_fields: ['note'], note: 'Queued', etag: 'v2' });
  expect(el.selectedContact.note).toBe('Queued');
});

it('does not acknowledge fields from a failed request', async () => {
  const el = page();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const write = vi.spyOn(contactsService, 'updateContact')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ ok: 'true', path: initial.path, etag: 'v2' });
  await el.handleSave({ ...initial, address: '' });
  await el.handleSave({ ...initial, address: '', note: 'Retry' });
  expect(write.mock.calls[1][1]).toMatchObject({ changed_fields: ['note', 'address'], etag: 'v1' });
});

it('targets coalesced remove/edit and new entries by the last saved positions', async () => {
  const el = page();
  el.selectedContact.emails = [{ value: 'work@example.test', type: 'work' }, { value: 'home@example.test', type: 'home' }];
  const write = vi.spyOn(contactsService, 'updateContact').mockResolvedValue({ ok: 'true', path: initial.path, etag: 'v2' });
  const changed = { ...initial, emails: [{ id: 'emails:1', value: 'changed@example.test', type: 'home' }] };
  await el.handleSave(changed);
  expect(write.mock.calls[0][1].emails).toEqual([{ value: 'changed@example.test', type: 'home', source_index: 1 }]);
  await el.handleSave({ ...changed, emails: [{ id: 'emails:1', value: 'again@example.test', type: 'home' }, { id: 'new-entry', value: 'new@example.test', type: 'work' }] });
  expect(write.mock.calls[1][1].emails).toEqual([
    { value: 'again@example.test', type: 'home', source_index: 0 },
    { value: 'new@example.test', type: 'work', source_index: -1 },
  ]);
});

it('keeps the successful multi-field snapshot while a newer form is queued', async () => {
  const el = page();
  el.selectedContact.phones = [{ value: '111', type: 'work' }, { value: '222', type: 'home' }];
  let finish!: (value: any) => void;
  const write = vi.spyOn(contactsService, 'updateContact')
    .mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockResolvedValue({ ok: 'true', path: initial.path, etag: 'v3' });
  const first = { ...initial, phones: [{ id: 'phones:1', value: '333', type: 'home' }] };
  const saving = el.handleSave(first);
  first.phones[0].value = '444';
  await el.handleSave(first);
  finish({ ok: 'true', path: initial.path, etag: 'v2' });
  await saving;
  expect(write.mock.calls[0][1].phones).toEqual([{ value: '333', type: 'home', source_index: 1 }]);
  expect(write.mock.calls[1][1].phones).toEqual([{ value: '444', type: 'home', source_index: 0 }]);
  expect(el.selectedContact.phones[0].value).toBe('444');
});

it('keeps source positions after a failed request and keeps legacy lists unindexed', async () => {
  const el = page();
  el.selectedContact.emails = [{ value: 'work@example.test' }, { value: 'home@example.test' }];
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const write = vi.spyOn(contactsService, 'updateContact')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ ok: 'true', path: initial.path, etag: 'v2' });
  const payload = { ...initial, emails: [{ id: 'emails:1', value: 'changed@example.test' }] };
  await el.handleSave(payload);
  await el.handleSave(payload);
  expect(write.mock.calls[1][1].emails![0].source_index).toBe(1);
  await el.handleSave({ ...initial, emails: [{ value: 'legacy@example.test' }] });
  expect(write.mock.calls[2][1].emails![0]).not.toHaveProperty('source_index');
});
