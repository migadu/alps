package alpsbase

import (
	"net/http"
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
