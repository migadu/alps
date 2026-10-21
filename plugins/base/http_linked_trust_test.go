package alpsbase

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/maildir"
)

// These tests are about trust in linked accounts that was turned on before
// turning it on took a key, the second factor and the password. Such trust is
// stored without the mark trust turned on now carries, and counts for nothing.

const (
	bobUser     = "bob@example.com"
	bobPassword = "battery staple"
)

// trustFromBefore is a record with a key and trust in linked accounts as it
// could be stored before: turned on, and not marked as turned on under any
// rules.
func trustFromBefore(key string) map[string]any {
	return map[string]any{"enabled": true, "credentials": []any{keyRecord(key)}, "trust_linked_accounts": true}
}

// addBob gives the mail server a second account, with an inbox, and returns
// its store.
func (s *testServer) addBob() provider.Store {
	s.t.Helper()
	base := filepath.Dir(s.dir)
	passwd, err := os.OpenFile(filepath.Join(base, "passwd"), os.O_APPEND|os.O_WRONLY, 0)
	if err != nil {
		s.t.Fatal(err)
	}
	defer passwd.Close()
	if _, err := passwd.WriteString(bobUser + ":{PLAIN}" + bobPassword + "\n"); err != nil {
		s.t.Fatal(err)
	}
	bob := maildir.NewProvider(filepath.Join(base, "bob"), bobUser)
	if err := bob.CreateMailbox("INBOX"); err != nil {
		s.t.Fatal(err)
	}
	store, err := bob.GetStore()
	if err != nil {
		s.t.Fatal(err)
	}
	return store
}

// signedInSession is the session this browser holds.
func (s *testServer) signedInSession() *alps.Session {
	s.t.Helper()
	session, err := s.server.Sessions.Get(s.sessionToken())
	if err != nil {
		s.t.Fatal(err)
	}
	return session
}

// switchToBob switches this browser's session to Bob's account, and returns
// whether that asks for Bob's second factor.
func (s *testServer) switchToBob() (asksForKey bool) {
	s.t.Helper()
	r := s.do("POST", "/accounts/switch", url.Values{"username": {bobUser}})
	s.expect(r, http.StatusOK)
	var got struct {
		OK          bool `json:"ok"`
		Requires2FA bool `json:"requires_2fa"`
	}
	r.json(s.t, &got)
	if got.OK == got.Requires2FA {
		s.t.Fatalf("the switch answered %s", r.body)
	}
	return got.Requires2FA
}

// A linked account that gave its own second factor switches to an account
// without giving that account's only when the account's trust was turned on
// under the rules that hold now. Trust from before is not honoured.
func TestHTTP_SwitchingHonoursOnlyTrustTurnedOnUnderTheRules(t *testing.T) {
	s := newTestServer(t)
	bob := s.addBob()
	s.login()
	s.expect(s.do("POST", "/accounts", url.Values{"username": {bobUser}, "password": {bobPassword}, "display_name": {"Bob"}}), http.StatusOK)

	if err := bob.Put("webauthn", trustFromBefore("bob's key")); err != nil {
		t.Fatal(err)
	}
	s.giveSecondFactor()
	if !s.switchToBob() {
		t.Fatal("trust from before the rules let the switch skip Bob's key")
	}

	if err := bob.Put("webauthn", webAuthnRecord(true, "bob's key")); err != nil {
		t.Fatal(err)
	}
	s.login()
	s.giveSecondFactor()
	if s.switchToBob() {
		t.Fatal("trust turned on under the rules was not honoured")
	}
	if session := s.signedInSession(); session.Username() != bobUser || !session.IsAuthenticated2FA() {
		t.Fatalf("switched to %s, second factor given: %v", session.Username(), session.IsAuthenticated2FA())
	}
	s.mailbox("INBOX")
}

// Trust from before the rules is shown as off, and the record's next save
// drops it. Turning it on again takes what it takes now, and then holds.
func TestHTTP_TrustFromBeforeTheRulesIsOff(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.login()
	s.putWebAuthn(trustFromBefore("laptop"))
	s.giveSecondFactor()

	if s.webAuthnSettings().TrustLinkedAccounts {
		t.Fatal("the settings show trust from before the rules")
	}
	if trust, err := s.signedInSession().TrustsLinkedAccounts(); err != nil || trust {
		t.Fatalf("the account trusts linked accounts: %v, %v", trust, err)
	}

	// Reading it changes nothing stored; the next save drops it.
	if record, _ := s.storedWebAuthn(); record["trust_linked_accounts"] != true {
		t.Fatalf("reading the record changed it: %v", record)
	}
	s.enrolKey(newSoftKey(t), "phone")
	record, _ := s.storedWebAuthn()
	if record["trust_linked_accounts"] != false {
		t.Errorf("after a save, stored trust_linked_accounts %v", record["trust_linked_accounts"])
	}
	if s.webAuthnSettings().CredentialCount != 2 {
		t.Fatal("the save lost a key")
	}

	// Turned on again, with the second factor and the password, it holds.
	s.expectRefusal(s.setTrust(true, ""), http.StatusBadRequest, "password_required")
	s.expect(s.setTrust(true, testPassword), http.StatusOK)
	if !s.webAuthnSettings().TrustLinkedAccounts {
		t.Fatal("trust turned on again does not show")
	}
	if trust, err := s.signedInSession().TrustsLinkedAccounts(); err != nil || !trust {
		t.Fatalf("the account trusts linked accounts: %v, %v", trust, err)
	}
}

// Turning trust on marks it as turned on under the rules that hold now, and
// turning it off takes the mark away with it.
func TestHTTP_TurningTrustOnMarksIt(t *testing.T) {
	s := newTestServer(t)
	s.signInBeforeKeys(false, "laptop")
	s.giveSecondFactor()

	s.expect(s.setTrust(true, testPassword), http.StatusOK)
	record, _ := s.storedWebAuthn()
	if record["trust_linked_accounts"] != true || record["trust_linked_accounts_version"] != float64(alps.TrustLinkedAccountsVersion) {
		t.Fatalf("stored %v", record)
	}

	s.expect(s.setTrust(false, ""), http.StatusOK)
	record, _ = s.storedWebAuthn()
	if _, marked := record["trust_linked_accounts_version"]; marked || record["trust_linked_accounts"] != false {
		t.Fatalf("stored %v", record)
	}
}
