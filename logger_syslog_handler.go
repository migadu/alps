package alps

import (
	"context"
	"log/slog"
	"strings"
	"sync"
)

type syslogSeverityWriter interface {
	Debug(string) error
	Info(string) error
	Warning(string) error
	Err(string) error
}

// All handler clones share this lock so a record's formatted write uses its
// own priority even when WithAttrs/WithGroup log concurrently.
type syslogHandlerState struct {
	mu    sync.Mutex
	level slog.Level
	sink  syslogSeverityWriter
}

func (s *syslogHandlerState) Write(p []byte) (int, error) {
	message := strings.TrimSuffix(string(p), "\n")
	var err error
	switch {
	case s.level >= slog.LevelError:
		err = s.sink.Err(message)
	case s.level >= slog.LevelWarn:
		err = s.sink.Warning(message)
	case s.level >= slog.LevelInfo:
		err = s.sink.Info(message)
	default:
		err = s.sink.Debug(message)
	}
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

type syslogHandler struct {
	slog.Handler
	state *syslogHandlerState
}

func (h *syslogHandler) Handle(ctx context.Context, record slog.Record) error {
	h.state.mu.Lock()
	defer h.state.mu.Unlock()
	h.state.level = record.Level
	return h.Handler.Handle(ctx, record)
}
func (h *syslogHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &syslogHandler{Handler: h.Handler.WithAttrs(attrs), state: h.state}
}
func (h *syslogHandler) WithGroup(name string) slog.Handler {
	return &syslogHandler{Handler: h.Handler.WithGroup(name), state: h.state}
}
