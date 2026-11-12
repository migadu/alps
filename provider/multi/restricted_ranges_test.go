package multi

import (
	"net"
	"testing"
)

func TestAutodiscoveryBlocksReservedPublicFetchRanges(t *testing.T) {
	for _, address := range []string{"192.0.0.8", "198.18.0.1", "198.19.255.255", "240.0.0.1", "::ffff:192.0.0.8", "::ffff:198.18.0.1", "::ffff:240.0.0.1"} {
		if !isRestrictedIP(net.ParseIP(address)) {
			t.Errorf("autodiscovery allowed reserved address %s", address)
		}
	}
}
