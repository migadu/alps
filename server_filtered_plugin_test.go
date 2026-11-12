package alps

import (
	"errors"
	"github.com/migadu/alps/provider"
	"testing"
	"time"
)

type filteredResourceProviderOptions struct{}

func (filteredResourceProviderOptions) Type() string { return "filter-test" }
func (filteredResourceProviderOptions) CreateFactory(time.Duration, bool) provider.AuthenticatedProviderFactory {
	return func(string, string) (provider.MailProvider, error) {
		return nil, errors.New("unexpected authentication during startup")
	}
}

type filteredResourcePlugin struct {
	name   string
	closed int
	err    error
}

func (p *filteredResourcePlugin) Name() string     { return p.name }
func (p *filteredResourcePlugin) SetRoutes(*Group) {}
func (p *filteredResourcePlugin) Close() error     { p.closed++; return p.err }

func TestFilteredPluginIsReleasedBeforeStartupCompletes(t *testing.T) {
	old := pluginLoaders
	t.Cleanup(func() { pluginLoaders = old })
	base := &filteredResourcePlugin{name: "base"}
	dropped := &filteredResourcePlugin{name: "dropped", err: errors.New("cleanup failed")}
	pluginLoaders = []PluginLoaderFunc{func(*Server) ([]Plugin, error) { return []Plugin{base, dropped}, nil }}
	s, err := New(&NilLogger{}, &Options{Provider: filteredResourceProviderOptions{}, SMTP: SMTPOptions{Server: "smtps://example.com"}, EnabledPlugins: []string{"base"}})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(s.Close)
	if dropped.closed != 1 || base.closed != 0 {
		t.Errorf("after filtering, dropped closes=%d base closes=%d; want1,0", dropped.closed, base.closed)
	}
	s.Close()
	s.Close()
	if dropped.closed != 1 || base.closed != 1 {
		t.Errorf("after shutdown, dropped closes=%d base closes=%d; want1,1", dropped.closed, base.closed)
	}
}
