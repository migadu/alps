package alps

import (
	"github.com/migadu/alps/provider"
	"testing"
)

func TestExplicitlyDisabledPluginStaysOffWithoutAllowList(t *testing.T) {
	old := pluginLoaders
	t.Cleanup(func() { pluginLoaders = old })
	base, gpg := GoPlugin{Name: "base"}, GoPlugin{Name: "gpg"}
	pluginLoaders = []PluginLoaderFunc{base.Loader(), gpg.Loader()}
	s, err := New(&NilLogger{}, &Options{Provider: &provider.MockOptions{}, SMTP: SMTPOptions{Server: "smtps://example.com"}, Plugins: map[string]PluginConfig{"gpg": {Enabled: false}, "base": {Enabled: false}}})
	if err != nil {
		t.Fatal(err)
	}
	defer s.Close()
	names := s.LoadedPluginNames()
	if len(names) != 1 || names[0] != "base" {
		t.Fatalf("loaded %v, want only required base", names)
	}
}
