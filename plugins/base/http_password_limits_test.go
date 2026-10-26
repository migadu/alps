package alpsbase

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/migadu/alps"
	_ "github.com/migadu/alps/plugins/password"
	"github.com/migadu/alps/provider/maildir"
)

const (
	linkTarget         = "charles@example.com"
	linkTargetPassword = "charlessecret"
)

// newLimitedServer is a test server with the login limits on. The per-minute
// window is wide, so that it is the limits per account that a test meets.
func newLimitedServer(t *testing.T, adjust func(*alps.Options)) (*testServer, alps.RateLimitConfig) {
	t.Helper()
	config := alps.DefaultRateLimitConfig()
	config.IPRequestsPerMinute = 100
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
		o.RateLimitEnabled = true
		o.RateLimitConfig = &config
		if adjust != nil {
			adjust(o)
		}
	})
	return s, config
}

// addLinkTarget gives the server a second account, which the first can link.
func addLinkTarget(t *testing.T, s *testServer) {
	t.Helper()
	baseDir := filepath.Dir(s.dir)
	passwdPath := filepath.Join(baseDir, "passwd")
	passwd, err := os.ReadFile(passwdPath)
	if err != nil {
		t.Fatal(err)
	}
	passwd = append(passwd, []byte(linkTarget+":{PLAIN}"+linkTargetPassword+"\n")...)
	if err := os.WriteFile(passwdPath, passwd, 0o600); err != nil {
		t.Fatal(err)
	}
	if err := maildir.NewProvider(filepath.Join(baseDir, "charles"), linkTarget).CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
}

func (s *testServer) link(password string) response {
	s.t.Helper()
	return s.do("POST", "/accounts", url.Values{"username": {linkTarget}, "password": {password}})
}

// Linking signs in to the other account with the password given, and counts
// against the login limits for that account and the address it comes from,
// as the login form does. Once they are spent the right password waits too,
// here and at the login form.
func TestHTTP_LinkingCountsAgainstTheLoginLimits(t *testing.T) {
	s, config := newLimitedServer(t, nil)
	addLinkTarget(t, s)
	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword}), http.StatusOK)

	for i := 0; i < config.UsernameFailsPerQuarter; i++ {
		s.expect(s.link("wrong"), http.StatusBadRequest)
	}
	r := s.link(linkTargetPassword)
	s.expect(r, http.StatusTooManyRequests)
	if r.header.Get("Retry-After") == "" {
		t.Error("no Retry-After")
	}
	if listed := s.do("GET", "/accounts", nil); strings.Contains(string(listed.body), linkTarget) {
		t.Fatalf("the account was linked past the limit: %s", listed.body)
	}

	// The login form is held to the same count for that account.
	s.expect(s.do("POST", "/session", map[string]string{"username": linkTarget, "password": linkTargetPassword}), http.StatusTooManyRequests)
}

// Below the limits the right password links the account, after a wrong one.
func TestHTTP_LinkingStillWorksUnderTheLimits(t *testing.T) {
	s, config := newLimitedServer(t, nil)
	addLinkTarget(t, s)
	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword}), http.StatusOK)

	for i := 0; i < config.UsernameFailsPerQuarter-1; i++ {
		s.expect(s.link("wrong"), http.StatusBadRequest)
	}
	s.expect(s.link(linkTargetPassword), http.StatusOK)
	if listed := s.do("GET", "/accounts", nil); !strings.Contains(string(listed.body), linkTarget) {
		t.Fatalf("the account was not linked: %s", listed.body)
	}
}

// The password page checks the current password before it changes it, and
// the check counts against the login limits for the account and the address
// it comes from, as the login form and the second factor's password
// confirmations do.
func TestHTTP_PasswordChangeCountsAgainstTheLoginLimits(t *testing.T) {
	var changes atomic.Int32
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		changes.Add(1)
	}))
	defer backend.Close()
	s, config := newLimitedServer(t, func(o *alps.Options) {
		o.Plugins = map[string]alps.PluginConfig{
			"password": {Enabled: true, Options: map[string]interface{}{"endpoint": backend.URL}},
		}
	})
	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword}), http.StatusOK)

	change := func(old string) response {
		return s.do("POST", "/password/change", map[string]string{"old_password": old, "password": "new horse"})
	}
	for i := 0; i < config.UsernameFailsPerQuarter; i++ {
		s.expect(change("wrong"), http.StatusForbidden)
	}
	r := change(testPassword)
	s.expect(r, http.StatusTooManyRequests)
	if r.header.Get("Retry-After") == "" {
		t.Error("no Retry-After")
	}
	if n := changes.Load(); n != 0 {
		t.Fatalf("the password was changed past the limit (%d requests to the backend)", n)
	}

	// The login form is held to the same count.
	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword}), http.StatusTooManyRequests)
}

// Below the limits the right password still changes it, after a wrong one.
func TestHTTP_PasswordChangeStillWorksUnderTheLimits(t *testing.T) {
	var changes atomic.Int32
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		changes.Add(1)
	}))
	defer backend.Close()
	s, config := newLimitedServer(t, func(o *alps.Options) {
		o.Plugins = map[string]alps.PluginConfig{
			"password": {Enabled: true, Options: map[string]interface{}{"endpoint": backend.URL}},
		}
	})
	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword}), http.StatusOK)

	for i := 0; i < config.UsernameFailsPerQuarter-1; i++ {
		s.expect(s.do("POST", "/password/change", map[string]string{"old_password": "wrong", "password": "new horse"}), http.StatusForbidden)
	}
	s.expect(s.do("POST", "/password/change", map[string]string{"old_password": testPassword, "password": "new horse"}), http.StatusOK)
	if n := changes.Load(); n != 1 {
		t.Errorf("%d requests to the backend, want 1", n)
	}
}
