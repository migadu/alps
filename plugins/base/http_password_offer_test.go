package alpsbase

import (
	"net/http"
	"testing"

	"github.com/migadu/alps"
	_ "github.com/migadu/alps/plugins/password"
)

// /session offers the Password page exactly where a change can run, which is
// where [plugin.password] has enabled = true. Without it the page is not
// offered and its route is not there, rather than offered and refusing every
// change as temporarily unavailable.
func TestHTTP_SessionOffersPasswordOnlyWhereAChangeCanRun(t *testing.T) {
	endpoint := map[string]interface{}{"endpoint": "https://admin.example/api"}
	cases := []struct {
		name    string
		plugins map[string]alps.PluginConfig
		want    bool
	}{
		{"no plugin sections", nil, false},
		{"enabled without a backend", map[string]alps.PluginConfig{"password": {Enabled: true}}, false},
		{"a block not enabled", map[string]alps.PluginConfig{"password": {Options: endpoint}}, false},
		{"an enabled block", map[string]alps.PluginConfig{"password": {Enabled: true, Options: endpoint}}, true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
				o.Plugins = c.plugins
			})
			s.login()

			var info struct {
				EnabledPlugins        []string
				PasswordChangeEnabled bool
			}
			r := s.do("GET", "/session", nil)
			s.expect(r, http.StatusOK)
			r.json(t, &info)
			if got := contains(info.EnabledPlugins, "password"); got != c.want {
				t.Errorf("password among %v: %v, want %v", info.EnabledPlugins, got, c.want)
			}
			if info.PasswordChangeEnabled != c.want {
				t.Errorf("PasswordChangeEnabled = %v, want %v", info.PasswordChangeEnabled, c.want)
			}

			// Where it is offered, a change reaches the check of the current
			// password. Elsewhere there is no route to reach.
			change := s.do("POST", "/password/change", map[string]string{"old_password": "wrong", "password": "new horse"})
			if c.want {
				var refusal struct{ Code string }
				change.json(t, &refusal)
				if change.status != http.StatusForbidden || refusal.Code != "current_password_incorrect" {
					t.Errorf("change answered %d %s, want the current password checked", change.status, change.body)
				}
			} else if change.status != http.StatusNotFound && change.status != http.StatusMethodNotAllowed {
				t.Errorf("change answered %d %s, want no route", change.status, change.body)
			}
		})
	}
}
