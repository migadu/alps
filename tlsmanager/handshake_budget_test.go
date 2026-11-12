package tlsmanager

import (
	"context"
	"crypto/tls"
	"io"
	"net"
	"net/http"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"golang.org/x/crypto/acme/autocert"
)

type slowCertificateCache struct {
	autocert.Cache
	delayed atomic.Bool
}

func (c *slowCertificateCache) Get(ctx context.Context, key string) ([]byte, error) {
	if c.delayed.CompareAndSwap(false, true) {
		time.Sleep(150 * time.Millisecond)
	}
	return c.Cache.Get(ctx, key)
}

func TestCertificateLookupCanOutliveHTTPRequestTimeout(t *testing.T) {
	cache := newMemCache()
	cache.m["example.com"] = makeBundle(t, "example.com", false)
	manager, err := NewManager(&Config{Enabled: true, Provider: ProviderLetsEncrypt, LetsEncrypt: &LetsEncryptConfig{Email: "test@example.com", DirectoryURL: "http://127.0.0.1:1/directory", Domains: []string{"example.com"}, StorageProvider: "file", CacheDir: t.TempDir()}}, discardLogger())
	if err != nil {
		t.Fatal(err)
	}
	defer manager.Close()
	manager.autocertManager.Cache = &slowCertificateCache{Cache: cache}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	server := &http.Server{ReadTimeout: 40 * time.Millisecond, WriteTimeout: 40 * time.Millisecond, TLSConfig: manager.GetTLSConfig(), Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("first request")) })}
	defer server.Close()
	go server.ServeTLS(listener, "", "")
	tlsConfig := &tls.Config{ServerName: "example.com", InsecureSkipVerify: true}
	transport := &http.Transport{TLSClientConfig: tlsConfig, TLSHandshakeTimeout: 2 * time.Second}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 2 * time.Second}
	response, err := client.Get("https://" + listener.Addr().String())
	if err != nil {
		t.Fatalf("first HTTPS request failed while certificate lookup exceeded HTTP timeout: %v", err)
	}
	body, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil || string(body) != "first request" {
		t.Fatalf("response=%q err=%v", body, err)
	}
	// Once TLS is complete, slow HTTP headers must still hit the HTTP budget.
	connection, err := tls.DialWithDialer(&net.Dialer{Timeout: time.Second}, "tcp", listener.Addr().String(), tlsConfig)
	if err != nil {
		t.Fatal(err)
	}
	defer connection.Close()
	connection.Write([]byte("GET / HTTP/1.1\r\nHost:"))
	connection.SetReadDeadline(time.Now().Add(600 * time.Millisecond))
	_, err = io.ReadAll(connection)
	if timeout, ok := err.(net.Error); ok && timeout.Timeout() {
		t.Fatal("HTTP header timeout was lost after TLS")
	}
	// The initial ClientHello remains bounded before a valid hostname is known.
	raw, err := net.DialTimeout("tcp", listener.Addr().String(), time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer raw.Close()
	raw.SetReadDeadline(time.Now().Add(600 * time.Millisecond))
	buffer := make([]byte, 1)
	_, err = raw.Read(buffer)
	if timeout, ok := err.(net.Error); ok && timeout.Timeout() {
		t.Fatal("initial TLS ClientHello timeout was lost")
	}
	if err != nil && !strings.Contains(err.Error(), "EOF") {
		t.Fatalf("ClientHello close: %v", err)
	}
}
