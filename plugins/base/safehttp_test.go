package alpsbase

import (
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"
)

func TestIsDisallowedIP(t *testing.T) {
	blocked := []string{
		// loopback
		"127.0.0.1", "127.1.2.3", "::1",
		// private
		"10.0.0.1", "172.16.5.4", "172.31.255.255", "192.168.1.1", "fc00::1", "fd00:ec2::254",
		// link-local, where cloud metadata lives
		"169.254.169.254", "fe80::1",
		// unspecified and "this network"
		"0.0.0.0", "0.1.2.3", "::",
		// multicast
		"224.0.0.1", "ff02::1",
		// carrier-grade NAT, protocol assignments, benchmarking, reserved
		"100.64.0.1", "100.127.255.254", "192.0.0.8", "198.18.0.1", "198.19.255.255", "240.0.0.1", "255.255.255.255",
		// IPv4-mapped IPv6 spellings of the above
		"::ffff:127.0.0.1", "::ffff:10.0.0.1", "::ffff:169.254.169.254",
	}
	for _, s := range blocked {
		if !isDisallowedIP(net.ParseIP(s)) {
			t.Errorf("%s was allowed", s)
		}
	}
	allowed := []string{
		"8.8.8.8", "93.184.216.34", "2606:4700:4700::1111",
		// just outside the blocked ranges
		"100.63.255.255", "100.128.0.1", "172.32.0.1", "198.20.0.1", "192.0.1.1", "1.0.0.1",
	}
	for _, s := range allowed {
		if isDisallowedIP(net.ParseIP(s)) {
			t.Errorf("%s was blocked", s)
		}
	}
	if !isDisallowedIP(nil) {
		t.Error("an unparseable address was allowed")
	}
}

func TestSafeDialControl(t *testing.T) {
	cases := []struct {
		network, address string
		ok               bool
	}{
		{"tcp4", "93.184.216.34:443", true},
		{"tcp6", "[2606:4700:4700::1111]:443", true},
		{"tcp4", "127.0.0.1:80", false},
		{"tcp6", "[::1]:80", false},
		{"tcp4", "169.254.169.254:80", false},
		{"udp4", "8.8.8.8:53", false},
		{"tcp4", "not-an-ip:80", false},
		{"tcp4", "missing-port", false},
	}
	for _, c := range cases {
		if err := safeDialControl(c.network, c.address, nil); (err == nil) != c.ok {
			t.Errorf("safeDialControl(%s, %s) = %v", c.network, c.address, err)
		}
	}
}

// The guard runs on the RESOLVED address at dial time, so a URL that names
// this host is refused before any request leaves.
func TestSafeHTTPClientRefusesLoopback(t *testing.T) {
	var hits atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) { hits.Add(1) }))
	defer srv.Close()

	_, err := newSafeHTTPClient(2 * time.Second).Get(srv.URL)
	if !errors.Is(err, errBlockedAddress) {
		t.Fatalf("got %v, want errBlockedAddress", err)
	}
	if hits.Load() != 0 {
		t.Fatalf("the server received %d requests", hits.Load())
	}
}

func TestSafeHTTPClientRedirectPolicy(t *testing.T) {
	client := newSafeHTTPClient(time.Second)
	if client.Timeout != time.Second {
		t.Errorf("timeout = %v", client.Timeout)
	}
	req := func(raw string) *http.Request {
		r, err := http.NewRequest("GET", raw, nil)
		if err != nil {
			t.Fatal(err)
		}
		return r
	}
	via := func(n int) []*http.Request { return make([]*http.Request, n) }

	if err := client.CheckRedirect(req("https://cdn.example/a.png"), via(1)); err != nil {
		t.Errorf("an https redirect was refused: %v", err)
	}
	for _, raw := range []string{"file:///etc/passwd", "ftp://cdn.example/a", "gopher://cdn.example/"} {
		if err := client.CheckRedirect(req(raw), via(1)); !errors.Is(err, errBlockedAddress) {
			t.Errorf("redirect to %s: got %v", raw, err)
		}
	}
	if err := client.CheckRedirect(req("https://cdn.example/a.png"), via(5)); err == nil {
		t.Error("a sixth redirect was followed")
	}
}
