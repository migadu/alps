package alpsbase

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"testing"
)

// Over maildir, a folder named "." is the maildir itself, and deleting it
// deleted every folder the user had: the request answered 200 and INBOX was
// gone. It is refused, and INBOX keeps its mail.
func TestHTTP_DeletingTheMaildirByNameIsRefused(t *testing.T) {
	s := newTestServer(t)
	s.login()

	r := s.do("DELETE", "/mailboxes/%2e", nil)
	if r.status != http.StatusBadRequest {
		t.Errorf("the delete answered %d: %s", r.status, r.body)
	}
	if got := s.mailbox("INBOX").Total; got != 2 {
		t.Errorf("INBOX holds %d messages after the delete, want 2", got)
	}
}

// Over maildir, a folder created again, or deleted when it is not there, is
// answered as an IMAP server answers it, 409 and 404, so that the page can
// say so. Both answered 200, and the page said they had been done.
func TestHTTP_MaildirFolderVerbsSayWhatIsThere(t *testing.T) {
	s := newTestServer(t)
	s.login()

	r := s.do("POST", "/mailboxes", url.Values{"name": {"Archive"}})
	if r.status != http.StatusConflict {
		t.Errorf("creating Archive again answered %d: %s", r.status, r.body)
	}
	r = s.do("DELETE", "/mailboxes/Nowhere", nil)
	if r.status != http.StatusNotFound {
		t.Errorf("deleting a folder that is not there answered %d: %s", r.status, r.body)
	}
}

func TestHTTP_MaildirMessageKeysStayInsideTheMailbox(t *testing.T) {
	s := newTestServer(t)
	s.login()
	neighbour := filepath.Join(filepath.Dir(s.dir), "grace", "cur")
	if err := os.MkdirAll(neighbour, 0o700); err != nil {
		t.Fatal(err)
	}
	file := filepath.Join(neighbour, "1700000000.grace:2,S")
	const content = "Subject: another account\r\n\r\nkept\r\n"
	if err := os.WriteFile(file, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}
	r := s.do("DELETE", "/mailboxes/INBOX/messages", map[string]any{
		"uids": []string{"../../grace/cur/1700000000.grace"},
	})
	if r.status != http.StatusBadRequest {
		t.Errorf("message-key request answered %d, want 400: %s", r.status, r.body)
	}
	if got, err := os.ReadFile(file); err != nil || string(got) != content {
		t.Errorf("neighbouring temporary mailbox changed: %q, %v", got, err)
	}
	if got := s.mailbox("INBOX").Total; got != 2 {
		t.Errorf("INBOX has %d messages, want 2", got)
	}
}
