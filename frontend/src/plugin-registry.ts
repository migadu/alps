export interface SettingsTab {
    id: string;
    labelKey: string; // The i18n translation key for the tab label
    icon: string;     // The icon name for the sidebar
    component: string; // The HTML custom element tag name, e.g. 'alps-password-settings'
}

export interface Route {
    path: string;
    component: string;
}

class PluginRegistry {
    settingsTabs: SettingsTab[] = [];
    routes: Route[] = [];

    registerSettingsTab(tab: SettingsTab) {
        if (!this.settingsTabs.find(t => t.id === tab.id)) {
            this.settingsTabs.push(tab);
        }
    }

    getSettingsTabs(): SettingsTab[] {
        return this.settingsTabs;
    }

    registerRoute(route: Route) {
        if (!this.routes.find(r => r.path === route.path)) {
            this.routes.push(route);
        }
    }

    getRoutes(): Route[] {
        return this.routes;
    }
}

export const registry = new PluginRegistry();
