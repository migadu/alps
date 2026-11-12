package tlsmanager

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"golang.org/x/crypto/acme/autocert"
)

type certificateLogBuffer struct {
	mu sync.Mutex
	bytes.Buffer
}

func (b *certificateLogBuffer) Write(data []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.Buffer.Write(data)
}
func (b *certificateLogBuffer) records(t *testing.T) []map[string]any {
	t.Helper()
	b.mu.Lock()
	data := append([]byte(nil), b.Buffer.Bytes()...)
	b.mu.Unlock()
	var records []map[string]any
	for _, line := range bytes.Split(bytes.TrimSpace(data), []byte("\n")) {
		if len(line) == 0 {
			continue
		}
		var record map[string]any
		if err := json.Unmarshal(line, &record); err != nil {
			t.Fatal(err)
		}
		records = append(records, record)
	}
	return records
}

func TestWarmerReportsCachedCertificateExpiry(t *testing.T) {
	for _, tc := range []struct {
		name                             string
		lifetime, remaining, renewBefore time.Duration
		level                            string
	}{
		{"healthy", 90 * 24 * time.Hour, 60 * 24 * time.Hour, 0, "INFO"},
		{"renewal overdue", 90 * 24 * time.Hour, 24 * time.Hour, 0, "WARN"},
		{"expired", 90 * 24 * time.Hour, -time.Minute, 0, "ERROR"},
		{"short lived still healthy", 15 * 24 * time.Hour, 6 * 24 * time.Hour, 0, "INFO"},
		{"short lived renewal due", 15 * 24 * time.Hour, 4 * 24 * time.Hour, 0, "WARN"},
		{"custom renewal window", 90 * 24 * time.Hour, 10 * 24 * time.Hour, 5 * 24 * time.Hour, "INFO"},
		{"custom window capped", 90 * 24 * time.Hour, 40 * 24 * time.Hour, 45 * 24 * time.Hour, "INFO"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			cache := newMemCache()
			start := time.Now().Add(-time.Hour)
			expiry := start.Add(tc.lifetime)
			cache.m["example.com"] = makeBundleWithValidity(t, "example.com", false, start, expiry)
			m := newWarmerTestManager(t, cache)
			m.autocertManager.RenewBefore = tc.renewBefore
			cached, err := m.autocertManager.GetCertificate(warmECDSAHello("example.com"))
			if err != nil {
				t.Fatal(err)
			}
			reads := len(cache.getKeys())
			// The real autocert state now holds this certificate. Its next lookup
			// still succeeds even when our observation time is past its expiry.
			m.certificateClock = func() time.Time { return cached.Leaf.NotAfter.Add(-tc.remaining) }
			logs := &certificateLogBuffer{}
			m.logger = slog.New(slog.NewJSONHandler(logs, nil))
			newCertWarmer(m, []string{"example.com"}, false).warmDomain("example.com")
			if len(cache.getKeys()) != reads {
				t.Fatal("warmer unexpectedly reloaded persistent cache")
			}
			records := logs.records(t)
			if len(records) != 1 {
				t.Fatalf("wanted one certificate status record, got %v", records)
			}
			got := records[0]
			if got["level"] != tc.level || got["domain"] != "example.com" || got["flavor"] != "ecdsa" || got["not_after"] != cached.Leaf.NotAfter.Format(time.RFC3339Nano) {
				t.Fatalf("certificate status=%v, want level %s with domain/flavor/expiry", got, tc.level)
			}
		})
	}
}

func TestWarmerReportsBothFlavorsAndLookupFailure(t *testing.T) {
	cache := newMemCache()
	cache.m["example.com"] = makeBundle(t, "example.com", false)
	cache.m["example.com+rsa"] = makeBundle(t, "example.com", true)
	m := newWarmerTestManager(t, cache)
	logs := &certificateLogBuffer{}
	m.logger = slog.New(slog.NewJSONHandler(logs, nil))
	w := newCertWarmer(m, []string{"example.com"}, true)
	w.warmDomain("example.com")
	records := logs.records(t)
	if len(records) != 2 || records[0]["flavor"] != "ecdsa" || records[1]["flavor"] != "rsa" {
		t.Fatalf("missing successful certificate status: %v", records)
	}
	m.autocertManager.HostPolicy = func(context.Context, string) error { return errors.New("forced certificate lookup failure") }
	w.warmDomain("example.com")
	records = logs.records(t)
	if len(records) != 4 || records[2]["level"] != "ERROR" || !strings.Contains(records[2]["error"].(string), "forced certificate lookup failure") {
		t.Fatalf("missing lookup failure: %v", records)
	}
}

func TestTLSConfigRejectsExpiredAutocertMemoryCertificate(t *testing.T) {
	cacheDir := filepath.Join(t.TempDir(), "certs")
	cache := autocert.DirCache(cacheDir)
	if err := cache.Put(context.Background(), "example.com", makeBundle(t, "example.com", false)); err != nil {
		t.Fatal(err)
	}
	m, err := NewManager(&Config{Enabled: true, Provider: ProviderLetsEncrypt, LetsEncrypt: &LetsEncryptConfig{Email: "admin@example.com", Domains: []string{"example.com"}, StorageProvider: "file", CacheDir: cacheDir}}, discardLogger())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { m.Close() })
	hello := warmECDSAHello("example.com")
	cert, err := m.GetTLSConfig().GetCertificate(hello)
	if err != nil {
		t.Fatal(err)
	}
	m.certificateClock = func() time.Time { return cert.Leaf.NotAfter.Add(-time.Hour) }
	if valid, err := m.GetTLSConfig().GetCertificate(hello); err != nil || valid == nil {
		t.Fatalf("certificate inside renewal window must remain usable: cert=%v err=%v", valid != nil, err)
	}
	m.certificateClock = func() time.Time { return cert.Leaf.NotAfter.Add(time.Minute) }
	expired, err := m.GetTLSConfig().GetCertificate(hello)
	if !errors.Is(err, ErrCertificateUnavailable) || expired != nil {
		t.Fatalf("served expired memory certificate: cert=%v err=%v", expired != nil, err)
	}
}
