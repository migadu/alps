package tlsmanager

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"os"
	"path"
	"strings"
	"time"

	"github.com/caddyserver/certmagic"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type S3StorageConfig struct {
	Endpoint        string
	Bucket          string
	AccessKeyID     string
	SecretAccessKey string
	Region          string
	DisableTLS      bool
	Prefix          string        // Default: "certmagic/"
	LockTimeout     time.Duration // Default: 5 minutes
	NodeID          string        // Unique per Alps instance (default: hostname)
}

type S3Storage struct {
	client      *minio.Client
	bucket      string
	prefix      string
	lockTimeout time.Duration
	nodeID      string // Stable per server (for jitter calculation)
	lockOwnerID string // Unique per process (for lock ownership)
	logger      *slog.Logger
}

var _ certmagic.Storage = (*S3Storage)(nil)

func NewS3Storage(cfg S3StorageConfig, logger *slog.Logger) (*S3Storage, error) {
	if cfg.Bucket == "" {
		return nil, errors.New("s3 bucket required")
	}
	if cfg.Endpoint == "" {
		return nil, errors.New("s3 endpoint required")
	}
	if cfg.Prefix == "" {
		cfg.Prefix = "certmagic/"
	} else if !strings.HasSuffix(cfg.Prefix, "/") {
		// Normalize prefix to always end with "/" for consistent key handling
		cfg.Prefix = cfg.Prefix + "/"
	}
	if cfg.LockTimeout == 0 {
		cfg.LockTimeout = 5 * time.Minute
	}

	// Use configured node ID, fall back to hostname.
	// This ID is used for jitter calculation (should be stable across restarts).
	// For lock ownership, we append PID internally to ensure uniqueness per process.
	nodeID := cfg.NodeID
	if nodeID == "" {
		var err error
		nodeID, err = os.Hostname()
		if err != nil {
			return nil, fmt.Errorf("node_id not configured and hostname unavailable: %w", err)
		}
	}

	var creds *credentials.Credentials
	if cfg.AccessKeyID == "" && cfg.SecretAccessKey == "" {
		creds = credentials.NewIAM("")
	} else {
		creds = credentials.NewStaticV4(cfg.AccessKeyID, cfg.SecretAccessKey, "")
	}

	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  creds,
		Secure: !cfg.DisableTLS,
		Region: cfg.Region,
	})
	if err != nil {
		return nil, fmt.Errorf("create s3 client: %w", err)
	}

	// Lock owner ID includes PID to ensure uniqueness per process.
	// This prevents two processes on the same host from both thinking they own a lock.
	lockOwnerID := fmt.Sprintf("%s-%d", nodeID, os.Getpid())

	s := &S3Storage{
		client:      client,
		bucket:      cfg.Bucket,
		prefix:      cfg.Prefix,
		lockTimeout: cfg.LockTimeout,
		nodeID:      nodeID,
		lockOwnerID: lockOwnerID,
		logger:      logger,
	}

	// Verify bucket exists
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, cfg.Bucket)
	if err != nil {
		return nil, fmt.Errorf("check bucket: %w", err)
	}
	if !exists {
		return nil, fmt.Errorf("bucket %s does not exist", cfg.Bucket)
	}

	logger.Info("s3 storage initialized",
		"bucket", cfg.Bucket,
		"endpoint", cfg.Endpoint,
		"node_id", nodeID)

	return s, nil
}

func (s *S3Storage) key(name string) string {
	return path.Join(s.prefix, name)
}

func (s *S3Storage) lockKey(name string) string {
	return s.key(name) + ".lock"
}

// GetNodeID returns the stable node identifier (for jitter calculation)
func (s *S3Storage) GetNodeID() string {
	return s.nodeID
}

// Store puts a value at key
func (s *S3Storage) Store(ctx context.Context, key string, value []byte) error {
	_, err := s.client.PutObject(ctx, s.bucket, s.key(key),
		bytes.NewReader(value), int64(len(value)),
		minio.PutObjectOptions{ContentType: "application/octet-stream"})
	if err != nil {
		return fmt.Errorf("store %s: %w", key, err)
	}
	s.logger.Debug("stored", "key", key, "size", len(value))
	return nil
}

// Load retrieves the value at key
func (s *S3Storage) Load(ctx context.Context, key string) ([]byte, error) {
	obj, err := s.client.GetObject(ctx, s.bucket, s.key(key), minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("load %s: %w", key, err)
	}
	defer obj.Close()

	data, err := io.ReadAll(obj)
	if err != nil {
		if minio.ToErrorResponse(err).Code == "NoSuchKey" {
			return nil, fs.ErrNotExist
		}
		return nil, fmt.Errorf("read %s: %w", key, err)
	}
	return data, nil
}

// Delete removes key
func (s *S3Storage) Delete(ctx context.Context, key string) error {
	return s.client.RemoveObject(ctx, s.bucket, s.key(key), minio.RemoveObjectOptions{})
}

// Exists returns true if key exists.
// On S3 errors, returns true (conservative) so Load is called and can return
// a proper error. This avoids triggering certificate issuance during transient
// S3 failures.
func (s *S3Storage) Exists(ctx context.Context, key string) bool {
	_, err := s.client.StatObject(ctx, s.bucket, s.key(key), minio.StatObjectOptions{})
	if err != nil {
		errResp := minio.ToErrorResponse(err)
		if errResp.Code == "NoSuchKey" {
			return false // Object genuinely doesn't exist
		}
		// S3 error (network, auth, etc.) - assume exists to be conservative
		s.logger.Warn("s3 error in Exists, assuming object exists",
			"key", key, "error", err)
		return true
	}
	return true
}

// Stat returns metadata about key
func (s *S3Storage) Stat(ctx context.Context, key string) (certmagic.KeyInfo, error) {
	info, err := s.client.StatObject(ctx, s.bucket, s.key(key), minio.StatObjectOptions{})
	if err != nil {
		if minio.ToErrorResponse(err).Code == "NoSuchKey" {
			return certmagic.KeyInfo{}, fs.ErrNotExist
		}
		return certmagic.KeyInfo{}, fmt.Errorf("stat %s: %w", key, err)
	}
	return certmagic.KeyInfo{
		Key:        key,
		Modified:   info.LastModified,
		Size:       info.Size,
		IsTerminal: true,
	}, nil
}

// List returns keys matching prefix
func (s *S3Storage) List(ctx context.Context, prefix string, recursive bool) ([]string, error) {
	fullPrefix := s.key(prefix)
	var keys []string

	for obj := range s.client.ListObjects(ctx, s.bucket, minio.ListObjectsOptions{
		Prefix:    fullPrefix,
		Recursive: recursive,
	}) {
		if obj.Err != nil {
			return nil, obj.Err
		}
		relKey := strings.TrimPrefix(obj.Key, s.prefix)
		if !strings.HasSuffix(relKey, ".lock") {
			keys = append(keys, relKey)
		}
	}
	return keys, nil
}

// Lock acquires an advisory lock.
// Fails closed on S3 errors: if we can't verify lock state, return error.
// Times out after 2x the lock TTL to allow for one full expiry cycle.
func (s *S3Storage) Lock(ctx context.Context, key string) error {
	lockKey := s.lockKey(key)
	start := time.Now()
	// Wait up to 2x lock timeout to allow stale locks to expire
	acquireTimeout := 2 * s.lockTimeout

	for {
		// Check timeout
		if time.Since(start) > acquireTimeout {
			return fmt.Errorf("lock timeout after %v: %s", acquireTimeout, key)
		}

		// Check context
		if err := ctx.Err(); err != nil {
			return err
		}

		// Check lock state (fail closed on errors)
		held, err := s.lockIsHeldByOther(ctx, lockKey)
		if err != nil {
			// S3 error - fail closed, don't proceed
			return fmt.Errorf("cannot verify lock state: %w", err)
		}

		if !held {
			// Lock is free (doesn't exist, expired, or we own it)
			if err := s.writeLock(ctx, lockKey); err != nil {
				// Write failed - this could be transient, retry
				s.logger.Warn("failed to write lock, will retry",
					"key", key, "error", err)
			} else {
				s.logger.Debug("lock acquired", "key", key)
				return nil
			}
		}

		// Lock held by someone else, wait and retry
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(500 * time.Millisecond):
			// Continue loop
		}
	}
}

// lockIsHeldByOther checks if the lock exists and is held by another node.
// Returns:
//   - (true, nil): lock is held by another node and not expired
//   - (false, nil): lock doesn't exist, is expired, or is held by us
//   - (false, err): S3 error, caller should fail closed
func (s *S3Storage) lockIsHeldByOther(ctx context.Context, lockKey string) (bool, error) {
	obj, err := s.client.GetObject(ctx, s.bucket, lockKey, minio.GetObjectOptions{})
	if err != nil {
		errResp := minio.ToErrorResponse(err)
		if errResp.Code == "NoSuchKey" {
			return false, nil // No lock exists
		}
		return false, fmt.Errorf("get lock: %w", err) // S3 error
	}
	defer obj.Close()

	data, err := io.ReadAll(obj)
	if err != nil {
		errResp := minio.ToErrorResponse(err)
		if errResp.Code == "NoSuchKey" {
			return false, nil // Lock disappeared (race)
		}
		return false, fmt.Errorf("read lock: %w", err) // S3 error
	}

	if len(data) == 0 {
		return false, nil // Empty lock file, treat as no lock
	}

	lock, err := parseLockInfo(data)
	if err != nil {
		// Corrupt lock file - treat as no lock (we'll overwrite it)
		s.logger.Warn("corrupt lock file, treating as expired", "error", err)
		return false, nil
	}

	// Check expiry
	if time.Now().After(lock.ExpiresAt) {
		return false, nil // Lock expired
	}

	// Check ownership (using lockOwnerID which includes PID)
	if lock.NodeID == s.lockOwnerID {
		return false, nil // We own it
	}

	// Lock is held by another process and not expired
	return true, nil
}

func (s *S3Storage) writeLock(ctx context.Context, lockKey string) error {
	lock := &lockInfo{
		NodeID:    s.lockOwnerID, // Use lockOwnerID (includes PID) for ownership
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(s.lockTimeout),
	}
	data := lock.marshal()

	_, err := s.client.PutObject(ctx, s.bucket, lockKey,
		bytes.NewReader(data), int64(len(data)),
		minio.PutObjectOptions{ContentType: "application/json"})
	return err
}

// Unlock releases the lock (only if we own it).
// Logs errors but does not fail: stale locks expire naturally, and blocking
// on unlock errors would be worse than letting TTL handle cleanup.
func (s *S3Storage) Unlock(ctx context.Context, key string) error {
	lockKey := s.lockKey(key)

	obj, err := s.client.GetObject(ctx, s.bucket, lockKey, minio.GetObjectOptions{})
	if err != nil {
		errResp := minio.ToErrorResponse(err)
		if errResp.Code == "NoSuchKey" {
			return nil // Lock already gone
		}
		s.logger.Warn("unlock: failed to read lock, will expire via TTL",
			"key", key, "error", err)
		return nil
	}
	defer obj.Close()

	data, err := io.ReadAll(obj)
	if err != nil {
		s.logger.Warn("unlock: failed to read lock data, will expire via TTL",
			"key", key, "error", err)
		return nil
	}

	lock, err := parseLockInfo(data)
	if err != nil {
		s.logger.Warn("unlock: corrupt lock file, will expire via TTL",
			"key", key, "error", err)
		return nil
	}

	if lock.NodeID != s.lockOwnerID {
		s.logger.Debug("unlock: not owner, skipping", "key", key, "owner", lock.NodeID)
		return nil
	}

	if err := s.client.RemoveObject(ctx, s.bucket, lockKey, minio.RemoveObjectOptions{}); err != nil {
		s.logger.Warn("unlock: failed to delete lock, will expire via TTL",
			"key", key, "error", err)
		return nil
	}

	s.logger.Debug("lock released", "key", key)
	return nil
}

type lockInfo struct {
	NodeID    string    `json:"node_id"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

func (l *lockInfo) marshal() []byte {
	return []byte(fmt.Sprintf(
		`{"node_id":"%s","created_at":"%s","expires_at":"%s"}`,
		l.NodeID,
		l.CreatedAt.Format(time.RFC3339),
		l.ExpiresAt.Format(time.RFC3339)))
}

func parseLockInfo(data []byte) (*lockInfo, error) {
	var lock lockInfo
	str := string(data)

	if i := strings.Index(str, `"node_id":"`); i != -1 {
		i += len(`"node_id":"`)
		if j := strings.Index(str[i:], `"`); j != -1 {
			lock.NodeID = str[i : i+j]
		}
	}
	if i := strings.Index(str, `"created_at":"`); i != -1 {
		i += len(`"created_at":"`)
		if j := strings.Index(str[i:], `"`); j != -1 {
			if t, err := time.Parse(time.RFC3339, str[i:i+j]); err == nil {
				lock.CreatedAt = t
			}
		}
	}
	if i := strings.Index(str, `"expires_at":"`); i != -1 {
		i += len(`"expires_at":"`)
		if j := strings.Index(str[i:], `"`); j != -1 {
			if t, err := time.Parse(time.RFC3339, str[i:i+j]); err == nil {
				lock.ExpiresAt = t
			}
		}
	}

	if lock.NodeID == "" {
		return nil, errors.New("invalid lock: missing node_id")
	}
	return &lock, nil
}
