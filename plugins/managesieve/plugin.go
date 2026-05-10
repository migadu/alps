package managesieve

import (
	"fmt"
	"net/url"

	"github.com/migadu/alps"
)

type plugin struct {
	alps.GoPlugin
	url *url.URL
}

func newPlugin(srv *alps.Server) (alps.Plugin, error) {
	u, err := srv.Upstream("managesieves", "managesieve+insecure", "managesieve", "sieve")
	if _, ok := err.(*alps.NoUpstreamError); ok {
		// No upstream configured, disable plugin
		return nil, nil
	} else if err != nil {
		return nil, fmt.Errorf("managesieve: failed to parse upstream server: %v", err)
	}

	srv.Logger().Printf("Configured upstream ManageSieve server: %v", u)

	p := &plugin{
		GoPlugin: alps.GoPlugin{Name: "managesieve"},
		url:      u,
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
