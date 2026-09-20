package managesieve

import (
	"fmt"
	"github.com/migadu/alps/provider"
	"net/url"
	"sync"

	"github.com/migadu/alps"
)

type plugin struct {
	alps.GoPlugin
	srv      *alps.Server
	urlCache sync.Map // raw endpoint -> sieveEndpoint
	url      *url.URL
	// insecure allows sending credentials over an unencrypted connection when
	// the server does not offer STARTTLS. Only enabled by the explicit
	// managesieve+insecure:// scheme; otherwise TLS is required.
	insecure bool
}

// sieveEndpoint is a resolved ManageSieve target: where to dial and whether
// credentials may cross an unencrypted connection.
type sieveEndpoint struct {
	url      *url.URL
	insecure bool
}

// parseSieveURL normalises a configured ManageSieve endpoint.
func parseSieveURL(raw string) (sieveEndpoint, error) {
	u, err := alps.ParseServerURL(raw)
	if err != nil {
		return sieveEndpoint{}, fmt.Errorf("failed to parse ManageSieve server: %v", err)
	}

	insecure := false
	switch u.Scheme {
	case "managesieves", "managesieve", "sieve", "":
		// TLS required (STARTTLS must succeed before authenticating).
	case "managesieve+insecure", "sieve+insecure":
		insecure = true
	default:
		return sieveEndpoint{}, fmt.Errorf("unknown scheme for ManageSieve server: %q (use managesieves://, managesieve://, or managesieve+insecure://)", u.Scheme)
	}
	return sieveEndpoint{url: u, insecure: insecure}, nil
}

// endpointFor resolves the ManageSieve target for a session. A provider that
// routes per domain answers here, so filters live with the mailbox they act
// on; otherwise the globally configured server stands.
//
// The insecure flag travels with the endpoint: a per-domain server must not
// inherit permission to send credentials in the clear from an unrelated one.
func (p *plugin) endpointFor(session *alps.Session) sieveEndpoint {
	fallback := sieveEndpoint{url: p.url, insecure: p.insecure}
	if session == nil || p.srv == nil {
		return fallback
	}
	raw := p.srv.ServiceURLFor(provider.ServiceManageSieve, session.Username())
	if raw == "" {
		return fallback
	}
	if cached, ok := p.urlCache.Load(raw); ok {
		return cached.(sieveEndpoint)
	}
	ep, err := parseSieveURL(raw)
	if err != nil {
		p.srv.Logger().Printf("managesieve: provider named an unusable server %q for %s: %v (using the configured one)", raw, session.Username(), err)
		return fallback
	}
	p.urlCache.Store(raw, ep)
	return ep
}

func newPlugin(srv *alps.Server) (alps.Plugin, error) {
	cfg := srv.Options.Plugins["managesieve"]
	if cfg.Server == "" {
		// No server configured, disable plugin
		return nil, nil
	}
	ep, err := parseSieveURL(cfg.Server)
	if err != nil {
		return nil, err
	}
	u, insecure := ep.url, ep.insecure

	srv.Logger().Printf("Configured ManageSieve server: %v", u)

	p := &plugin{
		GoPlugin: alps.GoPlugin{Name: "managesieve"},
		srv:      srv,
		url:      u,
		insecure: insecure,
	}

	p.GET("/managesieve/script", p.handleGetScript)
	p.PUT("/managesieve/script", p.handlePutScript)
	p.POST("/managesieve/validate", p.handleValidate)

	return p.Plugin(), nil
}

func init() {
	alps.RegisterPluginLoader(func(s *alps.Server) ([]alps.Plugin, error) {
		p, err := newPlugin(s)
		if err != nil {
			return nil, err
		}
		if p == nil {
			return nil, nil
		}
		return []alps.Plugin{p}, nil
	})
}
