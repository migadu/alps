package alpsbase

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// The check for new messages, as the list makes it: the folder's counts, and
// then the first page.
func (s *testServer) checkForNewMail(name string) mailboxPage {
	s.t.Helper()
	s.expect(s.do("GET", "/mailboxes/"+name+"/status", nil), http.StatusOK)
	r := s.do("GET", "/mailboxes/"+name+"?page=0", nil)
	s.expect(r, http.StatusOK)
	var page mailboxPage
	r.json(s.t, &page)
	return page
}

// Reading a message the page lists does not cost the page. The unread count
// is lowered with the read, so the check for new mail that follows finds the
// counts it holds and answers from the session. Dropped instead, the count was
// read again as a change, and every message opened had the next check read
// the whole folder from the server.
func TestHTTP_ReadingAListedMessageKeepsThePage(t *testing.T) {
	s := newTestServer(t)
	s.login()

	before := s.checkForNewMail("INBOX")
	if len(before.Messages) != 2 {
		t.Fatalf("listed %d rows", len(before.Messages))
	}
	read, other := before.Messages[0], before.Messages[1]

	// Marked read, as the reader does when a message is opened.
	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{
		"uids": []string{read.UID}, "flags": []string{`\Seen`}, "action": "add",
	}), http.StatusOK)

	// A change that no count shows, made behind alps's back: a page read from
	// the server carries it, and the one the session holds does not.
	files, err := filepath.Glob(filepath.Join(s.dir, "cur", "*"))
	if err != nil {
		t.Fatal(err)
	}
	subject := "Subject: " + other.Envelope.Subject + "\r\n"
	rewritten := false
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		if !strings.Contains(string(data), subject) {
			continue
		}
		data = []byte(strings.Replace(string(data), subject, "Subject: Rewritten\r\n", 1))
		if err := os.WriteFile(file, data, 0o600); err != nil {
			t.Fatal(err)
		}
		rewritten = true
	}
	if !rewritten {
		t.Fatalf("no file holds %q among %v", subject, files)
	}

	after := s.checkForNewMail("INBOX")
	if len(after.Messages) != 2 || after.Messages[1].Envelope.Subject != other.Envelope.Subject {
		t.Fatalf("the folder was read again after a message on its page was read: %+v", after.Messages)
	}
	if !contains(after.Messages[0].Flags, `\Seen`) {
		t.Errorf("the message read is listed with %v", after.Messages[0].Flags)
	}
}

// Mail that arrives while a message is being read is listed by the next check
// for new mail.
//
// The check compares the counts the server answers with the counts the
// session holds, and the same counts meant the cached pages still stood. But
// the check is not the only reader of those counts. Every message and part
// read carries the folder list, and one that finds the counts missing fetches
// them again; reading a message no cached page holds is one way they go
// missing, because what it was before the read is unknown. An arrival in
// between was counted there and nowhere else: the check then found nothing
// new, and the list kept answering from a page read before the arrival until
// the cache expired. In the browser, a conversation's earlier messages are
// such messages, and mail landing while they loaded did not reach the list.
func TestHTTP_MailThatArrivesWhileReadingIsListed(t *testing.T) {
	s := newTestServer(t)
	s.login()
	// One row a page, so that the older message is on no cached page, as the
	// earlier messages of a conversation are not.
	s.expect(s.do("PUT", "/settings", map[string]any{"messages_per_page": 1}), http.StatusOK)

	before := s.checkForNewMail("INBOX")
	if len(before.Messages) != 1 || before.Total != 2 {
		t.Fatalf("listed %d rows of %d", len(before.Messages), before.Total)
	}

	// Asked of the store, not of alps, which would cache the page it is on.
	older, _, err := s.store.ListMessages("INBOX", "desc", 1, 1)
	if err != nil || len(older) != 1 {
		t.Fatalf("older message: %v %v", older, err)
	}
	uid := older[0].ID.String()

	s.expect(s.do("GET", "/mailboxes/INBOX/messages/"+uid+"/raw", nil), http.StatusOK)

	msg := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Arrival\r\n" +
		"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMessage-ID: <arrival@remote.test>\r\n\r\nJust in.\r\n"
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(msg), 0); err != nil {
		t.Fatal(err)
	}

	// The reader goes on loading the message it opened, and the counts are
	// read again on the way.
	s.expect(s.do("GET", "/mailboxes/INBOX/messages/"+uid+"/raw", nil), http.StatusOK)

	after := s.checkForNewMail("INBOX")
	if after.Total != 3 || len(after.Messages) != 1 || after.Messages[0].Envelope.Subject != "Arrival" {
		subject := ""
		if len(after.Messages) > 0 {
			subject = after.Messages[0].Envelope.Subject
		}
		t.Fatalf("after the check the list shows %q of %d messages; want the arrival, of 3", subject, after.Total)
	}
}
