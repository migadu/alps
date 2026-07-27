package managesieve

import (
	"fmt"
	"net/url"

	"github.com/migadu/alps"
)

type plugin struct {
	alps.GoPlugin
	url *url.URL
	// insecure allows sending credentials over an unencrypted connection when
	// the server does not offer STARTTLS. Only enabled by the explicit
	// managesieve+insecure:// scheme; otherwise TLS is required.
	insecure bool
}

func newPlugin(srv *alps.Server) (alps.Plugin, error) {
	cfg := srv.Options.Plugins["managesieve"]
	if cfg.Server == "" {
		// No server configured, disable plugin
		return nil, nil
	}
	u, err := alps.ParseServerURL(cfg.Server)
	if err != nil {
		return nil, fmt.Errorf("failed to parse ManageSieve server: %v", err)
	}

	insecure := false
	switch u.Scheme {
	case "managesieves", "managesieve", "sieve", "":
		// TLS required (STARTTLS must succeed before authenticating).
	case "managesieve+insecure", "sieve+insecure":
		insecure = true
	default:
		return nil, fmt.Errorf("unknown scheme for ManageSieve server: %q (use managesieves://, managesieve://, or managesieve+insecure://)", u.Scheme)
	}

	srv.Logger().Printf("Configured ManageSieve server: %v", u)

	p := &plugin{
		GoPlugin: alps.GoPlugin{Name: "managesieve"},
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
