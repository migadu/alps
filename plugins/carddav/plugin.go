package koushincarddav

import (
	"fmt"
	"net/http"
	"net/url"

	"git.sr.ht/~emersion/koushin"
	koushinbase "git.sr.ht/~emersion/koushin/plugins/base"
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

type authRoundTripper struct {
	upstream http.RoundTripper
	session  *koushin.Session
}

func (rt *authRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	rt.session.SetHTTPBasicAuth(req)
	return rt.upstream.RoundTrip(req)
}

func newPlugin(srv *koushin.Server) (koushin.Plugin, error) {
	u, err := srv.Upstream("carddavs", "carddav+insecure", "https", "http+insecure")
	if _, ok := err.(*koushin.NoUpstreamError); ok {
		srv.Logger().Print("carddav: no upstream server provided")
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

	p := koushin.GoPlugin{Name: "carddav"}

	p.Inject("compose.html", func(ctx *koushin.Context, _data koushin.RenderData) error {
		data := _data.(*koushinbase.ComposeRenderData)

		rt := authRoundTripper{
			upstream: http.DefaultTransport,
			session:  ctx.Session,
		}
		c, err := carddav.NewClient(&http.Client{Transport: &rt}, u.String())
		if err != nil {
			return fmt.Errorf("failed to create CardDAV client: %v", err)
		}

		principal, err := c.FindCurrentUserPrincipal()
		if err != nil {
			return fmt.Errorf("failed to query CardDAV principal: %v", err)
		}

		addressBookHomeSet, err := c.FindAddressBookHomeSet(principal)
		if err != nil {
			return fmt.Errorf("failed to query CardDAV address book home set: %v", err)
		}

		addressBooks, err := c.FindAddressBooks(addressBookHomeSet)
		if err != nil {
			return fmt.Errorf("failed to query CardDAV address books: %v", err)
		}
		if len(addressBooks) == 0 {
			return nil
		}
		addressBook := addressBooks[0]

		query := carddav.AddressBookQuery{
			DataRequest: carddav.AddressDataRequest{
				Props: []string{vcard.FieldFormattedName, vcard.FieldEmail},
			},
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
	koushin.RegisterPluginLoader(func(s *koushin.Server) ([]koushin.Plugin, error) {
		p, err := newPlugin(s)
		if err != nil {
			return nil, err
		}
		if p == nil {
			return nil, nil
		}
		return []koushin.Plugin{p}, err
	})
}
