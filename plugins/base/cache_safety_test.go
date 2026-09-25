package alpsbase

import (
	"net/http"
	"net/url"
	"testing"
)

func TestCacheTypeAssertionSafety(t *testing.T) {
	s := newTestServer(t)

	multipart := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Gears\r\nDate: Tue, 03 Jan 2006 15:04:05 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=b\r\n\r\n--b\r\nContent-Type: text/plain\r\n\r\nbody of Gears\r\n--b--\r\n"
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(multipart), 0); err != nil {
		t.Fatal(err)
	}

	// Log in to create a session
	s.expect(s.do("POST", "/session", map[string]string{
		"username": testUser,
		"password": testPassword,
	}), http.StatusOK)

	// Initial mailbox fetch populates the messages cache
	page := s.mailbox("INBOX")
	if len(page.Messages) == 0 {
		t.Fatal("expected at least one message in INBOX")
	}

	// Fetch message to populate message:* part cache
	targetUID := page.Messages[0].UID
	resMsg := s.do("GET", "/mailboxes/INBOX/messages/"+targetUID, nil)
	s.expect(resMsg, http.StatusOK)

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

	// Corrupt message part cache entries with unexpected type
	partKeys := sess.Cache().GetKeysWithPrefix("message:")
	if len(partKeys) == 0 {
		t.Fatal("expected at least one cached message part entry after message fetch")
	}
	for _, k := range partKeys {
		sess.Cache().Set(k, "corrupted cache value")
	}

	// Next fetches must not panic, and must return 200 OK by falling back to provider
	res2 := s.do("GET", "/mailboxes/INBOX?page=0", nil)
	s.expect(res2, http.StatusOK)

	res3 := s.do("GET", "/mailboxes/INBOX/messages/"+targetUID, nil)
	s.expect(res3, http.StatusOK)
}
