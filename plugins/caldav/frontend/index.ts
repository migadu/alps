import { registry } from '../../../frontend/src/plugin-registry';
import './calendar-page';
import './tasks-page';

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

// Tasks are the VTODOs in the same calendars, so they belong to this plugin:
// with caldav disabled there is nothing to list them from.
registry.registerRoute({
    path: '/tasks/*',
    component: 'tasks-page',
    pluginId: 'caldav'
});

registry.registerNavTab({
    id: 'tasks',
    pluginId: 'caldav',
    labelKey: 'navigation.tasks',
    icon: 'checkCircle',
    order: 30
});
