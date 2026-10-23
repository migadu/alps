package alpsbase

import (
	"net/http"
	"testing"
)

// A move that fails is reported as failed, and the message is where it was.
// Over maildir every failure was ignored: the move to a folder that does not
// exist answered 200, and the message the page took out of the list was still
// in INBOX.
func TestHTTP_AMoveThatFailsIsReported(t *testing.T) {
	s := newTestServer(t)
	s.login()
	msgs := s.mailbox("INBOX").Messages

	r := s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{"uids": []string{msgs[0].UID}, "to": "Nowhere"})
	if r.status == http.StatusOK {
		t.Errorf("the move answered %d: %s", r.status, r.body)
	}
	if got := s.mailbox("INBOX").Total; got != 2 {
		t.Errorf("INBOX holds %d messages after the failed move, want 2", got)
	}
}

// A move that fails for one message has still moved the others: the folders
// are read again, and show where each message is. They were read again only
// after a move that succeeded, and INBOX went on listing what had left it.
func TestHTTP_AMoveThatFailsInPartLeavesTheFoldersTrue(t *testing.T) {
	s := newTestServer(t)
	s.login()
	msgs := s.mailbox("INBOX").Messages
	s.mailbox("Archive")

	r := s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{"uids": []string{msgs[0].UID, "1700000000.never-delivered"}, "to": "Archive"})
	if r.status == http.StatusOK {
		t.Errorf("the move answered %d: %s", r.status, r.body)
	}
	if got := s.mailbox("INBOX").Total; got != 1 {
		t.Errorf("INBOX lists %d messages, want 1", got)
	}
	if got := s.mailbox("Archive").Total; got != 1 {
		t.Errorf("Archive lists %d messages, want 1", got)
	}
}
