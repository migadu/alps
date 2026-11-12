package password

import (
	"github.com/migadu/alps"
	"testing"
)

func TestPasswordPluginRequiresExplicitEnablement(t *testing.T) {
	for _, tc := range []struct {
		name    string
		options *alps.Options
		want    int
	}{
		{"no options", nil, 0},
		{"no section", &alps.Options{}, 0},
		{"disabled", &alps.Options{Plugins: map[string]alps.PluginConfig{"password": {Enabled: false}}}, 0},
		{"enabled", &alps.Options{Plugins: map[string]alps.PluginConfig{"password": {Enabled: true}}}, 1},
	} {
		t.Run(tc.name, func(t *testing.T) {
			plugins, err := load(&alps.Server{Options: tc.options})
			if err != nil {
				t.Fatal(err)
			}
			if len(plugins) != tc.want {
				t.Fatalf("loaded %d password plugins, want %d", len(plugins), tc.want)
			}
		})
	}
}
