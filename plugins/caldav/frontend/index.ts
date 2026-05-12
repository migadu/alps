import { registry } from '../../../frontend/src/plugin-registry';
import './calendar-page';

registry.registerRoute({
    path: '/calendar/*',
    component: 'calendar-page'
});

registry.registerNavTab({
    id: 'calendar',
    pluginId: 'caldav',
    labelKey: 'navigation.calendar',
    icon: 'calendar',
    order: 20
});
