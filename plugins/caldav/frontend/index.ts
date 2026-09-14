import { html } from 'lit';
import { registry } from '../../../frontend/src/plugin-registry';
import './calendar-page';
import './tasks-page';
import './calendar-invitation-banner';
import { hasCalendarPart } from './invitation-service';

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

// An invitation in a message is shown above it, with its answers. The banner
// asks the server what the message's calendar part is; the structure check
// only keeps it from asking about every message.
registry.registerHook('reader:content', (payload: any) => {
    const message = payload?.message;
    if (!message || !hasCalendarPart(message.BodyStructure)) return;
    const mailbox = payload.mailbox || message.Mailbox;
    if (!mailbox || message.UID === undefined) return;
    payload.banners = payload.banners || [];
    payload.banners.push(html`<calendar-invitation-banner .mailbox=${mailbox} .uid=${String(message.UID)}></calendar-invitation-banner>`);
}, 'caldav');
