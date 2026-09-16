package maildir

import (
	"time"
	"fmt"
	"strings"
	"path/filepath"

	"github.com/migadu/alps/provider"
	"github.com/BurntSushi/toml"
)

// Type to implement the provider.Options interface
type Config struct {
	Path           string `toml:"path"`
	AuthPasswdFile string `toml:"auth_passwd_file"`
}

func (c *Config) Type() string {

	return "maildir"
}

func (c *Config) ToOptions() (provider.Options, error) {

	if c.AuthPasswdFile == "" {
		return nil, fmt.Errorf("AuthPasswdFile cannot be empty")
	}

	return &options{ c }, nil
}

type options struct {
	*Config
}

func (o *options) CreateFactory(timeout time.Duration) provider.AuthenticatedProviderFactory {

	return func(username, password string) (provider.MailProvider, error) {

		// Authenticate against dovecot passwd file
		homeDir, err := authenticate(o.AuthPasswdFile, username, password)
		if err != nil {
			return nil, provider.AuthError{ err }
		}

		// Use explicit Maildir path if provided, resolving %u and %d, otherwise use homeDir/Maildir
		path := o.Path
		if path != "" {
			parts := strings.Split(username, "@")
			domain := ""
			user := username
			if len(parts) == 2 {
				user = parts[0]
				domain = parts[1]
			}
			path = strings.ReplaceAll(path, "%u", user)
			path = strings.ReplaceAll(path, "%n", username) // Sometimes %n is full username
			path = strings.ReplaceAll(path, "%d", domain)
		} else {
			path = filepath.Join(homeDir, "Maildir")
		}

		return NewProvider(path, username), nil
	}
}

func configure(raw *toml.Primitive) (provider.Config, error) {

	var cfg Config
	err := toml.PrimitiveDecode(*raw, &cfg)
	if err != nil {
		return nil, fmt.Errorf("error decoding configuration for [provider.maildir]: %v", err)
	}

	if cfg.AuthPasswdFile == "" {
		return nil, fmt.Errorf("no password file specified in config file for maildir provider ([provider.maildir] auth_passwd_file)")
	}

	return &cfg, nil
}

func init() {

	provider.Register("maildir", configure)
}
