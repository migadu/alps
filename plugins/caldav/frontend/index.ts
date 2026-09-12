import { registry } from '../../../frontend/src/plugin-registry';
import './calendar-page';

registry.registerRoute({
    path: '/calendar/*',
    component: 'calendar-page',
    // Without this the nav tab vanished when caldav was disabled but
    // `#/calendar/...` still resolved to the page behind it.
    pluginId: 'caldav'
});

registry.registerNavTab({
    id: 'calendar',
    pluginId: 'caldav',
    labelKey: 'navigation.calendar',
    icon: 'calendar',
    order: 20
});
