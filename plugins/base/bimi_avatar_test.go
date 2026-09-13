package alpsbase

import (
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

const bimiLogo = `<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps"><title>Brand</title></svg>`

var bimiRecord = []string{"v=BIMI1; l=https://logo.brand.test/brand.svg; a="}

func logoResponse(status int, body string) *http.Response {
	return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Header: http.Header{}}
}

// bimiNetwork stands in for DNS and the logo host for one test, gives the
// avatar cache a directory of its own, and counts the lookups made.
type bimiNetwork struct {
	lookup  func(string) ([]string, error)
	fetch   func(string) (*http.Response, error)
	lookups int
}

func stubBIMINetwork(t *testing.T, n *bimiNetwork) {
	t.Helper()
	t.Setenv("TMPDIR", t.TempDir())
	oldLookup, oldFetch := lookupBIMITXT, fetchBIMILogo
	lookupBIMITXT = func(name string) ([]string, error) {
		n.lookups++
		return n.lookup(name)
	}
	fetchBIMILogo = func(url string) (*http.Response, error) { return n.fetch(url) }
	t.Cleanup(func() { lookupBIMITXT, fetchBIMILogo = oldLookup, oldFetch })
}

func healthy(n *bimiNetwork) {
	n.lookup = func(string) ([]string, error) { return bimiRecord, nil }
	n.fetch = func(string) (*http.Response, error) { return logoResponse(http.StatusOK, bimiLogo), nil }
}

// ageAvatarCache moves every cached entry d into the past.
func ageAvatarCache(t *testing.T, d time.Duration) {
	t.Helper()
	dir := filepath.Join(os.TempDir(), "alps-avatars")
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	when := time.Now().Add(-d)
	for _, e := range entries {
		if err := os.Chtimes(filepath.Join(dir, e.Name()), when, when); err != nil {
			t.Fatal(err)
		}
	}
}

func TestHTTP_BIMIAvatarServesAndCachesALogo(t *testing.T) {
	n := &bimiNetwork{}
	healthy(n)
	stubBIMINetwork(t, n)
	s := newTestServer(t)
	s.login()

	for i := 0; i < 2; i++ {
		r := s.do("GET", "/bimi/avatar?domain=brand.test", nil)
		s.expect(r, http.StatusOK)
		if got := r.header.Get("Content-Type"); got != "image/svg+xml" {
			t.Fatalf("Content-Type %q", got)
		}
	}
	if n.lookups != 1 {
		t.Fatalf("%d lookups for two requests, want 1", n.lookups)
	}
}

func TestHTTP_BIMIAvatarRemembersOnlyAnswers(t *testing.T) {
	record := func(txt ...string) func(string) ([]string, error) {
		return func(string) ([]string, error) { return txt, nil }
	}
	dnsFails := func(err *net.DNSError) func(string) ([]string, error) {
		return func(string) ([]string, error) { return nil, err }
	}
	logo := func(string) (*http.Response, error) { return logoResponse(http.StatusOK, bimiLogo), nil }
	status := func(code int) func(string) (*http.Response, error) {
		return func(string) (*http.Response, error) { return logoResponse(code, ""), nil }
	}
	fetchFails := func(err error) func(string) (*http.Response, error) {
		return func(string) (*http.Response, error) { return nil, err }
	}

	cases := []struct {
		name      string
		lookup    func(string) ([]string, error)
		fetch     func(string) (*http.Response, error)
		transient bool
	}{
		{"a DNS timeout", dnsFails(&net.DNSError{Err: "i/o timeout", Name: "default._bimi.brand.test", IsTimeout: true}), logo, true},
		{"a resolver failure", dnsFails(&net.DNSError{Err: "server misbehaving", Name: "default._bimi.brand.test", IsTemporary: true}), logo, true},
		{"an unreachable logo host", record(bimiRecord...), fetchFails(&net.OpError{Op: "dial", Net: "tcp", Err: errors.New("connection refused")}), true},
		{"a 503 from the logo host", record(bimiRecord...), status(http.StatusServiceUnavailable), true},
		{"a 429 from the logo host", record(bimiRecord...), status(http.StatusTooManyRequests), true},
		{"no such name", dnsFails(&net.DNSError{Err: "no such host", Name: "default._bimi.brand.test", IsNotFound: true}), logo, false},
		{"no BIMI record", record("v=spf1 -all"), logo, false},
		{"a logo over plain http", record("v=BIMI1; l=http://logo.brand.test/brand.svg"), logo, false},
		{"a 404 from the logo host", record(bimiRecord...), status(http.StatusNotFound), false},
		{"a refused address", record(bimiRecord...), fetchFails(fmt.Errorf("dial tcp 10.0.0.1:443: %w", errBlockedAddress)), false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			n := &bimiNetwork{lookup: c.lookup, fetch: c.fetch}
			stubBIMINetwork(t, n)
			s := newTestServer(t)
			s.login()

			r := s.do("GET", "/bimi/avatar?domain=brand.test", nil)
			s.expect(r, http.StatusNotFound)
			if noStore := r.header.Get("Cache-Control") == "no-store"; noStore != c.transient {
				t.Fatalf("Cache-Control %q for a transient=%v failure", r.header.Get("Cache-Control"), c.transient)
			}

			// Either way the next request does not go straight back to the
			// network.
			healthy(n)
			s.expect(s.do("GET", "/bimi/avatar?domain=brand.test", nil), http.StatusNotFound)
			if n.lookups != 1 {
				t.Fatalf("%d lookups, want 1", n.lookups)
			}

			// Past the retry window, a failure that was not an answer is
			// tried again and the logo arrives; an answer still stands.
			ageAvatarCache(t, bimiRetryAfter+time.Minute)
			want := http.StatusNotFound
			if c.transient {
				want = http.StatusOK
			}
			s.expect(s.do("GET", "/bimi/avatar?domain=brand.test", nil), want)
		})
	}
}
