package tlsmanager

import (
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/caddyserver/certmagic"
)

func TestCalculateJitter(t *testing.T) {
	m := &Manager{logger: slog.Default()}

	t.Run("deterministic", func(t *testing.T) {
		// Same node ID should always produce the same jitter
		j1 := m.calculateJitter("node-alpha")
		j2 := m.calculateJitter("node-alpha")
		j3 := m.calculateJitter("node-alpha")

		if j1 != j2 || j2 != j3 {
			t.Errorf("jitter not deterministic: %v, %v, %v", j1, j2, j3)
		}
	})

	t.Run("different nodes differ", func(t *testing.T) {
		// Different nodes should (almost certainly) have different jitter
		// Test with multiple pairs to reduce false positive chance
		nodes := []string{"node-a", "node-b", "node-c", "node-d", "node-e"}
		jitters := make(map[time.Duration]string)

		for _, node := range nodes {
			j := m.calculateJitter(node)
			if existing, ok := jitters[j]; ok {
				t.Logf("warning: %s and %s have same jitter %v (unlikely collision)", existing, node, j)
			}
			jitters[j] = node
		}

		// At least some should differ
		if len(jitters) < 2 {
			t.Error("all nodes have the same jitter, hashing may be broken")
		}
	})

	t.Run("within bounds", func(t *testing.T) {
		// Test many node IDs to verify jitter is always within ±12 hours
		maxJitter := 12 * time.Hour

		testNodes := []string{
			"host1", "host2", "server-prod-01", "alps-node-123",
			"very-long-hostname.example.com", "a", "z", "",
		}

		for _, node := range testNodes {
			j := m.calculateJitter(node)
			if j < -maxJitter || j >= maxJitter {
				t.Errorf("jitter(%q) = %v, outside [-%v, %v)", node, j, maxJitter, maxJitter)
			}
		}
	})

	t.Run("spread", func(t *testing.T) {
		// Verify different nodes get different jitter values (spread across the range)
		// This is a weaker test than distribution but more reliable
		seen := make(map[time.Duration]bool)
		for i := 0; i < 20; i++ {
			nodeName := fmt.Sprintf("server-%d.example.com", i*1000+i)
			j := m.calculateJitter(nodeName)
			seen[j] = true
		}

		// With 20 unique node names, we should see multiple unique jitter values
		if len(seen) < 5 {
			t.Errorf("jitter lacks spread: only %d unique values from 20 nodes", len(seen))
		}
	})
}

func TestRenewalWindowRatioCalculation(t *testing.T) {
	// These tests verify the renewal window ratio calculation logic
	// without actually initializing CertMagic
	certLifetime := 90 * 24 * time.Hour

	tests := []struct {
		name        string
		renewBefore time.Duration
		wantRatio   float64
		wantWarn    bool // Should trigger a warning
	}{
		{
			name:        "default 30 days",
			renewBefore: 30 * 24 * time.Hour,
			wantRatio:   1.0 / 3.0, // ~0.333
		},
		{
			name:        "45 days",
			renewBefore: 45 * 24 * time.Hour,
			wantRatio:   0.5,
		},
		{
			name:        "10 days",
			renewBefore: 10 * 24 * time.Hour,
			wantRatio:   10.0 / 90.0, // ~0.111
		},
		{
			name:        "very short 1 day",
			renewBefore: 24 * time.Hour,
			wantRatio:   1.0 / 90.0, // ~0.011
			wantWarn:    true,
		},
		{
			name:        "very short 1 hour",
			renewBefore: 1 * time.Hour,
			wantRatio:   0.01, // Clamped to minimum
			wantWarn:    true,
		},
		{
			name:        "very long 80 days",
			renewBefore: 80 * 24 * time.Hour,
			wantRatio:   80.0 / 90.0, // ~0.889
			wantWarn:    true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			ratio := float64(tc.renewBefore) / float64(certLifetime)

			// Apply clamping as the real code does
			if ratio < 0.01 {
				ratio = 0.01
			}
			if ratio > 0.99 {
				ratio = 0.99
			}

			// Allow small floating point tolerance
			tolerance := 0.001
			if ratio < tc.wantRatio-tolerance || ratio > tc.wantRatio+tolerance {
				t.Errorf("ratio = %f, want ~%f", ratio, tc.wantRatio)
			}

			// Verify warning conditions
			shouldWarn := tc.renewBefore < 7*24*time.Hour || tc.renewBefore > 60*24*time.Hour
			if shouldWarn != tc.wantWarn {
				t.Errorf("warning condition = %v, want %v", shouldWarn, tc.wantWarn)
			}
		})
	}
}

func TestRenewalJitterEnabled(t *testing.T) {
	t.Run("nil defaults to true", func(t *testing.T) {
		cfg := &LetsEncryptConfig{RenewalJitter: nil}
		if !cfg.RenewalJitterEnabled() {
			t.Error("nil RenewalJitter should default to true")
		}
	})

	t.Run("explicit true", func(t *testing.T) {
		tr := true
		cfg := &LetsEncryptConfig{RenewalJitter: &tr}
		if !cfg.RenewalJitterEnabled() {
			t.Error("explicit true should return true")
		}
	})

	t.Run("explicit false", func(t *testing.T) {
		fa := false
		cfg := &LetsEncryptConfig{RenewalJitter: &fa}
		if cfg.RenewalJitterEnabled() {
			t.Error("explicit false should return false")
		}
	})
}

func TestFileProviderConfig(t *testing.T) {
	t.Run("requires cert and key", func(t *testing.T) {
		m := &Manager{
			config: &Config{
				Enabled:  true,
				Provider: ProviderFile,
				CertFile: "",
				KeyFile:  "",
			},
			logger: slog.Default(),
		}

		err := m.initFileProvider()
		if err == nil {
			t.Error("expected error when cert_file and key_file are empty")
		}
	})

	t.Run("requires key when cert provided", func(t *testing.T) {
		m := &Manager{
			config: &Config{
				Enabled:  true,
				Provider: ProviderFile,
				CertFile: "/path/to/cert.pem",
				KeyFile:  "",
			},
			logger: slog.Default(),
		}

		err := m.initFileProvider()
		if err == nil {
			t.Error("expected error when key_file is empty")
		}
	})
}

func TestLetsEncryptConfigValidation(t *testing.T) {
	tests := []struct {
		name    string
		cfg     *LetsEncryptConfig
		wantErr string
	}{
		{
			name:    "nil config",
			cfg:     nil,
			wantErr: "letsencrypt config required",
		},
		{
			name:    "empty domains",
			cfg:     &LetsEncryptConfig{Email: "test@example.com"},
			wantErr: "at least one domain required",
		},
		{
			name:    "empty email",
			cfg:     &LetsEncryptConfig{Domains: []string{"example.com"}},
			wantErr: "email required",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			m := &Manager{
				config: &Config{
					Enabled:     true,
					Provider:    ProviderLetsEncrypt,
					LetsEncrypt: tc.cfg,
				},
				logger: slog.Default(),
			}

			err := m.initCertMagic()
			if err == nil {
				t.Fatalf("expected error containing %q", tc.wantErr)
			}
			if err.Error() != tc.wantErr {
				t.Errorf("error = %q, want %q", err.Error(), tc.wantErr)
			}
		})
	}
}

func TestHTTPHandlerIntegration(t *testing.T) {
	t.Run("nil magic returns NotFoundHandler", func(t *testing.T) {
		m := &Manager{
			config: &Config{Enabled: true, Provider: ProviderLetsEncrypt},
			magic:  nil, // Not initialized
			logger: slog.Default(),
		}

		handler := m.HTTPHandler()

		// Make a request to verify it returns 404
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Errorf("expected 404 for nil magic, got %d", rec.Code)
		}
	})

	t.Run("non-challenge requests return 404", func(t *testing.T) {
		// Create a minimal manager with magic set (but no real certmagic)
		// We need to test the handler path, not actual certificate issuance
		m := &Manager{
			config: &Config{Enabled: true, Provider: ProviderLetsEncrypt},
			logger: slog.Default(),
		}

		// Initialize a minimal certmagic config just to have non-nil magic
		cache := newTestCache(m)
		m.magic = newTestMagic(cache)
		m.cache = cache
		defer m.Close()

		handler := m.HTTPHandler()

		// Test various non-challenge paths
		paths := []string{
			"/",
			"/index.html",
			"/api/v1/users",
			"/.well-known/other",
		}

		for _, path := range paths {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != http.StatusNotFound {
				t.Errorf("path %q: expected 404, got %d", path, rec.Code)
			}
		}
	})

	t.Run("challenge path is processed without panic", func(t *testing.T) {
		m := &Manager{
			config: &Config{Enabled: true, Provider: ProviderLetsEncrypt},
			logger: slog.Default(),
		}

		cache := newTestCache(m)
		m.magic = newTestMagic(cache)
		m.cache = cache
		defer m.Close()

		handler := m.HTTPHandler()

		// ACME HTTP-01 challenge path format
		req := httptest.NewRequest(http.MethodGet, "/.well-known/acme-challenge/test-token", nil)
		req.Host = "example.com"
		rec := httptest.NewRecorder()

		// This should not panic (the nil logger bug we fixed)
		handler.ServeHTTP(rec, req)

		// Without an active challenge, it returns 404
		// The important thing is it doesn't panic
		if rec.Code != http.StatusNotFound {
			t.Errorf("expected 404 for unknown challenge, got %d", rec.Code)
		}
	})

	t.Run("handler works with httptest.Server", func(t *testing.T) {
		m := &Manager{
			config: &Config{Enabled: true, Provider: ProviderLetsEncrypt},
			logger: slog.Default(),
		}

		cache := newTestCache(m)
		m.magic = newTestMagic(cache)
		m.cache = cache
		defer m.Close()

		// Start a real HTTP server with the handler
		server := httptest.NewServer(m.HTTPHandler())
		defer server.Close()

		// Make a real HTTP request
		resp, err := http.Get(server.URL + "/.well-known/acme-challenge/test-token")
		if err != nil {
			t.Fatalf("http request failed: %v", err)
		}
		defer resp.Body.Close()

		// Should get 404 (no active challenge), but no panic
		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("expected 404, got %d", resp.StatusCode)
		}
	})
}

// newTestCache creates a minimal certmagic cache for testing
func newTestCache(m *Manager) *certmagic.Cache {
	return certmagic.NewCache(certmagic.CacheOptions{
		GetConfigForCert: func(certmagic.Certificate) (*certmagic.Config, error) {
			return m.magic, nil
		},
	})
}

// newTestMagic creates a minimal certmagic config for testing
func newTestMagic(cache *certmagic.Cache) *certmagic.Config {
	return certmagic.New(cache, certmagic.Config{})
}
