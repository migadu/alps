package alpsbase

import (
	"fmt"
	"net/http"
	"net/url"
	"testing"
)

// These tests are about the "Keep me signed in" box at sign-in. It decides
// whether the cookies that hold a session outlive the browser: ticked, they
// carry an expiry; unticked, they are session cookies, gone when the browser
// closes. Every answer that issues those cookies again issues them the way the
// box was set, whichever way the session was opened.

// The cookies that hold a session, and the login token that restores one.
var (
	sessionCookies = []string{"alps_session", "alps_logged_in"}
	allCookies     = []string{"alps_session", "alps_logged_in", "alps_login_token", "alps_has_login_token"}
)

// signInKeeping signs in as the page does, with the box ticked or not.
func (s *testServer) signInKeeping(kept bool) response {
	s.t.Helper()
	box := ""
	if kept {
		box = "on"
	}
	return s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword, "remember-me": box})
}

// expectKept checks that r issued each named cookie with a value, and that
// each outlives the browser when the session is kept and goes with it when
// not. When r issued a cookie twice, the last one counts, as in a browser.
func (s *testServer) expectKept(r response, kept bool, names ...string) {
	s.t.Helper()
	issued := map[string]*http.Cookie{}
	for _, c := range (&http.Response{Header: r.header}).Cookies() {
		issued[c.Name] = c
	}
	for _, name := range names {
		c, ok := issued[name]
		switch {
		case !ok:
			s.t.Errorf("%s was not issued", name)
		case c.Value == "":
			s.t.Errorf("%s was cleared: %s", name, c.Raw)
		case (c.MaxAge > 0 || !c.Expires.IsZero()) != kept:
			s.t.Errorf("%s outlives the browser: %v, want %v: %s", name, !kept, kept, c.Raw)
		}
	}
}

// forEachChoice runs test with the box ticked, and again with it unticked.
func forEachChoice(t *testing.T, test func(t *testing.T, kept bool)) {
	for _, kept := range []bool{true, false} {
		t.Run(fmt.Sprintf("kept=%v", kept), func(t *testing.T) { test(t, kept) })
	}
}

func TestHTTP_KeepMeSignedInDecidesWhetherTheCookiesOutliveTheBrowser(t *testing.T) {
	forEachChoice(t, func(t *testing.T, kept bool) {
		s := newTestServer(t)
		r := s.signInKeeping(kept)
		s.expect(r, http.StatusOK)
		s.expectKept(r, kept, allCookies...)
	})
}

// A session restored from the login token is issued as the box said, both by
// a request that finds its session gone and by a sign-in from the token.
func TestHTTP_ARestoredSessionKeepsTheChoice(t *testing.T) {
	forEachChoice(t, func(t *testing.T, kept bool) {
		s := newTestServer(t)
		s.expect(s.signInKeeping(kept), http.StatusOK)

		s.forgetSession()
		r := s.do("GET", "/mailboxes/INBOX", nil)
		s.expect(r, http.StatusOK)
		s.expectKept(r, kept, sessionCookies...)

		s.forgetSession()
		r = s.do("POST", "/session", map[string]string{})
		s.expect(r, http.StatusOK)
		s.expectKept(r, kept, allCookies...)
	})
}

// signInToAKey gives the account a key, and has a new browser sign in to it
// as far as the key, with the box ticked or not.
func (s *testServer) signInToAKey(k *softKey, kept bool) *testServer {
	s.t.Helper()
	b := s.anotherBrowser()
	r := b.signInKeeping(kept)
	b.expect(r, http.StatusOK)
	var got map[string]any
	r.json(s.t, &got)
	if got["requires_2fa"] != true {
		s.t.Fatalf("signing in answered %v, want requires_2fa", got)
	}
	return b
}

// The box is ticked or not at the password; the session is issued once the
// key is given, as the box said.
func TestHTTP_TheSecondFactorKeepsTheChoiceMadeAtThePassword(t *testing.T) {
	forEachChoice(t, func(t *testing.T, kept bool) {
		s := newTestServer(t)
		s.withWebAuthn()
		s.login()
		key := newSoftKey(t)
		s.enrolKey(key, "laptop")

		b := s.signInToAKey(key, kept)
		r := b.giveKey(key, 1)
		b.expect(r, http.StatusOK)
		b.expectKept(r, kept, allCookies...)
	})
}

// A sign-in that stops at the key and is begun again follows the box as it is
// set the second time, not the first.
func TestHTTP_TheSecondFactorFollowsTheLastSignInsChoice(t *testing.T) {
	for _, kept := range []bool{true, false} {
		t.Run(fmt.Sprintf("kept=%v", kept), func(t *testing.T) {
			s := newTestServer(t)
			s.withWebAuthn()
			s.login()
			key := newSoftKey(t)
			s.enrolKey(key, "laptop")

			b := s.signInToAKey(key, !kept)
			r := b.signInKeeping(kept)
			b.expect(r, http.StatusOK)
			r = b.giveKey(key, 1)
			b.expect(r, http.StatusOK)
			b.expectKept(r, kept, allCookies...)
		})
	}
}

// linkBob signs in with the box ticked or not, and links Bob's account.
func (s *testServer) linkBob(kept bool) {
	s.t.Helper()
	s.expect(s.signInKeeping(kept), http.StatusOK)
	s.expect(s.do("POST", "/accounts", url.Values{"username": {bobUser}, "password": {bobPassword}, "display_name": {"Bob"}}), http.StatusOK)
}

// Switching to a linked account issues its session as the box said at
// sign-in.
func TestHTTP_SwitchingAccountsKeepsTheChoice(t *testing.T) {
	forEachChoice(t, func(t *testing.T, kept bool) {
		s := newTestServer(t)
		s.addBob()
		s.linkBob(kept)

		r := s.do("POST", "/accounts/switch", url.Values{"username": {bobUser}})
		s.expect(r, http.StatusOK)
		s.expectKept(r, kept, allCookies...)
		if got := s.signedInSession().Username(); got != bobUser {
			t.Fatalf("switched to %s", got)
		}
	})
}

// Switching to a linked account that asks for its own key issues its session,
// once the key is given, as the box said at sign-in.
func TestHTTP_SwitchingToAnAccountWithAKeyKeepsTheChoice(t *testing.T) {
	forEachChoice(t, func(t *testing.T, kept bool) {
		s := newTestServer(t)
		s.withWebAuthn()
		s.addBob()
		bob := s.anotherBrowser()
		bob.expect(bob.do("POST", "/session", map[string]string{"username": bobUser, "password": bobPassword}), http.StatusOK)
		key := newSoftKey(t)
		bob.enrolKey(key, "bob's key")

		s.linkBob(kept)
		if !s.switchToBob() {
			t.Fatal("the switch did not ask for Bob's key")
		}
		r := s.giveKey(key, 1)
		s.expect(r, http.StatusOK)
		s.expectKept(r, kept, allCookies...)
		if got := s.signedInSession().Username(); got != bobUser {
			t.Fatalf("switched to %s", got)
		}
	})
}
