package alpsbase

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"github.com/migadu/alps"
)

// These tests are about recovery codes: the way back to an account whose
// security key is not at hand. Without them the webmail could not be signed
// in to at all, and only the operator could help, by removing the account's
// WebAuthn record.

// enrolKeyForCodes adds k to the account under name, the whole way through,
// and returns the recovery codes the answer shows.
func (s *testServer) enrolKeyForCodes(k *softKey, name string) []string {
	s.t.Helper()
	r, challenge := s.beginEnrolment()
	s.expect(r, http.StatusOK)
	r = s.finishEnrolment(k, challenge, name)
	s.expect(r, http.StatusOK)
	var answer struct {
		RecoveryCodes []string `json:"recovery_codes"`
	}
	r.json(s.t, &answer)
	return answer.RecoveryCodes
}

// firstKeyCodes adds k as the account's first key, and returns the ten codes
// that come with it.
func (s *testServer) firstKeyCodes(k *softKey, name string) []string {
	s.t.Helper()
	codes := s.enrolKeyForCodes(k, name)
	if len(codes) != 10 {
		s.t.Fatalf("the first key came with %d recovery codes, want 10", len(codes))
	}
	return codes
}

// atTheKey is a new browser signed in with the password as far as the key.
func (s *testServer) atTheKey() *testServer {
	s.t.Helper()
	b := s.anotherBrowser()
	r := b.signIn()
	b.expect(r, http.StatusOK)
	var got map[string]any
	r.json(s.t, &got)
	if got["requires_2fa"] != true {
		s.t.Fatalf("signing in answered %v, want requires_2fa", got)
	}
	return b
}

// giveRecoveryCode answers the second factor this browser's sign-in waits for
// with a recovery code.
func (s *testServer) giveRecoveryCode(code string) response {
	s.t.Helper()
	return s.do("POST", "/webauthn/verify/recovery", map[string]string{"code": code})
}

// recoveryCodesLeft is how many codes the settings page says are left.
func (s *testServer) recoveryCodesLeft() int {
	s.t.Helper()
	r := s.do("GET", "/settings/2fa", nil)
	s.expect(r, http.StatusOK)
	var page struct {
		Left *int `json:"recoveryCodesLeft"`
	}
	r.json(s.t, &page)
	if page.Left == nil {
		s.t.Fatalf("the settings page does not say how many recovery codes are left: %s", r.body)
	}
	return *page.Left
}

// newRecoveryCodes asks for new codes, giving password.
func (s *testServer) newRecoveryCodes(password string) response {
	s.t.Helper()
	return s.do("POST", "/settings/2fa/recovery-codes", map[string]string{"current_password": password})
}

func expectError(t *testing.T, r response, status int, code string) {
	t.Helper()
	if r.status != status {
		t.Fatalf("status %d, want %d: %s", r.status, status, r.body)
	}
	var body struct{ Error string }
	r.json(t, &body)
	if body.Error != code {
		t.Fatalf("error %q, want %q: %s", body.Error, code, r.body)
	}
}

// Ten letters and digits, read in two groups, from an alphabet without the
// letters that pass for digits.
var recoveryCodeShape = regexp.MustCompile(`^[0-9a-hjkmnp-tv-z]{5}-[0-9a-hjkmnp-tv-z]{5}$`)

// The first key comes with ten codes, shown once, in the answer that adds it.
// The record keeps none of them as they were shown. A second key comes with
// none: the codes are replaced only when asked.
func TestHTTP_TheFirstKeyComesWithRecoveryCodes(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.login()

	codes := s.enrolKeyForCodes(newSoftKey(t), "laptop")
	if len(codes) != 10 {
		t.Fatalf("%d recovery codes, want 10: %v", len(codes), codes)
	}
	seen := map[string]bool{}
	for _, code := range codes {
		if !recoveryCodeShape.MatchString(code) {
			t.Errorf("code %q is not two groups of five letters and digits", code)
		}
		if seen[code] {
			t.Errorf("code %q is given twice", code)
		}
		seen[code] = true
	}
	if left := s.recoveryCodesLeft(); left != 10 {
		t.Errorf("%d codes left, want 10", left)
	}

	record, _ := s.storedWebAuthn()
	stored, _ := json.Marshal(record)
	for _, code := range codes {
		if strings.Contains(string(stored), code) || strings.Contains(string(stored), strings.ReplaceAll(code, "-", "")) {
			t.Errorf("the record keeps code %q as it was shown: %s", code, stored)
		}
	}

	if more := s.enrolKeyForCodes(newSoftKey(t), "phone"); len(more) != 0 {
		t.Errorf("a second key came with codes: %v", more)
	}
	if left := s.recoveryCodesLeft(); left != 10 {
		t.Errorf("%d codes left after a second key, want 10", left)
	}
}

// A recovery code signs in in the key's place, and the session it opens has
// given the second factor: it can add a new key and remove the one that is
// not at hand, which is the way back.
func TestHTTP_ARecoveryCodeSignsInInPlaceOfTheKey(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.login()
	lost := newSoftKey(t)
	codes := s.firstKeyCodes(lost, "laptop")

	b := s.atTheKey()
	if r := b.do("GET", "/mailboxes/INBOX", nil); r.status == http.StatusOK {
		t.Fatal("the mail was open before the second factor was given")
	}
	r := b.giveRecoveryCode(codes[3])
	b.expect(r, http.StatusOK)
	var answer struct {
		Success  bool
		Username string
		Left     int `json:"recovery_codes_left"`
	}
	r.json(t, &answer)
	if !answer.Success || answer.Username != testUser || answer.Left != 9 {
		t.Fatalf("answered %s, want success for %s with 9 codes left", r.body, testUser)
	}
	b.mailbox("INBOX")

	b.enrolKey(newSoftKey(t), "new laptop")
	b.expect(b.do("POST", "/settings/2fa/credential/"+base64.URLEncoding.EncodeToString(lost.id)+"/delete", map[string]string{"current_password": testPassword}), http.StatusOK)
	if keys := b.webAuthnSettings().CredentialCount; keys != 1 {
		t.Errorf("%d keys, want the new one alone", keys)
	}
	if left := b.recoveryCodesLeft(); left != 9 {
		t.Errorf("%d codes left, want 9", left)
	}
}

// Each code works once. A used one is refused like a wrong one, and the
// sign-in still waits for the key, or another code.
func TestHTTP_ARecoveryCodeWorksOnce(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.login()
	codes := s.firstKeyCodes(newSoftKey(t), "laptop")

	b := s.atTheKey()
	b.expect(b.giveRecoveryCode(codes[0]), http.StatusOK)

	c := s.atTheKey()
	expectError(t, c.giveRecoveryCode(codes[0]), http.StatusBadRequest, "wrong_code")
	if r := c.do("GET", "/mailboxes/INBOX", nil); r.status == http.StatusOK {
		t.Fatal("a used code opened the mail")
	}
	c.expect(c.giveRecoveryCode(codes[1]), http.StatusOK)
	c.mailbox("INBOX")
	if left := c.recoveryCodesLeft(); left != 8 {
		t.Errorf("%d codes left, want 8", left)
	}
}

// A code is read as it was written down: in capitals, with spaces for the
// dash or none at all, and with an O or an I or L where a 0 or a 1 was meant.
func TestHTTP_ARecoveryCodeIsReadAsWrittenDown(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.login()
	codes := s.firstKeyCodes(newSoftKey(t), "laptop")

	misread := strings.NewReplacer("0", "O", "1", "l")
	for i, written := range []string{
		strings.ToUpper(codes[0]),
		" " + strings.ReplaceAll(codes[1], "-", " ") + " ",
		strings.ReplaceAll(codes[2], "-", ""),
		misread.Replace(codes[3]),
	} {
		b := s.atTheKey()
		if r := b.giveRecoveryCode(written); r.status != http.StatusOK {
			t.Errorf("code %q written as %q: status %d: %s", codes[i], written, r.status, r.body)
		}
	}
}

// A wrong code counts against the login limits for the account and the
// address it comes from, as a wrong password does. Once they are spent, the
// right code waits too, and so does the login form.
func TestHTTP_WrongRecoveryCodesCountAgainstTheLoginLimits(t *testing.T) {
	s, config := newLimitedServer(t, nil)
	s.withWebAuthn()
	s.login()
	codes := s.firstKeyCodes(newSoftKey(t), "laptop")

	b := s.atTheKey()
	for i := 0; i < config.UsernameFailsPerQuarter; i++ {
		expectError(t, b.giveRecoveryCode("zzzzz-zzzzz"), http.StatusBadRequest, "wrong_code")
	}
	r := b.giveRecoveryCode(codes[0])
	expectError(t, r, http.StatusTooManyRequests, "rate_limited")
	if r.header.Get("Retry-After") == "" {
		t.Error("no Retry-After")
	}
	if rr := b.do("GET", "/mailboxes/INBOX", nil); rr.status == http.StatusOK {
		t.Fatal("a code opened the mail past the limit")
	}
	s.expect(s.anotherBrowser().signIn(), http.StatusTooManyRequests)
}

// A code is taken only by a sign-in that waits for the key, and one that is
// refused for that reason is not spent.
func TestHTTP_ARecoveryCodeNeedsASignInWaitingForTheKey(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.login()
	codes := s.firstKeyCodes(newSoftKey(t), "laptop")

	s.expect(s.anotherBrowser().giveRecoveryCode(codes[0]), http.StatusUnauthorized)
	s.expect(s.giveRecoveryCode(codes[0]), http.StatusUnauthorized)
	if left := s.recoveryCodesLeft(); left != 10 {
		t.Errorf("%d codes left, want 10", left)
	}
	expectError(t, s.atTheKey().giveRecoveryCode(""), http.StatusBadRequest, "code_required")
}

// New codes take the password, and replace the old ones, which stop working.
func TestHTTP_NewRecoveryCodesReplaceTheOldOnes(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.login()
	old := s.firstKeyCodes(newSoftKey(t), "laptop")
	b := s.atTheKey()
	b.expect(b.giveRecoveryCode(old[0]), http.StatusOK)

	expectError(t, b.newRecoveryCodes("wrong"), http.StatusForbidden, "wrong_password")
	expectError(t, b.newRecoveryCodes(""), http.StatusBadRequest, "password_required")
	r := b.newRecoveryCodes(testPassword)
	b.expect(r, http.StatusOK)
	var answer struct {
		RecoveryCodes []string `json:"recovery_codes"`
	}
	r.json(t, &answer)
	if len(answer.RecoveryCodes) != 10 {
		t.Fatalf("%d new codes, want 10: %s", len(answer.RecoveryCodes), r.body)
	}
	for _, code := range answer.RecoveryCodes {
		for _, was := range old {
			if code == was {
				t.Errorf("new code %q is an old one", code)
			}
		}
	}
	if left := b.recoveryCodesLeft(); left != 10 {
		t.Errorf("%d codes left, want 10", left)
	}

	expectError(t, s.atTheKey().giveRecoveryCode(old[1]), http.StatusBadRequest, "wrong_code")
	s.atTheKey().expect(s.atTheKey().giveRecoveryCode(answer.RecoveryCodes[1]), http.StatusOK)
}

// New codes are a change to the account's second factor, and take what
// removing a key takes: a key, and a session that has given it.
func TestHTTP_NewRecoveryCodesTakeTheSecondFactor(t *testing.T) {
	s := newTestServer(t)
	s.login()
	expectError(t, s.newRecoveryCodes(testPassword), http.StatusConflict, "no_security_key")

	s.signInBeforeKeys(false, "laptop")
	expectError(t, s.newRecoveryCodes(testPassword), http.StatusForbidden, "two_factor_required")
}

// Removing the last key turns the second factor off, and takes the codes
// with it: a first key added later comes with new ones, and the old ones do
// not work.
func TestHTTP_RemovingTheLastKeyTakesTheCodesWithIt(t *testing.T) {
	s := newTestServer(t)
	s.withWebAuthn()
	s.login()
	key := newSoftKey(t)
	old := s.firstKeyCodes(key, "laptop")
	s.expect(s.do("POST", "/settings/2fa/credential/"+base64.URLEncoding.EncodeToString(key.id)+"/delete", map[string]string{"current_password": testPassword}), http.StatusOK)
	if _, kept := s.storedWebAuthn(); kept {
		t.Fatal("the record outlived the last key")
	}

	fresh := s.enrolKeyForCodes(newSoftKey(t), "phone")
	if len(fresh) != 10 {
		t.Fatalf("%d codes with the new first key, want 10", len(fresh))
	}
	expectError(t, s.atTheKey().giveRecoveryCode(old[0]), http.StatusBadRequest, "wrong_code")
}

// A sign-in with a recovery code is logged as one, with the codes left, and a
// refused code as a refused sign-in. New codes are logged as a key is.
func TestHTTP_RecoveryCodesAreLogged(t *testing.T) {
	logPath := filepath.Join(t.TempDir(), "alps.log")
	s := newTestServerWithLogger(t, "smtp://127.0.0.1:1", alps.NewLoggerWithOptions(alps.LoggerOptions{Output: logPath, Format: "json", Level: "info"}))
	s.withWebAuthn()
	s.login()
	codes := s.firstKeyCodes(newSoftKey(t), "laptop")

	b := s.atTheKey()
	expectError(t, b.giveRecoveryCode("zzzzz-zzzzz"), http.StatusBadRequest, "wrong_code")
	b.expect(b.giveRecoveryCode(codes[0]), http.StatusOK)
	b.expect(b.newRecoveryCodes(testPassword), http.StatusOK)

	var refused []map[string]any
	for _, line := range logLines(t, logPath, "sign-in failed") {
		if line["reason"] == "recovery code refused" {
			refused = append(refused, line)
		}
	}
	if len(refused) != 1 || refused[0]["user"] != testUser || refused[0]["ip"] != "127.0.0.1" {
		t.Errorf("refused codes logged as %v, want one line", refused)
	}

	var byCode []map[string]any
	for _, line := range logLines(t, logPath, "sign-in") {
		if line["factor"] == "recovery code" {
			byCode = append(byCode, line)
		}
	}
	if len(byCode) != 1 || byCode[0]["user"] != testUser || byCode[0]["2fa"] != true || byCode[0]["recovery_codes_left"] != float64(9) {
		t.Errorf("sign-ins with a code logged as %v, want one line with 9 codes left", byCode)
	}

	created := logLines(t, logPath, "recovery codes created")
	if len(created) != 2 || created[1]["user"] != testUser || created[1]["ip"] != "127.0.0.1" || created[1]["session"] == "" {
		t.Errorf("recovery codes created = %v, want the first key's and the new ones", created)
	}
	for _, line := range created {
		for _, code := range codes {
			raw, _ := json.Marshal(line)
			if strings.Contains(string(raw), code) {
				t.Errorf("a code reached the log: %v", line)
			}
		}
	}
}
