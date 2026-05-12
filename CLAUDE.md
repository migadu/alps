# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

alps is a simple and extensible webmail providing a web interface for IMAP, SMTP, CalDAV, and CardDAV servers. It's built in Go with a plugin-based architecture that supports both Go and Lua plugins.

## Building and Running

### Basic Commands

```bash
# Build the application
go build ./cmd/alps

# Run with domain (requires SRV DNS records per RFC 6186)
go run ./cmd/alps example.org

# Run with explicit upstream servers
go run ./cmd/alps imaps://mail.example.org:993 smtps://mail.example.org:465

# Run with theme
go run ./cmd/alps -theme alps imaps://imap.example.com:993

# Run with debug logging
go run ./cmd/alps -debug imaps://imap.example.com:993

# Run with config file
go run ./cmd/alps -config config.toml

# Run tests
go test ./...

# Run tests for specific package
go test ./plugins/base
go test ./provider/imap
```

### Development Workflow

Hot reload templates and Lua plugins on file changes:
```bash
./contrib/hotreload.sh
```

This watches `themes/` and `plugins/` directories and sends `SIGUSR1` to reload alps without restarting.

### Configuration File (TOML)

Alps now supports TOML configuration files via the `-config` flag. Example structure:

```toml
[server]
addr = ":1323"
debug = false
login_key = "fernet-key"

[theme]
name = "alps"
path = "./themes"

[upstreams]
imap = ["imaps://imap.example.com:993"]
smtp = ["smtps://smtp.example.com:465"]

[plugin.base]
enabled = true

[plugin.caldav]
enabled = true
server = "https://caldav.example.com"

[plugin.carddav]
enabled = true
server = "https://carddav.example.com"
```

Command-line flags override config file values. See `config.example.toml` for full documentation, and `config.example-tls.toml` for TLS/Let's Encrypt configuration examples.

## Architecture

### Core Components

**Server** (`server.go`): Central component that:
- Manages upstream server connections (IMAP/SMTP/CalDAV/CardDAV)
- Coordinates plugin loading and lifecycle
- Handles routing via custom Router
- Manages session state
- Supports hot reload via `SIGUSR1` signal

**Session Management** (`session.go`):
- Sessions are user-specific and hold IMAP/SMTP connections
- Session duration is 30 minutes (hardcoded)
- Supports "remember me" with Fernet-based login tokens
- Handles authentication errors and auto-logout on connection failures

**Router** (`middleware.go`):
- Custom HTTP router built on `http.ServeMux`
- Supports pre-routing (`Pre`) and post-routing (`Use`) middleware
- Method-aware routing (GET, POST, PUT, DELETE)
- Plugin routes registered via `Group` abstraction

**Context** (`context.go`):
- Custom context passed to all HTTP handlers
- Contains Request, Response, Server, and Session
- Provides helper methods for rendering, redirects, cookies, etc.

**Options** (`server.go`):
- `Upstreams`: List of upstream server URLs
- `Theme`: Theme name to use
- `ThemesPath`: Path to themes directory
- `Debug`: Enable debug logging
- `LoginKey`: Fernet key for persistent logins
- `EnabledPlugins`: List of plugin names to enable (empty = all enabled)
- `CacheTTL`: Time-to-live for cache entries (default: 10 minutes)
- `CacheEnabled`: Enable/disable caching globally (default: true)

**Provider Abstraction** (`provider/types.go`):
- Abstracts mail backend implementation (currently IMAP, JMAP planned)
- `MailProvider` interface defines operations: mailboxes, messages, search, flags, etc.
- `AuthenticatedProviderFactory` creates provider instances with user credentials
- Allows for future support of non-IMAP backends without changing core alps code
- Current implementation: `provider/imap` wraps go-imap/v2 client

**Store System** (`store.go`):
- Provides persistent per-user storage via `Store` interface
- Primary backend: IMAP METADATA extension (RFC 5464)
- Fallback: In-memory storage if METADATA not supported
- Used for linked accounts, user preferences, plugin data
- Data stored at `/private/vendor/alps/<key>` on IMAP server
- Includes in-memory cache to reduce IMAP round-trips

**Cache System** (`cache.go`):
- Simple in-memory cache with configurable TTL
- Used by sessions to cache mailbox lists, message metadata, etc.
- Automatic cleanup goroutine removes expired entries
- Can be disabled via config for debugging

**Linked Accounts** (`linked_accounts.go`):
- Allows users to link multiple email accounts to their primary account
- Credentials encrypted using server's LoginKey (Fernet encryption)
- Stored in user's IMAP METADATA for persistence
- Supports different IMAP servers per linked account
- Used for unified inbox or account switching without re-login

### Plugin System

**Plugin Loading** (`plugin.go`, `plugin_go.go`):
- Plugins register via `RegisterPluginLoader()` in their `init()` functions
- All plugins are imported in `cmd/alps/plugins.go`
- Server filters loaded plugins based on `Options.EnabledPlugins`
- If `EnabledPlugins` is empty, all registered plugins load

**Plugin Interface** (`plugin.go`):
```go
type Plugin interface {
    Name() string
    LoadTemplate(*template.Template) error
    SetRoutes(*Group)
    Inject(*Context, string, RenderData) error
    Close() error
}
```

**Go Plugins**: Use `GoPlugin` helper to define routes, template functions, and injection:
```go
p := alps.GoPlugin{Name: "myplugin"}
p.GET("/path", handlerFunc)
p.TemplateFuncs(funcMap)
p.Inject("template.html", injectFunc)
alps.RegisterPluginLoader(p.Loader())
```

**Lua Plugins**: Entry point at `plugins/<name>/main.lua` with API:
- `alps.on_render(name, f)`: Hook into template rendering
- `alps.set_filter(name, f)`: Register template function
- `alps.set_route(method, path, f)`: Register HTTP route

**Built-in Plugins**:
- `base`: Core email functionality (mailbox, compose, settings) - effectively required
- `caldav`: Calendar support, requires CalDAV server URL
- `carddav`: Contacts support, requires CardDAV server URL
- `viewhtml`: Render HTML emails in sandboxed iframe with remote content controls
  - Blocks external images/resources by default for privacy
  - User can opt-in to load remote content per message
  - Proxies external resources to prevent IP leakage
  - Auto-resizes iframe to content height via postMessage
- `viewtext`: Enhanced plain text email rendering
- `lua`: Lua scripting support for custom functionality
- `webauthn`: WebAuthn/passkey authentication support

### Upstream Server Discovery

**Supported URL Schemes** (see `docs/cli.md`):
- IMAP: `imaps://`, `imap+insecure://`
- SMTP: `smtps://`, `smtp+insecure://`
- CalDAV: `caldavs://`, `caldav+insecure://`, `https://`, `http+insecure://`
- CardDAV: `carddavs://`, `carddav+insecure://`, `https://`, `http+insecure://`

**Auto-discovery**: When only a domain is provided, alps uses SRV DNS records to discover servers.

**Plugin-specific Upstreams**: Plugins like caldav/carddav can specify their own `server` in config, which gets added to the upstreams list automatically.

### Template System

**Renderer** (`renderer.go`):
- Loads templates from plugins and themes
- Themes override plugin templates: `themes/<name>/*.html` overrides `plugins/<name>/public/*.html`
- Template functions provided by plugins via `TemplateFuncs()`
- Data injection via `Inject()` allows plugins to add context to templates

**Template Paths**:
- Plugin templates: `plugins/<name>/public/*.html`
- Theme templates: `themes/<name>/*.html`
- Plugin assets: `plugins/<name>/public/assets/*` → `/plugins/<name>/assets/*`
- Theme assets: `themes/<name>/assets/*` → `/themes/<name>/assets/*`

### Authentication & Security

**Authentication Flow**:
1. User submits credentials to `/login`
2. Session created with IMAP/SMTP connection
3. Session token stored in cookie (`alps_session`)
4. Optional "remember me" creates encrypted login token cookie (`alps_login_token`)

**Middleware Chain** (`server.go:setupMiddleware()`):
1. Pre-middleware: Holds read lock during request (for reload safety)
2. Security headers: CSP, DNS prefetch control
3. Auth middleware: Validates session, handles expiry, redirects to login

**Threading Model**:
- Server uses RWMutex for safe concurrent access to router, plugins, and renderer
- Read lock held during request processing (via pre-middleware)
- Write lock held only during reload to swap router/plugins/renderer
- ServeHTTP acquires read lock briefly to get router reference before handling request

**Public Routes**: `/login`, `/themes/*`, `/plugins/*/assets/*` bypass authentication

### Key Implementation Details

**Session Reconnection**: If IMAP connection drops, session attempts reconnection using stored credentials. On failure, user is logged out.

**Error Handling** (`server.go:358-410`):
- Auth errors and connection failures trigger automatic logout
- Renders `error.html` template with status code and message
- Panics in handlers are caught and logged

**Reload Mechanism**:
- `SIGUSR1` triggers `Reload()` which re-loads plugins and templates from disk
- Creates a new router with middleware and routes during reload (`server.go:loadPlugins()`)
- Uses RWMutex for thread-safe router swapping (`server.go:ServeHTTP()`)
- Previous plugins are closed before new ones are loaded
- Hot reload workflow: `pkill -SIGUSR1 alps` or use `contrib/hotreload.sh`
- Note: Go plugins require full restart; only templates, CSS, and Lua plugins reload

## Configuration Options

**Generate Login Key**:
```bash
go run github.com/fernet/fernet-go/cmd/fernet-keygen
```

Use the generated key with `-login-key` flag or `server.login_key` in config.

## Project Structure

```
alps/
├── cmd/alps/          # Main application entry point
│   ├── main.go        # CLI parsing, server initialization
│   ├── config.go      # TOML configuration structures
│   └── plugins.go     # Plugin imports (all plugins imported here)
├── frontend/          # TypeScript/Lit frontend (optional modern UI)
│   ├── src/
│   │   ├── components/    # Web components (Lit elements)
│   │   ├── pages/         # Page-level components
│   │   ├── services/      # API services, message sync
│   │   ├── store/         # State management (compose, settings, i18n)
│   │   └── utils/         # Utilities (attachment handling, etc.)
│   ├── package.json   # npm dependencies (Lit, Vite, TypeScript)
│   ├── vite.config.ts # Vite build configuration
│   └── tsconfig.json  # TypeScript configuration
├── plugins/           # Plugin implementations
│   ├── base/          # Core email functionality
│   └── (caldav, carddav, viewhtml, viewtext, lua in _legacy/)
├── provider/          # Mail provider abstraction
│   ├── types.go       # MailProvider interface, Message/Mailbox types
│   └── imap/          # IMAP provider implementation
├── tlsmanager/        # TLS/Let's Encrypt certificate management
├── server.go          # Core server, routing, plugin coordination
├── session.go         # Session management, provider connections
├── middleware.go      # Router, middleware, request handling
├── context.go         # HTTP context wrapper
├── plugin.go          # Plugin interface definitions
├── plugin_go.go       # Go plugin helpers
├── store.go           # Persistent storage (IMAP METADATA)
├── cache.go           # In-memory cache with TTL
├── linked_accounts.go # Multi-account support
├── imap.go            # IMAP connection helpers
├── smtp.go            # SMTP connection helpers
└── discover.go        # SRV record auto-discovery
```

## Common Patterns

### Adding a New Route in a Plugin

```go
func init() {
    p := alps.GoPlugin{Name: "myplugin"}
    p.GET("/my-route", func(ctx *alps.Context) error {
        // Access session
        if ctx.Session == nil {
            return alps.NewHTTPError(http.StatusUnauthorized)
        }

        // Render template
        return ctx.Render(http.StatusOK, "mytemplate.html", data)
    })
    alps.RegisterPluginLoader(p.Loader())
}
```

### Enabling/Disabling Plugins

**Via Config File**:
```toml
[plugin.myplugin]
enabled = false
```

**Programmatically**: Modify `Options.EnabledPlugins` before calling `alps.New()`.

### Adding Plugin-Specific Configuration

1. Add fields to `PluginConfig` in `cmd/alps/config.go`
2. Parse in `cmd/alps/main.go` and add to upstreams or pass to plugin
3. Access in plugin via upstream or context

### Theme Development

**Theme Structure**:
```
themes/<name>/
├── *.html          # Templates that override plugin templates
├── assets/
│   ├── style.css   # Theme-specific styles
│   └── ...         # Other assets (images, fonts, etc.)
```

**Template Override Priority**:
1. Theme templates (`themes/<name>/*.html`) override plugin templates
2. Plugin templates (`plugins/<name>/public/*.html`) are defaults
3. Template names must match exactly for override to work

**CSS Loading Order**:
1. Plugin CSS: `/plugins/<name>/assets/style.css`
2. Theme CSS: `/themes/<name>/assets/style.css` (loaded last, can override)

**Full-Height Layout Pattern** (for message views):
- Use flexbox throughout the layout hierarchy
- Set `body` as flex container with `min-height: 100vh`
- Chain flex containers down to the iframe
- Set iframe with `flex: 1` to fill available space
- See `themes/ceresio/assets/style.css` for reference implementation

### Frontend Development

The `frontend/` directory contains a modern TypeScript/Lit-based web UI (work in progress):

```bash
# Install dependencies
cd frontend && npm install

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Output goes to frontend/dist/
```

**Frontend Architecture**:
- Built with Lit (web components), Vite (bundler), TypeScript
- State management via custom stores (compose, settings, i18n) using Lit's context API
- Key components: message-list, message-reader, alps-message-composer, alps-floating-composer
- Services: message-sync (background sync), message-operations (copy/move/delete), auto-logout
- Utilities: attachment-utils, CSS sanitizer for email rendering

**Integration with Go Backend**:
- Frontend is served as static files from `frontend/dist/`
- Communicates with Go backend via REST API endpoints defined in plugin routes
- Session management still handled by Go backend (cookies)

## Important Notes

- The `base` plugin provides core email functionality and is effectively required
- Session duration is hardcoded to 30 minutes (`session.go:25`)
- Max attachment size is 32 MiB (`session.go:26`)
- All plugins must be imported in `cmd/alps/plugins.go` to be available
- Plugin filtering happens at load time based on `EnabledPlugins` list
- Themes can override any plugin template by matching the filename
- SIGUSR1 only reloads templates and Lua plugins, not Go plugins
- When modifying server internals (router, middleware), remember the threading model requires proper locking
- The provider abstraction layer (`provider/`) allows for future non-IMAP backends (e.g., JMAP)
- Linked accounts require a LoginKey configured for credential encryption
- Store system prefers IMAP METADATA but falls back to in-memory if unavailable
- Cache can be disabled for debugging via config (`cache.enabled = false`)
