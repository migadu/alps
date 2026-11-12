package alpsbase

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
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
