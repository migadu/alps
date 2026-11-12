package alpscaldav

import (
	"context"
	"fmt"
	"github.com/migadu/alps/provider"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/go-webdav/caldav"
)

// sanityCheckTimeout bounds sanityCheckURL's OPTIONS probe. http.DefaultClient
// has no timeout, so an unresponsive server blocked plugin startup forever.
// A var so tests can shorten it.
var sanityCheckTimeout = 10 * time.Second

// A variable so startup discovery failures can be exercised without DNS.
var discoverCalDAVURL = caldav.DiscoverContextURL

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
	// accounts caches what the server says about scheduling, per connection; see
	// schedulingAccount.
	accounts   map[string]*schedulingAccount
	cacheMutex sync.RWMutex
	debug      bool
}

// urlFor resolves the CalDAV endpoint for a session. A provider that routes
// per domain answers here, so calendars come from the same place as the mail;
// otherwise the globally configured server stands.
//
// Unlike start-up, this never falls back to DNS discovery: a login must not
// cost a discovery round trip, so an endpoint without a scheme is refused.
func (p *plugin) urlFor(username string) *url.URL {
	if username == "" || p.srv == nil {
		return p.url
	}
	raw := p.srv.ServiceURLFor(provider.ServiceCalDAV, username)
	if raw == "" {
		return p.url
	}
	if cached, ok := p.urlCache.Load(raw); ok {
		return cached.(*url.URL)
	}
	u, err := parseCalDAVURL(raw)
	if err != nil {
		cached, loaded := p.urlCache.LoadOrStore(raw, p.url)
		if !loaded {
			p.srv.Logger().Printf("caldav: provider named an unusable server %q for %s: %v (using the configured one)", raw, username, err)
		}
		return cached.(*url.URL)
	}
	p.urlCache.Store(raw, u)
	return u
}

// parseCalDAVURL normalises a configured CalDAV endpoint into an http(s) URL.
// It requires an explicit scheme; start-up handles the discovery case.
func parseCalDAVURL(raw string) (*url.URL, error) {
	u, err := alps.ParseServerURL(raw)
	if err != nil {
		return nil, fmt.Errorf("failed to parse CalDAV server: %v", err)
	}
	switch u.Scheme {
	case "caldavs":
		u.Scheme = "https"
	case "caldav+insecure", "http+insecure":
		u.Scheme = "http"
	}
	if u.Scheme == "" {
		return nil, fmt.Errorf("CalDAV server requires a scheme (https://, http+insecure://), got: %v", u.String())
	}
	return u, nil
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
		resolved, err = session.ResolveDAVConnection(provider.ServiceCalDAV, fallback)
		if err != nil {
			return nil, err
		}
	}
	if resolved.Server == "" {
		return nil, fmt.Errorf("CalDAV server is not configured")
	}
	u, err := parseCalDAVURL(resolved.Server)
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

// clientWithCalendars is a client for the session's server, with the
// calendars in the user's calendar home set, whose path it keeps in
// homeSetCache for as long as the calendars can be listed from it.
//
// No calendars is an answer, not an error. A home set is empty where a server
// leaves an account to make its own first calendar, and once the last one is
// deleted. Refused as "no calendars found", an empty home could be neither
// listed nor given its first calendar. A route that needs a calendar looks for
// one itself: a new event, task or invitation copy with none to go into is
// refused with a conflict, and a path is checked against the calendars listed.
func (p *plugin) clientWithCalendars(ctx context.Context, session *alps.Session) (*caldav.Client, []caldav.Calendar, error) {
	c, _, calendars, err := p.clientWithHomeSet(ctx, session)
	return c, calendars, err
}

// clientWithHomeSet is clientWithCalendars, with the path of the home set the
// calendars were listed from, where a new calendar goes. Read back from
// homeSetCache instead, it could be gone: another request may have cleared the
// cache meanwhile.
func (p *plugin) clientWithHomeSet(ctx context.Context, session *alps.Session) (*caldav.Client, string, []caldav.Calendar, error) {
	conn, err := p.connection(ctx, session)
	if err != nil {
		return nil, "", nil, fmt.Errorf("failed to create CalDAV client: %v", err)
	}
	c, err := newClient(conn.url, conn.client)
	if err != nil {
		return nil, "", nil, fmt.Errorf("failed to create CalDAV client: %v", err)
	}

	p.cacheMutex.RLock()
	homeSet, ok := p.homeSetCache[conn.cacheKey]
	p.cacheMutex.RUnlock()

	if !ok {
		principal, err := c.FindCurrentUserPrincipal(ctx)
		if err != nil {
			return nil, "", nil, fmt.Errorf("failed to query CalDAV principal: %v", err)
		}

		homeSet, err = c.FindCalendarHomeSet(ctx, principal)
		if err != nil {
			return nil, "", nil, fmt.Errorf("failed to query CalDAV calendar home set: %v", err)
		}

		p.cacheMutex.Lock()
		if len(p.homeSetCache) > 1000 {
			// Clear cache to prevent unbounded growth
			p.homeSetCache = make(map[string]string)
		}
		p.homeSetCache[conn.cacheKey] = homeSet
		p.cacheMutex.Unlock()
	}

	calendars, err := c.FindCalendars(ctx, homeSet)
	if err != nil {
		p.forgetHomeSet(conn.cacheKey, homeSet)
		return nil, "", nil, fmt.Errorf("failed to query CalDAV calendars: %v", err)
	}

	return c, homeSet, calendars, nil
}

// forgetHomeSet drops a connection's cached home set after listing from it failed,
// so the next request looks it up again. The server may have moved it, when
// the account was provisioned again or another server took over the URL;
// kept, it would fail every request until alps restarted. It is dropped only if
// it is still the one that failed: another request may have looked up the new
// one meanwhile.
func (p *plugin) forgetHomeSet(cacheKey, homeSet string) {
	p.cacheMutex.Lock()
	if cached, ok := p.homeSetCache[cacheKey]; ok && cached == homeSet {
		delete(p.homeSetCache, cacheKey)
	}
	p.cacheMutex.Unlock()
}

func newPlugin(srv *alps.Server) (alps.Plugin, error) {
	cfg := srv.Options.Plugins["caldav"]
	if cfg.Server == "" && !cfg.Enabled && !srv.HasServiceRouting(provider.ServiceCalDAV) {
		// No server configured and service not routed/enabled, disable plugin
		return nil, nil
	}
	var u *url.URL
	if cfg.Server != "" {
		var err error
		u, err = alps.ParseServerURL(cfg.Server)
		if err != nil {
			return nil, fmt.Errorf("failed to parse CalDAV server: %v", err)
		}

		switch u.Scheme {
		case "caldavs":
			u.Scheme = "https"
		case "caldav+insecure", "http+insecure":
			u.Scheme = "http"
		}
		if u.Scheme == "" {
			s, err := discoverCalDAVURL(context.Background(), u.Host)
			if err != nil {
				srv.Logger().Printf("caldav: failed to discover CalDAV server: %v", err)
				if !cfg.Enabled && !srv.HasServiceRouting(provider.ServiceCalDAV) {
					return nil, nil
				}
				// Explicit enablement also permits personal connections, and a
				// routed login has a server of its own. A failed administrator
				// default must not hide their settings or endpoints.
				u = nil
			} else {
				u, err = url.Parse(s)
				if err != nil {
					return nil, fmt.Errorf("caldav: Discover returned an invalid URL: %v", err)
				}
			}
		}

		if u != nil {
			if err := sanityCheckURL(u); err != nil {
				srv.Logger().Printf("caldav: failed to connect to CalDAV server %q: %v (continuing anyway)", u, err)
			}

			srv.Logger().Printf("Configured CalDAV server: %v", u)
		}
	}

	p := &plugin{
		GoPlugin:     alps.GoPlugin{Name: "caldav"},
		srv:          srv,
		url:          u,
		homeSetCache: make(map[string]string),
		accounts:     make(map[string]*schedulingAccount),
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
