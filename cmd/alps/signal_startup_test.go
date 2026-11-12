package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"
	"testing"
	"time"
)

func TestSIGHUPDuringPluginStartupKeepsServerRunning(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("uses Unix signals")
	}
	probeStarted := make(chan struct{}, 1)
	releaseProbe := make(chan struct{})
	var releaseOnce sync.Once
	release := func() { releaseOnce.Do(func() { close(releaseProbe) }) }
	defer release()
	dav := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		probeStarted <- struct{}{}
		<-releaseProbe
		w.WriteHeader(http.StatusOK)
	}))
	defer dav.Close()
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
[plugin.caldav]
enabled = true
server = "` + dav.URL + `"
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
	done := make(chan error, 1)
	go func() { done <- cmd.Wait(); close(done) }()
	defer func() { release(); cmd.Process.Signal(syscall.SIGTERM); <-done }()
	select {
	case <-probeStarted:
	case err := <-done:
		t.Fatalf("exited before plugin probe: %v", err)
	case <-time.After(10 * time.Second):
		t.Fatal("plugin did not begin startup probe")
	}
	if err := cmd.Process.Signal(syscall.SIGHUP); err != nil {
		t.Fatal(err)
	}
	// Let a default, unhandled SIGHUP take effect while startup is blocked.
	time.Sleep(20 * time.Millisecond)
	release()
	var logs string
	for deadline := time.Now().Add(5 * time.Second); time.Now().Before(deadline); {
		data, _ := os.ReadFile(logPath)
		logs = string(data)
		if strings.Contains(logs, "Starting server on") {
			return
		}
		select {
		case err := <-done:
			t.Fatalf("SIGHUP ended startup: %v\n%s", err, logs)
		default:
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("startup did not complete after SIGHUP:\n%s", logs)
}
