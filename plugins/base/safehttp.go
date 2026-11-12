package alpsbase

import (
	"errors"
	"net"
	"net/http"
	"syscall"
	"time"

	"github.com/migadu/alps/internal/netguard"
)

// Keep the fetch helpers and error identity stable for their callers.
var errBlockedAddress = netguard.ErrBlockedAddress

func isDisallowedIP(ip net.IP) bool { return netguard.IsDisallowedIP(ip) }

func safeDialControl(network, address string, conn syscall.RawConn) error {
	return netguard.PublicDialControl(network, address, conn)
}

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
