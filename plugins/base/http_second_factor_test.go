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
	"testing"

	"github.com/go-webauthn/webauthn/protocol/webauthncbor"
	"github.com/go-webauthn/webauthn/protocol/webauthncose"
	"github.com/go-webauthn/webauthn/webauthn"

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
