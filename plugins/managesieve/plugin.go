package alpsmanagesieve

import (
	"fmt"
	"net/url"

	"git.sr.ht/~migadu/alps"
)

type plugin struct {
	alps.GoPlugin
	host string
}

func (p *plugin) connect(session *alps.Session) (*client, error) {
	return connect(p.host, session)
}

func newPlugin(srv *alps.Server) (alps.Plugin, error) {
	u, err := srv.Upstream("sieve")
	if _, ok := err.(*alps.NoUpstreamError); ok {
		return nil, nil
	} else if err != nil {
		return nil, fmt.Errorf("managesieve: failed to parse upstream ManageSieve server: %v", err)
	}

	if u.Scheme == "" {
		s, err := discover(u.Host)
		if err != nil {
			srv.Logger().Printf("managesieve: failed to discover ManageSieve server: %v", err)
			return nil, nil
		}
		u, err = url.Parse(s)
		if err != nil {
			return nil, fmt.Errorf("managesieve: discovery returned an invalid URL: %v", err)
		}
	}

	if u.Port() == "" {
		u.Host += ":4190"
	}

	srv.Logger().Printf("Configured upstream ManageSieve server: %v", u)

	p := &plugin{
		GoPlugin: alps.GoPlugin{Name: "managesieve"},
		host:     u.Host,
	}

	registerRoutes(p)

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
		return []alps.Plugin{p}, err
	})
}
