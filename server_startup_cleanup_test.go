package alps

import (
	"errors"
	"github.com/migadu/alps/provider"
	"testing"
	"time"
)

// Startup never authenticates; this factory keeps the test independent of
// the shared provider mocks that are moving to a test-only package.
type startupResourceProviderOptions struct{}

func (startupResourceProviderOptions) CreateFactory(time.Duration, bool) provider.AuthenticatedProviderFactory {
	return func(string, string) (provider.MailProvider, error) {
		return nil, errors.New("unexpected authentication during startup")
	}
}

type startupResourcePlugin struct {
	name     string
	closes   int
	closeErr error
}

func (p *startupResourcePlugin) Name() string     { return p.name }
func (p *startupResourcePlugin) SetRoutes(*Group) {}
func (p *startupResourcePlugin) Close() error     { p.closes++; return p.closeErr }

func TestFailedStartupReleasesBackgroundWorkersAndPlugins(t *testing.T) {
	for _, failure := range []string{"loader", "branding"} {
		t.Run(failure, func(t *testing.T) {
			old := pluginLoaders
			t.Cleanup(func() { pluginLoaders = old })
			first := &startupResourcePlugin{name: "base", closeErr: errors.New("close failed")}
			second := &startupResourcePlugin{name: "second"}
			var captured *Server
			pluginLoaders = []PluginLoaderFunc{
				func(s *Server) ([]Plugin, error) { captured = s; return []Plugin{first}, nil },
				func(*Server) ([]Plugin, error) {
					if failure == "loader" {
						return []Plugin{second}, errors.New("setup failed")
					}
					return []Plugin{second}, nil
				},
			}
			opts := &Options{Provider: startupResourceProviderOptions{}, SMTP: SMTPOptions{Server: "smtps://example.com"}, RateLimitEnabled: true}
			if failure == "branding" {
				opts.Branding.LogoBuiltin = "does-not-exist"
			}
			s, err := New(&NilLogger{}, opts)
			if s != nil || err == nil {
				t.Fatalf("startup result: %v, %v", s, err)
			}
			// Ensure a failing test also releases the workers it detects.
			t.Cleanup(captured.Close)
			if first.closes != 1 || second.closes != 1 {
				t.Errorf("constructed plugins closed %d and %d times, want once each", first.closes, second.closes)
			}
			select {
			case <-captured.Scheduler.stop:
			default:
				t.Error("failed startup left scheduler running")
			}
			select {
			case <-captured.RateLimiter.cleanupDone:
			default:
				t.Error("failed startup left rate limiter running")
			}
			captured.Close()
			if first.closes != 1 || second.closes != 1 {
				t.Errorf("cleanup repeated plugin Close: %d, %d", first.closes, second.closes)
			}
		})
	}
}
