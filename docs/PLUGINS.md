# ALPS Plugin Development Guide

ALPS features a modular architecture that allows you to extend both the backend (Go) and the frontend (TypeScript/Web Components) via plugins.

Plugins are located in the `plugins/` directory at the root of the project. The in-tree plugins are `base` (the mail API and `/session`), `caldav` and `carddav` ([CDAV.md](CDAV.md)), `gpg` ([GPG.md](GPG.md)), `managesieve` ([FILTERS.md](FILTERS.md)) and `password` ([PASSWORD_CHANGE.md](PASSWORD_CHANGE.md)). The smallest complete one is `password`: one route, one settings tab and its translations.

## Table of Contents
1. [Plugin Structure](#1-plugin-structure)
2. [Backend (Go) Development](#2-backend-go-development)
   - [Defining the Plugin](#defining-the-plugin)
   - [Routes, Sessions and Errors](#routes-sessions-and-errors)
   - [Configuration and Per-User Data](#configuration-and-per-user-data)
   - [Registering the Plugin](#registering-the-plugin)
3. [Frontend (TypeScript) Development](#3-frontend-typescript-development)
   - [The Plugin Registry](#the-plugin-registry)
   - [Adding Settings Tabs](#adding-settings-tabs)
   - [Adding Navigation Tabs & Routes](#adding-navigation-tabs--routes)
   - [Creating Web Components](#creating-web-components)
   - [Translations](#translations)
4. [Hooks & Background Jobs](#4-hooks--background-jobs)
   - [Frontend Hooks](#frontend-hooks)
   - [Backend Background Jobs](#backend-background-jobs)
5. [Testing a Plugin](#5-testing-a-plugin)

---

## 1. Plugin Structure

A typical ALPS plugin has the following directory structure:

```
plugins/myplugin/
├── plugin.go             # Backend plugin definition and routes
├── plugin_test.go        # Go tests, beside the sources
├── frontend/             # Frontend source code
│   ├── index.ts          # Frontend entry point
│   ├── my-component.ts   # Custom Web Components
│   └── i18n/             # Translations: en.ts and one file per language
└── public/assets/        # Optional static files, served from disk
```

The Go package is compiled into the ALPS binary. The frontend code is not served by the plugin's Go side: Vite bundles every `plugins/*/frontend` into `frontend/dist`, which is embedded in the binary (`//go:embed all:frontend/dist`) and served by the core. Frontend unit tests do not go in the plugin's directory; see [Testing a Plugin](#5-testing-a-plugin).

---

## 2. Backend (Go) Development

The backend portion of a plugin registers HTTP routes and background jobs, and can serve static files. ALPS provides a `GoPlugin` helper to make this simple.

### Defining the Plugin

Create a `plugin.go` file inside your plugin directory (`plugins/myplugin/plugin.go`):

```go
package myplugin

import (
	"net/http"

	"github.com/migadu/alps"
)

func init() {
	// 1. Create a new GoPlugin instance. Its Name is the plugin's name
	//    everywhere: the [plugin.myplugin] config section, GET /session's
	//    EnabledPlugins, and the pluginId of the frontend's tabs, routes and hooks.
	p := alps.GoPlugin{Name: "myplugin"}

	// 2. Register HTTP routes
	p.GET("/myplugin/data", handleGetData)
	p.POST("/myplugin/save", handleSaveData)

	// 3. Register the loader with ALPS
	alps.RegisterPluginLoader(p.Loader())
}

func handleGetData(c *alps.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

func handleSaveData(c *alps.Context) error {
	var req struct {
		Value string `json:"value"`
	}
	if err := c.BindJSON(&req); err != nil {
		return c.RespondBindError(err)
	}
	if req.Value == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "value is required")
	}
	return c.NoContent(http.StatusOK)
}
```

`GoPlugin` has `GET`, `POST`, `PUT`, `PATCH` and `DELETE`, and `AddRoute(method, path, handler)` for any other method. The loaders run once, when ALPS starts. At shutdown, ALPS calls `Close` once on each plugin that loaded; a `GoPlugin`'s `Close` does nothing.

Give a plugin's routes a top-level prefix named after the plugin, such as `/myplugin/data`, the way `password` uses `/password/change` and `managesieve` uses `/managesieve/script`. The Vite dev server (`npm run dev`) proxies only the prefixes listed in the regular expression in `frontend/vite.config.ts` to the backend at `http://localhost:1323`, so add the plugin's prefix to that list for development. A built binary serves any path.

### Routes, Sessions and Errors

Route paths are `net/http` `ServeMux` path patterns, registered as `"<METHOD> <path>"`. A wildcard such as `p.GET("/myplugin/items/{id}", h)` is read with `ctx.Param("id")`. A pattern that conflicts with one already registered panics when the server starts. A value that may contain `/`, such as a folder name, is sent in a path segment encoded with `encodePathParam` from `frontend/src/utils/fetch-utils`, and decoded in the handler with `url.PathUnescape(ctx.Param(...))`.

Every route a plugin registers runs behind the router's middleware:

1. The CSRF check of `Origin`/`Referer` for `POST`, `PUT`, `PATCH` and `DELETE` (see [CONFIGURATION.md](CONFIGURATION.md) for `trusted_origins` and `trusted_proxies`). `GET` requests are not checked, so a route that changes anything uses one of the other methods.
2. The session check. A request without a signed-in session, or whose session still needs its second factor, is answered `401 {"error":"Unauthorized","code":"401"}` before the handler runs. Inside a plugin handler `ctx.Session` is therefore set.

Read a JSON body with `ctx.BindJSON(&v)`, which reads at most 1 MiB (`alps.MaxJSONBodyBytes`; `ctx.BindJSONLimit(&v, limit)` takes another limit). Answer its error with `ctx.RespondBindError(err)`, which sends `413 {"error":"payload_too_large"}` or `400 {"error":"invalid_json"}`.

An error the handler returns becomes a JSON answer `{"error": ..., "code": ..., "status": ...}`, and the full error is only logged:

- For an `*alps.HTTPError` (`alps.NewHTTPError(code, "message")`), or an error that wraps one, the answer has its status and, when the message is a non-empty string, that message. Otherwise it has a generic text for 400, 401, 403, 404, 405, 413, 429 and 503, and `"An internal error occurred"` for any other status.
- Any other error is a 500 with `"An internal error occurred"`.
- A `provider.AuthError` ends the session and answers 401.
- An unavailable mail server answers `503 {"error":"mail_server_unavailable"}`.
- `provider.ErrMessageNotFound` answers 404 `"Message not found"`.
- A `*provider.InvalidSearchError`, a search prefix without a value, answers 400 `"Search terms require a value."`.

These are recognised in an error that wraps them, so wrap with `%w`, not `%v`, as `gpg` does for its store errors: an error wrapped with `%v` is a 500.

A panic in a handler is recovered, logged, and answered with a plain-text 500.

### Configuration and Per-User Data

A plugin reads its config section as `s.Options.Plugins["myplugin"]` in its loader, or `ctx.Server.Options.Plugins["myplugin"]` in a handler. It is an `alps.PluginConfig{Enabled, Server, Options}`; see [Registering the Plugin](#registering-the-plugin) for the keys.

A loader can decide to stay off by returning no plugins, and can refuse a bad configuration by returning an error. An error from a loader makes `alps.New` fail, and ALPS exits at startup. `caldav` and `carddav` return no plugins when they have no `server`, `enabled` is not `true` and the provider routes no endpoint for the service; `managesieve` does when it has no `server` and the provider routes no endpoint for it, whatever `enabled` says:

```go
func init() {
	alps.RegisterPluginLoader(func(s *alps.Server) ([]alps.Plugin, error) {
		cfg := s.Options.Plugins["myplugin"]
		if !cfg.Enabled && cfg.Server == "" {
			return nil, nil // stay off
		}
		p := alps.GoPlugin{Name: "myplugin"}
		p.GET("/myplugin/data", handleGetData)
		return p.Loader()(s)
	})
}
```

For a service whose endpoint differs per login under a routing provider (see `[provider.multi]` in [CONFIGURATION.md](CONFIGURATION.md)):

- `ctx.Server.ServiceURLFor(service, username)` returns the endpoint for this login, or `""` when the global configuration applies.
- `ctx.Server.ServiceOptionsFor(service, username)` does the same for a service configured by an option block, and returns `nil` when the global block applies.
- `ctx.Server.HasServiceRouting(service)` reports whether the provider may route this service per login. Under `multi` that is whether any backend names an endpoint for it. A provider whose options implement `provider.ServiceRouter` but not the optional `provider.ServiceRoutingReporter` counts as routing every service.

Per-user data that must outlive the session goes in `ctx.Session.Store()`, a `provider.Store` with `Get(key, &out)` and `Put(key, v)` of JSON values. A missing key is `provider.ErrNoStoreEntry`. Use `provider.GetFresh(store, key, &out)` to read past cached copies when another session may have written the entry, as `gpg` does for its keyring. With the IMAP provider the entries are kept in the user's mailbox as IMAP METADATA under `/private/vendor/alps/<key>`; the maildir provider keeps them in `alps_store.json` at the root of the user's maildir ([MAILDIR.md](MAILDIR.md)). A server without METADATA gets a transient store that does not persist (see [ARCHITECTURE.md](ARCHITECTURE.md) and [MAIL_SERVER.md](MAIL_SERVER.md)).

Mail work nobody is waiting on goes through `ctx.Session.DoBackgroundMail(ctx.Request.Context(), func(p provider.MailProvider) error { ... })`. It runs on the session's background connection and falls back to the main one.

A `GoPlugin` also serves static files from `plugins/<name>/public/assets` at `GET /plugins/<name>/assets/...`. They are read from disk relative to ALPS's working directory, not embedded in the binary, and served without a session, so put nothing there that needs a sign-in. No in-tree plugin has such a directory.

### Registering the Plugin

To compile your plugin into the ALPS binary, you must import it anonymously in `cmd/alps/plugins.go`:

```go
package main

import (
	// ... existing plugins ...
	_ "github.com/migadu/alps/plugins/myplugin"
)
```

The `[plugin.<name>]` sections of `config.toml` then decide which of the compiled-in plugins load:

- `base`, which serves `/session` and the mail API, always loads.
- A plugin whose section does not set `enabled = true`, because it says `enabled = false` or leaves `enabled` out, is skipped and logged as `Plugin "<name>" is disabled`.
- If at least one section has `enabled = true`, the sections with `enabled = true` form an allow-list, and a plugin without a section is skipped and logged the same way.
- If no section has `enabled = true`, which includes having no sections at all, there is no allow-list, and every plugin the loaders return loads unless its own section keeps it out.

Every compiled-in plugin's loader runs in all cases, and these rules are applied to what the loaders return. A loader that returns no plugins, as `caldav`, `carddav` and `managesieve` can (see [Configuration and Per-User Data](#configuration-and-per-user-data)), stays off either way, and is not logged as disabled. A loader's error stops ALPS even for a plugin the rules would have dropped, so a loader should check `enabled` before it refuses its options, as `password` does.

A config that adds `[plugin.myplugin]` must therefore set `enabled = true` in it, and then also keep `enabled = true` for every other plugin it wants, as `config.example.toml` does:

```toml
[plugin.base]
enabled = true

[plugin.myplugin]
enabled = true
# server = "https://myplugin.example.com"

[plugin.myplugin.options]
# example_key = "example_value"
```

A section's keys are `enabled` (bool), `server` (string) and `options` (a free-form table). See [CONFIGURATION.md](CONFIGURATION.md#9-plugins-pluginname) for the in-tree plugins' sections.

---

## 3. Frontend (TypeScript) Development

ALPS uses Vite for its frontend. It discovers frontend plugins at build time: `import.meta.glob('../../plugins/*/frontend/index.ts', { eager: true })` in `frontend/src/main.ts` imports every such file into the bundle.

**Any file at `plugins/*/frontend/index.ts` is executed on startup**, even when its Go plugin is disabled or not compiled in. Disabling is done by the registry, which filters by `pluginId` (see [The Plugin Registry](#the-plugin-registry)).

A new or changed plugin frontend reaches users only after two builds:

1. `make build-frontend` (`cd frontend && npm install && npm run build`). `build` is `tsc && vite build`, and `tsc` also type-checks `../plugins/*/frontend/**/*.ts`.
2. `make build`, because `frontend/dist` is embedded in the binary.

### The Plugin Registry

The frontend provides a `PluginRegistry` (exported as `registry`) to hook into the main application. You can use it to register Navigation Tabs, Settings Tabs, Routes and Hooks.

Create `plugins/myplugin/frontend/index.ts`:

```typescript
import { registry } from '../../../frontend/src/plugin-registry';

// Example: Registering a Settings Tab
registry.registerSettingsTab({
    id: 'myplugin',
    labelKey: 'settings.categories.myplugin',        // i18n translation key
    icon: 'star',                                    // A <symbol> id in the icon sprite
    component: 'alps-myplugin-settings',             // The custom element tag to render
    load: () => import('./my-settings-component'),   // Defines <alps-myplugin-settings>
});
```

Disabling a plugin reaches the frontend through `GET /session`. Its `EnabledPlugins` field lists the names of the Go plugins the server loaded, and the registry filters against that list:

- Nav tabs and settings tabs are matched by `pluginId || id`, routes and hooks by `pluginId`. Every name must therefore equal the Go plugin's `Name`. Set `pluginId` whenever a tab's id differs from it, as the `managesieve` plugin's `autoreply` tab, the `caldav` plugin's `calendar` and `tasks` tabs and the `carddav` plugin's `contacts` tab do.
- A route or hook registered without a `pluginId` is treated as the app's own and always resolves or runs.
- A frontend with no loaded Go plugin of that name disappears once `/session` answers. Before the answer arrives, or after sign-out, nothing is filtered.
- Registering a second tab with an id already used, or a second route with a path already used, is silently ignored.

An `icon` is the id of a `<symbol>` in `frontend/public/assets/icons/sprite.svg`, which the build copies to `frontend/dist/assets/icons/sprite.svg`. It is drawn by `renderIcon()` from `frontend/src/utils/ui.ts`. These are not Material Symbols: an id the sprite does not have draws nothing. The in-tree plugins' tabs use `key`, `password`, `sieve`, `arrowBendUpLeft`, `users`, `calendar` and `checkCircle`. A plugin that needs a new icon adds a `<symbol>` to that sprite, and draws icons through `renderIcon()` rather than writing the sprite address itself (`frontend/test/sprite-address.test.ts` enforces this).

### Adding Settings Tabs

A settings tab is a section of the Settings window, at `#/settings/<id>`. The window opens over the page the user was on, which stays mounted beneath it, and Close, Escape and the browser's Back all return to that page as it was.

Plugin sections are listed after the seven built-in sections, in registration order. A settings tab's `icon` is required and is drawn in the section list. The window draws the tab's translated `labelKey` as the section heading above the component, so the component should not repeat it.

`load: () => import('./my-settings-component')` fetches the component's module the first time its section opens. Register that instead of statically importing the component, or the component ships in every user's first download. If the module fails to load, an error notice is shown in its place.

Settings apply as they change. A tab that edits a form in place and has a Save of its own (the filters, the auto-reply) implements `UnsavedChanges`, exported from `frontend/src/components/settings-window.ts`, on the registered component:

```typescript
import { LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { UnsavedChanges } from '../../../frontend/src/components/settings-window';

@customElement('alps-myplugin-settings')
export class MyPluginSettings extends LitElement implements UnsavedChanges {
    @state() private draft = '';
    @state() private saved = '';

    /** Read by the Settings window before it leaves this section. */
    get hasUnsavedChanges(): boolean {
        return this.draft !== this.saved;
    }

    /** Called when the user picks Discard. */
    discardUnsavedChanges(): void {
        this.draft = this.saved;
    }
}
```

While `hasUnsavedChanges` is true, a Close, an Escape or a move to another section asks first. If the user picks Discard, `discardUnsavedChanges()` runs (it is optional), so that an edit the section kept for a later visit is cleared too. The app's automatic reload for a new build also waits while it is true. The browser's Back is not asked: it has already happened by the time the window hears of it.

### Adding Navigation Tabs & Routes

If your plugin provides a full-page view (like CalDAV or CardDAV), register both a Route and a NavTab:

```typescript
import { registry } from '../../../frontend/src/plugin-registry';

// 1. Register the route. The page's module loads the first time it is shown.
registry.registerRoute({
    path: '/myplugin/*',
    component: 'alps-myplugin-page',
    pluginId: 'myplugin',
    load: () => import('./my-plugin-page'), // Defines <alps-myplugin-page>
});

// 2. Register the navigation tab
registry.registerNavTab({
    id: 'myplugin',                 // Opens #/myplugin: the route's first segment
    labelKey: 'navigation.myplugin',
    icon: 'star',                   // Drawn in the phone's account menu
    order: 40                       // Sorts the tabs
});
```

A path ending in `/*` matches every hash path that starts with its prefix, `#/myplugin` itself included. An exact path such as `/myplugin` does not match `#/myplugin/x`, which shows the 404 page instead. Without `pluginId` the route keeps resolving when the plugin is disabled. Without `load` the page ships in every user's first download; if the module fails to load, an error notice replaces the page. The page element is created once and kept until sign-out, or until the route leaves the route table, so returning to the page reconnects the same element instead of building a new one.

A nav tab is not a sidebar entry. On a desktop it is a header tab after the fixed Messages tab. On a phone it is an entry in the account menu, which is the only place the tab's `icon` is drawn (default `star`). Clicking it sets the URL to `#/<id>`, and the tab shows as active while the hash starts with `#/<id>`, so `id` must be the first path segment of the plugin's route. `order` sorts the tabs in ascending order, and an unset (or 0) order counts as 999. The in-tree tabs are Contacts (10), Calendar (20) and Tasks (30).

A page that reads or writes its own URL must leave the Settings window's alone. While Settings is open the page stays mounted beneath it, and the URL is `#/settings/<section>`: a page that reads that as its own resets itself, and one that writes its URL over it (after a save, a sync, a live update) closes the window. Ask first:

```typescript
import { isSettingsHash } from '../../../frontend/src/utils/routes';

private handleHashChange = () => {
    if (isSettingsHash(window.location.hash)) return;
    // ...read the page's view from the URL
};
```

### Creating Web Components

ALPS uses standard Web Components (typically via Lit). Call the routes you defined in Go with `fetchWithTimeout` from `frontend/src/utils/fetch-utils`, not bare `fetch`:

```typescript
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { i18nContext, I18nStore } from '../../../frontend/src/store/i18n-store';
import { fetchWithTimeout } from '../../../frontend/src/utils/fetch-utils';

@customElement('alps-myplugin-settings')
export class MyPluginSettings extends LitElement {
    @consume({ context: i18nContext })
    i18nStore!: I18nStore;

    @state() private status = '';

    connectedCallback() {
        super.connectedCallback();
        void this.load();
    }

    private async load() {
        const response = await fetchWithTimeout('/myplugin/data');
        if (response.ok) this.status = (await response.json()).status;
    }

    render() {
        return html`
            <div class="settings-panel">
                <p>${this.i18nStore.t('settings.myplugin.status', { status: this.status })}</p>
            </div>
        `;
    }
}
```

`fetchWithTimeout`:

- answers an expired session (401) by signing the user out to the login screen with a "session expired" notice;
- applies a timeout, 25 s by default, that covers the body too;
- retries a `GET` after a dropped connection or a 502, 503 or 504;
- raises the offline banner when the server cannot be reached;
- notices when a new frontend build is being served.

`fetchWithTimeout` resolves with a non-2xx answer rather than throwing. The same module has `HttpStatusError` (an error a caller throws for a non-2xx answer, keeping its status), `isSessionExpiry(error)` (true for an `HttpStatusError` with status 401, when the user is already on the way to the login screen and needs no error of the caller's own) and `outcomeUnknown(error)` (true when a failed write may have been made anyway: a timeout, a lost connection, a 5xx or a 408).

### Translations

A plugin's translations live in `frontend/i18n/<code>.ts`, each with `export default { ... }`. There must be one file per language: `ar`, `da`, `de`, `en`, `es`, `fr`, `hi`, `id`, `it`, `ja`, `ko`, `pt`, `pt-BR`, `rs`, `ru`, `sr`, `tr`, `zh-Hans` and `zh-Hant`. `rs` is Serbian in Cyrillic and `sr` is Serbian in Latin script.

```typescript
// plugins/myplugin/frontend/i18n/en.ts
export default {
    navigation: {
        myplugin: 'My Plugin'
    },
    settings: {
        categories: {
            myplugin: 'My Plugin'
        },
        myplugin: {
            status: 'Status: {status}'
        }
    }
};
```

Keys are deep-merged into the core dictionary tree, so a plugin key can also override a core key. `en` is merged at startup, and another language's files load when that language is first shown, whether the user picked it or `auto` chose it. A key missing in a language falls back to English, then to the key itself. Components translate by consuming the store, `@consume({ context: i18nContext }) i18nStore!: I18nStore`, and calling `this.i18nStore.t('key', params)`; `{name}` in a string is replaced by `params.name`.

The frontend tests (`frontend/test/i18n-dictionaries.test.ts`) require every locale of a plugin to have exactly its `en`'s keys, the language's plural forms and `en`'s placeholders, and every literal `t()` key used in plugin source to resolve. See [LOCALIZATION.md](LOCALIZATION.md) for plural forms, languages and right-to-left layout.

---

## 4. Hooks & Background Jobs

### Frontend Hooks

Plugins register hook handlers to augment frontend behaviors. `registerHook` takes a third argument, the owning Go plugin's `Name`:

```typescript
import { html } from 'lit';
import { registry } from '../../../frontend/src/plugin-registry';

// Runs after the server accepted a message. The return value is ignored.
registry.registerHook('composer:send', async ({ recipients }: { recipients: string[] }) => {
    try {
        // ...remember the recipients
    } catch (e) {
        console.error('myplugin: could not remember the recipients', e);
    }
}, 'myplugin');

// Runs before a message body is shown.
registry.registerHook('reader:content', async (payload: any) => {
    payload.banners.push(html`<alps-myplugin-banner></alps-myplugin-banner>`);
}, 'myplugin');
```

Only handlers whose plugin `/session` lists as enabled run. A hook registered without a `pluginId` is treated as the app's own and always runs, even when the deployment has disabled the plugin, because every plugin's `index.ts` is imported either way.

The app invokes five hooks:

| Hook | Payload | When, and how invoked | What a handler returns |
|---|---|---|---|
| `composer:toolbar` | `{ composer, instance }` | Each time the composer's toolbar is drawn, through `invokeHook` | A Lit template to show in the composer toolbar. Falsy results are dropped. |
| `composer:presend` | `{ composer, formData, instance }` | Before the send request, through `invokeHookSettled` | A `FormData` replaces the request body. `false` cancels the send. A handler that rejects also cancels it and shows the `composer.presendFailed` toast. |
| `composer:send` | `{ recipients }`: the To, Cc and Bcc addresses as written | After the server accepted the send, through `invokeHook` | Ignored. |
| `composer:suggest` | `{ query }` | While an address is typed (more than one character, after a 300 ms pause), through `invokeHookAsync` | An array of `{ name, address }`. All handlers' arrays are joined into one list. |
| `reader:content` | `{ content, isHtml, message, mailbox, banners, i18nStore }` | Before a message body is shown, through `invokeHookAsync` | A string replaces the body; HTML is then sanitized. Each handler gets the original `content`, and of several strings the last one wins. Push Lit templates onto `payload.banners` to show banners above the message. For a plain-text body, set `payload.isHtml = true` to have the result treated and sanitized as HTML. |

The registry's three ways to invoke a hook differ in how they treat a failure. A plugin can also invoke hooks of its own with them:

- `invokeHook(name, payload)` calls the handlers synchronously, returns their results, and logs and skips any that throw. A promise a handler returns is not awaited, so an async `composer:send` handler catches its own errors, and a `composer:toolbar` handler must be synchronous.
- `invokeHookAsync(name, payload)` awaits all handlers and returns the results of those that resolved. Rejected ones are logged and dropped.
- `invokeHookSettled(name, payload)` does the same and returns `{ results, failed }`, with the number of handlers that failed.

Write handlers for the awaited hooks as `async` functions, so that a failure counts as a rejection.

### Backend Background Jobs

If your plugin needs to run periodic tasks (e.g., syncing external data), use the `AddJob` method on your `alps.GoPlugin` before its loader runs, normally in `init()`. A job is an `alps.JobFunc`, which is `func() error`:

```go
func init() {
	p := alps.GoPlugin{Name: "myplugin"}

	p.AddJob("sync_data", func() error {
		// Runs once an hour, the first time an hour after alps starts
		return nil
	})

	alps.RegisterPluginLoader(p.Loader())
}
```

A job receives no `*alps.Server`, request or session. A job that needs the server captures it in a closure inside a loader of its own:

```go
var plugin = alps.GoPlugin{Name: "myplugin"}

func init() {
	alps.RegisterPluginLoader(func(s *alps.Server) ([]alps.Plugin, error) {
		plugin.AddJob("sync_data", func() error {
			s.Logger().Printf("myplugin: syncing")
			return nil
		})
		return plugin.Loader()(s)
	})
}
```

Jobs run on a scheduler that ticks once an hour. The interval is fixed in code and cannot be configured, and the first run comes one hour after startup, not at startup. On every tick all registered jobs run one after another in a single goroutine, in no fixed order. A `GoPlugin`'s job is registered under the name `<plugin name>:<job name>`, for example `base:cleanup_bimi_avatars`, which deletes cached BIMI avatars older than 7 days. A job that returns an error or panics is logged at error level and runs again on the next tick.

Jobs are registered by the function `Loader()` returns, when it runs and before the `enabled` rules are applied (see [Registering the Plugin](#registering-the-plugin)). A plugin those rules drop therefore still has its jobs run. A loader that returns `p.Plugin()` without calling `Loader()`, as `caldav`, `carddav` and `managesieve` do, registers no jobs.

---

## 5. Testing a Plugin

- **Go tests** go beside the plugin's sources (`plugins/<name>/*_test.go`) and run with `make test` (`go test -v ./...`).
- **Frontend unit tests** do not go beside the plugin's frontend code: Vitest only collects `frontend/test/**/*.test.ts`. Put them in `frontend/test/<name>.test.ts` and import from `../../plugins/<name>/frontend/...`, as `frontend/test/sieve-compiler.test.ts` does. They run with `npm test` in `frontend/`.
- **Browser specs** go in `frontend/e2e/*.spec.ts` and run with `make test-e2e` (see [E2E.md](E2E.md)). `scripts/e2e.sh` writes an `alps.toml` whose `[plugin.*]` sections set `enabled = true`, which is an allow-list, so a new plugin is loaded in the browser suite only once it has a `[plugin.<name>]` block there.

`npm run build` type-checks `../plugins/*/frontend/**/*.ts` through `tsc`.
