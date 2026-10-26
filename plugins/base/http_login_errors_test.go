package alpsbase

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// outageOptions is a provider whose mail server can be taken down. While it
// is, every sign-in fails before the credentials are looked at, as when the
// IMAP server cannot be reached.
type outageOptions struct {
	provider.Options
	down *atomic.Bool
}

func (o outageOptions) CreateFactory(timeout time.Duration, debug bool) provider.AuthenticatedProviderFactory {
	connect := o.Options.CreateFactory(timeout, debug)
	return func(username, password string) (provider.MailProvider, error) {
		if o.down.Load() {
			return nil, errors.New("failed to connect to IMAP server: dial tcp 192.0.2.1:993: connect: connection refused")
		}
		return connect(username, password)
	}
}

// peerNode is another node of the cluster: it keeps what the server
// broadcasts, and hands it to its own rate limiter.
type peerNode struct {
	limiter *alps.RateLimiter
	mu      sync.Mutex
	events  []map[string]any
}

func (p *peerNode) Broadcast(msg []byte) {
	p.limiter.HandleClusterMessage(msg)
	var event map[string]any
	if json.Unmarshal(msg, &event) == nil {
		p.mu.Lock()
		p.events = append(p.events, event)
		p.mu.Unlock()
	}
}

func newOutageServer(t *testing.T, config alps.RateLimitConfig) (*testServer, *atomic.Bool, *peerNode) {
	t.Helper()
	down := &atomic.Bool{}
	peer := &peerNode{limiter: alps.NewRateLimiter(config, alps.NewLogger(), nil)}
	t.Cleanup(peer.limiter.Close)
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
		o.Provider = outageOptions{o.Provider, down}
		o.RateLimitEnabled = true
		o.RateLimitConfig = &config
		o.ClusterBroadcaster = peer
	})
	return s, down, peer
}

// A sign-in the mail server could not check is no wrong password. Each one
// counted as a failure for the account, here and on every other node, so a
// user who tried again through a short outage locked their own account.
func TestHTTP_MailServerOutageDoesNotLockTheAccount(t *testing.T) {
	config := alps.DefaultRateLimitConfig()
	config.IPRequestsPerMinute = 100 // the burst window is not what this is about
	s, down, peer := newOutageServer(t, config)
	creds := map[string]string{"username": testUser, "password": testPassword}

	down.Store(true)
	for i := 0; i < config.UsernameFailsPerQuarter; i++ {
		if r := s.do("POST", "/session", creds); r.status == http.StatusOK || r.status == http.StatusTooManyRequests {
			t.Fatalf("sign-in %d during the outage: status %d: %s", i+1, r.status, r.body)
		}
	}
	down.Store(false)

	s.expect(s.do("POST", "/session", creds), http.StatusOK)

	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "198.51.100.7:40000"
	if allowed, reason, _ := peer.limiter.CheckLoginAllowed(req, testUser); !allowed {
		t.Errorf("the other node refuses the account: %s", reason)
	}
	// A node without this change takes any attempt that did not succeed for
	// a failure. Told no username, it counts one against the address alone.
	peer.mu.Lock()
	defer peer.mu.Unlock()
	if len(peer.events) != config.UsernameFailsPerQuarter+1 {
		t.Fatalf("%d attempts broadcast, want %d", len(peer.events), config.UsernameFailsPerQuarter+1)
	}
	for _, event := range peer.events[:config.UsernameFailsPerQuarter] {
		if _, named := event["username"]; named {
			t.Errorf("an attempt the mail server could not check was broadcast with the username: %v", event)
		}
	}
}

// Still an attempt, though: one that ends in an error a client can provoke
// is not a free try, so it counts towards the address's per-minute window.
func TestHTTP_MailServerOutageCountsTowardsTheBurstWindow(t *testing.T) {
	config := alps.DefaultRateLimitConfig()
	s, down, _ := newOutageServer(t, config)
	creds := map[string]string{"username": testUser, "password": testPassword}

	down.Store(true)
	for i := 0; i < config.IPRequestsPerMinute; i++ {
		s.do("POST", "/session", creds)
	}
	down.Store(false)

	r := s.do("POST", "/session", creds)
	s.expect(r, http.StatusTooManyRequests)
	var body struct{ Error string }
	r.json(t, &body)
	if body.Error != "Too many login attempts, please wait a minute" {
		t.Errorf("refused with %q, want the per-minute window's refusal", body.Error)
	}
}

// A wrong password is still a failure, here and on the other nodes, and
// enough of them hold back even the right one.
func TestHTTP_WrongPasswordsStillLockTheAccount(t *testing.T) {
	config := alps.DefaultRateLimitConfig()
	config.IPRequestsPerMinute = 100
	s, _, peer := newOutageServer(t, config)

	for i := 0; i < config.UsernameFailsPerQuarter; i++ {
		s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": "wrong"}), http.StatusUnauthorized)
	}
	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword}), http.StatusTooManyRequests)

	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "198.51.100.8:40000"
	if allowed, _, _ := peer.limiter.CheckLoginAllowed(req, testUser); allowed {
		t.Error("the other node still lets the account sign in")
	}
}
