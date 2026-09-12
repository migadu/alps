package storage

import (
	"testing"
	"time"
)

// close of a closed channel panics, and Manager.Close is itself unguarded, so
// Stop has to tolerate being called twice.
func TestCertSyncWorker_StopIsIdempotent(t *testing.T) {
	w := NewCertSyncWorker(nil, time.Hour, discardLogger())
	close(w.doneCh) // stand in for a worker that has already exited

	w.Stop(time.Millisecond)
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("second Stop panicked: %v", r)
		}
	}()
	w.Stop(time.Millisecond)
}

// The whole point of moving the recover inside the loop: a panicking sync must
// not end the worker.
func TestRunSyncSafely_ContainsAPanic(t *testing.T) {
	w := NewCertSyncWorker(nil, time.Hour, discardLogger())
	// fallbackCache is nil, so runSync's NeedsSync() call panics.
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("panic escaped runSyncSafely: %v", r)
		}
	}()
	w.runSyncSafely()
	w.runSyncSafely() // and the loop can keep going
}
