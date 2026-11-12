/**
 * The recipients of a sent message, saved to the address book.
 *
 * A recipient pill writes a name with a quote or a backslash in it as a
 * quoted string, with those escaped. The hook stripped only the outer quotes,
 * so a reply to `Jane "JJ" Doe` saved a contact named `Jane \"JJ\" Doe`.
 */
import { afterEach, expect, it, vi } from 'vitest';
import { registry } from '../src/plugin-registry';
import { writtenAddress } from '../src/utils/address-display';
import { HttpStatusError } from '../src/utils/fetch-utils';
import { contactsService } from '../../plugins/carddav/frontend/contacts-service';
import '../../plugins/carddav/frontend/index';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('saves each recipient under the name as written', async () => {
  registry.setEnabledPlugins(['carddav']);
  const created = vi.spyOn(contactsService, 'createContact').mockResolvedValue({});

  await registry.invokeHookAsync('composer:send', {
    recipients: [
      writtenAddress('Jane "JJ" Doe', 'jj@example.test'),
      writtenAddress('Back\\slash', 'slash@example.test'),
      writtenAddress('Lovelace, Ada', 'ada@example.test'),
      'Grace Hopper <grace@example.test>',
      'bob@example.test',
    ],
  });

  expect(created.mock.calls.map(([payload]) => payload)).toEqual([
    { name: 'Jane "JJ" Doe', email: 'jj@example.test' },
    { name: 'Back\\slash', email: 'slash@example.test' },
    { name: 'Lovelace, Ada', email: 'ada@example.test' },
    { name: 'Grace Hopper', email: 'grace@example.test' },
    { name: '', email: 'bob@example.test' },
  ]);
});

it.each(['no_address_book', 'carddav_not_configured'])('stops optional collection quietly for %s', async code => {
  const fetch = vi.fn(async () => new Response(JSON.stringify({ error: code }), { status: 409 }));
  vi.stubGlobal('fetch', fetch);
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
  await registry.invokeHookAsync('composer:send', { recipients: ['ada@example.test', 'grace@example.test'] });
  expect(logged).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('still logs unexpected auto-collection failures', async () => {
  vi.spyOn(contactsService, 'createContact').mockRejectedValue(new HttpStatusError(503, 'unavailable'));
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
  await registry.invokeHookAsync('composer:send', { recipients: ['ada@example.test'] });
  expect(logged).toHaveBeenCalledOnce();
});
