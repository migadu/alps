package koushincarddav

import (
	"fmt"
	"net/http"
	"net/url"

	"git.sr.ht/~emersion/koushin"
	"github.com/emersion/go-webdav/carddav"
)

var errNoAddressBook = fmt.Errorf("carddav: no address book found")

type authRoundTripper struct {
	upstream http.RoundTripper
	session  *koushin.Session
}

func (rt *authRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	rt.session.SetHTTPBasicAuth(req)
	return rt.upstream.RoundTrip(req)
}

func getAddressBook(u *url.URL, session *koushin.Session) (*carddav.Client, *carddav.AddressBook, error) {
	rt := authRoundTripper{
		upstream: http.DefaultTransport,
		session:  session,
	}
	c, err := carddav.NewClient(&http.Client{Transport: &rt}, u.String())
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create CardDAV client: %v", err)
	}

	principal, err := c.FindCurrentUserPrincipal()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query CardDAV principal: %v", err)
	}

	addressBookHomeSet, err := c.FindAddressBookHomeSet(principal)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query CardDAV address book home set: %v", err)
	}

	addressBooks, err := c.FindAddressBooks(addressBookHomeSet)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query CardDAV address books: %v", err)
	}
	if len(addressBooks) == 0 {
		return nil, nil, errNoAddressBook
	}
	return c, &addressBooks[0], nil
}
