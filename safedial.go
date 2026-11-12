package alps

import (
	"errors"
	"net"
	"syscall"
)

// ErrBlockedAddress is returned when an outbound request for a URL that a
// user or a message chose (remote-content proxy, BIMI avatar, personal DAV
// server) resolves to a non-public address. Such requests must not be usable
// to reach loopback, private, link-local (cloud metadata), or other internal
// ranges (SSRF).
var ErrBlockedAddress = errors.New("destination address is not permitted")

// extraBlockedCIDRs covers ranges not classified by the net.IP helpers below
// but still unsafe as SSRF targets (carrier-grade NAT and reserved space).
var extraBlockedCIDRs = func() []*net.IPNet {
	var nets []*net.IPNet
	for _, cidr := range []string{
		"0.0.0.0/8",     // "this network"; Linux connects 0.0.0.0 to the local host
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

// IsDisallowedDialIP reports whether an IP must not be dialed on behalf of a
// URL that was not chosen by the administrator.
func IsDisallowedDialIP(ip net.IP) bool {
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

// SafeDialControl is a net.Dialer Control function. It runs after DNS
// resolution, on the concrete address that will be connected to. Validating
// the resolved IP here (rather than the URL host) defeats DNS rebinding and
// redirect-to-internal-IP tricks.
func SafeDialControl(network, address string, _ syscall.RawConn) error {
	if network != "tcp4" && network != "tcp6" && network != "tcp" {
		return ErrBlockedAddress
	}
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return err
	}
	if IsDisallowedDialIP(net.ParseIP(host)) {
		return ErrBlockedAddress
	}
	return nil
}
