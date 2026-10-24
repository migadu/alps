package main

import (
	"os"
	"path/filepath"
	"testing"
)

// The access log is on unless a config turns it off, and leaving the
// [logging] section out, or setting only its level, does not.
func TestConfigAccessLogIsOnUnlessTurnedOff(t *testing.T) {
	for _, tc := range []struct {
		name    string
		logging string
		want    bool
	}{
		{"no logging section", "", true},
		{"only a level", "[logging]\nlevel = \"warn\"\n", true},
		{"turned on", "[logging]\naccess = true\n", true},
		{"turned off", "[logging]\naccess = false\n", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "alps.toml")
			config := "[smtp]\nserver = \"smtps://smtp.example.com:465\"\n[provider.imap]\nserver = \"imaps://imap.example.com:993\"\n" + tc.logging
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
			if opts.AccessLog != tc.want {
				t.Errorf("AccessLog = %v, want %v", opts.AccessLog, tc.want)
			}
		})
	}
}
