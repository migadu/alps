package alpsbase

import (
	"github.com/migadu/alps"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
)

func TestHTTP_SwitchRefusalsKeepTheCurrentAccount(t *testing.T) {
	for _, tc := range []struct {
		name   string
		setup  func(*testServer)
		target string
		status int
		code   string
	}{
		{"unlinked", func(s *testServer) {}, bobUser, http.StatusNotFound, "account_not_found"},
		{"password changed", func(s *testServer) {
			s.addBob()
			s.expect(s.do("POST", "/accounts", url.Values{"username": {bobUser}, "password": {bobPassword}}), http.StatusOK)
			p := filepath.Join(filepath.Dir(s.dir), "passwd")
			if err := os.WriteFile(p, []byte(testUser+":{PLAIN}"+testPassword+"\n"+bobUser+":{PLAIN}changed\n"), 0600); err != nil {
				t.Fatal(err)
			}
		}, bobUser, http.StatusConflict, "relink_required"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			s := newTestServer(t)
			s.login()
			tc.setup(s)
			r := s.do("POST", "/accounts/switch", url.Values{"username": {tc.target}})
			s.expect(r, tc.status)
			if got := refusal(t, r); got != tc.code {
				t.Fatalf("code=%q want %q", got, tc.code)
			}
			s.mailbox("INBOX")
			if got := s.signedInSession().Username(); got != testUser {
				t.Errorf("current account changed to %s", got)
			}
		})
	}
}

func TestHTTP_SwitchWithUnreadablePasswordRequiresRelinking(t *testing.T) {
	s := newTestServer(t)
	s.addBob()
	s.login()
	s.expect(s.do("POST", "/accounts", url.Values{"username": {bobUser}, "password": {bobPassword}}), http.StatusOK)
	store, err := s.store.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	var data map[string]interface{}
	if err := store.Get("linked_accounts", &data); err != nil {
		t.Fatal(err)
	}
	data["accounts"].([]interface{})[0].(map[string]interface{})["password_enc"] = "invalid"
	if err := store.Put("linked_accounts", data); err != nil {
		t.Fatal(err)
	}
	r := s.do("POST", "/accounts/switch", url.Values{"username": {bobUser}})
	s.expect(r, http.StatusConflict)
	if refusal(t, r) != "relink_required" {
		t.Fatal(string(r.body))
	}
	s.mailbox("INBOX")
}

func TestHTTP_SwitchDuringOutageKeepsCurrentSession(t *testing.T) {
	down := &atomic.Bool{}
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) { o.Provider = outageOptions{o.Provider, down} })
	s.addBob()
	s.login()
	s.expect(s.do("POST", "/accounts", url.Values{"username": {bobUser}, "password": {bobPassword}}), http.StatusOK)
	down.Store(true)
	r := s.do("POST", "/accounts/switch", url.Values{"username": {bobUser}})
	s.expect(r, http.StatusServiceUnavailable)
	if refusal(t, r) != "service_unavailable" {
		t.Fatal(string(r.body))
	}
	down.Store(false)
	s.mailbox("INBOX")
}
