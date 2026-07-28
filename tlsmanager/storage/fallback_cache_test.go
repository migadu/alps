package storage

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"errors"
	"io"
	"log/slog"
	"math/big"
	"testing"
	"time"

	"golang.org/x/crypto/acme/autocert"
)

func discardLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func makeCertPEM(t *testing.T, notAfter time.Time) []byte {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	tmpl := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: "example.com"},
		NotBefore:    notAfter.Add(-24 * time.Hour),
		NotAfter:     notAfter,
	}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	var buf bytes.Buffer
	pem.Encode(&buf, &pem.Block{Type: "CERTIFICATE", Bytes: der})
	return buf.Bytes()
}

func newTestFallbackCache(t *testing.T) (*FallbackCache, *MockS3Client) {
	t.Helper()
	mock := NewMockS3Client()
	s3 := &S3Cache{S3Client: mock, Bucket: "b", Prefix: "p/", Logger: discardLogger()}
	fc := NewFallbackCache(t.TempDir(), s3, discardLogger())
	return fc, mock
}

// TestSyncAllToS3_DoesNotOverwriteNewerS3Cert verifies stale-resurrection is
// prevented: a stale local cert must not overwrite a fresher one in S3, and the
// node adopts the fresher S3 cert locally.
func TestSyncAllToS3_DoesNotOverwriteNewerS3Cert(t *testing.T) {
	fc, _ := newTestFallbackCache(t)
	ctx := context.Background()

	now := time.Now()
	oldCert := makeCertPEM(t, now.Add(10*24*time.Hour))
	newCert := makeCertPEM(t, now.Add(80*24*time.Hour))

	if err := fc.fallback.Put(ctx, "example.com", oldCert); err != nil {
		t.Fatal(err)
	}
	if err := fc.primary.Put(ctx, "example.com", newCert); err != nil {
		t.Fatal(err)
	}

	if err := fc.SyncAllToS3(ctx); err != nil {
		t.Fatalf("SyncAllToS3: %v", err)
	}

	s3Got, _ := fc.primary.Get(ctx, "example.com")
	if !bytes.Equal(s3Got, newCert) {
		t.Error("S3 cert was overwritten by the older local cert (stale resurrection)")
	}
	localGot, _ := fc.fallback.Get(ctx, "example.com")
	if !bytes.Equal(localGot, newCert) {
		t.Error("local cert should have been refreshed from the newer S3 cert")
	}
}

// TestSyncAllToS3_PushesNewerLocalCert verifies the normal direction still works:
// a newer local cert is synced up to S3.
func TestSyncAllToS3_PushesNewerLocalCert(t *testing.T) {
	fc, _ := newTestFallbackCache(t)
	ctx := context.Background()

	now := time.Now()
	oldCert := makeCertPEM(t, now.Add(10*24*time.Hour))
	newCert := makeCertPEM(t, now.Add(80*24*time.Hour))

	if err := fc.fallback.Put(ctx, "example.com", newCert); err != nil {
		t.Fatal(err)
	}
	if err := fc.primary.Put(ctx, "example.com", oldCert); err != nil {
		t.Fatal(err)
	}

	if err := fc.SyncAllToS3(ctx); err != nil {
		t.Fatalf("SyncAllToS3: %v", err)
	}

	s3Got, _ := fc.primary.Get(ctx, "example.com")
	if !bytes.Equal(s3Got, newCert) {
		t.Error("newer local cert should have been synced up to S3")
	}
}

// TestSyncAllToS3_CleansOrphanedHTTP01Token verifies http-01 challenge tokens
// missing from S3 are removed locally, not re-uploaded.
func TestSyncAllToS3_CleansOrphanedHTTP01Token(t *testing.T) {
	fc, _ := newTestFallbackCache(t)
	ctx := context.Background()

	const tok = "sometoken+http-01"
	if err := fc.fallback.Put(ctx, tok, []byte("challenge-response")); err != nil {
		t.Fatal(err)
	}

	if err := fc.SyncAllToS3(ctx); err != nil {
		t.Fatalf("SyncAllToS3: %v", err)
	}

	if _, err := fc.fallback.Get(ctx, tok); err != autocert.ErrCacheMiss {
		t.Errorf("orphaned http-01 token should be deleted locally, got err=%v", err)
	}
	if _, err := fc.primary.Get(ctx, tok); err != autocert.ErrCacheMiss {
		t.Error("orphaned http-01 token should NOT be uploaded to S3")
	}
}

// TestGet_ReturnsCacheMissOnS3Error verifies a transient S3 error surfaces as
// ErrCacheMiss so autocert can still fall through to issuance.
func TestGet_ReturnsCacheMissOnS3Error(t *testing.T) {
	fc, mock := newTestFallbackCache(t)
	mock.GetErr = errors.New("s3 network failure")

	_, err := fc.Get(context.Background(), "uncached.example.com")
	if err != autocert.ErrCacheMiss {
		t.Errorf("expected ErrCacheMiss on S3 error, got %v", err)
	}
}

func TestCertNotAfter(t *testing.T) {
	want := time.Now().Add(42 * 24 * time.Hour).Truncate(time.Second)
	got, ok := certNotAfter(makeCertPEM(t, want))
	if !ok || !got.Equal(want) {
		t.Errorf("certNotAfter = %v, %v; want %v, true", got, ok, want)
	}
	if _, ok := certNotAfter([]byte("not a cert")); ok {
		t.Error("certNotAfter should return ok=false for non-certificate data")
	}
}

// makeCertPEMWindow creates a cert PEM with an explicit validity window, for
// exercising the renewal-window revalidation logic.
func makeCertPEMWindow(t *testing.T, notBefore, notAfter time.Time) []byte {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	tmpl := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: "example.com"},
		NotBefore:    notBefore,
		NotAfter:     notAfter,
	}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	var buf bytes.Buffer
	pem.Encode(&buf, &pem.Block{Type: "CERTIFICATE", Bytes: der})
	return buf.Bytes()
}

func TestRenewalThreshold(t *testing.T) {
	base := time.Now()
	// 90-day cert: lifetime/3 = 30d, capped at 30d.
	if got := renewalThreshold(base, base.Add(90*24*time.Hour)); got != 30*24*time.Hour {
		t.Errorf("90d cert: threshold = %v, want 30d", got)
	}
	// 9-day cert: lifetime/3 = 3d.
	if got := renewalThreshold(base, base.Add(9*24*time.Hour)); got != 3*24*time.Hour {
		t.Errorf("9d cert: threshold = %v, want 3d", got)
	}
	// 180-day cert: capped at 30d.
	if got := renewalThreshold(base, base.Add(180*24*time.Hour)); got != 30*24*time.Hour {
		t.Errorf("180d cert: threshold = %v, want 30d cap", got)
	}
}

// TestGet_ChallengeTokenBypassesLocalTier verifies challenge tokens are read
// from S3 only: the tls-alpn-01 key is fixed per domain, so a stale local copy
// must never shadow the fresh token the leader published for a new validation.
func TestGet_ChallengeTokenBypassesLocalTier(t *testing.T) {
	fc, _ := newTestFallbackCache(t)
	ctx := context.Background()
	const key = "example.com+token"

	stale := []byte("stale-token-cert")
	fresh := []byte("fresh-token-cert")
	if err := fc.fallback.Put(ctx, key, stale); err != nil {
		t.Fatal(err)
	}
	if err := fc.primary.Put(ctx, key, fresh); err != nil {
		t.Fatal(err)
	}

	got, err := fc.Get(ctx, key)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if !bytes.Equal(got, fresh) {
		t.Error("challenge token Get must return the S3 copy, not the stale local copy")
	}

	// Token present ONLY locally must be a miss: local is never authoritative.
	const localOnly = "orphan+http-01"
	if err := fc.fallback.Put(ctx, localOnly, stale); err != nil {
		t.Fatal(err)
	}
	if _, err := fc.Get(ctx, localOnly); err != autocert.ErrCacheMiss {
		t.Errorf("local-only token should be ErrCacheMiss, got %v", err)
	}
}

// TestPut_ChallengeTokenGoesToS3Only verifies tokens are published to S3 for
// cluster-wide validation and never cached locally.
func TestPut_ChallengeTokenGoesToS3Only(t *testing.T) {
	fc, mock := newTestFallbackCache(t)
	ctx := context.Background()
	const key = "example.com+token"

	if err := fc.Put(ctx, key, []byte("token-cert")); err != nil {
		t.Fatalf("Put: %v", err)
	}
	if _, err := fc.primary.Get(ctx, key); err != nil {
		t.Errorf("token should be in S3, got %v", err)
	}
	if _, err := fc.fallback.Get(ctx, key); err != autocert.ErrCacheMiss {
		t.Errorf("token must NOT be written to the local tier, got %v", err)
	}

	// With S3 down the Put must fail loudly (issuance deferred), not silently
	// strand the token on the local disk while Let's Encrypt validates.
	mock.PutErr = errors.New("s3 down")
	if err := fc.Put(ctx, "tok2+http-01", []byte("x")); err == nil {
		t.Error("token Put with S3 down should return an error")
	}
	if _, err := fc.fallback.Get(ctx, "tok2+http-01"); err != autocert.ErrCacheMiss {
		t.Error("failed token Put must not fall back to local storage")
	}
}

// TestGet_AdoptsRenewedCertInRenewalWindow verifies the freshness path: a local
// cert inside its renewal window triggers an S3 re-check, and a newer S3 cert
// (published by the cluster leader) is adopted and persisted locally.
func TestGet_AdoptsRenewedCertInRenewalWindow(t *testing.T) {
	fc, _ := newTestFallbackCache(t)
	ctx := context.Background()
	now := time.Now()

	// Lifetime 80d, 20d until expiry, threshold min(80/3, 30)=26.6d -> in window.
	local := makeCertPEMWindow(t, now.Add(-60*24*time.Hour), now.Add(20*24*time.Hour))
	renewed := makeCertPEMWindow(t, now.Add(-24*time.Hour), now.Add(89*24*time.Hour))

	if err := fc.fallback.Put(ctx, "example.com", local); err != nil {
		t.Fatal(err)
	}
	if err := fc.primary.Put(ctx, "example.com", renewed); err != nil {
		t.Fatal(err)
	}

	got, err := fc.Get(ctx, "example.com")
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if !bytes.Equal(got, renewed) {
		t.Error("Get should adopt the renewed cert from S3 when local is in the renewal window")
	}
	localGot, _ := fc.fallback.Get(ctx, "example.com")
	if !bytes.Equal(localGot, renewed) {
		t.Error("adopted cert should be persisted to the local tier")
	}
}

// TestGet_NoRevalidationOutsideRenewalWindow verifies zero S3 traffic (and no
// adoption) while the local cert is far from expiry.
func TestGet_NoRevalidationOutsideRenewalWindow(t *testing.T) {
	fc, _ := newTestFallbackCache(t)
	ctx := context.Background()
	now := time.Now()

	// Lifetime 81d, 80d until expiry, threshold 27d -> NOT in window.
	local := makeCertPEMWindow(t, now.Add(-24*time.Hour), now.Add(80*24*time.Hour))
	other := makeCertPEMWindow(t, now, now.Add(120*24*time.Hour))

	if err := fc.fallback.Put(ctx, "example.com", local); err != nil {
		t.Fatal(err)
	}
	if err := fc.primary.Put(ctx, "example.com", other); err != nil {
		t.Fatal(err)
	}

	got, err := fc.Get(ctx, "example.com")
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if !bytes.Equal(got, local) {
		t.Error("Get must serve the local cert unchanged outside the renewal window")
	}
}

// TestGet_RevalidationThrottled verifies at most one S3 re-check per
// revalidateEvery per key, and that the throttle expiring re-enables adoption.
func TestGet_RevalidationThrottled(t *testing.T) {
	fc, _ := newTestFallbackCache(t)
	ctx := context.Background()
	now := time.Now()

	local := makeCertPEMWindow(t, now.Add(-60*24*time.Hour), now.Add(20*24*time.Hour))
	// Newer but still inside the renewal window (25d left of a 125d lifetime).
	renewed1 := makeCertPEMWindow(t, now.Add(-100*24*time.Hour), now.Add(25*24*time.Hour))
	renewed2 := makeCertPEMWindow(t, now, now.Add(150*24*time.Hour))

	if err := fc.fallback.Put(ctx, "example.com", local); err != nil {
		t.Fatal(err)
	}
	if err := fc.primary.Put(ctx, "example.com", renewed1); err != nil {
		t.Fatal(err)
	}

	if got, _ := fc.Get(ctx, "example.com"); !bytes.Equal(got, renewed1) {
		t.Fatal("first Get should adopt renewed1")
	}

	// S3 has an even newer cert, but the throttle window has not elapsed.
	if err := fc.primary.Put(ctx, "example.com", renewed2); err != nil {
		t.Fatal(err)
	}
	if got, _ := fc.Get(ctx, "example.com"); !bytes.Equal(got, renewed1) {
		t.Error("second Get within revalidateEvery should be throttled and serve the local copy")
	}

	// Expire the throttle: adoption resumes.
	fc.revalMu.Lock()
	fc.lastRevalidate["example.com"] = time.Now().Add(-2 * fc.revalidateEvery)
	fc.revalMu.Unlock()
	if got, _ := fc.Get(ctx, "example.com"); !bytes.Equal(got, renewed2) {
		t.Error("Get after throttle expiry should adopt renewed2")
	}
}

// TestGet_RevalidationS3ErrorServesLocal verifies the freshness check can never
// fail a handshake the local cert could serve.
func TestGet_RevalidationS3ErrorServesLocal(t *testing.T) {
	fc, mock := newTestFallbackCache(t)
	ctx := context.Background()
	now := time.Now()

	local := makeCertPEMWindow(t, now.Add(-60*24*time.Hour), now.Add(20*24*time.Hour))
	if err := fc.fallback.Put(ctx, "example.com", local); err != nil {
		t.Fatal(err)
	}
	mock.GetErr = errors.New("s3 down")

	got, err := fc.Get(ctx, "example.com")
	if err != nil {
		t.Fatalf("Get must not fail when revalidation cannot reach S3: %v", err)
	}
	if !bytes.Equal(got, local) {
		t.Error("Get should serve the local cert when S3 is unreachable")
	}
}

// TestRefreshFromS3 verifies the follower hard-miss path: S3 is consulted
// directly (bypassing the local-first order) and the result persisted locally.
func TestRefreshFromS3(t *testing.T) {
	fc, mock := newTestFallbackCache(t)
	ctx := context.Background()

	cert := makeCertPEM(t, time.Now().Add(80*24*time.Hour))
	if err := fc.primary.Put(ctx, "example.com", cert); err != nil {
		t.Fatal(err)
	}

	got, err := fc.RefreshFromS3(ctx, "example.com")
	if err != nil {
		t.Fatalf("RefreshFromS3: %v", err)
	}
	if !bytes.Equal(got, cert) {
		t.Error("RefreshFromS3 should return the S3 copy")
	}
	if localGot, _ := fc.fallback.Get(ctx, "example.com"); !bytes.Equal(localGot, cert) {
		t.Error("RefreshFromS3 should persist the cert locally")
	}

	mock.GetErr = errors.New("s3 down")
	if _, err := fc.RefreshFromS3(ctx, "other.example.com"); err != autocert.ErrCacheMiss {
		t.Errorf("RefreshFromS3 on S3 error should be ErrCacheMiss, got %v", err)
	}
}

func TestS3Healthy(t *testing.T) {
	fc, _ := newTestFallbackCache(t)
	if !fc.S3Healthy() {
		t.Error("S3 should be considered healthy initially")
	}
	fc.markS3Unavailable()
	if fc.S3Healthy() {
		t.Error("S3 should be unhealthy right after a failure")
	}
	// Retry-window semantics: once checkInterval elapses, S3Healthy must
	// report true again so callers (the warmer) probe S3 instead of staying
	// suppressed forever — the breaker only flips back on a successful op,
	// which a quiet node might never perform otherwise.
	fc.SetRetryInterval(0)
	if !fc.S3Healthy() {
		t.Error("S3Healthy should report true again after the retry interval elapses")
	}
	fc.SetRetryInterval(30 * time.Second)
	fc.markS3Unavailable()
	fc.markS3Available()
	if !fc.S3Healthy() {
		t.Error("S3 should be healthy again after recovery")
	}
}

// TestGet_RevalidationSlotNotBurnedWhileBreakerOpen verifies an in-window Get
// during an S3 outage does not consume the hourly revalidation slot: the
// adoption must happen promptly once S3 recovers.
func TestGet_RevalidationSlotNotBurnedWhileBreakerOpen(t *testing.T) {
	fc, mock := newTestFallbackCache(t)
	ctx := context.Background()
	now := time.Now()

	local := makeCertPEMWindow(t, now.Add(-60*24*time.Hour), now.Add(20*24*time.Hour))
	renewed := makeCertPEMWindow(t, now.Add(-24*time.Hour), now.Add(89*24*time.Hour))
	if err := fc.fallback.Put(ctx, "example.com", local); err != nil {
		t.Fatal(err)
	}
	if err := fc.primary.Put(ctx, "example.com", renewed); err != nil {
		t.Fatal(err)
	}

	// Open the breaker, then Get: serves local WITHOUT consuming the slot.
	fc.markS3Unavailable()
	if got, _ := fc.Get(ctx, "example.com"); !bytes.Equal(got, local) {
		t.Fatal("breaker-open Get should serve the local cert")
	}
	fc.revalMu.Lock()
	_, burned := fc.lastRevalidate["example.com"]
	fc.revalMu.Unlock()
	if burned {
		t.Error("revalidation slot must not be consumed while the breaker is open")
	}

	// S3 recovers: the very next Get adopts the renewed cert.
	fc.markS3Available()
	if got, _ := fc.Get(ctx, "example.com"); !bytes.Equal(got, renewed) {
		t.Error("first Get after S3 recovery should adopt the renewed cert")
	}
	_ = mock
}

// TestGetChallengeToken_ThrottlesS3Reads verifies token reads are reused for
// tokenResultTTL (unauthenticated ALPN probes must not amplify 1:1 into S3
// GETs) and that publishing a token invalidates a cached miss.
func TestGetChallengeToken_ThrottlesS3Reads(t *testing.T) {
	fc, mock := newTestFallbackCache(t)
	ctx := context.Background()
	const key = "example.com+token"

	// Two probes for a missing token: only one S3 read.
	if _, err := fc.Get(ctx, key); err != autocert.ErrCacheMiss {
		t.Fatalf("expected miss, got %v", err)
	}
	first := mock.GetCalls
	if _, err := fc.Get(ctx, key); err != autocert.ErrCacheMiss {
		t.Fatalf("expected miss, got %v", err)
	}
	if mock.GetCalls != first {
		t.Errorf("second probe within tokenResultTTL should not hit S3 (calls %d -> %d)", first, mock.GetCalls)
	}

	// Publishing the token must invalidate the cached miss immediately: the
	// CA's validation probe may arrive well within tokenResultTTL.
	if err := fc.Put(ctx, key, []byte("fresh-token")); err != nil {
		t.Fatal(err)
	}
	got, err := fc.Get(ctx, key)
	if err != nil || !bytes.Equal(got, []byte("fresh-token")) {
		t.Errorf("probe after publish must see the fresh token, got %q err=%v", got, err)
	}
}
