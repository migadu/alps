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
