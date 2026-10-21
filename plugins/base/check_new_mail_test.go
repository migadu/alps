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
