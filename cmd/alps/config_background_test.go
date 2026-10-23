package main

import (
	"os"
	"path/filepath"
	"testing"
)

// Sessions open a background connection unless a config turns it off.
func TestConfigBackgroundConnectionIsOnUnlessTurnedOff(t *testing.T) {
	for _, tc := range []struct {
		name   string
		server string
		want   bool
	}{
		{"not set", "", true},
		{"turned on", "[server]\nbackground_connection = true\n", true},
		{"turned off", "[server]\nbackground_connection = false\n", false},
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
			if got := !opts.DisableBackgroundConnection; got != tc.want {
				t.Errorf("background connection %v, want %v", got, tc.want)
			}
		})
	}
}
