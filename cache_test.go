package alps

import (
	"sync"
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

// A value patched from the one the cache held keeps that one's lifetime.
func TestCacheReplaceKeepsTheExpiry(t *testing.T) {
	c := NewCache(200 * time.Millisecond)
	defer c.Close()

	if c.Replace("list", "patched") {
		t.Fatal("Replace stored a key the cache did not hold")
	}
	if _, ok := c.Get("list"); ok {
		t.Fatal("Replace stored a key the cache did not hold")
	}

	c.Set("list", "read")
	time.Sleep(120 * time.Millisecond)
	if !c.Replace("list", "patched") {
		t.Fatal("Replace refused a live entry")
	}
	if v, ok := c.Get("list"); !ok || v != "patched" {
		t.Fatalf("the entry is %v (%v) after Replace, want the patched value", v, ok)
	}
	time.Sleep(120 * time.Millisecond)
	if _, ok := c.Get("list"); ok {
		t.Error("the replaced entry outlived the one it replaced")
	}
}

// A patch is no fresher than the entry it read, and cannot restore an entry
// invalidated while a caller was enumerating cache keys.
func TestCacheUpdateKeepsExpiryAndMissingEntriesAbsent(t *testing.T) {
	c := NewCache(time.Minute)
	defer c.Close()
	c.Set("live", 1)
	c.mu.RLock()
	expires := c.entries["live"].Expiration
	c.mu.RUnlock()
	if !c.Update("live", func(value interface{}) interface{} { return value.(int) + 1 }) {
		t.Fatal("a live entry was not updated")
	}
	if value, ok := c.Get("live"); !ok || value != 2 {
		t.Fatalf("updated value = %v, live = %v; want 2", value, ok)
	}
	c.mu.RLock()
	updatedExpiry := c.entries["live"].Expiration
	c.mu.RUnlock()
	if !updatedExpiry.Equal(expires) {
		t.Errorf("update moved expiry from %s to %s", expires, updatedExpiry)
	}

	c.Set("deleted", 1)
	c.Delete("deleted")
	c.Set("expired", 1)
	c.mu.Lock()
	c.entries["expired"].Expiration = time.Now().Add(-time.Second)
	c.mu.Unlock()
	for _, key := range []string{"missing", "deleted", "expired"} {
		called := false
		if c.Update(key, func(interface{}) interface{} { called = true; return 2 }) || called {
			t.Errorf("update called its callback for %s", key)
		}
		if _, ok := c.Get(key); ok {
			t.Errorf("update restored %s", key)
		}
	}
	if !c.Update("live", func(interface{}) interface{} { return nil }) {
		t.Fatal("the live entry could not be dropped")
	}
	if _, ok := c.Get("live"); ok {
		t.Error("the callback's nil result did not drop the entry")
	}
}

// Independent concurrent patches must all reach the published value.
func TestCacheUpdateDoesNotLoseConcurrentChanges(t *testing.T) {
	c := NewCache(time.Minute)
	defer c.Close()
	c.Set("count", 0)
	var wg sync.WaitGroup
	start := make(chan struct{})
	for range 20 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			for range 100 {
				c.Update("count", func(value interface{}) interface{} { return value.(int) + 1 })
			}
		}()
	}
	close(start)
	wg.Wait()
	if got, _ := c.Get("count"); got != 2000 {
		t.Errorf("concurrent patches left %v, want 2000", got)
	}
}

// Delete must win over a patch whose callback is already running: publishing
// the old value after Delete would resurrect a stale cache entry.
func TestCacheUpdateCannotUndoConcurrentInvalidation(t *testing.T) {
	c := NewCache(time.Minute)
	defer c.Close()
	c.Set("thread", "old")
	entered, release := make(chan struct{}), make(chan struct{})
	updated, deleted := make(chan struct{}), make(chan struct{})
	go func() {
		defer close(updated)
		c.Update("thread", func(interface{}) interface{} {
			close(entered)
			<-release
			return "patched"
		})
	}()
	<-entered
	deleting := make(chan struct{})
	go func() {
		close(deleting)
		c.Delete("thread")
		close(deleted)
	}()
	<-deleting
	close(release)
	<-updated
	<-deleted
	if _, ok := c.Get("thread"); ok {
		t.Error("the patch restored an invalidated conversation")
	}
}
