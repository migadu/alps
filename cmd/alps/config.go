package main

import (
	"fmt"
	"os"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
)

// Config represents the TOML configuration file structure
type Config struct {
	Server    ServerConfig            `toml:"server"`
	Cache     CacheConfig             `toml:"cache"`
	Logging   LoggingConfig           `toml:"logging"`
	TLS       TLSConfig               `toml:"tls"`
	Provider  ProviderConfig          `toml:"provider"`
	Upstreams UpstreamsConfig         `toml:"upstreams"`
	Plugin    map[string]PluginConfig `toml:"plugin"`
}

type ServerConfig struct {
	Addr                    string          `toml:"addr"`
	Debug                   bool            `toml:"debug"`
	LoginKey                string          `toml:"login_key"`
	TempDir                 string          `toml:"temp_dir"`
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
	Options map[string]interface{} `toml:"options"` // Provider-specific options
}

type IMAPProviderConfig struct {
	Server   string `toml:"server"`   // Server URL (e.g., "imaps://imap.example.com:993")
	Insecure bool   `toml:"insecure"` // Allow insecure connections
}

type UpstreamsConfig struct {
	IMAP []string `toml:"imap"`
	SMTP []string `toml:"smtp"`
}

type TLSConfig struct {
	Enabled     bool              `toml:"enabled"`
	Provider    string            `toml:"provider"` // "file" or "letsencrypt"
	CertFile    string            `toml:"cert_file"`
	KeyFile     string            `toml:"key_file"`
	LetsEncrypt LetsEncryptConfig `toml:"letsencrypt"`
}

type LetsEncryptConfig struct {
	Email           string        `toml:"email"`
	Domains         []string      `toml:"domains"`
	StorageProvider string        `toml:"storage_provider"` // Currently only "s3"
	EnableFallback  bool          `toml:"enable_fallback"`
	FallbackDir     string        `toml:"fallback_dir"`
	RenewBefore     string        `toml:"renew_before"`    // Duration string like "720h"
	ACMEServer      string        `toml:"acme_server"`     // Optional custom ACME server
	ACMEHTTPAddr    string        `toml:"acme_http_addr"`  // Address for HTTP-01 challenges (default: ":80")
	S3              S3Config      `toml:"s3"`
	Cluster         ClusterConfig `toml:"cluster"`
}

type S3Config struct {
	Bucket          string `toml:"bucket"`
	Endpoint        string `toml:"endpoint"`
	AccessKeyID     string `toml:"access_key_id"`
	SecretAccessKey string `toml:"secret_access_key"`
	DisableTLS      bool   `toml:"disable_tls"`
	Debug           bool   `toml:"debug"`
}

type ClusterConfig struct {
	Enabled       bool   `toml:"enabled"`         // Enable cluster mode with leader election
	LeaderLockKey string `toml:"leader_lock_key"` // S3 key for leader lock (default: "autocert/leader.lock")
	LeaderTTL     string `toml:"leader_ttl"`      // Leader lock TTL (default: "60s")
	RenewInterval string `toml:"renew_interval"`  // How often to renew leader lock (default: "30s")
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

// GetPluginUpstreams returns additional upstream servers from plugin configs
func (c *Config) GetPluginUpstreams() []string {
	var upstreams []string
	for _, cfg := range c.Plugin {
		if cfg.Enabled && cfg.Server != "" {
			upstreams = append(upstreams, cfg.Server)
		}
	}
	return upstreams
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

	// Set session limit defaults
	options.MaxSessions = 10000     // Global limit: 10,000 sessions
	options.MaxSessionsPerUser = 10 // Per-user limit: 10 sessions

	// Enable rate limiting by default
	options.RateLimitEnabled = true
	rlConfig := alps.DefaultRateLimitConfig()
	options.RateLimitConfig = &rlConfig

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
	if c.Server.RateLimit.Enabled != nil && *c.Server.RateLimit.Enabled == false {
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

	// Build upstreams list from config
	var upstreams []string
	upstreams = append(upstreams, c.Upstreams.IMAP...)
	upstreams = append(upstreams, c.Upstreams.SMTP...)
	// Add plugin-specific upstream servers
	upstreams = append(upstreams, c.GetPluginUpstreams()...)

	options.Upstreams = upstreams

	if len(options.Upstreams) == 0 {
		return options, fmt.Errorf("no upstreams specified in config file")
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
