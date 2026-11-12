package alps

import (
	"io"
	"log/slog"
	"strings"
	"sync"
	"testing"
)

type priorityLogEntry struct{ priority, message string }
type prioritySyslog struct {
	mu      sync.Mutex
	entries []priorityLogEntry
}

func (w *prioritySyslog) record(priority, message string) error {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.entries = append(w.entries, priorityLogEntry{priority, message})
	return nil
}
func (w *prioritySyslog) Write(p []byte) (int, error) {
	return len(p), w.record("default-info", string(p))
}
func (w *prioritySyslog) Close() error           { return nil }
func (w *prioritySyslog) Debug(s string) error   { return w.record("debug", s) }
func (w *prioritySyslog) Info(s string) error    { return w.record("info", s) }
func (w *prioritySyslog) Warning(s string) error { return w.record("warning", s) }
func (w *prioritySyslog) Err(s string) error     { return w.record("error", s) }

func TestSyslogPreservesRecordSeverityFormatAndAttributes(t *testing.T) {
	old := syslogWriterFactory
	t.Cleanup(func() { syslogWriterFactory = old })
	for _, format := range []string{"json", "console"} {
		t.Run(format, func(t *testing.T) {
			sink := &prioritySyslog{}
			syslogWriterFactory = func() (io.WriteCloser, error) { return sink, nil }
			logger := NewLoggerWithOptions(LoggerOptions{Output: "syslog", Format: format, Level: "debug"})
			logger.Debug("debug record")
			logger.Info("info record")
			logger.Warn("warning record")
			logger.Error("error record")
			logger.Slog().With("account", "ada").WithGroup("request").Warn("grouped record", "path", "/mailboxes")
			expected := []string{"debug", "info", "warning", "error", "warning"}
			if len(sink.entries) != len(expected) {
				t.Fatalf("entries=%v", sink.entries)
			}
			for i, entry := range sink.entries {
				if entry.priority != expected[i] {
					t.Errorf("record%d priority=%s want%s", i, entry.priority, expected[i])
				}
			}
			last := sink.entries[len(sink.entries)-1].message
			if !strings.Contains(last, "ada") || !strings.Contains(last, "request") || !strings.Contains(last, "/mailboxes") {
				t.Errorf("lost formatting/attributes: %s", last)
			}
			logger.SetLevel(slog.LevelError)
			logger.Warn("filtered warning")
			if len(sink.entries) != len(expected) {
				t.Fatal("syslog bypasses configured log level")
			}
			logger.SetLevel(slog.LevelDebug)
			var writers sync.WaitGroup
			for range 20 {
				writers.Add(2)
				go func() { defer writers.Done(); logger.Slog().With("worker", 1).Warn("concurrent warning") }()
				go func() { defer writers.Done(); logger.Slog().WithGroup("request").Error("concurrent error") }()
			}
			writers.Wait()
			for _, entry := range sink.entries[len(expected):] {
				if strings.Contains(entry.message, "concurrent warning") && entry.priority != "warning" || strings.Contains(entry.message, "concurrent error") && entry.priority != "error" {
					t.Errorf("concurrent priority changed: %+v", entry)
				}
			}
		})
	}
}
