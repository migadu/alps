package maildir

import (
	"os"
	"path/filepath"
	"testing"
)

func TestStoreCreatesUndeliveredAccountMaildir(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "account", "Maildir")
	p := NewProvider(dir, "alice@example.com")
	store, err := p.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Put("settings", "saved"); err != nil {
		t.Fatal(err)
	}
	var value string
	if err := store.Get("settings", &value); err != nil || value != "saved" {
		t.Fatalf("read saved value: %q, %v", value, err)
	}
	info, err := os.Stat(dir)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0700 {
		t.Fatalf("maildir permissions = %o", info.Mode().Perm())
	}
}
