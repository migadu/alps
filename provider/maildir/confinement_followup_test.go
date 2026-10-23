package maildir

import (
	"io"
	"os"
	"path/filepath"
	"testing"

	"github.com/migadu/alps/provider"
)

type appendSwap struct{ swap func() }

func (m appendSwap) WriteTo(w io.Writer) (int64, error) {
	n, err := io.WriteString(w, "Subject: Inside append\r\n\r\ninside\r\n")
	if err == nil {
		m.swap()
	}
	return int64(n), err
}

func TestAppendDoesNotFollowACurReplacedDuringTheWrite(t *testing.T) {
	base, outside := outsideOfMaildir(t)
	p := NewProvider(base, "ada@example.com")
	putMessages(t, p, "Kept")
	before := snapshot(t, outside)
	_, _, _, err := p.AppendMessage("INBOX", appendSwap{swap: func() {
		if err := os.Rename(filepath.Join(base, "cur"), filepath.Join(base, "held-cur")); err != nil {
			t.Fatal(err)
		}
		link(t, filepath.Join(outside, "cur"), filepath.Join(base, "cur"))
	}}, 0)
	if err == nil {
		t.Error("append accepted a destination replaced by an escaping symlink")
	}
	if got := snapshot(t, outside); got != before {
		t.Errorf("append changed files outside: %s", got)
	}
}

func TestSettingsTemporaryFileCannotFollowAnOutsideSymlink(t *testing.T) {
	base, outside := outsideOfMaildir(t)
	p := NewProvider(base, "ada@example.com")
	putMessages(t, p, "Kept")
	link(t, filepath.Join(outside, "settings.json"), filepath.Join(base, "alps_store.json.tmp"))
	before := snapshot(t, outside)
	store, err := p.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Put("base.settings", map[string]string{"theme": "dark"}); err == nil {
		t.Error("store followed an escaping temporary-file symlink")
	}
	if got := snapshot(t, outside); got != before {
		t.Errorf("temporary write changed outside files: %s", got)
	}
}

func TestInRootRelativeSymlinkStillServesAndAppends(t *testing.T) {
	base := t.TempDir()
	p := NewProvider(base, "ada@example.com")
	if err := p.CreateMailbox("Actual"); err != nil {
		t.Fatal(err)
	}
	_, id, _, err := p.AppendMessage("Actual", &mockMessage{content: []byte("Subject: Kept\r\n\r\nbody\r\n")}, 0)
	if err != nil {
		t.Fatal(err)
	}
	link(t, ".Actual", filepath.Join(base, ".Alias"))
	if msg, err := p.GetMessageMetadata("Alias", id); err != nil || msg.Envelope.Subject != "Kept" {
		t.Fatalf("inside link read: %+v %v", msg, err)
	}
	if _, _, _, err := p.AppendMessage("Alias", &mockMessage{content: []byte("Subject: Another\r\n\r\nbody\r\n")}, provider.MailboxType(0)); err != nil {
		t.Fatal(err)
	}
	if status, err := p.GetMailboxStatus("Actual"); err != nil || status.NumMessages != 2 {
		t.Fatalf("inside link append: %+v %v", status, err)
	}
}
