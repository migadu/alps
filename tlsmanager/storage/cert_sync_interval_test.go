package storage

import (
	"testing"
	"time"
)

func TestCertSyncWorkerKeepsRunningWithNonPositiveInterval(t *testing.T) {
	for _, interval := range []time.Duration{-time.Minute, 0} {
		t.Run(interval.String(), func(t *testing.T) {
			cache := NewFallbackCache(t.TempDir(), nil, discardLogger())
			worker := NewCertSyncWorker(cache, interval, discardLogger())
			worker.Start()
			defer worker.Stop(time.Second)
			select {
			case <-worker.doneCh:
				t.Fatal("worker exited before being stopped")
			case <-time.After(20 * time.Millisecond):
			}
		})
	}
}
