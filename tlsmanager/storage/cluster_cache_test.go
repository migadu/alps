package storage

import (
	"bytes"
	"context"
	"sync"
	"testing"

	"golang.org/x/crypto/acme/autocert"
)

// recordingCache is a minimal in-memory autocert.Cache for gate tests.
type recordingCache struct {
	mu sync.Mutex
	m  map[string][]byte
}

func newRecordingCache() *recordingCache {
	return &recordingCache{m: make(map[string][]byte)}
}

func (c *recordingCache) Get(_ context.Context, name string) ([]byte, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if d, ok := c.m[name]; ok {
		return d, nil
	}
	return nil, autocert.ErrCacheMiss
}

func (c *recordingCache) Put(_ context.Context, name string, data []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.m[name] = data
	return nil
}

func (c *recordingCache) Delete(_ context.Context, name string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.m, name)
	return nil
}

func (c *recordingCache) has(name string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	_, ok := c.m[name]
	return ok
}

func TestClusterAwareCache_NonLeaderCertWriteAbsorbed(t *testing.T) {
	under := newRecordingCache()
	cc := NewClusterAwareCache(under, func() bool { return false }, discardLogger())
	ctx := context.Background()

	// Absorbed: nil error (so autocert's renewal loop completes instead of
	// re-issuing every 30-60min), but nothing persisted.
	if err := cc.Put(ctx, "example.com", []byte("cert")); err != nil {
		t.Errorf("non-leader cert Put must be absorbed with nil error, got %v", err)
	}
	if under.has("example.com") {
		t.Error("non-leader cert write must NOT reach the shared store")
	}
}

func TestClusterAwareCache_LeaderCertWritePersisted(t *testing.T) {
	under := newRecordingCache()
	cc := NewClusterAwareCache(under, func() bool { return true }, discardLogger())
	ctx := context.Background()

	if err := cc.Put(ctx, "example.com", []byte("cert")); err != nil {
		t.Fatalf("leader Put: %v", err)
	}
	if !under.has("example.com") {
		t.Error("leader cert write must be persisted")
	}
}

func TestClusterAwareCache_TokensAndAccountKeyPassThrough(t *testing.T) {
	under := newRecordingCache()
	cc := NewClusterAwareCache(under, func() bool { return false }, discardLogger())
	ctx := context.Background()

	// Challenge tokens: any node running a validation must be able to
	// publish and clean up its token.
	for _, key := range []string{"example.com+token", "sometoken+http-01"} {
		if err := cc.Put(ctx, key, []byte("tok")); err != nil {
			t.Errorf("non-leader token Put(%q) must pass through: %v", key, err)
		}
		if !under.has(key) {
			t.Errorf("token %q must reach the shared store", key)
		}
		if err := cc.Delete(ctx, key); err != nil {
			t.Errorf("non-leader token Delete(%q) must pass through: %v", key, err)
		}
		if under.has(key) {
			t.Errorf("token %q must be deletable by a non-leader", key)
		}
	}

	// ACME account key (current and legacy names): blocking it errors out
	// issuance entirely, and escape-hatch issuance must reuse the shared
	// account rather than registering a new one per issuance.
	for _, key := range []string{"acme_account+key", "acme_account.key"} {
		if err := cc.Put(ctx, key, []byte("key")); err != nil {
			t.Errorf("non-leader account-key Put(%q) must pass through: %v", key, err)
		}
		if !under.has(key) {
			t.Errorf("account key %q must reach the shared store", key)
		}
	}
}

func TestClusterAwareCache_NonLeaderCertDeleteAbsorbed(t *testing.T) {
	under := newRecordingCache()
	under.m["example.com"] = []byte("cert")
	cc := NewClusterAwareCache(under, func() bool { return false }, discardLogger())

	if err := cc.Delete(context.Background(), "example.com"); err != nil {
		t.Errorf("non-leader cert Delete must be absorbed with nil error, got %v", err)
	}
	if !under.has("example.com") {
		t.Error("non-leader cert Delete must not remove the shared cert")
	}
}

func TestClusterAwareCache_GetPassesThroughForAllNodes(t *testing.T) {
	under := newRecordingCache()
	under.m["example.com"] = []byte("cert")
	cc := NewClusterAwareCache(under, func() bool { return false }, discardLogger())

	got, err := cc.Get(context.Background(), "example.com")
	if err != nil || !bytes.Equal(got, []byte("cert")) {
		t.Errorf("non-leader Get must pass through, got %q err=%v", got, err)
	}
}
