package maildir

import (
	"os"
	"path/filepath"
	"testing"
)

func TestRenameMailboxMovesSubfolders(t *testing.T) {
	dir := t.TempDir()
	p := NewProvider(dir, "alice@example.com")
	for _, name := range []string{"Archive", "Archive.2024", "Archive.2024.Receipts", "ArchiveOther"} {
		if err := p.CreateMailbox(name); err != nil {
			t.Fatal(err)
		}
	}
	if err := p.RenameMailbox("Archive", "Old"); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"Old", "Old.2024", "Old.2024.Receipts", "ArchiveOther"} {
		if _, err := os.Stat(filepath.Join(dir, "."+name)); err != nil {
			t.Errorf("%s missing: %v", name, err)
		}
	}
	for _, name := range []string{"Archive", "Archive.2024", "Archive.2024.Receipts"} {
		if _, err := os.Stat(filepath.Join(dir, "."+name)); !os.IsNotExist(err) {
			t.Errorf("old folder %s remains: %v", name, err)
		}
	}
}

func TestRenameMailboxChecksAllSubfolderDestinations(t *testing.T) {
	dir := t.TempDir()
	p := NewProvider(dir, "alice@example.com")
	for _, name := range []string{"Archive", "Archive.2024", "Old.2024"} {
		if err := p.CreateMailbox(name); err != nil {
			t.Fatal(err)
		}
	}
	if err := p.RenameMailbox("Archive", "Old"); err == nil {
		t.Fatal("overwrote destination descendant")
	}
	for _, name := range []string{"Archive", "Archive.2024", "Old.2024"} {
		if _, err := os.Stat(filepath.Join(dir, "."+name)); err != nil {
			t.Errorf("%s missing after refusal: %v", name, err)
		}
	}
}
