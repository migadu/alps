package storage

import (
	"context"
	"log/slog"
	"sync"
	"time"
)

// CertSyncWorker manages periodic synchronization of certificates from local cache to S3.
type CertSyncWorker struct {
	fallbackCache    *FallbackCache
	syncInterval     time.Duration
	logger           *slog.Logger
	stopCh           chan struct{}
	doneCh           chan struct{}
	stopOnce         sync.Once // guards close(stopCh)
	consecutiveFails int       // Tracks consecutive sync failures for log escalation
}

// NewCertSyncWorker creates a new certificate sync worker.
func NewCertSyncWorker(fallbackCache *FallbackCache, syncInterval time.Duration, logger *slog.Logger) *CertSyncWorker {
	return &CertSyncWorker{
		fallbackCache: fallbackCache,
		syncInterval:  syncInterval,
		logger:        logger,
		stopCh:        make(chan struct{}),
		doneCh:        make(chan struct{}),
	}
}

// Start begins the periodic sync worker in a background goroutine.
func (w *CertSyncWorker) Start() {
	w.logger.Info("starting certificate sync worker", "interval", w.syncInterval)

	go func() {
		defer close(w.doneCh)
		defer func() {
			if r := recover(); r != nil {
				w.logger.Error("panic in certificate sync worker", "panic", r)
			}
		}()

		// One-time startup sync: push local certs to S3 if they're missing there.
		// This covers the case where S3 was wiped or certs exist only locally.
		// Unlike periodic syncs, this always runs to ensure S3 has all certs.
		w.logger.Info("certificate sync worker: running startup sync from local cache to S3")
		w.runStartupSync()

		ticker := time.NewTicker(w.syncInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				w.runSyncSafely()
			case <-w.stopCh:
				w.logger.Info("certificate sync worker stopped")
				return
			}
		}
	}()
}

// runSyncSafely runs one sync with its own recover.
//
// The recover was a single defer on the goroutine itself, OUTSIDE the for, so a
// panic in SyncAllToS3 unwound the whole loop and the worker returned for good —
// and nothing restarts it. Certificate replication to S3 would then be over for
// the life of the process, silently.
//
// Silently is the word that matters. runSync below escalates a persistent
// FAILURE to "PERSISTENT SYNC FAILURE: certificates are NOT being replicated to
// S3", precisely so a broken S3 cannot go unnoticed. A panic killed the worker
// outright and logged one line, after which there was nothing left to escalate:
// the recoverable path was loud and the fatal one quiet.
//
// Same fix as cache.go (1701e4e) and the cert warmer beside it.
func (w *CertSyncWorker) runSyncSafely() {
	defer func() {
		if r := recover(); r != nil {
			w.logger.Error("panic in certificate sync - continuing", "panic", r)
		}
	}()
	w.runSync()
}

// runStartupSync runs an initial sync on startup, always comparing with S3
// to ensure all local certs are uploaded. This is different from periodic syncs
// which only run when needsSync is true.
func (w *CertSyncWorker) runStartupSync() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	if err := w.fallbackCache.SyncAllToS3(ctx); err != nil {
		w.logger.Warn("certificate sync worker: startup sync had errors", "error", err)
	} else {
		w.logger.Info("certificate sync worker: startup sync complete")
	}
}

// Stop gracefully shuts down the sync worker.
//
// Guarded, because close of an already-closed channel panics and this is
// reachable twice — Manager.Close is itself unguarded, and is both deferred
// from main and exported. certWarmer.Stop in this same package already used a
// sync.Once for the identical shape; this did not.
func (w *CertSyncWorker) Stop(timeout time.Duration) {
	w.logger.Info("stopping certificate sync worker")
	w.stopOnce.Do(func() { close(w.stopCh) })

	// Wait for worker to finish with timeout
	select {
	case <-w.doneCh:
		w.logger.Info("certificate sync worker stopped gracefully")
	case <-time.After(timeout):
		w.logger.Warn("certificate sync worker stop timed out")
	}
}

// runSync performs a single sync operation with escalating severity on
// consecutive failures so persistent S3 issues are impossible to miss.
// Only syncs when there are local-only certs that need to be pushed to S3
// to avoid downloading all certs from S3 on every tick just to compare them.
func (w *CertSyncWorker) runSync() {
	// Only sync when there are local-only certs that need to be pushed to S3.
	// This avoids downloading all certs from S3 on every tick just to compare them.
	if !w.fallbackCache.NeedsSync() {
		w.logger.Debug("certificate sync: no sync needed, skipping")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	w.logger.Debug("running certificate sync")
	if err := w.fallbackCache.SyncAllToS3(ctx); err != nil {
		w.consecutiveFails++

		switch {
		case w.consecutiveFails <= 3:
			w.logger.Error("certificate sync failed", "error", err,
				"consecutive_failures", w.consecutiveFails)
		default:
			// After 3+ consecutive failures, add prominent warning that
			// certificates may not be replicated to S3.
			w.logger.Error("PERSISTENT SYNC FAILURE: certificates are NOT being replicated to S3 — investigate S3 connectivity/credentials",
				"error", err,
				"consecutive_failures", w.consecutiveFails,
				"sync_interval", w.syncInterval)
		}
	} else {
		if w.consecutiveFails > 0 {
			w.logger.Info("certificate sync recovered after failures",
				"previous_consecutive_failures", w.consecutiveFails)
		}
		w.consecutiveFails = 0
	}
}
