package password

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// A command changes the password by running a program on this host, for mail
// servers that offer a command line tool rather than an HTTP API. The program
// is run directly, never through a shell, so nothing a user types is ever read
// as shell syntax: each configured argument stays one argument whatever the
// values put into it.

// argumentPlaceholders are the values a command's arguments may carry.
var argumentPlaceholders = []string{"{email}", "{local}", "{domain}"}

// passwordPlaceholders may appear on standard input only. Arguments can be
// read by every local user while the program runs, and land in process
// accounting and audit logs.
var passwordPlaceholders = []string{"{old_password}", "{new_password}"}

var allPlaceholders = append(append([]string{}, argumentPlaceholders...), passwordPlaceholders...)

// defaultStdin is what a command reads when none is configured: the new
// password on a line of its own, as tools that prompt for one expect.
const defaultStdin = "{new_password}\n"

// commandTimeout bounds a command as the HTTP request is bounded.
var commandTimeout = 15 * time.Second

// stderrLimit caps how much of a command's error output is kept for the log.
const stderrLimit = 4 << 10

// validateCommand refuses a command that could not run as written, so that a
// mistake shows when alps starts rather than when someone changes a password.
func (cfg *PasswordChangeConfig) validateCommand() error {
	if len(cfg.Command) == 0 {
		if cfg.Stdin != "" {
			return errors.New("stdin is used only with command")
		}
		return nil
	}
	if cfg.Endpoint != "" {
		return errors.New("set either endpoint or command, not both")
	}
	program := cfg.Command[0]
	for _, p := range allPlaceholders {
		if strings.Contains(program, p) {
			return fmt.Errorf("the program path cannot carry %s", p)
		}
	}
	if !filepath.IsAbs(program) {
		return fmt.Errorf("the program %q must be an absolute path", program)
	}
	for _, arg := range cfg.Command[1:] {
		for _, p := range passwordPlaceholders {
			if strings.Contains(arg, p) {
				return fmt.Errorf("command arguments cannot carry %s: passwords go on stdin", p)
			}
		}
	}
	info, err := os.Stat(program)
	if err != nil {
		return fmt.Errorf("the program: %v", err)
	}
	if !info.Mode().IsRegular() || info.Mode().Perm()&0o111 == 0 {
		return fmt.Errorf("the program %q is not an executable file", program)
	}
	return nil
}

// commandFailure is a change the command did not make: the answer the browser
// gets for it, and what went wrong, for the log only.
type commandFailure struct {
	status  int
	code    string
	message string
	err     error
}

func refused(err error) *commandFailure {
	return &commandFailure{http.StatusBadRequest, "password_change_rejected", "Password change rejected by server", err}
}

func unavailable(status int, err error) *commandFailure {
	return &commandFailure{status, "password_service_unavailable", "Password change service unavailable", err}
}

// runCommand runs the configured program for one change. values maps each
// placeholder to what it stands for in this change.
func runCommand(ctx context.Context, cfg *PasswordChangeConfig, values map[string]string) *commandFailure {
	args, err := commandArgs(cfg.Command, values)
	if err != nil {
		return refused(err)
	}
	stdin, err := commandStdin(cfg.Stdin, values)
	if err != nil {
		return refused(err)
	}

	ctx, cancel := context.WithTimeout(ctx, commandTimeout)
	defer cancel()
	cmd := exec.CommandContext(ctx, args[0], args[1:]...)
	// Nothing of alps's own environment, which may hold its secrets, reaches
	// the program. A program that needs more is wrapped in a script.
	cmd.Env = []string{"PATH=" + os.Getenv("PATH")}
	cmd.Stdin = strings.NewReader(stdin)
	// Standard output is discarded, unlogged: a program may echo what it read.
	var stderr cappedBuffer
	cmd.Stderr = &stderr
	// A child the program left behind could hold standard error open, and the
	// wait with it, past the timeout.
	cmd.WaitDelay = time.Second

	err = cmd.Run()
	// ErrWaitDelay is such a child outliving a program that succeeded.
	if err == nil || errors.Is(err, exec.ErrWaitDelay) {
		return nil
	}
	output := stderr.redacted(values["{old_password}"], values["{new_password}"])
	err = fmt.Errorf("%s: %w (stderr %q)", args[0], err, strings.TrimSpace(output))
	if errors.Is(ctx.Err(), context.DeadlineExceeded) {
		return unavailable(http.StatusGatewayTimeout, fmt.Errorf("timed out after %v: %w", commandTimeout, err))
	}
	var exit *exec.ExitError
	if errors.As(err, &exit) && exit.ExitCode() > 0 {
		return refused(err)
	}
	return unavailable(http.StatusBadGateway, err)
}

// commandArgs puts the values into the configured arguments. Each argument is
// filled in one pass, so a value is never searched for placeholders itself.
func commandArgs(command []string, values map[string]string) ([]string, error) {
	pairs := make([]string, 0, 2*len(argumentPlaceholders))
	for _, p := range argumentPlaceholders {
		pairs = append(pairs, p, values[p])
	}
	fill := strings.NewReplacer(pairs...)

	args := []string{command[0]}
	for _, arg := range command[1:] {
		// A value that opens an argument and starts with a dash would be read
		// as an option.
		for _, p := range argumentPlaceholders {
			if strings.HasPrefix(arg, p) && strings.HasPrefix(values[p], "-") {
				return nil, fmt.Errorf("%s would open an argument with a dash: %q", p, values[p])
			}
		}
		args = append(args, fill.Replace(arg))
	}
	return args, nil
}

// commandStdin is what the program reads. A line break inside a value would
// end the line the program reads early, so such a value is refused.
func commandStdin(template string, values map[string]string) (string, error) {
	if template == "" {
		template = defaultStdin
	}
	var pairs []string
	for _, p := range allPlaceholders {
		if !strings.Contains(template, p) {
			continue
		}
		if strings.ContainsAny(values[p], "\r\n\x00") {
			return "", fmt.Errorf("%s holds a line break or NUL, which stdin cannot carry", p)
		}
		pairs = append(pairs, p, values[p])
	}
	return strings.NewReplacer(pairs...).Replace(template), nil
}

// cappedBuffer keeps the first stderrLimit bytes written to it and accepts the
// rest unkept, so a program is never stopped for writing too much.
type cappedBuffer struct {
	// Do not embed Buffer: its ReadFrom would let io.Copy bypass Write's cap.
	buffer    bytes.Buffer
	truncated bool
}

func (b *cappedBuffer) Write(p []byte) (int, error) {
	kept := min(len(p), stderrLimit-b.buffer.Len())
	b.buffer.Write(p[:kept])
	b.truncated = b.truncated || kept < len(p)
	return len(p), nil
}

// redacted matches against the original bytes, merging overlapping password
// occurrences so neither a shorter password nor a replacement can hide a
// longer match. If the cap cut a password short, mask its retained prefix too.
func (b *cappedBuffer) redacted(passwords ...string) string {
	output := b.buffer.String()
	var masked strings.Builder
	end := 0
	for i := 0; i < len(output); i++ {
		nextEnd := i
		for _, password := range passwords {
			if password == "" {
				continue
			}
			if strings.HasPrefix(output[i:], password) {
				nextEnd = max(nextEnd, i+len(password))
			} else if b.truncated && strings.HasPrefix(password, output[i:]) {
				nextEnd = len(output)
			}
		}
		if nextEnd > i && i >= end {
			masked.WriteString("[password]")
		}
		end = max(end, nextEnd)
		if i >= end {
			masked.WriteByte(output[i])
		}
	}
	return masked.String()
}
