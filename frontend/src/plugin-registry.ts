export interface NavTab {
    id: string;
    pluginId?: string;
    labelKey: string;
    icon?: string;
    order?: number;
}

export interface SettingsTab {
    id: string;
    pluginId?: string;
    labelKey: string; // The i18n translation key for the tab label
    icon: string;     // The icon name for the sidebar
    component: string; // The HTML custom element tag name, e.g. 'alps-password-settings'
}

export interface Route {
    path: string;
    component: string;
    /**
     * The plugin that owns this route, matched against the enabled set exactly
     * as a nav tab's is. An omitted pluginId means "not a plugin's route", and
     * such a route always resolves — which is what the app's own routes are.
     *
     * Gating this and not just the tab is the difference between HIDING a
     * surface and DISABLING it: the tab is only how a user reaches a route, and
     * `#/calendar` typed into the address bar reaches it without one.
     */
    pluginId?: string;
}

/** Set equality, so a re-read of /session that changed nothing announces
 * nothing. */
function sameEnablement(a: Set<string> | null, b: Set<string> | null): boolean {
    if (a === null || b === null) return a === b;
    if (a.size !== b.size) return false;
    for (const value of a) {
        if (!b.has(value)) return false;
    }
    return true;
}

class PluginRegistry {
    navTabs: NavTab[] = [];
    settingsTabs: SettingsTab[] = [];
    routes: Route[] = [];
    hooks: Map<string, { handler: Function; pluginId?: string }[]> = new Map();
    enabledPlugins: Set<string> | null = null;

    setEnabledPlugins(plugins: string[]) {
        const next = new Set(plugins);
        // Idempotent, because the callers are not: /session is re-read on every
        // sign-in and reconnect, and each would otherwise announce a change that
        // never happened — costing a full re-render in all three listeners and
        // re-installing the route table under whichever plugin page is open.
        if (sameEnablement(this.enabledPlugins, next)) return;
        this.enabledPlugins = next;
        window.dispatchEvent(new CustomEvent('plugins-updated'));
    }

    /** Is `pluginId` (or, for a nav/settings tab, its id) enabled here? */
    private isEnabled(pluginName: string): boolean {
        return this.enabledPlugins === null || this.enabledPlugins.has(pluginName);
    }

    /**
     * A hook, and WHOSE it is.
     *
     * `pluginId` is what makes disabling a plugin mean anything here. Routes,
     * nav tabs and settings tabs are all filtered by it — hooks were not,
     * because they carried no owner to filter by. And every plugin's frontend
     * `index.ts` is imported eagerly, so a disabled plugin's module still ran
     * and still registered: carddav kept answering composer suggestions and
     * `composer:send`, and GPG kept running `composer:presend` on every send,
     * for a plugin the deployment had switched off.
     *
     * Optional, because a hook with no owner belongs to the app rather than to
     * a plugin — those always run.
     */
    registerHook(hookName: string, handler: Function, pluginId?: string) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName)!.push({ handler, pluginId });
    }

    /** The handlers for `hookName` that this deployment actually enables. */
    private enabledHandlers(hookName: string): Function[] {
        return (this.hooks.get(hookName) || [])
            .filter(entry => !entry.pluginId || this.isEnabled(entry.pluginId))
            .map(entry => entry.handler);
    }

    /**
     * Every handler runs; the ones that resolved contribute. Failures are
     * logged and DROPPED.
     *
     * This was a bare `Promise.all`, so one plugin's rejection aborted the whole
     * invocation and discarded the results of every handler that had already
     * resolved — the opposite of what the synchronous `invokeHook` below does,
     * which wraps each handler individually so a bad plugin cannot take the
     * others down. Two methods with one purpose and opposite failure semantics.
     *
     * A caller that must NOT proceed when a handler failed uses
     * {@link invokeHookSettled} instead — see `composer:presend`, where
     * swallowing the GPG plugin's error would send the plaintext.
     */
    async invokeHookAsync(hookName: string, payload: any): Promise<any[]> {
        const { results } = await this.invokeHookSettled(hookName, payload);
        return results;
    }

    /**
     * The same fan-out, with the failures reported rather than dropped.
     *
     * The distinction matters wherever "a handler did not run" is not the same
     * as "a handler had nothing to say": a presend hook that throws has not
     * approved the send, it has failed to decide — and the safe reading of that
     * is to stop, not to send whatever the message happened to be.
     */
    async invokeHookSettled(
        hookName: string,
        payload: any,
    ): Promise<{ results: any[]; failed: number }> {
        const handlers = this.enabledHandlers(hookName);
        const settled = await Promise.allSettled(handlers.map(handler => handler(payload)));
        const results: any[] = [];
        let failed = 0;
        for (const outcome of settled) {
            if (outcome.status === 'fulfilled') {
                results.push(outcome.value);
            } else {
                failed += 1;
                console.error(`Error in async hook ${hookName}:`, outcome.reason);
            }
        }
        return { results, failed };
    }

    invokeHook(hookName: string, payload: any): any[] {
        const handlers = this.enabledHandlers(hookName);
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
            tabs = tabs.filter(t => this.isEnabled(t.pluginId || t.id));
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
            return this.settingsTabs.filter(t => this.isEnabled(t.pluginId || t.id));
        }
        return this.settingsTabs;
    }

    registerRoute(route: Route) {
        if (!this.routes.find(r => r.path === route.path)) {
            this.routes.push(route);
        }
    }

    /**
     * The routes the app should install. A disabled plugin's route is left OUT
     * rather than merely hidden from the nav: the tab is one way to a route and
     * the address bar is another, and a user who typed `#/calendar` would
     * otherwise land on a page whose tab this same answer just removed.
     *
     * app-root recomputes these on `plugins-updated`, because the answer
     * arrives from /session after the first render.
     */
    getRoutes(): Route[] {
        if (this.enabledPlugins !== null) {
            return this.routes.filter(r => !r.pluginId || this.isEnabled(r.pluginId));
        }
        return this.routes;
    }
}

export const registry = new PluginRegistry();
