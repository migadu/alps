package main

import (
	"io"
	"os"
	"strings"
	"testing"
)

func TestLoggingOptionsKeepDefaultOutput(t *testing.T) {
	for _, tc := range []struct {
		name    string
		logging LoggingConfig
		debug   bool
	}{
		{name: "unset"},
		{name: "level only", logging: LoggingConfig{Level: "warn"}},
		{name: "format only", logging: LoggingConfig{Format: "json"}},
		{name: "debug level only", logging: LoggingConfig{Level: "warn"}, debug: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			stdout, olderr := os.Stdout, os.Stderr
			outRead, outWrite, err := os.Pipe()
			if err != nil {
				t.Fatal(err)
			}
			errRead, errWrite, err := os.Pipe()
			if err != nil {
				t.Fatal(err)
			}
			defer outRead.Close()
			defer errRead.Close()
			os.Stdout, os.Stderr = outWrite, errWrite
			defer func() { os.Stdout, os.Stderr = stdout, olderr }()
			c := Config{Logging: tc.logging, Server: ServerConfig{Debug: tc.debug}}
			c.ToLogger().Warn("destination probe")
			outWrite.Close()
			errWrite.Close()
			out, err := io.ReadAll(outRead)
			if err != nil {
				t.Fatal(err)
			}
			stderr, err := io.ReadAll(errRead)
			if err != nil {
				t.Fatal(err)
			}
			if !strings.Contains(string(out), "destination probe") || len(stderr) != 0 {
				t.Fatalf("stdout=%q stderr=%q; want stdout for every default configuration", out, stderr)
			}
		})
	}
}
