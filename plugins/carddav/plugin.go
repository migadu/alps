package alpscarddav

import (
	"context"
	"fmt"
	"github.com/migadu/alps/provider"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/emersion/go-webdav/carddav"
	"github.com/migadu/alps"
)

// sanityCheckTimeout bounds sanityCheckURL's OPTIONS probe. http.DefaultClient
// has no timeout, so an unresponsive server blocked plugin startup forever.
// A var so tests can shorten it.
var sanityCheckTimeout = 10 * time.Second

func sanityCheckURL(u *url.URL) error {
	req, err := http.NewRequest(http.MethodOptions, u.String(), nil)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: sanityCheckTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	resp.Body.Close()

	// Servers might require authentication, or might not support OPTIONS on the root path
	if resp.StatusCode/100 != 2 && resp.StatusCode != http.StatusUnauthorized && resp.StatusCode != http.StatusNotFound && resp.StatusCode != http.StatusMethodNotAllowed {
		return fmt.Errorf("HTTP request failed: %v %v", resp.StatusCode, resp.Status)
	}
	return nil
}

type plugin struct {
	alps.GoPlugin
	url          *url.URL
	srv          *alps.Server
	urlCache     sync.Map          // raw endpoint -> *url.URL
	homeSetCache map[string]string // resolved connection identity -> home set
	cacheMutex   sync.RWMutex
	debug        bool
}

// urlFor resolves the CardDAV endpoint for a session. A provider that routes
// per domain answers here, so contacts come from the same place as the mail;
// otherwise the globally configured server stands.
func (p *plugin) urlFor(username string) *url.URL {
	if username == "" || p.srv == nil {
		return p.url
	}
	raw := p.srv.ServiceURLFor(provider.ServiceCardDAV, username)
	if raw == "" {
		return p.url
	}
	if cached, ok := p.urlCache.Load(raw); ok {
		return cached.(*url.URL)
	}
	u, err := parseCardDAVURL(raw)
	if err != nil {
		p.srv.Logger().Printf("carddav: provider named an unusable server %q for %s: %v (using the configured one)", raw, username, err)
		return p.url
	}
	p.urlCache.Store(raw, u)
	return u
}

// connectionKey keeps every operation in one HTTP request on the same DAV
// account, even if another request changes its saved connection concurrently.
type connectionKey struct{}

type requestConnection struct {
	url      *url.URL
	client   *http.Client
	cacheKey string
}

func (p *plugin) connection(ctx context.Context, session *alps.Session) (*requestConnection, error) {
	if conn, ok := ctx.Value(connectionKey{}).(*requestConnection); ok {
		return conn, nil
	}
	fallback := ""
	if u := p.urlFor(usernameOf(session)); u != nil {
		fallback = u.String()
	}
	resolved := alps.ResolvedDAVConnection{Server: fallback}
	if session != nil {
		var err error
		resolved, err = session.ResolveDAVConnection(provider.ServiceCardDAV, fallback)
		if err != nil {
			return nil, err
		}
	}
	if resolved.Server == "" {
		return nil, fmt.Errorf("CardDAV server is not configured")
	}
	u, err := parseCardDAVURL(resolved.Server)
	if err != nil {
		return nil, err
	}
	hc, err := alps.DAVHTTPClient(resolved)
	if err != nil {
		return nil, err
	}
	hc.Transport = &authRoundTripper{server: hc.Transport, debug: p.debug}
	return &requestConnection{url: u, client: hc, cacheKey: resolved.CacheKey}, nil
}

func (p *plugin) addRoute(method, path string, handler alps.HandlerFunc) {
	p.GoPlugin.AddRoute(method, path, func(ctx *alps.Context) error {
		conn, err := p.connection(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}
		ctx.Request = ctx.Request.WithContext(context.WithValue(ctx.Request.Context(), connectionKey{}, conn))
		return handler(ctx)
	})
}

func (p *plugin) requestConnection(ctx *alps.Context) *requestConnection {
	return ctx.Request.Context().Value(connectionKey{}).(*requestConnection)
}

// httpClient shares the request's resolved credentials with go-webdav's client.
func (p *plugin) httpClient(ctx *alps.Context) *http.Client {
	return p.requestConnection(ctx).client
}

func (p *plugin) clientWithAddressBook(ctx context.Context, session *alps.Session) (*carddav.Client, *carddav.AddressBook, error) {
	conn, err := p.connection(ctx, session)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create CardDAV client: %v", err)
	}
	c, err := newClient(conn.url, conn.client)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create CardDAV client: %v", err)
	}

	p.cacheMutex.RLock()
	homeSet, ok := p.homeSetCache[conn.cacheKey]
	p.cacheMutex.RUnlock()

	if !ok {
		principal, err := c.FindCurrentUserPrincipal(ctx)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to query CardDAV principal: %v", err)
		}

		homeSet, err = c.FindAddressBookHomeSet(ctx, principal)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to query CardDAV address book home set: %v", err)
		}

		p.cacheMutex.Lock()
		if len(p.homeSetCache) > 1000 {
			// Clear cache to prevent unbounded growth
			p.homeSetCache = make(map[string]string)
		}
		p.homeSetCache[conn.cacheKey] = homeSet
		p.cacheMutex.Unlock()
	}

	addressBooks, err := c.FindAddressBooks(ctx, homeSet)
	if err != nil {
		p.forgetHomeSet(session.Username(), homeSet)
		return nil, nil, fmt.Errorf("failed to query CardDAV address books: %v", err)
	}
	if len(addressBooks) == 0 {
		return nil, nil, errNoAddressBook
	}
	return c, &addressBooks[0], nil
}

// forgetHomeSet drops a login's cached home set after listing from it failed,
// so the next request looks it up again. The server may have moved it, when
// the account was provisioned again or another server took over the URL;
// kept, it would fail every request until alps restarted. It is dropped only if
// it is still the one that failed: another request may have looked up the new
// one meanwhile.
func (p *plugin) forgetHomeSet(username, homeSet string) {
	p.cacheMutex.Lock()
	if cached, ok := p.homeSetCache[username]; ok && cached == homeSet {
		delete(p.homeSetCache, username)
	}
	p.cacheMutex.Unlock()
}

// parseCardDAVURL normalises a configured CardDAV endpoint into an http(s) URL.
func parseCardDAVURL(raw string) (*url.URL, error) {
	u, err := alps.ParseServerURL(raw)
	if err != nil {
		return nil, fmt.Errorf("failed to parse CardDAV server: %v", err)
	}

	switch u.Scheme {
	case "carddavs":
		u.Scheme = "https"
	case "carddav+insecure", "http+insecure":
		u.Scheme = "http"
	}
	if u.Scheme == "" {
		return nil, fmt.Errorf("CardDAV server requires a scheme (https://, http+insecure://), got: %v", u.String())
	}
	return u, nil
}

func newPlugin(srv *alps.Server) (alps.Plugin, error) {
	cfg := srv.Options.Plugins["carddav"]
	if cfg.Server == "" && !cfg.Enabled && !srv.HasServiceRouting(provider.ServiceCardDAV) {
		// No server configured and service not routed/enabled, disable plugin
		return nil, nil
	}
	var u *url.URL
	if cfg.Server != "" {
		var err error
		u, err = parseCardDAVURL(cfg.Server)
		if err != nil {
			return nil, err
		}

		if err := sanityCheckURL(u); err != nil {
			srv.Logger().Printf("carddav: failed to connect to CardDAV server %q: %v (continuing anyway)", u, err)
		}

		srv.Logger().Printf("Configured CardDAV server: %v", u)
	}

	p := &plugin{
		GoPlugin:     alps.GoPlugin{Name: "carddav"},
		url:          u,
		srv:          srv,
		homeSetCache: make(map[string]string),
		debug:        srv.Options.Debug,
	}

	registerRoutes(p)

	return &davPlugin{Plugin: p.Plugin(), plugin: p}, nil
}

// davPlugin exposes the same normalized administrator endpoint the request
// handlers use, so settings do not mistake failed discovery for a connection.
type davPlugin struct {
	alps.Plugin
	plugin *plugin
}

func (p *davPlugin) DAVDefaultServer(username string) string {
	if u := p.plugin.urlFor(username); u != nil {
		return u.String()
	}
	return ""
}

func init() {
	alps.RegisterPluginLoader(func(s *alps.Server) ([]alps.Plugin, error) {
		p, err := newPlugin(s)
		if err != nil {
			return nil, err
		}
		if p == nil {
			return nil, nil
		}
		return []alps.Plugin{p}, err
	})
}

// usernameOf reads a session's login, tolerating the nil session that a
// caller outside a request may hand over.
func usernameOf(session *alps.Session) string {
	if session == nil {
		return ""
	}
	return session.Username()
}
