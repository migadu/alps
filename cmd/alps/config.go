package main

import (
	"fmt"
	"net"
	"os"
	"strings"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
)

// Config represents the TOML configuration file structure
type Config struct {
	Server   ServerConfig            `toml:"server"`
	Cache    CacheConfig             `toml:"cache"`
	Logging  LoggingConfig           `toml:"logging"`
	TLS      TLSConfig               `toml:"tls"`
	Provider ProviderConfig          `toml:"provider"`
	SMTP     SMTPConfig              `toml:"smtp"`
	WebAuthn WebAuthnConfig          `toml:"webauthn"`
	Cluster  ClusterConfig           `toml:"cluster"`
	Plugin   map[string]PluginConfig `toml:"plugin"`
}

type ClusterConfig struct {
	Enabled       bool     `toml:"enabled"`
	NodeID        string   `toml:"node_id"`
	Bind          string   `toml:"bind"`           // e.g., "0.0.0.0" or "0.0.0.0:7946"
	Port          int      `toml:"port"`           // default: 7946
	SecretKey     string   `toml:"secret_key"`     // base64 encoded 32-byte key
	AllowInsecure bool     `toml:"allow_insecure"` // permit running without secret_key (unencrypted gossip)
	Peers         []string `toml:"peers"`          // List of peer addresses
}

// GetBindAddr returns just the IP address part of Bind, or 0.0.0.0 if empty.
func (c *ClusterConfig) GetBindAddr() string {
	if c.Bind == "" {
		return "0.0.0.0"
	}
	// Check if bind contains a port (e.g. 127.0.0.1:7946)
	for i := len(c.Bind) - 1; i >= 0; i-- {
		if c.Bind[i] == ':' {
			return c.Bind[:i]
		}
	}
	return c.Bind
}

// GetBindPort returns the port to bind to.
// Order of precedence:
// 1. Port specified in Bind string (e.g., "0.0.0.0:8000")
// 2. Port field (e.g., port = 8000)
// 3. Default: 7946
func (c *ClusterConfig) GetBindPort() int {
	// Check if bind contains a port
	for i := len(c.Bind) - 1; i >= 0; i-- {
		if c.Bind[i] == ':' {
			var p int
			fmt.Sscanf(c.Bind[i+1:], "%d", &p)
			if p > 0 {
				return p
			}
		}
	}

	if c.Port > 0 {
		return c.Port
	}

	return 7946
}

type ServerConfig struct {
	Addr                    string          `toml:"addr"`
	Debug                   bool            `toml:"debug"`
	LoginKey                string          `toml:"login_key"`
	TempDir                 string          `toml:"temp_dir"`
	TrustedProxies          []string        `toml:"trusted_proxies"`            // Trust X-Forwarded-For/Proto/Host headers from these proxy IPs/CIDRs
	TrustedOrigins          []string        `toml:"trusted_origins"`            // Extra origins accepted by the CSRF check, e.g. "https://webmail.example.com" (for TLS-terminating reverse proxies)
	SessionMinutes          int             `toml:"session_minutes"`            // Session timeout in minutes (default: 30)
	MaxSessionMinutes       int             `toml:"max_session_minutes"`        // Maximum session duration users can set (0 = no limit)
	MaxSessions             int             `toml:"max_sessions"`               // Maximum total concurrent sessions (0 = unlimited, default: 10000)
	MaxSessionsPerUser      int             `toml:"max_sessions_per_user"`      // Maximum sessions per username (0 = unlimited, default: 10)
	MaxAttachmentMiB        int             `toml:"max_attachment_mib"`         // Max attachment size per composer in MiB (default: 32)
	MaxSessionAttachmentMiB int             `toml:"max_session_attachment_mib"` // Max attachment size per session in MiB (default: 128)
	MaxGlobalAttachmentMiB  int             `toml:"max_global_attachment_mib"`  // Max global attachment size in MiB (default: 1024)
	RateLimit               RateLimitConfig `toml:"rate_limit"`                 // Rate limiting configuration
	ReadTimeoutSec          int             `toml:"read_timeout_sec"`           // HTTP read timeout in seconds (default: 10)
	WriteTimeoutSec         int             `toml:"write_timeout_sec"`          // HTTP write timeout in seconds (default: 30)
	IdleTimeoutSec          int             `toml:"idle_timeout_sec"`           // HTTP idle timeout in seconds (default: 120)
	IMAPTimeoutSec          int             `toml:"imap_timeout_sec"`           // IMAP operation timeout in seconds (default: 30)
	SMTPTimeoutSec          int             `toml:"smtp_timeout_sec"`           // SMTP operation timeout in seconds (default: 30)
}

type RateLimitConfig struct {
	Enabled                 *bool `toml:"enabled"`                    // Enable rate limiting (default: true if nil)
	IPRequestsPerMinute     int   `toml:"ip_requests_per_minute"`     // Max login attempts per IP per minute (default: 5)
	IPRequestsPerHour       int   `toml:"ip_requests_per_hour"`       // Max login attempts per IP per hour (default: 20)
	UsernameFailsPerQuarter int   `toml:"username_fails_per_quarter"` // Max failed attempts per username per 15min (default: 5)
	UsernameFailsPerHour    int   `toml:"username_fails_per_hour"`    // Max failed attempts per username per hour (default: 10)
	GlobalRequestsPerSecond int   `toml:"global_requests_per_second"` // Max login attempts globally per second (default: 100)
	LockoutMinutes          int   `toml:"lockout_minutes"`            // Lockout duration in minutes (default: 15)
}

type CacheConfig struct {
	TTLMinutes int  `toml:"ttl_minutes"`
	Enabled    bool `toml:"enabled"`
}

type LoggingConfig struct {
	Output string `toml:"output"` // "stderr", "stdout", "syslog", or file path
	Format string `toml:"format"` // "json" or "console"
	Level  string `toml:"level"`  // "debug", "info", "warn", "error"
}

type ProviderConfig struct {
	Type    string                 `toml:"type"` // "imap" (default)
	IMAP    IMAPProviderConfig     `toml:"imap"`
	Maildir MaildirProviderConfig  `toml:"maildir"`
	Options map[string]interface{} `toml:"options"` // Provider-specific options
}

type MaildirProviderConfig struct {
	Path           string `toml:"path"`
	AuthPasswdFile string `toml:"auth_passwd_file"`
}

type IMAPProviderConfig struct {
	Server   string `toml:"server"`   // Server URL (e.g., "imaps://imap.example.com:993")
	Insecure bool   `toml:"insecure"` // Allow insecure connections
}

type SMTPConfig struct {
	Server   string `toml:"server"`   // Server URL (e.g., "smtps://smtp.example.com:465")
	Insecure bool   `toml:"insecure"` // Allow insecure connections
}

type TLSConfig struct {
	Enabled     bool              `toml:"enabled"`
	Provider    string            `toml:"provider"` // "file" or "letsencrypt"
	CertFile    string            `toml:"cert_file"`
	KeyFile     string            `toml:"key_file"`
	LetsEncrypt LetsEncryptConfig `toml:"letsencrypt"`
}

type LetsEncryptConfig struct {
	Email               string          `toml:"email"`
	Domains             []string        `toml:"domains"`
	DefaultDomain       string          `toml:"default_domain"`        // Fallback for SNI-less connections
	StorageProvider     string          `toml:"storage_provider"`      // "s3" or "file" (default: s3)
	CacheDir            string          `toml:"cache_dir"`             // Directory for local file cache
	SyncIntervalMinutes int             `toml:"sync_interval_minutes"` // Interval for syncing local cache to S3
	ACMEHTTPAddr        string          `toml:"acme_http_addr"`        // Address for HTTP-01 challenges (default: ":80")
	DirectoryURL        string          `toml:"directory_url"`         // ACME directory URL; empty = Let's Encrypt production. Non-production URLs get an isolated, namespaced cert store.
	WarmRSACerts        bool            `toml:"warm_rsa_certs"`        // Also pre-issue legacy RSA certificates (default: ECDSA only)
	S3                  S3StorageConfig `toml:"s3"`
}

type S3StorageConfig struct {
	Endpoint        string `toml:"endpoint"`
	Bucket          string `toml:"bucket"`
	AccessKeyID     string `toml:"access_key"`
	SecretAccessKey string `toml:"secret_key"`
	Region          string `toml:"region"`
	Prefix          string `toml:"prefix"`
}

type WebAuthnConfig struct {
	RPID          string   `toml:"rpid"`
	RPDisplayName string   `toml:"display_name"`
	RPOrigins     []string `toml:"origins"`
}

type PluginConfig struct {
	Enabled bool                   `toml:"enabled"`
	Server  string                 `toml:"server"`
	Options map[string]interface{} `toml:"options"`
}

// GetEnabledPlugins returns a list of plugin names that are enabled
func (c *Config) GetEnabledPlugins() []string {
	var enabled []string
	for name, cfg := range c.Plugin {
		if cfg.Enabled {
			enabled = append(enabled, name)
		}
	}
	return enabled
}

// GetPluginServers returns additional servers from plugin configs
func (c *Config) GetPluginServers() []string {
	var servers []string
	for _, cfg := range c.Plugin {
		if cfg.Enabled && cfg.Server != "" {
			servers = append(servers, cfg.Server)
		}
	}
	return servers
}

// LoadConfig loads configuration from a TOML file
func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := toml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse TOML config: %w", err)
	}

	// Set defaults
	if config.Server.Addr == "" {
		config.Server.Addr = ":1323"
	}

	return &config, nil
}

// ToOptions converts the configuration file structure to alps.Options
func (c *Config) ToOptions() (alps.Options, error) {
	options := alps.Options{}

	options.Debug = c.Server.Debug

	// Set WebAuthn options
	options.WebAuthn = alps.WebAuthnOptions{
		RPID:          c.WebAuthn.RPID,
		RPDisplayName: c.WebAuthn.RPDisplayName,
		RPOrigins:     c.WebAuthn.RPOrigins,
	}

	options.Provider = alps.ProviderOptions{
		Type: c.Provider.Type,
		Maildir: alps.MaildirProviderOptions{
			Path:           c.Provider.Maildir.Path,
			AuthPasswdFile: c.Provider.Maildir.AuthPasswdFile,
		},
	}
	if options.Provider.Type == "" {
		options.Provider.Type = "imap" // Default provider
	}

	// Set session limit defaults
	options.MaxSessions = 10000     // Global limit: 10,000 sessions
	options.MaxSessionsPerUser = 10 // Per-user limit: 10 sessions

	// Enable rate limiting by default
	options.RateLimitEnabled = true
	rlConfig := alps.DefaultRateLimitConfig()

	var trustedProxies []*net.IPNet
	for _, ipStr := range c.Server.TrustedProxies {
		ipStr = strings.TrimSpace(ipStr)
		if ipStr == "" {
			continue
		}
		if !strings.Contains(ipStr, "/") {
			// Check if it's IPv6
			if strings.Contains(ipStr, ":") {
				ipStr += "/128"
			} else {
				ipStr += "/32"
			}
		}
		_, cidr, err := net.ParseCIDR(ipStr)
		if err != nil {
			return options, fmt.Errorf("invalid trusted_proxies IP/CIDR %q: %v", ipStr, err)
		}
		trustedProxies = append(trustedProxies, cidr)
	}
	rlConfig.TrustedProxies = trustedProxies

	options.RateLimitConfig = &rlConfig

	// Trusted proxies are also used by the CSRF middleware to decide whether to
	// honor X-Forwarded-Proto / X-Forwarded-Host when computing the expected origin.
	options.TrustedProxies = trustedProxies

	// Normalize the explicit CSRF trusted origins allowlist (lowercase, no trailing slash).
	for _, origin := range c.Server.TrustedOrigins {
		origin = strings.TrimSpace(origin)
		if origin == "" {
			continue
		}
		origin = strings.TrimRight(strings.ToLower(origin), "/")
		options.TrustedOrigins = append(options.TrustedOrigins, origin)
	}

	// Set cache config (default to enabled with 10 minute TTL)
	options.CacheEnabled = true
	if c.Cache.TTLMinutes > 0 {
		options.CacheTTL = time.Duration(c.Cache.TTLMinutes) * time.Minute
	}
	if !c.Cache.Enabled {
		options.CacheEnabled = false
	}

	// Set session duration config
	if c.Server.SessionMinutes > 0 {
		options.SessionDuration = time.Duration(c.Server.SessionMinutes) * time.Minute
	}
	if c.Server.MaxSessionMinutes > 0 {
		options.MaxSessionDuration = time.Duration(c.Server.MaxSessionMinutes) * time.Minute
	}

	// Set session limit config
	if c.Server.MaxSessions > 0 {
		options.MaxSessions = c.Server.MaxSessions
	}
	if c.Server.MaxSessionsPerUser > 0 {
		options.MaxSessionsPerUser = c.Server.MaxSessionsPerUser
	}

	if c.Server.MaxAttachmentMiB > 0 {
		options.MaxAttachmentMiB = c.Server.MaxAttachmentMiB
	}
	if c.Server.MaxSessionAttachmentMiB > 0 {
		options.MaxSessionAttachmentMiB = c.Server.MaxSessionAttachmentMiB
	}
	if c.Server.MaxGlobalAttachmentMiB > 0 {
		options.MaxGlobalAttachmentMiB = c.Server.MaxGlobalAttachmentMiB
	}

	// Set timeout config
	if c.Server.ReadTimeoutSec > 0 {
		options.ReadTimeout = time.Duration(c.Server.ReadTimeoutSec) * time.Second
	}
	if c.Server.WriteTimeoutSec > 0 {
		options.WriteTimeout = time.Duration(c.Server.WriteTimeoutSec) * time.Second
	}
	if c.Server.IdleTimeoutSec > 0 {
		options.IdleTimeout = time.Duration(c.Server.IdleTimeoutSec) * time.Second
	}
	if c.Server.IMAPTimeoutSec > 0 {
		options.IMAPTimeout = time.Duration(c.Server.IMAPTimeoutSec) * time.Second
	}
	if c.Server.SMTPTimeoutSec > 0 {
		options.SMTPTimeout = time.Duration(c.Server.SMTPTimeoutSec) * time.Second
	}

	// Override rate limiting config from config file
	if c.Server.RateLimit.Enabled != nil && !*c.Server.RateLimit.Enabled {
		options.RateLimitEnabled = false
		options.RateLimitConfig = nil
	} else {
		// Apply custom rate limit values if specified
		if c.Server.RateLimit.IPRequestsPerMinute > 0 {
			options.RateLimitConfig.IPRequestsPerMinute = c.Server.RateLimit.IPRequestsPerMinute
		}
		if c.Server.RateLimit.IPRequestsPerHour > 0 {
			options.RateLimitConfig.IPRequestsPerHour = c.Server.RateLimit.IPRequestsPerHour
		}
		if c.Server.RateLimit.UsernameFailsPerQuarter > 0 {
			options.RateLimitConfig.UsernameFailsPerQuarter = c.Server.RateLimit.UsernameFailsPerQuarter
		}
		if c.Server.RateLimit.UsernameFailsPerHour > 0 {
			options.RateLimitConfig.UsernameFailsPerHour = c.Server.RateLimit.UsernameFailsPerHour
		}
		if c.Server.RateLimit.GlobalRequestsPerSecond > 0 {
			options.RateLimitConfig.GlobalRequestsPerSecond = c.Server.RateLimit.GlobalRequestsPerSecond
		}
		if c.Server.RateLimit.LockoutMinutes > 0 {
			options.RateLimitConfig.LockoutDuration = time.Duration(c.Server.RateLimit.LockoutMinutes) * time.Minute
		}
	}

	// Set enabled plugins from config
	if len(c.Plugin) > 0 {
		options.EnabledPlugins = c.GetEnabledPlugins()

		// Map plugin configurations
		options.Plugins = make(map[string]alps.PluginConfig)
		for name, cfg := range c.Plugin {
			options.Plugins[name] = alps.PluginConfig{
				Enabled: cfg.Enabled,
				Server:  cfg.Server,
				Options: cfg.Options,
			}
		}
	}

	// Set SMTP and IMAP options
	options.SMTP = alps.SMTPOptions{
		Server:   c.SMTP.Server,
		Insecure: c.SMTP.Insecure,
	}

	options.Provider.IMAP = alps.IMAPProviderOptions{
		Server:   c.Provider.IMAP.Server,
		Insecure: c.Provider.IMAP.Insecure,
	}

	// Validation
	if options.SMTP.Server == "" {
		return options, fmt.Errorf("no SMTP server specified in config file ([smtp] server)")
	}

	switch options.Provider.Type {
	case "imap", "":
		if options.Provider.IMAP.Server == "" {
			return options, fmt.Errorf("no IMAP server specified in config file for imap provider ([provider.imap] server)")
		}
	case "maildir":
		if options.Provider.Maildir.Path == "" {
			return options, fmt.Errorf("no Maildir path specified in config file for maildir provider ([provider.maildir] path)")
		}
	}

	if c.Server.LoginKey != "" {
		fernetKey, err := fernet.DecodeKey(c.Server.LoginKey)
		if err != nil {
			return options, fmt.Errorf("invalid login key")
		}
		options.LoginKey = fernetKey
	}

	return options, nil
}

// ToLogger creates an alps.Logger based on the configuration
func (c *Config) ToLogger() alps.Logger {
	if c.Logging.Output != "" || c.Logging.Format != "" || c.Logging.Level != "" {
		logOpts := alps.LoggerOptions{
			Output: c.Logging.Output,
			Format: c.Logging.Format,
			Level:  c.Logging.Level,
		}
		if logOpts.Output == "" {
			logOpts.Output = "stderr"
		}
		if logOpts.Format == "" {
			if c.Server.Debug {
				logOpts.Format = "console"
			} else {
				logOpts.Format = "json"
			}
		}
		if logOpts.Level == "" {
			if c.Server.Debug {
				logOpts.Level = "debug"
			} else {
				logOpts.Level = "info"
			}
		}
		return alps.NewLoggerWithOptions(logOpts)
	} else if c.Server.Debug {
		return alps.NewDevelopmentLogger()
	} else {
		return alps.NewLogger()
	}
}
