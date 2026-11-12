package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"testing"
	"time"
)

func TestStartupDistinguishesOmittedAndFalsePluginEnabled(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("uses Unix process shutdown")
	}
	binary := filepath.Join(t.TempDir(), "alps")
	if out, err := exec.Command("go", "build", "-o", binary, ".").CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, out)
	}
	dav := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) }))
	defer dav.Close()
	endpoint := strings.Replace(dav.URL, "http://", "http+insecure://", 1) + "/dav/"
	for _, tc := range []struct {
		name, plugin, settings string
		loaded                 bool
	}{
		{"omitted GPG", "gpg", "[plugin.gpg]\n", true},
		{"explicitly disabled GPG", "gpg", "[plugin.gpg]\nenabled=false\n", false},
		{"omitted CalDAV", "caldav", "[plugin.caldav]\nserver=\"" + endpoint + "\"\n", true},
		{"omitted CardDAV", "carddav", "[plugin.carddav]\nserver=\"" + endpoint + "\"\n", true},
		{"explicitly disabled CalDAV", "caldav", "[plugin.caldav]\nenabled=false\nserver=\"" + endpoint + "\"\n", false},
		{"allow list retained", "caldav", "[plugin.gpg]\nenabled=true\n[plugin.caldav]\nserver=\"" + endpoint + "\"\n", false},
		{"password still opt in", "password", "[plugin.password.options]\nendpoint=\"https://password.example.test/change\"\n", false},
		{"routed CalDAV without global server", "caldav", "[plugin.caldav]\n[provider]\ntype=\"multi\"\n[provider.multi.default]\ntype=\"imap\"\nserver=\"imaps://imap.example.test\"\ncaldav=\"" + endpoint + "\"\n", true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			dir := t.TempDir()
			logPath := filepath.Join(dir, "alps.log")
			config := "[server]\naddr=\"127.0.0.1:0\"\n[server.rate_limit]\nenabled=false\n[logging]\noutput=\"" + filepath.ToSlash(logPath) + "\"\n[smtp]\nserver=\"smtps://smtp.example.test\"\n[provider.imap]\nserver=\"imaps://imap.example.test\"\n" + tc.settings
			file := filepath.Join(dir, "config.toml")
			if err := os.WriteFile(file, []byte(config), 0600); err != nil {
				t.Fatal(err)
			}
			cmd := exec.Command(binary, "-config", file)
			console, err := os.Create(filepath.Join(dir, "console.log"))
			if err != nil {
				t.Fatal(err)
			}
			defer console.Close()
			cmd.Stdout = console
			cmd.Stderr = console
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
				data, _ := os.ReadFile(filepath.Join(dir, "console.log"))
				t.Fatalf("did not start: %s\n%s", logs, data)
			}
			loaded := strings.Contains(logs, `Loaded plugin \"`+tc.plugin+`\"`)
			if loaded != tc.loaded {
				t.Fatalf("%s loaded=%v, want %v:\n%s", tc.plugin, loaded, tc.loaded, logs)
			}
		})
	}
}
