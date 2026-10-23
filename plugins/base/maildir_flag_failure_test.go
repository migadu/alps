package alpsbase

import (
	"net/http"
	"os"
	"path/filepath"
	"testing"
)

// A star the maildir refuses to write is reported, and the page is not
// patched with it. Here the folder's cur has been swapped for a link out of
// the maildir, which alps does not follow: the refusal was taken for a message
// that is gone, the request answered 200, and the cached page showed the
// message starred once the folder was read again, which it was not.
func TestHTTP_AStarTheMaildirRefusesIsReported(t *testing.T) {
	s := newTestServer(t)
	s.login()
	uid := uidOfSubject(t, s, "Engines")

	cur := filepath.Join(s.dir, "cur")
	aside := filepath.Join(t.TempDir(), "cur")
	if err := os.Rename(cur, aside); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(t.TempDir(), cur); err != nil {
		t.Fatal(err)
	}

	r := s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{
		"uids": []string{uid}, "flags": []string{`\Flagged`}, "action": "add",
	})
	if r.status == http.StatusOK {
		t.Errorf("the refused star answered %d: %s", r.status, r.body)
	}

	if err := os.Remove(cur); err != nil {
		t.Fatal(err)
	}
	if err := os.Rename(aside, cur); err != nil {
		t.Fatal(err)
	}
	for _, m := range s.mailbox("INBOX").Messages {
		if m.UID == uid && contains(m.Flags, `\Flagged`) {
			t.Errorf("the message is listed starred, though its file is not: %v", m.Flags)
		}
	}
}
