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

	var mboxData struct {
		Messages []struct {
			UID string
		}
	}
	res.json(t, &mboxData)
	if len(mboxData.Messages) == 0 {
		t.Fatal("expected messages in INBOX")
	}
	uid := mboxData.Messages[0].UID

	// Fetch message once to populate message part cache
	s.expect(s.do("GET", "/mailboxes/INBOX/messages/"+uid, nil), http.StatusOK)

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

	// Corrupt messages cache entries
	msgKeys := sess.Cache().GetKeysWithPrefix("messages:")
	if len(msgKeys) == 0 {
		t.Fatal("expected at least one cached messages entry after initial listing")
	}
	for _, k := range msgKeys {
		sess.Cache().Set(k, "corrupted cache value")
	}

	// Corrupt single message cache entries
	partKeys := sess.Cache().GetKeysWithPrefix("message:")
	if len(partKeys) == 0 {
		t.Fatal("expected at least one cached message part entry")
	}
	for _, k := range partKeys {
		sess.Cache().Set(k, "corrupted message part value")
	}

	// Next fetches must not panic, and must return 200 OK by falling back to provider
	res2 := s.do("GET", "/mailboxes/INBOX?page=0", nil)
	s.expect(res2, http.StatusOK)

	res3 := s.do("GET", "/mailboxes/INBOX/messages/"+uid, nil)
	s.expect(res3, http.StatusOK)
}
