package alpsbase

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/maildir"
)

// Signing out is an explicit end, including when the expired session could
// not be restored. It clears all authentication cookies, not only the token.
func TestHTTP_SignOutThroughARestoreOutageClearsAllCookies(t *testing.T) {
	down := &atomic.Bool{}
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) { o.Provider = downOptions{o.Provider, down} })
	s.login()
	names := []string{"alps_session", "alps_login_token", "alps_logged_in", "alps_has_login_token"}
	for _, name := range names {
		if !contains(s.cookieNames(), name) {
			t.Fatalf("sign-in did not set %s", name)
		}
	}
	s.forgetSession()
	down.Store(true)
	s.expect(s.do("DELETE", "/session", nil), http.StatusOK)
	for _, name := range names {
		if contains(s.cookieNames(), name) {
			t.Errorf("sign-out during outage retained %s", name)
		}
	}
	down.Store(false)
	s.expect(s.do("GET", "/session", nil), http.StatusUnauthorized)
}

type restoreAccountOutageOptions struct {
	provider.Options
	down *atomic.Bool
}

func (o restoreAccountOutageOptions) CreateFactory(timeout time.Duration, debug bool) provider.AuthenticatedProviderFactory {
	connect := o.Options.CreateFactory(timeout, debug)
	return func(username, password string) (provider.MailProvider, error) {
		if o.down.Load() && username == testUser {
			return nil, errors.New("mail server temporarily unavailable for the remembered account")
		}
		return connect(username, password)
	}
}

// A restore failure does not prevent a public explicit sign-in with other
// valid credentials. Protected handlers still require that new session.
func TestHTTP_ExplicitSignInStillRunsDuringARestoreOutage(t *testing.T) {
	down := &atomic.Bool{}
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) { o.Provider = restoreAccountOutageOptions{o.Provider, down} })
	const otherUser, otherPassword = "charles@example.com", "charles-secret"
	base := filepath.Dir(s.dir)
	passwd := filepath.Join(base, "passwd")
	data, err := os.ReadFile(passwd)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(passwd, append(data, []byte(otherUser+":{PLAIN}"+otherPassword+"\n")...), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := maildir.NewProvider(filepath.Join(base, "charles"), otherUser).CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	s.login()
	s.forgetSession()
	down.Store(true)
	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusServiceUnavailable)
	s.expect(s.do("POST", "/session", map[string]string{"username": otherUser, "password": otherPassword}), http.StatusOK)
	r := s.do("GET", "/session", nil)
	s.expect(r, http.StatusOK)
	var body struct{ Username string }
	r.json(t, &body)
	if body.Username != otherUser {
		t.Fatalf("new session belongs to %q, want %q", body.Username, otherUser)
	}
}
