package alpsbase

import (
	"net/http"
	"net/url"
	"testing"
)

func TestCacheTypeAssertionSafety(t *testing.T) {
	s := newTestServer(t)

	// Log in to create a session
	s.expect(s.do("POST", "/session", map[string]string{
		"username": testUser,
		"password": testPassword,
	}), http.StatusOK)

	// Initial fetch populates the cache
	res := s.do("GET", "/mailboxes/INBOX?page=0", nil)
	s.expect(res, http.StatusOK)

	// Extract session token from cookies
	u, err := url.Parse(s.url)
	if err != nil {
		t.Fatal(err)
	}
	cookies := s.client.Jar.Cookies(u)
	var sessionToken string
	for _, c := range cookies {
		if c.Name == "alps_session" {
			sessionToken = c.Value
			break
		}
	}
	if sessionToken == "" {
		t.Fatal("session cookie not found after login")
	}

	sess, err := s.server.Sessions.Get(sessionToken)
	if err != nil {
		t.Fatalf("failed to retrieve session: %v", err)
	}

	// Corrupt messages cache entries with unexpected type
	msgKeys := sess.Cache().GetKeysWithPrefix("messages:")
	if len(msgKeys) == 0 {
		t.Fatal("expected at least one cached messages entry after initial listing")
	}
	for _, k := range msgKeys {
		sess.Cache().Set(k, "corrupted cache value")
	}

	// Next fetch must not panic, and must return 200 OK by falling back to provider
	res2 := s.do("GET", "/mailboxes/INBOX?page=0", nil)
	s.expect(res2, http.StatusOK)
}
