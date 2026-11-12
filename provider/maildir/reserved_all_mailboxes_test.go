package maildir

import (
	"errors"
	"github.com/migadu/go-imap"
	"os"
	"path/filepath"
	"testing"
)

func TestAllMailboxesPseudoNameIsNotAMaildirFolder(t *testing.T) {
	dir := t.TempDir()
	p := NewProvider(dir, "alice@example.com")
	err := p.CreateMailbox("*")
	var refusal *imap.Error
	if !errors.As(err, &refusal) || refusal.Code != imap.ResponseCodeCannot {
		t.Errorf("create '*' returned %v; want CANNOT", err)
	}
	if _, err := os.Stat(filepath.Join(dir, ".*")); !os.IsNotExist(err) {
		t.Error("created the reserved pseudo-folder on disk")
	}
	for _, run := range []func() error{
		func() error { _, _, err := p.SearchMessages("*", "invoice", "desc", 0, 50); return err },
		func() error { _, err := p.SearchMessageIDs("*", "invoice"); return err },
	} {
		err := run()
		refusal = nil
		if !errors.As(err, &refusal) || refusal.Code != imap.ResponseCodeCannot {
			t.Errorf("all-folder search returned %v; want CANNOT", err)
		}
	}
}
