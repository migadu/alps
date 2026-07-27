package tlsmanager

import (
	"context"
	"crypto/tls"
	"math/rand/v2"
	"sync"
	"time"
)

const (
	// warmerInitialDelayMin/Max: jittered startup delay. At fleet boot every
	// node briefly considers itself cluster leader until memberlist join
	// converges (initial Join is best-effort and the rejoin loop retries every
	// 30s), so warming immediately would make N nodes bulk-issue all domains
	// against Let's Encrypt simultaneously. By 60-120s only the real leader
	// still passes the leadership check.
	warmerInitialDelayMin = 60 * time.Second
	warmerInitialDelayMax = 120 * time.Second

	// warmerInterval is the cadence of periodic warm passes. autocert serves
	// still-valid certs from cache without touching ACME, so passes outside
	// the renewal window are cheap no-issuance checks.
	warmerInterval = 12 * time.Hour

	// warmerLeaderPoll is how often leadership is re-checked between passes so
	// a newly promoted leader converges quickly instead of waiting for the
	// next 12h tick (followers hold no warm state).
	warmerLeaderPoll = 15 * time.Second

	// warmerMinPassGap bounds how often warm passes may run regardless of the
	// trigger (tick, promotion). Combined with one attempt per domain per
	// pass, this keeps ACME failure retries far below Let's Encrypt's
	// 5-failed-validations/hour limit even under leadership flapping.
	warmerMinPassGap = 15 * time.Minute

	// warmerDomainGap spaces per-domain issuance attempts within a pass.
	warmerDomainGap = 2 * time.Second
)

// certWarmer proactively obtains and renews certificates for all configured
// domains on the cluster leader (or the sole node in single-instance mode).
// This keeps the shared certificate store populated independent of which node
// receives traffic, so followers essentially never encounter a domain the
// leader has not already issued for, and renewal happens on the leader's
// schedule rather than opportunistically on whichever node a handshake lands.
type certWarmer struct {
	m       *Manager
	domains []string
	warmRSA bool

	mu       sync.Mutex
	lastPass time.Time
	pending  bool // A pass was deferred (S3 unhealthy) and should be retried

	stopCh   chan struct{}
	doneCh   chan struct{}
	stopOnce sync.Once
}

func newCertWarmer(m *Manager, domains []string, warmRSA bool) *certWarmer {
	return &certWarmer{
		m:       m,
		domains: domains,
		warmRSA: warmRSA,
		stopCh:  make(chan struct{}),
		doneCh:  make(chan struct{}),
	}
}

// Start launches the warmer loop in a background goroutine.
func (w *certWarmer) Start() {
	go w.run()
}

// Stop terminates the warmer loop and waits briefly for it to exit.
func (w *certWarmer) Stop() {
	w.stopOnce.Do(func() { close(w.stopCh) })
	select {
	case <-w.doneCh:
	case <-time.After(5 * time.Second):
		w.m.logger.Warn("cert warmer stop timed out")
	}
}

func (w *certWarmer) run() {
	defer close(w.doneCh)
	defer func() {
		if r := recover(); r != nil {
			w.m.logger.Error("panic in cert warmer", "panic", r)
		}
	}()

	delay := warmerInitialDelayMin +
		time.Duration(rand.Int64N(int64(warmerInitialDelayMax-warmerInitialDelayMin)))
	select {
	case <-time.After(delay):
	case <-w.stopCh:
		return
	}

	w.maybeWarm()

	ticker := time.NewTicker(warmerInterval)
	defer ticker.Stop()
	leaderPoll := time.NewTicker(warmerLeaderPoll)
	defer leaderPoll.Stop()

	wasLeader := w.isLeader()
	for {
		select {
		case <-ticker.C:
			w.maybeWarm()
		case <-leaderPoll.C:
			is := w.isLeader()
			if is && !wasLeader {
				// Leadership acquired (leader restart or handover): converge
				// immediately so the cluster is not left without an issuer.
				w.m.logger.Info("cert warmer: leadership acquired - running warm pass")
				w.maybeWarm()
			} else if is && w.isPending() {
				// A pass was deferred while S3 was unhealthy: retry it now
				// instead of waiting for the 12h ticker. maybeWarm re-checks
				// S3 health, so this stays a cheap no-op until S3 is worth
				// probing again.
				w.maybeWarm()
			}
			wasLeader = is
		case <-w.stopCh:
			return
		}
	}
}

// isLeader reports whether this node should warm certificates. With no cluster
// leadership wired (single-instance mode) the answer is always yes: proactive
// renewal is just as valuable there, replacing renewal that would otherwise
// only be triggered by client handshakes.
func (w *certWarmer) isLeader() bool {
	if w.m.isLeader == nil {
		return true
	}
	return w.m.isLeader()
}

// isPending reports whether a warm pass was deferred and awaits retry.
func (w *certWarmer) isPending() bool {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.pending
}

func (w *certWarmer) maybeWarm() {
	if !w.isLeader() {
		return
	}

	w.mu.Lock()
	if time.Since(w.lastPass) < warmerMinPassGap {
		w.mu.Unlock()
		return
	}
	w.mu.Unlock()

	// Defer issuance while S3 is unreachable: a cert (or challenge token) that
	// cannot be replicated to the shared store does not help the cluster, and
	// challenge validation may land on another node that reads from S3. The
	// deferral does NOT consume the pass budget (lastPass) — the pending flag
	// makes the leadership poll retry as soon as S3 is worth probing again,
	// rather than silently waiting for the next 12h tick.
	if fc := w.m.fallbackCache; fc != nil && !fc.S3Healthy() {
		w.m.logger.Warn("cert warmer: S3 unavailable - deferring warm pass")
		w.mu.Lock()
		w.pending = true
		w.mu.Unlock()
		return
	}

	w.mu.Lock()
	w.lastPass = time.Now()
	w.pending = false
	w.mu.Unlock()

	w.m.logger.Debug("cert warmer: starting warm pass", "domains", len(w.domains))
	for i, domain := range w.domains {
		// Re-check leadership before EACH domain: leadership can move
		// mid-pass (e.g. the lexicographically smallest node rejoining) and
		// two nodes warming concurrently is exactly the duplicate-issuance
		// this component exists to prevent.
		if !w.isLeader() {
			w.m.logger.Info("cert warmer: lost leadership mid-pass - stopping", "completed", i, "total", len(w.domains))
			return
		}
		w.warmDomain(domain)

		select {
		case <-time.After(warmerDomainGap):
		case <-w.stopCh:
			return
		}
	}
	w.m.logger.Debug("cert warmer: warm pass complete", "domains", len(w.domains))

	// Repair pass: push any certificates that exist only locally back to S3
	// (e.g. a wiped or hollowed store). autocert's cert() is state-first, so
	// a leader whose certs live in memory and on local disk would otherwise
	// never re-publish them, leaving followers with nothing to read. It also
	// adopts newer S3 certs locally and cleans orphaned challenge tokens.
	if fc := w.m.fallbackCache; fc != nil {
		syncCtx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		if err := fc.SyncAllToS3(syncCtx); err != nil {
			w.m.logger.Warn("cert warmer: store repair sync failed", "error", err)
		}
		cancel()
	}
}

func (w *certWarmer) warmDomain(domain string) {
	// ECDSA first: it is the flavor modern clients request (autocert keys the
	// cache by flavor — plain "domain" for ECDSA, "domain+rsa" for legacy).
	// A bare ClientHelloInfo would fail autocert's supportsECDSA check and
	// issue only the RSA variant that real handshakes never read.
	flavors := []struct {
		name  string
		hello *tls.ClientHelloInfo
	}{
		{"ecdsa", warmECDSAHello(domain)},
	}
	if w.warmRSA {
		flavors = append(flavors, struct {
			name  string
			hello *tls.ClientHelloInfo
		}{"rsa", warmRSAHello(domain)})
	}

	for _, f := range flavors {
		// Call the autocert manager directly rather than the wrapped
		// GetCertificate: the wrapper's SNI-default and cluster-gating logic
		// is for real handshakes. autocert manages its own timeout context;
		// still-valid cached certs return without touching ACME, and failures
		// are not retried until the next pass (>= warmerMinPassGap away).
		if _, err := w.m.autocertManager.GetCertificate(f.hello); err != nil {
			w.m.logger.Error("cert warmer: failed to obtain certificate",
				"domain", domain, "flavor", f.name, "error", err)
		}
	}
}

// warmECDSAHello builds a synthetic ClientHello that autocert's supportsECDSA
// resolves to the default ECDSA flavor (cache key "domain"): the signature
// scheme, curve, and cipher-suite checks must all pass.
func warmECDSAHello(domain string) *tls.ClientHelloInfo {
	return &tls.ClientHelloInfo{
		ServerName:       domain,
		CipherSuites:     []uint16{tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256},
		SupportedCurves:  []tls.CurveID{tls.CurveP256},
		SignatureSchemes: []tls.SignatureScheme{tls.ECDSAWithP256AndSHA256},
	}
}

// warmRSAHello builds a synthetic ClientHello with no ECDSA capability, which
// autocert resolves to the legacy RSA flavor (cache key "domain+rsa").
func warmRSAHello(domain string) *tls.ClientHelloInfo {
	return &tls.ClientHelloInfo{
		ServerName:   domain,
		CipherSuites: []uint16{tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256},
	}
}
