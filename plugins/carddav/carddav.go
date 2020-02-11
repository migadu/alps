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

func newClient(u *url.URL, session *koushin.Session) (*carddav.Client, error) {
	rt := authRoundTripper{
		upstream: http.DefaultTransport,
		session:  session,
	}
	return carddav.NewClient(&http.Client{Transport: &rt}, u.String())
}
