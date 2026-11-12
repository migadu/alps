package main

import "testing"

func TestConfiguredSessionLimitsDistinguishZeroFromUnset(t *testing.T) {
	for _, tc := range []struct {
		name, settings string
		total, perUser int
	}{
		{"omitted", "", 10000, 10},
		{"zero disables both", "max_sessions = 0\nmax_sessions_per_user = 0\n", 0, 0},
		{"positive limits", "max_sessions = 42\nmax_sessions_per_user = 3\n", 42, 3},
		{"one zero", "max_sessions_per_user = 0\n", 10000, 0},
	} {
		t.Run(tc.name, func(t *testing.T) {
			c, err := LoadConfigString("[server]\n" + tc.settings + "[smtp]\nserver = \"smtps://smtp.example.test\"\n[provider.imap]\nserver = \"imaps://imap.example.test\"\n")
			if err != nil {
				t.Fatal(err)
			}
			opts, err := c.ToOptions()
			if err != nil {
				t.Fatal(err)
			}
			if opts.MaxSessions != tc.total || opts.MaxSessionsPerUser != tc.perUser {
				t.Fatalf("limits = %d, %d; want %d, %d", opts.MaxSessions, opts.MaxSessionsPerUser, tc.total, tc.perUser)
			}
		})
	}
}
