import { registry } from '../../../frontend/src/plugin-registry';
import './managesieve-page';

registry.registerSettingsTab({
    id: 'managesieve',
    labelKey: 'settings.categories.filters',
    icon: 'sieve', // Custom sprite added to assets
    component: 'alps-managesieve-page'
});
