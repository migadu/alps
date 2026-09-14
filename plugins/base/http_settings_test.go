package alpsbase

import (
	"net/http"
	"testing"
)

// The sender avatar choice is kept with the account, so it follows the user to
// another browser. The handler copies each UI field by name, and one it does not
// name is dropped without an error.
func TestHTTP_SettingsKeepTheSenderAvatarChoice(t *testing.T) {
	s := newTestServer(t)
	s.login()

	saved := func() *bool {
		t.Helper()
		var got struct {
			Settings struct {
				UI struct {
					ShowSenderAvatars *bool `json:"showSenderAvatars"`
				} `json:"ui"`
			}
		}
		r := s.do("GET", "/settings", nil)
		s.expect(r, http.StatusOK)
		r.json(t, &got)
		return got.Settings.UI.ShowSenderAvatars
	}
	save := func(ui map[string]any) {
		t.Helper()
		if r := s.do("PUT", "/settings", map[string]any{"ui": ui}); r.status >= 300 {
			t.Fatalf("saving settings: status %d: %s", r.status, r.body)
		}
	}

	if v := saved(); v != nil {
		t.Fatalf("a new account already has a sender avatar choice: %v", *v)
	}

	save(map[string]any{"showSenderAvatars": false})
	if v := saved(); v == nil || *v {
		t.Fatal("turning sender avatars off was not kept")
	}

	save(map[string]any{"themeMode": "dark"})
	if v := saved(); v == nil || *v {
		t.Fatal("a save that did not name sender avatars turned them back on")
	}
}
