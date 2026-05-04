package tlsmanager

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"sync"
	"time"

	"golang.org/x/crypto/acme/autocert"
)

// FallbackCache implements autocert.Cache with dual-layer storage:
// - Primary: S3-compatible object storage (shared across cluster)
// - Fallback: Local filesystem (fast access, resilience during S3 outage)
type FallbackCache struct {
	primary       autocert.Cache
	fallback      autocert.Cache
	s3Available   bool
	lastS3Check   time.Time
	checkInterval time.Duration
	backoffTime   time.Duration
	maxBackoff    time.Duration
	mu            sync.RWMutex
	logger        *slog.Logger
	retryQueue    chan retryItem
	stopRetry     chan struct{}
}

type retryItem struct {
	key  string
	data []byte
}

// NewFallbackCache creates a dual-layer cache with S3 primary and local filesystem fallback
func NewFallbackCache(s3Cache *S3Cache, fallbackDir string, logger *slog.Logger) (*FallbackCache, error) {
	// Create fallback directory if it doesn't exist
	if fallbackDir != "" {
		if err := os.MkdirAll(fallbackDir, 0700); err != nil {
			logger.Warn("failed to create fallback directory, disabling filesystem fallback", "dir", fallbackDir, "error", err)
			fallbackDir = ""
		}
	}

	var fallbackCache autocert.Cache
	if fallbackDir != "" {
		fallbackCache = autocert.DirCache(fallbackDir)
		logger.Info("local filesystem fallback enabled", "dir", fallbackDir)
	} else {
		fallbackCache = &noopCache{}
		logger.Info("local filesystem fallback disabled")
	}

	fc := &FallbackCache{
		primary:       s3Cache,
		fallback:      fallbackCache,
		s3Available:   true,
		checkInterval: 30 * time.Second,
		backoffTime:   30 * time.Second,
		maxBackoff:    5 * time.Minute,
		logger:        logger,
		retryQueue:    make(chan retryItem, 100),
		stopRetry:     make(chan struct{}),
	}

	// Start background retry goroutine
	go fc.retryWorker()

	return fc, nil
}

// Get retrieves a certificate from cache (local first, then S3)
func (fc *FallbackCache) Get(ctx context.Context, name string) ([]byte, error) {
	// 1. Try local cache FIRST (fast path - no network call)
	data, err := fc.fallback.Get(ctx, name)
	if err == nil {
		fc.logger.Debug("fallback cache hit (local)", "key", name, "size", len(data))
		return data, nil
	}

	// 2. Try S3 if available
	if fc.isS3Available() {
		data, err := fc.primary.Get(ctx, name)
		if err == nil {
			fc.logger.Debug("fallback cache hit (s3)", "key", name, "size", len(data))
			// Asynchronously sync to local cache for future fast access
			go func() {
				if err := fc.fallback.Put(context.Background(), name, data); err != nil {
					fc.logger.Warn("failed to sync certificate to local cache", "key", name, "error", err)
				}
			}()
			fc.markS3Available()
			return data, nil
		}

		// If error is not cache miss, mark S3 as unavailable
		if !errors.Is(err, autocert.ErrCacheMiss) {
			fc.logger.Error("s3 error, marking unavailable", "error", err)
			fc.markS3Unavailable()
		}

		return nil, err
	}

	fc.logger.Debug("fallback cache miss", "key", name)
	return nil, autocert.ErrCacheMiss
}

// Put stores a certificate in cache (S3 + local)
func (fc *FallbackCache) Put(ctx context.Context, name string, data []byte) error {
	fc.logger.Debug("fallback cache put", "key", name, "size", len(data))

	var s3Err error
	var localErr error

	// Try S3 first if available
	if fc.isS3Available() {
		s3Err = fc.primary.Put(ctx, name, data)
		if s3Err == nil {
			fc.logger.Debug("stored certificate in s3", "key", name)
			fc.markS3Available()
		} else {
			fc.logger.Error("failed to store certificate in s3", "key", name, "error", s3Err)
			fc.markS3Unavailable()
			// Queue for retry
			select {
			case fc.retryQueue <- retryItem{key: name, data: data}:
				fc.logger.Debug("queued certificate for s3 retry", "key", name)
			default:
				fc.logger.Warn("retry queue full, dropping certificate", "key", name)
			}
		}
	}

	// Always try to write to local cache
	localErr = fc.fallback.Put(ctx, name, data)
	if localErr != nil {
		fc.logger.Error("failed to store certificate in local cache", "key", name, "error", localErr)
	} else {
		fc.logger.Debug("stored certificate in local cache", "key", name)
	}

	// Return success if either succeeded
	if s3Err == nil || localErr == nil {
		return nil
	}

	// Both failed
	if s3Err != nil {
		return s3Err
	}
	return localErr
}

// Delete removes a certificate from cache (both S3 and local)
func (fc *FallbackCache) Delete(ctx context.Context, name string) error {
	fc.logger.Debug("fallback cache delete", "key", name)

	var s3Err error
	var localErr error

	// Try to delete from S3
	if fc.isS3Available() {
		s3Err = fc.primary.Delete(ctx, name)
		if s3Err != nil {
			fc.logger.Error("failed to delete certificate from s3", "key", name, "error", s3Err)
			fc.markS3Unavailable()
		}
	}

	// Try to delete from local cache
	localErr = fc.fallback.Delete(ctx, name)
	if localErr != nil {
		fc.logger.Error("failed to delete certificate from local cache", "key", name, "error", localErr)
	}

	// Return success if either succeeded
	if s3Err == nil || localErr == nil {
		return nil
	}

	// Both failed
	if s3Err != nil {
		return s3Err
	}
	return localErr
}

// isS3Available checks if S3 is available (with throttling)
func (fc *FallbackCache) isS3Available() bool {
	fc.mu.RLock()
	available := fc.s3Available
	lastCheck := fc.lastS3Check
	fc.mu.RUnlock()

	// If marked unavailable, check if enough time has passed
	if !available {
		if time.Since(lastCheck) < fc.checkInterval {
			return false
		}
		// Try again after interval
		fc.mu.Lock()
		fc.s3Available = true
		fc.lastS3Check = time.Now()
		fc.mu.Unlock()
		fc.logger.Info("retrying s3 after backoff period")
	}

	return true
}

// markS3Available marks S3 as available and resets backoff
func (fc *FallbackCache) markS3Available() {
	fc.mu.Lock()
	defer fc.mu.Unlock()

	if !fc.s3Available {
		fc.logger.Info("s3 storage recovered")
	}

	fc.s3Available = true
	fc.checkInterval = 30 * time.Second // Reset to default
}

// markS3Unavailable marks S3 as unavailable with exponential backoff
func (fc *FallbackCache) markS3Unavailable() {
	fc.mu.Lock()
	defer fc.mu.Unlock()

	if fc.s3Available {
		fc.logger.Warn("s3 storage unavailable, falling back to local cache")
	}

	fc.s3Available = false
	fc.lastS3Check = time.Now()

	// Exponential backoff
	fc.checkInterval *= 2
	if fc.checkInterval > fc.maxBackoff {
		fc.checkInterval = fc.maxBackoff
	}
}

// retryWorker processes the retry queue in the background
func (fc *FallbackCache) retryWorker() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-fc.stopRetry:
			return
		case <-ticker.C:
			fc.processRetryQueue()
		}
	}
}

// processRetryQueue attempts to sync queued items to S3
func (fc *FallbackCache) processRetryQueue() {
	if !fc.isS3Available() {
		return
	}

	// Process up to 10 items per cycle
	for i := 0; i < 10; i++ {
		select {
		case item := <-fc.retryQueue:
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			err := fc.primary.Put(ctx, item.key, item.data)
			cancel()

			if err == nil {
				fc.logger.Info("successfully synced certificate to s3 (retry)", "key", item.key)
				fc.markS3Available()
			} else {
				fc.logger.Error("failed to sync certificate to s3 (retry)", "key", item.key, "error", err)
				fc.markS3Unavailable()
				// Re-queue for next attempt
				select {
				case fc.retryQueue <- item:
				default:
				}
				return
			}
		default:
			return
		}
	}
}

// SyncAllToS3 manually syncs all local certificates to S3
func (fc *FallbackCache) SyncAllToS3(ctx context.Context) error {
	// Only works with autocert.DirCache
	dirCache, ok := fc.fallback.(autocert.DirCache)
	if !ok {
		return errors.New("fallback cache is not a directory cache")
	}

	dir := string(dirCache)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}

	syncCount := 0
	errorCount := 0

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		key := entry.Name()
		data, err := fc.fallback.Get(ctx, key)
		if err != nil {
			fc.logger.Warn("failed to read local certificate", "key", key, "error", err)
			errorCount++
			continue
		}

		err = fc.primary.Put(ctx, key, data)
		if err != nil {
			fc.logger.Error("failed to sync certificate to s3", "key", key, "error", err)
			errorCount++
		} else {
			fc.logger.Info("synced certificate to s3", "key", key)
			syncCount++
		}
	}

	fc.logger.Info("completed s3 sync", "synced", syncCount, "errors", errorCount)

	if errorCount > 0 {
		return fmt.Errorf("failed to sync %d certificates", errorCount)
	}

	return nil
}

// Close stops the retry worker
func (fc *FallbackCache) Close() error {
	close(fc.stopRetry)
	return nil
}

// GetCacheDir returns the local cache directory path (if using DirCache)
func (fc *FallbackCache) GetCacheDir() string {
	if dirCache, ok := fc.fallback.(autocert.DirCache); ok {
		return string(dirCache)
	}
	return ""
}

// noopCache is a cache that does nothing (used when fallback is disabled)
type noopCache struct{}

func (nc *noopCache) Get(ctx context.Context, key string) ([]byte, error) {
	return nil, autocert.ErrCacheMiss
}

func (nc *noopCache) Put(ctx context.Context, key string, data []byte) error {
	return nil
}

func (nc *noopCache) Delete(ctx context.Context, key string) error {
	return nil
}

// EnsureCacheDirPermissions ensures the cache directory has correct permissions (0700)
func EnsureCacheDirPermissions(dir string) error {
	if dir == "" {
		return nil
	}

	info, err := os.Stat(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return os.MkdirAll(dir, 0700)
		}
		return err
	}

	if !info.IsDir() {
		return fmt.Errorf("%s is not a directory", dir)
	}

	// Check permissions
	mode := info.Mode().Perm()
	if mode != 0700 {
		return os.Chmod(dir, 0700)
	}

	return nil
}
