package alpsbase

import (
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/go-webauthn/webauthn/webauthn"

	"github.com/migadu/alps"
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

// signInWithKey signs in from a new browser and answers the second factor
// with k, as a key that has signed counter times would.
func (s *testServer) signInWithKey(k *softKey, counter uint32) (*testServer, response) {
	s.t.Helper()
	b := s.anotherBrowser()
	r := b.signIn()
	b.expect(r, http.StatusOK)
	var signedIn map[string]any
	r.json(s.t, &signedIn)
	if signedIn["requires_2fa"] != true {
		s.t.Fatalf("signing in answered %v, want requires_2fa", signedIn)
	}
	r = b.do("POST", "/webauthn/verify/begin", nil)
	b.expect(r, http.StatusOK)
	var options struct {
		PublicKey struct {
			Challenge string `json:"challenge"`
		} `json:"publicKey"`
	}
	r.json(s.t, &options)

	clientData, err := json.Marshal(map[string]any{"type": "webauthn.get", "challenge": options.PublicKey.Challenge, "origin": s.url})
	if err != nil {
		s.t.Fatal(err)
	}
	rpIDHash := sha256.Sum256([]byte(testRPID))
	authData := append([]byte{}, rpIDHash[:]...)
	authData = append(authData, 0x05) // user present, user verified
	authData = binary.BigEndian.AppendUint32(authData, counter)
	clientDataHash := sha256.Sum256(clientData)
	digest := sha256.Sum256(append(append([]byte{}, authData...), clientDataHash[:]...))
	signature, err := ecdsa.SignASN1(rand.Reader, k.key, digest[:])
	if err != nil {
		s.t.Fatal(err)
	}
	b64 := base64.RawURLEncoding.EncodeToString
	return b, b.do("POST", "/webauthn/verify/finish", map[string]any{
		"id":    b64(k.id),
		"rawId": b64(k.id),
		"type":  "public-key",
		"response": map[string]string{
			"authenticatorData": b64(authData),
			"clientDataJSON":    b64(clientData),
			"signature":         b64(signature),
		},
	})
}

// storedAuthenticator is what the account's record keeps about its one key.
func (s *testServer) storedAuthenticator() webauthn.Authenticator {
	s.t.Helper()
	store, err := s.store.GetStore()
	if err != nil {
		s.t.Fatal(err)
	}
	var creds UserCredentials
	if err := store.Get("webauthn", &creds); err != nil {
		s.t.Fatal(err)
	}
	if len(creds.Credentials) != 1 {
		s.t.Fatalf("the account has %d keys, want one", len(creds.Credentials))
	}
	return creds.Credentials[0].Credential.Authenticator
}

// Signing in with a key records how many times it has signed, which is what
// tells a copy of the key from the key itself. The count stayed at what the
// key said when it was enrolled, so a copy could never be told apart.
func TestHTTP_SigningInWithAKeyRecordsItsSignatureCount(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.login()
	key := newSoftKey(t)
	s.enrolKey(key, "laptop")

	b, r := s.signInWithKey(key, 7)
	s.expect(r, http.StatusOK)
	b.mailbox("INBOX")
	if got := s.storedAuthenticator(); got.SignCount != 7 || got.CloneWarning {
		t.Fatalf("after signing in: count %d, clone warning %v; want 7 and none", got.SignCount, got.CloneWarning)
	}

	_, r = s.signInWithKey(key, 8)
	s.expect(r, http.StatusOK)
	if got := s.storedAuthenticator(); got.SignCount != 8 || got.CloneWarning {
		t.Fatalf("after signing in again: count %d, clone warning %v; want 8 and none", got.SignCount, got.CloneWarning)
	}
}

// newTestServerWithLog is newTestServer with what it logs going to a file,
// and a func that reads that file.
func newTestServerWithLog(t *testing.T) (*testServer, func() string) {
	t.Helper()
	logPath := filepath.Join(t.TempDir(), "alps.log")
	s := newTestServerWithLogger(t, "smtp://127.0.0.1:1", alps.NewLoggerWithOptions(alps.LoggerOptions{Output: logPath, Format: "console", Level: "info"}))
	return s, func() string {
		t.Helper()
		logged, err := os.ReadFile(logPath)
		if err != nil {
			t.Fatal(err)
		}
		return string(logged)
	}
}

// A key whose count does not go up may be a copy of the one enrolled. The
// record keeps that it was seen, and the log says so at each sign-in that
// shows it; the sign-in itself goes ahead, since a key's own counter can be
// at fault. Once the record was marked, no later count that went back was
// logged, so a copy that turned up after a faulty count went unseen.
func TestHTTP_AKeyWhoseCountGoesBackIsMarkedAsPossiblyCopied(t *testing.T) {
	s, logged := newTestServerWithLog(t)
	s.withWebAuthn()
	s.login()
	key := newSoftKey(t)
	s.enrolKey(key, "laptop")
	_, r := s.signInWithKey(key, 7)
	s.expect(r, http.StatusOK)

	b, r := s.signInWithKey(key, 3)
	s.expect(r, http.StatusOK)
	b.mailbox("INBOX")
	if got := s.storedAuthenticator(); got.SignCount != 7 || !got.CloneWarning {
		t.Fatalf("after a count that went back: count %d, clone warning %v; want 7 and a warning", got.SignCount, got.CloneWarning)
	}
	if n := strings.Count(logged(), "security key may have been copied"); n != 1 {
		t.Errorf("%d log lines say the key may have been copied, want 1:\n%s", n, logged())
	}

	// The count goes up again, and then back once more.
	_, r = s.signInWithKey(key, 8)
	s.expect(r, http.StatusOK)
	_, r = s.signInWithKey(key, 5)
	s.expect(r, http.StatusOK)
	if got := s.storedAuthenticator(); got.SignCount != 8 || !got.CloneWarning {
		t.Fatalf("after the count went up and back again: count %d, clone warning %v; want 8 and a warning", got.SignCount, got.CloneWarning)
	}
	if n := strings.Count(logged(), "security key may have been copied"); n != 2 {
		t.Errorf("%d log lines say the key may have been copied, want 2:\n%s", n, logged())
	}
}

// A record that cannot be saved does not refuse a key that verified: the
// sign-in goes ahead, and the failure is logged. A sign-in that changes
// nothing in the record, as with a key that always reports a count of 0,
// does not write it at all.
func TestHTTP_AKeyThatVerifiedSignsInWhenItsRecordCannotBeSaved(t *testing.T) {
	s, logged := newTestServerWithLog(t)
	s.withWebAuthn()
	s.login()
	key := newSoftKey(t)
	s.enrolKey(key, "laptop")
	// The store can still be read, but not written: a write goes through a
	// temporary file, and a directory is in its place.
	if err := os.Mkdir(filepath.Join(s.dir, "alps_store.json.tmp"), 0o700); err != nil {
		t.Fatal(err)
	}

	b, r := s.signInWithKey(key, 0)
	s.expect(r, http.StatusOK)
	b.mailbox("INBOX")
	if strings.Contains(logged(), "failed to save") {
		t.Errorf("a sign-in that changed nothing wrote the record:\n%s", logged())
	}

	b, r = s.signInWithKey(key, 7)
	s.expect(r, http.StatusOK)
	b.mailbox("INBOX")
	if !strings.Contains(logged(), "failed to save the key's signature count") {
		t.Errorf("the failed save is not logged:\n%s", logged())
	}
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
	s.expect(s.removeKey("tablet", map[string]string{"current_password": testPassword}), http.StatusNotFound)

	s.expect(s.removeKey("laptop", map[string]string{"current_password": testPassword}), http.StatusOK)
	s.expect(s.removeKey("laptop", map[string]string{"current_password": testPassword}), http.StatusNotFound)
}

// securityKeys is what the settings page is told the account has.
func (s *testServer) securityKeys() []string {
	s.t.Helper()
	r := s.do("GET", "/settings/2fa", nil)
	s.expect(r, http.StatusOK)
	var page WebAuthnSettingsData
	r.json(s.t, &page)
	names := []string{}
	for _, c := range page.Credentials {
		names = append(names, c.Name)
	}
	return names
}

// refusal is the stable code a refusal carries for the page to translate.
func refusal(t *testing.T, r response) string {
	t.Helper()
	var got struct {
		Error string `json:"error"`
	}
	r.json(t, &got)
	return got.Error
}

// Removing a security key takes the account's password: a session left signed
// in must not be enough to strip the second factor. The right password removes
// the key, and the account keeps the others.
func TestHTTP_RemovingASecurityKeyTakesThePassword(t *testing.T) {
	s := newTestServer(t)
	s.withSecurityKeys("laptop", "phone")

	r := s.removeKey("laptop", map[string]string{"current_password": testPassword})
	s.expect(r, http.StatusOK)
	if got := s.securityKeys(); !reflect.DeepEqual(got, []string{"phone"}) {
		t.Fatalf("the account has %v, want [phone]", got)
	}
	// It still signs in with the one that is left.
	s.expect(s.signIn(), http.StatusOK)
}

// A wrong password is refused with a code of its own and removes nothing. It
// is not a 401, which would read as the session having ended.
func TestHTTP_AWrongPasswordRemovesNoSecurityKey(t *testing.T) {
	s := newTestServer(t)
	s.withSecurityKeys("laptop")

	r := s.removeKey("laptop", map[string]string{"current_password": "not the password"})
	s.expect(r, http.StatusForbidden)
	if code := refusal(t, r); code != "wrong_password" {
		t.Errorf("refused with %q, want wrong_password", code)
	}
	// Nor is a prefix of the right one taken for it.
	r = s.removeKey("laptop", map[string]string{"current_password": testPassword[:4]})
	s.expect(r, http.StatusForbidden)

	if got := s.securityKeys(); !reflect.DeepEqual(got, []string{"laptop"}) {
		t.Fatalf("the account has %v, want [laptop]", got)
	}
	s.mailbox("INBOX") // still signed in
}

// No password, whether the field is empty or the request has no body at all
// (as from a page that never asked for one), is refused before anything else.
func TestHTTP_RemovingASecurityKeyWithoutAPasswordIsRefused(t *testing.T) {
	s := newTestServer(t)
	s.withSecurityKeys("laptop")

	for _, body := range []any{nil, map[string]string{}, map[string]string{"current_password": ""}} {
		r := s.removeKey("laptop", body)
		s.expect(r, http.StatusBadRequest)
		if code := refusal(t, r); code != "password_required" {
			t.Errorf("%v: refused with %q, want password_required", body, code)
		}
	}
	if got := s.securityKeys(); !reflect.DeepEqual(got, []string{"laptop"}) {
		t.Fatalf("the account has %v, want [laptop]", got)
	}
}

// Removing the last key turns the second factor off: the account signs in with
// its password alone afterwards.
func TestHTTP_RemovingTheLastSecurityKeyTurnsTheSecondFactorOff(t *testing.T) {
	s := newTestServer(t)
	s.withSecurityKeys("laptop")

	s.expect(s.removeKey("laptop", map[string]string{"current_password": testPassword}), http.StatusOK)
	if got := s.securityKeys(); len(got) != 0 {
		t.Fatalf("the account still has %v", got)
	}
	r := s.signIn()
	s.expect(r, http.StatusOK)
	var got map[string]any
	r.json(t, &got)
	if got["ok"] != true {
		t.Fatalf("signing in answered %v, want no second factor", got)
	}
}

// When the keys cannot be read, the right password is answered with a 503 and
// a code of its own: the page must not tell someone who typed it correctly
// that it was wrong, and the session survives. A wrong password is still
// wrong, since checking it needs nothing that is down.
func TestHTTP_AnOutageRemovingASecurityKeyIsNotAWrongPassword(t *testing.T) {
	s := newTestServer(t)
	s.withSecurityKeys("laptop")

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

	r := s.removeKey("laptop", map[string]string{"current_password": testPassword})
	s.expect(r, http.StatusServiceUnavailable)
	if code := refusal(t, r); code != "keys_unavailable" {
		t.Errorf("answered %q, want keys_unavailable", code)
	}
	// The keys are read before the password is looked at, to know whether the
	// session has given the second factor they ask for: while they cannot be
	// read, a wrong password is answered the same way, and checks nothing.
	r = s.removeKey("laptop", map[string]string{"current_password": "not the password"})
	s.expect(r, http.StatusServiceUnavailable)
	if code := refusal(t, r); code != "keys_unavailable" {
		t.Errorf("a wrong password answered %q, want keys_unavailable", code)
	}

	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, record, 0o600); err != nil {
		t.Fatal(err)
	}
	s.mailbox("INBOX") // still signed in
	s.expect(s.removeKey("laptop", map[string]string{"current_password": testPassword}), http.StatusOK)
}

// Every attempt counts against the account's login limits, so the password
// cannot be guessed here any faster than at the login form. Once they are
// spent even the right password waits, and nothing is removed.
func TestHTTP_PasswordGuessesForASecurityKeyAreRateLimited(t *testing.T) {
	s := newTestServer(t)
	s.withSecurityKeys("laptop")
	s.server.RateLimiter = alps.NewRateLimiter(alps.RateLimitConfig{UsernameFailsPerQuarter: 2}, s.server.Logger(), nil)

	for i := 0; i < 2; i++ {
		s.expect(s.removeKey("laptop", map[string]string{"current_password": "guess"}), http.StatusForbidden)
	}
	r := s.removeKey("laptop", map[string]string{"current_password": testPassword})
	s.expect(r, http.StatusTooManyRequests)
	if code := refusal(t, r); code != "rate_limited" {
		t.Errorf("answered %q, want rate_limited", code)
	}
	if r.header.Get("Retry-After") == "" {
		t.Error("no Retry-After")
	}
	if got := s.securityKeys(); !reflect.DeepEqual(got, []string{"laptop"}) {
		t.Fatalf("the account has %v, want [laptop]", got)
	}
	// The login form is held to the same count.
	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword}), http.StatusTooManyRequests)
}

// Neither a wrong password nor the right one reaches the log, at any level.
func TestHTTP_ThePasswordForASecurityKeyIsNotLogged(t *testing.T) {
	logPath := filepath.Join(t.TempDir(), "alps.log")
	s := newTestServerWithLogger(t, "smtp://127.0.0.1:1", alps.NewLoggerWithOptions(alps.LoggerOptions{Output: logPath, Format: "console", Level: "debug"}))
	s.withSecurityKeys("laptop")
	const guess = "a-guess-that-must-not-be-logged"

	s.expect(s.removeKey("laptop", map[string]string{"current_password": guess}), http.StatusForbidden)
	s.expect(s.removeKey("laptop", map[string]string{"current_password": testPassword}), http.StatusOK)

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
