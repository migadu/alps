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
