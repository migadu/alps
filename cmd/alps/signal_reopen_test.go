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

func TestSIGHUPReportsNoFileForStandardOutput(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("uses Unix signals")
	}
	dir := t.TempDir()
	binary := filepath.Join(dir, "alps")
	if out, err := exec.Command("go", "build", "-o", binary, ".").CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, out)
	}
	cfg := `[server]
addr = "127.0.0.1:0"
[server.rate_limit]
enabled = false
[logging]
output = "stdout"
[smtp]
server = "smtps://smtp.example.test"
[provider.imap]
server = "imaps://imap.example.test"
[plugin.base]
enabled = true
`
	path := filepath.Join(dir, "config.toml")
	if err := os.WriteFile(path, []byte(cfg), 0600); err != nil {
		t.Fatal(err)
	}
	logPath := filepath.Join(dir, "output")
	output, err := os.Create(logPath)
	if err != nil {
		t.Fatal(err)
	}
	defer output.Close()
	cmd := exec.Command(binary, "-config", path)
	cmd.Stdout = output
	cmd.Stderr = output
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	defer func() { cmd.Process.Signal(syscall.SIGTERM); cmd.Wait() }()
	readUntil := func(needle string) string {
		t.Helper()
		var logs string
		for deadline := time.Now().Add(5 * time.Second); time.Now().Before(deadline); {
			b, _ := os.ReadFile(logPath)
			logs = string(b)
			if strings.Contains(logs, needle) {
				return logs
			}
			time.Sleep(10 * time.Millisecond)
		}
		t.Fatalf("missing %q in output:\n%s", needle, logs)
		return ""
	}
	readUntil("Starting server on")
	if err := cmd.Process.Signal(syscall.SIGHUP); err != nil {
		t.Fatal(err)
	}
	logs := readUntil("SIGHUP:")
	if !strings.Contains(logs, "SIGHUP: no log file to reopen") || strings.Contains(logs, "SIGHUP: log file reopened") {
		t.Fatalf("misleading rotation result:\n%s", logs)
	}
}
