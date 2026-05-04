package tlsmanager

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"time"

	"github.com/minio/minio-go/v7"
)

// LeaderLock implements distributed leader election using S3
// Uses atomic PutObject operations with If-None-Match to acquire locks
type LeaderLock struct {
	client     *minio.Client
	bucket     string
	lockKey    string
	instanceID string
	ttl        time.Duration
	logger     *slog.Logger
}

// LeaderLockConfig holds leader lock configuration
type LeaderLockConfig struct {
	LockKey string        // S3 key for the lock object (default: "autocert/leader.lock")
	TTL     time.Duration // Lock TTL (default: 24h - autocert checks ~once per 30 days per domain)
}

// NewLeaderLock creates a new S3-based leader lock
func NewLeaderLock(client *minio.Client, bucket string, cfg LeaderLockConfig, logger *slog.Logger) (*LeaderLock, error) {
	if cfg.LockKey == "" {
		cfg.LockKey = "autocert/leader.lock"
	}
	if cfg.TTL == 0 {
		// Default to 24h - autocert uses event-based renewal (not polling)
		// Certificates are renewed ~30 days before expiry via timers, so we don't need
		// frequent leadership changes. 24h provides good failover time while
		// minimizing S3 API costs (~$0.002/month vs $0.50/month with 60s TTL).
		cfg.TTL = 24 * time.Hour
	}

	// Generate unique instance ID
	instanceID, err := generateInstanceID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate instance ID: %w", err)
	}

	return &LeaderLock{
		client:     client,
		bucket:     bucket,
		lockKey:    cfg.LockKey,
		instanceID: instanceID,
		ttl:        cfg.TTL,
		logger:     logger,
	}, nil
}

// TryAcquire attempts to acquire the leader lock
// Returns true if lock was acquired, false if another instance holds it
func (l *LeaderLock) TryAcquire(ctx context.Context) (bool, error) {
	// First check if lock exists and is expired
	obj, err := l.client.GetObject(ctx, l.bucket, l.lockKey, minio.GetObjectOptions{})
	if err == nil {
		defer obj.Close()

		// Read lock data
		data, err := io.ReadAll(obj)
		if err == nil {
			lock, err := parseLockData(data)
			if err == nil {
				// Check if lock is expired
				if time.Now().Before(lock.ExpiresAt) {
					if lock.InstanceID == l.instanceID {
						// We already own the lock, renew it
						l.logger.Debug("renewing leader lock", "instance_id", l.instanceID)
						return true, l.renewLock(ctx)
					}
					// Lock is held by another instance and not expired
					l.logger.Debug("leader lock held by another instance",
						"holder", lock.InstanceID,
						"expires_at", lock.ExpiresAt)
					return false, nil
				}
				// Lock is expired, try to acquire it
				l.logger.Debug("leader lock expired, attempting to acquire",
					"previous_holder", lock.InstanceID)
			}
		}
	}

	// Try to acquire lock using If-None-Match (create if not exists)
	// or by overwriting expired lock
	lockData := &lockData{
		InstanceID: l.instanceID,
		AcquiredAt: time.Now(),
		ExpiresAt:  time.Now().Add(l.ttl),
	}

	data := lockData.marshal()

	// Use PutObject with conditions
	_, err = l.client.PutObject(
		ctx,
		l.bucket,
		l.lockKey,
		bytes.NewReader(data),
		int64(len(data)),
		minio.PutObjectOptions{
			ContentType: "application/json",
		},
	)

	if err != nil {
		l.logger.Debug("failed to acquire leader lock", "error", err)
		return false, nil // Another instance likely acquired it first
	}

	l.logger.Info("acquired leader lock", "instance_id", l.instanceID, "ttl", l.ttl)
	return true, nil
}

// Release releases the leader lock
func (l *LeaderLock) Release(ctx context.Context) error {
	// Only release if we own the lock
	obj, err := l.client.GetObject(ctx, l.bucket, l.lockKey, minio.GetObjectOptions{})
	if err != nil {
		return nil // Lock doesn't exist, nothing to release
	}
	defer obj.Close()

	data, err := io.ReadAll(obj)
	if err != nil {
		return nil
	}

	lock, err := parseLockData(data)
	if err != nil {
		return nil
	}

	if lock.InstanceID != l.instanceID {
		// We don't own the lock, don't release it
		l.logger.Warn("attempted to release lock owned by another instance",
			"owner", lock.InstanceID,
			"our_id", l.instanceID)
		return nil
	}

	// Delete the lock
	err = l.client.RemoveObject(ctx, l.bucket, l.lockKey, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to release lock: %w", err)
	}

	l.logger.Info("released leader lock", "instance_id", l.instanceID)
	return nil
}

// renewLock renews the lock by updating the expiry time
func (l *LeaderLock) renewLock(ctx context.Context) error {
	lockData := &lockData{
		InstanceID: l.instanceID,
		AcquiredAt: time.Now(),
		ExpiresAt:  time.Now().Add(l.ttl),
	}

	data := lockData.marshal()

	_, err := l.client.PutObject(
		ctx,
		l.bucket,
		l.lockKey,
		bytes.NewReader(data),
		int64(len(data)),
		minio.PutObjectOptions{
			ContentType: "application/json",
		},
	)

	if err != nil {
		return fmt.Errorf("failed to renew lock: %w", err)
	}

	l.logger.Debug("renewed leader lock", "instance_id", l.instanceID, "expires_at", lockData.ExpiresAt)
	return nil
}

// IsLeader checks if this instance is the current leader
func (l *LeaderLock) IsLeader(ctx context.Context) bool {
	obj, err := l.client.GetObject(ctx, l.bucket, l.lockKey, minio.GetObjectOptions{})
	if err != nil {
		return false
	}
	defer obj.Close()

	data, err := io.ReadAll(obj)
	if err != nil {
		return false
	}

	lock, err := parseLockData(data)
	if err != nil {
		return false
	}

	// Check if we own the lock and it's not expired
	return lock.InstanceID == l.instanceID && time.Now().Before(lock.ExpiresAt)
}

// GetInstanceID returns the unique instance ID
func (l *LeaderLock) GetInstanceID() string {
	return l.instanceID
}

// lockData represents the lock information stored in S3
type lockData struct {
	InstanceID string    `json:"instance_id"`
	AcquiredAt time.Time `json:"acquired_at"`
	ExpiresAt  time.Time `json:"expires_at"`
}

// marshal converts lockData to JSON bytes
func (ld *lockData) marshal() []byte {
	// Simple JSON serialization without external dependency
	return []byte(fmt.Sprintf(`{"instance_id":"%s","acquired_at":"%s","expires_at":"%s"}`,
		ld.InstanceID,
		ld.AcquiredAt.Format(time.RFC3339),
		ld.ExpiresAt.Format(time.RFC3339)))
}

// parseLockData parses JSON lock data
func parseLockData(data []byte) (*lockData, error) {
	// Simple JSON parsing without external dependency
	var lock lockData

	str := string(data)

	// Extract instance_id
	if start := bytes.Index(data, []byte(`"instance_id":"`)); start != -1 {
		start += len(`"instance_id":"`)
		if end := bytes.Index(data[start:], []byte(`"`)); end != -1 {
			lock.InstanceID = str[start : start+end]
		}
	}

	// Extract acquired_at
	if start := bytes.Index(data, []byte(`"acquired_at":"`)); start != -1 {
		start += len(`"acquired_at":"`)
		if end := bytes.Index(data[start:], []byte(`"`)); end != -1 {
			t, err := time.Parse(time.RFC3339, str[start:start+end])
			if err == nil {
				lock.AcquiredAt = t
			}
		}
	}

	// Extract expires_at
	if start := bytes.Index(data, []byte(`"expires_at":"`)); start != -1 {
		start += len(`"expires_at":"`)
		if end := bytes.Index(data[start:], []byte(`"`)); end != -1 {
			t, err := time.Parse(time.RFC3339, str[start:start+end])
			if err == nil {
				lock.ExpiresAt = t
			}
		}
	}

	if lock.InstanceID == "" {
		return nil, errors.New("invalid lock data")
	}

	return &lock, nil
}

// generateInstanceID generates a unique instance ID
func generateInstanceID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
