package unified

import (
	"os"
	"fmt"
	"time"
	"bufio"
	"errors"
	"strings"
	"github.com/migadu/alps/provider"
	"github.com/BurntSushi/toml"
)

var ErrInvalidCredentials = fmt.Errorf("invalid credentials")

func verifyHash(password, hash string) error {

	scheme := "{PLAIN}"
	if strings.HasPrefix(hash, "{") {
		endIdx := strings.Index(hash, "}")
		if endIdx > 0 {
			scheme = hash[:endIdx+1]
			hash = hash[endIdx+1:]
		}
	}

	switch scheme {
	case "{PLAIN}":
		if password != hash {
			return fmt.Errorf("password mismatch")
		}
		return nil
	default:
		return fmt.Errorf("unsupported hash scheme: %s", scheme)
	}
}

func authenticate(passwordFile, username, password string) (string, error) {

	file, err := os.Open(passwordFile)
	if err != nil {
		return "", fmt.Errorf("failed to open password file: %w", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.Split(line, ":")
		if len(parts) < 3 {
			continue
		}

		fileUser := parts[0]
		if fileUser != username {
			continue
		}

		hash := parts[1]
		if err := verifyHash(password, hash); err != nil {
			return "", ErrInvalidCredentials
		}

		return parts[2], nil
	}

	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("error reading passwd file: %w", err)
	}

	return "", ErrInvalidCredentials
}

type Options struct {
	*Config
	backend provider.Options
}

func (o *Options) CreateFactory(timeout time.Duration, debug bool) provider.AuthenticatedProviderFactory {

	return func(username, password string) (provider.MailProvider, error) {

		if o == nil || o.Config == nil || o.Path == "" || o.backend == nil {
			return nil, fmt.Errorf("%s: path is not configured", providerName)
		}

		userPath, err := authenticate(o.Path, username, password)
		if err != nil {
			if errors.Is(err, ErrInvalidCredentials) {
				return nil, provider.AuthError{Cause: err}
			}
			return nil, err
		}

		backendFactory := o.backend.CreateFactory(timeout, o.DebugBackend)

		return newProvider(userPath, o.Debug, backendFactory)
	}
}

type Config struct {
	Path string       `toml:"path"`             // The path to the user database
	Debug bool        `toml:"debug"`
	DebugBackend bool `toml:"debug_backend"`
	backend provider.Config
}

func (c *Config) Type() string {

	return providerName
}

func (c *Config) ToOptions() (provider.Options, error) {

	if c.Path == "" {
		return nil, fmt.Errorf("path cannot be empty")
	}
	if c.backend == nil {
		return nil, fmt.Errorf("backend not configured")
	}

	cfgCopy := *c

	bopt, err := c.backend.ToOptions()
	if err != nil {
		return nil, err
	}

	return &Options{
		Config:  &cfgCopy,
		backend: bopt,
	}, nil
}

func configure(meta *toml.MetaData, raw *toml.Primitive) (provider.Config, error) {

	var cfg Config
	if err := meta.PrimitiveDecode(*raw, &cfg); err != nil {
		return nil, fmt.Errorf("error decoding configuration for [provider.unified]: %w", err)
	}

	if cfg.Path == "" {
		return nil, fmt.Errorf("%s provider requires a path, got empty string", providerName)
	}

	bcfg, err := provider.LoadConfig("multi", meta, raw)
	if err != nil {
		return nil, fmt.Errorf("error loading [provider.unified] as a [provider.multi]: %w", err)
	}

	cfg.backend = bcfg
	return &cfg, nil
}

func init() {

	provider.Register(providerName, configure)
}
