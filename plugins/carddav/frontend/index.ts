import { registry } from '../../../frontend/src/plugin-registry';
import { parseWrittenAddress } from '../../../frontend/src/utils/address-display';
import { contactsService } from './contacts-service';

registry.registerRoute({
    path: '/contacts/*',
    component: 'contacts-page',
    // As caldav: the tab was gated, the route was not.
    pluginId: 'carddav',
    load: () => import('./contacts-page'),
});

registry.registerNavTab({
    id: 'contacts',
    pluginId: 'carddav',
    labelKey: 'navigation.contacts',
    icon: 'users',
    order: 10
});

registry.registerHook('composer:send', async ({ recipients }: { recipients: string[] }) => {
    if (!recipients || !Array.isArray(recipients)) return;
    
    for (const addr of recipients) {
        // Read as the pill reads it: a quoted name has a quote or backslash in
        // it escaped, and stripping only the outer quotes saved the escapes
        // into the contact's name.
        const { name, email } = parseWrittenAddress(addr);

        try {
            await contactsService.createContact({
                name: name,
                email: email
            });
        } catch (e) {
            console.error('Failed to auto-save contact', e);
        }
    }
}, 'carddav');

registry.registerHook('composer:suggest', async ({ query }: { query: string }) => {
    try {
        const result = await contactsService.fetchContacts(query);
        const contactsList = result.contacts || [];
        const suggestions: Array<{ name: string; address: string }> = [];
        const seen = new Set<string>();

        for (const c of contactsList) {
            const name = c.name || '';
            const emails: Array<{ value: string; type?: string }> = (c.emails && c.emails.length > 0)
                ? c.emails
                : (c.email ? [{ value: c.email }] : []);

            for (const em of emails) {
                const addr = em.value?.trim();
                if (addr && !seen.has(addr.toLowerCase())) {
                    seen.add(addr.toLowerCase());
                    suggestions.push({
                        name,
                        address: addr
                    });
                }
            }
        }
        return suggestions;
    } catch (e) {
        console.error('Failed to fetch contact suggestions', e);
        return [];
    }
}, 'carddav');
