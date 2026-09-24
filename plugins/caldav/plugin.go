package alpscaldav

import (
	"context"
	"fmt"
	"github.com/migadu/alps/provider"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"github.com/emersion/go-webdav/caldav"
	"github.com/migadu/alps"
)

func sanityCheckURL(u *url.URL) error {
	req, err := http.NewRequest(http.MethodOptions, u.String(), nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
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
	urlCache     sync.Map // raw endpoint -> *url.URL
	homeSetCache map[string]string
	// accounts caches what the server says about scheduling, per user; see
	// schedulingAccount.
	accounts         map[string]*schedulingAccount
	cacheMutex       sync.RWMutex
	debug            bool
	defaultWeekStart int
}

func parseWeekStart(val interface{}) int {
	switch v := val.(type) {
	case int:
		if v == 0 || v == 1 {
			return v
		}
	case int64:
		if v == 0 || v == 1 {
			return int(v)
		}
	case float64:
		if v == 0 || v == 1 {
			return int(v)
		}
	case string:
		switch strings.ToLower(strings.TrimSpace(v)) {
		case "0", "sunday", "sun":
			return 0
		case "1", "monday", "mon":
			return 1
		}
	}
	return 1
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
		p.srv.Logger().Printf("caldav: provider named an unusable server %q for %s: %v (using the configured one)", raw, username, err)
		return p.url
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

func (p *plugin) client(ctx context.Context, session *alps.Session) (*caldav.Client, error) {
	u := p.urlFor(usernameOf(session))
	if u == nil {
		return nil, fmt.Errorf("CalDAV server is not configured")
	}
	return newClient(u, session, p.debug)
}

// httpClient authenticates as the session, for the requests go-webdav's client
// has no method for.
func (p *plugin) httpClient(session *alps.Session) *http.Client {
	return &http.Client{Transport: &authRoundTripper{server: http.DefaultTransport, session: session, debug: p.debug}}
}

func (p *plugin) clientWithCalendars(ctx context.Context, session *alps.Session) (*caldav.Client, []caldav.Calendar, error) {
	c, err := p.client(ctx, session)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create CalDAV client: %v", err)
	}

	p.cacheMutex.RLock()
	homeSet, ok := p.homeSetCache[session.Username()]
	p.cacheMutex.RUnlock()

	if !ok {
		principal, err := c.FindCurrentUserPrincipal(ctx)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to query CalDAV principal: %v", err)
		}

		homeSet, err = c.FindCalendarHomeSet(ctx, principal)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to query CalDAV calendar home set: %v", err)
		}

		p.cacheMutex.Lock()
		if len(p.homeSetCache) > 1000 {
			// Clear cache to prevent unbounded growth
			p.homeSetCache = make(map[string]string)
		}
		p.homeSetCache[session.Username()] = homeSet
		p.cacheMutex.Unlock()
	}

	calendars, err := c.FindCalendars(ctx, homeSet)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query CalDAV calendars: %v", err)
	}
	if len(calendars) == 0 {
		return nil, nil, fmt.Errorf("no calendars found")
	}

	return c, calendars, nil
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
			s, err := caldav.DiscoverContextURL(context.Background(), u.Host)
			if err != nil {
				srv.Logger().Printf("caldav: failed to discover CalDAV server: %v", err)
				return nil, nil
			}
			u, err = url.Parse(s)
			if err != nil {
				return nil, fmt.Errorf("caldav: Discover returned an invalid URL: %v", err)
			}
		}

		if err := sanityCheckURL(u); err != nil {
			srv.Logger().Printf("caldav: failed to connect to CalDAV server %q: %v (continuing anyway)", u, err)
		}

		srv.Logger().Printf("Configured CalDAV server: %v", u)
	}

	defaultWeekStart := 1
	if cfg.Options != nil {
		if v, ok := cfg.Options["week_start"]; ok {
			defaultWeekStart = parseWeekStart(v)
		} else if v, ok := cfg.Options["first_day_of_week"]; ok {
			defaultWeekStart = parseWeekStart(v)
		}
	}

	p := &plugin{
		GoPlugin:         alps.GoPlugin{Name: "caldav"},
		srv:              srv,
		url:              u,
		homeSetCache:     make(map[string]string),
		accounts:         make(map[string]*schedulingAccount),
		debug:            srv.Options.Debug,
		defaultWeekStart: defaultWeekStart,
	}

	registerRoutes(p)

	return p.Plugin(), nil
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
