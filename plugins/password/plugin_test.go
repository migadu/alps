package password

import (
	"testing"

	"github.com/migadu/alps"
)

// The plugin loads only where a change can run. The handler refuses every
// change unless [plugin.password] is there with enabled = true, so anywhere
// else /session would offer a Settings page whose every change fails.
func TestLoadNeedsAnEnabledPasswordBlock(t *testing.T) {
	endpoint := map[string]interface{}{"endpoint": "https://admin.example/api"}
	cases := []struct {
		name    string
		options *alps.Options
		want    bool
	}{
		{"no options", nil, false},
		{"no plugin sections", &alps.Options{}, false},
		{"other sections only", &alps.Options{Plugins: map[string]alps.PluginConfig{
			"base": {Enabled: true},
		}}, false},
		{"a block not enabled", &alps.Options{Plugins: map[string]alps.PluginConfig{
			"password": {Options: endpoint},
		}}, false},
		{"an enabled block", &alps.Options{Plugins: map[string]alps.PluginConfig{
			"password": {Enabled: true, Options: endpoint},
		}}, true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			plugins, err := load(&alps.Server{Options: c.options})
			if err != nil {
				t.Fatal(err)
			}
			loaded := len(plugins) == 1 && plugins[0].Name() == "password"
			if loaded != c.want || (!c.want && len(plugins) != 0) {
				t.Errorf("got %d plugin(s), want the password plugin loaded: %v", len(plugins), c.want)
			}
		})
	}
}
