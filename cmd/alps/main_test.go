package main

import (
	"testing"

	"github.com/migadu/alps/tlsmanager"
)

func TestBuildTLSConfig_DefaultStorageProvider(t *testing.T) {
	cfg := TLSConfig{
		Enabled:  true,
		Provider: "letsencrypt",
		LetsEncrypt: LetsEncryptConfig{
			Email:   "admin@example.com",
			Domains: []string{"mail.example.com"},
		},
	}
	tlsCfg, err := buildTLSConfig(cfg)
	if err != nil {
		t.Fatalf("buildTLSConfig: %v", err)
	}
	if got := tlsCfg.LetsEncrypt.StorageProvider; got != "s3" {
		t.Errorf("empty storage_provider should default to \"s3\", got %q", got)
	}
}

func TestValidateClusterTLS(t *testing.T) {
	le := func(storage string) *tlsmanager.Config {
		return &tlsmanager.Config{
			Provider:    tlsmanager.ProviderLetsEncrypt,
			LetsEncrypt: &tlsmanager.LetsEncryptConfig{StorageProvider: storage},
		}
	}

	if err := validateClusterTLS(true, le("file")); err == nil {
		t.Error("cluster + letsencrypt file storage must be rejected: followers would have no certificate source")
	}
	if err := validateClusterTLS(true, le("s3")); err != nil {
		t.Errorf("cluster + s3 storage should be valid: %v", err)
	}
	if err := validateClusterTLS(false, le("file")); err != nil {
		t.Errorf("single-instance file storage should be valid: %v", err)
	}
	if err := validateClusterTLS(true, &tlsmanager.Config{Provider: tlsmanager.ProviderFile}); err != nil {
		t.Errorf("cluster + file TLS provider (static certs) should be valid: %v", err)
	}
}
