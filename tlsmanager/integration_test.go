//go:build integration

package tlsmanager

import (
	"context"
	"log/slog"
	"os"
	"sync"
	"testing"
	"time"
)

// Integration tests require a running S3-compatible server.
// Run with: MINIO_ENDPOINT=localhost:9000 MINIO_ACCESS_KEY=minioadmin MINIO_SECRET_KEY=minioadmin go test -tags=integration ./tlsmanager -v

func getTestConfig(t *testing.T) S3StorageConfig {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		t.Skip("MINIO_ENDPOINT not set, skipping integration test")
	}

	return S3StorageConfig{
		Endpoint:        endpoint,
		Bucket:          os.Getenv("MINIO_BUCKET"),
		AccessKeyID:     os.Getenv("MINIO_ACCESS_KEY"),
		SecretAccessKey: os.Getenv("MINIO_SECRET_KEY"),
		DisableTLS:      true,
		LockTimeout:     5 * time.Second, // Short timeout for tests
		Prefix:          "test-" + time.Now().Format("20060102-150405") + "/",
	}
}

func TestS3StorageIntegration(t *testing.T) {
	cfg := getTestConfig(t)
	if cfg.Bucket == "" {
		cfg.Bucket = "test-bucket"
	}

	storage, err := NewS3Storage(cfg, slog.Default())
	if err != nil {
		t.Fatalf("NewS3Storage: %v", err)
	}

	ctx := context.Background()
	testKey := "integration-test/cert.pem"
	testData := []byte("test certificate data for integration test")

	// Cleanup at end
	defer storage.Delete(ctx, testKey)

	t.Run("Store and Load", func(t *testing.T) {
		if err := storage.Store(ctx, testKey, testData); err != nil {
			t.Fatalf("Store: %v", err)
		}

		loaded, err := storage.Load(ctx, testKey)
		if err != nil {
			t.Fatalf("Load: %v", err)
		}

		if string(loaded) != string(testData) {
			t.Errorf("loaded data mismatch: got %q, want %q", loaded, testData)
		}
	})

	t.Run("Exists", func(t *testing.T) {
		if !storage.Exists(ctx, testKey) {
			t.Error("Exists returned false for existing key")
		}

		if storage.Exists(ctx, "nonexistent/key/12345") {
			t.Error("Exists returned true for nonexistent key")
		}
	})

	t.Run("Stat", func(t *testing.T) {
		info, err := storage.Stat(ctx, testKey)
		if err != nil {
			t.Fatalf("Stat: %v", err)
		}

		if info.Key != testKey {
			t.Errorf("Key = %q, want %q", info.Key, testKey)
		}
		if info.Size != int64(len(testData)) {
			t.Errorf("Size = %d, want %d", info.Size, len(testData))
		}
	})

	t.Run("List", func(t *testing.T) {
		keys, err := storage.List(ctx, "integration-test/", true)
		if err != nil {
			t.Fatalf("List: %v", err)
		}

		found := false
		for _, k := range keys {
			if k == testKey {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("List did not include %q, got %v", testKey, keys)
		}
	})

	t.Run("Delete", func(t *testing.T) {
		if err := storage.Delete(ctx, testKey); err != nil {
			t.Fatalf("Delete: %v", err)
		}

		if storage.Exists(ctx, testKey) {
			t.Error("key still exists after Delete")
		}
	})
}

func TestS3LockingIntegration(t *testing.T) {
	cfg := getTestConfig(t)
	if cfg.Bucket == "" {
		cfg.Bucket = "test-bucket"
	}
	cfg.LockTimeout = 3 * time.Second // Short for testing

	storage, err := NewS3Storage(cfg, slog.Default())
	if err != nil {
		t.Fatalf("NewS3Storage: %v", err)
	}

	ctx := context.Background()
	lockKey := "lock-test/resource"

	// Cleanup
	defer storage.Unlock(ctx, lockKey)

	t.Run("Lock and Unlock", func(t *testing.T) {
		if err := storage.Lock(ctx, lockKey); err != nil {
			t.Fatalf("Lock: %v", err)
		}

		// Should be able to re-lock (we own it)
		if err := storage.Lock(ctx, lockKey); err != nil {
			t.Fatalf("Re-lock by owner: %v", err)
		}

		if err := storage.Unlock(ctx, lockKey); err != nil {
			t.Fatalf("Unlock: %v", err)
		}
	})

	t.Run("Lock contention", func(t *testing.T) {
		// Create two storage instances with different lock owner IDs
		cfg1 := cfg
		cfg1.NodeID = "node-1"
		s1, err := NewS3Storage(cfg1, slog.Default())
		if err != nil {
			t.Fatalf("NewS3Storage s1: %v", err)
		}

		cfg2 := cfg
		cfg2.NodeID = "node-2"
		s2, err := NewS3Storage(cfg2, slog.Default())
		if err != nil {
			t.Fatalf("NewS3Storage s2: %v", err)
		}

		contentionKey := "contention-test/resource"
		defer s1.Unlock(ctx, contentionKey)
		defer s2.Unlock(ctx, contentionKey)

		// s1 acquires lock
		if err := s1.Lock(ctx, contentionKey); err != nil {
			t.Fatalf("s1.Lock: %v", err)
		}

		// s2 should fail to acquire (with short timeout)
		ctx2, cancel := context.WithTimeout(ctx, 2*time.Second)
		defer cancel()

		err = s2.Lock(ctx2, contentionKey)
		if err == nil {
			t.Error("s2 should not acquire lock held by s1")
		}

		// s1 releases
		if err := s1.Unlock(ctx, contentionKey); err != nil {
			t.Fatalf("s1.Unlock: %v", err)
		}

		// Now s2 should succeed
		if err := s2.Lock(ctx, contentionKey); err != nil {
			t.Fatalf("s2.Lock after s1 release: %v", err)
		}

		s2.Unlock(ctx, contentionKey)
	})

	t.Run("Lock expiry", func(t *testing.T) {
		cfg1 := cfg
		cfg1.NodeID = "expiry-node-1"
		cfg1.LockTimeout = 2 * time.Second // Very short TTL
		s1, err := NewS3Storage(cfg1, slog.Default())
		if err != nil {
			t.Fatalf("NewS3Storage s1: %v", err)
		}

		cfg2 := cfg
		cfg2.NodeID = "expiry-node-2"
		s2, err := NewS3Storage(cfg2, slog.Default())
		if err != nil {
			t.Fatalf("NewS3Storage s2: %v", err)
		}

		expiryKey := "expiry-test/resource"
		defer s1.Unlock(ctx, expiryKey)
		defer s2.Unlock(ctx, expiryKey)

		// s1 acquires lock
		if err := s1.Lock(ctx, expiryKey); err != nil {
			t.Fatalf("s1.Lock: %v", err)
		}

		// Wait for lock to expire
		time.Sleep(3 * time.Second)

		// s2 should now be able to acquire (lock expired)
		ctx2, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()

		if err := s2.Lock(ctx2, expiryKey); err != nil {
			t.Fatalf("s2.Lock after expiry: %v", err)
		}

		s2.Unlock(ctx, expiryKey)
	})
}

func TestS3ConcurrentLocking(t *testing.T) {
	cfg := getTestConfig(t)
	if cfg.Bucket == "" {
		cfg.Bucket = "test-bucket"
	}
	cfg.LockTimeout = 10 * time.Second

	storage, err := NewS3Storage(cfg, slog.Default())
	if err != nil {
		t.Fatalf("NewS3Storage: %v", err)
	}

	ctx := context.Background()
	concurrentKey := "concurrent-test/resource"
	defer storage.Unlock(ctx, concurrentKey)

	// Launch multiple goroutines trying to acquire the same lock
	const numWorkers = 5
	var wg sync.WaitGroup
	acquired := make(chan int, numWorkers)

	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			cfg := cfg
			cfg.NodeID = "worker-" + string(rune('A'+id))
			s, err := NewS3Storage(cfg, slog.Default())
			if err != nil {
				t.Logf("worker %d: NewS3Storage failed: %v", id, err)
				return
			}

			ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
			defer cancel()

			if err := s.Lock(ctx, concurrentKey); err != nil {
				t.Logf("worker %d: Lock failed: %v", id, err)
				return
			}

			acquired <- id
			time.Sleep(100 * time.Millisecond) // Hold lock briefly
			s.Unlock(context.Background(), concurrentKey)
		}(i)
	}

	wg.Wait()
	close(acquired)

	// Count how many acquired the lock
	count := 0
	for range acquired {
		count++
	}

	// At least one should have acquired it
	if count == 0 {
		t.Error("no worker acquired the lock")
	}

	t.Logf("%d/%d workers acquired the lock sequentially", count, numWorkers)
}
