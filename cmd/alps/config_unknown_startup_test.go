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

func TestStartupWarnsAboutUnknownConfigurationKeys(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("uses Unix process shutdown")
	}
	dir := t.TempDir()
	binary := filepath.Join(dir, "alps")
	if out, err := exec.Command("go", "build", "-o", binary, ".").CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, out)
	}
	logPath := filepath.Join(dir, "alps.log")
	cfg := `[server]
addr = "127.0.0.1:0"
write_timeout = 60
[server.rate_limit]
enabled = false
misspelled_limit = 12
[tls]
unknown_option = true
[logging]
output = "` + filepath.ToSlash(logPath) + `"
[smtp]
server = "smtps://smtp.example.test"
[provider.imap]
server = "imaps://imap.example.test"
misspelled_option = true
[plugin.base]
enabled = true
options = { free_form = "allowed" }
[plugin.caldav]
unknown_option = true
`
	path := filepath.Join(dir, "config.toml")
	if err := os.WriteFile(path, []byte(cfg), 0600); err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(binary, "-config", path)
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	defer func() { cmd.Process.Signal(syscall.SIGTERM); cmd.Wait() }()
	var logs string
	deadline := time.Now().Add(10 * time.Second)
	for time.Now().Before(deadline) {
		data, _ := os.ReadFile(logPath)
		logs = string(data)
		if strings.Contains(logs, "Starting server on") {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	if !strings.Contains(logs, "Starting server on") {
		t.Fatalf("server did not start: %s", logs)
	}
	for _, key := range []string{"server.write_timeout", "server.rate_limit.misspelled_limit", "tls.unknown_option", "provider.imap.misspelled_option", "plugin.caldav.unknown_option"} {
		if !strings.Contains(logs, "Unknown configuration key: "+key) {
			t.Errorf("missing warning for %s; logs:\n%s", key, logs)
		}
	}
	for _, key := range []string{"provider.imap.server", "plugin.base.options.free_form"} {
		if strings.Contains(logs, "Unknown configuration key: "+key) {
			t.Errorf("known key %s incorrectly warned: %s", key, logs)
		}
	}
}
