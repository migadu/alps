package alpsbase

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/migadu/alps/provider/maildir"
)

func TestSwitchAccount2FACookieClearing(t *testing.T) {
	s := newTestServer(t)

	// Add target user "charles@example.com" to passwd
	baseDir := filepath.Dir(s.dir)
	passwdPath := filepath.Join(baseDir, "passwd")
	passwdData, err := os.ReadFile(passwdPath)
	if err != nil {
		t.Fatal(err)
	}
	const targetUser = "charles@example.com"
	const targetPassword = "charlessecret"
	passwdData = append(passwdData, []byte(targetUser+":{PLAIN}"+targetPassword+"\n")...)
	if err := os.WriteFile(passwdPath, passwdData, 0o600); err != nil {
		t.Fatal(err)
	}

	// Create mailbox and store for target user
	targetDir := filepath.Join(baseDir, "charles")
	targetStore := maildir.NewProvider(targetDir, targetUser)
	if err := targetStore.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}

	// Enable 2FA on target user via its store
	store, err := targetStore.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	webAuthnRecord := map[string]interface{}{
		"enabled":     true,
		"credentials": []interface{}{map[string]interface{}{"name": "yubikey"}},
	}
	if err := store.Put("webauthn", webAuthnRecord); err != nil {
		t.Fatal(err)
	}

	// Log in as testUser
	s.expect(s.do("POST", "/session", map[string]string{
		"username": testUser,
		"password": testPassword,
	}), http.StatusOK)

	// Link targetUser to testUser
	linkRes := s.do("POST", "/accounts", url.Values{
		"username": {targetUser},
		"password": {targetPassword},
	})
	s.expect(linkRes, http.StatusOK)

	// Switch to targetUser which requires 2FA
	switchRes := s.do("POST", "/accounts/switch", url.Values{
		"username": {targetUser},
	})
	s.expect(switchRes, http.StatusOK)

	// Assert response body indicates 2FA requirement
	var body map[string]interface{}
	switchRes.json(t, &body)
	if body["requires_2fa"] != true {
		t.Fatalf("expected requires_2fa=true, got %+v", body)
	}

	// Parse Set-Cookie headers on switch response
	setCookies := switchRes.header.Values("Set-Cookie")
	if len(setCookies) == 0 {
		t.Fatal("expected Set-Cookie headers on switch response")
	}

	var sessionCookie, loggedInCookie, pendingCookie *http.Cookie
	for _, raw := range setCookies {
		header := http.Header{"Set-Cookie": []string{raw}}
		req := http.Response{Header: header}
		for _, c := range req.Cookies() {
			switch c.Name {
			case "alps_session":
				sessionCookie = c
			case "alps_logged_in":
				loggedInCookie = c
			case "alps_2fa_pending":
				pendingCookie = c
			}
		}
	}

	if pendingCookie == nil {
		t.Fatal("missing alps_2fa_pending cookie")
	}

	if sessionCookie == nil {
		t.Fatal("missing alps_session clearing cookie")
	}
	if sessionCookie.MaxAge > 0 || sessionCookie.Value != "" {
		t.Errorf("expected alps_session to be cleared, got MaxAge=%d, Value=%q", sessionCookie.MaxAge, sessionCookie.Value)
	}
	// Verify SameSite=Strict is set on alps_session
	rawSession := findRawCookie(setCookies, "alps_session")
	if !strings.Contains(rawSession, "SameSite=Strict") {
		t.Errorf("expected alps_session to have SameSite=Strict, got: %s", rawSession)
	}

	if loggedInCookie == nil {
		t.Fatal("missing alps_logged_in clearing cookie")
	}
	if loggedInCookie.MaxAge > 0 || loggedInCookie.Value != "" {
		t.Errorf("expected alps_logged_in to be cleared, got MaxAge=%d, Value=%q", loggedInCookie.MaxAge, loggedInCookie.Value)
	}
	rawLoggedIn := findRawCookie(setCookies, "alps_logged_in")
	if !strings.Contains(rawLoggedIn, "SameSite=Strict") {
		t.Errorf("expected alps_logged_in to have SameSite=Strict, got: %s", rawLoggedIn)
	}
}

func findRawCookie(cookies []string, name string) string {
	for _, c := range cookies {
		if strings.HasPrefix(c, name+"=") {
			return c
		}
	}
	return ""
}
