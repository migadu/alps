package cluster

import (
	"net"
	"strconv"
	"strings"
	"testing"

	sockaddr "github.com/hashicorp/go-sockaddr"
)

func privateAddrs(t *testing.T, addrs ...string) sockaddr.IfAddrs {
	t.Helper()
	var out sockaddr.IfAddrs
	for _, a := range addrs {
		sa, err := sockaddr.NewIPAddr(a)
		if err != nil {
			t.Fatal(err)
		}
		out = append(out, sockaddr.IfAddr{SockAddr: sa})
	}
	return out
}

// A node bound to "::" advertises an address in a family its listeners serve.
// Where a listener on "::" does not accept IPv4, as on OpenBSD and DragonFly,
// only an IPv6 address will do, and without one startup must say so.
func TestIPv6WildcardAdvertisesAnAddressItsListenersServe(t *testing.T) {
	both := privateAddrs(t, "192.168.1.60", "fd00::5")
	for _, tc := range []struct {
		name       string
		servesIPv4 bool
		private    sockaddr.IfAddrs
		want       string
		wantErr    string
	}{
		{"dual stack takes the first private address", true, both, "192.168.1.60", ""},
		{"dual stack takes an IPv6 address when it is the only one", true, privateAddrs(t, "fd00::5"), "fd00::5", ""},
		{"IPv6 only skips the IPv4 address", false, both, "fd00::5", ""},
		{"IPv6 only without a private IPv6 address", false, privateAddrs(t, "192.168.1.60"), "", "no private IPv6 address"},
		{"no private address at all", true, nil, "", "no private address"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got, err := ipv6WildcardAdvertiseAddr(tc.servesIPv4, tc.private)
			if tc.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tc.wantErr) {
					t.Fatalf("got %q, %v; want an error saying %q", got, err, tc.wantErr)
				}
				return
			}
			if err != nil || got != tc.want {
				t.Fatalf("got %q, %v; want %q", got, err, tc.want)
			}
		})
	}
}

// A node bound to "::" must be reachable at the address it advertises: over
// TCP, which a join's push/pull uses, and over UDP, which probes use. A peer
// that cannot reach it there marks it dead.
func TestClusterBoundToIPv6WildcardIsReachableAtItsAdvertisedAddress(t *testing.T) {
	start := func(name string) *Cluster {
		t.Helper()
		c, err := NewCluster(Config{NodeName: name, BindAddr: "::", BindPort: 0, AllowInsecure: true, Logger: testLogger()})
		if err != nil {
			if strings.Contains(err.Error(), "no private") {
				t.Skipf("this host has no address to advertise for ::: %v", err)
			}
			t.Fatalf("start %s: %v", name, err)
		}
		t.Cleanup(func() { c.Shutdown() })
		return c
	}
	a, b := start("wildcard-a"), start("wildcard-b")
	self := a.ml.LocalNode()
	if self.Addr.IsUnspecified() {
		t.Fatalf("advertises the unspecified address %s", self.Addr)
	}
	advertised := net.JoinHostPort(self.Addr.String(), strconv.Itoa(int(self.Port)))
	if _, err := b.ml.Join([]string{advertised}); err != nil {
		t.Fatalf("join %s over TCP: %v", advertised, err)
	}
	if _, err := b.ml.Ping(self.Name, &net.UDPAddr{IP: self.Addr, Port: int(self.Port)}); err != nil {
		t.Fatalf("ping %s over UDP: %v", advertised, err)
	}
}
