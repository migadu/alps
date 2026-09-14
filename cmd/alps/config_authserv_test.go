package main

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestConfigCarriesAuthservIDs(t *testing.T) {
	path := filepath.Join(t.TempDir(), "alps.toml")
	config := "[smtp]\nserver = \"smtps://smtp.example.com:465\"\n[provider.imap]\nserver = \"imaps://imap.example.com:993\"\nauthserv_ids = [\"mx.example.com\", \"mx2.example.com\"]\n"
	if err := os.WriteFile(path, []byte(config), 0o600); err != nil {
		t.Fatal(err)
	}
	c, err := LoadConfig(path)
	if err != nil {
		t.Fatal(err)
	}
	opts, err := c.ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	if want := []string{"mx.example.com", "mx2.example.com"}; !reflect.DeepEqual(opts.Provider.IMAP.AuthservIDs, want) {
		t.Fatalf("AuthservIDs %q, want %q", opts.Provider.IMAP.AuthservIDs, want)
	}
}
