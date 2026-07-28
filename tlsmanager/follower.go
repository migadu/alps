package tlsmanager

import (
	"bytes"
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/acme"
)

const (
	// followerMemoTTL bounds how long a follower serves a parsed certificate
	// from memory before re-reading the store. The store read is a local disk
	// hit in the common case; the TTL is what lets a follower notice a cert
	// the freshness revalidation (FallbackCache.maybeRevalidate) adopted.
	followerMemoTTL = time.Minute

	// followerEscapeThreshold is how long a follower tolerates a hard miss
	// (no certificate anywhere in the store) before falling back to issuing
	// locally. This is the availability escape hatch for a leader that is
	// gossip-alive but functionally broken (cannot reach ACME or S3): it
	// converts an indefinite cluster-wide outage into a bounded one, and is
	// rate-limited by construction — it only fires when the leader has
	// demonstrably published nothing for this long.
	followerEscapeThreshold = 5 * time.Minute

	// followerEscapeRetry bounds how often the escape hatch may ATTEMPT local
	// issuance per flavor key, success or failure. Without it, a failing
	// leaderIssue (e.g. ACME unreachable from this node too) would be retried
	// on every incoming handshake — ~60 full ACME attempts/hour against Let's
	// Encrypt's 5-failed-validations/hour budget. 15 minutes caps it at 4.
	followerEscapeRetry = 15 * time.Minute
)

// followerCertEntry is a parsed, validated certificate memoized by a follower.
type followerCertEntry struct {
	cert     *tls.Certificate
	loadedAt time.Time
}

// isALPNChallengeHello reports whether a handshake is an ACME tls-alpn-01
// validation probe (mirrors autocert's wantsTokenCert). These must reach
// autocert on every node: the challenge certificate is served from the shared
// cache — a pure read, never an issuance — so validation succeeds regardless
// of which node the CA's probe lands on.
func isALPNChallengeHello(hello *tls.ClientHelloInfo) bool {
	return len(hello.SupportedProtos) == 1 && hello.SupportedProtos[0] == acme.ALPNProto
}

// helloSupportsECDSA mirrors autocert's unexported supportsECDSA so followers
// resolve the SAME flavor cache key ("domain" vs "domain+rsa") that autocert
// would for the same ClientHello. Derived from
// golang.org/x/crypto/acme/autocert (BSD-3-Clause).
func helloSupportsECDSA(hello *tls.ClientHelloInfo) bool {
	// The "signature_algorithms" extension, if present, limits the key exchange
	// algorithms allowed by the cipher suites. See RFC 5246, section 7.4.1.4.1.
	if hello.SignatureSchemes != nil {
		ecdsaOK := false
	schemeLoop:
		for _, scheme := range hello.SignatureSchemes {
			const tlsECDSAWithSHA1 tls.SignatureScheme = 0x0203
			switch scheme {
			case tlsECDSAWithSHA1, tls.ECDSAWithP256AndSHA256,
				tls.ECDSAWithP384AndSHA384, tls.ECDSAWithP521AndSHA512:
				ecdsaOK = true
				break schemeLoop
			}
		}
		if !ecdsaOK {
			return false
		}
	}
	if hello.SupportedCurves != nil {
		ecdsaOK := false
		for _, curve := range hello.SupportedCurves {
			if curve == tls.CurveP256 {
				ecdsaOK = true
				break
			}
		}
		if !ecdsaOK {
			return false
		}
	}
	for _, suite := range hello.CipherSuites {
		switch suite {
		case tls.TLS_ECDHE_ECDSA_WITH_RC4_128_SHA,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA,
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305:
			return true
		}
	}
	return false
}

// parseBundleKey parses the private-key block of an autocert cache bundle
// (EC, PKCS#1, or PKCS#8 — the encodings autocert writes or accepts).
func parseBundleKey(block *pem.Block) (crypto.Signer, error) {
	if key, err := x509.ParseECPrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	if k, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
		if signer, ok := k.(crypto.Signer); ok {
			return signer, nil
		}
	}
	return nil, errors.New("unsupported private key encoding in certificate bundle")
}

// parseCertBundle parses and validates a cert+key PEM bundle in autocert's
// storage format (private-key block first, then the certificate chain) and
// assembles a tls.Certificate. Validation mirrors autocert's validCert:
// validity window, hostname, key/cert match, and flavor match — a follower
// must reject from the shared store anything autocert itself would reject.
func parseCertBundle(data []byte, domain string, wantRSA bool, now time.Time) (*tls.Certificate, error) {
	keyBlock, rest := pem.Decode(data)
	if keyBlock == nil || keyBlock.Type == "CERTIFICATE" {
		return nil, errors.New("bundle does not start with a private key block")
	}
	privKey, err := parseBundleKey(keyBlock)
	if err != nil {
		return nil, err
	}

	var chain [][]byte
	for len(rest) > 0 {
		var b *pem.Block
		b, rest = pem.Decode(rest)
		if b == nil {
			break
		}
		chain = append(chain, b.Bytes)
	}
	// Mirror autocert's cacheGet: leftover bytes that failed to decode mean
	// a truncated or corrupted bundle — reject it entirely rather than serve
	// a partial chain.
	if len(rest) > 0 {
		return nil, errors.New("bundle holds trailing non-PEM data (corrupt)")
	}
	if len(chain) == 0 {
		return nil, errors.New("bundle holds no certificates")
	}

	// Mirror autocert's validCert: every element of the chain must be a
	// parseable certificate, not just the leaf — a damaged intermediate
	// would otherwise be handed to clients verbatim.
	allDER := bytes.Join(chain, nil)
	certs, err := x509.ParseCertificates(allDER)
	if err != nil || len(certs) == 0 {
		return nil, fmt.Errorf("parse certificate chain: %w", err)
	}
	leaf := certs[0]
	if now.Before(leaf.NotBefore) {
		return nil, errors.New("certificate is not valid yet")
	}
	if now.After(leaf.NotAfter) {
		return nil, fmt.Errorf("certificate expired at %v", leaf.NotAfter)
	}
	if err := leaf.VerifyHostname(domain); err != nil {
		return nil, err
	}

	switch pub := leaf.PublicKey.(type) {
	case *rsa.PublicKey:
		prv, ok := privKey.(*rsa.PrivateKey)
		if !ok {
			return nil, errors.New("private key type does not match certificate")
		}
		if pub.N.Cmp(prv.N) != 0 {
			return nil, errors.New("private key does not match certificate")
		}
		if !wantRSA {
			return nil, errors.New("certificate flavor mismatch: got RSA, want ECDSA")
		}
	case *ecdsa.PublicKey:
		prv, ok := privKey.(*ecdsa.PrivateKey)
		if !ok {
			return nil, errors.New("private key type does not match certificate")
		}
		if pub.X.Cmp(prv.X) != 0 || pub.Y.Cmp(prv.Y) != 0 {
			return nil, errors.New("private key does not match certificate")
		}
		if wantRSA {
			return nil, errors.New("certificate flavor mismatch: got ECDSA, want RSA")
		}
	default:
		return nil, errors.New("unsupported certificate public key type")
	}

	return &tls.Certificate{
		Certificate: chain,
		PrivateKey:  privKey,
		Leaf:        leaf,
	}, nil
}

// followerGetCertificate serves a TLS handshake on a cluster follower without
// ever initiating ACME issuance: the leader populates the shared store (via
// the cert warmer and its own handshakes) and followers read from it. On a
// sustained hard miss the escape hatch falls back to local issuance so a
// functionally dead leader cannot take cluster TLS down indefinitely.
func (m *Manager) followerGetCertificate(hello *tls.ClientHelloInfo, domain string) (*tls.Certificate, error) {
	wantRSA := !helloSupportsECDSA(hello)
	flavorKey := domain
	if wantRSA {
		flavorKey += "+rsa"
	}
	now := time.Now()

	m.followerMu.Lock()
	if m.followerCerts == nil {
		m.followerCerts = make(map[string]*followerCertEntry)
		m.followerFirstMiss = make(map[string]time.Time)
		m.followerLastEscape = make(map[string]time.Time)
	}
	if e, ok := m.followerCerts[flavorKey]; ok &&
		now.Sub(e.loadedAt) < followerMemoTTL && now.Before(e.cert.Leaf.NotAfter) {
		m.followerMu.Unlock()
		return e.cert, nil
	}
	m.followerMu.Unlock()

	ctx := hello.Context()
	if ctx == nil {
		ctx = context.Background()
	}

	cert := m.loadFollowerCert(ctx, flavorKey, domain, wantRSA, now)
	if cert != nil {
		m.followerMu.Lock()
		m.followerCerts[flavorKey] = &followerCertEntry{cert: cert, loadedAt: now}
		delete(m.followerFirstMiss, flavorKey)
		m.followerMu.Unlock()
		return cert, nil
	}

	// Hard miss: nothing servable in the store. Before failing the
	// handshake, fall back to a memoized cert that is past its TTL but still
	// time-valid — e.g. one obtained by an earlier escape-hatch issuance
	// that, being absorbed by the leader gate, never reached the store.
	// Without this, a broken-leader outage becomes a sawtooth: 60s of
	// service per memo TTL followed by minutes of failed handshakes. The
	// lease is renewed so the store is re-probed once per TTL, letting the
	// follower converge back to the leader's cert as soon as it appears.
	m.followerMu.Lock()
	if e, ok := m.followerCerts[flavorKey]; ok && now.Before(e.cert.Leaf.NotAfter) {
		e.loadedAt = now
		m.followerMu.Unlock()
		m.logger.Warn("TLS: shared store has no servable certificate - serving previously obtained certificate",
			"domain", domain, "key", flavorKey, "cert_expires", e.cert.Leaf.NotAfter)
		return e.cert, nil
	}

	first, seen := m.followerFirstMiss[flavorKey]
	if !seen {
		first = now
		m.followerFirstMiss[flavorKey] = now
	}
	elapsed := now.Sub(first)
	lastEscape := m.followerLastEscape[flavorKey]
	m.followerMu.Unlock()

	if elapsed >= followerEscapeThreshold && m.leaderIssue != nil {
		// The escape hatch never fires for a flavor the leader is not
		// expected to publish: with warm_rsa_certs disabled the "+rsa" key
		// is legitimately absent, and any client can fabricate an RSA-only
		// ClientHello — escaping here would let unauthenticated handshakes
		// drive ACME issuance on every follower.
		if wantRSA && !m.warmRSA {
			m.logger.Warn("TLS: no RSA certificate published and RSA warming is disabled - rejecting legacy-client handshake (enable warm_rsa_certs to serve RSA-only clients)",
				"domain", domain)
			return nil, fmt.Errorf("%w for %s: RSA certificate flavor not provisioned", ErrCertificateUnavailable, domain)
		}

		// Attempt-based cooldown: at most one local issuance attempt per
		// flavor per followerEscapeRetry, success or failure.
		if now.Sub(lastEscape) < followerEscapeRetry {
			m.logger.Warn("TLS: follower escape hatch in cooldown after a recent issuance attempt",
				"domain", domain, "key", flavorKey, "since_last_attempt", now.Sub(lastEscape))
			return nil, fmt.Errorf("%w for %s: certificate not yet published by cluster leader", ErrCertificateUnavailable, domain)
		}
		m.followerMu.Lock()
		m.followerLastEscape[flavorKey] = now
		m.followerMu.Unlock()

		m.logger.Error("TLS: follower escape hatch - cluster leader has published no certificate; issuing locally",
			"domain", domain, "key", flavorKey, "waited", elapsed)
		cert, err := m.leaderIssue(hello)
		if err != nil {
			m.logger.Error("TLS: follower escape hatch issuance failed",
				"domain", domain, "key", flavorKey, "error", err, "retry_in", followerEscapeRetry)
			return nil, err
		}
		m.followerMu.Lock()
		m.followerCerts[flavorKey] = &followerCertEntry{cert: cert, loadedAt: time.Now()}
		delete(m.followerFirstMiss, flavorKey)
		m.followerMu.Unlock()
		return cert, nil
	}

	m.logger.Warn("TLS: follower has no certificate for domain - waiting for cluster leader to publish",
		"domain", domain, "key", flavorKey, "waiting", elapsed, "escape_after", followerEscapeThreshold)
	return nil, fmt.Errorf("%w for %s: certificate not yet published by cluster leader", ErrCertificateUnavailable, domain)
}

// loadFollowerCert reads a certificate bundle from the shared store and
// validates it. The plain Get is local-first (with S3 fallback and in-window
// freshness revalidation); if what it returns is unservable — e.g. an expired
// local copy pinned by revalidation throttling while the leader has already
// published a renewal — a direct S3 refresh is attempted before giving up.
func (m *Manager) loadFollowerCert(ctx context.Context, flavorKey, domain string, wantRSA bool, now time.Time) *tls.Certificate {
	if m.fallbackCache == nil {
		// Defensive: the follower path requires shared S3 storage (enforced
		// at startup for clustered deployments).
		m.logger.Error("TLS: follower path without shared certificate storage - cannot serve", "domain", domain)
		return nil
	}

	if data, err := m.fallbackCache.Get(ctx, flavorKey); err == nil {
		cert, perr := parseCertBundle(data, domain, wantRSA, now)
		if perr == nil {
			return cert
		}
		m.logger.Warn("TLS: stored certificate not servable - refreshing from S3",
			"domain", domain, "key", flavorKey, "error", perr)
		if data, err := m.fallbackCache.RefreshFromS3(ctx, flavorKey); err == nil {
			cert, perr := parseCertBundle(data, domain, wantRSA, now)
			if perr == nil {
				return cert
			}
			m.logger.Warn("TLS: S3 certificate not servable either",
				"domain", domain, "key", flavorKey, "error", perr)
		}
	}
	return nil
}
