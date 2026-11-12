package main

import (
	"strings"
	"testing"
)

func TestClusterBindIsParsedAsIPAndOptionalPort(t *testing.T) {
	for _, tc := range []struct {
		bind     string
		port     int
		host     string
		wantPort int
		bad      bool
	}{
		{"", 0, "0.0.0.0", 7946, false},
		{"127.0.0.1", 8000, "127.0.0.1", 8000, false},
		{"127.0.0.1:9000", 8000, "127.0.0.1", 9000, false},
		{"::", 0, "::", 7946, false},
		{"fd00::1", 0, "fd00::1", 7946, false},
		{"[fd00::1]:9000", 8000, "fd00::1", 9000, false},
		{"localhost", 0, "", 0, true},
		{"eth0", 0, "", 0, true},
		{"[::1]:bad", 0, "", 0, true},
		{"127.0.0.1:65536", 0, "", 0, true},
	} {
		t.Run(tc.bind, func(t *testing.T) {
			cfg, err := LoadConfigString("[smtp]\nserver=\"smtps://smtp.example.test\"\n[provider.imap]\nserver=\"imaps://imap.example.test\"\n")
			if err != nil {
				t.Fatal(err)
			}
			cfg.Cluster = ClusterConfig{Enabled: true, Bind: tc.bind, Port: tc.port, AllowInsecure: true}
			_, err = cfg.ToOptions()
			if tc.bad {
				if err == nil || !strings.Contains(err.Error(), "cluster.bind") {
					t.Errorf("invalid bind should identify configuration field: %v", err)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if host, port := cfg.Cluster.GetBindAddr(), cfg.Cluster.GetBindPort(); host != tc.host || port != tc.wantPort {
				t.Errorf("bind=%q port=%d; want%q port%d", host, port, tc.host, tc.wantPort)
			}
		})
	}
}
