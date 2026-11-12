package alpsbase

import (
	"errors"
	"net"
	"net/http"
	"time"

	"github.com/migadu/alps"
)

// The dial-time guard is shared with personal DAV connections: see
// alps.SafeDialControl. These endpoints fetch attacker-influenced URLs, so
// they must not be usable to reach loopback, private, link-local (cloud
// metadata), or other internal ranges (SSRF).
var (
	errBlockedAddress = alps.ErrBlockedAddress
	isDisallowedIP    = alps.IsDisallowedDialIP
	safeDialControl   = alps.SafeDialControl
)

// newSafeHTTPClient returns an http.Client for fetching attacker-influenced
// URLs: it blocks non-public destinations at dial time, bounds every phase
// with timeouts, and caps redirects (re-validating the scheme on each hop).
func newSafeHTTPClient(timeout time.Duration) *http.Client {
	dialer := &net.Dialer{
		Timeout: 10 * time.Second,
		Control: safeDialControl,
	}
	transport := &http.Transport{
		DialContext:           dialer.DialContext,
		TLSHandshakeTimeout:   10 * time.Second,
		ResponseHeaderTimeout: 15 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		DisableKeepAlives:     true,
	}
	return &http.Client{
		Timeout:   timeout,
		Transport: transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return errors.New("too many redirects")
			}
			if req.URL.Scheme != "http" && req.URL.Scheme != "https" {
				return errBlockedAddress
			}
			return nil
		},
	}
}
