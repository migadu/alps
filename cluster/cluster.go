// Package cluster provides gossip-based cluster membership and leader election
// using HashiCorp's memberlist library. The leader is determined deterministically
// by lexicographic ordering of node names — the node with the smallest name is leader.
//
// This is used primarily for TLS certificate management: only the leader node
// is allowed to request new certificates from Let's Encrypt, preventing race
// conditions and rate limit exhaustion across multiple instances.
package cluster

import (
	"encoding/base64"
	"fmt"
	"io"
	"log/slog"
	"net"
	"sort"
	"sync"
	"time"

	"github.com/hashicorp/memberlist"
)

// Cluster manages memberlist-based cluster membership and leader election.
type Cluster struct {
	ml     *memberlist.Memberlist
	logger *slog.Logger

	// Leader election
	leader    string
	leaderMtx sync.RWMutex

	// Messaging
	broadcasts *memberlist.TransmitLimitedQueue
	msgHandler func(msg []byte)
	msgMtx     sync.RWMutex

	// Lifecycle
	done         chan struct{}
	shutdownOnce sync.Once
}

// Config holds configuration for creating a cluster.
type Config struct {
	NodeName      string   // This node's name (defaults to hostname, determines leader order)
	BindAddr      string   // Address to bind to (e.g., "0.0.0.0")
	BindPort      int      // Port to bind to for memberlist (default: 7946)
	Peers         []string // Other cluster nodes to connect to (e.g., ["node1:7946", "node2:7946"])
	SecretKey     []byte   // 32-byte encryption key for gossip protocol (AES-256)
	AllowInsecure bool     // Permit running without a SecretKey (unencrypted, unauthenticated gossip)
	Logger        *slog.Logger
}

// NewCluster creates a new cluster instance with memberlist and leader election.
func NewCluster(cfg Config) (*Cluster, error) {
	if cfg.Logger == nil {
		cfg.Logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}

	cluster := &Cluster{
		logger: cfg.Logger,
		done:   make(chan struct{}),
	}

	// Create memberlist configuration
	mlConfig := memberlist.DefaultLANConfig()

	if cfg.NodeName != "" {
		mlConfig.Name = cfg.NodeName
	}
	if cfg.BindAddr != "" {
		mlConfig.BindAddr = cfg.BindAddr
	}
	if cfg.BindPort > 0 {
		mlConfig.BindPort = cfg.BindPort
	}

	// Advertise a concrete address to peers only when we bind to a specific IP.
	// Binding to 0.0.0.0 / :: (or empty) means "all interfaces"; advertising that
	// literally makes peers try to reach us at an unspecified address and mark us
	// suspect/dead, so membership never forms. Leaving AdvertiseAddr empty lets
	// memberlist auto-detect a routable private IP. A hostname (ParseIP == nil)
	// is likewise left to auto-detection since AdvertiseAddr expects an IP.
	if ip := net.ParseIP(cfg.BindAddr); ip != nil && !ip.IsUnspecified() {
		mlConfig.AdvertiseAddr = cfg.BindAddr
	}
	if cfg.BindPort > 0 {
		mlConfig.AdvertisePort = cfg.BindPort
	}

	// Enable gossip encryption if secret key is provided. Both cluster consumers
	// (rate-limit events, leader election for cert issuance) are security
	// sensitive, so refuse to run unencrypted/unauthenticated unless the operator
	// explicitly opted in.
	if len(cfg.SecretKey) > 0 {
		if len(cfg.SecretKey) != 32 {
			return nil, fmt.Errorf("secret key must be exactly 32 bytes, got %d", len(cfg.SecretKey))
		}
		mlConfig.SecretKey = cfg.SecretKey
		mlConfig.GossipVerifyIncoming = true
		mlConfig.GossipVerifyOutgoing = true
		cfg.Logger.Info("gossip encryption enabled (AES-256)")
	} else if !cfg.AllowInsecure {
		return nil, fmt.Errorf("cluster secret_key is required: without it gossip is unencrypted and unauthenticated, allowing forged rate-limit events (arbitrary account lockout / lockout clearing) and leader hijacking; set cluster.secret_key, or set cluster.allow_insecure = true to run without encryption on a fully trusted network")
	} else {
		cfg.Logger.Warn("gossip encryption DISABLED (allow_insecure set) - cluster communication is INSECURE")
	}

	// Set event delegate for membership changes (triggers leader recalculation)
	mlConfig.Events = cluster

	// Minimal delegate (no custom gossip messages needed for ALPS)
	mlConfig.Delegate = cluster

	// Disable memberlist's built-in logging (route to slog)
	mlConfig.LogOutput = &logWriter{logger: cfg.Logger}

	// Create memberlist
	ml, err := memberlist.Create(mlConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create memberlist: %w", err)
	}

	cluster.leaderMtx.Lock()
	cluster.ml = ml
	cluster.broadcasts = &memberlist.TransmitLimitedQueue{
		NumNodes:       func() int { return ml.NumMembers() },
		RetransmitMult: 3,
	}
	cluster.leaderMtx.Unlock()

	// Join peers if provided. This is best-effort at startup (peers may not be up
	// yet); rejoinLoop below periodically retries so a failed initial join or a
	// healed network partition does not leave this node as a permanent singleton
	// (which would make it its own leader and independently request LE certs).
	if len(cfg.Peers) > 0 {
		if _, err := ml.Join(cfg.Peers); err != nil {
			cfg.Logger.Warn("failed to join some peers (may be first node)", "error", err)
		}
		go cluster.rejoinLoop(cfg.Peers)
	}

	// Initialize leader election
	cluster.updateLeader()

	// Start periodic leader check (handles missed events, failure detection)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				cfg.Logger.Error("panic in cluster leader check goroutine", "panic", r)
			}
		}()
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-cluster.done:
				return
			case <-ticker.C:
				cluster.updateLeader()
			}
		}
	}()

	cfg.Logger.Info("cluster started",
		"node_name", ml.LocalNode().Name,
		"bind_addr", mlConfig.BindAddr,
		"bind_port", mlConfig.BindPort,
		"advertise_addr", mlConfig.AdvertiseAddr,
		"advertise_port", mlConfig.AdvertisePort,
		"members", ml.NumMembers(),
		"leader", cluster.GetLeader(),
		"is_leader", cluster.IsLeader())

	return cluster, nil
}

// rejoinLoop periodically re-attempts to join the configured peers whenever this
// node appears isolated (only itself in the member list). memberlist never merges
// two disjoint clusters on its own — someone must call Join again — so without
// this a failed startup join or a partition heals into permanent split-brain,
// with every partition electing its own leader.
func (c *Cluster) rejoinLoop(peers []string) {
	defer func() {
		if r := recover(); r != nil {
			c.logger.Error("panic in cluster rejoin goroutine", "panic", r)
		}
	}()
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-c.done:
			return
		case <-ticker.C:
			if c.ml != nil && c.ml.NumMembers() <= 1 {
				if _, err := c.ml.Join(peers); err != nil {
					c.logger.Debug("cluster rejoin attempt failed", "error", err)
				} else {
					c.logger.Info("cluster rejoined peers", "members", c.ml.NumMembers())
				}
			}
		}
	}
}

// IsLeader returns true if this node is the cluster leader.
// Leader is determined by lexicographic ordering of node names (deterministic).
func (c *Cluster) IsLeader() bool {
	c.leaderMtx.RLock()
	defer c.leaderMtx.RUnlock()
	if c.ml == nil {
		return false
	}
	return c.leader == c.ml.LocalNode().Name
}

// GetLeader returns the current leader node name.
func (c *Cluster) GetLeader() string {
	c.leaderMtx.RLock()
	defer c.leaderMtx.RUnlock()
	return c.leader
}

// NumMembers returns the number of cluster members.
func (c *Cluster) NumMembers() int {
	return c.ml.NumMembers()
}

// LocalNodeName returns this node's name.
func (c *Cluster) LocalNodeName() string {
	return c.ml.LocalNode().Name
}

// updateLeader determines cluster leader based on member list.
// Leader = node with lexicographically smallest node name (deterministic).
func (c *Cluster) updateLeader() {
	c.leaderMtx.Lock()
	defer c.leaderMtx.Unlock()

	if c.ml == nil {
		return
	}

	members := c.ml.Members()
	if len(members) == 0 {
		return
	}

	sort.Slice(members, func(i, j int) bool {
		return members[i].Name < members[j].Name
	})

	newLeader := members[0].Name
	if c.leader != newLeader {
		oldLeader := c.leader
		c.leader = newLeader
		c.logger.Info("cluster leader changed",
			"old_leader", oldLeader,
			"new_leader", c.leader,
			"is_leader", c.leader == c.ml.LocalNode().Name)
	}
}

// Shutdown gracefully shuts down the cluster.
// Idempotent — safe to call multiple times.
func (c *Cluster) Shutdown() error {
	var err error
	c.shutdownOnce.Do(func() {
		close(c.done)

		if c.ml != nil {
			if leaveErr := c.ml.Leave(5 * time.Second); leaveErr != nil {
				c.logger.Warn("failed to gracefully leave cluster", "error", leaveErr)
			}
			err = c.ml.Shutdown()
		}
	})
	return err
}

// HealthStatus returns cluster health information.
func (c *Cluster) HealthStatus() map[string]interface{} {
	members := c.ml.Members()
	alive, suspect, dead := 0, 0, 0

	for _, member := range members {
		switch member.State {
		case memberlist.StateAlive:
			alive++
		case memberlist.StateSuspect:
			suspect++
		case memberlist.StateDead:
			dead++
		}
	}

	return map[string]interface{}{
		"node_name":       c.LocalNodeName(),
		"total_members":   len(members),
		"alive_members":   alive,
		"suspect_members": suspect,
		"dead_members":    dead,
		"leader":          c.GetLeader(),
		"is_leader":       c.IsLeader(),
	}
}

// Broadcast queues a message to be broadcasted to the cluster via gossip protocol.
func (c *Cluster) Broadcast(msg []byte) {
	if c.broadcasts != nil {
		c.broadcasts.QueueBroadcast(&broadcastMsg{msg: msg})
	}
}

// SetMessageHandler registers a callback for incoming gossip messages.
func (c *Cluster) SetMessageHandler(handler func(msg []byte)) {
	c.msgMtx.Lock()
	defer c.msgMtx.Unlock()
	c.msgHandler = handler
}

// --- Memberlist EventDelegate Implementation ---

func (c *Cluster) NotifyJoin(node *memberlist.Node) {
	c.logger.Info("node joined cluster", "node", node.Name, "addr", node.Address())
	go c.updateLeader()
}

func (c *Cluster) NotifyLeave(node *memberlist.Node) {
	c.logger.Info("node left cluster", "node", node.Name, "addr", node.Address())
	go c.updateLeader()
}

func (c *Cluster) NotifyUpdate(node *memberlist.Node) {
	c.logger.Debug("node updated", "node", node.Name, "addr", node.Address())
}

// --- Memberlist Delegate Implementation ---

func (c *Cluster) NodeMeta(limit int) []byte { return nil }

func (c *Cluster) NotifyMsg(data []byte) {
	c.msgMtx.RLock()
	handler := c.msgHandler
	c.msgMtx.RUnlock()
	if handler != nil {
		handler(data)
	}
}

func (c *Cluster) GetBroadcasts(overhead, limit int) [][]byte {
	if c.broadcasts != nil {
		return c.broadcasts.GetBroadcasts(overhead, limit)
	}
	return nil
}

func (c *Cluster) LocalState(join bool) []byte            { return nil }
func (c *Cluster) MergeRemoteState(buf []byte, join bool) {}

// --- Helpers ---

// DecodeSecretKey decodes a base64-encoded secret key string into bytes.
func DecodeSecretKey(encoded string) ([]byte, error) {
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, fmt.Errorf("failed to decode secret key: %w", err)
	}
	if len(decoded) != 32 {
		return nil, fmt.Errorf("secret key must be 32 bytes when decoded, got %d", len(decoded))
	}
	return decoded, nil
}

type logWriter struct {
	logger *slog.Logger
}

func (w *logWriter) Write(p []byte) (n int, err error) {
	msg := string(p)
	if len(msg) > 0 && msg[len(msg)-1] == '\n' {
		msg = msg[:len(msg)-1]
	}
	w.logger.Debug(msg)
	return len(p), nil
}
