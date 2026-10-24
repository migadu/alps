package main

import (
	"os"
	"path/filepath"
	"testing"
)

// New mail is pushed only when a config turns it on.
func TestConfigPushNewMailIsOffUnlessTurnedOn(t *testing.T) {
	for _, tc := range []struct {
		name   string
		server string
		want   bool
	}{
		{"not set", "", false},
		{"turned on", "[server]\npush_new_mail = true\n", true},
		{"turned off", "[server]\npush_new_mail = false\n", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "alps.toml")
			config := "[smtp]\nserver = \"smtps://smtp.example.com:465\"\n[provider.imap]\nserver = \"imaps://imap.example.com:993\"\n" + tc.server
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
			if opts.PushNewMail != tc.want {
				t.Errorf("push %v, want %v", opts.PushNewMail, tc.want)
			}
		})
	}
}

// The subscribed folders are pushed too only when a config turns it on.
func TestConfigPushSubscribedFoldersIsOffUnlessTurnedOn(t *testing.T) {
	for _, tc := range []struct {
		name   string
		server string
		want   bool
	}{
		{"not set", "[server]\npush_new_mail = true\n", false},
		{"turned on", "[server]\npush_new_mail = true\npush_subscribed_folders = true\n", true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "alps.toml")
			config := "[smtp]\nserver = \"smtps://smtp.example.com:465\"\n[provider.imap]\nserver = \"imaps://imap.example.com:993\"\n" + tc.server
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
			if opts.PushSubscribedFolders != tc.want {
				t.Errorf("folders pushed %v, want %v", opts.PushSubscribedFolders, tc.want)
			}
		})
	}
}
