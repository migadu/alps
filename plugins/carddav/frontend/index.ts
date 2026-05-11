import { registry } from '../../../frontend/src/plugin-registry';
import { contactsService } from './contacts-service';
import './contacts-page';
import './contact-view';
import './contacts-categories';
import './contacts-list';

registry.registerRoute({
    path: '/contacts/*',
    component: 'contacts-page'
});

registry.registerNavTab({
    id: 'contacts',
    labelKey: 'navigation.contacts',
    icon: 'users',
    order: 10
});

registry.registerHook('composer:send', async ({ recipients }: { recipients: string[] }) => {
    if (!recipients || !Array.isArray(recipients)) return;
    
    for (const addr of recipients) {
        let email = addr;
        let name = '';
        const match = addr.match(/^(.*?)\s*<([^>]+)>$/);
        if (match && match[2]) {
            name = match[1].replace(/^["']|["']$/g, '').trim();
            email = match[2];
        } else {
            email = email.trim();
        }

        try {
            await contactsService.createContact({
                name: name,
                email: email
            });
        } catch (e) {
            console.error('Failed to auto-save contact', e);
        }
    }
});

registry.registerHook('composer:suggest', async ({ query }: { query: string }) => {
    try {
        const result = await contactsService.fetchContacts(query);
        const contactsList = result.contacts || [];
        return contactsList.map((c: any) => ({
            name: c.name || '',
            address: c.email || ''
        })).filter((c: any) => c.address);
    } catch (e) {
        console.error('Failed to fetch contact suggestions', e);
        return [];
    }
});
