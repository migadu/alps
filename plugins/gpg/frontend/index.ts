import { html } from 'lit';
import { registry } from '../../../frontend/src/plugin-registry';
import './gpg-settings.ts';
import { handlePresend, handleReaderContent } from './gpg-crypto.ts';

// Register Settings Tab
registry.registerSettingsTab({
    id: 'gpg',
    labelKey: 'settings.gpg',
    icon: 'key',
    component: 'alps-gpg-settings'
});

// Register Composer Toggle Button
registry.registerHook('composer:toolbar', (payload: any) => {
    const instance = payload.instance;
    const composer = payload.composer;
    const isEncrypted = instance.encryptGpg || false;
    
    return html`
        <alps-icon-btn 
            title="${composer.i18nStore?.t('gpg.toggleEncryption')}" 
            icon="lock"
            ?active=${isEncrypted}
            @click=${() => {
                composer.composeStore.updateComposer(instance.id, { encryptGpg: !isEncrypted });
            }}>
        </alps-icon-btn>
    `;
});

// Register Crypto Hooks
registry.registerHook('composer:presend', handlePresend);
registry.registerHook('reader:content', handleReaderContent);
