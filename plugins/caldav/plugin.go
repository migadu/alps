package alpscaldav

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
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
	homeSetCache map[string]string
	cacheMutex   sync.RWMutex
	debug        bool
}

func (p *plugin) client(ctx context.Context, session *alps.Session) (*caldav.Client, error) {
	if p.url == nil {
		return nil, fmt.Errorf("CalDAV upstream is not configured")
	}
	return newClient(p.url, session, p.debug)
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
	if cfg.Upstream == "" {
		// No upstream configured, disable plugin
		return nil, nil
	}
	u, err := alps.ParseUpstreamURL(cfg.Upstream)
	if err != nil {
		return nil, fmt.Errorf("failed to parse upstream CalDAV server: %v", err)
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

	srv.Logger().Printf("Configured upstream CalDAV server: %v", u)

	p := &plugin{
		GoPlugin:     alps.GoPlugin{Name: "caldav"},
		url:          u,
		homeSetCache: make(map[string]string),
		debug:        srv.Options.Debug,
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
