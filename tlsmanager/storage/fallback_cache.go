package storage

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
	"time"

	"golang.org/x/crypto/acme/autocert"
)

// FallbackCache implements a two-tier cache system:
// - Primary: S3 (source of truth, shared across cluster)
// - Fallback: Local filesystem (fast cache, used when S3 unavailable)
//
// Architecture (matching mizu):
// - Get(): Try local first (fast), fallback to S3, sync S3→local
// - Put(): Try S3 first (source of truth), fallback to local, schedule background sync
// - Periodic sync: Ensures S3 has all certificates from fallback cache
//
// S3 Circuit Breaker: If S3 operations fail, the cache stops trying S3 for
// a configurable interval (default 30s) to avoid repeated timeouts.
type FallbackCache struct {
	primary          autocert.Cache // S3 cache (source of truth)
	fallback         autocert.Cache // Local filesystem cache (autocert.DirCache)
	fallbackDir      string         // Local cache directory path
	logger           *slog.Logger
	mu               sync.RWMutex  // Protects sync operations and needsSync flag
	s3Mu             sync.RWMutex  // Protects S3 availability state
	s3Available      bool          // Is S3 currently reachable?
	needsSync        bool          // True when certs were written to fallback only and need S3 sync
	lastS3Check      time.Time     // When did we last check S3?
	checkInterval    time.Duration // How often to retry S3 after failure (default 30s)
	consecutiveFails int           // Consecutive S3 failure count (protected by s3Mu)
}

// NewFallbackCache creates a new two-tier cache with S3 as primary.
// Returns S3-only cache with a warning if fallback directory cannot be created.
func NewFallbackCache(localDir string, s3Cache *S3Cache, logger *slog.Logger) *FallbackCache {
	// Try to ensure fallback directory exists
	if err := os.MkdirAll(localDir, 0700); err != nil {
		logger.Warn("cannot create fallback directory - fallback cache disabled, using S3-only",
			"dir", localDir,
			"error", err)
		logger.Warn("certificates will only be stored in S3 - if S3 becomes unavailable, certificate operations will fail")
		// Note: We still return a FallbackCache but with no local cache functionality
	}

	return &FallbackCache{
		primary:       s3Cache,                     // S3 is source of truth
		fallback:      autocert.DirCache(localDir), // Local is cache for speed
		fallbackDir:   localDir,
		logger:        logger,
		s3Available:   true,             // Assume S3 is available initially
		checkInterval: 30 * time.Second, // Retry S3 after 30s on failure
	}
}

// isS3Available checks if S3 should be tried based on recent failures.
// If S3 was marked unavailable, retries after checkInterval has elapsed.
func (f *FallbackCache) isS3Available() bool {
	f.s3Mu.RLock()
	defer f.s3Mu.RUnlock()

	// If S3 is marked unavailable, check if enough time has passed to retry
	if !f.s3Available {
		if time.Since(f.lastS3Check) < f.checkInterval {
			return false
		}
	}
	return true
}

// markS3Unavailable marks S3 as unavailable, records the time, and tracks
// consecutive failures. Escalates log severity when failures persist.
func (f *FallbackCache) markS3Unavailable() {
	f.s3Mu.Lock()
	defer f.s3Mu.Unlock()

	f.consecutiveFails++
	f.s3Available = false
	f.lastS3Check = time.Now()

	// Escalate log severity based on consecutive failure count.
	// This ensures persistent S3 outages are impossible to miss in logs.
	switch {
	case f.consecutiveFails == 1:
		f.logger.Warn("S3 certificate cache unavailable - operations will use local cache only",
			"retry_after", f.checkInterval,
			"consecutive_failures", f.consecutiveFails)
	case f.consecutiveFails <= 5:
		f.logger.Warn("S3 certificate cache still unavailable",
			"consecutive_failures", f.consecutiveFails,
			"retry_after", f.checkInterval)
	default:
		// After 5+ consecutive failures, log at Error level — this likely
		// requires operator attention (misconfigured credentials, network partition, etc.)
		f.logger.Error("PERSISTENT S3 FAILURE: certificate cache has been unavailable for an extended period — certificates are only stored locally and NOT replicated",
			"consecutive_failures", f.consecutiveFails,
			"retry_after", f.checkInterval)
	}
}

// markS3Available marks S3 as available again and resets the failure counter.
func (f *FallbackCache) markS3Available() {
	f.s3Mu.Lock()
	defer f.s3Mu.Unlock()

	if !f.s3Available {
		f.logger.Info("S3 certificate cache restored - resuming S3 operations",
			"was_unavailable_for_failures", f.consecutiveFails)
	}
	f.s3Available = true
	f.consecutiveFails = 0
}

// Get retrieves a certificate, trying local cache first (fast), then S3 (slow).
// This ensures TLS handshakes are fast when certificates are already cached locally.
// S3 operations have a 5-second timeout to prevent blocking TLS handshakes.
func (f *FallbackCache) Get(ctx context.Context, key string) ([]byte, error) {
	f.logger.Debug("FallbackCache: Get certificate (checking local cache first)", "name", key)

	// STEP 1: Try local cache first (FAST - no network call)
	data, err := f.fallback.Get(ctx, key)
	if err == nil {
		f.logger.Debug("FallbackCache: certificate found in local cache", "name", key)
		return data, nil
	}

	// Not in local cache or error reading
	if err != autocert.ErrCacheMiss {
		f.logger.Warn("FallbackCache: error reading local cache (will try S3)", "name", key, "error", err)
	} else {
		f.logger.Debug("FallbackCache: certificate not in local cache (checking S3)", "name", key)
	}

	// STEP 2: Try S3 (SLOW - network call) with timeout
	if !f.isS3Available() {
		f.logger.Debug("FallbackCache: S3 unavailable (circuit breaker), certificate not found", "name", key)
		return nil, autocert.ErrCacheMiss
	}

	f.logger.Debug("FallbackCache: fetching certificate from S3", "name", key)

	// Create a timeout context for S3 operations (5 seconds max for TLS handshake path)
	// This prevents TLS handshakes from blocking indefinitely on S3 issues
	s3Ctx, s3Cancel := context.WithTimeout(ctx, 5*time.Second)
	defer s3Cancel()

	data, err = f.primary.Get(s3Ctx, key)
	if err == nil {
		f.logger.Info("FallbackCache: certificate found in S3 - syncing to local cache", "name", key)
		f.markS3Available()

		// Store in local cache for future fast access (async to avoid blocking)
		go func() {
			if putErr := f.fallback.Put(context.Background(), key, data); putErr != nil {
				f.logger.Warn("FallbackCache: failed to sync certificate to local cache", "name", key, "error", putErr)
			} else {
				f.logger.Debug("FallbackCache: certificate synced to local cache", "name", key)
			}
		}()

		return data, nil
	}

	// If it's just a cache miss, don't mark S3 as unavailable
	if err == autocert.ErrCacheMiss {
		f.logger.Debug("FallbackCache: certificate not found in S3 (cache miss)", "name", key)
		return nil, autocert.ErrCacheMiss
	}

	// S3 error (timeout or other error) - mark as unavailable
	f.logger.Warn("FallbackCache: S3 Get failed (marking S3 unavailable)", "name", key, "error", err)
	f.markS3Unavailable()
	return nil, err
}

// Put stores a certificate, trying S3 first (source of truth), then falling back to local cache.
// Matches mizu architecture: S3 is primary storage, local is fallback for resilience.
func (f *FallbackCache) Put(ctx context.Context, key string, data []byte) error {
	var s3Err error

	// Try S3 first if available (source of truth)
	if f.isS3Available() {
		s3Err = f.primary.Put(ctx, key, data)
		if s3Err == nil {
			f.markS3Available()
			// Also store in fallback cache for future resilience
			if fallbackErr := f.fallback.Put(ctx, key, data); fallbackErr != nil {
				f.logger.Warn("failed to sync certificate to fallback cache", "name", key, "error", fallbackErr)
			}
			return nil
		}

		// S3 error - mark as unavailable
		f.logger.Warn("S3 Put failed - using fallback cache", "name", key, "error", s3Err)
		f.markS3Unavailable()
	}

	// Use fallback cache — mark that we need S3 sync later
	f.mu.Lock()
	f.needsSync = true
	f.mu.Unlock()

	f.logger.Info("storing certificate in fallback cache (needs S3 sync)", "name", key)
	if err := f.fallback.Put(ctx, key, data); err != nil {
		// Both failed - return the original S3 error if we have one
		if s3Err != nil {
			return fmt.Errorf("both S3 and fallback cache failed - S3 error: %w, fallback error: %v", s3Err, err)
		}
		return err
	}

	// Schedule S3 sync for later (best effort)
	go func() {
		f.syncToS3(key, data)
	}()

	return nil
}

// syncToS3 attempts to sync a certificate from fallback cache to S3 in the background.
// Waits for checkInterval before retrying to respect the circuit breaker.
func (f *FallbackCache) syncToS3(key string, data []byte) {
	// Wait for check interval before retrying S3
	time.Sleep(f.checkInterval)

	if !f.isS3Available() {
		f.logger.Debug("background S3 sync skipped (circuit breaker)", "name", key)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := f.primary.Put(ctx, key, data); err != nil {
		f.logger.Warn("background S3 sync failed - certificate only stored locally (will retry on periodic sync)", "name", key, "error", err)
		f.markS3Unavailable()
	} else {
		f.logger.Info("certificate synced from fallback cache to S3 (background)", "name", key)
		f.markS3Available()
	}
}

// Delete removes a certificate from both S3 and fallback cache.
func (f *FallbackCache) Delete(ctx context.Context, key string) error {
	var s3Err error

	// Try S3 first if available
	if f.isS3Available() {
		s3Err = f.primary.Delete(ctx, key)
		if s3Err == nil {
			f.markS3Available()
		} else {
			f.logger.Warn("S3 Delete failed", "name", key, "error", s3Err)
			f.markS3Unavailable()
		}
	}

	// Also delete from fallback cache
	fallbackErr := f.fallback.Delete(ctx, key)

	// If both failed, return combined error
	if s3Err != nil && fallbackErr != nil {
		return fmt.Errorf("both S3 and fallback cache delete failed - S3 error: %w, fallback error: %v", s3Err, fallbackErr)
	}

	// If S3 failed but fallback succeeded, warn that S3 is now inconsistent
	// (the certificate still exists in S3 but has been removed locally)
	if s3Err != nil {
		f.logger.Warn("certificate deleted from local cache but S3 delete failed — S3 may retain stale certificate",
			"name", key, "s3_error", s3Err)
	}

	return nil
}

// NeedsSync returns true if there are certificates in the local fallback cache
// that haven't been synced to S3 yet (due to a previous S3 outage).
// The cert sync worker uses this to avoid unnecessary S3 downloads every cycle.
func (f *FallbackCache) NeedsSync() bool {
	f.mu.RLock()
	defer f.mu.RUnlock()
	return f.needsSync
}

// SyncAllToS3 attempts to sync all certificates from fallback cache to S3.
// This can be called after S3 becomes available again to ensure consistency.
// Only syncs certificates that are missing or different in S3 to avoid unnecessary writes.
func (f *FallbackCache) SyncAllToS3(ctx context.Context) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	// List all files in fallback directory
	entries, err := os.ReadDir(f.fallbackDir)
	if err != nil {
		if os.IsNotExist(err) {
			f.logger.Debug("fallback cache directory does not exist yet", "dir", f.fallbackDir)
			return nil
		}
		return fmt.Errorf("failed to read fallback directory: %w", err)
	}

	synced := 0
	failed := 0
	skipped := 0

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		path := filepath.Join(f.fallbackDir, name)

		// Read from fallback
		data, err := os.ReadFile(path)
		if err != nil {
			f.logger.Warn("failed to read fallback certificate", "name", name, "error", err)
			failed++
			continue
		}

		// Check if S3 already has this certificate
		s3Data, err := f.primary.Get(ctx, name)
		if err == nil {
			// Certificate exists in S3 - compare contents
			if len(s3Data) == len(data) && bytes.Equal(s3Data, data) {
				// Same certificate - skip
				skipped++
				continue
			}
			// Different certificate - need to sync
			f.logger.Debug("certificate differs in S3, syncing", "name", name)
		} else if err != autocert.ErrCacheMiss {
			// Transient S3 error (timeout, network, etc.) - skip this cert.
			// Do NOT re-upload: we can't confirm the cert is missing vs S3 being unreachable.
			// Re-uploading on transient errors causes massive S3 object accumulation.
			f.logger.Warn("transient S3 error checking certificate - skipping sync", "name", name, "error", err)
			skipped++
			continue
		}
		// If err == autocert.ErrCacheMiss, cert is genuinely missing from S3 - sync it

		// Write to S3 (either missing or different)
		if err := f.primary.Put(ctx, name, data); err != nil {
			f.logger.Warn("failed to sync certificate to S3", "name", name, "error", err)
			failed++
			continue
		}

		synced++
		f.logger.Debug("synced certificate to S3", "name", name)
	}

	if synced > 0 {
		f.logger.Info("synced certificates from fallback cache to S3", "synced", synced, "skipped", skipped, "failed", failed)
	}

	if failed > 0 {
		return fmt.Errorf("failed to sync %d certificates to S3", failed)
	}

	// All certs synced successfully — clear the needsSync flag
	f.needsSync = false

	return nil
}
