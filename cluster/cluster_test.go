package cluster

import (
	"fmt"
	"io"
	"log/slog"
	"strings"
	"sync"
	"testing"
	"time"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

// TestNewCluster_RejectsKeylessWithoutOptIn verifies that a cluster refuses to
// start with unencrypted gossip unless the operator explicitly opts in, and that
// AllowInsecure permits it.
func TestNewCluster_RejectsKeylessWithoutOptIn(t *testing.T) {
	_, err := NewCluster(Config{
		NodeName: "insecure-default",
		BindAddr: "127.0.0.1",
		BindPort: 17960,
		Logger:   testLogger(),
	})
	if err == nil {
		t.Fatal("expected NewCluster to reject keyless mode without AllowInsecure")
	}

	c, err := NewCluster(Config{
		NodeName:      "insecure-optin",
		BindAddr:      "127.0.0.1",
		BindPort:      17961,
		AllowInsecure: true,
		Logger:        testLogger(),
	})
	if err != nil {
		t.Fatalf("AllowInsecure should permit keyless mode: %v", err)
	}
	c.Shutdown()
}

func TestLeaderElection_SingleNode(t *testing.T) {
	c, err := NewCluster(Config{
		NodeName:      "alpha",
		BindAddr:      "127.0.0.1",
		BindPort:      17946,
		AllowInsecure: true,
		Logger:        testLogger(),
	})
	if err != nil {
		t.Fatalf("failed to create cluster: %v", err)
	}
	defer c.Shutdown()

	// Single node should always be leader
	if !c.IsLeader() {
		t.Error("single node should be leader")
	}
	if c.GetLeader() != "alpha" {
		t.Errorf("leader should be 'alpha', got '%s'", c.GetLeader())
	}
	if c.NumMembers() != 1 {
		t.Errorf("expected 1 member, got %d", c.NumMembers())
	}
}

func TestLeaderElection_TwoNodes(t *testing.T) {
	// Node "alpha" should become leader (lexicographically smallest)
	c1, err := NewCluster(Config{
		NodeName:      "alpha",
		BindAddr:      "127.0.0.1",
		BindPort:      17947,
		AllowInsecure: true,
		Logger:        testLogger(),
	})
	if err != nil {
		t.Fatalf("failed to create node1: %v", err)
	}
	defer c1.Shutdown()

	c2, err := NewCluster(Config{
		NodeName:      "beta",
		BindAddr:      "127.0.0.1",
		BindPort:      17948,
		Peers:         []string{"127.0.0.1:17947"},
		AllowInsecure: true,
		Logger:        testLogger(),
	})
	if err != nil {
		t.Fatalf("failed to create node2: %v", err)
	}
	defer c2.Shutdown()

	// Wait for membership convergence
	time.Sleep(500 * time.Millisecond)

	// Both should agree "alpha" is leader
	if c1.GetLeader() != "alpha" {
		t.Errorf("node1: leader should be 'alpha', got '%s'", c1.GetLeader())
	}
	if c2.GetLeader() != "alpha" {
		t.Errorf("node2: leader should be 'alpha', got '%s'", c2.GetLeader())
	}

	// alpha is leader, beta is not
	if !c1.IsLeader() {
		t.Error("alpha should be leader")
	}
	if c2.IsLeader() {
		t.Error("beta should not be leader")
	}

	// Both should see 2 members
	if c1.NumMembers() != 2 {
		t.Errorf("node1: expected 2 members, got %d", c1.NumMembers())
	}
}

func TestLeaderElection_Failover(t *testing.T) {
	c1, err := NewCluster(Config{
		NodeName:      "alpha",
		BindAddr:      "127.0.0.1",
		BindPort:      17949,
		AllowInsecure: true,
		Logger:        testLogger(),
	})
	if err != nil {
		t.Fatalf("failed to create node1: %v", err)
	}

	c2, err := NewCluster(Config{
		NodeName:      "beta",
		BindAddr:      "127.0.0.1",
		BindPort:      17950,
		Peers:         []string{"127.0.0.1:17949"},
		AllowInsecure: true,
		Logger:        testLogger(),
	})
	if err != nil {
		t.Fatalf("failed to create node2: %v", err)
	}
	defer c2.Shutdown()

	time.Sleep(500 * time.Millisecond)

	// alpha is leader
	if !c1.IsLeader() {
		t.Fatal("alpha should be leader initially")
	}

	// Shut down alpha (current leader)
	c1.Shutdown()

	// Wait for failure detection and leader update
	time.Sleep(3 * time.Second)

	// beta should now be leader
	if !c2.IsLeader() {
		t.Errorf("beta should become leader after alpha leaves, leader=%s", c2.GetLeader())
	}
}

func TestHealthStatus(t *testing.T) {
	c, err := NewCluster(Config{
		NodeName:      "health-test",
		BindAddr:      "127.0.0.1",
		BindPort:      17951,
		AllowInsecure: true,
		Logger:        testLogger(),
	})
	if err != nil {
		t.Fatalf("failed to create cluster: %v", err)
	}
	defer c.Shutdown()

	status := c.HealthStatus()
	if status["node_name"] != "health-test" {
		t.Errorf("expected node_name 'health-test', got '%v'", status["node_name"])
	}
	if status["is_leader"] != true {
		t.Error("single node should be leader")
	}
	if status["alive_members"] != 1 {
		t.Errorf("expected 1 alive member, got %v", status["alive_members"])
	}
}

func TestDecodeSecretKey(t *testing.T) {
	// Valid 32-byte key encoded as base64
	validKey := "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
	key, err := DecodeSecretKey(validKey)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(key) != 32 {
		t.Errorf("expected 32 bytes, got %d", len(key))
	}

	// Invalid base64
	_, err = DecodeSecretKey("not-valid-base64!!!")
	if err == nil {
		t.Error("expected error for invalid base64")
	}

	// Wrong length
	_, err = DecodeSecretKey("dGVzdA==") // "test" = 4 bytes
	if err == nil {
		t.Error("expected error for wrong key length")
	}
}

// memberlist's Delegate contract requires NotifyMsg not to block the UDP
// receive loop, and warns that the byte slice may be reused after the call
// returns. Both matter here: the only handler takes the rate limiter's mutex,
// which every login check also holds.
func TestNotifyMsg_DoesNotBlockAndCopies(t *testing.T) {
	c := &Cluster{}

	release := make(chan struct{})
	got := make(chan []byte, 1)
	c.SetMessageHandler(func(msg []byte) {
		<-release // a handler that blocks, as the real one can under lock contention
		got <- msg
	})

	data := []byte("hello")
	done := make(chan struct{})
	go func() {
		c.NotifyMsg(data)
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("NotifyMsg blocked on the handler; the UDP receive loop would stall")
	}

	// memberlist is free to reuse the buffer the moment NotifyMsg returns.
	for i := range data {
		data[i] = 'x'
	}
	close(release)

	select {
	case msg := <-got:
		if string(msg) != "hello" {
			t.Fatalf("handler saw %q — the buffer was not copied", msg)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("handler never ran")
	}
}

// Every node counts every rate-limit event, so a node that never hears one
// lets the guesses it stands for be made again through it. The gossip queue
// sends a broadcast RetransmitMult*ceil(log10(N+1)) times, which from five
// nodes up (3 sends for 5 to 9 nodes) is fewer than there are peers, and a
// peer does not pass a user message on: every broadcast missed a peer.
//
// The sender's own handler must not see it either: the node has counted its
// own attempt already, and would count it twice.
func TestBroadcast_ReachesEveryOtherMember(t *testing.T) {
	const n = 5
	const port = 17980
	var mu sync.Mutex
	got := make([]map[string]int, n)
	nodes := make([]*Cluster, n)
	for i := range nodes {
		var peers []string
		if i > 0 {
			peers = []string{fmt.Sprintf("127.0.0.1:%d", port)}
		}
		c, err := NewCluster(Config{
			NodeName:      fmt.Sprintf("node%d", i),
			BindAddr:      "127.0.0.1",
			BindPort:      port + i,
			Peers:         peers,
			AllowInsecure: true,
			Logger:        testLogger(),
		})
		if err != nil {
			t.Fatalf("failed to create node%d: %v", i, err)
		}
		defer c.Shutdown()
		got[i] = map[string]int{}
		c.SetMessageHandler(func(msg []byte) {
			mu.Lock()
			got[i][string(msg)]++
			mu.Unlock()
		})
		nodes[i] = c
	}

	deadline := time.Now().Add(5 * time.Second)
	for _, c := range nodes {
		for c.NumMembers() != n && time.Now().Before(deadline) {
			time.Sleep(50 * time.Millisecond)
		}
		if c.NumMembers() != n {
			t.Fatalf("%s sees %d members, want %d", c.LocalNodeName(), c.NumMembers(), n)
		}
	}

	const events = 10
	for k := 0; k < events; k++ {
		nodes[0].Broadcast([]byte(fmt.Sprintf("event %d", k)))
	}

	missing := func() []string {
		mu.Lock()
		defer mu.Unlock()
		var out []string
		for i := 1; i < n; i++ {
			if len(got[i]) != events {
				out = append(out, fmt.Sprintf("node%d heard %d of %d", i, len(got[i]), events))
			}
		}
		return out
	}
	deadline = time.Now().Add(3 * time.Second)
	for len(missing()) > 0 && time.Now().Before(deadline) {
		time.Sleep(50 * time.Millisecond)
	}
	if m := missing(); len(m) > 0 {
		t.Errorf("broadcasts missed peers: %s", strings.Join(m, ", "))
	}
	mu.Lock()
	defer mu.Unlock()
	if len(got[0]) != 0 {
		t.Errorf("the sender heard its own broadcasts: %v", got[0])
	}
}
