package storage

import (
	"bytes"
	"context"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/acme/autocert"
)

// certValidity parses a PEM cert+key bundle (as stored by autocert) and returns
// the leaf certificate's validity window. ok is false when the data holds no
// parseable certificate (e.g. account keys or challenge tokens).
func certValidity(pemData []byte) (notBefore, notAfter time.Time, ok bool) {
	rest := pemData
	for {
		var block *pem.Block
		block, rest = pem.Decode(rest)
		if block == nil {
			return time.Time{}, time.Time{}, false
		}
		if block.Type == "CERTIFICATE" {
			cert, err := x509.ParseCertificate(block.Bytes)
			if err != nil {
				return time.Time{}, time.Time{}, false
			}
			return cert.NotBefore, cert.NotAfter, true
		}
	}
}

// certNotAfter parses a PEM cert+key bundle (as stored by autocert) and returns
// the leaf certificate's expiry. ok is false when the data holds no parseable
// certificate (e.g. account keys or challenge tokens).
func certNotAfter(pemData []byte) (t time.Time, ok bool) {
	_, notAfter, ok := certValidity(pemData)
	return notAfter, ok
}

// renewalThreshold mirrors autocert's renewal window: min(lifetime/3, 30 days)
// before expiry (see acme/autocert/renewal.go). A cert inside this window is
// one the leader may already have renewed, so followers re-check S3 for it.
func renewalThreshold(notBefore, notAfter time.Time) time.Duration {
	threshold := notAfter.Sub(notBefore) / 3
	if maxThreshold := 30 * 24 * time.Hour; threshold > maxThreshold {
		threshold = maxThreshold
	}
	return threshold
}

// isChallengeToken reports whether an autocert cache key is an ephemeral ACME
// challenge token (http-01 or tls-alpn-01) rather than a certificate.
func isChallengeToken(name string) bool {
	return strings.HasSuffix(name, "+http-01") || strings.HasSuffix(name, "+token")
}

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

	// Freshness revalidation: when a locally cached cert is inside its renewal
	// window, Get re-checks S3 (throttled per key) and adopts a newer cert if
	// the cluster leader has renewed it. This is the deterministic replacement
	// for push-invalidation: it converges within revalidateEvery of a leader
	// renewal, weeks before the old cert expires.
	revalMu         sync.Mutex           // Protects lastRevalidate
	lastRevalidate  map[string]time.Time // Per-key last S3 revalidation attempt
	revalidateEvery time.Duration        // Min interval between per-key revalidations (default 1h)

	// Challenge-token read throttle: token Gets are S3-only (see Get), and an
	// unauthenticated tls-alpn-01 ClientHello would otherwise amplify 1:1
	// into billable S3 GETs. Results (hits AND misses) are reused for a
	// second; real CA validation probes arrive well after the token is
	// published, so the added staleness is negligible.
	tokenMu      sync.Mutex
	tokenResults map[string]tokenResult
}

// tokenResult is a briefly cached challenge-token read result.
type tokenResult struct {
	data []byte
	err  error
	at   time.Time
}

// tokenResultTTL bounds S3 reads per token key to ~1/second.
const tokenResultTTL = time.Second

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
		primary:         s3Cache,                     // S3 is source of truth
		fallback:        autocert.DirCache(localDir), // Local is cache for speed
		fallbackDir:     localDir,
		logger:          logger,
		s3Available:     true,             // Assume S3 is available initially
		checkInterval:   30 * time.Second, // Retry S3 after 30s on failure
		lastRevalidate:  make(map[string]time.Time),
		revalidateEvery: time.Hour,
		tokenResults:    make(map[string]tokenResult),
	}
}

// S3Healthy reports whether an S3 operation is currently worth attempting.
// Callers such as the cert warmer use this to defer ACME issuance while
// certificates cannot be replicated to the cluster. This deliberately shares
// isS3Available's retry-window semantics: after checkInterval it reports true
// again so callers probe S3 rather than staying suppressed forever — the
// breaker state itself only flips back on an actual successful operation,
// which on a quiet node might otherwise never happen.
func (f *FallbackCache) S3Healthy() bool {
	return f.isS3Available()
}

// SetRetryInterval adjusts how long the circuit breaker waits before letting
// S3 operations be retried after a failure.
func (f *FallbackCache) SetRetryInterval(d time.Duration) {
	f.s3Mu.Lock()
	defer f.s3Mu.Unlock()
	f.checkInterval = d
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
//
// Challenge tokens bypass the local tier entirely: the tls-alpn-01 key
// ("domain+token") is FIXED per domain, so a local copy cached during one
// validation would shadow the fresh token the leader writes at the next
// renewal, permanently breaking cross-node ALPN validation.
func (f *FallbackCache) Get(ctx context.Context, key string) ([]byte, error) {
	if isChallengeToken(key) {
		return f.getChallengeToken(ctx, key)
	}

	f.logger.Debug("FallbackCache: Get certificate (checking local cache first)", "name", key)

	// STEP 1: Try local cache first (FAST - no network call)
	data, err := f.fallback.Get(ctx, key)
	if err == nil {
		f.logger.Debug("FallbackCache: certificate found in local cache", "name", key)
		return f.maybeRevalidate(ctx, key, data), nil
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
			defer func() {
				if r := recover(); r != nil {
					f.logger.Error("panic syncing to local cache", "panic", r)
				}
			}()
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

	// S3 error (timeout or other error) - mark as unavailable and report a cache
	// miss. autocert treats any non-ErrCacheMiss error from Get as fatal for the
	// handshake (it does NOT fall through to certificate issuance), so returning
	// the raw transport error would abort handshakes for uncached domains that
	// could otherwise have triggered issuance. This matches the breaker-open path.
	f.logger.Warn("FallbackCache: S3 Get failed (treating as cache miss)", "name", key, "error", err)
	f.markS3Unavailable()
	return nil, autocert.ErrCacheMiss
}

// getChallengeToken reads an ACME challenge token from S3 only. Tokens are
// written seconds before Let's Encrypt validates and deleted right after, so
// the local tier is never authoritative for them (see Get for why caching the
// fixed "domain+token" key locally is actively harmful). Results are reused
// for tokenResultTTL to keep unauthenticated probes from amplifying into
// unbounded S3 reads.
func (f *FallbackCache) getChallengeToken(ctx context.Context, key string) ([]byte, error) {
	f.tokenMu.Lock()
	if r, ok := f.tokenResults[key]; ok && time.Since(r.at) < tokenResultTTL {
		f.tokenMu.Unlock()
		return r.data, r.err
	}
	// Claim the slot before releasing the lock so concurrent probes for the
	// same key reuse this read's outcome instead of racing to S3.
	f.tokenResults[key] = tokenResult{err: autocert.ErrCacheMiss, at: time.Now()}
	f.tokenMu.Unlock()

	data, err := f.fetchChallengeToken(ctx, key)

	f.tokenMu.Lock()
	f.tokenResults[key] = tokenResult{data: data, err: err, at: time.Now()}
	// Drop stale entries so the map stays bounded by recently probed keys.
	for k, r := range f.tokenResults {
		if time.Since(r.at) >= tokenResultTTL {
			delete(f.tokenResults, k)
		}
	}
	f.tokenMu.Unlock()

	return data, err
}

func (f *FallbackCache) fetchChallengeToken(ctx context.Context, key string) ([]byte, error) {
	if !f.isS3Available() {
		f.logger.Warn("FallbackCache: S3 unavailable (circuit breaker), cannot serve challenge token", "name", key)
		return nil, autocert.ErrCacheMiss
	}

	s3Ctx, s3Cancel := context.WithTimeout(ctx, 5*time.Second)
	defer s3Cancel()

	data, err := f.primary.Get(s3Ctx, key)
	if err == nil {
		f.markS3Available()
		return data, nil
	}
	if err == autocert.ErrCacheMiss {
		return nil, autocert.ErrCacheMiss
	}
	f.logger.Warn("FallbackCache: S3 Get failed for challenge token", "name", key, "error", err)
	f.markS3Unavailable()
	return nil, autocert.ErrCacheMiss
}

// maybeRevalidate returns the freshest available bundle for a locally cached
// certificate. When the local cert is inside its renewal window (the only
// period during which the cluster leader may have published a newer cert to
// S3), it re-checks S3 at most once per revalidateEvery per key and adopts the
// S3 copy if its expiry is later. Outside the window, or on any S3 problem, the
// local copy is returned unchanged — this path must never fail a handshake that
// the local cert could serve.
func (f *FallbackCache) maybeRevalidate(ctx context.Context, key string, local []byte) []byte {
	notBefore, notAfter, ok := certValidity(local)
	if !ok {
		// Not a certificate bundle (account key etc.) — nothing to revalidate.
		return local
	}
	if time.Until(notAfter) >= renewalThreshold(notBefore, notAfter) {
		return local // Not yet in the renewal window; leader cannot have renewed.
	}

	// Check the breaker BEFORE consuming the hourly revalidation slot: a
	// throttle stamp recorded while S3 is unreachable would suppress the
	// actual revalidation for a full revalidateEvery after S3 recovers.
	if !f.isS3Available() {
		return local
	}

	f.revalMu.Lock()
	last, seen := f.lastRevalidate[key]
	if seen && time.Since(last) < f.revalidateEvery {
		f.revalMu.Unlock()
		return local
	}
	f.lastRevalidate[key] = time.Now()
	f.revalMu.Unlock()

	s3Ctx, s3Cancel := context.WithTimeout(ctx, 5*time.Second)
	defer s3Cancel()

	s3Data, err := f.primary.Get(s3Ctx, key)
	if err != nil {
		if err != autocert.ErrCacheMiss {
			f.logger.Warn("FallbackCache: S3 revalidation failed - serving local certificate", "name", key, "error", err)
			f.markS3Unavailable()
		}
		return local
	}
	f.markS3Available()

	s3NotAfter, ok := certNotAfter(s3Data)
	if !ok || !s3NotAfter.After(notAfter) {
		return local // S3 copy is not newer.
	}

	// Fetch-then-swap: persist the newer cert locally BEFORE serving it, so a
	// crash between the two cannot leave the local tier ahead of what we return.
	f.logger.Info("FallbackCache: adopted renewed certificate from S3",
		"name", key, "local_expiry", notAfter, "s3_expiry", s3NotAfter)
	if putErr := f.fallback.Put(ctx, key, s3Data); putErr != nil {
		f.logger.Warn("FallbackCache: failed to persist renewed certificate locally", "name", key, "error", putErr)
	}
	return s3Data
}

// RefreshFromS3 bypasses the local tier and fetches a key directly from S3,
// persisting it locally on success. Cluster followers use this on a hard local
// miss to pick up a certificate the leader has just published; the plain Get
// path cannot serve this case because it prefers the local copy.
func (f *FallbackCache) RefreshFromS3(ctx context.Context, key string) ([]byte, error) {
	if !f.isS3Available() {
		return nil, autocert.ErrCacheMiss
	}

	s3Ctx, s3Cancel := context.WithTimeout(ctx, 5*time.Second)
	defer s3Cancel()

	data, err := f.primary.Get(s3Ctx, key)
	if err != nil {
		if err != autocert.ErrCacheMiss {
			f.logger.Warn("FallbackCache: RefreshFromS3 failed", "name", key, "error", err)
			f.markS3Unavailable()
		}
		return nil, autocert.ErrCacheMiss
	}
	f.markS3Available()

	if !isChallengeToken(key) {
		if putErr := f.fallback.Put(ctx, key, data); putErr != nil {
			f.logger.Warn("FallbackCache: failed to persist refreshed certificate locally", "name", key, "error", putErr)
		}
	}
	return data, nil
}

// Put stores a certificate, trying S3 first (source of truth), then falling back to local cache.
// Matches mizu architecture: S3 is primary storage, local is fallback for resilience.
//
// Challenge tokens go to S3 only: they exist so that OTHER nodes can serve the
// validation, a local-only copy is useless for that, and a stale local copy
// under the fixed "domain+token" key breaks future validations.
//
// NOTE: autocert IGNORES errors from challenge-token Puts (putHTTPToken and
// putCertToken) — a failed publish does not abort or defer the ACME flow; the
// issuance proceeds with the token held only in the issuing node's memory, and
// validation then succeeds only if the CA's probe happens to land on this
// node. The error return and the loud log below are the observable signal; the
// cert warmer additionally defers whole warm passes while S3 is unhealthy to
// shrink this window.
func (f *FallbackCache) Put(ctx context.Context, key string, data []byte) error {
	if isChallengeToken(key) {
		// A fresh token supersedes any briefly cached read result for its key
		// (a miss cached moments before this publish must not be served to
		// the CA's validation probe).
		defer func() {
			f.tokenMu.Lock()
			delete(f.tokenResults, key)
			f.tokenMu.Unlock()
		}()

		if !f.isS3Available() {
			return fmt.Errorf("S3 unavailable - cannot publish challenge token %q for cluster-wide validation", key)
		}
		if err := f.primary.Put(ctx, key, data); err != nil {
			f.logger.Warn("FallbackCache: failed to publish challenge token to S3 - validation may fail", "name", key, "error", err)
			f.markS3Unavailable()
			return err
		}
		f.markS3Available()
		return nil
	}

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
		defer func() {
			if r := recover(); r != nil {
				f.logger.Error("panic in background S3 sync", "panic", r)
			}
		}()
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
// For challenge tokens the local delete also covers legacy copies cached by
// earlier versions that still wrote tokens to the local tier.
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
			// Contents differ. For certificate bundles, do NOT blindly overwrite
			// S3 with the local copy: a byte difference does not tell us which is
			// newer, and pushing a stale local cert over a freshly-renewed S3 cert
			// (e.g. this node restarted with a pre-renewal cert on disk) resurrects
			// the old cert cluster-wide. Compare expiry: if S3 is newer, adopt it
			// locally (so this node stops serving the stale cert) and leave S3 alone.
			if localExp, ok := certNotAfter(data); ok {
				if s3Exp, ok2 := certNotAfter(s3Data); ok2 && s3Exp.After(localExp) {
					f.logger.Info("S3 certificate is newer than local — refreshing local, not overwriting S3",
						"name", name, "local_expiry", localExp, "s3_expiry", s3Exp)
					if putErr := f.fallback.Put(ctx, name, s3Data); putErr != nil {
						f.logger.Warn("failed to refresh local certificate from S3", "name", name, "error", putErr)
					}
					skipped++
					continue
				}
			}
			// Local is newer (or not a comparable certificate) - sync it up.
			f.logger.Debug("certificate differs in S3, syncing local up", "name", name)
		} else if err != autocert.ErrCacheMiss {
			// Transient S3 error (timeout, network, etc.) - skip this cert.
			// Do NOT re-upload: we can't confirm the cert is missing vs S3 being unreachable.
			// Re-uploading on transient errors causes massive S3 object accumulation.
			f.logger.Warn("transient S3 error checking certificate - skipping sync", "name", name, "error", err)
			skipped++
			continue
		}
		// If err == autocert.ErrCacheMiss, cert is genuinely missing from S3 - sync it

		// If this is an ephemeral ACME challenge token that is missing in S3, it was
		// likely completed and deleted by the cluster leader. Instead of resurrecting
		// it in S3, clean up our local orphaned copy. This must cover http-01 tokens
		// (<token>+http-01), the challenge type used here, not just tls-alpn (+token).
		if err == autocert.ErrCacheMiss && isChallengeToken(name) {
			f.logger.Info("cleaning up orphaned challenge token from local cache", "name", name)
			if delErr := f.fallback.Delete(ctx, name); delErr != nil {
				f.logger.Warn("failed to delete orphaned token from local cache", "name", name, "error", delErr)
			}
			continue
		}

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
