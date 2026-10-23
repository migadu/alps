import { registry } from '../../../frontend/src/plugin-registry';

registry.registerSettingsTab({
    id: 'managesieve',
    labelKey: 'settings.categories.filters',
    icon: 'sieve', // Custom sprite added to assets
    component: 'alps-managesieve-page',
    load: () => import('./managesieve-page'),
});

// The auto-reply is a vacation action in the same Sieve script, so it is this
// plugin's tab, and goes when the plugin does.
registry.registerSettingsTab({
    id: 'autoreply',
    pluginId: 'managesieve',
    labelKey: 'settings.categories.autoReply',
    icon: 'arrowBendUpLeft',
    component: 'alps-auto-reply-page',
    load: () => import('./auto-reply-page'),
});
