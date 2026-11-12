package multi

import (
	"context"
	"encoding/binary"
	"errors"
	"net"
	"sync/atomic"
	"syscall"
	"testing"
	"time"

	"github.com/migadu/alps/internal/netguard"
)

// Preflight DNS and the dial resolve separately. A name that answered with a
// public IP during preflight must still be blocked when it rebinds to loopback.
func TestAutodiscoveryDialRechecksReboundDNSAddress(t *testing.T) {
	dns, err := net.ListenPacket("udp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer dns.Close()
	var rebound atomic.Bool
	go func() {
		buffer := make([]byte, 4096)
		for {
			n, peer, err := dns.ReadFrom(buffer)
			if err != nil {
				return
			}
			query := buffer[:n]
			if n < 12 {
				continue
			}
			end := 12
			for end < n && query[end] != 0 {
				end += int(query[end]) + 1
			}
			end += 5 // terminating label, question type and class
			if end > n {
				continue
			}
			kind := binary.BigEndian.Uint16(query[end-4 : end-2])
			answer := append([]byte(nil), query[:end]...)
			binary.BigEndian.PutUint16(answer[2:4], 0x8180)
			binary.BigEndian.PutUint16(answer[6:8], 0)
			binary.BigEndian.PutUint16(answer[8:10], 0)
			binary.BigEndian.PutUint16(answer[10:12], 0)
			if kind == 1 {
				binary.BigEndian.PutUint16(answer[6:8], 1)
				ip := []byte{93, 184, 216, 34}
				if rebound.Load() {
					ip = []byte{127, 0, 0, 1}
				}
				answer = append(answer, 0xc0, 0x0c, 0, 1, 0, 1, 0, 0, 0, 0, 0, 4)
				answer = append(answer, ip...)
			}
			dns.WriteTo(answer, peer)
		}
	}()
	resolver := &net.Resolver{PreferGo: true, Dial: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "udp", dns.LocalAddr().String())
	}}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := checkRestrictedHost(ctx, resolver, "rebound.example"); err != nil {
		t.Fatalf("public preflight failed: %v", err)
	}
	rebound.Store(true)
	dialer := net.Dialer{Resolver: resolver, Timeout: time.Second, Control: func(network, address string, conn syscall.RawConn) error {
		if err := netguard.PublicDialControl(network, address, conn); err != nil {
			return err
		}
		// Never contact the test's public preflight address even if DNS caches it.
		return errors.New("guard accepted the target after DNS rebinding")
	}}
	conn, err := dialer.DialContext(ctx, "tcp", "rebound.example:443")
	if conn != nil {
		conn.Close()
	}
	if !errors.Is(err, netguard.ErrBlockedAddress) {
		t.Fatalf("rebound dial returned %v; want blocked-address error", err)
	}
}
