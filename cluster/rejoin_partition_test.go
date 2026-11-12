package cluster

import (
	"fmt"
	"testing"
	"time"
)

func TestTryRejoinHealsTwoNonSingletonPartitions(t *testing.T) {
	nodes := make([]*Cluster, 4)
	for i := range nodes {
		c, err := NewCluster(Config{NodeName: fmt.Sprintf("partition-%d", i), BindAddr: "127.0.0.1", BindPort: 0, AllowInsecure: true, Logger: testLogger()})
		if err != nil {
			t.Fatal(err)
		}
		nodes[i] = c
		t.Cleanup(func() { c.Shutdown() })
	}
	for _, pair := range [][2]int{{0, 1}, {2, 3}} {
		if _, err := nodes[pair[0]].ml.Join([]string{nodes[pair[1]].ml.LocalNode().Address()}); err != nil {
			t.Fatal(err)
		}
	}
	if nodes[0].NumMembers() != 2 || nodes[2].NumMembers() != 2 {
		t.Fatal("did not establish two disjoint multi-node partitions")
	}
	nodes[0].tryRejoin([]string{nodes[0].ml.LocalNode().Address(), nodes[1].ml.LocalNode().Address(), nodes[2].ml.LocalNode().Address()})
	if nodes[0].NumMembers() != 4 {
		t.Fatalf("configured peer rejoin left %d members, want4", nodes[0].NumMembers())
	}
	deadline := time.Now().Add(4 * time.Second)
	for time.Now().Before(deadline) {
		converged := true
		for _, c := range nodes {
			if c.NumMembers() != 4 {
				converged = false
			}
		}
		if converged {
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	for _, c := range nodes {
		if c.NumMembers() != 4 {
			t.Errorf("%s sees%d members", c.LocalNodeName(), c.NumMembers())
		}
	}
}
