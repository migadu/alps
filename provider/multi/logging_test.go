package multi

import (
	"bytes"
	"errors"
	"log/slog"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
)

type loggingBackend struct {
	name   string
	logger *slog.Logger
}

func (b *loggingBackend) Type() string                  { return "logging-test" }
func (b *loggingBackend) SetLogger(logger *slog.Logger) { b.logger = logger }
func (b *loggingBackend) CreateFactory(time.Duration, bool) provider.AuthenticatedProviderFactory {
	logger := b.logger
	return func(string, string) (provider.MailProvider, error) {
		if logger != nil {
			logger.Debug(b.name)
		}
		return nil, errors.New("probe only")
	}
}

func TestLoggerReachesDomainRouteDefaultAndNestedFactories(t *testing.T) {
	domain, route, fallback := &loggingBackend{name: "domain trace"}, &loggingBackend{name: "route trace"}, &loggingBackend{name: "default trace"}
	nested := &Options{Default: fallback}
	options := &Options{Domains: map[string]provider.Options{"domain.test": domain}, Routes: []routeEntry{{domains: []string{"route.test"}, options: route}}, Default: nested}
	var output bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&output, &slog.HandlerOptions{Level: slog.LevelDebug}))
	options.SetLogger(logger)
	factory := options.CreateFactory(time.Second, true)
	for _, user := range []string{"ada@domain.test", "ada@route.test", "ada@other.test"} {
		factory(user, "unused")
	}
	for _, label := range []string{"domain trace", "route trace", "default trace"} {
		if !strings.Contains(output.String(), label) {
			t.Errorf("missing %s from configured logger: %s", label, &output)
		}
	}
}
