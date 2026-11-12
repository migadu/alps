package alps

import (
	"net/http/httptest"
	"testing"
)

func TestLoginTokenHintWithoutLoginKey(t *testing.T) {
	for _, persistent := range []bool{false, true} {
		w := httptest.NewRecorder()
		ctx := NewContext(w, httptest.NewRequest("POST", "/session", nil), &Server{Options: &Options{}})
		ctx.SetLoginToken("alice", "password", false, persistent)
		cookies := w.Result().Cookies()
		seen := map[string]bool{}
		for _, cookie := range cookies {
			seen[cookie.Name] = true
			if cookie.Value != "" || cookie.MaxAge != -1 {
				t.Errorf("without a login key, %s must be cleared; got %s", cookie.Name, cookie)
			}
		}
		for _, name := range []string{loginTokenCookieName, "alps_has_login_token"} {
			if !seen[name] {
				t.Errorf("stale %s was not cleared", name)
			}
		}
	}
}
