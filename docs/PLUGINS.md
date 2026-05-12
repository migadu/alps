# ALPS Plugin Development Guide

ALPS features a modular architecture that allows you to extend both the backend (Go) and the frontend (TypeScript/Web Components) via plugins.

Plugins are located in the `plugins/` directory at the root of the project.

## Table of Contents
1. [Plugin Structure](#plugin-structure)
2. [Backend (Go) Development](#backend-go-development)
   - [Defining the Plugin](#defining-the-plugin)
   - [Registering the Plugin](#registering-the-plugin)
3. [Frontend (TypeScript) Development](#frontend-typescript-development)
   - [The Plugin Registry](#the-plugin-registry)
   - [Adding Settings Tabs](#adding-settings-tabs)
   - [Adding Navigation Tabs & Routes](#adding-navigation-tabs--routes)
4. [Hooks & Background Jobs](#hooks--background-jobs)

---

## 1. Plugin Structure

A typical ALPS plugin has the following directory structure:

```
plugins/myplugin/
├── plugin.go             # Backend plugin definition and routes
├── frontend/             # Frontend source code
│   ├── index.ts          # Frontend entry point
│   ├── my-component.ts   # Custom Web Components
│   └── i18n/             # Localization files for the plugin
```

---

## 2. Backend (Go) Development

The backend portion of a plugin registers HTTP routes, background jobs, and serves frontend assets. ALPS provides a `GoPlugin` helper to make this simple.

### Defining the Plugin

Create a `plugin.go` file inside your plugin directory (`plugins/myplugin/plugin.go`):

```go
package myplugin

import (
	"net/http"
	"github.com/migadu/alps"
)

func init() {
	// 1. Create a new GoPlugin instance
	p := alps.GoPlugin{Name: "myplugin"}

	// 2. Register HTTP routes
	p.GET("/api/myplugin/data", handleGetData)
	p.POST("/api/myplugin/save", handleSaveData)

	// 3. Register the loader with ALPS
	alps.RegisterPluginLoader(p.Loader())
}

func handleGetData(c *alps.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

func handleSaveData(c *alps.Context) error {
	return c.NoContent(http.StatusOK)
}
```

### Registering the Plugin

To compile your plugin into the ALPS binary, you must import it anonymously in `cmd/alps/plugins.go`:

```go
package main

import (
	// ... existing plugins ...
	_ "github.com/migadu/alps/plugins/myplugin"
)
```

ALPS users can then enable or disable your plugin in `config.toml`:
```toml
[plugin.myplugin]
enabled = true
```

---

## 3. Frontend (TypeScript) Development

ALPS uses Vite for its frontend. It automatically discovers and loads frontend plugins using `import.meta.glob`.

**Any file at `plugins/*/frontend/index.ts` will be automatically executed on startup.**

### The Plugin Registry

The frontend provides a `PluginRegistry` (exported as `registry`) to hook into the main application. You can use it to register Navigation Tabs, Settings Tabs, and Routes.

Create `plugins/myplugin/frontend/index.ts`:

```typescript
import { registry } from '../../../frontend/src/plugin-registry';
import './my-settings-component'; // Import your custom Web Components

// Example: Registering a Settings Tab
registry.registerSettingsTab({
    id: 'myplugin',
    labelKey: 'settings.categories.myplugin', // i18n translation key
    icon: 'extension',                        // Material symbol icon name
    component: 'alps-myplugin-settings'       // The custom element tag to render
});
```

### Adding Navigation Tabs & Routes

If your plugin provides a full-page view (like CalDAV or CardDAV), you must register both a Route and a NavTab:

```typescript
import { registry } from '../../../frontend/src/plugin-registry';
import './my-plugin-page'; // Defines <alps-myplugin-page>

// 1. Register the route
registry.registerRoute({
    path: '/myplugin',
    component: 'alps-myplugin-page'
});

// 2. Register the sidebar navigation tab
registry.registerNavTab({
    id: 'myplugin',
    labelKey: 'nav.myplugin',
    icon: 'extension',
    order: 50 // Determines position in the sidebar
});
```

### Creating Web Components

ALPS uses standard Web Components (typically via Lit). Your components should interact with the ALPS backend using the standard `fetch` API against the routes you defined in Go.

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('alps-myplugin-settings')
export class MyPluginSettings extends LitElement {
    render() {
        return html`
            <div class="settings-panel">
                <h2>My Plugin Settings</h2>
                <!-- Your settings UI -->
            </div>
        `;
    }
}
```

---

## 4. Hooks & Background Jobs

### Frontend Hooks

Plugins can register and invoke hooks to intercept or augment frontend behaviors:

```typescript
// Registering a hook listener
registry.registerHook('onMessageSend', async (messageData) => {
    // Modify or validate messageData before it sends
    return messageData;
});

// Triggering hooks
const results = await registry.invokeHookAsync('onMessageSend', data);
```

### Backend Background Jobs

If your plugin needs to run periodic tasks (e.g., syncing external data), use the `AddJob` method on your `alps.GoPlugin`:

```go
func init() {
	p := alps.GoPlugin{Name: "myplugin"}
	
	p.AddJob("sync_data", func(s *alps.Server) error {
		// This runs periodically as defined by the scheduler
		return nil
	})

	alps.RegisterPluginLoader(p.Loader())
}
```
