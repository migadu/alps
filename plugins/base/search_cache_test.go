package alpsbase

import (
	"net/http"
	"net/url"
	"testing"
)

// A search asks the server something its message counts do not answer.
//
// A body word is found through a full-text index the server builds after
// delivery, so a message is listed and counted well before its body can be
// found. The first search for it comes back empty, and that is the truth at
// that moment. It was cached, and nothing that clears a cached page — a write
// here, the counts moving — happens when an index catches up: every search
// after it was answered "nothing" from the session, for as long as the cache
// kept it. Here the server's answer changes the same way, behind alps's back
// and without the counts being asked.
func TestHTTP_ASearchIsAskedAgainEveryTime(t *testing.T) {
	s := newTestServer(t)
	s.login()

	search := func() int {
		t.Helper()
		r := s.do("GET", "/mailboxes/INBOX?page=0&query="+url.QueryEscape("kestrel"), nil)
		s.expect(r, http.StatusOK)
		var page mailboxPage
		r.json(t, &page)
		return len(page.Messages)
	}

	if got := search(); got != 0 {
		t.Fatalf("the search found %d messages before any held the word", got)
	}

	msg := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Birds\r\n" +
		"Date: Mon, 02 Jan 2006 15:04:05 +0000\r\nMessage-ID: <birds@remote.test>\r\n\r\nA kestrel over the field.\r\n"
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(msg), 0); err != nil {
		t.Fatal(err)
	}

	if got := search(); got != 1 {
		t.Errorf("the search found %d messages once one held the word; want it asked again, not answered from the first time", got)
	}
}
