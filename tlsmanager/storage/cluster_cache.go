package storage

import (
	"context"
	"fmt"
	"log/slog"

	"golang.org/x/crypto/acme/autocert"
)

// acmeAccountKeys are the cache keys autocert uses for the shared ACME account
// key (current and legacy names). They always pass through the leader gate:
// absorbing an account-key write is a hard issuance error in autocert, and a
// follower running the escape hatch must be able to (re)use the shared account
// instead of registering a fresh ACME account per issuance.
var acmeAccountKeys = map[string]bool{
	"acme_account+key": true,
	"acme_account.key": true,
}

// ClusterAwareCache wraps an autocert.Cache and only persists certificate
// writes from the cluster leader. All nodes can read from the cache.
//
// This is defense-in-depth behind the issuance-level gating in the TLS
// manager: even if a non-leader ends up running the autocert issuance path
// (escape hatch, renewal timers armed before a demotion, a future bug), its
// certificates never reach the shared store.
//
// Non-leader certificate writes are ABSORBED (logged, dropped, nil error)
// rather than rejected: autocert's renewal path treats a failed Cache.Put as
// a failed renewal and re-runs the FULL ACME issuance on a 30-60 minute
// backoff, so an error-returning gate turns a demoted ex-leader with armed
// renewal timers into a duplicate-issuance loop that exhausts Let's Encrypt's
// duplicate-certificate limit. Absorbing lets the renewal complete (in-memory
// only, one issuance at most); the node adopts the real leader's certificate
// from the shared store at its next renewal check.
//
// Challenge tokens and the ACME account key always pass through: tokens must
// be readable by whichever node the CA's validation probe lands on, and both
// are prerequisites for any node that legitimately issues.
type ClusterAwareCache struct {
	underlying autocert.Cache
	isLeaderF  func() bool
	logger     *slog.Logger
}

// NewClusterAwareCache creates a new cluster-aware certificate cache.
// isLeaderF should return true if this node is the current cluster leader.
func NewClusterAwareCache(cache autocert.Cache, isLeaderF func() bool, logger *slog.Logger) *ClusterAwareCache {
	return &ClusterAwareCache{
		underlying: cache,
		isLeaderF:  isLeaderF,
		logger:     logger,
	}
}

// Get retrieves a certificate from the cache (all nodes can read).
func (c *ClusterAwareCache) Get(ctx context.Context, name string) ([]byte, error) {
	isLeader := c.isLeaderF()
	c.logger.Debug("cluster cache: Get certificate request", "name", name, "is_leader", isLeader)

	data, err := c.underlying.Get(ctx, name)
	if err != nil {
		if err == autocert.ErrCacheMiss {
			c.logger.Debug("cluster cache: certificate not found (cache miss)", "name", name, "is_leader", isLeader)
		} else {
			c.logger.Error("cluster cache: error getting certificate",
				"name", name,
				"is_leader", isLeader,
				"error", err,
				"error_type", fmt.Sprintf("%T", err))
		}
		return nil, err
	}

	c.logger.Debug("cluster cache: certificate retrieved successfully", "name", name, "is_leader", isLeader, "bytes", len(data))
	return data, nil
}

// Put stores a certificate in the cache. Only the cluster leader's
// certificate writes are persisted; challenge tokens and the ACME account key
// pass through from any node (see the type comment for the full rationale).
func (c *ClusterAwareCache) Put(ctx context.Context, name string, data []byte) error {
	isLeader := c.isLeaderF()

	// Tokens must be published by whichever node runs a validation (leader
	// normally; a follower under the escape hatch), and account-key writes
	// error out issuance entirely if blocked.
	if isChallengeToken(name) || acmeAccountKeys[name] {
		c.logger.Info("cluster cache: storing ACME operational key", "name", name, "is_leader", isLeader)
		return c.underlying.Put(ctx, name, data)
	}

	c.logger.Info("cluster cache: Put certificate request", "name", name, "is_leader", isLeader)

	if !isLeader {
		// Absorb, do NOT error: an error here makes autocert's renewal loop
		// re-run full ACME issuance every 30-60 minutes (see type comment).
		// The certificate stays in this node's autocert memory only.
		c.logger.Warn("cluster cache: absorbing certificate write from non-leader (not persisted to shared store)", "name", name)
		return nil
	}

	c.logger.Info("cluster cache: cluster leader storing certificate", "name", name)
	err := c.underlying.Put(ctx, name, data)
	if err != nil {
		c.logger.Error("cluster cache: failed to store certificate", "name", name, "error", err)
		return err
	}

	c.logger.Info("cluster cache: certificate stored by leader", "name", name)
	return nil
}

// Delete removes a certificate from the cache. Non-leader certificate deletes
// are absorbed; challenge-token deletes pass through from any node (autocert
// cleans up its own token right after validation, wherever it ran).
func (c *ClusterAwareCache) Delete(ctx context.Context, name string) error {
	isLeader := c.isLeaderF()

	c.logger.Debug("cluster cache: Delete certificate request", "name", name, "is_leader", isLeader)

	if isChallengeToken(name) {
		return c.underlying.Delete(ctx, name)
	}

	if !isLeader {
		c.logger.Debug("cluster cache: absorbing certificate delete from non-leader", "name", name)
		return nil
	}

	c.logger.Info("cluster cache: cluster leader deleting certificate", "name", name)
	err := c.underlying.Delete(ctx, name)
	if err != nil {
		c.logger.Error("cluster cache: failed to delete certificate", "name", name, "error", err)
		return err
	}

	c.logger.Info("cluster cache: certificate deleted by leader", "name", name)
	return nil
}
