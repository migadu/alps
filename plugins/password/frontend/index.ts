import { registry } from '../../../frontend/src/plugin-registry';
import './password-settings'; // Ensure the custom element is defined

registry.registerSettingsTab({
    id: 'password',
    labelKey: 'settings.categories.password',
    icon: 'password',
    component: 'alps-password-settings'
});
