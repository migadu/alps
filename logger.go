package alps

import (
	"fmt"
	"io"
	"log/slog"
	"log/syslog"
	"os"
	"strings"
)

// Logger is a simple logging interface.
type Logger interface {
	Print(i ...interface{})
	Printf(format string, args ...interface{})
	Debug(i ...interface{})
	Debugf(format string, args ...interface{})
	Info(i ...interface{})
	Infof(format string, args ...interface{})
	Error(i ...interface{})
	Errorf(format string, args ...interface{})
	Warn(i ...interface{})
	Warnf(format string, args ...interface{})
	Fatal(i ...interface{})
	Fatalf(format string, args ...interface{})
	SetLevel(level slog.Level)
}

type logger struct {
	slog   *slog.Logger
	level  *slog.LevelVar
	closer io.Closer // for file handles
}

// LoggerOptions configures logger creation.
type LoggerOptions struct {
	Output string // "stderr", "stdout", "syslog", or file path
	Format string // "json" or "console"
	Level  string // "debug", "info", "warn", "error"
}

// NewLogger creates a new logger using slog.
func NewLogger() Logger {
	return NewLoggerWithOptions(LoggerOptions{
		Output: "stdout",
		Format: "json",
		Level:  "info",
	})
}

// NewDevelopmentLogger creates a logger for development.
func NewDevelopmentLogger() Logger {
	return NewLoggerWithOptions(LoggerOptions{
		Output: "stdout",
		Format: "console",
		Level:  "debug",
	})
}

// NewLoggerWithOptions creates a logger with custom options.
func NewLoggerWithOptions(opts LoggerOptions) Logger {
	level := &slog.LevelVar{}
	level.Set(parseLevel(opts.Level))

	var writer io.Writer
	var closer io.Closer

	// Determine output destination
	switch opts.Output {
	case "", "stdout":
		writer = os.Stdout
	case "stderr":
		writer = os.Stderr
	case "syslog":
		// Use syslog for output
		syslogWriter, err := syslog.New(syslog.LOG_INFO|syslog.LOG_DAEMON, "alps")
		if err != nil {
			// Fallback to stderr if syslog fails
			fmt.Fprintf(os.Stderr, "Failed to connect to syslog: %v, falling back to stderr\n", err)
			writer = os.Stderr
		} else {
			writer = syslogWriter
			closer = syslogWriter
		}
	default:
		// Assume it's a file path
		file, err := os.OpenFile(opts.Output, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Failed to open log file %s: %v, falling back to stderr\n", opts.Output, err)
			writer = os.Stderr
		} else {
			writer = file
			closer = file
		}
	}

	// Determine handler format
	var handler slog.Handler
	if opts.Format == "json" {
		handler = slog.NewJSONHandler(writer, &slog.HandlerOptions{
			Level: level,
		})
	} else {
		handler = slog.NewTextHandler(writer, &slog.HandlerOptions{
			Level: level,
		})
	}

	return &logger{
		slog:   slog.New(handler),
		level:  level,
		closer: closer,
	}
}

// parseLevel converts string level to slog.Level
func parseLevel(level string) slog.Level {
	switch strings.ToLower(level) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func (l *logger) SetLevel(level slog.Level) {
	l.level.Set(level)
}

func (l *logger) Print(i ...interface{}) {
	l.slog.Info(fmt.Sprint(i...))
}

func (l *logger) Printf(format string, args ...interface{}) {
	l.slog.Info(fmt.Sprintf(format, args...))
}

func (l *logger) Debug(i ...interface{}) {
	l.slog.Debug(fmt.Sprint(i...))
}

func (l *logger) Debugf(format string, args ...interface{}) {
	l.slog.Debug(fmt.Sprintf(format, args...))
}

func (l *logger) Info(i ...interface{}) {
	l.slog.Info(fmt.Sprint(i...))
}

func (l *logger) Infof(format string, args ...interface{}) {
	l.slog.Info(fmt.Sprintf(format, args...))
}

func (l *logger) Error(i ...interface{}) {
	l.slog.Error(fmt.Sprint(i...))
}

func (l *logger) Errorf(format string, args ...interface{}) {
	l.slog.Error(fmt.Sprintf(format, args...))
}

func (l *logger) Warn(i ...interface{}) {
	l.slog.Warn(fmt.Sprint(i...))
}

func (l *logger) Warnf(format string, args ...interface{}) {
	l.slog.Warn(fmt.Sprintf(format, args...))
}

func (l *logger) Fatal(i ...interface{}) {
	l.slog.Error(fmt.Sprint(i...))
	os.Exit(1)
}

func (l *logger) Fatalf(format string, args ...interface{}) {
	l.slog.Error(fmt.Sprintf(format, args...))
	os.Exit(1)
}

// HTTPError represents an HTTP error with a status code.
type HTTPError struct {
	Code    int
	Message interface{}
}

func (e *HTTPError) Error() string {
	return fmt.Sprintf("code=%d, message=%v", e.Code, e.Message)
}

// NewHTTPError creates a new HTTPError.
func NewHTTPError(code int, message ...interface{}) *HTTPError {
	e := &HTTPError{Code: code}
	if len(message) > 0 {
		e.Message = message[0]
	}
	return e
}
