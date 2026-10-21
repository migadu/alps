package alpsbase

import (
	"encoding/base64"
	"errors"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"testing"

	"github.com/go-webauthn/webauthn/webauthn"

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
	if err := store.Get("webauthn", &record); !errors.Is(err, provider.ErrNoStoreEntry) {
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

// signInToTheSecondFactor turns the second factor on for the account, gives the
// server what the WebAuthn ceremony needs, and signs in as far as the key.
func (s *testServer) signInToTheSecondFactor() {
	s.t.Helper()
	wa, err := webauthn.New(&webauthn.Config{RPDisplayName: "alps", RPID: "localhost", RPOrigins: []string{s.url}})
	if err != nil {
		s.t.Fatal(err)
	}
	s.server.WebAuthn = wa
	store, err := s.store.GetStore()
	if err != nil {
		s.t.Fatal(err)
	}
	key := map[string]any{"name": "key", "credential": map[string]any{"id": "a2V5"}}
	if err := store.Put("webauthn", map[string]any{"enabled": true, "credentials": []any{key}}); err != nil {
		s.t.Fatal(err)
	}
	r := s.signIn()
	s.expect(r, http.StatusOK)
	var got map[string]any
	r.json(s.t, &got)
	if got["requires_2fa"] != true {
		s.t.Fatalf("signing in answered %v, want requires_2fa", got)
	}
}

// An assertion that does not verify, as from a key the account does not know.
var refusedAssertion = map[string]any{"id": "a2V5", "rawId": "a2V5", "type": "public-key", "response": map[string]any{}}

// A key that is refused is a 400: it was a 500, the same answer as an outage,
// so the page could not tell the two apart. The pending sign-in stays, and
// the ceremony can be run again.
func TestHTTP_ARefusedSecurityKeyIsNotAnOutage(t *testing.T) {
	s := newTestServer(t)
	s.signInToTheSecondFactor()

	// No ceremony begun, none to finish.
	s.expect(s.do("POST", "/webauthn/verify/finish", refusedAssertion), http.StatusBadRequest)

	s.expect(s.do("POST", "/webauthn/verify/begin", nil), http.StatusOK)
	s.expect(s.do("POST", "/webauthn/verify/finish", refusedAssertion), http.StatusBadRequest)

	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
	s.expect(s.do("POST", "/webauthn/verify/begin", nil), http.StatusOK)
}

// When the account's keys cannot be read, the second factor answers 503,
// not a refusal, and the pending sign-in is still there once they can be.
func TestHTTP_AnOutageDuringTheSecondFactorIsNotARefusal(t *testing.T) {
	s := newTestServer(t)
	s.signInToTheSecondFactor()
	s.expect(s.do("POST", "/webauthn/verify/begin", nil), http.StatusOK)

	// The store's file cannot be read.
	path := filepath.Join(s.dir, "alps_store.json")
	record, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(path, 0o700); err != nil {
		t.Fatal(err)
	}

	s.expect(s.do("POST", "/webauthn/verify/finish", refusedAssertion), http.StatusServiceUnavailable)
	s.expect(s.do("POST", "/webauthn/verify/begin", nil), http.StatusServiceUnavailable)

	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, record, 0o600); err != nil {
		t.Fatal(err)
	}
	s.expect(s.do("POST", "/webauthn/verify/begin", nil), http.StatusOK)
}

// withSecurityKeys signs in to an account that has the named keys, as a
// session that has already given its second factor would be. The keys are put
// in after the sign-in, so that it is not asked for one.
func (s *testServer) withSecurityKeys(names ...string) {
	s.t.Helper()
	s.login()
	keys := make([]any, 0, len(names))
	for _, name := range names {
		keys = append(keys, map[string]any{"name": name, "credential": map[string]any{"id": base64.StdEncoding.EncodeToString([]byte(name))}})
	}
	store, err := s.store.GetStore()
	if err != nil {
		s.t.Fatal(err)
	}
	if err := store.Put("webauthn", map[string]any{"enabled": true, "credentials": keys}); err != nil {
		s.t.Fatal(err)
	}
	// Changing the keys of an account that has some takes a session that gave
	// the second factor.
	s.giveSecondFactor()
}

// removeKey asks for the named key to be removed, giving body as the request.
func (s *testServer) removeKey(name string, body any) response {
	s.t.Helper()
	return s.do("POST", "/settings/2fa/credential/"+base64.URLEncoding.EncodeToString([]byte(name))+"/delete", body)
}

// A key the account does not have is a 404, and an account with none at all
// is no exception. That one used to panic, for a slice of capacity -1.
func TestHTTP_RemovingAnUnknownSecurityKeyIsNotFound(t *testing.T) {
	s := newTestServer(t)
	s.withSecurityKeys("laptop")
	s.expect(s.removeKey("tablet", nil), http.StatusNotFound)

	s.expect(s.removeKey("laptop", nil), http.StatusOK)
	s.expect(s.removeKey("laptop", nil), http.StatusNotFound)
}
