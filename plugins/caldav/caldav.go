package alpscaldav

import (
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/migadu/go-webdav/caldav"
)

type authRoundTripper struct {
	server      http.RoundTripper
	debug       bool
	debugWriter io.Writer
}

func (rt *authRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	if rt.debug && rt.debugWriter != nil {
		b, _ := httputil.DumpRequestOut(req, true)
		rt.debugWriter.Write(append([]byte("C: \n"), b...))
	}

	resp, err := rt.server.RoundTrip(req)

	if rt.debug && rt.debugWriter != nil && err == nil {
		b, _ := httputil.DumpResponse(resp, true)
		rt.debugWriter.Write(append([]byte("S: \n"), b...))
	}

	return resp, err
}

func newClient(u *url.URL, client *http.Client) (*caldav.Client, error) {
	return caldav.NewClient(client, u.String())
}
