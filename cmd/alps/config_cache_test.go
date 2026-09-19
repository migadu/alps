package main

import (
	"os"
	"path/filepath"
	"testing"
)

// The session cache is on unless a config turns it off. It used to be read as
// a plain bool, so leaving the [cache] section out — or setting only its TTL —
// switched caching off.
func TestConfigCacheIsOnUnlessTurnedOff(t *testing.T) {
	for _, tc := range []struct {
		name  string
		cache string
		want  bool
	}{
		{"no cache section", "", true},
		{"only a TTL", "[cache]\nttl_minutes = 5\n", true},
		{"turned on", "[cache]\nenabled = true\n", true},
		{"turned off", "[cache]\nenabled = false\n", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "alps.toml")
			config := "[smtp]\nserver = \"smtps://smtp.example.com:465\"\n[provider.imap]\nserver = \"imaps://imap.example.com:993\"\n" + tc.cache
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
			if opts.CacheEnabled != tc.want {
				t.Errorf("CacheEnabled = %v, want %v", opts.CacheEnabled, tc.want)
			}
		})
	}
}
