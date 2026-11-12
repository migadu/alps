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
[provider]
timeout = 60
typ = "imap"
[provider.imap]
server = "imaps://imap.example.test"
misspelled_option = true
[plugin.base]
enabled = true
options = { free_form = "allowed", payload_mapping = { nested_value = "accepted" } }
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
	for _, key := range []string{"server.write_timeout", "server.rate_limit.misspelled_limit", "tls.unknown_option", "provider.timeout", "provider.typ", "provider.imap.misspelled_option", "plugin.caldav.unknown_option"} {
		if !strings.Contains(logs, "Unknown configuration key: "+key) {
			t.Errorf("missing warning for %s; logs:\n%s", key, logs)
		}
	}
	for _, key := range []string{"provider.imap.server", "plugin.base.options.free_form", "plugin.base.options.payload_mapping.nested_value"} {
		if strings.Contains(logs, "Unknown configuration key: "+key) {
			t.Errorf("known key %s incorrectly warned: %s", key, logs)
		}
	}
}

func TestStartupExamplesDoNotWarnAboutDynamicOptionKeys(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("uses Unix process shutdown")
	}
	binary := filepath.Join(t.TempDir(), "alps")
	if out, err := exec.Command("go", "build", "-o", binary, ".").CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, out)
	}
	example, err := os.ReadFile("../../config.example.toml")
	if err != nil {
		t.Fatal(err)
	}
	const multi = `[server]
addr = ":1323"
[server.rate_limit]
enabled = false
[logging]
output = "stderr"
[smtp]
server = "smtps://smtp.example.test"
[provider]
type = "multi"
[provider.multi.default]
type = "imap"
server = "imaps://default.example.test"
[provider.multi.default.password]
endpoint = "https://default.example.test/password"
[provider.multi.default.password.payload_mapping]
default_user = "username"
[provider.multi.domains."example.test"]
type = "imap"
server = "imaps://imap.example.test"
password = {endpoint="https://password.example.test", payload_mapping={domain_user="username"}}
[[provider.multi.routes]]
domains = ["other.test"]
type = "imap"
server = "imaps://other.test"
[provider.multi.routes.password]
endpoint = "https://other.test/password"
[provider.multi.routes.password.payload_mapping]
route_user = "username"
[plugin.base]
enabled = true
[plugin.base.options.render]
colors = {header="#ffffff"}
[plugin.password]
enabled = true
[plugin.password.options]
endpoint = "https://global.example.test/password"
[plugin.password.options.payload_mapping]
password = "new_password"
`
	for _, tc := range []struct{ name, config string }{{"shipped example", string(example)}, {"multi password option maps", multi}} {
		t.Run(tc.name, func(t *testing.T) {
			dir := t.TempDir()
			logPath := filepath.Join(dir, "startup.log")
			data := strings.Replace(tc.config, "\n"+`addr = ":1323"`+"\n", "\n"+`addr = "127.0.0.1:0"`+"\n", 1)
			data = strings.Replace(data, "\n"+`output = "stderr"`+"\n", "\n"+`output = "`+filepath.ToSlash(logPath)+`"`+"\n", 1)
			path := filepath.Join(dir, "config.toml")
			if err := os.WriteFile(path, []byte(data), 0600); err != nil {
				t.Fatal(err)
			}
			cmd := exec.Command(binary, "-config", path)
			diagnosticsPath := filepath.Join(dir, "console.log")
			diagnostics, err := os.Create(diagnosticsPath)
			if err != nil {
				t.Fatal(err)
			}
			defer diagnostics.Close()
			cmd.Stdout, cmd.Stderr = diagnostics, diagnostics
			if err := cmd.Start(); err != nil {
				t.Fatal(err)
			}
			defer func() { cmd.Process.Signal(syscall.SIGTERM); cmd.Wait() }()
			var logs string
			for deadline := time.Now().Add(10 * time.Second); time.Now().Before(deadline); {
				bytes, _ := os.ReadFile(logPath)
				logs = string(bytes)
				if strings.Contains(logs, "Starting server on") {
					break
				}
				time.Sleep(10 * time.Millisecond)
			}
			if !strings.Contains(logs, "Starting server on") {
				diagnosticOutput, _ := os.ReadFile(diagnosticsPath)
				t.Fatalf("server did not start: %s\n%s", logs, diagnosticOutput)
			}
			if strings.Contains(logs, "Unknown configuration key:") {
				t.Fatalf("valid example produced configuration warnings:\n%s", logs)
			}
		})
	}
}
