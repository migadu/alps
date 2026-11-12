// Package debuglog routes protocol traces through the configured structured logger.
package debuglog

import (
	"io"
	"log/slog"
	"regexp"
)

// Headers may contain credentials in requests or in server responses.
var privateHTTPHeader = regexp.MustCompile(`(?mi)^(Authorization|Proxy-Authorization|Cookie|Set-Cookie): .*`)

type writer struct {
	logger   *slog.Logger
	protocol string
	http     bool
}

// NewWriter returns an io.Writer that emits each write at debug level. A logger
// retains its handler, including file rotation and format, for all later writes.
func NewWriter(logger *slog.Logger, protocol string) io.Writer {
	if logger == nil {
		logger = slog.Default()
	}
	return &writer{logger: logger, protocol: protocol}
}

// NewHTTPWriter also removes credential-bearing HTTP headers from wire dumps.
func NewHTTPWriter(logger *slog.Logger, protocol string) io.Writer {
	w := NewWriter(logger, protocol).(*writer)
	w.http = true
	return w
}

func (w *writer) Write(p []byte) (int, error) {
	data := p
	if w.http {
		data = privateHTTPHeader.ReplaceAll(p, []byte("${1}: [REDACTED]\r"))
	}
	w.logger.Debug("protocol trace", "protocol", w.protocol, "data", string(data))
	return len(p), nil
}
