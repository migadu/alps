import { registry } from '../../../frontend/src/plugin-registry';

registry.registerSettingsTab({
    id: 'password',
    labelKey: 'settings.categories.password',
    icon: 'password',
    component: 'alps-password-settings',
    load: () => import('./password-settings'),
});
