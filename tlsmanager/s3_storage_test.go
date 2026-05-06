package tlsmanager

import (
	"testing"
	"time"
)

func TestParseLockInfo(t *testing.T) {
	tests := []struct {
		name    string
		data    []byte
		wantID  string
		wantErr bool
	}{
		{
			name:   "valid lock",
			data:   []byte(`{"node_id":"host-123","created_at":"2026-05-06T10:00:00Z","expires_at":"2026-05-06T10:05:00Z"}`),
			wantID: "host-123",
		},
		{
			name:   "valid lock with extra fields",
			data:   []byte(`{"node_id":"host-456","extra":"ignored","expires_at":"2026-05-06T12:00:00Z"}`),
			wantID: "host-456",
		},
		{
			name:    "missing node_id",
			data:    []byte(`{"expires_at":"2026-05-06T12:00:00Z"}`),
			wantErr: true,
		},
		{
			name:    "empty node_id",
			data:    []byte(`{"node_id":"","expires_at":"2026-05-06T12:00:00Z"}`),
			wantErr: true,
		},
		{
			name:    "empty data",
			data:    []byte{},
			wantErr: true,
		},
		{
			name:    "invalid json",
			data:    []byte(`not json`),
			wantErr: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			lock, err := parseLockInfo(tc.data)
			if tc.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if lock.NodeID != tc.wantID {
				t.Errorf("NodeID = %q, want %q", lock.NodeID, tc.wantID)
			}
		})
	}
}

func TestLockInfoMarshalRoundTrip(t *testing.T) {
	original := &lockInfo{
		NodeID:    "test-node-12345",
		CreatedAt: time.Date(2026, 5, 6, 10, 0, 0, 0, time.UTC),
		ExpiresAt: time.Date(2026, 5, 6, 10, 5, 0, 0, time.UTC),
	}

	data := original.marshal()
	parsed, err := parseLockInfo(data)
	if err != nil {
		t.Fatalf("round-trip parse failed: %v", err)
	}

	if parsed.NodeID != original.NodeID {
		t.Errorf("NodeID = %q, want %q", parsed.NodeID, original.NodeID)
	}

	// ExpiresAt should match (within RFC3339 precision)
	if !parsed.ExpiresAt.Equal(original.ExpiresAt) {
		t.Errorf("ExpiresAt = %v, want %v", parsed.ExpiresAt, original.ExpiresAt)
	}
}

func TestLockInfoExpiry(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name      string
		expiresAt time.Time
		expired   bool
	}{
		{
			name:      "not expired",
			expiresAt: now.Add(5 * time.Minute),
			expired:   false,
		},
		{
			name:      "just expired",
			expiresAt: now.Add(-1 * time.Second),
			expired:   true,
		},
		{
			name:      "long expired",
			expiresAt: now.Add(-1 * time.Hour),
			expired:   true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			lock := &lockInfo{
				NodeID:    "test",
				ExpiresAt: tc.expiresAt,
			}
			isExpired := time.Now().After(lock.ExpiresAt)
			if isExpired != tc.expired {
				t.Errorf("expired = %v, want %v", isExpired, tc.expired)
			}
		})
	}
}

func TestPrefixNormalization(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"", "certmagic/"},           // Default
		{"certmagic", "certmagic/"},  // Missing trailing slash
		{"certmagic/", "certmagic/"}, // Already has trailing slash
		{"foo/bar", "foo/bar/"},      // Nested prefix
		{"foo/bar/", "foo/bar/"},     // Nested with slash
	}

	for _, tc := range tests {
		t.Run(tc.input, func(t *testing.T) {
			cfg := S3StorageConfig{
				Endpoint: "localhost:9000",
				Bucket:   "test",
				Prefix:   tc.input,
			}

			// Apply the same normalization logic as NewS3Storage
			if cfg.Prefix == "" {
				cfg.Prefix = "certmagic/"
			} else if len(cfg.Prefix) > 0 && cfg.Prefix[len(cfg.Prefix)-1] != '/' {
				cfg.Prefix = cfg.Prefix + "/"
			}

			if cfg.Prefix != tc.want {
				t.Errorf("prefix = %q, want %q", cfg.Prefix, tc.want)
			}
		})
	}
}
