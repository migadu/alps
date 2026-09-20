package alps

import (
	"testing"
	"time"
)

// registered reports whether the manager is holding this cache, without keeping
// its lock across an assertion.
//
// t.Fatalf ends the goroutine through runtime.Goexit. Nothing unwinds — only
// deferred calls run — so a lock taken inline and released inline is never
// released at all. These assertions used to sit INSIDE globalCleanupManager's
// read lock, and the first one to fail left it held: the next NewCache blocked
// in register() forever, and the package's test binary ran to its ten-minute
// timeout and panicked naming TestCacheConcurrency, a test that was only
// waiting its turn. One wrong count, reported as a deadlock somewhere else.
func registered(c *Cache) bool {
	globalCleanupManager.mu.RLock()
	defer globalCleanupManager.mu.RUnlock()
	for _, held := range globalCleanupManager.caches {
		if held == c {
			return true
		}
	}
	return false
}

func TestCacheCleanupManager(t *testing.T) {
	// Create multiple caches
	cache1 := NewCache(100 * time.Millisecond)
	cache2 := NewCache(100 * time.Millisecond)
	cache3 := NewCache(100 * time.Millisecond)

	// Named, not counted. The manager is process-global and this is not the only
	// test in the package that makes caches — a session registers one of its own
	// and closes it on teardown — so its SIZE here is whatever else has run and
	// whatever else is still finishing. Whether it is holding these three is a
	// question only about these three.
	for i, c := range []*Cache{cache1, cache2, cache3} {
		if !registered(c) {
			t.Fatalf("Expected cache%d to be registered", i+1)
		}
	}

	// Add entries to each cache
	cache1.Set("key1", "value1")
	cache2.Set("key2", "value2")
	cache3.Set("key3", "value3")

	// Verify entries exist
	if _, ok := cache1.Get("key1"); !ok {
		t.Fatal("Expected key1 to exist in cache1")
	}
	if _, ok := cache2.Get("key2"); !ok {
		t.Fatal("Expected key2 to exist in cache2")
	}
	if _, ok := cache3.Get("key3"); !ok {
		t.Fatal("Expected key3 to exist in cache3")
	}

	// Wait for entries to expire and cleanup to run
	time.Sleep(150 * time.Millisecond)

	// Trigger cleanup manually to ensure it runs — on these three, rather than on
	// every cache the process happens to hold.
	for _, c := range []*Cache{cache1, cache2, cache3} {
		c.cleanupExpired()
	}

	// Verify entries are gone after expiration
	if _, ok := cache1.Get("key1"); ok {
		t.Fatal("Expected key1 to be expired in cache1")
	}
	if _, ok := cache2.Get("key2"); ok {
		t.Fatal("Expected key2 to be expired in cache2")
	}
	if _, ok := cache3.Get("key3"); ok {
		t.Fatal("Expected key3 to be expired in cache3")
	}

	// Close one cache
	cache1.Close()

	// Verify it's unregistered, and that closing it took nothing else with it
	if registered(cache1) {
		t.Fatal("Expected cache1 to be unregistered after Close")
	}
	if !registered(cache2) || !registered(cache3) {
		t.Fatal("Expected cache2 and cache3 to still be registered")
	}

	// Clean up remaining caches
	cache2.Close()
	cache3.Close()

	for i, c := range []*Cache{cache2, cache3} {
		if registered(c) {
			t.Fatalf("Expected cache%d to be unregistered after Close", i+2)
		}
	}
}

func TestCacheConcurrency(t *testing.T) {
	cache := NewCache(1 * time.Second)
	defer cache.Close()

	// Concurrent writes
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func(n int) {
			for j := 0; j < 100; j++ {
				cache.Set("key", n*100+j)
			}
			done <- true
		}(i)
	}

	// Wait for all writes
	for i := 0; i < 10; i++ {
		<-done
	}

	// Verify cache still works
	if _, ok := cache.Get("key"); !ok {
		t.Fatal("Expected key to exist after concurrent writes")
	}
}

func TestGlobalCleanupSingleGoroutine(t *testing.T) {
	// Create multiple caches to ensure only one cleanup goroutine is created
	caches := make([]*Cache, 100)
	for i := 0; i < 100; i++ {
		caches[i] = NewCache(1 * time.Second)
	}

	// Verify all caches are registered
	globalCleanupManager.mu.RLock()
	count := len(globalCleanupManager.caches)
	globalCleanupManager.mu.RUnlock()

	if count < 100 {
		t.Fatalf("Expected at least 100 caches registered, got %d", count)
	}

	// Clean up
	for _, c := range caches {
		c.Close()
	}
}

// Stop must tolerate being called more than once: Server.Close is reachable
// from a shutdown path and from deferred cleanup, and `close` of a closed
// channel panics.
func TestScheduler_StopIsIdempotent(t *testing.T) {
	s := NewScheduler(time.Hour)
	s.Stop()
	s.Stop() // would panic without the guard
}
