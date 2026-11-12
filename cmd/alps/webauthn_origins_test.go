package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"testing"
	"time"
)

func TestStartupWarnsForWebAuthnOriginsOutsideRPID(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("uses Unix shutdown signals")
	}
	binary := filepath.Join(t.TempDir(), "alps")
	if out, err := exec.Command("go", "build", "-o", binary, ".").CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, out)
	}
	for _, tc := range []struct {
		name, origins string
		warn          bool
	}{
		{name: "omitted origins", warn: true},
		{name: "unrelated host", origins: `origins=["https://unrelated.test"]`, warn: true},
		{name: "similar suffix", origins: `origins=["https://notexample.test"]`, warn: true},
		{name: "matching host", origins: `origins=["https://example.test"]`},
		{name: "subdomain", origins: `origins=["https://webmail.example.test:8443"]`},
	} {
		t.Run(tc.name, func(t *testing.T) {
			dir := t.TempDir()
			logPath := filepath.Join(dir, "alps.log")
			config := "[server]\naddr=\"127.0.0.1:0\"\n[logging]\noutput=\"" + filepath.ToSlash(logPath) + "\"\n[smtp]\nserver=\"smtps://smtp.example.test\"\n[provider.imap]\nserver=\"imaps://imap.example.test\"\n[webauthn]\nrpid=\"example.test\"\n" + tc.origins + "\n"
			configPath := filepath.Join(dir, "config.toml")
			if err := os.WriteFile(configPath, []byte(config), 0600); err != nil {
				t.Fatal(err)
			}
			cmd := exec.Command(binary, "-config", configPath)
			if err := cmd.Start(); err != nil {
				t.Fatal(err)
			}
			defer func() { cmd.Process.Signal(syscall.SIGTERM); cmd.Wait() }()
			var logs string
			for deadline := time.Now().Add(10 * time.Second); time.Now().Before(deadline); {
				data, _ := os.ReadFile(logPath)
				logs = string(data)
				if strings.Contains(logs, "Starting server on") {
					break
				}
				time.Sleep(10 * time.Millisecond)
			}
			if !strings.Contains(logs, "Starting server on") {
				t.Fatalf("startup failed: %s", logs)
			}
			if warned := strings.Contains(logs, "WebAuthn: origin"); warned != tc.warn {
				t.Errorf("origins warning=%v want%v: %s", warned, tc.warn, logs)
			}
		})
	}
}
