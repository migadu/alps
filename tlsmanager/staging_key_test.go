package tlsmanager

import (
	"context"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/migadu/alps/tlsmanager/storage"
)

type stagingKeyClient struct {
	storage.S3API
	key string
}

func (c *stagingKeyClient) PutObject(_ context.Context, in *s3.PutObjectInput, _ ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	c.key = *in.Key
	return &s3.PutObjectOutput{}, nil
}

func TestStagingS3CertificateKeyUsesNamespaceDirectory(t *testing.T) {
	for _, prefix := range []string{"", "alps/"} {
		t.Run(prefix, func(t *testing.T) {
			cfg, _ := namespacedStorageConfig(LetsEncryptConfig{DirectoryURL: "https://acme-staging-v02.api.letsencrypt.org/directory", S3: S3Config{Prefix: prefix}})
			client := &stagingKeyClient{}
			cache := &storage.S3Cache{S3Client: client, Bucket: "certs", Prefix: cfg.S3.Prefix, Logger: discardLogger()}
			if err := cache.Put(context.Background(), "webmail.example.com", []byte("certificate")); err != nil {
				t.Fatal(err)
			}
			want := strings.TrimSuffix(cfg.S3.Prefix, "/") + "/webmail.example.com"
			if client.key != want {
				t.Errorf("S3 key = %q; want %q", client.key, want)
			}
		})
	}
}
