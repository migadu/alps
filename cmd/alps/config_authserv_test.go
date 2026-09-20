package main

import (
	"github.com/migadu/alps/provider/imap"
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
	imapOpts, ok := opts.Provider.(*imap.Options)
	if !ok {
		t.Fatalf("Options have unexpected type: %T", opts.Provider)
	}
	if want := []string{"mx.example.com", "mx2.example.com"}; !reflect.DeepEqual(imapOpts.AuthservIDs, want) {
		t.Fatalf("AuthservIDs %q, want %q", imapOpts.AuthservIDs, want)
	}
}
