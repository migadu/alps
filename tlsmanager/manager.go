package tlsmanager

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"hash/fnv"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/caddyserver/certmagic"
	"go.uber.org/zap"
)

type TLSProvider string

const (
	ProviderFile        TLSProvider = "file"
	ProviderLetsEncrypt TLSProvider = "letsencrypt"
)

type Config struct {
	Enabled     bool
	Provider    TLSProvider
	CertFile    string
	KeyFile     string
	LetsEncrypt *LetsEncryptConfig
}

type LetsEncryptConfig struct {
	Email                  string
	Domains                []string
	DefaultDomain          string        // Fallback for SNI-less connections
	ACMEServer             string        // Empty = production
	ACMEHTTPAddr           string        // Address for HTTP-01 challenge handler (e.g., ":8080")
	RenewBefore            time.Duration // How long before expiry to renew (default: 30 days)
	RenewalJitter          *bool         // Enable per-node jitter (nil = true)
	EnableTLSALPNChallenge bool          // Enable TLS-ALPN-01 challenges (default: false, requires port 443)
	Storage                S3StorageConfig
}

// RenewalJitterEnabled returns whether jitter is enabled (default: true)
func (c *LetsEncryptConfig) RenewalJitterEnabled() bool {
	if c.RenewalJitter == nil {
		return true
	}
	return *c.RenewalJitter
}

type Manager struct {
	config     *Config
	tlsConfig  *tls.Config
	cache      *certmagic.Cache // For cleanup
	magic      *certmagic.Config
	acmeIssuer *certmagic.ACMEIssuer
	storage    *S3Storage
	logger     *slog.Logger
}

func NewManager(cfg *Config, logger *slog.Logger) (*Manager, error) {
	if logger == nil {
		logger = slog.Default()
	}

	m := &Manager{config: cfg, logger: logger}

	if !cfg.Enabled {
		logger.Info("tls disabled")
		return m, nil
	}

	switch cfg.Provider {
	case ProviderFile:
		return m, m.initFileProvider()
	case ProviderLetsEncrypt:
		return m, m.initCertMagic()
	default:
		return nil, fmt.Errorf("unsupported provider: %s", cfg.Provider)
	}
}

func (m *Manager) initFileProvider() error {
	if m.config.CertFile == "" || m.config.KeyFile == "" {
		return errors.New("cert_file and key_file required")
	}

	cert, err := tls.LoadX509KeyPair(m.config.CertFile, m.config.KeyFile)
	if err != nil {
		return fmt.Errorf("load certificate: %w", err)
	}

	m.tlsConfig = &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   tls.VersionTLS12,
	}
	return nil
}

func (m *Manager) initCertMagic() error {
	cfg := m.config.LetsEncrypt
	if cfg == nil {
		return errors.New("letsencrypt config required")
	}
	if len(cfg.Domains) == 0 {
		return errors.New("at least one domain required")
	}
	if cfg.Email == "" {
		return errors.New("email required")
	}

	// Create S3 storage
	storage, err := NewS3Storage(cfg.Storage, m.logger.With("component", "s3"))
	if err != nil {
		return fmt.Errorf("create storage: %w", err)
	}
	m.storage = storage

	// CertMagic uses RenewalWindowRatio = remaining/total lifetime.
	// For 90-day Let's Encrypt certs:
	//   - ratio 0.33 = renew when 30 days remain (default)
	//   - ratio 0.50 = renew when 45 days remain
	//   - ratio 0.11 = renew when 10 days remain
	//
	// We convert renew_before duration to ratio, then apply optional jitter.
	//
	// NOTE: This assumes 90-day certificate lifetime (Let's Encrypt default).
	// If using a custom ACME server with different cert duration, the actual
	// renewal timing will differ from renew_before. For example, with 30-day
	// certs and renew_before=720h, the ratio would be 1.0 (renew immediately).
	certLifetime := 90 * 24 * time.Hour

	renewBefore := cfg.RenewBefore
	if renewBefore == 0 {
		renewBefore = 30 * 24 * time.Hour // Default: 30 days
	}

	// Warn if renew_before seems unusual
	if renewBefore < 7*24*time.Hour {
		m.logger.Warn("renew_before is less than 7 days, certificates may expire before renewal completes",
			"renew_before", renewBefore)
	}
	if renewBefore > 60*24*time.Hour {
		m.logger.Warn("renew_before exceeds 60 days, certificates will renew very frequently",
			"renew_before", renewBefore)
	}

	// Convert duration to ratio
	renewalWindowRatio := float64(renewBefore) / float64(certLifetime)

	// Apply optional jitter (±12 hours spread)
	if cfg.RenewalJitterEnabled() {
		jitter := m.calculateJitter(storage.GetNodeID())
		jitterRatio := float64(jitter) / float64(certLifetime)
		renewalWindowRatio += jitterRatio

		m.logger.Info("renewal jitter enabled",
			"node_id", storage.GetNodeID(),
			"jitter", jitter,
			"base_renew_before", renewBefore,
			"effective_ratio", renewalWindowRatio)
	}

	// Clamp to valid CertMagic range (must be > 0 and < 1)
	if renewalWindowRatio < 0.01 {
		renewalWindowRatio = 0.01 // Minimum ~21 hours for 90-day cert
	}
	if renewalWindowRatio > 0.99 {
		renewalWindowRatio = 0.99
	}

	// Create CertMagic config (isolated, not global)
	cache := certmagic.NewCache(certmagic.CacheOptions{
		GetConfigForCert: func(certmagic.Certificate) (*certmagic.Config, error) {
			return m.magic, nil
		},
	})

	magicCfg := certmagic.Config{
		Storage:            storage,
		DefaultServerName:  cfg.DefaultDomain,
		RenewalWindowRatio: renewalWindowRatio,
	}

	magic := certmagic.New(cache, magicCfg)

	// Configure ACME issuer
	acmeIssuer := certmagic.NewACMEIssuer(magic, certmagic.ACMEIssuer{
		Email:  cfg.Email,
		Agreed: true,
		// TLS-ALPN-01 requires binding to port 443; disable unless explicitly enabled
		DisableTLSALPNChallenge: !cfg.EnableTLSALPNChallenge,
	})
	if cfg.ACMEServer != "" {
		acmeIssuer.CA = cfg.ACMEServer
	}

	// Note: We don't set AltHTTPPort here because main.go starts its own
	// HTTP server using HTTPHandler(). AltHTTPPort would make certmagic
	// start a competing listener on the same port.

	magic.Issuers = []certmagic.Issuer{acmeIssuer}
	m.cache = cache
	m.magic = magic
	m.acmeIssuer = acmeIssuer

	// Manage domains
	ctx := context.Background()
	if err := magic.ManageAsync(ctx, cfg.Domains); err != nil {
		return fmt.Errorf("manage domains: %w", err)
	}

	// Use CertMagic's TLSConfig (don't reimplement GetCertificate)
	m.tlsConfig = magic.TLSConfig()
	m.tlsConfig.MinVersion = tls.VersionTLS12

	m.logger.Info("certmagic initialized",
		"domains", cfg.Domains,
		"default_domain", cfg.DefaultDomain,
		"renew_before", renewBefore,
		"renewal_window_ratio", renewalWindowRatio)

	return nil
}

// calculateJitter returns deterministic jitter based on stable node ID.
// Spreads renewals ±12 hours around the base window (total 24h spread).
// Same node always gets the same jitter, even across restarts.
func (m *Manager) calculateJitter(nodeID string) time.Duration {
	h := fnv.New32a()
	h.Write([]byte(nodeID))
	hash := h.Sum32()

	maxJitter := 24 * time.Hour
	jitter := time.Duration(hash % uint32(maxJitter))

	// Center around zero: range becomes [-12h, +12h)
	return jitter - maxJitter/2
}

func (m *Manager) GetTLSConfig() *tls.Config { return m.tlsConfig }
func (m *Manager) IsEnabled() bool           { return m.config.Enabled }
func (m *Manager) GetProvider() TLSProvider  { return m.config.Provider }

// Close stops certificate management and releases resources.
// Must be called when shutting down to stop background renewal goroutines.
func (m *Manager) Close() error {
	if m.cache != nil {
		m.cache.Stop()
	}
	return nil
}

// HTTPHandler returns the HTTP-01 challenge handler for ACME validation.
//
// The caller is responsible for starting an HTTP server with this handler
// on the address specified by ACMEHTTPAddr (typically port 80 or an alternate
// port configured with your ACME provider).
//
// The handler checks for ACME challenge requests and responds appropriately.
// Non-challenge requests receive a 404.
func (m *Manager) HTTPHandler() http.Handler {
	if m.magic == nil {
		return http.NotFoundHandler()
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if this looks like an ACME HTTP challenge
		if certmagic.LooksLikeHTTPChallenge(r) {
			// Try to get the challenge for this identifier
			// The identifier is the host part of the request
			host := r.Host
			if idx := strings.Index(host, ":"); idx != -1 {
				host = host[:idx]
			}

			challenge, ok := certmagic.GetACMEChallenge(host)
			if ok {
				// Solve the challenge
				certmagic.SolveHTTPChallenge(zap.NewNop(), w, r, challenge.Challenge)
				return
			}
		}

		// Not a challenge request, return 404
		http.NotFound(w, r)
	})
}

// GetACMEHTTPAddr returns the configured address for the HTTP-01 challenge
// server, or empty string if not configured.
func (m *Manager) GetACMEHTTPAddr() string {
	if m.config.LetsEncrypt == nil {
		return ""
	}
	return m.config.LetsEncrypt.ACMEHTTPAddr
}
