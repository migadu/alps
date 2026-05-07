package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/emersion/go-message"
	"github.com/emersion/go-message/charset"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/migadu/alps"
	"github.com/migadu/alps/cluster"
	"github.com/migadu/alps/tlsmanager"
	"golang.org/x/text/encoding/charmap"
	_ "golang.org/x/text/encoding/japanese"
	_ "golang.org/x/text/encoding/korean"
	_ "golang.org/x/text/encoding/simplifiedchinese"
	_ "golang.org/x/text/encoding/traditionalchinese"
	_ "golang.org/x/text/encoding/unicode"
)

func setupCharsetHandling() {
	// Register charset decoders for handling emails with various character encodings
	// Note: The charset package automatically sets message.CharsetReader when imported,
	// but it doesn't include windows-1252 and some other common email charsets
	charset.RegisterEncoding("windows-1252", charmap.Windows1252)
	charset.RegisterEncoding("iso-8859-1", charmap.ISO8859_1)
	charset.RegisterEncoding("iso-8859-2", charmap.ISO8859_2)
	charset.RegisterEncoding("iso-8859-15", charmap.ISO8859_15)

	// Wrap the charset reader with a fallback that prevents crashes on unknown charsets
	message.CharsetReader = func(charsetName string, input io.Reader) (io.Reader, error) {
		// Try to use the charset package's Reader function (which uses our registered encodings)
		reader, err := charset.Reader(charsetName, input)
		if err == nil {
			return reader, nil
		}

		// If it's not an unknown charset error, propagate it
		if !message.IsUnknownCharset(err) {
			return nil, err
		}

		// If charset is unknown, fall back to Latin-1 which is byte-compatible
		// This prevents crashes and usually produces readable text for Western European emails
		return charmap.ISO8859_1.NewDecoder().Reader(input), nil
	}
}

var (
	version = "unknown"
	commit  = "unknown"
	date    = "unknown"
)

func main() {
	// Setup charset handling FIRST before any message parsing
	setupCharsetHandling()

	var (
		options      alps.Options
		configFile   string
		printVersion bool
	)
	flag.StringVar(&configFile, "config", "", "path to TOML configuration file")
	flag.BoolVar(&printVersion, "version", false, "print version information and exit")

	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "usage: alps -config <path-to-config.toml>\n")
		flag.PrintDefaults()
	}

	flag.Parse()

	if printVersion {
		fmt.Printf("alps %s (%s) built at %s\n", version, commit, date)
		os.Exit(0)
	}

	if configFile == "" {
		fmt.Fprintf(os.Stderr, "Error: -config flag is required\n")
		flag.Usage()
		os.Exit(1)
	}

	config, err := LoadConfig(configFile)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading config file: %v\n", err)
		os.Exit(1)
	}

	options, err = config.ToOptions()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error generating options: %v\n", err)
		os.Exit(1)
	}

	// Apply config file values
	if config.Server.TempDir != "" {
		if err := os.Setenv("TMPDIR", config.Server.TempDir); err != nil {
			fmt.Fprintf(os.Stderr, "Warning: failed to set TMPDIR: %v\n", err)
		}
	}

	// Create logger based on config or defaults
	logger := config.ToLogger()

	// Initialize cluster for leader election and gossip broadcasting (if enabled)
	var clusterMgr *cluster.Cluster
	if config.Cluster.Enabled {
		// Decode secret key from base64
		var secretKey []byte
		secretKeyStr := os.Getenv("CLUSTER_SECRET_KEY")
		if secretKeyStr == "" {
			secretKeyStr = config.Cluster.SecretKey
		}
		if secretKeyStr != "" {
			secretKey, err = cluster.DecodeSecretKey(secretKeyStr)
			if err != nil {
				logger.Fatalf("failed to decode cluster secret key: %v", err)
			}
		}

		nodeID := config.Cluster.NodeID
		if nodeID == "" {
			if h, hErr := os.Hostname(); hErr == nil {
				nodeID = h
			}
		}

		clusterMgr, err = cluster.NewCluster(cluster.Config{
			NodeName:  nodeID,
			BindAddr:  config.Cluster.GetBindAddr(),
			BindPort:  config.Cluster.GetBindPort(),
			Peers:     config.Cluster.Peers,
			SecretKey: secretKey,
			Logger:    slog.Default(),
		})
		if err != nil {
			logger.Errorf("failed to initialize cluster (falling back to single-node mode): %v", err)
			clusterMgr = nil
		} else {
			defer clusterMgr.Shutdown()
			options.ClusterBroadcaster = clusterMgr
		}
	}

	s, err := alps.New(logger, &options)
	if err != nil {
		logger.Fatal(err)
	}

	if clusterMgr != nil && s.RateLimiter != nil {
		clusterMgr.SetMessageHandler(s.RateLimiter.HandleClusterMessage)
	}

	// Initialize WebAuthn
	rpID := "localhost"
	rpDisplayName := "Alps Webmail"
	rpOrigins := []string{"http://localhost:1323", "http://localhost:5173"}

	if config.WebAuthn.RPID != "" {
		rpID = config.WebAuthn.RPID
	}
	if config.WebAuthn.RPDisplayName != "" {
		rpDisplayName = config.WebAuthn.RPDisplayName
	}
	if len(config.WebAuthn.RPOrigins) > 0 {
		rpOrigins = config.WebAuthn.RPOrigins
	}

	s.WebAuthn, err = webauthn.New(&webauthn.Config{
		RPDisplayName: rpDisplayName,
		RPID:          rpID,
		RPOrigins:     rpOrigins,
	})
	if err != nil {
		logger.Fatalf("Failed to initialize WebAuthn: %v", err)
	}

	// Initialize TLS manager if configured
	var tlsMgr *tlsmanager.Manager
	if config.TLS.Enabled {
		tlsCfg, err := buildTLSConfig(config.TLS)
		if err != nil {
			logger.Fatalf("Failed to build TLS config: %v", err)
		}

		// Create slog logger from alps logger for TLS manager
		slogLogger := slog.Default()

		if clusterMgr != nil {
			// Cluster enabled: only leader can request new certs from Let's Encrypt
			tlsMgr, err = tlsmanager.NewManager(tlsCfg, slogLogger, clusterMgr.IsLeader)
		} else {
			// Single-instance mode
			tlsMgr, err = tlsmanager.NewManager(tlsCfg, slogLogger)
		}

		if err != nil {
			logger.Fatalf("Failed to initialize TLS manager: %v", err)
		}
		defer tlsMgr.Close()

		// Start HTTP-01 challenge handler on all nodes for distributed solving.
		// This allows any node to serve challenges from shared storage (S3),
		// not just the node that initiated the certificate request.
		if tlsCfg.Provider == tlsmanager.ProviderLetsEncrypt {
			acmeHTTPAddr := tlsCfg.LetsEncrypt.ACMEHTTPAddr
			if acmeHTTPAddr == "" {
				acmeHTTPAddr = ":80"
			}
			go func() {
				logger.Infof("Starting ACME HTTP-01 challenge handler on %s", acmeHTTPAddr)
				if err := http.ListenAndServe(acmeHTTPAddr, tlsMgr.HTTPHandler()); err != nil {
					logger.Errorf("ACME HTTP-01 handler error: %v", err)
				}
			}()
		}
	}

	// Apply timeout defaults
	readTimeout := options.ReadTimeout
	if readTimeout == 0 {
		readTimeout = 10 * time.Second
	}
	writeTimeout := options.WriteTimeout
	if writeTimeout == 0 {
		writeTimeout = 30 * time.Second
	}
	idleTimeout := options.IdleTimeout
	if idleTimeout == 0 {
		idleTimeout = 120 * time.Second
	}

	httpServer := &http.Server{
		Addr:         config.Server.Addr,
		Handler:      s,
		ReadTimeout:  readTimeout,
		WriteTimeout: writeTimeout,
		IdleTimeout:  idleTimeout,
		ErrorLog: log.New(&tlsErrorFilter{
			logger: logger,
			debug:  options.Debug,
		}, "", 0),
	}

	// Add TLS config if enabled
	if tlsMgr != nil && tlsMgr.IsEnabled() {
		httpServer.TLSConfig = tlsMgr.GetTLSConfig()
	}

	go func() {
		logger.Infof("Starting server on %s", config.Server.Addr)
		if tlsMgr != nil && tlsMgr.IsEnabled() {
			// Start with TLS
			if err := httpServer.ListenAndServeTLS("", ""); err != nil && err != http.ErrServerClosed {
				logger.Fatal(err)
			}
		} else {
			// Start without TLS
			if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				logger.Fatal(err)
			}
		}
	}()

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)

	for sig := range sigs {
		if sig == syscall.SIGINT || sig == syscall.SIGTERM || sig == syscall.SIGHUP {
			break
		}
	}

	ctx, cancel := context.WithDeadline(context.Background(),
		time.Now().Add(30*time.Second))
	httpServer.Shutdown(ctx)
	cancel()

	s.Close()
}

// buildTLSConfig converts the config file TLS config to tlsmanager.Config
func buildTLSConfig(cfg TLSConfig) (*tlsmanager.Config, error) {
	tlsCfg := &tlsmanager.Config{
		Enabled:  cfg.Enabled,
		CertFile: cfg.CertFile,
		KeyFile:  cfg.KeyFile,
	}

	// Parse provider
	switch cfg.Provider {
	case "file":
		tlsCfg.Provider = tlsmanager.ProviderFile
	case "letsencrypt":
		tlsCfg.Provider = tlsmanager.ProviderLetsEncrypt
	default:
		return nil, fmt.Errorf("unsupported tls provider: %s", cfg.Provider)
	}

	// Build Let's Encrypt config if using that provider
	if tlsCfg.Provider == tlsmanager.ProviderLetsEncrypt {
		tlsCfg.LetsEncrypt = &tlsmanager.LetsEncryptConfig{
			Email:               cfg.LetsEncrypt.Email,
			Domains:             cfg.LetsEncrypt.Domains,
			DefaultDomain:       cfg.LetsEncrypt.DefaultDomain,
			StorageProvider:     cfg.LetsEncrypt.StorageProvider,
			CacheDir:            cfg.LetsEncrypt.CacheDir,
			SyncIntervalMinutes: cfg.LetsEncrypt.SyncIntervalMinutes,
			ACMEHTTPAddr:        cfg.LetsEncrypt.ACMEHTTPAddr,
			S3: tlsmanager.S3Config{
				Endpoint:  cfg.LetsEncrypt.S3.Endpoint,
				Bucket:    cfg.LetsEncrypt.S3.Bucket,
				AccessKey: cfg.LetsEncrypt.S3.AccessKeyID,
				SecretKey: cfg.LetsEncrypt.S3.SecretAccessKey,
				Region:    cfg.LetsEncrypt.S3.Region,
				Prefix:    cfg.LetsEncrypt.S3.Prefix,
			},
		}
	}

	return tlsCfg, nil
}

type tlsErrorFilter struct {
	logger alps.Logger
	debug  bool
}

func (f *tlsErrorFilter) Write(p []byte) (n int, err error) {
	msg := string(p)
	if strings.Contains(msg, "TLS handshake error") {
		if f.debug {
			f.logger.Debug(strings.TrimSpace(msg))
		}
		return len(p), nil
	}
	f.logger.Error(strings.TrimSpace(msg))
	return len(p), nil
}
