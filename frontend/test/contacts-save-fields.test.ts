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
