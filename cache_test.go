package alps

import (
	"testing"
	"time"
)

func TestCacheCleanupManager(t *testing.T) {
	// Create multiple caches
	cache1 := NewCache(100 * time.Millisecond)
	cache2 := NewCache(100 * time.Millisecond)
	cache3 := NewCache(100 * time.Millisecond)

	// Verify all caches are registered
	globalCleanupManager.mu.RLock()
	if len(globalCleanupManager.caches) != 3 {
		t.Fatalf("Expected 3 caches registered, got %d", len(globalCleanupManager.caches))
	}
	globalCleanupManager.mu.RUnlock()

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

	// Trigger cleanup manually to ensure it runs
	globalCleanupManager.mu.RLock()
	caches := make([]*Cache, len(globalCleanupManager.caches))
	copy(caches, globalCleanupManager.caches)
	globalCleanupManager.mu.RUnlock()

	for _, c := range caches {
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

	// Verify it's unregistered
	globalCleanupManager.mu.RLock()
	if len(globalCleanupManager.caches) != 2 {
		t.Fatalf("Expected 2 caches after Close, got %d", len(globalCleanupManager.caches))
	}
	globalCleanupManager.mu.RUnlock()

	// Clean up remaining caches
	cache2.Close()
	cache3.Close()

	globalCleanupManager.mu.RLock()
	if len(globalCleanupManager.caches) != 0 {
		t.Fatalf("Expected 0 caches after all Close, got %d", len(globalCleanupManager.caches))
	}
	globalCleanupManager.mu.RUnlock()
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
