package alpscarddav

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"regexp"

	"github.com/emersion/go-webdav/carddav"
	"github.com/migadu/alps"
)

var errNoAddressBook = fmt.Errorf("carddav: no address book found")

type authRoundTripper struct {
	server  http.RoundTripper
	session *alps.Session
	debug   bool
}

func (rt *authRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	rt.session.SetHTTPBasicAuth(req)

	if rt.debug {
		b, _ := httputil.DumpRequestOut(req, true)
		bStr := string(b)
		bStr = regexp.MustCompile(`(?mi)^Authorization: .*`).ReplaceAllString(bStr, "Authorization: [REDACTED]\r")
		os.Stdout.Write(append([]byte("C: \n"), []byte(bStr)...))
		os.Stdout.Write([]byte("\n"))
	}

	resp, err := rt.server.RoundTrip(req)

	if rt.debug && err == nil {
		b, _ := httputil.DumpResponse(resp, true)
		os.Stdout.Write(append([]byte("S: \n"), b...))
		os.Stdout.Write([]byte("\n"))
	}

	return resp, err
}

func newClient(u *url.URL, session *alps.Session, debug bool) (*carddav.Client, error) {
	rt := authRoundTripper{
		server:  http.DefaultTransport,
		session: session,
		debug:   debug,
	}
	return carddav.NewClient(&http.Client{Transport: &rt}, u.String())
}
