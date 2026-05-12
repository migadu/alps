export interface NavTab {
    id: string;
    labelKey: string;
    icon?: string;
    order?: number;
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
    enabledPlugins: Set<string> | null = null;

    setEnabledPlugins(plugins: string[]) {
        this.enabledPlugins = new Set(plugins);
        window.dispatchEvent(new CustomEvent('plugins-updated'));
    }

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

    invokeHook(hookName: string, payload: any): any[] {
        const handlers = this.hooks.get(hookName) || [];
        const results: any[] = [];
        handlers.forEach(handler => {
            try {
                results.push(handler(payload));
            } catch (e) {
                console.error(`Error in hook ${hookName}:`, e);
            }
        });
        return results;
    }

    registerNavTab(tab: NavTab) {
        if (!this.navTabs.find(t => t.id === tab.id)) {
            this.navTabs.push(tab);
        }
    }

    getNavTabs(): NavTab[] {
        let tabs = this.navTabs;
        if (this.enabledPlugins !== null) {
            tabs = tabs.filter(t => this.enabledPlugins!.has(t.id));
        }
        return tabs.slice().sort((a, b) => (a.order || 999) - (b.order || 999));
    }

    registerSettingsTab(tab: SettingsTab) {
        if (!this.settingsTabs.find(t => t.id === tab.id)) {
            this.settingsTabs.push(tab);
        }
    }

    getSettingsTabs(): SettingsTab[] {
        if (this.enabledPlugins !== null) {
            return this.settingsTabs.filter(t => this.enabledPlugins!.has(t.id));
        }
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
