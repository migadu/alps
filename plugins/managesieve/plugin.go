package managesieve

import (
	"github.com/migadu/alps/internal/serviceurl"
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
	u, insecure, err := serviceurl.ParseSieve(raw)
	return sieveEndpoint{url: u, insecure: insecure}, err
}

// endpointFor resolves the ManageSieve target for a session. A provider that
// routes per domain answers here, so filters live with the mailbox they act
// on; otherwise the globally configured server stands.
//
// The insecure flag travels with the endpoint: a per-domain server must not
// inherit permission to send credentials in the clear from an unrelated one.
func (p *plugin) endpointFor(username string) sieveEndpoint {
	fallback := sieveEndpoint{url: p.url, insecure: p.insecure}
	if username == "" || p.srv == nil {
		return fallback
	}
	raw := p.srv.ServiceURLFor(provider.ServiceManageSieve, username)
	if raw == "" {
		return fallback
	}
	if cached, ok := p.urlCache.Load(raw); ok {
		return cached.(sieveEndpoint)
	}
	ep, err := parseSieveURL(raw)
	if err != nil {
		cached, loaded := p.urlCache.LoadOrStore(raw, fallback)
		if !loaded {
			p.srv.Logger().Printf("managesieve: provider named an unusable server %q for %s: %v (using the configured one)", raw, username, err)
		}
		return cached.(sieveEndpoint)
	}
	p.urlCache.Store(raw, ep)
	return ep
}

func newPlugin(srv *alps.Server) (alps.Plugin, error) {
	if !srv.PluginEnabled("managesieve") {
		return nil, nil
	}
	cfg := srv.Options.Plugins["managesieve"]
	if cfg.Server == "" && !srv.HasServiceRouting(provider.ServiceManageSieve) {
		// No login has an endpoint; do not advertise unusable filter settings.
		if cfg.Enabled {
			srv.Logger().Printf("ManageSieve enabled without a server or routed endpoint; plugin disabled")
		}
		return nil, nil
	}
	var u *url.URL
	var insecure bool
	if cfg.Server != "" {
		ep, err := parseSieveURL(cfg.Server)
		if err != nil {
			return nil, err
		}
		u, insecure = ep.url, ep.insecure

		srv.Logger().Printf("Configured ManageSieve server: %v", u)
	}

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
