export interface NavTab {
    id: string;
    labelKey: string;
}

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
    navTabs: NavTab[] = [];
    settingsTabs: SettingsTab[] = [];
    routes: Route[] = [];
    hooks: Map<string, Function[]> = new Map();

    registerHook(hookName: string, handler: Function) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName)!.push(handler);
    }

    async invokeHookAsync(hookName: string, payload: any): Promise<any[]> {
        const handlers = this.hooks.get(hookName) || [];
        const results = await Promise.all(handlers.map(handler => handler(payload)));
        return results;
    }

    invokeHook(hookName: string, payload: any) {
        const handlers = this.hooks.get(hookName) || [];
        handlers.forEach(handler => {
            try {
                handler(payload);
            } catch (e) {
                console.error(`Error in hook ${hookName}:`, e);
            }
        });
    }

    registerNavTab(tab: NavTab) {
        if (!this.navTabs.find(t => t.id === tab.id)) {
            this.navTabs.push(tab);
        }
    }

    getNavTabs(): NavTab[] {
        return this.navTabs;
    }

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
