package tlsmanager

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func TestS3BucketValidationRetainsCauseOnCancellation(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusForbidden) }))
	defer server.Close()
	cfg := LetsEncryptConfig{S3: S3Config{Endpoint: server.URL, Bucket: "private-certs", Region: "us-east-1", AccessKey: "test", SecretKey: "test"}}
	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()
	_, err := createS3Cache(ctx, cfg, discardLogger())
	if !errors.Is(err, context.DeadlineExceeded) || !strings.Contains(err.Error(), "403") {
		t.Fatalf("want cancellation and last HeadBucket failure; got%v", err)
	}
}

func TestS3BucketValidationMakesFiveAttemptsWithinItsBudget(t *testing.T) {
	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { calls.Add(1); w.WriteHeader(http.StatusForbidden) }))
	defer server.Close()
	cfg := LetsEncryptConfig{S3: S3Config{Endpoint: server.URL, Bucket: "private-certs", Region: "us-east-1", AccessKey: "test", SecretKey: "test"}}
	_, err := createS3Cache(context.Background(), cfg, discardLogger())
	if calls.Load() != 5 || err == nil || !strings.Contains(err.Error(), "403") {
		t.Fatalf("HeadBucket calls=%d error=%v; want5 attempts and access failure", calls.Load(), err)
	}
}
