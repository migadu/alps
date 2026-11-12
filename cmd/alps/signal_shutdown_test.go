package main

import (
	"bufio"
	"fmt"
	"net"
	"net/http"
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

// stallingIMAPServer signs anyone in and never answers LOGOUT, so a session's
// cleanup at shutdown waits out its full bound.
func stallingIMAPServer(t *testing.T) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	var mu sync.Mutex
	var conns []net.Conn
	t.Cleanup(func() {
		ln.Close()
		mu.Lock()
		defer mu.Unlock()
		for _, c := range conns {
			c.Close()
		}
	})
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			mu.Lock()
			conns = append(conns, conn)
			mu.Unlock()
			go func(conn net.Conn) {
				fmt.Fprint(conn, "* OK [CAPABILITY IMAP4rev1] ready\r\n")
				lines := bufio.NewScanner(conn)
				for lines.Scan() {
					fields := strings.Fields(lines.Text())
					if len(fields) < 2 {
						continue
					}
					tag, command := fields[0], strings.ToUpper(fields[1])
					switch command {
					case "LOGOUT":
						continue // never answered
					case "CAPABILITY":
						fmt.Fprintf(conn, "* CAPABILITY IMAP4rev1\r\n%s OK done\r\n", tag)
					default:
						fmt.Fprintf(conn, "%s OK done\r\n", tag)
					}
				}
			}(conn)
		}
	}()
	return ln.Addr().String()
}

// A second SIGINT or SIGTERM must not cut the shutdown short. The signal
// arrives while the sessions' cleanup waits for a mail server that does not
// answer LOGOUT, after the HTTP drain; ALPS must ignore it, finish the
// remaining steps and exit 0.
func TestSecondSIGTERMDuringShutdownIsIgnored(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("uses Unix signals")
	}
	imapAddr := stallingIMAPServer(t)
	free, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := free.Addr().String()
	free.Close()

	dir := t.TempDir()
	binary := filepath.Join(dir, "alps")
	if out, err := exec.Command("go", "build", "-o", binary, ".").CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, out)
	}
	cfg := `[server]
addr = "` + addr + `"
[server.rate_limit]
enabled = false
[logging]
output = "stdout"
[smtp]
server = "smtps://smtp.example.test"
[provider.imap]
server = "imap+insecure://` + imapAddr + `"
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
	done := make(chan error, 1)
	go func() { done <- cmd.Wait() }()
	exited := false
	defer func() {
		if !exited {
			cmd.Process.Kill()
			<-done
		}
	}()
	logs := func() string { data, _ := os.ReadFile(logPath); return string(data) }

	for deadline := time.Now().Add(10 * time.Second); !strings.Contains(logs(), "Starting server on"); {
		if time.Now().After(deadline) {
			t.Fatalf("alps did not start:\n%s", logs())
		}
		time.Sleep(10 * time.Millisecond)
	}
	var resp *http.Response
	for deadline := time.Now().Add(5 * time.Second); ; {
		req, _ := http.NewRequest("POST", "http://"+addr+"/session",
			strings.NewReader(`{"username":"alice@example.test","password":"secret"}`))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Origin", "http://"+addr)
		resp, err = http.DefaultClient.Do(req)
		if err == nil || time.Now().After(deadline) {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	if err != nil {
		t.Fatalf("sign-in: %v\n%s", err, logs())
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("sign-in answered %d\n%s", resp.StatusCode, logs())
	}

	if err := cmd.Process.Signal(syscall.SIGTERM); err != nil {
		t.Fatal(err)
	}
	// The HTTP drain has no request to wait for and ends at once; the
	// session's cleanup then waits up to 5 seconds for LOGOUT.
	time.Sleep(time.Second)
	if err := cmd.Process.Signal(syscall.SIGTERM); err != nil {
		t.Fatalf("second SIGTERM: %v", err)
	}
	select {
	case err := <-done:
		exited = true
		if err != nil {
			t.Fatalf("second SIGTERM cut the shutdown short: %v\n%s", err, logs())
		}
	case <-time.After(20 * time.Second):
		t.Fatalf("alps did not exit:\n%s", logs())
	}
	if !strings.Contains(logs(), "Session shutdown timed out waiting for cleanup") {
		t.Fatalf("the sessions' cleanup did not run to its end:\n%s", logs())
	}
}
