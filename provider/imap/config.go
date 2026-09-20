package imap

import (
	"fmt"
	"net"
	"net/url"
	"strings"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/migadu/alps/provider"
)

// Config represents the TOML configuration for the IMAP provider.
type Config struct {
	Server      string   `toml:"server"`       // Server URL (e.g., "imaps://imap.example.com:993")
	Insecure    bool     `toml:"insecure"`     // Allow insecure connections
	AuthservIDs []string `toml:"authserv_ids"` // Receiving servers whose Authentication-Results are trusted (e.g., ["mx.example.com"])
	Debug       bool     `toml:"debug"`        // Turn on debugging output for the provider
}

func (c *Config) Type() string {
	return "imap"
}

// parseServer derives the dial address and TLS mode from the configured server
// URL. The returned insecure flag is the configured one OR-ed with the scheme.
func parseServer(c *Config) (address string, tls bool, insecure bool, err error) {
	if c == nil {
		return "", false, false, fmt.Errorf("IMAP provider has no configuration")
	}

	if c.Server == "" {
		return "", false, false, fmt.Errorf("IMAP server requires a scheme (imaps://, imap://, imap+insecure://), got empty string")
	}

	if !strings.Contains(c.Server, "://") {
		return "", false, false, fmt.Errorf("IMAP server requires a scheme (imaps://, imap://, imap+insecure://), got: %v", c.Server)
	}

	u, err := url.Parse(c.Server)
	if err != nil {
		return "", false, false, fmt.Errorf("failed to parse IMAP server: %w", err)
	}

	insecure = c.Insecure
	switch u.Scheme {
	case "imaps":
		tls = true
	case "imap+insecure":
		insecure = true
	case "imap":
	default:
		return "", false, false, fmt.Errorf("unknown scheme for IMAP server: %v", u.Scheme)
	}

	hostname := u.Hostname()
	if hostname == "" {
		return "", false, false, fmt.Errorf("IMAP server host cannot be empty")
	}

	port := u.Port()
	if port == "" {
		if u.Scheme == "imaps" {
			port = "993"
		} else {
			port = "143"
		}
	}
	address = net.JoinHostPort(hostname, port)

	return address, tls, insecure, nil

}

func (c *Config) ToOptions() (provider.Options, error) {
	address, tls, insecure, err := parseServer(c)
	if err != nil {
		return nil, err
	}

	cfgCopy := *c
	cfgCopy.Insecure = insecure

	return &Options{
		Config:  &cfgCopy,
		address: address,
		tls:     tls,
	}, nil
}

type Options struct {
	*Config
	address string
	tls     bool
}

// resolve returns the dial parameters, deriving them from Config when the
// Options value was built directly instead of through Config.ToOptions.
func (o *Options) resolve() (address string, tls bool, insecure bool, err error) {
	if o.address != "" {
		return o.address, o.tls, o.Insecure, nil
	}
	return parseServer(o.Config)
}

func (o *Options) CreateFactory(timeout time.Duration, debug bool) provider.AuthenticatedProviderFactory {
	address, tls, insecure, resolveErr := o.resolve()

	debugMode := debug
	if o.Config != nil {
		debugMode = o.Debug || debug
	}

	return func(username, password string) (provider.MailProvider, error) {
		if resolveErr != nil {
			return nil, resolveErr
		}

		client, err := Connect(address, tls, insecure, timeout, debugMode)
		if err != nil {
			return nil, err
		}

		if err := client.Login(username, password).Wait(); err != nil {
			client.Logout()
			return nil, provider.AuthError{Cause: err}
		}

		return NewIMAPProvider(client, debugMode).WithAuthservIDs(o.AuthservIDs), nil
	}
}

func configure(meta *toml.MetaData, raw *toml.Primitive) (provider.Config, error) {
	var cfg Config
	if err := meta.PrimitiveDecode(*raw, &cfg); err != nil {
		return nil, fmt.Errorf("error decoding configuration for [provider.imap]: %w", err)
	}

	if cfg.Server == "" {
		return nil, fmt.Errorf("IMAP server requires a scheme (imaps://, imap://, imap+insecure://), got empty string")
	}

	return &cfg, nil
}

func init() {
	provider.Register("imap", configure)
}
