package tlsmanager

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/minio/minio-go/v7"
	"golang.org/x/crypto/acme"
	"golang.org/x/crypto/acme/autocert"
)

// TLSProvider represents the type of TLS certificate provider
type TLSProvider string

const (
	ProviderFile        TLSProvider = "file"
	ProviderLetsEncrypt TLSProvider = "letsencrypt"
)

// Config holds TLS manager configuration
type Config struct {
	Enabled     bool
	Provider    TLSProvider
	CertFile    string
	KeyFile     string
	LetsEncrypt *LetsEncryptConfig
}

// LetsEncryptConfig holds Let's Encrypt autocert configuration
type LetsEncryptConfig struct {
	Email           string
	Domains         []string
	StorageProvider string // Currently only "s3" supported
	EnableFallback  bool
	FallbackDir     string
	RenewBefore     time.Duration
	ACMEServer      string // Empty = production, or staging URL
	S3              S3CacheConfig
	Cluster         ClusterConfig
}

// ClusterConfig holds cluster coordination configuration
type ClusterConfig struct {
	Enabled       bool          // Enable cluster mode with leader election
	LeaderLockKey string        // S3 key for leader lock (default: "autocert/leader.lock")
	LeaderTTL     time.Duration // Leader lock TTL (default: 60s)
	RenewInterval time.Duration // How often to renew leader lock (default: 30s)
}

// Manager handles TLS certificate provisioning and management
type Manager struct {
	config        *Config
	tlsConfig     *tls.Config
	autocertMgr   *autocert.Manager
	fallbackCache *FallbackCache
	clusterCache  *ClusterCache
	s3Client      *minio.Client
	logger        *slog.Logger
}

// NewManager creates a new TLS manager
func NewManager(cfg *Config, logger *slog.Logger) (*Manager, error) {
	if logger == nil {
		logger = slog.Default()
	}

	m := &Manager{
		config: cfg,
		logger: logger,
	}

	if !cfg.Enabled {
		logger.Info("tls disabled")
		return m, nil
	}

	switch cfg.Provider {
	case ProviderFile:
		if err := m.initFileProvider(); err != nil {
			return nil, fmt.Errorf("failed to initialize file provider: %w", err)
		}
	case ProviderLetsEncrypt:
		if err := m.initLetsEncryptProvider(); err != nil {
			return nil, fmt.Errorf("failed to initialize letsencrypt provider: %w", err)
		}
	default:
		return nil, fmt.Errorf("unsupported tls provider: %s", cfg.Provider)
	}

	return m, nil
}

// initFileProvider initializes static file-based certificates
func (m *Manager) initFileProvider() error {
	if m.config.CertFile == "" || m.config.KeyFile == "" {
		return errors.New("cert_file and key_file are required for file provider")
	}

	cert, err := tls.LoadX509KeyPair(m.config.CertFile, m.config.KeyFile)
	if err != nil {
		return fmt.Errorf("failed to load certificate: %w", err)
	}

	m.tlsConfig = &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   tls.VersionTLS12,
	}

	m.logger.Info("tls file provider initialized", "cert", m.config.CertFile, "key", m.config.KeyFile)
	return nil
}

// initLetsEncryptProvider initializes Let's Encrypt autocert
func (m *Manager) initLetsEncryptProvider() error {
	cfg := m.config.LetsEncrypt
	if cfg == nil {
		return errors.New("letsencrypt configuration is required")
	}

	if len(cfg.Domains) == 0 {
		return errors.New("at least one domain is required for letsencrypt")
	}

	if cfg.Email == "" {
		return errors.New("email is required for letsencrypt")
	}

	// Validate storage provider
	if cfg.StorageProvider != "s3" {
		return fmt.Errorf("unsupported storage provider: %s (only 's3' is supported)", cfg.StorageProvider)
	}

	// Create S3 cache
	s3cache, err := NewS3Cache(cfg.S3, m.logger.With("component", "s3cache"))
	if err != nil {
		return fmt.Errorf("failed to create s3 cache: %w", err)
	}

	// Store S3 client for cluster cache
	m.s3Client = s3cache.client

	// Create fallback cache
	var fallbackDir string
	if cfg.EnableFallback {
		fallbackDir = cfg.FallbackDir
		if fallbackDir == "" {
			fallbackDir = "/var/lib/alps/certs"
		}

		// Ensure directory permissions
		if err := EnsureCacheDirPermissions(fallbackDir); err != nil {
			m.logger.Warn("failed to set cache directory permissions", "dir", fallbackDir, "error", err)
		}
	}

	m.fallbackCache, err = NewFallbackCache(s3cache, fallbackDir, m.logger.With("component", "fallbackcache"))
	if err != nil {
		return fmt.Errorf("failed to create fallback cache: %w", err)
	}

	// Wrap with cluster cache if cluster mode is enabled
	var cache autocert.Cache = m.fallbackCache
	if cfg.Cluster.Enabled {
		m.logger.Info("cluster mode enabled, initializing leader election")

		clusterCfg := ClusterCacheConfig{
			LeaderLockKey: cfg.Cluster.LeaderLockKey,
			LeaderTTL:     cfg.Cluster.LeaderTTL,
			RenewInterval: cfg.Cluster.RenewInterval,
		}

		m.clusterCache, err = NewClusterCache(
			m.fallbackCache,
			m.s3Client,
			cfg.S3.Bucket,
			clusterCfg,
			m.logger.With("component", "clustercache"),
		)
		if err != nil {
			return fmt.Errorf("failed to create cluster cache: %w", err)
		}

		cache = m.clusterCache

		m.logger.Info("cluster mode initialized",
			"instance_id", m.clusterCache.GetInstanceID(),
			"is_leader", m.clusterCache.IsLeader())
	}

	// Create autocert manager
	m.autocertMgr = &autocert.Manager{
		Prompt:      autocert.AcceptTOS,
		Email:       cfg.Email,
		HostPolicy:  autocert.HostWhitelist(cfg.Domains...),
		Cache:       cache,
		RenewBefore: cfg.RenewBefore,
	}

	// Set custom ACME server if specified (for staging/testing)
	if cfg.ACMEServer != "" {
		m.autocertMgr.Client = &acme.Client{
			DirectoryURL: cfg.ACMEServer,
		}
		m.logger.Info("using custom acme server", "url", cfg.ACMEServer)
	}

	// Create TLS config with GetCertificate callback
	baseTLSConfig := m.autocertMgr.TLSConfig()
	m.tlsConfig = &tls.Config{
		GetCertificate: func(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
			if hello.ServerName == "" {
				m.logger.Warn("tls handshake without SNI rejected")
				return nil, errors.New("missing SNI")
			}

			m.logger.Debug("getting certificate", "server_name", hello.ServerName)

			cert, err := baseTLSConfig.GetCertificate(hello)
			if err != nil {
				m.logger.Error("certificate unavailable", "server_name", hello.ServerName, "error", err)
				return nil, fmt.Errorf("certificate unavailable for %s: %w", hello.ServerName, err)
			}

			m.logger.Debug("certificate provided", "server_name", hello.ServerName)
			return cert, nil
		},
		MinVersion: tls.VersionTLS12,
		NextProtos: []string{"h2", "http/1.1"}, // Support HTTP/2
	}

	m.logger.Info("tls letsencrypt provider initialized",
		"domains", cfg.Domains,
		"email", cfg.Email,
		"storage", cfg.StorageProvider,
		"fallback_enabled", cfg.EnableFallback,
		"fallback_dir", fallbackDir)

	return nil
}

// GetTLSConfig returns the TLS configuration for servers
func (m *Manager) GetTLSConfig() *tls.Config {
	return m.tlsConfig
}

// HTTPHandler returns the HTTP-01 challenge handler for Let's Encrypt
// This should be served on port 80 for ACME validation
func (m *Manager) HTTPHandler() http.Handler {
	if m.autocertMgr == nil {
		// Return 404 handler if not using Let's Encrypt
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.NotFound(w, r)
		})
	}
	return m.autocertMgr.HTTPHandler(nil)
}

// SyncAllToS3 manually syncs all local certificates to S3
func (m *Manager) SyncAllToS3() error {
	if m.fallbackCache == nil {
		return errors.New("fallback cache not initialized")
	}
	return m.fallbackCache.SyncAllToS3(context.Background())
}

// GetCacheDir returns the local cache directory path
func (m *Manager) GetCacheDir() string {
	if m.fallbackCache == nil {
		return ""
	}
	return m.fallbackCache.GetCacheDir()
}

// Close cleans up resources
func (m *Manager) Close() error {
	var err error

	// Close cluster cache first (releases leadership)
	if m.clusterCache != nil {
		if closeErr := m.clusterCache.Close(); closeErr != nil {
			m.logger.Error("failed to close cluster cache", "error", closeErr)
			err = closeErr
		}
	}

	// Close fallback cache
	if m.fallbackCache != nil {
		if closeErr := m.fallbackCache.Close(); closeErr != nil {
			m.logger.Error("failed to close fallback cache", "error", closeErr)
			if err == nil {
				err = closeErr
			}
		}
	}

	return err
}

// IsLeader returns whether this instance is the current leader (cluster mode only)
func (m *Manager) IsLeader() bool {
	if m.clusterCache == nil {
		return true // Non-cluster mode, always leader
	}
	return m.clusterCache.IsLeader()
}

// GetInstanceID returns the unique instance ID (cluster mode only)
func (m *Manager) GetInstanceID() string {
	if m.clusterCache == nil {
		return "standalone"
	}
	return m.clusterCache.GetInstanceID()
}

// IsEnabled returns whether TLS is enabled
func (m *Manager) IsEnabled() bool {
	return m.config.Enabled
}

// GetProvider returns the TLS provider type
func (m *Manager) GetProvider() TLSProvider {
	return m.config.Provider
}
