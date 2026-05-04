package alps

import (
	"strings"
	"sync"
	"time"
)

// CacheEntry holds a cached value with expiration time.
type CacheEntry struct {
	Value      interface{}
	Expiration time.Time
}

// Cache is a simple in-memory cache with expiration.
type Cache struct {
	mu      sync.RWMutex
	entries map[string]*CacheEntry
	ttl     time.Duration
}

// cacheCleanupManager manages cleanup for all cache instances
type cacheCleanupManager struct {
	mu     sync.RWMutex
	caches []*Cache
	once   sync.Once
	stop   chan struct{}
}

var globalCleanupManager = &cacheCleanupManager{
	stop: make(chan struct{}),
}

// startGlobalCleanup starts the global cleanup goroutine (called once)
func (m *cacheCleanupManager) startGlobalCleanup() {
	m.once.Do(func() {
		go m.cleanupLoop()
	})
}

// cleanupLoop is the single global cleanup goroutine
func (m *cacheCleanupManager) cleanupLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			m.mu.RLock()
			caches := make([]*Cache, len(m.caches))
			copy(caches, m.caches)
			m.mu.RUnlock()

			// Clean each cache
			for _, c := range caches {
				c.cleanupExpired()
			}
		case <-m.stop:
			return
		}
	}
}

// register adds a cache to the cleanup manager
func (m *cacheCleanupManager) register(c *Cache) {
	m.mu.Lock()
	m.caches = append(m.caches, c)
	m.mu.Unlock()
	m.startGlobalCleanup()
}

// unregister removes a cache from the cleanup manager
func (m *cacheCleanupManager) unregister(c *Cache) {
	m.mu.Lock()
	defer m.mu.Unlock()

	for i, cache := range m.caches {
		if cache == c {
			// Swap with the last element and nil it out to prevent memory leaks
			lastIdx := len(m.caches) - 1
			m.caches[i] = m.caches[lastIdx]
			m.caches[lastIdx] = nil
			m.caches = m.caches[:lastIdx]
			return
		}
	}
}

// NewCache creates a new cache with the given TTL.
func NewCache(ttl time.Duration) *Cache {
	c := &Cache{
		entries: make(map[string]*CacheEntry),
		ttl:     ttl,
	}
	// Register with global cleanup manager
	globalCleanupManager.register(c)
	return c
}

// Get retrieves a value from the cache.
func (c *Cache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, exists := c.entries[key]
	if !exists {
		return nil, false
	}

	if time.Now().After(entry.Expiration) {
		return nil, false
	}

	return entry.Value, true
}

// Set stores a value in the cache.
func (c *Cache) Set(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries[key] = &CacheEntry{
		Value:      value,
		Expiration: time.Now().Add(c.ttl),
	}
}

// Delete removes a value from the cache.
func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.entries, key)
}

// Clear removes all entries from the cache.
func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries = make(map[string]*CacheEntry)
}

// Close unregisters the cache from the global cleanup manager.
// Should be called when the cache is no longer needed (e.g., session cleanup).
func (c *Cache) Close() {
	globalCleanupManager.unregister(c)
}

// DeletePrefix removes all entries with keys starting with the given prefix.
func (c *Cache) DeletePrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.entries {
		if strings.HasPrefix(key, prefix) {
			delete(c.entries, key)
		}
	}
}

// GetKeysWithPrefix returns all keys that start with the given prefix.
func (c *Cache) GetKeysWithPrefix(prefix string) []string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	var keys []string
	for key := range c.entries {
		if strings.HasPrefix(key, prefix) {
			keys = append(keys, key)
		}
	}
	return keys
}

// cleanupExpired removes expired entries from this cache.
// Called by the global cleanup manager.
func (c *Cache) cleanupExpired() {
	// First, find expired keys without holding the lock for long
	c.mu.RLock()
	now := time.Now()
	var expiredKeys []string
	for key, entry := range c.entries {
		if now.After(entry.Expiration) {
			expiredKeys = append(expiredKeys, key)
		}
	}
	c.mu.RUnlock()

	// Then delete them with a write lock, one at a time to minimize lock contention
	if len(expiredKeys) > 0 {
		c.mu.Lock()
		for _, key := range expiredKeys {
			// Re-check expiration in case entry was updated while we didn't have the lock
			if entry, exists := c.entries[key]; exists && now.After(entry.Expiration) {
				delete(c.entries, key)
			}
		}
		c.mu.Unlock()
	}
}
