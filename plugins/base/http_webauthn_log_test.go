package alpsbase

import (
	"encoding/base64"
	"net/http"
	"path/filepath"
	"testing"

	"github.com/migadu/alps"
)

// Adding and removing a key are logged as sign-ins are: who, from where, in
// which session, and which key. Only their failures were, so when a user said
// they had never added a key, the log could not say when one was added, or
// from where.
func TestHTTP_AddingAndRemovingAKeyIsLogged(t *testing.T) {
	logPath := filepath.Join(t.TempDir(), "alps.log")
	s := newTestServerWithLogger(t, "smtp://127.0.0.1:1", alps.NewLoggerWithOptions(alps.LoggerOptions{Output: logPath, Format: "json", Level: "info"}))
	s.withWebAuthn()
	s.login()
	signIns := logLines(t, logPath, "sign-in")
	if len(signIns) != 1 {
		t.Fatalf("sign-in = %v", signIns)
	}
	session := signIns[0]["session"]

	// check holds a line to what a sign-in's says, and names the key and how
	// many the account has after the change.
	check := func(line map[string]any, key string, keys int) {
		t.Helper()
		if line["level"] != "INFO" || line["user"] != testUser || line["ip"] != "127.0.0.1" || line["session"] != session || line["agent"] == "" {
			t.Errorf("not logged as a sign-in is: %v", line)
		}
		if line["key"] != key || line["keys"] != float64(keys) {
			t.Errorf("key %v and keys %v, want %q and %d: %v", line["key"], line["keys"], key, keys, line)
		}
		if transports, _ := line["transports"].([]any); len(transports) != 1 || transports[0] != "usb" {
			t.Errorf("transports %v, want [usb]: %v", line["transports"], line)
		}
	}

	laptop, phone := newSoftKey(t), newSoftKey(t)
	s.enrolKey(laptop, "laptop")
	s.enrolKey(phone, "phone")
	added := logLines(t, logPath, "security key added")
	if len(added) != 2 {
		t.Fatalf("%d lines say a key was added, want 2: %v", len(added), added)
	}
	check(added[0], "laptop", 1)
	check(added[1], "phone", 2)

	s.expect(s.do("POST", "/settings/2fa/credential/"+base64.URLEncoding.EncodeToString(laptop.id)+"/delete", map[string]string{"current_password": testPassword}), http.StatusOK)
	removed := logLines(t, logPath, "security key removed")
	if len(removed) != 1 {
		t.Fatalf("%d lines say a key was removed, want 1: %v", len(removed), removed)
	}
	check(removed[0], "laptop", 1)
}
