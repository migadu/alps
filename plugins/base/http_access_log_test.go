package alpsbase

import (
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps"
)

// logLines decodes the JSON lines of the log at path whose message is msg.
func logLines(t *testing.T, path, msg string) []map[string]any {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var out []map[string]any
	for _, line := range strings.Split(strings.TrimSpace(string(data)), "\n") {
		var m map[string]any
		if err := json.Unmarshal([]byte(line), &m); err != nil {
			t.Fatalf("decoding %q: %v", line, err)
		}
		if m["msg"] == msg {
			out = append(out, m)
		}
	}
	return out
}

// A sign-in, a refused one, what the session did and how it ended are all in
// the log, each with who and from where, and one session's lines are tied
// together by an ID that is not its token. No password reaches it.
func TestHTTP_AccessAndSignInsAreLogged(t *testing.T) {
	logPath := filepath.Join(t.TempDir(), "alps.log")
	s := newTestServerWithLogger(t, "smtp://127.0.0.1:1", alps.NewLoggerWithOptions(alps.LoggerOptions{Output: logPath, Format: "json", Level: "info"}))
	s.server.Options.AccessLog = true

	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": "wrong"}), http.StatusUnauthorized)
	s.login()
	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusOK)

	u, _ := url.Parse(s.url)
	var token string
	for _, c := range s.client.Jar.Cookies(u) {
		if c.Name == "alps_session" {
			token = c.Value
		}
	}
	if token == "" {
		t.Fatal("no session cookie")
	}
	s.expect(s.do("DELETE", "/session", nil), http.StatusOK)

	failed := logLines(t, logPath, "sign-in failed")
	if len(failed) != 1 || failed[0]["user"] != testUser || failed[0]["reason"] != "bad credentials" || failed[0]["ip"] != "127.0.0.1" || failed[0]["level"] != "WARN" {
		t.Errorf("sign-in failed = %v", failed)
	}

	signIns := logLines(t, logPath, "sign-in")
	if len(signIns) != 1 || signIns[0]["user"] != testUser || signIns[0]["ip"] != "127.0.0.1" || signIns[0]["2fa"] != false {
		t.Fatalf("sign-in = %v", signIns)
	}
	session, _ := signIns[0]["session"].(string)
	if session == "" {
		t.Fatal("the sign-in names no session")
	}

	var listed bool
	for _, r := range logLines(t, logPath, "request") {
		if r["path"] == "/mailboxes/INBOX" {
			listed = true
			if r["user"] != testUser || r["session"] != session || r["status"] != float64(http.StatusOK) {
				t.Errorf("request = %v", r)
			}
		}
	}
	if !listed {
		t.Error("the mailbox listing was not logged")
	}

	// The session's end is logged as it is torn down, just after the answer.
	var ended []map[string]any
	for deadline := time.Now().Add(3 * time.Second); time.Now().Before(deadline); time.Sleep(10 * time.Millisecond) {
		if ended = logLines(t, logPath, "session ended"); len(ended) > 0 {
			break
		}
	}
	if len(ended) != 1 || ended[0]["user"] != testUser || ended[0]["session"] != session || ended[0]["reason"] != "sign-out" {
		t.Errorf("session ended = %v", ended)
	}

	logged, _ := os.ReadFile(logPath)
	for _, secret := range []string{testPassword, "wrong", token} {
		if strings.Contains(string(logged), secret) {
			t.Errorf("the log contains %q", secret)
		}
	}
}
