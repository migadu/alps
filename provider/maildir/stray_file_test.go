package maildir

import (
	"os"
	"path/filepath"
	"testing"
)

func TestStrayCurFilesDoNotBreakFolder(t *testing.T) {
	dir := t.TempDir()
	p := NewProvider(dir, "alice@example.com")
	if err := p.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"1700000000.valid:2,S", "1700000001.noinfo", "1700000002.wrong:1,S"} {
		if err := os.WriteFile(filepath.Join(dir, "cur", name), []byte("Subject: hello\r\n\r\nbody"), 0600); err != nil {
			t.Fatal(err)
		}
	}
	msgs, page, err := p.ListMessages("INBOX", "desc", 0, 50)
	if err != nil {
		t.Fatal(err)
	}
	if len(msgs) != 1 || page.Total != 1 {
		t.Fatalf("got %d messages, total %d", len(msgs), page.Total)
	}
	status, err := p.GetMailboxStatus("INBOX")
	if err != nil || status.NumMessages != 1 {
		t.Fatalf("status = %v, %v", status, err)
	}
}
