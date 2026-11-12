package alpscarddav

import (
	"net/url"
	"strings"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// Every accepted form of a CardDAV server ends up as an http or https URL.
func TestParseCardDAVURLMapsTheSchemes(t *testing.T) {
	for raw, want := range map[string]string{
		"https://dav.example.com/dav/":      "https://dav.example.com/dav/",
		"carddavs://dav.example.com:8443":   "https://dav.example.com:8443",
		"carddav+insecure://localhost:5232": "http://localhost:5232",
		"http+insecure://127.0.0.1:5232":    "http://127.0.0.1:5232",
		"http://localhost:5232":             "http://localhost:5232",
	} {
		u, err := parseCardDAVURL(raw)
		if err != nil {
			t.Errorf("%q was refused: %v", raw, err)
			continue
		}
		if u.String() != want {
			t.Errorf("%q became %v, want %s", raw, u, want)
		}
	}
}

// A server no request could reach is refused, and the error names the forms
// that work. Written without a scheme, a host and port parse with the host as
// the scheme; a CalDAV scheme, or any other, means nothing to CardDAV.
func TestParseCardDAVURLRefusesWhatNoRequestCanUse(t *testing.T) {
	for _, raw := range []string{
		"dav.example.com:8443",
		"localhost:5232",
		"caldavs://dav.example.com",
		"caldav+insecure://localhost:5232",
		"ldap://dav.example.com",
	} {
		u, err := parseCardDAVURL(raw)
		if err == nil {
			t.Errorf("%q was accepted as %v", raw, u)
			continue
		}
		if !strings.Contains(err.Error(), "carddavs://") {
			t.Errorf("refusing %q does not name the accepted forms: %v", raw, err)
		}
	}
	// An IP address and port does not parse at all, and stays refused.
	if u, err := parseCardDAVURL("127.0.0.1:5232"); err == nil {
		t.Errorf("127.0.0.1:5232 was accepted as %v", u)
	}
}

// Start-up stops on a server no request could reach, instead of loading a
// plugin whose every request fails.
func TestNewPluginRefusesAnUnusableServer(t *testing.T) {
	for _, raw := range []string{"localhost:5232", "caldavs://dav.example.com"} {
		srv := &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{
			"carddav": {Enabled: true, Server: raw},
		}}}
		if p, err := newPlugin(srv); err == nil {
			t.Errorf("server %q loaded the plugin (%v) instead of stopping start-up", raw, p)
		}
	}
}

// A per-domain server written as host:port gives way to the configured one,
// as a value that does not parse already does.
func TestURLForFallsBackFromAHostAndPort(t *testing.T) {
	global, _ := url.Parse("https://global.example")
	p := &plugin{url: global, srv: stubServer(routerStub{
		service: provider.ServiceCardDAV, user: "routed@example.com", url: "dav.routed.example:8443",
	})}
	if got := p.urlFor("routed@example.com"); got != global {
		t.Errorf("a host:port endpoint yielded %v, want the configured %v", got, global)
	}
}
