package alpscaldav

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"regexp"

	"github.com/emersion/go-webdav/caldav"
)

type authRoundTripper struct {
	server http.RoundTripper
	debug  bool
}

func (rt *authRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
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

func newClient(u *url.URL, client *http.Client) (*caldav.Client, error) {
	return caldav.NewClient(client, u.String())
}
