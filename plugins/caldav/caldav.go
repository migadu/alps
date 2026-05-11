package alpscaldav

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"regexp"

	"github.com/emersion/go-webdav/caldav"
	"github.com/migadu/alps"
)

type authRoundTripper struct {
	upstream http.RoundTripper
	session  *alps.Session
	debug    bool
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

	resp, err := rt.upstream.RoundTrip(req)

	if rt.debug && err == nil {
		b, _ := httputil.DumpResponse(resp, true)
		os.Stdout.Write(append([]byte("S: \n"), b...))
		os.Stdout.Write([]byte("\n"))
	}

	return resp, err
}

func newClient(u *url.URL, session *alps.Session, debug bool) (*caldav.Client, error) {
	rt := authRoundTripper{
		upstream: http.DefaultTransport,
		session:  session,
		debug:    debug,
	}
	return caldav.NewClient(&http.Client{Transport: &rt}, u.String())
}
