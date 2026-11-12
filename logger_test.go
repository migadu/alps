package alps

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// After newsyslog has renamed the log file, Reopen must send later lines to
// a fresh file at the configured path, not on into the rotated one.
func TestLoggerReopenFollowsRotation(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "alps.log")
	l := NewLoggerWithOptions(LoggerOptions{Output: path, Format: "console", Level: "info"})

	l.Info("before rotation")
	rotated := path + ".0"
	if err := os.Rename(path, rotated); err != nil {
		t.Fatal(err)
	}
	l.Info("lost without reopen")
	if reopened, err := l.Reopen(); err != nil || !reopened {
		t.Fatalf("reopened=%v err=%v", reopened, err)
	}
	l.Info("after reopen")

	current, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("no new log file after Reopen: %v", err)
	}
	if !strings.Contains(string(current), "after reopen") || strings.Contains(string(current), "before rotation") {
		t.Fatalf("new file has %q", current)
	}
	old, err := os.ReadFile(rotated)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(old), "before rotation") || strings.Contains(string(old), "after reopen") {
		t.Fatalf("rotated file has %q", old)
	}
}

// Reopen on stderr or stdout output has nothing to do and must not fail.
func TestLoggerReopenWithoutFile(t *testing.T) {
	for _, out := range []string{"stderr", "stdout"} {
		if reopened, err := NewLoggerWithOptions(LoggerOptions{Output: out}).Reopen(); err != nil || reopened {
			t.Errorf("%s: reopened=%v err=%v", out, reopened, err)
		}
	}
}

func TestLoggerReopenAfterFileFallbackReportsNoFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "missing-directory", "alps.log")
	if reopened, err := NewLoggerWithOptions(LoggerOptions{Output: path}).Reopen(); err != nil || reopened {
		t.Fatalf("file open fell back to stderr: reopened=%v err=%v", reopened, err)
	}
}
