package alpscaldav

import (
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"net/url"
	"testing"
)

func TestDAVEndpointRequiresAUsableHost(t *testing.T) {
	for _, raw := range []string{"", "https:/dav.example.com", "https:dav.example.com", "https://", "https:///dav", "caldavs://", "dav.example.com/caldav", "/caldav"} {
		t.Run(raw, func(t *testing.T) {
			if u, err := parseCalDAVServer(raw); err == nil {
				t.Errorf("unusable URL %q accepted: %v", raw, u)
			}
			if raw == "" {
				return
			}
			srv := &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{"caldav": {Enabled: true, Server: raw}}}}
			if pl, err := newPlugin(srv); err == nil {
				t.Errorf("startup accepted %q: %v", raw, pl)
			}
			fallback, _ := url.Parse("https://fallback.example")
			p := &plugin{url: fallback, srv: stubServer(routerStub{service: provider.ServiceCalDAV, user: "ada@example.com", url: raw})}
			if got := p.urlFor("ada@example.com"); got != fallback {
				t.Errorf("route %q used %v instead of fallback", raw, got)
			}
		})
	}
}
