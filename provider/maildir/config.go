package maildir

import (
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/migadu/alps/provider"
)

// Config represents the TOML configuration for the Maildir provider.
type Config struct {
	Path           string `toml:"path"`
	AuthPasswdFile string `toml:"auth_passwd_file"`
}

func (c *Config) Type() string {
	return "maildir"
}

func (c *Config) ToOptions() (provider.Options, error) {
	if c.AuthPasswdFile == "" {
		return nil, fmt.Errorf("auth_passwd_file cannot be empty")
	}

	return &Options{Config: c}, nil
}

// Options implements provider.Options for the Maildir provider.
type Options struct {
	*Config
}

// expandPath resolves the %u (local part), %d (domain) and %n (full username)
// placeholders in a maildir path pattern.
//
// The replacements are applied in a single pass: substituting them one after
// another lets a local part that itself contains a literal "%d" be rewritten by
// the following pass, which can map two distinct accounts onto one maildir.
func expandPath(pattern, username string) (string, error) {
	user, domain := username, ""
	if parts := strings.SplitN(username, "@", 2); len(parts) == 2 {
		user, domain = parts[0], parts[1]
	}

	// A username is only ever matched verbatim against the passwd file, but the
	// expanded path must not be able to escape the configured pattern.
	for _, part := range []string{user, domain} {
		if strings.ContainsAny(part, `/\`) || part == ".." || part == "." {
			return "", fmt.Errorf("maildir: refusing to build a path for username %q", username)
		}
	}

	return strings.NewReplacer(
		"%u", user,
		"%n", username,
		"%d", domain,
	).Replace(pattern), nil
}

func (o *Options) CreateFactory(timeout time.Duration, debug bool) provider.AuthenticatedProviderFactory {
	return func(username, password string) (provider.MailProvider, error) {
		if o == nil || o.Config == nil || o.AuthPasswdFile == "" {
			return nil, fmt.Errorf("maildir: auth_passwd_file is not configured")
		}

		// Authenticate against dovecot passwd file
		homeDir, err := authenticate(o.AuthPasswdFile, username, password)
		if err != nil {
			if errors.Is(err, ErrInvalidCredentials) {
				return nil, provider.AuthError{Cause: err}
			}
			return nil, err
		}

		// Use explicit Maildir path if provided, resolving %u and %d, otherwise use homeDir/Maildir
		path := o.Path
		if path != "" {
			path, err = expandPath(path, username)
			if err != nil {
				return nil, err
			}
		} else {
			if homeDir == "" {
				return nil, fmt.Errorf("maildir: user %q has no home directory in passwd file and no path pattern is configured", username)
			}
			path = filepath.Join(homeDir, "Maildir")
		}

		return NewProvider(path, username), nil
	}
}

func configure(meta *toml.MetaData, raw *toml.Primitive) (provider.Config, error) {
	var cfg Config
	err := meta.PrimitiveDecode(*raw, &cfg)
	if err != nil {
		return nil, fmt.Errorf("error decoding configuration for [provider.maildir]: %w", err)
	}

	if cfg.AuthPasswdFile == "" {
		return nil, fmt.Errorf("no password file specified in config file for maildir provider ([provider.maildir] auth_passwd_file)")
	}

	return &cfg, nil
}

func init() {
	provider.Register("maildir", configure)
}
