import { afterEach, expect, it, vi } from 'vitest';
import '../../plugins/carddav/frontend/contacts-page';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import { I18nStore } from '../src/store/i18n-store';

type Page = HTMLElement & Record<string, any>;
const original = { path: '/book/a.vcf', etag: 'v1', name: 'Ada', note: 'Before' };
const page = (contact: any): Page => {
  const el = document.createElement('contacts-page') as Page;
  el.contacts = [contact]; el.selectedContact = contact; el.i18nStore = new I18nStore();
  return el;
};
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); history.replaceState(null,'','#/'); });

it('finds a created card after its response is lost, and edits it rather than creating another', async () => {
  const temporary = { name: 'Ada', isTemporary: true };
  const el = page(temporary);
  let stored: any;
  const create = vi.spyOn(contactsService, 'createContact').mockImplementation(async payload => {
    stored = { ...payload, isTemporary: undefined, uid: `urn:uuid:${payload.creation_id}`, path: '/book/new.vcf', etag: 'v1' };
    throw new TypeError('connection lost after commit');
  });
  vi.spyOn(contactsService, 'fetchContacts').mockImplementation(async () => ({ contacts: [stored] }));
  const edit = vi.spyOn(contactsService,'updateContact').mockResolvedValue({ok:'true',path:'/book/new.vcf',etag:'v2'});
  await el.handleSave({name:'Ada'}, temporary);
  expect(el.selectedContact.path).toBe('/book/new.vcf');
  await el.handleSave({name:'Ada Lovelace'}, temporary);
  expect(create).toHaveBeenCalledTimes(1);
  expect(edit.mock.calls[0]).toMatchObject(['/book/new.vcf',{name:'Ada Lovelace',etag:'v1'}]);
});

it('does not retry while the write and a read of it are unconfirmed', async () => {
  const el = page({...original});
  const write = vi.spyOn(contactsService,'updateContact').mockRejectedValue(new TypeError('lost'));
  vi.spyOn(contactsService,'fetchContacts').mockRejectedValue(new TypeError('offline'));
  const report = vi.spyOn(el,'reportFailure');
  await el.handleSave({...original,note:'First'});
  await el.handleSave({...original,note:'Newer'});
  expect(write).toHaveBeenCalledTimes(1);
  expect(report).toHaveBeenCalledWith('contacts.updateOneUnconfirmed');
});

it('advances an applied edit to the observed version without a false conflict', async () => {
  const source = {...original}; const el = page(source);
  const write = vi.spyOn(contactsService,'updateContact').mockRejectedValueOnce(new TypeError('lost')).mockResolvedValue({ok:'true',path:original.path,etag:'v3'});
  vi.spyOn(contactsService,'fetchContacts').mockResolvedValue({contacts:[{...original,note:'First',etag:'v2'}]});
  await el.handleSave({...original,note:'First'},source);
  await el.handleSave({...original,note:'Second'},source);
  expect(write.mock.calls[1][1]).toMatchObject({note:'Second',etag:'v2'});
});

for (const remove of [false,true]) {
  it(`reconciles an all-unknown group ${remove?'removal':'rename'} from a later successful read`, async () => {
    const source = {...original,categories:['Work']}; const el = page(source);
    el.selectedCategory='Work'; el.addedCategories=['Work'];
    history.replaceState(null,'','#/contacts/Work');
    vi.spyOn(contactsService,'bulkUpdateCategories').mockResolvedValue({total:1,done:0,failed:1,uncertain:1});
    const reread=vi.spyOn(contactsService,'fetchContacts').mockRejectedValueOnce(new TypeError('offline')).mockResolvedValue({contacts:[{...source,categories:remove?[]:['Office']}]});
    if(remove){el.categoryToDelete='Work';await el.handleDeleteCategorySubmit();}
    else{el.categoryToRename='Work';await el.handleRenameCategorySubmit(new CustomEvent('rename',{detail:{name:'Office'}}));}
    expect(el.selectedCategory).toBe('Work');
    await el.fetchContacts();
    expect(el.selectedCategory).toBe(remove?'':'Office');
    expect(el.addedCategories).not.toContain('Work');
    expect(location.hash).toBe(remove?'#/contacts/all':'#/contacts/Office');
    expect(reread).toHaveBeenCalledTimes(2);
  });
}

it('does not overwrite a different stored version while reconciling an uncertain edit', async () => {
  const source={...original}; const el=page(source);
  const write=vi.spyOn(contactsService,'updateContact').mockRejectedValue(new TypeError('lost'));
  vi.spyOn(contactsService,'fetchContacts').mockResolvedValue({contacts:[{...original,note:'Other device',etag:'v2'}]});
  const report=vi.spyOn(el,'reportFailure');
  await el.handleSave({...original,note:'Mine'},source);
  await el.handleSave({...original,note:'Mine again'},source);
  expect(write).toHaveBeenCalledTimes(1);
  expect(report).toHaveBeenCalledWith('contacts.saveConflict');
});

it('retries an absent new card with the same creation identity', async () => {
  const source={name:'Ada',isTemporary:true}; const el=page(source);
  const create=vi.spyOn(contactsService,'createContact').mockRejectedValueOnce(new TypeError('lost')).mockResolvedValue({ok:'true',path:'/book/new.vcf',etag:'v1'});
  vi.spyOn(contactsService,'fetchContacts').mockResolvedValue({contacts:[]});
  await el.handleSave({name:'Ada'},source);
  await el.handleSave({name:'Ada Lovelace'},source);
  const ids=create.mock.calls.map(c=>c[0].creation_id);
  expect(ids[0]).toMatch(/^[0-9a-f-]{36}$/);
  expect(ids[1]).toBe(ids[0]);
});

it('retains an unconfirmed group rename when the page is reopened, scoped to its account', async () => {
  localStorage.setItem('alps_active_user','ada@example.test');
  const source={...original,categories:['Work']}; const first=page(source);
  first.addedCategories=['Work']; first.selectedCategory='Work'; first.categoryToRename='Work';
  vi.spyOn(contactsService,'bulkUpdateCategories').mockResolvedValue({total:1,done:0,failed:1,uncertain:1});
  const read=vi.spyOn(contactsService,'fetchContacts').mockRejectedValueOnce(new TypeError('offline'));
  await first.handleRenameCategorySubmit(new CustomEvent('rename',{detail:{name:'Office'}}));
  const reopened=page(source); reopened.loadAddedCategories(); reopened.selectedCategory='Work';
  read.mockResolvedValue({contacts:[{...source,categories:['Office']}]});
  history.replaceState(null,'','#/contacts/Work');
  await reopened.fetchContacts();
  expect(reopened.selectedCategory).toBe('Office');
  expect(reopened.addedCategories).toEqual(['Office']);
  localStorage.setItem('alps_active_user','other@example.test');
  const other=page(source); other.loadAddedCategories();
  expect(other.pendingCategoryChanges.size).toBe(0);
  expect(other.addedCategories).toEqual([]);
});

it('keeps an editor opened while the address book refresh was in flight', async () => {
  history.replaceState(null,'','#/contacts/all');
  const el=page({...original}); el.contacts=[]; el.selectedContact=null;
  let finish!: (value:any)=>void;
  vi.spyOn(contactsService,'fetchContacts').mockReturnValue(new Promise(resolve=>{finish=resolve;}));
  const loading=el.fetchContacts();
  el.handleCreateNew();
  const created=el.selectedContact;
  finish({contacts:[]}); await loading;
  expect(el.selectedContact).toBe(created);
  expect(el.isEditing).toBe(true);
  expect(el.contacts).toContain(created);
});
