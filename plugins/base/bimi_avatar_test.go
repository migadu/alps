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

var (
	dmarcReject = []string{"v=DMARC1; p=reject; rua=mailto:dmarc@brand.test"}
	bimiRecord  = []string{"v=BIMI1; l=https://logo.brand.test/brand.svg; a="}
)

type lookupFunc func(string) ([]string, error)
type fetchFunc func(string) (*http.Response, error)

// answers routes a lookup of a _dmarc name to dmarc and any other to bimi.
func answers(dmarc, bimi lookupFunc) lookupFunc {
	return func(name string) ([]string, error) {
		if strings.HasPrefix(name, "_dmarc.") {
			return dmarc(name)
		}
		return bimi(name)
	}
}

func records(txt ...string) lookupFunc {
	return func(string) ([]string, error) { return txt, nil }
}

func dnsFails(err *net.DNSError) lookupFunc {
	return func(string) ([]string, error) { return nil, err }
}

func logoResponse(status int, body string) *http.Response {
	return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Header: http.Header{}}
}

func logo(string) (*http.Response, error) { return logoResponse(http.StatusOK, bimiLogo), nil }

// bimiNetwork stands in for DNS and the logo host for one test, gives the
// avatar cache a directory of its own, and counts the lookups made.
type bimiNetwork struct {
	lookup  lookupFunc
	fetch   fetchFunc
	lookups int
}

func stubBIMINetwork(t *testing.T, n *bimiNetwork) {
	t.Helper()
	t.Setenv("TMPDIR", t.TempDir())
	oldLookup, oldFetch := lookupTXT, fetchBIMILogo
	lookupTXT = func(name string) ([]string, error) {
		n.lookups++
		return n.lookup(name)
	}
	fetchBIMILogo = func(url string) (*http.Response, error) { return n.fetch(url) }
	t.Cleanup(func() { lookupTXT, fetchBIMILogo = oldLookup, oldFetch })
}

func healthy(n *bimiNetwork) {
	n.lookup = answers(records(dmarcReject...), records(bimiRecord...))
	n.fetch = logo
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

func TestDMARCPolicy(t *testing.T) {
	cases := []struct {
		txts []string
		want string
	}{
		{[]string{"v=DMARC1; p=reject"}, "reject"},
		{[]string{"v=spf1 -all", "v=DMARC1;p=Quarantine; pct=100"}, "quarantine"},
		{[]string{"v=DMARC1; p = reject"}, "reject"},
		{[]string{"v=DMARC1; p=none; sp=reject"}, "none"},
		{[]string{"v=DMARC1; pct=100; sp=reject"}, ""},
		{[]string{"v=DMARC2; p=reject"}, ""},
		{[]string{"p=reject"}, ""},
		{nil, ""},
	}
	for _, c := range cases {
		if got := dmarcPolicy(c.txts); got != c.want {
			t.Errorf("dmarcPolicy(%q) = %q, want %q", c.txts, got, c.want)
		}
	}
}

func TestHTTP_BIMIAvatarServesAndCachesALogo(t *testing.T) {
	for _, policy := range []string{"reject", "quarantine"} {
		t.Run(policy, func(t *testing.T) {
			n := &bimiNetwork{fetch: logo}
			n.lookup = answers(records("v=DMARC1; p="+policy), records(bimiRecord...))
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
			if n.lookups != 2 {
				t.Fatalf("%d lookups for two requests, want 2 (DMARC and BIMI, once)", n.lookups)
			}
		})
	}
}

func TestHTTP_BIMIAvatarRemembersOnlyAnswers(t *testing.T) {
	status := func(code int) fetchFunc {
		return func(string) (*http.Response, error) { return logoResponse(code, ""), nil }
	}
	fetchFails := func(err error) fetchFunc {
		return func(string) (*http.Response, error) { return nil, err }
	}
	timeout := &net.DNSError{Err: "i/o timeout", Name: "brand.test", IsTimeout: true}
	notFound := &net.DNSError{Err: "no such host", Name: "brand.test", IsNotFound: true}
	dmarc, bimi := records(dmarcReject...), records(bimiRecord...)

	cases := []struct {
		name      string
		lookup    lookupFunc
		fetch     fetchFunc
		transient bool
	}{
		{"a DMARC lookup timeout", answers(dnsFails(timeout), bimi), logo, true},
		{"a BIMI lookup timeout", answers(dmarc, dnsFails(timeout)), logo, true},
		{"a resolver failure", answers(dmarc, dnsFails(&net.DNSError{Err: "server misbehaving", Name: "brand.test", IsTemporary: true})), logo, true},
		{"an unreachable logo host", answers(dmarc, bimi), fetchFails(&net.OpError{Op: "dial", Net: "tcp", Err: errors.New("connection refused")}), true},
		{"a 503 from the logo host", answers(dmarc, bimi), status(http.StatusServiceUnavailable), true},
		{"a 429 from the logo host", answers(dmarc, bimi), status(http.StatusTooManyRequests), true},
		{"a DMARC policy of none", answers(records("v=DMARC1; p=none; rua=mailto:d@brand.test"), bimi), logo, false},
		{"no DMARC record", answers(records("v=spf1 -all"), bimi), logo, false},
		{"no DMARC name", answers(dnsFails(notFound), bimi), logo, false},
		{"no BIMI name", answers(dmarc, dnsFails(notFound)), logo, false},
		{"no BIMI record", answers(dmarc, records("v=spf1 -all")), logo, false},
		{"a logo over plain http", answers(dmarc, records("v=BIMI1; l=http://logo.brand.test/brand.svg")), logo, false},
		{"a 404 from the logo host", answers(dmarc, bimi), status(http.StatusNotFound), false},
		{"a refused address", answers(dmarc, bimi), fetchFails(fmt.Errorf("dial tcp 10.0.0.1:443: %w", errBlockedAddress)), false},
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
			lookups := n.lookups
			healthy(n)
			s.expect(s.do("GET", "/bimi/avatar?domain=brand.test", nil), http.StatusNotFound)
			if n.lookups != lookups {
				t.Fatalf("%d lookups after the first request, %d after the second", lookups, n.lookups)
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
