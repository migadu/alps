package alpscarddav

import (
	"fmt"
	"net/http"
	"net/url"

	"git.sr.ht/~migadu/alps"
	alpsbase "git.sr.ht/~migadu/alps/plugins/base"
	"github.com/emersion/go-vcard"
	"github.com/emersion/go-webdav/carddav"
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

	// Servers might require authentication to perform an OPTIONS request
	if resp.StatusCode/100 != 2 && resp.StatusCode != http.StatusUnauthorized {
		return fmt.Errorf("HTTP request failed: %v %v", resp.StatusCode, resp.Status)
	}
	return nil
}

type plugin struct {
	alps.GoPlugin
	url          *url.URL
	homeSetCache map[string]string
}

func (p *plugin) client(session *alps.Session) (*carddav.Client, error) {
	return newClient(p.url, session)
}

func (p *plugin) clientWithAddressBook(session *alps.Session) (*carddav.Client, *carddav.AddressBook, error) {
	c, err := newClient(p.url, session)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create CardDAV client: %v", err)
	}

	homeSet, ok := p.homeSetCache[session.Username()]
	if !ok {
		principal, err := c.FindCurrentUserPrincipal()
		if err != nil {
			return nil, nil, fmt.Errorf("failed to query CardDAV principal: %v", err)
		}

		homeSet, err = c.FindAddressBookHomeSet(principal)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to query CardDAV address book home set: %v", err)
		}

		p.homeSetCache[session.Username()] = homeSet
		// TODO: evict entries from the cache if it's getting too big
	}

	addressBooks, err := c.FindAddressBooks(homeSet)
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
		s, err := carddav.Discover(u.Host)
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

	p.Inject("compose.html", func(ctx *alps.Context, _data alps.RenderData) error {
		data := _data.(*alpsbase.ComposeRenderData)

		c, addressBook, err := p.clientWithAddressBook(ctx.Session)
		if err == errNoAddressBook {
			return nil
		} else if err != nil {
			return err
		}

		query := carddav.AddressBookQuery{
			DataRequest: carddav.AddressDataRequest{
				Props: []string{vcard.FieldFormattedName, vcard.FieldEmail},
			},
			PropFilters: []carddav.PropFilter{{
				Name: vcard.FieldEmail,
			}},
		}
		addrs, err := c.QueryAddressBook(addressBook.Path, &query)
		if err != nil {
			return fmt.Errorf("failed to query CardDAV addresses: %v", err)
		}

		// TODO: cache the results
		emails := make([]string, 0, len(addrs))
		for _, addr := range addrs {
			cardEmails := addr.Card.Values(vcard.FieldEmail)
			emails = append(emails, cardEmails...)
		}

		data.Extra["EmailSuggestions"] = emails
		return nil
	})

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
