package alps

import (
	"errors"
	"github.com/migadu/alps/provider"
	"testing"
)

type closingPlugin struct {
	name   string
	closes int
	fail   bool
}

func (p *closingPlugin) Name() string     { return p.name }
func (p *closingPlugin) SetRoutes(*Group) {}
func (p *closingPlugin) Close() error {
	p.closes++
	if p.fail {
		return errors.New("close failure")
	}
	return nil
}

func TestServerClosesLoadedAndDiscardedPlugins(t *testing.T) {
	old := pluginLoaders
	t.Cleanup(func() { pluginLoaders = old })
	kept := &closingPlugin{name: "base", fail: true}
	other := &closingPlugin{name: "other"}
	dropped := &closingPlugin{name: "dropped"}
	pluginLoaders = []PluginLoaderFunc{func(*Server) ([]Plugin, error) { return []Plugin{kept, other, dropped}, nil }}
	s, err := New(&NilLogger{}, &Options{Provider: &provider.MockOptions{}, SMTP: SMTPOptions{Server: "smtps://example.com"}, EnabledPlugins: []string{"base", "other"}})
	if err != nil {
		t.Fatal(err)
	}
	if dropped.closes != 1 {
		t.Errorf("discarded plugin closed %d times", dropped.closes)
	}
	s.Close()
	s.Close()
	if kept.closes != 1 || other.closes != 1 {
		t.Errorf("loaded plugins closed %d and %d times, want once each even after an error", kept.closes, other.closes)
	}
}
