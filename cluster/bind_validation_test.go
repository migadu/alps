package cluster

import (
	"strings"
	"testing"
)

func TestClusterRejectsNonIPBindAddressBeforeListening(t *testing.T) {
	for _, addr := range []string{"localhost", "eth0", "fd00:", "[fd00::1]"} {
		t.Run(addr, func(t *testing.T) {
			c, err := NewCluster(Config{NodeName: "bad-bind", BindAddr: addr, BindPort: 0, AllowInsecure: true, Logger: testLogger()})
			if c != nil {
				c.Shutdown()
			}
			if err == nil || !strings.Contains(err.Error(), "bind address") || !strings.Contains(err.Error(), "IP") {
				t.Fatalf("want IP bind validation; got%v", err)
			}
		})
	}
}
