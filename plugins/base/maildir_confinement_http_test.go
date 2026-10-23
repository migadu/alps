package alpsbase

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestHTTP_MaildirReportsAFlagWriteRefusedByConfinement(t *testing.T) {
	s := newTestServer(t)
	s.login()
	uid := s.mailbox("INBOX").Messages[0].UID
	outside := t.TempDir()
	if err := os.Rename(filepath.Join(s.dir, "cur"), filepath.Join(s.dir, "held-cur")); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(s.dir, "cur")); err != nil {
		t.Fatal(err)
	}
	r := s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{"uids": []string{uid}, "flags": []string{`\Flagged`}, "action": "add"})
	if r.status == http.StatusOK {
		t.Fatalf("refused flag write answered200: %s", r.body)
	}
	entries, err := os.ReadDir(outside)
	if err != nil || len(entries) != 0 {
		t.Fatalf("outside directory changed: %v %v", entries, err)
	}
}

func TestHTTP_MaildirReportsARefusedFlagRename(t *testing.T) {
	s := newTestServer(t)
	s.login()
	uid := s.mailbox("INBOX").Messages[0].UID
	// A directory at the destination makes renaming this file fail even
	// when tests run as a user that bypasses ordinary file permissions.
	refused := filepath.Join(s.dir, "cur", uid+":2,F")
	if err := os.Mkdir(refused, 0o700); err != nil {
		t.Fatal(err)
	}
	r := s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{"uids": []string{uid}, "flags": []string{`\Flagged`}, "action": "add"})
	if r.status != http.StatusInternalServerError {
		t.Errorf("refused rename answered%d: %s", r.status, r.body)
	}
	if err := os.Remove(refused); err != nil {
		t.Fatal(err)
	}
	for _, msg := range s.mailbox("INBOX").Messages {
		if msg.UID == uid && contains(msg.Flags, `\Flagged`) {
			t.Error("refused rename left the HTTP cached row starred")
		}
	}
}

func TestHTTP_MaildirOutsideMessageLinkDoesNotExposeItsContent(t *testing.T) {
	s := newTestServer(t)
	s.login()
	inside := s.mailbox("INBOX").Messages[0].UID
	outside := filepath.Join(t.TempDir(), "secret.eml")
	const secret = "private-neighbour-content-9531"
	if err := os.WriteFile(outside, []byte("From: grace@remote.test\r\nSubject: "+secret+"\r\n\r\n"+secret+"\r\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	const uid = "1700000001.link"
	if err := os.Symlink(outside, filepath.Join(s.dir, "cur", uid+":2,")); err != nil {
		t.Fatal(err)
	}
	for _, suffix := range []string{"", "/raw?part=1"} {
		r := s.do("GET", "/mailboxes/INBOX/messages/"+uid+suffix, nil)
		if r.status != http.StatusInternalServerError {
			t.Errorf("escaping link%s answered%d: %s", suffix, r.status, r.body)
		}
		if strings.Contains(string(r.body), secret) {
			t.Error("HTTP response disclosed the outside message")
		}
	}
	s.expect(s.do("GET", "/mailboxes/INBOX/messages/"+inside, nil), http.StatusOK)
}
