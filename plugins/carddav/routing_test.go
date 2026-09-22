package alpscarddav

import (
	"net/url"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// routerStub is a provider that routes one login somewhere of its own and has
// no opinion about any other.
type routerStub struct {
	service string
	user    string
	url     string
}

func (routerStub) Type() string { return "stub" }
func (routerStub) CreateFactory(time.Duration, bool) provider.AuthenticatedProviderFactory {
	return nil
}
func (r routerStub) ServiceURL(service, username string) string {
	if service == r.service && username == r.user {
		return r.url
	}
	return ""
}
func (routerStub) ServiceOptions(string, string) map[string]interface{} { return nil }

func stubServer(r provider.Options) *alps.Server {
	return &alps.Server{Options: &alps.Options{Provider: r}}
}

// The endpoint a request uses must come from the login, not from start-up.
func TestURLForFollowsTheLogin(t *testing.T) {
	global, _ := url.Parse("https://global.example")
	routed := "https://dav.routed.example"
	p := &plugin{url: global, srv: stubServer(routerStub{
		service: provider.ServiceCardDAV, user: "routed@example.com", url: routed,
	})}

	if got := p.urlFor("routed@example.com"); got == nil || got.String() != routed {
		t.Errorf("the routed login reached %v, want %s", got, routed)
	}
	// A login the provider has no opinion about keeps the configured server.
	if got := p.urlFor("other@example.com"); got == nil || got.String() != global.String() {
		t.Errorf("an unrouted login reached %v, want the configured %v", got, global)
	}
	// No username, and no provider at all, both fall back rather than panic.
	if got := p.urlFor(""); got != global {
		t.Errorf("an empty login reached %v, want the configured %v", got, global)
	}
	bare := &plugin{url: global}
	if got := bare.urlFor("routed@example.com"); got != global {
		t.Errorf("a plugin with no server reached %v, want the configured %v", got, global)
	}
}

// A provider naming something unparseable must not take the request down with
// it; the configured server stands and the reason is logged.
func TestURLForKeepsGoingWhenTheProviderNamesNonsense(t *testing.T) {
	global, _ := url.Parse("https://global.example")
	p := &plugin{url: global, srv: stubServer(routerStub{
		service: provider.ServiceCardDAV, user: "broken@example.com", url: "://not a url",
	})}
	if got := p.urlFor("broken@example.com"); got != global {
		t.Errorf("an unusable endpoint yielded %v, want the configured %v", got, global)
	}
}

// Resolution is cached per endpoint, and the cache must not confuse two logins.
func TestURLForCachesWithoutCrossingLogins(t *testing.T) {
	global, _ := url.Parse("https://global.example")
	p := &plugin{url: global, srv: stubServer(routerStub{
		service: provider.ServiceCardDAV, user: "routed@example.com", url: "https://dav.routed.example",
	})}
	for i := 0; i < 3; i++ {
		if got := p.urlFor("routed@example.com"); got.String() != "https://dav.routed.example" {
			t.Fatalf("call %d reached %v", i, got)
		}
		if got := p.urlFor("other@example.com"); got.String() != global.String() {
			t.Fatalf("call %d leaked the routed endpoint to another login: %v", i, got)
		}
	}
}

func TestURLForWithoutGlobalServer(t *testing.T) {
	srv := stubServer(routerStub{
		service: provider.ServiceCardDAV, user: "routed@example.com", url: "https://dav.routed.example",
	})
	p := &plugin{url: nil, srv: srv}
	if got := p.urlFor("routed@example.com"); got == nil || got.String() != "https://dav.routed.example" {
		t.Errorf("got %v, want https://dav.routed.example", got)
	}
	if got := p.urlFor("other@example.com"); got != nil {
		t.Errorf("unrouted user should get nil URL, got %v", got)
	}
}

func TestNewPluginWithoutGlobalServer(t *testing.T) {
	srv := stubServer(routerStub{
		service: provider.ServiceCardDAV, user: "routed@example.com", url: "https://dav.routed.example",
	})
	srv.Options.Plugins = map[string]alps.PluginConfig{"carddav": {}}
	pl, err := newPlugin(srv)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if pl == nil {
		t.Fatal("plugin should be initialized when provider routes CardDAV")
	}

	// When neither server nor routing exists, it stays disabled.
	bareSrv := &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{"carddav": {}}}}
	disabled, err := newPlugin(bareSrv)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if disabled != nil {
		t.Fatal("plugin should be disabled when unconfigured and unrouted")
	}
}
