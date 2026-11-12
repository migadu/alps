package cluster

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"net"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"
)

// lockedBuffer collects a node's log; memberlist logs from its own goroutines.
type lockedBuffer struct {
	mu  sync.Mutex
	buf bytes.Buffer
}

func (b *lockedBuffer) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.Write(p)
}

func (b *lockedBuffer) String() string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.String()
}

func debugLogger(w *lockedBuffer) *slog.Logger {
	return slog.New(slog.NewTextHandler(w, &slog.HandlerOptions{Level: slog.LevelDebug}))
}

// joinedPair starts two loopback nodes and joins them. a logs into the
// returned buffer at debug level.
func joinedPair(t *testing.T) (a, b *Cluster, log *lockedBuffer) {
	t.Helper()
	log = &lockedBuffer{}
	var err error
	a, err = NewCluster(Config{NodeName: "forms-a", BindAddr: "127.0.0.1", BindPort: 0, AllowInsecure: true, Logger: debugLogger(log)})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { a.Shutdown() })
	b, err = NewCluster(Config{NodeName: "forms-b", BindAddr: "127.0.0.1", BindPort: 0, AllowInsecure: true, Logger: testLogger()})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { b.Shutdown() })
	if _, err := a.ml.Join([]string{b.ml.LocalNode().Address()}); err != nil {
		t.Fatal(err)
	}
	if a.NumMembers() != 2 {
		t.Fatalf("a sees %d members after the join, want 2", a.NumMembers())
	}
	return a, b, log
}

func TestMissingPeersSkipsOnlyLiteralMemberAddresses(t *testing.T) {
	a, b, _ := joinedPair(t)
	portB := strconv.Itoa(int(b.ml.LocalNode().Port))
	// In production every node uses the same gossip port, which is what a peer
	// without a port gets. Give a's default b's port to stand for that.
	a.peerPort = int(b.ml.LocalNode().Port)

	present := []string{
		"127.0.0.1:" + portB,          // the form memberlist reports
		"127.0.0.1",                   // no port: the bind port is used
		"forms-b/127.0.0.1:" + portB,  // memberlist's optional node name prefix
		"127.0.0.1:0" + portB,         // a port with a leading zero
		"[::ffff:127.0.0.1]:" + portB, // the same IPv4 address, IPv6-mapped
	}
	for _, peer := range present {
		if missing := a.missingPeers([]string{peer}); len(missing) != 0 {
			t.Errorf("peer %q is b, a member, but is reported missing", peer)
		}
	}

	absent := []string{
		"127.0.0.1:1",                // nobody's port
		"127.0.0.9:" + portB,         // a literal address belonging to no member
		"127.0.0.1:99999",            // not a port
		"localhost:" + portB,         // even a known hostname can discover new nodes
		"localhost",                  // a hostname without a port
		"forms-b/localhost:" + portB, // a hostname with memberlist's node name prefix
	}
	for _, peer := range absent {
		if missing := a.missingPeers([]string{peer}); len(missing) != 1 || missing[0] != peer {
			t.Errorf("peer %q needs a join attempt, missingPeers = %q", peer, missing)
		}
	}

	if missing := a.missingPeers([]string{"", "127.0.0.1:1", "127.0.0.1:1"}); len(missing) != 1 {
		t.Errorf("empty and repeated peers: missingPeers = %q, want one", missing)
	}
}

// localhost is a real DNS seed for two distinct nodes on hosts that provide
// both loopbacks. Capability checks may skip the test; once they pass, every
// failure to start or discover a node is a test failure.
func TestTryRejoinDiscoversEveryNodeBehindDNSSeed(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	ips, err := net.DefaultResolver.LookupIP(ctx, "ip", "localhost")
	if err != nil {
		t.Skipf("localhost lookup unavailable: %v", err)
	}
	var ipv4, ipv6 bool
	for _, ip := range ips {
		ipv4 = ipv4 || ip.Equal(net.ParseIP("127.0.0.1"))
		ipv6 = ipv6 || ip.Equal(net.ParseIP("::1"))
	}
	if !ipv4 || !ipv6 {
		t.Skipf("localhost must resolve to both loopbacks, got %v", ips)
	}
	tcp, err := net.Listen("tcp6", "[::1]:0")
	if err != nil {
		t.Skipf("IPv6 TCP loopback unavailable: %v", err)
	}
	tcp.Close()
	udp, err := net.ListenPacket("udp6", "[::1]:0")
	if err != nil {
		t.Skipf("IPv6 UDP loopback unavailable: %v", err)
	}
	udp.Close()

	a, err := NewCluster(Config{NodeName: "dns-a", BindAddr: "127.0.0.1", BindPort: 0, AllowInsecure: true, Logger: testLogger()})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { a.Shutdown() })
	b, err := NewCluster(Config{NodeName: "dns-b", BindAddr: "::1", BindPort: int(a.ml.LocalNode().Port), AllowInsecure: true, Logger: testLogger()})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { b.Shutdown() })
	peer := net.JoinHostPort("localhost", strconv.Itoa(int(a.ml.LocalNode().Port)))
	a.tryRejoin([]string{peer})
	if a.NumMembers() != 2 {
		t.Errorf("rejoin left %d members, want 2", a.NumMembers())
	}
	// Prove that memberlist can resolve the same seed and reach both nodes.
	if _, err := a.ml.Join([]string{peer}); err != nil {
		t.Fatal(err)
	}
	if a.NumMembers() != 2 {
		t.Fatalf("direct Join left %d members, want 2", a.NumMembers())
	}
}

// A hostname remains a discovery seed even when it reaches a known member.
// A join that adds no members is routine and must not produce an info log.
func TestTryRejoinChecksHostNamesWithoutLoggingMembershipGrowth(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	ips, err := net.DefaultResolver.LookupIP(ctx, "ip", "localhost")
	if err != nil {
		t.Skipf("localhost lookup unavailable: %v", err)
	}
	var ipv4 bool
	for _, ip := range ips {
		ipv4 = ipv4 || ip.Equal(net.ParseIP("127.0.0.1"))
	}
	if !ipv4 {
		t.Skipf("localhost must resolve to the IPv4 loopback, got %v", ips)
	}
	a, b, log := joinedPair(t)
	portB := strconv.Itoa(int(b.ml.LocalNode().Port))

	for i := 0; i < 3; i++ {
		a.tryRejoin([]string{"localhost:" + portB})
	}
	if strings.Contains(log.String(), "cluster rejoined peers") {
		t.Errorf("a join that added no members was logged as a rejoin:\n%s", log.String())
	}
	if !strings.Contains(log.String(), "cluster rejoin found no new members") {
		t.Errorf("a known hostname was not checked for new members:\n%s", log.String())
	}
	if a.NumMembers() != 2 {
		t.Errorf("a sees %d members, want 2", a.NumMembers())
	}
}

// A join that reaches only nodes already in the cluster is routine. It must
// not log "cluster rejoined peers", which reads as a healed partition.
func TestTryRejoinLogsRejoinedOnlyWhenMembershipGrows(t *testing.T) {
	// b listens on every interface and advertises its private address, so it
	// answers on 127.0.0.1, an address that is not its member address.
	b, err := NewCluster(Config{NodeName: "growth-b", BindAddr: "0.0.0.0", BindPort: 0, AllowInsecure: true, Logger: testLogger()})
	if err != nil {
		t.Skipf("needs a host with a private address: %v", err)
	}
	t.Cleanup(func() { b.Shutdown() })
	if net.ParseIP(b.ml.LocalNode().Addr.String()).IsLoopback() {
		t.Skip("b advertises a loopback address")
	}
	log := &lockedBuffer{}
	a, err := NewCluster(Config{NodeName: "growth-a", BindAddr: "127.0.0.1", BindPort: 0, AllowInsecure: true, Logger: debugLogger(log)})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { a.Shutdown() })
	viaLoopback := fmt.Sprintf("127.0.0.1:%d", b.ml.LocalNode().Port)

	a.tryRejoin([]string{viaLoopback})
	if a.NumMembers() != 2 {
		t.Fatalf("first join left %d members, want 2", a.NumMembers())
	}
	if !strings.Contains(log.String(), "cluster rejoined peers") {
		t.Fatalf("a join that added b was not logged:\n%s", log.String())
	}

	before := strings.Count(log.String(), "cluster rejoined peers")
	a.tryRejoin([]string{viaLoopback})
	if a.NumMembers() != 2 {
		t.Fatalf("second join left %d members, want 2", a.NumMembers())
	}
	if after := strings.Count(log.String(), "cluster rejoined peers"); after != before {
		t.Errorf("a join that added no one was logged as a rejoin:\n%s", log.String())
	}
	if !strings.Contains(log.String(), "cluster rejoin found no new members") {
		t.Errorf("the join that added no one left no debug line:\n%s", log.String())
	}
}
