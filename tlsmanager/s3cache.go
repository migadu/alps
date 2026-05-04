package tlsmanager

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"golang.org/x/crypto/acme/autocert"
)

// S3CacheConfig holds S3 connection configuration
type S3CacheConfig struct {
	Bucket          string
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	DisableTLS      bool
	Debug           bool
}

// S3Cache implements autocert.Cache using S3-compatible object storage
type S3Cache struct {
	client *minio.Client
	bucket string
	prefix string
	logger *slog.Logger
}

// NewS3Cache creates a new S3-backed certificate cache
func NewS3Cache(cfg S3CacheConfig, logger *slog.Logger) (*S3Cache, error) {
	if cfg.Bucket == "" {
		return nil, errors.New("s3 bucket name is required")
	}
	if cfg.Endpoint == "" {
		return nil, errors.New("s3 endpoint is required")
	}

	// Use IAM role if credentials are empty
	var creds *credentials.Credentials
	if cfg.AccessKeyID == "" && cfg.SecretAccessKey == "" {
		creds = credentials.NewIAM("")
	} else {
		creds = credentials.NewStaticV4(cfg.AccessKeyID, cfg.SecretAccessKey, "")
	}

	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  creds,
		Secure: !cfg.DisableTLS,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create S3 client: %w", err)
	}

	if cfg.Debug {
		client.TraceOn(nil)
	}

	cache := &S3Cache{
		client: client,
		bucket: cfg.Bucket,
		prefix: "autocert/",
		logger: logger,
	}

	// Verify bucket exists or create it
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, cfg.Bucket)
	if err != nil {
		return nil, fmt.Errorf("failed to check bucket existence: %w", err)
	}
	if !exists {
		logger.Info("creating S3 bucket", "bucket", cfg.Bucket)
		err = client.MakeBucket(ctx, cfg.Bucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	return cache, nil
}

// Get retrieves a certificate from S3 cache
func (c *S3Cache) Get(ctx context.Context, key string) ([]byte, error) {
	s3Key := c.keyToS3Path(key)

	c.logger.Debug("s3 cache get", "key", key, "s3_key", s3Key)

	obj, err := c.client.GetObject(ctx, c.bucket, s3Key, minio.GetObjectOptions{})
	if err != nil {
		c.logger.Error("failed to get object from s3", "key", key, "error", err)
		return nil, autocert.ErrCacheMiss
	}
	defer obj.Close()

	data, err := io.ReadAll(obj)
	if err != nil {
		// Check if it's a 404 (object not found)
		if minio.ToErrorResponse(err).Code == "NoSuchKey" {
			c.logger.Debug("s3 cache miss", "key", key)
			return nil, autocert.ErrCacheMiss
		}
		c.logger.Error("failed to read object from s3", "key", key, "error", err)
		return nil, fmt.Errorf("failed to read s3 object: %w", err)
	}

	if len(data) == 0 {
		c.logger.Debug("s3 cache miss (empty object)", "key", key)
		return nil, autocert.ErrCacheMiss
	}

	c.logger.Debug("s3 cache hit", "key", key, "size", len(data))
	return data, nil
}

// Put stores a certificate in S3 cache
func (c *S3Cache) Put(ctx context.Context, key string, data []byte) error {
	s3Key := c.keyToS3Path(key)

	c.logger.Debug("s3 cache put", "key", key, "s3_key", s3Key, "size", len(data))

	_, err := c.client.PutObject(
		ctx,
		c.bucket,
		s3Key,
		strings.NewReader(string(data)),
		int64(len(data)),
		minio.PutObjectOptions{
			ContentType: "application/octet-stream",
		},
	)
	if err != nil {
		c.logger.Error("failed to put object to s3", "key", key, "error", err)
		return fmt.Errorf("failed to put s3 object: %w", err)
	}

	c.logger.Info("stored certificate in s3", "key", key, "size", len(data))
	return nil
}

// Delete removes a certificate from S3 cache
func (c *S3Cache) Delete(ctx context.Context, key string) error {
	s3Key := c.keyToS3Path(key)

	c.logger.Debug("s3 cache delete", "key", key, "s3_key", s3Key)

	err := c.client.RemoveObject(ctx, c.bucket, s3Key, minio.RemoveObjectOptions{})
	if err != nil {
		c.logger.Error("failed to delete object from s3", "key", key, "error", err)
		return fmt.Errorf("failed to delete s3 object: %w", err)
	}

	c.logger.Info("deleted certificate from s3", "key", key)
	return nil
}

// keyToS3Path converts a cache key to an S3 object path using SHA256 hashing
func (c *S3Cache) keyToS3Path(key string) string {
	// Normalize the key (lowercase, trim spaces)
	normalized := strings.ToLower(strings.TrimSpace(key))

	// Hash the key using SHA256
	h := sha256.New()
	h.Write([]byte(normalized))
	hash := fmt.Sprintf("%x", h.Sum(nil))

	return c.prefix + "cert-" + hash
}
