package alps_test

import (
	"github.com/migadu/alps"
	_ "github.com/migadu/alps/plugins/caldav"
	_ "github.com/migadu/alps/plugins/carddav"
	_ "github.com/migadu/alps/plugins/managesieve"
	_ "github.com/migadu/alps/plugins/password"
	"github.com/migadu/alps/provider/providertest"
	"testing"
)

func TestDisabledPluginSetupCannotPreventStartup(t *testing.T) {
	for _, name := range []string{"caldav", "carddav", "managesieve", "password"} {
		t.Run(name, func(t *testing.T) {
			s, err := alps.New(alps.NewLogger(), &alps.Options{Provider: &providertest.MockOptions{}, SMTP: alps.SMTPOptions{Server: "smtps://example.com"}, EnabledPlugins: []string{"base"}, Plugins: map[string]alps.PluginConfig{name: {Enabled: true, Server: "invalid://bad", Options: map[string]interface{}{"backend": "invalid"}}}})
			if err != nil {
				t.Fatalf("disabled %s setup stopped startup: %v", name, err)
			}
			s.Close()
		})
	}
}
