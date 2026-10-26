package alpsbase

import (
	"errors"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// downOptions is a provider whose mail server can be taken down. While it is,
// every sign-in fails before the credentials are looked at, as while the IMAP
// server restarts.
type downOptions struct {
	provider.Options
	down *atomic.Bool
}

func (o downOptions) CreateFactory(timeout time.Duration, debug bool) provider.AuthenticatedProviderFactory {
	connect := o.Options.CreateFactory(timeout, debug)
	return func(username, password string) (provider.MailProvider, error) {
		if o.down.Load() {
			return nil, errors.New("failed to connect to IMAP server: dial tcp 192.0.2.1:993: connect: connection refused")
		}
		return connect(username, password)
	}
}

// cookieNames is the names of the cookies the browser holds for the server.
func (s *testServer) cookieNames() []string {
	s.t.Helper()
	u, err := url.Parse(s.url)
	if err != nil {
		s.t.Fatal(err)
	}
	var names []string
	for _, c := range s.client.Jar.Cookies(u) {
		names = append(names, c.Name)
	}
	return names
}

// A session the mail server could not restore, because it was down, is no
// refusal of the password the login token holds. The token was thrown away,
// and a user who came back once the server was up again found the login form.
func TestHTTP_ARestoreThroughAnOutageKeepsTheToken(t *testing.T) {
	down := &atomic.Bool{}
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
		o.Provider = downOptions{o.Provider, down}
	})
	s.login()
	s.forgetSession()

	down.Store(true)
	r := s.do("GET", "/mailboxes/INBOX", nil)
	s.expect(r, http.StatusServiceUnavailable)
	var body struct{ Error string }
	r.json(t, &body)
	if body.Error != "mail_server_unavailable" {
		t.Errorf("refused with %q, want mail_server_unavailable", body.Error)
	}
	// The session cookie too: it is what has the next request restore the
	// session. The page reads the other two to tell whether it is signed in.
	for _, name := range []string{"alps_session", "alps_login_token", "alps_logged_in", "alps_has_login_token"} {
		if !contains(s.cookieNames(), name) {
			t.Errorf("the browser no longer holds %s", name)
		}
	}

	down.Store(false)
	s.mailbox("INBOX")
}

// A token whose password the mail server refuses is no good, and is cleared.
func TestHTTP_ARefusedTokenIsCleared(t *testing.T) {
	s := newTestServer(t)
	s.login()
	passwd := filepath.Join(filepath.Dir(s.dir), "passwd")
	if err := os.WriteFile(passwd, []byte(testUser+":{PLAIN}changed elsewhere\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	s.forgetSession()

	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
	for _, name := range []string{"alps_login_token", "alps_has_login_token"} {
		if contains(s.cookieNames(), name) {
			t.Errorf("the browser still holds %s", name)
		}
	}
}

// lostWhile is a connection that is lost while lost is set, as a session's
// connection is when its mail server goes down.
type lostWhile struct {
	provider.MailProvider
	lost *atomic.Bool
}

func (p lostWhile) ListMailboxes() ([]provider.Mailbox, error) {
	if p.lost.Load() {
		return nil, io.EOF
	}
	return p.MailProvider.ListMailboxes()
}

// A session whose connection is lost, and cannot be opened again because the
// mail server is down, ends. The sign-in does not: the password was never in
// question. The login token was thrown away with the session, and a user who
// came back once the server was up again had to sign in.
func TestHTTP_AnOutageKeepsTheSignIn(t *testing.T) {
	down := &atomic.Bool{}
	s := newTestServerWithOptionsWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
		o.Provider = downOptions{o.Provider, down}
	}, func(p provider.MailProvider) provider.MailProvider { return lostWhile{p, down} })
	s.login()

	down.Store(true)
	r := s.do("GET", "/mailboxes", nil)
	s.expect(r, http.StatusServiceUnavailable)
	var body struct{ Error string }
	r.json(t, &body)
	if body.Error != "mail_server_unavailable" {
		t.Errorf("refused with %q, want mail_server_unavailable", body.Error)
	}
	for _, name := range []string{"alps_session", "alps_login_token", "alps_logged_in", "alps_has_login_token"} {
		if !contains(s.cookieNames(), name) {
			t.Errorf("the browser no longer holds %s", name)
		}
	}

	down.Store(false)
	s.expect(s.do("GET", "/mailboxes", nil), http.StatusOK)
}

// A connection opened again with a password the mail server now refuses still
// signs the user out, token and all.
func TestHTTP_APasswordChangedElsewhereStillSignsOut(t *testing.T) {
	lost := &atomic.Bool{}
	s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
		return lostWhile{p, lost}
	})
	s.login()
	passwd := filepath.Join(filepath.Dir(s.dir), "passwd")
	if err := os.WriteFile(passwd, []byte(testUser+":{PLAIN}changed elsewhere\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	lost.Store(true)
	s.expect(s.do("GET", "/mailboxes", nil), http.StatusUnauthorized)
	for _, name := range []string{"alps_session", "alps_login_token", "alps_has_login_token"} {
		if contains(s.cookieNames(), name) {
			t.Errorf("the browser still holds %s", name)
		}
	}
}
