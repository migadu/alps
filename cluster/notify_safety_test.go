package cluster

import (
	"testing"
	"time"
)

// The memberlist event delegate (NotifyJoin/NotifyLeave) spawns leadership
// updates on fresh goroutines, where an unrecovered panic kills the whole
// process. Both must run through the same recover as the ticker loop.
func TestRunSafelyRecoversPanic(t *testing.T) {
	c := &Cluster{logger: testLogger()}

	done := make(chan struct{})
	go func() {
		defer close(done)
		c.runSafely(func() { panic("memberlist read during shutdown") })
	}()

	select {
	case <-done:
		// recovered; the goroutine survived
	case <-time.After(2 * time.Second):
		t.Fatal("runSafely did not return after a panic")
	}
}
