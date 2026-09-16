package imap

import (
	"fmt"
	"time"
	"strings"
	"net/url"
	"github.com/BurntSushi/toml"
	"github.com/migadu/alps/provider"
)

// public configuration type
type Config struct {
	// fields initialized from the user toml configuration
	Server      string   `toml:"server"`       // Server URL (e.g., "imaps://imap.example.com:993")
	Insecure    bool     `toml:"insecure"`     // Allow insecure connections
	// Authserv-ids of the receiving mail servers whose Authentication-Results
	// fields are trusted for a message's DMARC verdict. Empty means the topmost
	// field.
	AuthservIDs []string `toml:"authserv_ids"` // Receiving servers whose Authentication-Results are trusted (e.g., ["mx.example.com"])
	Debug       bool     `toml:"debug"`        // turn out debugging output for the provider
	// private fields for options interface
	address  string
	tls      bool
}

func (c *Config) Type() string {

	return "imap"
}

func (c *Config) ToOptions() (provider.Options, error) {

	if c.Server == "" {
		return nil, fmt.Errorf("IMAP server cannot be empty")
	}

	u, err := url.Parse(c.Server)
	if err != nil {
		return nil, fmt.Errorf("failed to parse IMAP server: %v", err)
	}

	if u.Scheme == "" {
		return nil, fmt.Errorf("IMAP server requires a scheme (imaps://, imap://, imap+insecure://), got: %v", u.String())
	}
	switch u.Scheme {
	case "imaps":
		c.tls = true
	case "imap+insecure":
		c.Insecure = true
	case "imap":
	default:
		return nil, fmt.Errorf("unknown scheme for IMAP server: %v", u.Scheme)
	}

	c.address = u.Host
	if !strings.ContainsRune(c.address, ':') {
		if u.Scheme == "imaps" {
			c.address += ":993"
		} else {
			c.address += ":143"
		}
	}

	return &Options{ c }, nil
}

type Options struct {
	*Config
}

func (o *Options) CreateFactory(timeout time.Duration) provider.AuthenticatedProviderFactory {

	return func(username, password string) (provider.MailProvider, error) {

		client, err := Connect(o.address, o.tls, o.Insecure, timeout, o.Debug)
		if err != nil {
			return nil, err
		}

		if err := client.Login(username, password).Wait(); err != nil {
			client.Logout()
			return nil, provider.AuthError{ err }
		}

		return NewIMAPProvider(client, o.Debug).WithAuthservIDs(o.AuthservIDs), nil
	}
}

func configure(raw *toml.Primitive) (provider.Config, error) {

	var cfg Config
	err := toml.PrimitiveDecode(*raw, &cfg)
	if err != nil {
		return nil, fmt.Errorf("error decoding configuration for [provider.imap]: %v", err)
	}

	if cfg.Server == "" {
		return nil, fmt.Errorf("IMAP server requires a scheme (imaps://, imap://, imap+insecure://), got empty string")
	}

	if !strings.ContainsAny(cfg.Server, ":/") {
		cfg.Server = "//" + cfg.Server
	}

	return &cfg, nil
}

func init() {

	provider.Register("imap", configure)
}
