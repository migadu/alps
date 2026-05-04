export interface SettingsTab {
    id: string;
    labelKey: string; // The i18n translation key for the tab label
    icon: string;     // The icon name for the sidebar
    component: string; // The HTML custom element tag name, e.g. 'alps-password-settings'
}

class PluginRegistry {
    settingsTabs: SettingsTab[] = [];

    registerSettingsTab(tab: SettingsTab) {
        if (!this.settingsTabs.find(t => t.id === tab.id)) {
            this.settingsTabs.push(tab);
        }
    }

    getSettingsTabs(): SettingsTab[] {
        return this.settingsTabs;
    }
}

export const registry = new PluginRegistry();
