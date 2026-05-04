package tlsmanager

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/minio/minio-go/v7"
	"golang.org/x/crypto/acme/autocert"
)

// ClusterCache wraps a cache with cluster-aware leader election
// Only the leader instance will issue new certificates
// All instances can read certificates from the shared cache
type ClusterCache struct {
	underlying autocert.Cache
	leaderLock *LeaderLock
	isLeader   bool
	mu         sync.RWMutex
	logger     *slog.Logger
	stopCh     chan struct{}
}

// ClusterCacheConfig holds cluster cache configuration
type ClusterCacheConfig struct {
	LeaderLockKey string        // S3 key for leader lock (default: "autocert/leader.lock")
	LeaderTTL     time.Duration // Leader lock TTL (default: 24h)
	RenewInterval time.Duration // How often to renew leader lock (default: 12h)
}

// NewClusterCache creates a cluster-aware cache with leader election
func NewClusterCache(
	underlying autocert.Cache,
	s3Client *minio.Client,
	bucket string,
	cfg ClusterCacheConfig,
	logger *slog.Logger,
) (*ClusterCache, error) {
	if cfg.LeaderTTL == 0 {
		// Default to 24h - autocert uses event-based timers (not polling)
		// Certificates are only checked for renewal ~30 days before expiry
		// We only need ONE leader at the moment renewal happens
		cfg.LeaderTTL = 24 * time.Hour
	}
	if cfg.RenewInterval == 0 {
		// Renew at half the TTL to ensure we don't lose leadership
		cfg.RenewInterval = cfg.LeaderTTL / 2
		if cfg.RenewInterval == 0 {
			cfg.RenewInterval = 12 * time.Hour
		}
	}

	leaderLock, err := NewLeaderLock(s3Client, bucket, LeaderLockConfig{
		LockKey: cfg.LeaderLockKey,
		TTL:     cfg.LeaderTTL,
	}, logger.With("component", "leaderlock"))
	if err != nil {
		return nil, err
	}

	cc := &ClusterCache{
		underlying: underlying,
		leaderLock: leaderLock,
		logger:     logger,
		stopCh:     make(chan struct{}),
	}

	// Try to acquire leadership immediately
	ctx := context.Background()
	isLeader, err := leaderLock.TryAcquire(ctx)
	if err != nil {
		logger.Warn("failed to acquire leader lock on startup", "error", err)
	} else {
		cc.isLeader = isLeader
		if isLeader {
			logger.Info("instance elected as leader", "instance_id", leaderLock.GetInstanceID())
		} else {
			logger.Info("instance running as follower", "instance_id", leaderLock.GetInstanceID())
		}
	}

	// Start background goroutine to maintain leadership
	go cc.leaderElectionLoop(cfg.RenewInterval)

	return cc, nil
}

// Get retrieves a certificate from cache (all instances can read)
func (cc *ClusterCache) Get(ctx context.Context, name string) ([]byte, error) {
	return cc.underlying.Get(ctx, name)
}

// Put stores a certificate in cache
// Only the leader instance will write new certificates
// Followers can still write to cache for renewal of existing certs they served
func (cc *ClusterCache) Put(ctx context.Context, name string, data []byte) error {
	cc.mu.RLock()
	isLeader := cc.isLeader
	cc.mu.RUnlock()

	if !isLeader {
		// Check if this is a renewal of an existing cert (we're allowed to renew certs we serve)
		_, err := cc.underlying.Get(ctx, name)
		if err == autocert.ErrCacheMiss {
			// This is a new certificate, only leader can issue it
			cc.logger.Debug("follower skipping new certificate issuance",
				"key", name,
				"instance_id", cc.leaderLock.GetInstanceID())
			return nil // Silently skip, don't return error
		}
		// This is a renewal, allow it
		cc.logger.Debug("follower renewing existing certificate",
			"key", name,
			"instance_id", cc.leaderLock.GetInstanceID())
	}

	return cc.underlying.Put(ctx, name, data)
}

// Delete removes a certificate from cache (only leader)
func (cc *ClusterCache) Delete(ctx context.Context, name string) error {
	cc.mu.RLock()
	isLeader := cc.isLeader
	cc.mu.RUnlock()

	if !isLeader {
		cc.logger.Debug("follower skipping certificate deletion",
			"key", name,
			"instance_id", cc.leaderLock.GetInstanceID())
		return nil // Silently skip
	}

	return cc.underlying.Delete(ctx, name)
}

// IsLeader returns whether this instance is the current leader
func (cc *ClusterCache) IsLeader() bool {
	cc.mu.RLock()
	defer cc.mu.RUnlock()
	return cc.isLeader
}

// GetInstanceID returns the unique instance ID
func (cc *ClusterCache) GetInstanceID() string {
	return cc.leaderLock.GetInstanceID()
}

// Close stops the leader election loop and releases leadership
func (cc *ClusterCache) Close() error {
	close(cc.stopCh)

	cc.mu.RLock()
	isLeader := cc.isLeader
	cc.mu.RUnlock()

	if isLeader {
		ctx := context.Background()
		if err := cc.leaderLock.Release(ctx); err != nil {
			cc.logger.Error("failed to release leader lock", "error", err)
			return err
		}
	}

	return nil
}

// leaderElectionLoop maintains leader election in the background
func (cc *ClusterCache) leaderElectionLoop(renewInterval time.Duration) {
	ticker := time.NewTicker(renewInterval)
	defer ticker.Stop()

	for {
		select {
		case <-cc.stopCh:
			return
		case <-ticker.C:
			cc.tryMaintainLeadership()
		}
	}
}

// tryMaintainLeadership attempts to acquire or maintain leadership
func (cc *ClusterCache) tryMaintainLeadership() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	isLeader, err := cc.leaderLock.TryAcquire(ctx)
	if err != nil {
		cc.logger.Warn("failed to maintain leader lock", "error", err)
		return
	}

	cc.mu.Lock()
	previouslyLeader := cc.isLeader
	cc.isLeader = isLeader
	cc.mu.Unlock()

	// Log leadership changes
	if isLeader && !previouslyLeader {
		cc.logger.Info("instance promoted to leader", "instance_id", cc.leaderLock.GetInstanceID())
	} else if !isLeader && previouslyLeader {
		cc.logger.Info("instance demoted from leader", "instance_id", cc.leaderLock.GetInstanceID())
	}
}

// GetLeaderInfo returns information about the current leader
func (cc *ClusterCache) GetLeaderInfo(ctx context.Context) (instanceID string, expiresAt time.Time, err error) {
	obj, err := cc.leaderLock.client.GetObject(ctx, cc.leaderLock.bucket, cc.leaderLock.lockKey, minio.GetObjectOptions{})
	if err != nil {
		return "", time.Time{}, err
	}
	defer obj.Close()

	data := make([]byte, 1024)
	n, err := obj.Read(data)
	if err != nil && err.Error() != "EOF" {
		return "", time.Time{}, err
	}

	lock, err := parseLockData(data[:n])
	if err != nil {
		return "", time.Time{}, err
	}

	return lock.InstanceID, lock.ExpiresAt, nil
}
