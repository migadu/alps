package storage

import (
	"context"
	"fmt"
	"log/slog"

	"golang.org/x/crypto/acme/autocert"
)

// ClusterAwareCache wraps an autocert.Cache and only allows the cluster leader
// to write new certificates. All nodes can read certificates from the cache.
//
// This prevents race conditions with Let's Encrypt when multiple nodes
// simultaneously request certificates for the same domain, which could trigger
// Let's Encrypt rate limits.
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

// Put stores a certificate in the cache (only leader can write).
// Non-leader nodes will return an error to prevent duplicate Let's Encrypt requests.
func (c *ClusterAwareCache) Put(ctx context.Context, name string, data []byte) error {
	isLeader := c.isLeaderF()

	c.logger.Info("cluster cache: Put certificate request", "name", name, "is_leader", isLeader)

	// Check if this node is the cluster leader
	if !isLeader {
		// Non-leader nodes should not write certificates
		// This prevents race conditions with Let's Encrypt
		c.logger.Warn("cluster cache: certificate request BLOCKED - not cluster leader (leader will handle it)", "name", name)
		return fmt.Errorf("only cluster leader can request new certificates")
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

// Delete removes a certificate from the cache (only leader can delete).
func (c *ClusterAwareCache) Delete(ctx context.Context, name string) error {
	isLeader := c.isLeaderF()

	c.logger.Debug("cluster cache: Delete certificate request", "name", name, "is_leader", isLeader)

	// Check if this node is the cluster leader
	if !isLeader {
		c.logger.Debug("cluster cache: skipping certificate delete (not cluster leader)", "name", name)
		return fmt.Errorf("only cluster leader can delete certificates")
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
