package tlsmanager

import (
	"bytes"
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/migadu/alps/tlsmanager/storage"
)

// makeBundleAt is makeBundle with an explicit validity window.
func makeBundleAt(t *testing.T, domain string, useRSA bool, notBefore, notAfter time.Time) []byte {
	t.Helper()

	var priv crypto.Signer
	var keyBlock *pem.Block
	if useRSA {
		key, err := rsa.GenerateKey(rand.Reader, 2048)
		if err != nil {
			t.Fatal(err)
		}
		priv = key
		keyBlock = &pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)}
	} else {
		key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		if err != nil {
			t.Fatal(err)
		}
		priv = key
		b, err := x509.MarshalECPrivateKey(key)
		if err != nil {
			t.Fatal(err)
		}
		keyBlock = &pem.Block{Type: "EC PRIVATE KEY", Bytes: b}
	}

	tmpl := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: domain},
		DNSNames:     []string{domain},
		NotBefore:    notBefore,
		NotAfter:     notAfter,
		KeyUsage:     x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, priv.Public(), priv)
	if err != nil {
		t.Fatal(err)
	}

	var buf bytes.Buffer
	pem.Encode(&buf, keyBlock)
	pem.Encode(&buf, &pem.Block{Type: "CERTIFICATE", Bytes: der})
	return buf.Bytes()
}

func TestIsALPNChallengeHello(t *testing.T) {
	cases := []struct {
		protos []string
		want   bool
	}{
		{[]string{"acme-tls/1"}, true},
		{nil, false},
		{[]string{}, false},
		{[]string{"h2"}, false},
		{[]string{"acme-tls/1", "h2"}, false}, // real CA probes offer ONLY acme-tls/1
	}
	for _, c := range cases {
		hello := &tls.ClientHelloInfo{ServerName: "example.com", SupportedProtos: c.protos}
		if got := isALPNChallengeHello(hello); got != c.want {
			t.Errorf("isALPNChallengeHello(%v) = %v, want %v", c.protos, got, c.want)
		}
	}
}

func TestHelloSupportsECDSA(t *testing.T) {
	if !helloSupportsECDSA(warmECDSAHello("example.com")) {
		t.Error("the warmer's ECDSA hello must resolve as ECDSA-capable")
	}
	if helloSupportsECDSA(warmRSAHello("example.com")) {
		t.Error("the warmer's RSA hello must not resolve as ECDSA-capable")
	}
	// The exact trap this mirror exists for: a bare hello is NOT ECDSA-capable.
	if helloSupportsECDSA(&tls.ClientHelloInfo{ServerName: "example.com"}) {
		t.Error("a bare ClientHelloInfo must resolve to the RSA flavor (autocert semantics)")
	}
	// ECDSA signature scheme but no ECDSA cipher suite: still not capable.
	if helloSupportsECDSA(&tls.ClientHelloInfo{
		ServerName:       "example.com",
		SignatureSchemes: []tls.SignatureScheme{tls.ECDSAWithP256AndSHA256},
	}) {
		t.Error("signature scheme alone (no ECDSA cipher suite) must not resolve as ECDSA-capable")
	}
}

func TestParseCertBundle(t *testing.T) {
	now := time.Now()
	valid := func() (time.Time, time.Time) { return now.Add(-time.Hour), now.Add(60 * 24 * time.Hour) }

	nb, na := valid()
	ecdsaBundle := makeBundleAt(t, "example.com", false, nb, na)
	rsaBundle := makeBundleAt(t, "example.com", true, nb, na)

	cert, err := parseCertBundle(ecdsaBundle, "example.com", false, now)
	if err != nil {
		t.Fatalf("valid ECDSA bundle: %v", err)
	}
	if cert.Leaf == nil {
		t.Error("Leaf must be populated (avoids per-handshake re-parsing)")
	}

	if _, err := parseCertBundle(rsaBundle, "example.com", true, now); err != nil {
		t.Errorf("valid RSA bundle: %v", err)
	}

	// Flavor mismatches must be rejected (mirrors autocert's validCert).
	if _, err := parseCertBundle(ecdsaBundle, "example.com", true, now); err == nil {
		t.Error("ECDSA bundle under the +rsa key must be rejected")
	}
	if _, err := parseCertBundle(rsaBundle, "example.com", false, now); err == nil {
		t.Error("RSA bundle under the default key must be rejected")
	}

	// Expired and not-yet-valid.
	expired := makeBundleAt(t, "example.com", false, now.Add(-48*time.Hour), now.Add(-time.Hour))
	if _, err := parseCertBundle(expired, "example.com", false, now); err == nil {
		t.Error("expired bundle must be rejected")
	}
	future := makeBundleAt(t, "example.com", false, now.Add(time.Hour), now.Add(60*24*time.Hour))
	if _, err := parseCertBundle(future, "example.com", false, now); err == nil {
		t.Error("not-yet-valid bundle must be rejected")
	}

	// Hostname mismatch.
	if _, err := parseCertBundle(ecdsaBundle, "other.example.com", false, now); err == nil {
		t.Error("hostname mismatch must be rejected")
	}

	// Garbage and key-less bundles.
	if _, err := parseCertBundle([]byte("garbage"), "example.com", false, now); err == nil {
		t.Error("garbage must be rejected")
	}
	certOnly := ecdsaBundle[bytes.Index(ecdsaBundle, []byte("-----BEGIN CERT")):]
	if _, err := parseCertBundle(certOnly, "example.com", false, now); err == nil {
		t.Error("bundle without a leading private key must be rejected")
	}

	// Autocert parity: trailing non-PEM data means a corrupt bundle.
	truncated := append(append([]byte{}, ecdsaBundle...), []byte("-----BEGIN CERTIFICATE-----\ntruncated")...)
	if _, err := parseCertBundle(truncated, "example.com", false, now); err == nil {
		t.Error("bundle with trailing garbage must be rejected (autocert treats it as corrupt)")
	}

	// Autocert parity: every chain element must parse, not just the leaf.
	damagedIntermediate := append(append([]byte{}, ecdsaBundle...),
		pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: []byte("not-der")})...)
	if _, err := parseCertBundle(damagedIntermediate, "example.com", false, now); err == nil {
		t.Error("bundle with an unparseable chain element must be rejected")
	}
}

// newFollowerTestManager builds a follower Manager backed by a FallbackCache
// over the mock S3, returning the manager, the S3 cache (for seeding S3
// directly), and the local cache dir (for seeding the local tier directly).
func newFollowerTestManager(t *testing.T) (*Manager, *storage.S3Cache, string) {
	t.Helper()
	s3 := &storage.S3Cache{
		S3Client: storage.NewMockS3Client(),
		Bucket:   "b",
		Prefix:   "certs/",
		Logger:   discardLogger(),
	}
	dir := t.TempDir()
	fc := storage.NewFallbackCache(dir, s3, discardLogger())
	m := &Manager{
		config:        &Config{},
		logger:        discardLogger(),
		fallbackCache: fc,
		isLeader:      func() bool { return false },
	}
	return m, s3, dir
}

func TestFollower_ServesPublishedCert(t *testing.T) {
	m, s3, _ := newFollowerTestManager(t)
	ctx := context.Background()

	bundle := makeBundleAt(t, "example.com", false, time.Now().Add(-time.Hour), time.Now().Add(60*24*time.Hour))
	if err := s3.Put(ctx, "example.com", bundle); err != nil {
		t.Fatal(err)
	}

	cert, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com")
	if err != nil {
		t.Fatalf("follower should serve the leader-published cert from S3: %v", err)
	}
	if _, ok := cert.Leaf.PublicKey.(*ecdsa.PublicKey); !ok {
		t.Errorf("expected ECDSA cert, got %T", cert.Leaf.PublicKey)
	}
}

func TestFollower_FlavorKeysAreSeparate(t *testing.T) {
	m, s3, _ := newFollowerTestManager(t)
	ctx := context.Background()

	// Only the ECDSA flavor is published.
	bundle := makeBundleAt(t, "example.com", false, time.Now().Add(-time.Hour), time.Now().Add(60*24*time.Hour))
	if err := s3.Put(ctx, "example.com", bundle); err != nil {
		t.Fatal(err)
	}

	// An RSA-only client resolves "example.com+rsa", which nobody published.
	if _, err := m.followerGetCertificate(warmRSAHello("example.com"), "example.com"); err == nil {
		t.Error("RSA-flavor request must miss when only the ECDSA flavor is published")
	}
}

func TestFollower_MemoServesAfterStoreLoss(t *testing.T) {
	m, s3, dir := newFollowerTestManager(t)
	ctx := context.Background()

	bundle := makeBundleAt(t, "example.com", false, time.Now().Add(-time.Hour), time.Now().Add(60*24*time.Hour))
	if err := s3.Put(ctx, "example.com", bundle); err != nil {
		t.Fatal(err)
	}
	if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err != nil {
		t.Fatal(err)
	}

	// Wipe both tiers; the memo must still serve within its TTL.
	if err := s3.Delete(ctx, "example.com"); err != nil {
		t.Fatal(err)
	}
	os.Remove(filepath.Join(dir, "example.com"))

	if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err != nil {
		t.Errorf("memoized cert should serve within followerMemoTTL: %v", err)
	}
}

func TestFollower_RefreshesWhenLocalCopyUnservable(t *testing.T) {
	m, s3, dir := newFollowerTestManager(t)
	ctx := context.Background()

	// Local tier holds garbage (e.g. a corrupt file); S3 has the real cert.
	if err := os.WriteFile(filepath.Join(dir, "example.com"), []byte("corrupt"), 0600); err != nil {
		t.Fatal(err)
	}
	bundle := makeBundleAt(t, "example.com", false, time.Now().Add(-time.Hour), time.Now().Add(60*24*time.Hour))
	if err := s3.Put(ctx, "example.com", bundle); err != nil {
		t.Fatal(err)
	}

	if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err != nil {
		t.Errorf("unservable local copy should trigger an S3 refresh: %v", err)
	}
}

func TestFollower_AdoptsRenewedCertOverExpiredLocal(t *testing.T) {
	m, s3, dir := newFollowerTestManager(t)
	ctx := context.Background()
	now := time.Now()

	expired := makeBundleAt(t, "example.com", false, now.Add(-90*24*time.Hour), now.Add(-time.Hour))
	fresh := makeBundleAt(t, "example.com", false, now.Add(-time.Hour), now.Add(89*24*time.Hour))

	if err := os.WriteFile(filepath.Join(dir, "example.com"), expired, 0600); err != nil {
		t.Fatal(err)
	}
	if err := s3.Put(ctx, "example.com", fresh); err != nil {
		t.Fatal(err)
	}

	cert, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com")
	if err != nil {
		t.Fatalf("follower should adopt the renewed cert from S3 over the expired local copy: %v", err)
	}
	if !cert.Leaf.NotAfter.After(now) {
		t.Error("served cert is expired")
	}
}

func TestFollower_EscapeHatchAfterThreshold(t *testing.T) {
	m, _, _ := newFollowerTestManager(t)

	issued := 0
	bundle := makeBundleAt(t, "example.com", false, time.Now().Add(-time.Hour), time.Now().Add(60*24*time.Hour))
	stub, err := parseCertBundle(bundle, "example.com", false, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	m.leaderIssue = func(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
		issued++
		return stub, nil
	}

	// Before the threshold: fail, do NOT issue.
	if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err == nil {
		t.Fatal("hard miss before the escape threshold must fail, not issue")
	}
	if issued != 0 {
		t.Fatalf("leaderIssue called %d times before the threshold", issued)
	}

	// Simulate the miss persisting past the threshold.
	m.followerMu.Lock()
	m.followerFirstMiss["example.com"] = time.Now().Add(-followerEscapeThreshold - time.Minute)
	m.followerMu.Unlock()

	cert, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com")
	if err != nil {
		t.Fatalf("escape hatch should issue after the threshold: %v", err)
	}
	if issued != 1 {
		t.Errorf("leaderIssue called %d times, want 1", issued)
	}
	if cert != stub {
		t.Error("escape hatch should return the issued cert")
	}

	// The issued cert is memoized: the next handshake must not re-issue.
	if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err != nil {
		t.Fatal(err)
	}
	if issued != 1 {
		t.Errorf("issued cert should be memoized; leaderIssue called %d times", issued)
	}
}

// TestFollower_NoSawtoothAfterEscape is the anti-regression test for the
// review's top finding: after an escape-hatch issuance whose cert never
// reaches the store (absorbed by the leader gate), handshakes past the memo
// TTL must KEEP serving the still-valid cert — not fail for another 5-minute
// threshold window (a 60s-up/5min-down availability sawtooth).
func TestFollower_NoSawtoothAfterEscape(t *testing.T) {
	m, _, _ := newFollowerTestManager(t)

	issued := 0
	bundle := makeBundleAt(t, "example.com", false, time.Now().Add(-time.Hour), time.Now().Add(60*24*time.Hour))
	stub, err := parseCertBundle(bundle, "example.com", false, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	m.leaderIssue = func(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
		issued++
		return stub, nil
	}

	// Trigger the escape hatch (store empty, threshold elapsed).
	if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err == nil {
		t.Fatal("expected pre-threshold miss")
	}
	m.followerMu.Lock()
	m.followerFirstMiss["example.com"] = time.Now().Add(-followerEscapeThreshold - time.Minute)
	m.followerMu.Unlock()
	if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err != nil {
		t.Fatalf("escape hatch: %v", err)
	}
	if issued != 1 {
		t.Fatalf("expected 1 issuance, got %d", issued)
	}

	// Expire the memo TTL; the store is still empty (absorbed Put).
	m.followerMu.Lock()
	m.followerCerts["example.com"].loadedAt = time.Now().Add(-2 * followerMemoTTL)
	m.followerMu.Unlock()

	cert, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com")
	if err != nil {
		t.Fatalf("post-TTL handshake must serve the still-valid escape cert, got error: %v", err)
	}
	if cert != stub {
		t.Error("expected the previously issued cert")
	}
	if issued != 1 {
		t.Errorf("stale-memo serve must not re-issue (issued=%d)", issued)
	}

	// The lease renews: another immediate handshake serves from memo.
	if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err != nil {
		t.Fatalf("re-leased memo should serve: %v", err)
	}
}

// TestFollower_EscapeRetryCooldown: a FAILING escape issuance must not be
// retried on every handshake (each retry is a full ACME attempt).
func TestFollower_EscapeRetryCooldown(t *testing.T) {
	m, _, _ := newFollowerTestManager(t)

	attempts := 0
	issueErr := fmt.Errorf("acme unreachable")
	m.leaderIssue = func(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
		attempts++
		return nil, issueErr
	}

	// Arm the threshold, then fail the first escape attempt.
	if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err == nil {
		t.Fatal("expected pre-threshold miss")
	}
	m.followerMu.Lock()
	m.followerFirstMiss["example.com"] = time.Now().Add(-followerEscapeThreshold - time.Minute)
	m.followerMu.Unlock()
	if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err == nil {
		t.Fatal("escape with failing issuer should error")
	}
	if attempts != 1 {
		t.Fatalf("expected 1 attempt, got %d", attempts)
	}

	// Immediate retries stay in cooldown: no further ACME attempts.
	for i := 0; i < 5; i++ {
		if _, err := m.followerGetCertificate(warmECDSAHello("example.com"), "example.com"); err == nil {
			t.Fatal("cooldown handshake should still error")
		}
	}
	if attempts != 1 {
		t.Errorf("cooldown must prevent per-handshake ACME retries (attempts=%d)", attempts)
	}

	// Cooldown expiry re-enables exactly one more attempt.
	m.followerMu.Lock()
	m.followerLastEscape["example.com"] = time.Now().Add(-followerEscapeRetry - time.Minute)
	m.followerMu.Unlock()
	m.followerGetCertificate(warmECDSAHello("example.com"), "example.com")
	if attempts != 2 {
		t.Errorf("expected a second attempt after cooldown, got %d", attempts)
	}
}

// TestFollower_NoEscapeForUnwarmedRSAFlavor: with RSA warming disabled the
// "+rsa" key is legitimately absent, and any client can fabricate an RSA-only
// hello — the escape hatch must not let that drive ACME issuance.
func TestFollower_NoEscapeForUnwarmedRSAFlavor(t *testing.T) {
	m, _, _ := newFollowerTestManager(t)

	attempts := 0
	m.leaderIssue = func(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
		attempts++
		return nil, fmt.Errorf("should not be called")
	}

	m.warmRSA = false
	if _, err := m.followerGetCertificate(warmRSAHello("example.com"), "example.com"); err == nil {
		t.Fatal("expected miss for unpublished RSA flavor")
	}
	m.followerMu.Lock()
	m.followerFirstMiss["example.com+rsa"] = time.Now().Add(-followerEscapeThreshold - time.Minute)
	m.followerMu.Unlock()
	if _, err := m.followerGetCertificate(warmRSAHello("example.com"), "example.com"); err == nil {
		t.Fatal("RSA escape with warming disabled should error")
	}
	if attempts != 0 {
		t.Errorf("escape hatch must not fire for the unwarmed RSA flavor (attempts=%d)", attempts)
	}

	// With RSA warming enabled the flavor IS expected: escape may fire.
	m.warmRSA = true
	m.followerGetCertificate(warmRSAHello("example.com"), "example.com")
	if attempts != 1 {
		t.Errorf("escape hatch should fire for the RSA flavor when warming is enabled (attempts=%d)", attempts)
	}
}
