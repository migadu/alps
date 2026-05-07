package storage

import (
	"bytes"
	"context"
	"errors"
	"io"
	"log/slog"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"golang.org/x/crypto/acme/autocert"
)

// S3API defines the S3 operations required for certificate storage.
type S3API interface {
	GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
	PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
}

// S3Cache implements autocert.Cache using an S3 bucket.
type S3Cache struct {
	S3Client S3API
	Bucket   string
	Prefix   string // Base prefix for all S3 keys (e.g., "myapp/")
	Logger   *slog.Logger
}

// Get reads certificate data from S3.
func (s *S3Cache) Get(ctx context.Context, key string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	fullKey := s.Prefix + key

	resp, err := s.S3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.Bucket),
		Key:    aws.String(fullKey),
	})
	if err != nil {
		var nsk *types.NoSuchKey
		if errors.As(err, &nsk) {
			s.Logger.Debug("certificate not found in S3", "key", fullKey)
			return nil, autocert.ErrCacheMiss
		}
		s.Logger.Error("failed to get certificate from S3", "key", fullKey, "error", err)
		return nil, err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		s.Logger.Error("failed to read certificate data", "key", key, "error", err)
		return nil, err
	}

	s.Logger.Info("certificate retrieved from S3", "key", fullKey, "size", len(data))
	return data, nil
}

// Put writes certificate data to S3.
func (s *S3Cache) Put(ctx context.Context, key string, data []byte) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	fullKey := s.Prefix + key

	// Log prefix usage for debugging
	if s.Prefix == "" {
		s.Logger.Warn("S3Cache.Put: no prefix configured - storing in bucket root", "key", key)
	} else {
		s.Logger.Debug("S3Cache.Put: using prefix", "prefix", s.Prefix, "key", key, "fullKey", fullKey)
	}

	_, err := s.S3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(s.Bucket),
		Key:    aws.String(fullKey),
		Body:   bytes.NewReader(data),
	})
	if err != nil {
		s.Logger.Error("failed to put certificate to S3", "key", fullKey, "error", err)
		return err
	}

	s.Logger.Info("certificate stored in S3", "key", fullKey, "size", len(data))
	return nil
}

// Delete removes certificate data from S3.
func (s *S3Cache) Delete(ctx context.Context, key string) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	fullKey := s.Prefix + key

	_, err := s.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.Bucket),
		Key:    aws.String(fullKey),
	})
	if err != nil {
		s.Logger.Error("failed to delete certificate from S3", "key", fullKey, "error", err)
		return err
	}

	s.Logger.Info("certificate deleted from S3", "key", fullKey)
	return nil
}
