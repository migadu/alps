package main

import (
	"os"
	"path/filepath"
	"testing"
)

// The session caps come from max_sessions and max_sessions_per_user. Leaving
// them out or setting 0 keeps the defaults; a negative value turns that cap
// off, as it does for absolute_session_hours, and reaches the session manager
// as 0, which it reads as no cap.
func TestConfigSessionCaps(t *testing.T) {
	for _, tc := range []struct {
		name        string
		server      string
		wantTotal   int
		wantPerUser int
	}{
		{"not set", "", 10000, 10},
		{"0 keeps the defaults", "[server]\nmax_sessions = 0\nmax_sessions_per_user = 0\n", 10000, 10},
		{"set", "[server]\nmax_sessions = 500\nmax_sessions_per_user = 3\n", 500, 3},
		{"negative turns both off", "[server]\nmax_sessions = -1\nmax_sessions_per_user = -1\n", 0, 0},
		{"only the per-user cap off", "[server]\nmax_sessions_per_user = -5\n", 10000, 0},
		{"only the total cap off", "[server]\nmax_sessions = -1\nmax_sessions_per_user = 4\n", 0, 4},
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
			if opts.MaxSessions != tc.wantTotal {
				t.Errorf("MaxSessions = %d, want %d", opts.MaxSessions, tc.wantTotal)
			}
			if opts.MaxSessionsPerUser != tc.wantPerUser {
				t.Errorf("MaxSessionsPerUser = %d, want %d", opts.MaxSessionsPerUser, tc.wantPerUser)
			}
		})
	}
}
