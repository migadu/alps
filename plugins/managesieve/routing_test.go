package managesieve

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

func TestEndpointForFollowsTheLogin(t *testing.T) {
	global, _ := url.Parse("managesieves://global.example:4190")
	p := &plugin{url: global, srv: stubServer(routerStub{
		service: provider.ServiceManageSieve,
		user:    "routed@example.com",
		url:     "managesieves://sieve.routed.example:4190",
	})}

	if got := p.endpointFor("routed@example.com"); got.url == nil || got.url.Host != "sieve.routed.example:4190" {
		t.Errorf("the routed login reached %v, want sieve.routed.example:4190", got.url)
	}
	if got := p.endpointFor("other@example.com"); got.url != global {
		t.Errorf("an unrouted login reached %v, want the configured %v", got.url, global)
	}
	if got := p.endpointFor(""); got.url != global {
		t.Errorf("an empty login reached %v, want the configured %v", got.url, global)
	}
}

// The insecure flag belongs to the endpoint that carries it. A per-domain
// server must not inherit permission to send credentials in the clear from a
// globally configured managesieve+insecure://, and must not hand its own
// permission to anyone else.
func TestEndpointForDoesNotShareTheInsecureFlag(t *testing.T) {
	lax, _ := url.Parse("managesieve+insecure://lax.example:4190")
	p := &plugin{url: lax, insecure: true, srv: stubServer(routerStub{
		service: provider.ServiceManageSieve,
		user:    "strict@example.com",
		url:     "managesieves://strict.example:4190",
	})}
	if got := p.endpointFor("strict@example.com"); got.insecure {
		t.Error("a routed TLS endpoint inherited the global insecure flag")
	}
	if got := p.endpointFor("other@example.com"); !got.insecure {
		t.Error("the configured endpoint lost its own insecure flag")
	}

	strict, _ := url.Parse("managesieves://strict.example:4190")
	q := &plugin{url: strict, srv: stubServer(routerStub{
		service: provider.ServiceManageSieve,
		user:    "lax@example.com",
		url:     "managesieve+insecure://lax.example:4190",
	})}
	if got := q.endpointFor("lax@example.com"); !got.insecure {
		t.Error("a routed insecure endpoint did not carry its own flag")
	}
	if got := q.endpointFor("other@example.com"); got.insecure {
		t.Error("one domain's insecure endpoint leaked its flag to another login")
	}
}

func TestEndpointForKeepsGoingWhenTheProviderNamesNonsense(t *testing.T) {
	global, _ := url.Parse("managesieves://global.example:4190")
	p := &plugin{url: global, srv: stubServer(routerStub{
		service: provider.ServiceManageSieve, user: "broken@example.com", url: "wat://nope",
	})}
	if got := p.endpointFor("broken@example.com"); got.url != global {
		t.Errorf("an unusable endpoint yielded %v, want the configured %v", got.url, global)
	}
}

func TestEndpointForIPv6(t *testing.T) {
	global, _ := url.Parse("managesieves://global.example:4190")
	ipv6URL := "managesieves://[2001:db8::1]:4190"
	p := &plugin{url: global, srv: stubServer(routerStub{
		service: provider.ServiceManageSieve, user: "ipv6@example.com", url: ipv6URL,
	})}
	ep := p.endpointFor("ipv6@example.com")
	if ep.url == nil || ep.url.String() != ipv6URL {
		t.Fatalf("expected %s, got %v", ipv6URL, ep.url)
	}
	if ep.url.Hostname() != "2001:db8::1" {
		t.Errorf("hostname was truncated, got %q, want %q", ep.url.Hostname(), "2001:db8::1")
	}
}

func TestEndpointForWithoutGlobalServer(t *testing.T) {
	srv := stubServer(routerStub{
		service: provider.ServiceManageSieve, user: "routed@example.com", url: "managesieves://sieve.routed.example:4190",
	})
	p := &plugin{url: nil, srv: srv}
	ep := p.endpointFor("routed@example.com")
	if ep.url == nil || ep.url.String() != "managesieves://sieve.routed.example:4190" {
		t.Errorf("got %v, want managesieves://sieve.routed.example:4190", ep.url)
	}
	unrouted := p.endpointFor("other@example.com")
	if unrouted.url != nil {
		t.Errorf("unrouted user should get nil URL, got %v", unrouted.url)
	}
}

func TestNewPluginWithoutGlobalServer(t *testing.T) {
	srv := stubServer(routerStub{
		service: provider.ServiceManageSieve, user: "routed@example.com", url: "managesieves://sieve.routed.example:4190",
	})
	srv.Options.Plugins = map[string]alps.PluginConfig{"managesieve": {}}
	pl, err := newPlugin(srv)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if pl == nil {
		t.Fatal("plugin should be initialized when provider routes ManageSieve")
	}

	// When neither server nor routing exists, it stays disabled.
	bareSrv := &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{"managesieve": {}}}}
	disabled, err := newPlugin(bareSrv)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if disabled != nil {
		t.Fatal("plugin should be disabled when unconfigured and unrouted")
	}
}
