package cluster

import (
	"testing"

	sockaddr "github.com/hashicorp/go-sockaddr"
)

// A node bound to every interface must still advertise an address its peers
// can reach. memberlist picks the host's private address only for "0.0.0.0",
// so a node bound to "::" advertised "::" itself.
func TestClusterBoundToEveryInterfaceAdvertisesItsPrivateAddress(t *testing.T) {
	private, err := sockaddr.GetPrivateIP()
	if err != nil || private == "" {
		t.Skip("this host has no private IPv4 address to advertise")
	}
	for _, addr := range []string{"0.0.0.0", "::"} {
		t.Run(addr, func(t *testing.T) {
			c, err := NewCluster(Config{NodeName: "every-interface", BindAddr: addr, BindPort: 0, AllowInsecure: true, Logger: testLogger()})
			if err != nil {
				t.Fatalf("start with bind %q: %v", addr, err)
			}
			defer c.Shutdown()
			if got := c.ml.LocalNode().Addr; got.IsUnspecified() || got.String() != private {
				t.Fatalf("bind %q advertises %s; want the private address %s", addr, got, private)
			}
		})
	}
}
