package password

import (
	"os"
	"testing"

	"github.com/BurntSushi/toml"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	_ "github.com/migadu/alps/provider/multi"
)

func passwordRoutingOptions(t *testing.T, data string) provider.Options {
	t.Helper()
	var raw toml.Primitive
	meta, err := toml.Decode(data, &raw)
	if err != nil {
		t.Fatal(err)
	}
	config, err := provider.LoadConfig("multi", &meta, &raw)
	if err != nil {
		t.Fatal(err)
	}
	options, err := config.ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	return options
}

func TestEnabledPasswordPluginNeedsAConfiguredBackend(t *testing.T) {
	emptyMulti := passwordRoutingOptions(t, `[domains."example.test"]
type = "imap"
server = "imaps://imap.example.test"
`)
	unrelatedMulti := passwordRoutingOptions(t, `[domains."example.test"]
type = "imap"
server = "imaps://imap.example.test"
caldav = "https://calendar.example.test"
`)
	for _, tc := range []struct {
		name    string
		options map[string]interface{}
		router  provider.Options
	}{
		{name: "no options"},
		{name: "empty options", options: map[string]interface{}{}},
		{name: "only HTTP metadata", options: map[string]interface{}{"method": "POST", "auth_type": "basic"}},
		{name: "whitespace endpoint", options: map[string]interface{}{"endpoint": "  "}},
		{name: "multi without services", router: emptyMulti},
		{name: "multi with unrelated service", router: unrelatedMulti},
	} {
		t.Run(tc.name, func(t *testing.T) {
			s := &alps.Server{Options: &alps.Options{Provider: tc.router, Plugins: map[string]alps.PluginConfig{"password": {Enabled: true, Options: tc.options}}}}
			loaded, err := load(s)
			if err != nil {
				t.Fatal(err)
			}
			if len(loaded) != 0 {
				t.Fatalf("password plugin loaded with no HTTP endpoint, command or routed backend: %d plugins", len(loaded))
			}
		})
	}
}

func TestPasswordPluginKeepsConfiguredGlobalAndRoutedBackends(t *testing.T) {
	for _, section := range []string{`[domains."example.test"]`, `[default]`, `[[routes]]
domains = ["example.test"]`} {
		t.Run(section, func(t *testing.T) {
			routed := passwordRoutingOptions(t, section+`
type = "imap"
server = "imaps://imap.example.test"
password = {endpoint="https://password.example.test"}
`)
			s := &alps.Server{Options: &alps.Options{Provider: routed, Plugins: map[string]alps.PluginConfig{"password": {Enabled: true}}}}
			loaded, err := load(s)
			if err != nil || len(loaded) != 1 {
				t.Fatalf("configured routed backend was disabled: loaded=%d err=%v", len(loaded), err)
			}
			if got := s.ServiceOptionsFor(provider.ServicePassword, "ada@example.test"); got["endpoint"] != "https://password.example.test" {
				t.Fatalf("routed configuration lost: %v", got)
			}
		})
	}
	globals := []map[string]interface{}{{"endpoint": "https://password.example.test"}}
	if commandSupported {
		program, err := os.Executable()
		if err != nil {
			t.Fatal(err)
		}
		globals = append(globals, map[string]interface{}{"command": []string{program}})
	}
	for _, options := range globals {
		s := &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{"password": {Enabled: true, Options: options}}}}
		loaded, err := load(s)
		if err != nil || len(loaded) != 1 {
			t.Fatalf("configured global backend was disabled: options=%v loaded=%d err=%v", options, len(loaded), err)
		}
	}
}
