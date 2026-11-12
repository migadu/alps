package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Logs go to stdout unless output names somewhere else, and setting only
// the format or the level under [logging] does not move them to stderr.
func TestConfigLoggerOutputDefaultsToStdout(t *testing.T) {
	for _, tc := range []struct {
		name   string
		config string
		want   string
	}{
		{"no logging section", "", "stdout"},
		{"no logging section, debug", "[server]\ndebug = true\n", "stdout"},
		{"only a level", "[logging]\nlevel = \"warn\"\n", "stdout"},
		{"only a format", "[logging]\nformat = \"console\"\n", "stdout"},
		{"only a level, debug", "[server]\ndebug = true\n[logging]\nlevel = \"warn\"\n", "stdout"},
		{"output stdout", "[logging]\noutput = \"stdout\"\n", "stdout"},
		{"output stderr", "[logging]\noutput = \"stderr\"\n", "stderr"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			config := "[smtp]\nserver = \"smtps://smtp.example.com:465\"\n[provider.imap]\nserver = \"imaps://imap.example.com:993\"\n" + tc.config
			c, err := LoadConfigString(config)
			if err != nil {
				t.Fatal(err)
			}

			dir := t.TempDir()
			stdout, err := os.Create(filepath.Join(dir, "stdout"))
			if err != nil {
				t.Fatal(err)
			}
			defer stdout.Close()
			stderr, err := os.Create(filepath.Join(dir, "stderr"))
			if err != nil {
				t.Fatal(err)
			}
			defer stderr.Close()

			// The logger takes os.Stdout or os.Stderr when it is made.
			oldStdout, oldStderr := os.Stdout, os.Stderr
			os.Stdout, os.Stderr = stdout, stderr
			logger := c.ToLogger()
			os.Stdout, os.Stderr = oldStdout, oldStderr
			logger.Error("written by the test")

			got := map[string]bool{}
			for _, name := range []string{"stdout", "stderr"} {
				b, err := os.ReadFile(filepath.Join(dir, name))
				if err != nil {
					t.Fatal(err)
				}
				got[name] = strings.Contains(string(b), "written by the test")
			}
			for name, wrote := range got {
				if wrote != (name == tc.want) {
					t.Errorf("logged to %s: %v, want the line on %s only", name, wrote, tc.want)
				}
			}
		})
	}
}

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
