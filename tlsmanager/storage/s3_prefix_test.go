package storage

import (
	"context"
	"testing"

	"github.com/migadu/alps/tlsmanager/storage/storagetest"
)

func TestS3CacheUsesPrefixDirectoryForEveryOperation(t *testing.T) {
	for _, tc := range []struct{ prefix, directory string }{
		{"", ""}, {"alps", "alps/"}, {"alps/", "alps/"}, {"certificates/alps", "certificates/alps/"},
	} {
		for _, key := range []string{"mail.example.com", "mail.example.com+token"} {
			t.Run(tc.prefix+"/"+key, func(t *testing.T) {
				ctx := context.Background()
				client := storagetest.NewMockS3Client()
				cache := &S3Cache{S3Client: client, Bucket: "certs", Prefix: tc.prefix, Logger: discardLogger()}
				fullKey := tc.directory + key
				client.Storage[fullKey] = []byte("existing certificate")
				if data, err := cache.Get(ctx, key); err != nil || string(data) != "existing certificate" {
					t.Errorf("Get from %q = %q, %v", fullKey, data, err)
				}
				if err := cache.Put(ctx, key, []byte("renewed certificate")); err != nil {
					t.Fatal(err)
				}
				if data := string(client.Storage[fullKey]); data != "renewed certificate" {
					t.Errorf("Put did not update %q: %q", fullKey, data)
				}
				if err := cache.Delete(ctx, key); err != nil {
					t.Fatal(err)
				}
				if _, exists := client.Storage[fullKey]; exists {
					t.Errorf("Delete left %q in storage", fullKey)
				}
				if len(client.Storage) != 0 {
					t.Errorf("unexpected objects: %v", client.Storage)
				}
			})
		}
	}
}
