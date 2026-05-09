package alpscarddav

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"sync"

	"github.com/emersion/go-webdav/carddav"
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
}

func (p *plugin) client(session *alps.Session) (*carddav.Client, error) {
	return newClient(p.url, session)
}

func (p *plugin) clientWithAddressBook(ctx context.Context, session *alps.Session) (*carddav.Client, *carddav.AddressBook, error) {
	c, err := newClient(p.url, session)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create CardDAV client: %v", err)
	}

	p.cacheMutex.RLock()
	homeSet, ok := p.homeSetCache[session.Username()]
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
		p.homeSetCache[session.Username()] = homeSet
		p.cacheMutex.Unlock()
	}

	addressBooks, err := c.FindAddressBooks(ctx, homeSet)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query CardDAV address books: %v", err)
	}
	if len(addressBooks) == 0 {
		return nil, nil, errNoAddressBook
	}
	return c, &addressBooks[0], nil
}

func newPlugin(srv *alps.Server) (alps.Plugin, error) {
	u, err := srv.Upstream("carddavs", "carddav+insecure", "https", "http+insecure")
	if _, ok := err.(*alps.NoUpstreamError); ok {
		return nil, nil
	} else if err != nil {
		return nil, fmt.Errorf("carddav: failed to parse upstream CardDAV server: %v", err)
	}
	switch u.Scheme {
	case "carddavs":
		u.Scheme = "https"
	case "carddav+insecure", "http+insecure":
		u.Scheme = "http"
	}
	if u.Scheme == "" {
		s, err := carddav.DiscoverContextURL(context.Background(), u.Host)
		if err != nil {
			srv.Logger().Printf("carddav: failed to discover CardDAV server: %v", err)
			return nil, nil
		}
		u, err = url.Parse(s)
		if err != nil {
			return nil, fmt.Errorf("carddav: Discover returned an invalid URL: %v", err)
		}
	}

	if err := sanityCheckURL(u); err != nil {
		return nil, fmt.Errorf("carddav: failed to connect to CardDAV server %q: %v", u, err)
	}

	srv.Logger().Printf("Configured upstream CardDAV server: %v", u)

	p := &plugin{
		GoPlugin:     alps.GoPlugin{Name: "carddav"},
		url:          u,
		homeSetCache: make(map[string]string),
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
