package main

import (
	"encoding/json"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"testing"
	"time"
)

func TestClusterLogsUseConfiguredFileAndFormat(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("uses Unix process shutdown")
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	port := listener.Addr().(*net.TCPAddr).Port
	listener.Close()
	dir := t.TempDir()
	binary := filepath.Join(dir, "alps")
	if out, err := exec.Command("go", "build", "-o", binary, ".").CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, out)
	}
	logPath := filepath.Join(dir, "alps.log")
	cfg := `[server]
addr = "127.0.0.1:0"
[server.rate_limit]
enabled = false
[logging]
output = "` + filepath.ToSlash(logPath) + `"
format = "json"
level = "debug"
[smtp]
server = "smtps://smtp.example.test"
[provider.imap]
server = "imaps://imap.example.test"
[plugin.base]
enabled = true
[cluster]
enabled = true
node_id = "logging-test"
bind = "127.0.0.1"
port = ` + strconv.Itoa(port) + `
secret_key = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
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
	for deadline := time.Now().Add(10 * time.Second); time.Now().Before(deadline); {
		b, _ := os.ReadFile(logPath)
		logs = string(b)
		if strings.Contains(logs, "Starting server on") {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	if !strings.Contains(logs, "cluster started") {
		t.Fatalf("cluster logs missing from configured file:\n%s", logs)
	}
	for _, line := range strings.Split(strings.TrimSpace(logs), "\n") {
		var record map[string]interface{}
		if err := json.Unmarshal([]byte(line), &record); err != nil {
			t.Errorf("non-JSON line %q: %v", line, err)
		}
	}
}
