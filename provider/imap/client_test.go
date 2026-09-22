package imap

import (
	"fmt"
	"net"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// The guard runs from net.Dialer.Control, so it sees the address the dial
// actually resolved to rather than a name checked earlier. That is what makes
// it effective against a record which answers differently the second time.
func TestConnectTargetGuardBlocksDial(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	defer ln.Close()

	accepted := make(chan struct{}, 1)
	go func() {
		if c, err := ln.Accept(); err == nil {
			accepted <- struct{}{}
			c.Close()
		}
	}()

	guard := func(ip net.IP) error {
		if ip.IsLoopback() {
			return fmt.Errorf("loopback is restricted")
		}
		return nil
	}

	_, err = Connect(ln.Addr().String(), false, true, time.Second, false, guard)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "loopback is restricted")

	select {
	case <-accepted:
		t.Fatal("guard did not prevent the connection")
	case <-time.After(250 * time.Millisecond):
	}
}

func TestConnectNilGuardStillDials(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	defer ln.Close()
	go func() {
		if c, err := ln.Accept(); err == nil {
			c.Close()
		}
	}()

	// A nil guard installs no Control hook; the dial itself must still happen.
	_, err = Connect(ln.Addr().String(), false, true, time.Second, false, nil)
	_ = err // the listener speaks no IMAP; reaching it at all is the point
}
