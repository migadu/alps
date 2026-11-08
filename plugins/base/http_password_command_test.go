package alpsbase

import (
	"net/http"
	"net/http/cookiejar"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/maildir"
)

// setPassword rewrites a Dovecot-style passwd file, as a mail server's own
// tool would: set-password PASSWD_FILE EMAIL, the new password on stdin.
const setPassword = `IFS= read -r password
printf '%s:{PLAIN}%s\n' "$2" "$password" > "$1"
`

// passwordScript writes an executable shell script and returns its path.
func passwordScript(t *testing.T, body string) string {
	t.Helper()
	if runtime.GOOS == "windows" {
		t.Skip("the test programs are shell scripts")
	}
	path := filepath.Join(t.TempDir(), "set-password")
	if err := os.WriteFile(path, []byte("#!/bin/sh\n"+body), 0o755); err != nil {
		t.Fatal(err)
	}
	return path
}

func commandOptions(command ...string) map[string]interface{} {
	list := make([]interface{}, len(command))
	for i, arg := range command {
		list[i] = arg
	}
	return map[string]interface{}{"command": list}
}

// routedPassword routes one password block for every login, as the multi
// provider does for the logins of a domain.
type routedPassword struct {
	provider.Options
	block map[string]interface{}
}

func (routedPassword) ServiceURL(string, string) string { return "" }
func (r routedPassword) ServiceOptions(service, _ string) map[string]interface{} {
	if service == provider.ServicePassword {
		return r.block
	}
	return nil
}

// newCommandServer is a test server whose password plugin runs a command.
// command gets the passwd file the mail store checks, and returns the global
// option block and, unless nil, a block routed for every login.
func newCommandServer(t *testing.T, command func(passwd string) (global, routed map[string]interface{})) *testServer {
	t.Helper()
	s, _ := newLimitedServer(t, func(o *alps.Options) {
		global, routed := command(o.Provider.(*maildir.Options).AuthPasswdFile)
		o.Plugins = map[string]alps.PluginConfig{"password": {Enabled: true, Options: global}}
		if routed != nil {
			o.Provider = routedPassword{o.Provider, routed}
		}
	})
	return s
}

func (s *testServer) changePassword(newPassword string) response {
	s.t.Helper()
	return s.do("POST", "/password/change", map[string]string{"old_password": testPassword, "password": newPassword})
}

// signsIn reports whether a fresh browser signs in with the password.
func (s *testServer) signsIn(password string) bool {
	s.t.Helper()
	jar, _ := cookiejar.New(nil)
	fresh := *s
	fresh.client = &http.Client{Jar: jar}
	return fresh.do("POST", "/session", map[string]string{"username": testUser, "password": password}).status == http.StatusOK
}

func (s *testServer) expectCode(r response, status int, code string) {
	s.t.Helper()
	s.expect(r, status)
	var body struct{ Code string }
	r.json(s.t, &body)
	if body.Code != code {
		s.t.Fatalf("code %q, want %q: %s", body.Code, code, r.body)
	}
}

// A command changes the password the mail store checks, and the session
// carries on with the new one.
func TestHTTP_PasswordCommandChangesThePassword(t *testing.T) {
	program := passwordScript(t, setPassword)
	s := newCommandServer(t, func(passwd string) (map[string]interface{}, map[string]interface{}) {
		return commandOptions(program, passwd, "{email}"), nil
	})
	s.login()

	newPassword := `new $(id) "horse"`
	s.expectCode(s.changePassword(newPassword), http.StatusOK, "password_changed")
	if !s.signsIn(newPassword) {
		t.Error("the new password does not sign in")
	}
	if s.signsIn(testPassword) {
		t.Error("the old password still signs in")
	}
	// The session was carried over to the new password, not ended.
	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusOK)
}

// A program that refuses the change answers as a refusing HTTP backend does,
// and the password stays as it was.
func TestHTTP_PasswordCommandRefusalHasCode(t *testing.T) {
	program := passwordScript(t, "echo 'password too short' >&2\nexit 1\n")
	s := newCommandServer(t, func(string) (map[string]interface{}, map[string]interface{}) {
		return commandOptions(program, "{email}"), nil
	})
	s.login()

	s.expectCode(s.changePassword("x"), http.StatusBadRequest, "password_change_rejected")
	if !s.signsIn(testPassword) {
		t.Error("the password changed after a refusal")
	}
}

// A block routed for a domain may run a command too, and is held to the same
// rules: one that carries a password among the arguments is refused when it
// is used, and its program does not run.
func TestHTTP_PasswordCommandInARoutedBlock(t *testing.T) {
	program := passwordScript(t, setPassword)
	t.Run("runs", func(t *testing.T) {
		s := newCommandServer(t, func(passwd string) (map[string]interface{}, map[string]interface{}) {
			return map[string]interface{}{"endpoint": "http://127.0.0.1:1/unused"}, commandOptions(program, passwd, "{email}")
		})
		s.login()
		s.expectCode(s.changePassword("routed horse"), http.StatusOK, "password_changed")
		if !s.signsIn("routed horse") {
			t.Error("the new password does not sign in")
		}
	})
	t.Run("refused", func(t *testing.T) {
		s := newCommandServer(t, func(passwd string) (map[string]interface{}, map[string]interface{}) {
			return map[string]interface{}{"endpoint": "http://127.0.0.1:1/unused"}, commandOptions(program, passwd, "{email}", "{new_password}")
		})
		s.login()
		s.expectCode(s.changePassword("routed horse"), http.StatusInternalServerError, "password_service_unavailable")
		if !s.signsIn(testPassword) {
			t.Error("the program ran")
		}
	})
}
