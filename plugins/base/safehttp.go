package alpsbase

import (
	"errors"
	"net"
	"net/http"
	"syscall"
	"time"
)

// errBlockedAddress is returned when an outbound fetch (remote-content proxy,
// BIMI avatar) resolves to a non-public address. These endpoints fetch
// attacker-influenced URLs, so they must not be usable to reach loopback,
// private, link-local (cloud metadata), or other internal ranges (SSRF).
var errBlockedAddress = errors.New("destination address is not permitted")

// extraBlockedCIDRs covers ranges not classified by the net.IP helpers below
// but still unsafe as SSRF targets (carrier-grade NAT and reserved space).
var extraBlockedCIDRs = func() []*net.IPNet {
	var nets []*net.IPNet
	for _, cidr := range []string{
		"100.64.0.0/10", // RFC 6598 carrier-grade NAT
		"192.0.0.0/24",  // IETF protocol assignments
		"198.18.0.0/15", // RFC 2544 benchmarking
		"240.0.0.0/4",   // reserved
	} {
		if _, n, err := net.ParseCIDR(cidr); err == nil {
			nets = append(nets, n)
		}
	}
	return nets
}()

// isDisallowedIP reports whether an IP must not be dialed by the safe client.
func isDisallowedIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	if ip.IsLoopback() || ip.IsPrivate() || ip.IsUnspecified() ||
		ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsMulticast() {
		return true
	}
	for _, n := range extraBlockedCIDRs {
		if n.Contains(ip) {
			return true
		}
	}
	return false
}

// safeDialControl runs after DNS resolution, on the concrete address that will
// be connected to. Validating the resolved IP here (rather than the URL host)
// defeats DNS rebinding and redirect-to-internal-IP tricks.
func safeDialControl(network, address string, _ syscall.RawConn) error {
	if network != "tcp4" && network != "tcp6" && network != "tcp" {
		return errBlockedAddress
	}
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return err
	}
	if isDisallowedIP(net.ParseIP(host)) {
		return errBlockedAddress
	}
	return nil
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
