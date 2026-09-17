package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func do(t *testing.T, srv *httptest.Server, method, path, body string, header map[string]string) (*http.Response, string) {
	t.Helper()
	req, err := http.NewRequest(method, srv.URL+path, strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	for k, v := range header {
		req.Header.Set(k, v)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, string(data)
}

func TestFakeS3RoundTrip(t *testing.T) {
	srv := httptest.NewServer(newFakeS3())
	defer srv.Close()

	if resp, _ := do(t, srv, http.MethodPut, "/bucket/a/b", "body", nil); resp.StatusCode != http.StatusOK {
		t.Fatalf("put: %s", resp.Status)
	}
	if resp, got := do(t, srv, http.MethodGet, "/bucket/a/b", "", nil); resp.StatusCode != http.StatusOK || got != "body" {
		t.Fatalf("get: %s %q", resp.Status, got)
	}
	if resp, _ := do(t, srv, http.MethodHead, "/bucket/a/b", "", nil); resp.Header.Get("Content-Length") != "4" {
		t.Fatalf("head Content-Length = %q", resp.Header.Get("Content-Length"))
	}

	// A server-side copy names its source as "/{bucket}/{key}", escaped.
	if resp, _ := do(t, srv, http.MethodPut, "/bucket/c", "", map[string]string{"x-amz-copy-source": "bucket%2Fa%2Fb"}); resp.StatusCode != http.StatusOK {
		t.Fatalf("copy: %s", resp.Status)
	}
	if _, got := do(t, srv, http.MethodGet, "/bucket/c", "", nil); got != "body" {
		t.Fatalf("copied body = %q", got)
	}

	if resp, _ := do(t, srv, http.MethodDelete, "/bucket/a/b", "", nil); resp.StatusCode != http.StatusNoContent {
		t.Fatalf("delete: %s", resp.Status)
	}
	resp, got := do(t, srv, http.MethodGet, "/bucket/a/b", "", nil)
	if resp.StatusCode != http.StatusNotFound || !strings.Contains(got, "NoSuchKey") {
		t.Fatalf("get after delete: %s %q", resp.Status, got)
	}
	if resp, _ := do(t, srv, http.MethodHead, "/bucket", "", nil); resp.StatusCode != http.StatusOK {
		t.Fatalf("bucket head: %s", resp.Status)
	}
}

func TestAnEmptyOutboxListsAsAnArray(t *testing.T) {
	srv := httptest.NewServer((&control{outbox: &outbox{}}).handler())
	defer srv.Close()
	if _, got := do(t, srv, http.MethodGet, "/outbox", "", nil); strings.TrimSpace(got) != "[]" {
		t.Fatalf("GET /outbox = %q", got)
	}
}
