package tlsmanager

import (
	"bytes"
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"errors"
	"io"
	"log/slog"
	"math/big"
	"sync"
	"testing"
	"time"

	"golang.org/x/crypto/acme"
	"golang.org/x/crypto/acme/autocert"

	"github.com/migadu/alps/tlsmanager/storage"
)

var errTestS3Down = errors.New("test: s3 down")

func discardLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

// memCache is a recording in-memory autocert.Cache. Driving the REAL
// autocert.Manager against it proves which cache keys (i.e. which certificate
// flavors) a synthetic ClientHello resolves to — the exact defect class a
// hand-rolled hello can introduce (a bare hello resolves to "domain+rsa").
type memCache struct {
	mu   sync.Mutex
	m    map[string][]byte
	gets []string
	puts []string
}

func newMemCache() *memCache {
	return &memCache{m: make(map[string][]byte)}
}

func (c *memCache) Get(_ context.Context, name string) ([]byte, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.gets = append(c.gets, name)
	if d, ok := c.m[name]; ok {
		return d, nil
	}
	return nil, autocert.ErrCacheMiss
}

func (c *memCache) Put(_ context.Context, name string, data []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.puts = append(c.puts, name)
	c.m[name] = data
	return nil
}

func (c *memCache) Delete(_ context.Context, name string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.m, name)
	return nil
}

func (c *memCache) getKeys() []string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return append([]string(nil), c.gets...)
}

// makeBundle builds a cert+key PEM bundle in autocert's storage format:
// private-key block first, then the certificate chain.
func makeBundle(t *testing.T, domain string, useRSA bool) []byte {
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
		NotBefore:    time.Now().Add(-time.Hour),
		NotAfter:     time.Now().Add(90 * 24 * time.Hour),
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

// newWarmerTestManager builds a Manager whose autocert instance reads from the
// given cache and whose ACME client points at an unroutable directory, so any
// attempted issuance fails instead of reaching a real CA.
func newWarmerTestManager(t *testing.T, cache autocert.Cache) *Manager {
	t.Helper()
	return &Manager{
		config: &Config{},
		logger: discardLogger(),
		autocertManager: &autocert.Manager{
			Prompt:     autocert.AcceptTOS,
			HostPolicy: autocert.HostWhitelist("example.com"),
			Cache:      cache,
			Client:     &acme.Client{DirectoryURL: "https://127.0.0.1:1/directory"},
		},
	}
}

// TestWarmer_ECDSAHelloResolvesDefaultFlavor is the load-bearing test: the
// synthetic ECDSA hello must make the real autocert resolve the DEFAULT cache
// key ("example.com" — the flavor real browsers request), not "example.com+rsa".
func TestWarmer_ECDSAHelloResolvesDefaultFlavor(t *testing.T) {
	cache := newMemCache()
	cache.m["example.com"] = makeBundle(t, "example.com", false)

	m := newWarmerTestManager(t, cache)
	cert, err := m.autocertManager.GetCertificate(warmECDSAHello("example.com"))
	if err != nil {
		t.Fatalf("GetCertificate with ECDSA hello: %v (hello resolved to the wrong flavor and attempted issuance?)", err)
	}
	if _, ok := cert.Leaf.PublicKey.(*ecdsa.PublicKey); !ok {
		t.Errorf("expected the ECDSA certificate, got %T", cert.Leaf.PublicKey)
	}

	for _, k := range cache.getKeys() {
		if k == "example.com+rsa" {
			t.Error("ECDSA hello must not touch the +rsa cache key")
		}
	}
}

// TestWarmer_RSAHelloResolvesRSAFlavor: the RSA hello must resolve "domain+rsa".
func TestWarmer_RSAHelloResolvesRSAFlavor(t *testing.T) {
	cache := newMemCache()
	cache.m["example.com+rsa"] = makeBundle(t, "example.com", true)

	m := newWarmerTestManager(t, cache)
	cert, err := m.autocertManager.GetCertificate(warmRSAHello("example.com"))
	if err != nil {
		t.Fatalf("GetCertificate with RSA hello: %v", err)
	}
	if _, ok := cert.Leaf.PublicKey.(*rsa.PublicKey); !ok {
		t.Errorf("expected the RSA certificate, got %T", cert.Leaf.PublicKey)
	}
}

// TestWarmer_WarmsECDSAOnlyByDefault verifies a warm pass touches only the
// default flavor unless RSA warming is opted into.
func TestWarmer_WarmsECDSAOnlyByDefault(t *testing.T) {
	cache := newMemCache()
	cache.m["example.com"] = makeBundle(t, "example.com", false)
	cache.m["example.com+rsa"] = makeBundle(t, "example.com", true)

	m := newWarmerTestManager(t, cache)
	w := newCertWarmer(m, []string{"example.com"}, false)
	w.maybeWarm()

	var sawDefault, sawRSA bool
	for _, k := range cache.getKeys() {
		switch k {
		case "example.com":
			sawDefault = true
		case "example.com+rsa":
			sawRSA = true
		}
	}
	if !sawDefault {
		t.Error("warm pass should have loaded the default (ECDSA) flavor")
	}
	if sawRSA {
		t.Error("warm pass should not touch the RSA flavor unless warm_rsa_certs is set")
	}
}

// TestWarmer_WarmsBothFlavorsWhenConfigured verifies warm_rsa_certs=true also
// warms the legacy RSA flavor.
func TestWarmer_WarmsBothFlavorsWhenConfigured(t *testing.T) {
	cache := newMemCache()
	cache.m["example.com"] = makeBundle(t, "example.com", false)
	cache.m["example.com+rsa"] = makeBundle(t, "example.com", true)

	m := newWarmerTestManager(t, cache)
	w := newCertWarmer(m, []string{"example.com"}, true)
	w.maybeWarm()

	var sawDefault, sawRSA bool
	for _, k := range cache.getKeys() {
		switch k {
		case "example.com":
			sawDefault = true
		case "example.com+rsa":
			sawRSA = true
		}
	}
	if !sawDefault || !sawRSA {
		t.Errorf("warm pass with RSA warming should load both flavors (default=%v rsa=%v)", sawDefault, sawRSA)
	}
}

// TestWarmer_SkipsWhenNotLeader: followers must never warm.
func TestWarmer_SkipsWhenNotLeader(t *testing.T) {
	cache := newMemCache()
	cache.m["example.com"] = makeBundle(t, "example.com", false)

	m := newWarmerTestManager(t, cache)
	m.isLeader = func() bool { return false }
	w := newCertWarmer(m, []string{"example.com"}, false)
	w.maybeWarm()

	if got := cache.getKeys(); len(got) != 0 {
		t.Errorf("non-leader warm pass must not touch the cache, got %v", got)
	}
}

// TestWarmer_SingleInstanceWarms: with no leadership wired (isLeader nil) the
// sole node warms — proactive renewal replaces handshake-triggered renewal.
func TestWarmer_SingleInstanceWarms(t *testing.T) {
	cache := newMemCache()
	cache.m["example.com"] = makeBundle(t, "example.com", false)

	m := newWarmerTestManager(t, cache) // isLeader nil
	w := newCertWarmer(m, []string{"example.com"}, false)
	w.maybeWarm()

	if got := cache.getKeys(); len(got) == 0 {
		t.Error("single-instance warm pass should have run")
	}
}

// TestWarmer_DeferredPassDoesNotBurnBudget: a pass skipped because S3 is
// unhealthy must not consume the pass budget — the retry (via the pending
// flag) must run as soon as S3 is worth probing again, not at the next 12h
// tick.
func TestWarmer_DeferredPassDoesNotBurnBudget(t *testing.T) {
	cache := newMemCache()
	cache.m["example.com"] = makeBundle(t, "example.com", false)

	mock := storage.NewMockS3Client()
	s3 := &storage.S3Cache{S3Client: mock, Bucket: "b", Prefix: "p/", Logger: discardLogger()}
	fc := storage.NewFallbackCache(t.TempDir(), s3, discardLogger())

	m := newWarmerTestManager(t, cache)
	m.fallbackCache = fc
	w := newCertWarmer(m, []string{"example.com"}, false)

	// Open the breaker via a failing S3 op.
	mock.GetErr = errTestS3Down
	fc.Get(context.Background(), "missing.example.com")
	mock.GetErr = nil

	w.maybeWarm()
	if got := len(cache.getKeys()); got != 0 {
		t.Fatalf("pass must be deferred while S3 is unhealthy (%d cache reads)", got)
	}
	if !w.isPending() {
		t.Fatal("deferred pass must be marked pending")
	}

	// S3 becomes worth probing again: the retry must run immediately — the
	// deferral must not have consumed the 15-minute pass budget.
	fc.SetRetryInterval(0)
	w.maybeWarm()
	if got := len(cache.getKeys()); got == 0 {
		t.Error("retried pass should have run once S3 recovered")
	}
	if w.isPending() {
		t.Error("pending flag should clear after a successful pass")
	}
}

// TestWarmer_MinPassGap: back-to-back triggers must not run two passes.
func TestWarmer_MinPassGap(t *testing.T) {
	cache := newMemCache()
	cache.m["example.com"] = makeBundle(t, "example.com", false)

	m := newWarmerTestManager(t, cache)
	w := newCertWarmer(m, []string{"example.com"}, false)

	w.maybeWarm()
	n := len(cache.getKeys())
	w.maybeWarm() // Within warmerMinPassGap: must be a no-op.
	if got := len(cache.getKeys()); got != n {
		t.Errorf("second pass within warmerMinPassGap ran (%d -> %d cache reads)", n, got)
	}
}

// TestNamespacedStorageConfig verifies a non-production ACME directory gets an
// isolated store and production stays untouched.
func TestNamespacedStorageConfig(t *testing.T) {
	prod := LetsEncryptConfig{CacheDir: "cert-cache", S3: S3Config{Prefix: "alps/"}}
	if got, ns := namespacedStorageConfig(prod); ns || got.CacheDir != "cert-cache" || got.S3.Prefix != "alps/" {
		t.Errorf("production config must not be namespaced: %+v ns=%v", got, ns)
	}

	prodExplicit := prod
	prodExplicit.DirectoryURL = autocert.DefaultACMEDirectory
	if _, ns := namespacedStorageConfig(prodExplicit); ns {
		t.Error("explicit production directory URL must not be namespaced")
	}

	staging := prod
	staging.DirectoryURL = "https://acme-staging-v02.api.letsencrypt.org/directory"
	got, ns := namespacedStorageConfig(staging)
	if !ns {
		t.Fatal("staging directory URL must be namespaced")
	}
	if got.CacheDir == prod.CacheDir {
		t.Error("staging cache dir must differ from production")
	}
	if got.S3.Prefix == prod.S3.Prefix {
		t.Error("staging S3 prefix must differ from production")
	}

	// Same URL -> same namespace (deterministic); different URL -> different.
	got2, _ := namespacedStorageConfig(staging)
	if got2.CacheDir != got.CacheDir || got2.S3.Prefix != got.S3.Prefix {
		t.Error("namespacing must be deterministic")
	}
	other := prod
	other.DirectoryURL = "https://acme.example.org/directory"
	got3, _ := namespacedStorageConfig(other)
	if got3.CacheDir == got.CacheDir {
		t.Error("different directory URLs must map to different namespaces")
	}

	// Empty cache dir gets the default before suffixing.
	empty := LetsEncryptConfig{DirectoryURL: "https://acme.example.org/directory"}
	got4, _ := namespacedStorageConfig(empty)
	if got4.CacheDir == "" || got4.CacheDir == "cert-cache" {
		t.Errorf("empty cache dir should default then namespace, got %q", got4.CacheDir)
	}
}
