import { registry } from '../../../frontend/src/plugin-registry';
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
    labelKey: 'navigation.contacts'
});
