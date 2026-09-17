package alpsbase

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"testing"

	"github.com/migadu/alps/provider"
)

func (s *testServer) signIn() response {
	s.t.Helper()
	return s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword})
}

// An account with a WebAuthn credential is asked for it, and has no access to
// its mail until it is given.
func TestHTTP_SignInAsksForTheSecondFactor(t *testing.T) {
	s := newTestServer(t)
	store, err := s.store.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Put("webauthn", map[string]any{"enabled": true, "credentials": []any{map[string]any{"name": "key"}}}); err != nil {
		t.Fatal(err)
	}

	r := s.signIn()
	s.expect(r, http.StatusOK)
	var got map[string]any
	r.json(t, &got)
	if got["requires_2fa"] != true {
		t.Fatalf("signing in answered %v, want requires_2fa", got)
	}
	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
}

// A WebAuthn record that does not decode is removed, and the account signs in
// without a second factor: no credential in it can be checked, and kept, it
// would stop every sign-in.
func TestHTTP_SignInRemovesAWebAuthnRecordThatDoesNotDecode(t *testing.T) {
	s := newTestServer(t)
	store, err := s.store.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Put("webauthn", "not a WebAuthn record"); err != nil {
		t.Fatal(err)
	}

	r := s.signIn()
	s.expect(r, http.StatusOK)
	var got map[string]any
	r.json(t, &got)
	if got["ok"] != true {
		t.Fatalf("signing in answered %v", got)
	}
	var record any
	if err := store.Get("webauthn", &record); err != provider.ErrNoStoreEntry {
		t.Errorf("the record is still %v, %v", record, err)
	}
	s.mailbox("INBOX")
}

// When whether the account takes a second factor cannot be looked up, the
// sign-in stops. It used to go ahead without one.
func TestHTTP_SignInStopsWhenTheSecondFactorCannotBeLookedUp(t *testing.T) {
	s := newTestServer(t)
	// The store's file cannot be read.
	if err := os.Mkdir(filepath.Join(s.dir, "alps_store.json"), 0o700); err != nil {
		t.Fatal(err)
	}

	if r := s.signIn(); r.status == http.StatusOK {
		t.Fatalf("signed in: %s", r.body)
	}
	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
}

// forgetSession is a server restart as the browser sees it: the session is
// gone, and the login token cookie is what it has left.
func (s *testServer) forgetSession() {
	s.t.Helper()
	u, err := url.Parse(s.url)
	if err != nil {
		s.t.Fatal(err)
	}
	s.client.Jar.SetCookies(u, []*http.Cookie{{Name: "alps_session", Value: "gone", Path: "/"}})
}

// The login token says whether the sign-in that issued it gave a second
// factor. It used to say so at every sign-in, so a token from before the
// account turned 2FA on restored a session past it, for as long as the token
// lasted.
func TestHTTP_ATokenFromASignInWithout2FADoesNotVouchForIt(t *testing.T) {
	s := newTestServer(t)
	store, err := s.store.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	s.login()

	// Without a second factor on the account, the token restores the session.
	s.forgetSession()
	s.mailbox("INBOX")

	// The account turns 2FA on elsewhere: the token no longer does.
	if err := store.Put("webauthn", map[string]any{"enabled": true, "credentials": []any{map[string]any{"name": "key"}}}); err != nil {
		t.Fatal(err)
	}
	s.forgetSession()
	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)

	// Signing in from the token asks for the second factor too.
	s.forgetSession()
	r := s.do("POST", "/session", map[string]string{})
	s.expect(r, http.StatusOK)
	var got map[string]any
	r.json(t, &got)
	if got["requires_2fa"] != true {
		t.Fatalf("signing in from the token answered %v, want requires_2fa", got)
	}
	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
}
