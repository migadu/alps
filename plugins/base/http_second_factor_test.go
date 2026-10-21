package alpsbase

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/cookiejar"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/go-webauthn/webauthn/protocol/webauthncbor"
	"github.com/go-webauthn/webauthn/protocol/webauthncose"
	"github.com/go-webauthn/webauthn/webauthn"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// These tests are about who may change an account's second factor: its keys,
// and the trust that lets a linked account switch to it without one.

// softKey is a security key made of software: enough of an authenticator to
// register with alps as a browser does, with no attestation.
type softKey struct {
	id  []byte
	key *ecdsa.PrivateKey
}

func newSoftKey(t *testing.T) *softKey {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	id := make([]byte, 16)
	if _, err := rand.Read(id); err != nil {
		t.Fatal(err)
	}
	return &softKey{id: id, key: key}
}

// testRPID is the relying party the test server's WebAuthn is set up for.
const testRPID = "localhost"

// withWebAuthn gives the server what a WebAuthn ceremony needs.
func (s *testServer) withWebAuthn() {
	s.t.Helper()
	wa, err := webauthn.New(&webauthn.Config{RPDisplayName: "alps", RPID: testRPID, RPOrigins: []string{s.url}})
	if err != nil {
		s.t.Fatal(err)
	}
	s.server.WebAuthn = wa
}

// beginEnrolment asks to add a key, and returns the challenge to sign when
// the server agrees.
func (s *testServer) beginEnrolment() (response, string) {
	s.t.Helper()
	r := s.do("POST", "/settings/2fa/begin", nil)
	if r.status != http.StatusOK {
		return r, ""
	}
	var options struct {
		PublicKey struct {
			Challenge string `json:"challenge"`
		} `json:"publicKey"`
	}
	r.json(s.t, &options)
	return r, options.PublicKey.Challenge
}

// finishEnrolment answers challenge with k, as the browser does once the key
// has been touched, and names the key.
func (s *testServer) finishEnrolment(k *softKey, challenge, name string) response {
	s.t.Helper()
	clientData, err := json.Marshal(map[string]any{"type": "webauthn.create", "challenge": challenge, "origin": s.url})
	if err != nil {
		s.t.Fatal(err)
	}
	publicKey, err := webauthncbor.Marshal(webauthncose.EC2PublicKeyData{
		PublicKeyData: webauthncose.PublicKeyData{KeyType: int64(webauthncose.EllipticKey), Algorithm: int64(webauthncose.AlgES256)},
		Curve:         int64(webauthncose.P256),
		XCoord:        k.key.PublicKey.X.FillBytes(make([]byte, 32)),
		YCoord:        k.key.PublicKey.Y.FillBytes(make([]byte, 32)),
	})
	if err != nil {
		s.t.Fatal(err)
	}
	rpIDHash := sha256.Sum256([]byte(testRPID))
	authData := append([]byte{}, rpIDHash[:]...)
	authData = append(authData, 0x45)                // user present, user verified, credential data included
	authData = append(authData, 0, 0, 0, 0)          // signature count
	authData = append(authData, make([]byte, 16)...) // no AAGUID
	authData = binary.BigEndian.AppendUint16(authData, uint16(len(k.id)))
	authData = append(authData, k.id...)
	authData = append(authData, publicKey...)
	attestation, err := webauthncbor.Marshal(map[string]any{"fmt": "none", "attStmt": map[string]any{}, "authData": authData})
	if err != nil {
		s.t.Fatal(err)
	}
	b64 := base64.RawURLEncoding.EncodeToString
	return s.do("POST", "/settings/2fa/finish", map[string]any{
		"id":         b64(k.id),
		"rawId":      b64(k.id),
		"type":       "public-key",
		"transports": []string{"usb"},
		"response":   map[string]string{"attestationObject": b64(attestation), "clientDataJSON": b64(clientData)},
		"name":       name,
	})
}

// enrolKey adds k to the account under name, the whole way through.
func (s *testServer) enrolKey(k *softKey, name string) {
	s.t.Helper()
	r, challenge := s.beginEnrolment()
	s.expect(r, http.StatusOK)
	s.expect(s.finishEnrolment(k, challenge, name), http.StatusOK)
}

// putWebAuthn writes the account's WebAuthn record as another device would.
func (s *testServer) putWebAuthn(record map[string]any) {
	s.t.Helper()
	store, err := s.store.GetStore()
	if err != nil {
		s.t.Fatal(err)
	}
	if err := store.Put("webauthn", record); err != nil {
		s.t.Fatal(err)
	}
}

// storedWebAuthn is the account's WebAuthn record as it is kept, and whether
// there is one.
func (s *testServer) storedWebAuthn() (map[string]any, bool) {
	s.t.Helper()
	store, err := s.store.GetStore()
	if err != nil {
		s.t.Fatal(err)
	}
	var record map[string]any
	if err := store.Get("webauthn", &record); errors.Is(err, provider.ErrNoStoreEntry) {
		return nil, false
	} else if err != nil {
		s.t.Fatal(err)
	}
	return record, true
}

// keyRecord is a stored key named name, whose credential ID is name itself.
func keyRecord(name string) map[string]any {
	return map[string]any{"name": name, "credential": map[string]any{"id": base64.StdEncoding.EncodeToString([]byte(name))}}
}

// signInBeforeKeys signs in to the account and then gives it the named keys,
// as another device enrolling them would: the session predates them and has
// not given a second factor.
func (s *testServer) signInBeforeKeys(trust bool, names ...string) {
	s.t.Helper()
	s.login()
	keys := []any{}
	for _, name := range names {
		keys = append(keys, keyRecord(name))
	}
	s.putWebAuthn(map[string]any{"enabled": len(keys) > 0, "credentials": keys, "trust_linked_accounts": trust})
}

// giveSecondFactor marks this browser's session as having given the second
// factor, as a sign-in that touched the key leaves it.
func (s *testServer) giveSecondFactor() {
	s.t.Helper()
	session, err := s.server.Sessions.Get(s.sessionToken())
	if err != nil {
		s.t.Fatal(err)
	}
	session.SetAuthenticated2FA(true)
}

func (s *testServer) sessionToken() string {
	s.t.Helper()
	req, err := http.NewRequest("GET", s.url, nil)
	if err != nil {
		s.t.Fatal(err)
	}
	for _, c := range s.client.Jar.Cookies(req.URL) {
		if c.Name == "alps_session" {
			return c.Value
		}
	}
	s.t.Fatal("this browser has no session")
	return ""
}

// anotherBrowser is a second browser on the same server, with no cookies.
func (s *testServer) anotherBrowser() *testServer {
	jar, _ := cookiejar.New(nil)
	other := *s
	other.client = &http.Client{Jar: jar}
	return &other
}

// removeKeyNamed asks for the key named name to be removed.
func (s *testServer) removeKeyNamed(name string) response {
	s.t.Helper()
	return s.do("POST", "/settings/2fa/credential/"+base64.URLEncoding.EncodeToString([]byte(name))+"/delete", nil)
}

// webAuthnSettings is what the settings page is told.
func (s *testServer) webAuthnSettings() WebAuthnSettingsData {
	s.t.Helper()
	r := s.do("GET", "/settings/2fa", nil)
	s.expect(r, http.StatusOK)
	var page WebAuthnSettingsData
	r.json(s.t, &page)
	return page
}

// A record is not kept for trust alone: without a key there is no second
// factor for it to waive.
func TestSaveCredentials_KeepsNoTrustWithoutAKey(t *testing.T) {
	s := newTestServer(t)
	store, err := s.store.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	if err := saveCredentials(store, &UserCredentials{Credentials: []CredentialInfo{}, TrustLinkedAccounts: true}); err != nil {
		t.Fatal(err)
	}
	if record, ok := s.storedWebAuthn(); ok {
		t.Fatalf("stored %v", record)
	}
}

// Removing the last key ends the trust that waived it: a key enrolled later
// starts without it.
func TestHTTP_RemovingTheLastKeyEndsTrustInLinkedAccounts(t *testing.T) {
	s := newTestServer(t)
	s.signInBeforeKeys(true, "laptop")
	s.giveSecondFactor()

	s.expect(s.removeKeyNamed("laptop"), http.StatusOK)
	if record, ok := s.storedWebAuthn(); ok {
		t.Fatalf("the record is still %v", record)
	}
	if s.webAuthnSettings().TrustLinkedAccounts {
		t.Error("the settings page still trusts linked accounts")
	}
}

// A record that trusts linked accounts without a key, as could be stored
// before, trusts none, and enrolling a first key does not bring that trust in.
func TestHTTP_TrustWithoutAKeyIsNotCarriedOverToTheFirstKey(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.putWebAuthn(map[string]any{"enabled": false, "credentials": []any{}, "trust_linked_accounts": true})
	s.login()

	if s.webAuthnSettings().TrustLinkedAccounts {
		t.Error("the settings page trusts linked accounts for an account without a key")
	}
	s.enrolKey(newSoftKey(t), "laptop")
	page := s.webAuthnSettings()
	if page.CredentialCount != 1 || page.TrustLinkedAccounts {
		t.Fatalf("after enrolling: %d keys, trust %v; want one key and no trust", page.CredentialCount, page.TrustLinkedAccounts)
	}
	record, _ := s.storedWebAuthn()
	if record["trust_linked_accounts"] != false {
		t.Errorf("stored trust_linked_accounts %v", record["trust_linked_accounts"])
	}
}

// setTrust asks for trust in linked accounts to be turned on or off, giving
// password, or none when it is empty.
func (s *testServer) setTrust(trust bool, password string) response {
	s.t.Helper()
	body := map[string]any{"trust": trust}
	if password != "" {
		body["current_password"] = password
	}
	return s.do("POST", "/settings/2fa/trust-linked-accounts", body)
}

// errorCode is the stable code a refusal carries for the page to translate.
func errorCode(t *testing.T, r response) string {
	t.Helper()
	var got struct {
		Error string `json:"error"`
	}
	r.json(t, &got)
	return got.Error
}

// expectRefusal checks that r is a refusal with status and code.
func (s *testServer) expectRefusal(r response, status int, code string) {
	s.t.Helper()
	s.expect(r, status)
	if got := errorCode(s.t, r); got != code {
		s.t.Errorf("refused with %q, want %q", got, code)
	}
}

// Trust waives a second factor, so an account without one has nothing to
// trust with. It could be turned on there before, ready for the first key.
func TestHTTP_TrustingLinkedAccountsTakesAKey(t *testing.T) {
	s := newTestServer(t)
	s.login()

	s.expectRefusal(s.setTrust(true, testPassword), http.StatusConflict, "no_security_key")
	if record, ok := s.storedWebAuthn(); ok {
		t.Fatalf("stored %v", record)
	}
}

// A session that has not given the second factor, as one opened before the
// account had a key, cannot turn trust on, even with the password; and the
// password is not checked for it.
func TestHTTP_TrustingLinkedAccountsTakesTheSecondFactor(t *testing.T) {
	s := newTestServer(t)
	s.signInBeforeKeys(false, "laptop")

	s.expectRefusal(s.setTrust(true, testPassword), http.StatusForbidden, "two_factor_required")
	s.expectRefusal(s.setTrust(true, "not the password"), http.StatusForbidden, "two_factor_required")
	if s.webAuthnSettings().TrustLinkedAccounts {
		t.Fatal("trust was turned on")
	}
	s.mailbox("INBOX") // a refusal, not a sign-out
}

// With the second factor given, trust still takes the account's password: it
// is missing, wrong, or right, and only the right one turns trust on.
func TestHTTP_TrustingLinkedAccountsTakesThePassword(t *testing.T) {
	s := newTestServer(t)
	s.signInBeforeKeys(false, "laptop")
	s.giveSecondFactor()

	s.expectRefusal(s.setTrust(true, ""), http.StatusBadRequest, "password_required")
	s.expectRefusal(s.do("POST", "/settings/2fa/trust-linked-accounts", map[string]any{"trust": true, "current_password": ""}), http.StatusBadRequest, "password_required")
	// Not a 401, which the page would take as the session having ended.
	s.expectRefusal(s.setTrust(true, "not the password"), http.StatusForbidden, "wrong_password")
	s.expectRefusal(s.setTrust(true, testPassword[:4]), http.StatusForbidden, "wrong_password")
	if s.webAuthnSettings().TrustLinkedAccounts {
		t.Fatal("trust was turned on without the password")
	}

	s.expect(s.setTrust(true, testPassword), http.StatusOK)
	if !s.webAuthnSettings().TrustLinkedAccounts {
		t.Fatal("the right password did not turn trust on")
	}
	s.mailbox("INBOX")
}

// Turning trust off waives nothing: the session is enough, with no second
// factor and no password.
func TestHTTP_TurningTrustOffTakesOnlyTheSession(t *testing.T) {
	s := newTestServer(t)
	s.signInBeforeKeys(true, "laptop")

	s.expect(s.setTrust(false, ""), http.StatusOK)
	if s.webAuthnSettings().TrustLinkedAccounts {
		t.Fatal("trust is still on")
	}
	record, _ := s.storedWebAuthn()
	if keys, _ := record["credentials"].([]any); len(keys) != 1 {
		t.Errorf("the account has %v keys left, want 1", record["credentials"])
	}
}

// Every password attempt counts against the account's login limits, so the
// password cannot be guessed here any faster than at the login form. Once they
// are spent even the right password waits.
func TestHTTP_PasswordGuessesForTrustAreRateLimited(t *testing.T) {
	s := newTestServer(t)
	s.signInBeforeKeys(false, "laptop")
	s.giveSecondFactor()
	s.server.RateLimiter = alps.NewRateLimiter(alps.RateLimitConfig{UsernameFailsPerQuarter: 2}, s.server.Logger(), nil)

	for i := 0; i < 2; i++ {
		s.expectRefusal(s.setTrust(true, "guess"), http.StatusForbidden, "wrong_password")
	}
	r := s.setTrust(true, testPassword)
	s.expectRefusal(r, http.StatusTooManyRequests, "rate_limited")
	if r.header.Get("Retry-After") == "" {
		t.Error("no Retry-After")
	}
	if s.webAuthnSettings().TrustLinkedAccounts {
		t.Fatal("trust was turned on past the limit")
	}
	// The login form is held to the same count.
	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword}), http.StatusTooManyRequests)
}

// Neither a wrong password nor the right one reaches the log, at any level.
func TestHTTP_ThePasswordForTrustIsNotLogged(t *testing.T) {
	logPath := filepath.Join(t.TempDir(), "alps.log")
	s := newTestServerWithLogger(t, "smtp://127.0.0.1:1", alps.NewLoggerWithOptions(alps.LoggerOptions{Output: logPath, Format: "console", Level: "debug"}))
	s.signInBeforeKeys(false, "laptop")
	s.giveSecondFactor()
	const guess = "a-guess-that-must-not-be-logged"

	s.expect(s.setTrust(true, guess), http.StatusForbidden)
	s.expect(s.setTrust(true, testPassword), http.StatusOK)

	logged, err := os.ReadFile(logPath)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(logged), "password confirmation refused") {
		t.Fatalf("the refusal was not logged, so this test reads the wrong log:\n%s", logged)
	}
	for _, secret := range []string{guess, testPassword} {
		if strings.Contains(string(logged), secret) {
			t.Errorf("the log contains %q", secret)
		}
	}
}
