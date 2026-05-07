package tlsmanager

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/retry"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"golang.org/x/crypto/acme/autocert"

	"github.com/migadu/alps/tlsmanager/storage"
)

var (
	ErrMissingServerName      = errors.New("missing server name")
	ErrHostNotAllowed         = errors.New("host not configured")
	ErrCertificateUnavailable = errors.New("certificate unavailable")
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
	Email               string
	Domains             []string
	DefaultDomain       string // Default domain for SNI-less connections
	StorageProvider     string // "s3" or "file"
	CacheDir            string // Directory for local file cache
	SyncIntervalMinutes int    // Interval for syncing local cache to S3
	ACMEHTTPAddr        string // Address for HTTP-01 challenge handler (e.g., ":8080")
	S3                  S3Config
}

type S3Config struct {
	Bucket    string
	Region    string
	Endpoint  string
	Prefix    string
	AccessKey string
	SecretKey string
}

// Manager orchestrates TLS certificate management using Let's Encrypt.
type Manager struct {
	config          *Config
	autocertManager *autocert.Manager
	logger          *slog.Logger
	domains         []string
	defaultDomain   string                  // Default domain for SNI-less connections
	syncWorker      *storage.CertSyncWorker // Periodic S3 sync worker (nil if not using S3)
	tlsConfig       *tls.Config             // Cached TLS config
}

// NewManager creates a new TLS manager.
func NewManager(cfg *Config, logger *slog.Logger, isLeaderF ...func() bool) (*Manager, error) {
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
		return m, m.initAutocert(isLeaderF...)
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

func (m *Manager) initAutocert(isLeaderF ...func() bool) error {
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

	var cache autocert.Cache
	var syncWorker *storage.CertSyncWorker

	switch cfg.StorageProvider {
	case "s3":
		// Create S3 cache
		s3Cache, err := createS3Cache(context.Background(), *cfg, m.logger)
		if err != nil {
			return err
		}

		// Create fallback cache (local file + S3) for hybrid storage
		cacheDir := cfg.CacheDir
		if cacheDir == "" {
			cacheDir = "cert-cache" // Default local cache directory
		}
		fallbackCache := storage.NewFallbackCache(cacheDir, s3Cache, m.logger)
		cache = fallbackCache

		// Start periodic sync worker
		syncInterval := time.Duration(cfg.SyncIntervalMinutes) * time.Minute
		if syncInterval == 0 {
			syncInterval = 5 * time.Minute // Default: 5 minutes
		}
		syncWorker = storage.NewCertSyncWorker(fallbackCache, syncInterval, m.logger)
		syncWorker.Start()

		prefixInfo := cfg.S3.Prefix
		if prefixInfo == "" {
			prefixInfo = "(none - bucket root)"
		}
		m.logger.Info("using hybrid file+S3 certificate cache with periodic sync",
			"local_cache_dir", cacheDir,
			"s3_bucket", cfg.S3.Bucket,
			"s3_prefix", prefixInfo,
			"sync_interval", syncInterval)

	case "file":
		// Use autocert.DirCache for local filesystem storage only
		cacheDir := cfg.CacheDir
		if cacheDir == "" {
			cacheDir = "cert-cache"
		}
		cache = autocert.DirCache(cacheDir)
		m.logger.Info("using file-based certificate cache",
			"cache_dir", cacheDir)

	default:
		return fmt.Errorf("unsupported storage provider: %s", cfg.StorageProvider)
	}

	var leaderFunc func() bool
	if len(isLeaderF) > 0 && isLeaderF[0] != nil {
		leaderFunc = isLeaderF[0]
		cache = storage.NewClusterAwareCache(cache, leaderFunc, m.logger)
		m.logger.Info("TLS certificate cache wrapped with cluster-aware leader gating")
	} else {
		m.logger.Info("TLS running in single-instance mode (no cluster leader election)")
	}

	autocertMgr := &autocert.Manager{
		Prompt:     autocert.AcceptTOS,
		HostPolicy: autocert.HostWhitelist(cfg.Domains...),
		Cache:      cache,
		Email:      cfg.Email,
	}

	// Determine default domain for SNI-less connections
	defaultDomain := cfg.DefaultDomain
	if defaultDomain == "" && len(cfg.Domains) > 0 {
		defaultDomain = cfg.Domains[0]
	}

	m.autocertManager = autocertMgr
	m.domains = cfg.Domains
	m.defaultDomain = defaultDomain
	m.syncWorker = syncWorker

	// Create base TLS config
	baseTLSConfig := autocertMgr.TLSConfig()
	baseTLSConfig.MinVersion = tls.VersionTLS12

	// Wrap GetCertificate with enhanced logging and SNI handling
	originalGetCert := baseTLSConfig.GetCertificate
	baseTLSConfig.GetCertificate = func(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
		serverName := hello.ServerName

		if serverName == "" {
			if defaultDomain != "" {
				m.logger.Debug("TLS: missing SNI - using default domain", "domain", defaultDomain)
				serverName = defaultDomain
			} else {
				m.logger.Debug("TLS: rejected certificate request - missing SNI and no default domain")
				return nil, ErrMissingServerName
			}
		}

		serverName = strings.ToLower(serverName)

		if isIPAddress(serverName) {
			m.logger.Debug("TLS: rejected certificate request for IP address", "ip", serverName)
			return nil, fmt.Errorf("%w: IP addresses not supported", ErrHostNotAllowed)
		}

		if err := autocertMgr.HostPolicy(nil, serverName); err != nil {
			m.logger.Debug("TLS: rejected certificate request for unconfigured domain", "domain", serverName)
			return nil, fmt.Errorf("%w: %s", ErrHostNotAllowed, serverName)
		}

		m.logger.Debug("TLS: certificate request", "domain", serverName)

		modifiedHello := *hello
		modifiedHello.ServerName = serverName

		cert, err := originalGetCert(&modifiedHello)
		if err != nil {
			m.logger.Error("TLS: failed to get certificate", "server_name", serverName, "error", err)
			return nil, fmt.Errorf("%w for %s: %v", ErrCertificateUnavailable, serverName, err)
		}
		return cert, nil
	}

	m.tlsConfig = baseTLSConfig

	m.logger.Info("TLS manager initialized",
		"domains", cfg.Domains,
		"email", cfg.Email,
		"storage", cfg.StorageProvider,
		"default_domain", defaultDomain)

	return nil
}

func (m *Manager) GetTLSConfig() *tls.Config { return m.tlsConfig }
func (m *Manager) IsEnabled() bool           { return m.config.Enabled }
func (m *Manager) GetProvider() TLSProvider  { return m.config.Provider }

func (m *Manager) GetACMEHTTPAddr() string {
	if m.config == nil || m.config.LetsEncrypt == nil {
		return ""
	}
	return m.config.LetsEncrypt.ACMEHTTPAddr
}

func (m *Manager) HTTPHandler() http.Handler {
	if m == nil || m.autocertManager == nil {
		return http.NotFoundHandler()
	}
	// Return the autocert HTTPHandler which handles /.well-known/acme-challenge/
	return m.autocertManager.HTTPHandler(http.NotFoundHandler())
}

// Stop gracefully shuts down the TLS manager and its sync worker.
func (m *Manager) Close() error {
	if m == nil {
		return nil
	}

	if m.syncWorker != nil {
		m.logger.Info("stopping certificate sync worker")
		m.syncWorker.Stop(10 * time.Second)
	}
	return nil
}

func createS3Cache(ctx context.Context, cfg LetsEncryptConfig, logger *slog.Logger) (*storage.S3Cache, error) {
	initCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	awsCfg, err := awsconfig.LoadDefaultConfig(initCtx,
		awsconfig.WithRetryer(func() aws.Retryer {
			return retry.NewStandard(func(o *retry.StandardOptions) {
				o.MaxAttempts = 3
				o.MaxBackoff = 5 * time.Second
			})
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	if cfg.S3.Region != "" {
		awsCfg.Region = cfg.S3.Region
	} else if cfg.S3.Endpoint != "" {
		// Provide a default region to prevent AWS SDK from querying EC2 metadata service and hanging
		awsCfg.Region = "us-east-1"
		logger.Debug("No S3 region provided, falling back to us-east-1")
	}

	if cfg.S3.AccessKey != "" && cfg.S3.SecretKey != "" {
		awsCfg.Credentials = credentials.NewStaticCredentialsProvider(
			cfg.S3.AccessKey,
			cfg.S3.SecretKey,
			"",
		)
	}

	var s3Client *s3.Client
	if cfg.S3.Endpoint != "" {
		endpoint := cfg.S3.Endpoint
		if !strings.HasPrefix(endpoint, "http://") && !strings.HasPrefix(endpoint, "https://") {
			endpoint = "https://" + endpoint
		}

		s3Client = s3.NewFromConfig(awsCfg, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(endpoint)
			o.UsePathStyle = true
		})
		logger.Info("using custom S3 endpoint", "endpoint", endpoint)
	} else {
		s3Client = s3.NewFromConfig(awsCfg)
	}

	logger.Info("validating S3 bucket access", "bucket", cfg.S3.Bucket)

	maxRetries := 5
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			backoff := time.Duration(1<<uint(attempt-1)) * time.Second
			select {
			case <-time.After(backoff):
			case <-initCtx.Done():
				return nil, fmt.Errorf("S3 bucket validation cancelled: %w", initCtx.Err())
			}
		}

		_, err = s3Client.HeadBucket(initCtx, &s3.HeadBucketInput{
			Bucket: &cfg.S3.Bucket,
		})
		if err == nil {
			break
		}
	}

	if err != nil {
		return nil, fmt.Errorf("S3 bucket validation failed after %d attempts: %w", maxRetries, err)
	}

	s3Cache := &storage.S3Cache{
		S3Client: s3Client,
		Bucket:   cfg.S3.Bucket,
		Prefix:   cfg.S3.Prefix,
		Logger:   logger,
	}

	return s3Cache, nil
}

func isIPAddress(host string) bool {
	return net.ParseIP(host) != nil
}
