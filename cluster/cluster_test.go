package cluster

import (
	"io"
	"log/slog"
	"testing"
	"time"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func TestLeaderElection_SingleNode(t *testing.T) {
	c, err := NewCluster(Config{
		NodeName: "alpha",
		BindAddr: "127.0.0.1",
		BindPort: 17946,
		Logger:   testLogger(),
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
		NodeName: "alpha",
		BindAddr: "127.0.0.1",
		BindPort: 17947,
		Logger:   testLogger(),
	})
	if err != nil {
		t.Fatalf("failed to create node1: %v", err)
	}
	defer c1.Shutdown()

	c2, err := NewCluster(Config{
		NodeName: "beta",
		BindAddr: "127.0.0.1",
		BindPort: 17948,
		Peers:    []string{"127.0.0.1:17947"},
		Logger:   testLogger(),
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
		NodeName: "alpha",
		BindAddr: "127.0.0.1",
		BindPort: 17949,
		Logger:   testLogger(),
	})
	if err != nil {
		t.Fatalf("failed to create node1: %v", err)
	}

	c2, err := NewCluster(Config{
		NodeName: "beta",
		BindAddr: "127.0.0.1",
		BindPort: 17950,
		Peers:    []string{"127.0.0.1:17949"},
		Logger:   testLogger(),
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
		NodeName: "health-test",
		BindAddr: "127.0.0.1",
		BindPort: 17951,
		Logger:   testLogger(),
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
