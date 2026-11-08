package password

import (
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps"
)

// script writes an executable shell script and returns its path.
func script(t *testing.T, body string) string {
	t.Helper()
	if runtime.GOOS == "windows" {
		t.Skip("the test programs are shell scripts")
	}
	path := filepath.Join(t.TempDir(), "change-password")
	if err := os.WriteFile(path, []byte("#!/bin/sh\n"+body), 0o755); err != nil {
		t.Fatal(err)
	}
	return path
}

func commandBlock(command ...string) map[string]interface{} {
	list := make([]interface{}, len(command))
	for i, arg := range command {
		list[i] = arg
	}
	return map[string]interface{}{"command": list}
}

func changeValues(email, newPassword string) map[string]string {
	local, domain, _ := strings.Cut(email, "@")
	return map[string]string{
		"{email}":        email,
		"{local}":        local,
		"{domain}":       domain,
		"{old_password}": "old secret",
		"{new_password}": newPassword,
	}
}

func readFile(t *testing.T, path string) string {
	t.Helper()
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

// A block that could not run as written is refused when it is read, and so
// when alps starts.
func TestCommandBlockIsCheckedWhenRead(t *testing.T) {
	program := script(t, "exit 0\n")
	notExecutable := filepath.Join(t.TempDir(), "plain")
	if err := os.WriteFile(notExecutable, nil, 0o644); err != nil {
		t.Fatal(err)
	}

	withEndpoint := commandBlock(program, "{email}")
	withEndpoint["endpoint"] = "https://admin.example/api"
	for name, block := range map[string]map[string]interface{}{
		"new password in an argument":    commandBlock(program, "--password={new_password}"),
		"old password in an argument":    commandBlock(program, "{old_password}"),
		"placeholder in the program":     commandBlock("/usr/local/{domain}/bin/passwd", "{email}"),
		"relative program":               commandBlock("maddy", "creds", "password", "{email}"),
		"missing program":                commandBlock(filepath.Join(t.TempDir(), "absent"), "{email}"),
		"program not executable":         commandBlock(notExecutable, "{email}"),
		"a string, not a list":           {"command": program + " {email}"},
		"an empty list":                  {"command": []interface{}{}},
		"a list of other things":         {"command": []interface{}{program, 42}},
		"both endpoint and command":      withEndpoint,
		"stdin without a command to run": {"endpoint": "https://admin.example/api", "stdin": "{new_password}\n"},
	} {
		if _, err := parseConfig(block); err == nil {
			t.Errorf("%s: accepted", name)
		}
	}

	cfg, err := parseConfig(commandBlock(program, "creds", "password", "--", "{email}"))
	if err != nil {
		t.Fatalf("a good block is refused: %v", err)
	}
	if want := []string{program, "creds", "password", "--", "{email}"}; strings.Join(cfg.Command, "\x00") != strings.Join(want, "\x00") {
		t.Errorf("command %q, want %q", cfg.Command, want)
	}
	// The HTTP options stay as lenient as they were.
	if _, err := parseConfig(map[string]interface{}{"endpoint": "https://admin.example/api", "token": 42}); err != nil {
		t.Errorf("an HTTP block is refused: %v", err)
	}
}

// Each configured argument stays one argument whatever the values put into
// it, and the passwords reach the program on standard input only.
func TestCommandArgumentsStayWholeAndPasswordsGoOnStdin(t *testing.T) {
	out := filepath.Join(t.TempDir(), "out")
	program := script(t, `out="$1"; shift
printf '%s\n' "$#" > "$out.args"
for a in "$@"; do printf '%s\n' "$a" >> "$out.args"; done
cat > "$out.stdin"
`)
	email := `o'brien "x" $(id) ` + "`id`" + ` {domain};@example.com`
	newPassword := `new $(touch marker) "pw" ` + "`id`"
	values := changeValues(email, newPassword)

	cfg, err := parseConfig(commandBlock(program, out, "{email}", "--domain={domain}"))
	if err != nil {
		t.Fatal(err)
	}
	cfg.Stdin = "{old_password}\n{new_password}\n"
	if failure := runCommand(t.Context(), cfg, values); failure != nil {
		t.Fatalf("failed: %v", failure.err)
	}

	// A value is not searched for placeholders itself: the "{domain}" inside
	// the address arrives as typed.
	if got, want := readFile(t, out+".args"), "2\n"+email+"\n--domain=example.com\n"; got != want {
		t.Errorf("arguments\n%q, want\n%q", got, want)
	}
	if got, want := readFile(t, out+".stdin"), "old secret\n"+newPassword+"\n"; got != want {
		t.Errorf("stdin %q, want %q", got, want)
	}

	// Without a stdin of its own the program reads the new password alone.
	cfg.Stdin = ""
	if failure := runCommand(t.Context(), cfg, values); failure != nil {
		t.Fatalf("failed: %v", failure.err)
	}
	if got := readFile(t, out+".stdin"); got != newPassword+"\n" {
		t.Errorf("default stdin %q, want the new password on a line", got)
	}
}

// Nothing of alps's own environment reaches the program but PATH.
func TestCommandEnvironmentIsOnlyPath(t *testing.T) {
	t.Setenv("ALPS_TEST_SECRET", "do not pass on")
	out := filepath.Join(t.TempDir(), "env")
	program := script(t, `env > "$1"`+"\n")
	cfg, err := parseConfig(commandBlock(program, out))
	if err != nil {
		t.Fatal(err)
	}
	if failure := runCommand(t.Context(), cfg, changeValues("ada@example.com", "new")); failure != nil {
		t.Fatalf("failed: %v", failure.err)
	}
	env := readFile(t, out)
	if strings.Contains(env, "ALPS_TEST_SECRET") {
		t.Errorf("alps's environment reached the program:\n%s", env)
	}
	if !strings.Contains(env, "PATH="+os.Getenv("PATH")+"\n") {
		t.Errorf("no PATH:\n%s", env)
	}
}

// A program that exits non-zero refused the change. What it said on standard
// error is kept for the log, without the passwords in it.
func TestCommandExitStatusIsARefusal(t *testing.T) {
	program := script(t, `read -r password; echo "too weak: $password" >&2; exit 3`+"\n")
	cfg, err := parseConfig(commandBlock(program, "{email}"))
	if err != nil {
		t.Fatal(err)
	}
	failure := runCommand(t.Context(), cfg, changeValues("ada@example.com", "hunter2"))
	if failure == nil {
		t.Fatal("a non-zero exit counted as a change")
	}
	if failure.status != http.StatusBadRequest || failure.code != "password_change_rejected" {
		t.Errorf("answer %d %s, want 400 password_change_rejected", failure.status, failure.code)
	}
	logged := failure.err.Error()
	if strings.Contains(logged, "hunter2") || !strings.Contains(logged, "too weak: [password]") {
		t.Errorf("logged %q", logged)
	}
}

func TestCommandThatCannotStartIsUnavailable(t *testing.T) {
	program := filepath.Join(t.TempDir(), "change-password")
	if err := os.WriteFile(program, []byte("#!/nonexistent/interpreter\n"), 0o755); err != nil {
		t.Fatal(err)
	}
	cfg, err := parseConfig(commandBlock(program, "{email}"))
	if err != nil {
		t.Fatal(err)
	}
	failure := runCommand(t.Context(), cfg, changeValues("ada@example.com", "new"))
	if failure == nil || failure.status != http.StatusBadGateway || failure.code != "password_service_unavailable" {
		t.Fatalf("got %+v, want 502 password_service_unavailable", failure)
	}
}

func TestCommandIsStoppedAtTheTimeout(t *testing.T) {
	defer func(d time.Duration) { commandTimeout = d }(commandTimeout)
	commandTimeout = 200 * time.Millisecond
	program := script(t, "exec sleep 10\n")
	cfg, err := parseConfig(commandBlock(program, "{email}"))
	if err != nil {
		t.Fatal(err)
	}
	start := time.Now()
	failure := runCommand(t.Context(), cfg, changeValues("ada@example.com", "new"))
	if failure == nil || failure.status != http.StatusGatewayTimeout || failure.code != "password_service_unavailable" {
		t.Fatalf("got %+v, want 504 password_service_unavailable", failure)
	}
	if elapsed := time.Since(start); elapsed > 5*time.Second {
		t.Errorf("returned after %v", elapsed)
	}
}

// A program that succeeded changed the password, even when a child it left
// behind still holds its standard error open.
func TestCommandSucceedsPastALingeringChild(t *testing.T) {
	program := script(t, "sleep 5 >&2 &\nexit 0\n")
	cfg, err := parseConfig(commandBlock(program, "{email}"))
	if err != nil {
		t.Fatal(err)
	}
	if failure := runCommand(t.Context(), cfg, changeValues("ada@example.com", "new")); failure != nil {
		t.Fatalf("failed: %v", failure.err)
	}
}

// Values a program would misread are refused before it runs.
func TestCommandRefusesValuesItWouldMisread(t *testing.T) {
	ran := filepath.Join(t.TempDir(), "ran")
	program := script(t, `touch "$1"`+"\n")
	for name, c := range map[string]struct {
		command     []string
		email, pass string
	}{
		"an address opening an argument with a dash": {[]string{program, ran, "{email}"}, "-x@example.com", "new"},
		"a local part opening an argument":           {[]string{program, ran, "{local}"}, "-x@example.com", "new"},
		"a line break in the new password":           {[]string{program, ran, "{email}"}, "ada@example.com", "new\nsecond line"},
		"a carriage return in the new password":      {[]string{program, ran, "{email}"}, "ada@example.com", "new\r"},
	} {
		cfg, err := parseConfig(commandBlock(c.command...))
		if err != nil {
			t.Fatal(err)
		}
		failure := runCommand(t.Context(), cfg, changeValues(c.email, c.pass))
		if failure == nil || failure.code != "password_change_rejected" {
			t.Errorf("%s: got %+v, want a refusal", name, failure)
		}
		if _, err := os.Stat(ran); err == nil {
			t.Fatalf("%s: the program ran", name)
		}
	}

	// A dash inside an argument is no option.
	cfg, err := parseConfig(commandBlock(program, ran, "--user={email}"))
	if err != nil {
		t.Fatal(err)
	}
	if failure := runCommand(t.Context(), cfg, changeValues("-x@example.com", "new")); failure != nil {
		t.Fatalf("failed: %v", failure.err)
	}
}

// alps does not start with a global block that could not run, unless the
// plugin is off.
func TestLoadRefusesAGlobalBlockThatCannotRun(t *testing.T) {
	program := script(t, "exit 0\n")
	server := func(enabled bool, block map[string]interface{}) *alps.Server {
		return &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{
			"password": {Enabled: enabled, Options: block},
		}}}
	}
	if _, err := load(server(true, commandBlock(program, "{new_password}"))); err == nil {
		t.Error("started with a password among the arguments")
	}
	if _, err := load(server(false, commandBlock(program, "{new_password}"))); err != nil {
		t.Errorf("a disabled plugin stopped the start: %v", err)
	}
	if plugins, err := load(server(true, commandBlock(program, "{email}"))); err != nil || len(plugins) != 1 {
		t.Errorf("a good block: %v, %d plugins", err, len(plugins))
	}
}
